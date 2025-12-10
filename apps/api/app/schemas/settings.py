"""Settings schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class SystemSettings(BaseModel):
    """System settings response/update schema."""

    # LLM Settings
    google_api_key: str = Field(..., description="Google Gemini API Key")
    llm_model: str = Field(..., description="Language model name")
    google_api_key: str = Field("", description="Google API Key for Gemini")
    llm_temperature: float = Field(..., ge=0.0, le=2.0, description="Model creativity (0-2)")
    llm_max_tokens: int = Field(..., ge=128, le=8192, description="Maximum response length")

    # Retrieval Settings
    confidence_threshold: float = Field(
        ..., ge=0.0, le=1.0, description="Minimum confidence to show answer (0-1)"
    )
    confidence_decay: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence decay factor (0-1)"
    )
    confidence_diversity_target: int = Field(
        ..., ge=1, le=10, description="Target number of diverse results"
    )
    top_k_retrieval: int = Field(..., ge=1, le=20, description="Number of documents to retrieve")
    max_context_chars: int = Field(..., ge=1000, le=32000, description="Maximum context length")
    max_sub_queries: int = Field(..., ge=1, le=10, description="Maximum number of sub-queries")
    top_k_per_query: int = Field(..., ge=1, le=20, description="Top K results per sub-query")

    # Hybrid Search Settings
    hybrid_enabled: bool = Field(..., description="Enable hybrid search (vector + keyword)")
    hybrid_k_vec: int = Field(..., ge=5, le=50, description="Vector search results")
    hybrid_k_lex: int = Field(..., ge=5, le=50, description="Keyword search results")
    hybrid_fusion_k: int = Field(..., ge=10, le=100, description="Fusion K for combining results")
    hybrid_max_docs: int = Field(
        ..., ge=100, le=10000, description="Maximum documents for hybrid search"
    )

    # Query Expansion Settings
    query_expansion_enabled: bool = Field(..., description="Enable query expansion")
    query_expansion_max: int = Field(..., ge=1, le=5, description="Maximum query expansions")
    query_expansion_min_words: int = Field(
        ..., ge=1, le=10, description="Minimum words to trigger expansion"
    )


class SettingsUpdateRequest(BaseModel):
    """Request to update specific settings."""

    # LLM Settings (optional)
    llm_model: str | None = Field(None, description="Language model name")
    google_api_key: str | None = Field(None, description="Google API Key for Gemini")
    llm_temperature: float | None = Field(None, ge=0.0, le=2.0)
    llm_max_tokens: int | None = Field(None, ge=128, le=8192)

    # Retrieval Settings (optional)
    confidence_threshold: float | None = Field(None, ge=0.0, le=1.0)
    confidence_decay: float | None = Field(None, ge=0.0, le=1.0)
    confidence_diversity_target: int | None = Field(None, ge=1, le=10)
    top_k_retrieval: int | None = Field(None, ge=1, le=20)
    max_context_chars: int | None = Field(None, ge=1000, le=32000)
    max_sub_queries: int | None = Field(None, ge=1, le=10)
    top_k_per_query: int | None = Field(None, ge=1, le=20)

    # Hybrid Search Settings (optional)
    hybrid_enabled: bool | None = None
    hybrid_k_vec: int | None = Field(None, ge=5, le=50)
    hybrid_k_lex: int | None = Field(None, ge=5, le=50)
    hybrid_fusion_k: int | None = Field(None, ge=10, le=100)
    hybrid_max_docs: int | None = Field(None, ge=100, le=10000)

    # Query Expansion Settings (optional)
    query_expansion_enabled: bool | None = None
    query_expansion_max: int | None = Field(None, ge=1, le=5)
    query_expansion_min_words: int | None = Field(None, ge=1, le=10)


class SettingsUpdateResponse(BaseModel):
    """Response after updating settings."""

    success: bool
    message: str
    updated_settings: SystemSettings
