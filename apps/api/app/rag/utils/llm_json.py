from __future__ import annotations

import json
import logging
import re
import time
from typing import Any, Dict, Optional

from google.api_core import exceptions as google_exceptions
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

LOGGER = logging.getLogger(__name__)


def _strip_code_fences(response: str) -> str:
    cleaned = response.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()


def _safe_json_loads(raw: str) -> Dict[str, Any]:
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        LOGGER.warning("Failed to parse JSON response directly: %s (error: %s)", raw[:200], exc)
        json_match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not json_match:
            raise
        return json.loads(json_match.group())


def invoke_json_llm(
    llm: Optional[ChatGoogleGenerativeAI],
    parser: Optional[StrOutputParser],
    *,
    system_prompt: str,
    question: str,
    logger: logging.Logger,
    log_ctx: str,
    max_retries: int = 3,
    base_delay: float = 1.0,
) -> Optional[Dict[str, Any]]:
    """Invoke an LLM chain that returns JSON, handling retries and parsing."""
    if not llm or not parser:
        return None

    prompt_template = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("human", "{question}"),
        ]
    )
    chain = prompt_template | llm | parser

    for attempt in range(max_retries):
        try:
            raw_response = chain.invoke({"question": question})
            cleaned_response = _strip_code_fences(raw_response)
            return _safe_json_loads(cleaned_response)
        except google_exceptions.ResourceExhausted as exc:
            if attempt >= max_retries - 1:
                logger.error("%s quota exhausted after %s attempts: %s", log_ctx, max_retries, exc)
                return None
            delay = base_delay * (2**attempt)
            logger.warning(
                "%s quota exhausted, retrying in %ss (attempt %s/%s)",
                log_ctx,
                delay,
                attempt + 1,
                max_retries,
            )
            time.sleep(delay)
        except Exception as exc:
            logger.error(
                "%s attempted JSON invocation failed (attempt %s/%s): %s",
                log_ctx,
                attempt + 1,
                max_retries,
                exc,
                exc_info=True,
            )
            if attempt >= max_retries - 1:
                return None
            delay = base_delay * (2**attempt)
            time.sleep(delay)

    return None
