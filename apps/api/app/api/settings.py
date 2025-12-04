"""Settings management endpoints."""

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import APIRouter

from ..core.config import settings
from ..schemas.settings import (
    SettingsUpdateRequest,
    SettingsUpdateResponse,
    SystemSettings,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=SystemSettings)
async def get_settings() -> SystemSettings:
    """Get current system settings."""
    return SystemSettings(
        llm_model=settings.LLM_MODEL,
        llm_temperature=settings.LLM_TEMPERATURE,
        llm_max_tokens=settings.LLM_MAX_TOKENS,
        confidence_threshold=settings.CONFIDENCE_THRESHOLD,
        top_k_retrieval=settings.TOP_K_RETRIEVAL,
        max_context_chars=settings.MAX_CONTEXT_CHARS,
        hybrid_enabled=settings.HYBRID_ENABLED,
        hybrid_k_vec=settings.HYBRID_K_VEC,
        hybrid_k_lex=settings.HYBRID_K_LEX,
    )


@router.patch("", response_model=SettingsUpdateResponse)
async def update_settings(payload: SettingsUpdateRequest) -> SettingsUpdateResponse:
    """
    Update system settings.

    Note: This updates the runtime settings only. To persist changes,
    they should be written to the .env file or environment variables.
    """
    updated_fields = []

    # Update LLM settings
    if payload.llm_temperature is not None:
        settings.LLM_TEMPERATURE = payload.llm_temperature
        updated_fields.append("llm_temperature")

    if payload.llm_max_tokens is not None:
        settings.LLM_MAX_TOKENS = payload.llm_max_tokens
        updated_fields.append("llm_max_tokens")

    # Update retrieval settings
    if payload.confidence_threshold is not None:
        settings.CONFIDENCE_THRESHOLD = payload.confidence_threshold
        updated_fields.append("confidence_threshold")

    if payload.top_k_retrieval is not None:
        settings.TOP_K_RETRIEVAL = payload.top_k_retrieval
        updated_fields.append("top_k_retrieval")

    if payload.max_context_chars is not None:
        settings.MAX_CONTEXT_CHARS = payload.max_context_chars
        updated_fields.append("max_context_chars")

    # Update hybrid search settings
    if payload.hybrid_enabled is not None:
        settings.HYBRID_ENABLED = payload.hybrid_enabled
        updated_fields.append("hybrid_enabled")

    if payload.hybrid_k_vec is not None:
        settings.HYBRID_K_VEC = payload.hybrid_k_vec
        updated_fields.append("hybrid_k_vec")

    if payload.hybrid_k_lex is not None:
        settings.HYBRID_K_LEX = payload.hybrid_k_lex
        updated_fields.append("hybrid_k_lex")

    # Try to persist to .env file
    try:
        _persist_to_env_file(payload)
    except Exception as e:
        logger.warning(f"Failed to persist settings to .env file: {e}")

    updated_settings = SystemSettings(
        llm_model=settings.LLM_MODEL,
        llm_temperature=settings.LLM_TEMPERATURE,
        llm_max_tokens=settings.LLM_MAX_TOKENS,
        confidence_threshold=settings.CONFIDENCE_THRESHOLD,
        top_k_retrieval=settings.TOP_K_RETRIEVAL,
        max_context_chars=settings.MAX_CONTEXT_CHARS,
        hybrid_enabled=settings.HYBRID_ENABLED,
        hybrid_k_vec=settings.HYBRID_K_VEC,
        hybrid_k_lex=settings.HYBRID_K_LEX,
    )

    return SettingsUpdateResponse(
        success=True,
        message=f"Updated {len(updated_fields)} setting(s): {', '.join(updated_fields)}",
        updated_settings=updated_settings,
    )


def _persist_to_env_file(payload: SettingsUpdateRequest) -> None:
    """Persist settings to .env file."""
    env_file = Path(".env")
    if not env_file.exists():
        logger.warning(".env file not found, skipping persistence")
        return

    # Read current .env content
    lines = env_file.read_text().splitlines()
    updates = {}

    if payload.llm_temperature is not None:
        updates["LLM_TEMPERATURE"] = str(payload.llm_temperature)
    if payload.llm_max_tokens is not None:
        updates["LLM_MAX_TOKENS"] = str(payload.llm_max_tokens)
    if payload.confidence_threshold is not None:
        updates["CONFIDENCE_THRESHOLD"] = str(payload.confidence_threshold)
    if payload.top_k_retrieval is not None:
        updates["TOP_K_RETRIEVAL"] = str(payload.top_k_retrieval)
    if payload.max_context_chars is not None:
        updates["MAX_CONTEXT_CHARS"] = str(payload.max_context_chars)
    if payload.hybrid_enabled is not None:
        updates["HYBRID_ENABLED"] = str(payload.hybrid_enabled).lower()
    if payload.hybrid_k_vec is not None:
        updates["HYBRID_K_VEC"] = str(payload.hybrid_k_vec)
    if payload.hybrid_k_lex is not None:
        updates["HYBRID_K_LEX"] = str(payload.hybrid_k_lex)

    # Update or append lines
    updated_lines = []
    updated_keys = set()

    for line in lines:
        if "=" in line and not line.strip().startswith("#"):
            key = line.split("=")[0].strip()
            if key in updates:
                updated_lines.append(f"{key}={updates[key]}")
                updated_keys.add(key)
            else:
                updated_lines.append(line)
        else:
            updated_lines.append(line)

    # Append new keys that weren't found
    for key, value in updates.items():
        if key not in updated_keys:
            updated_lines.append(f"{key}={value}")

    # Write back to file
    env_file.write_text("\n".join(updated_lines) + "\n")
    logger.info(f"Persisted {len(updates)} settings to .env file")
