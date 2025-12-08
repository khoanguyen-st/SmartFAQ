"""Settings schemas."""

from pydantic import BaseModel, Field


class SystemSettings(BaseModel):
    """System settings response/update schema."""

    # LLM Settings
    llm_model: str = Field(..., description="Language model name")
    llm_temperature: float = Field(..., ge=0.0, le=2.0, description="Model creativity (0-2)")
    llm_max_tokens: int = Field(..., ge=128, le=8192, description="Maximum response length")

    # Retrieval Settings
    confidence_threshold: float = Field(
        ..., ge=0.0, le=1.0, description="Minimum confidence to show answer (0-1)"
    )
    top_k_retrieval: int = Field(..., ge=1, le=20, description="Number of documents to retrieve")
    max_context_chars: int = Field(..., ge=1000, le=32000, description="Maximum context length")

    # Hybrid Search Settings
    hybrid_enabled: bool = Field(..., description="Enable hybrid search (vector + keyword)")
    hybrid_k_vec: int = Field(..., ge=5, le=50, description="Vector search results")
    hybrid_k_lex: int = Field(..., ge=5, le=50, description="Keyword search results")


class SettingsUpdateRequest(BaseModel):
    """Request to update specific settings."""

    # LLM Settings (optional)
    llm_temperature: float | None = Field(None, ge=0.0, le=2.0)
    llm_max_tokens: int | None = Field(None, ge=128, le=8192)

    # Retrieval Settings (optional)
    confidence_threshold: float | None = Field(None, ge=0.0, le=1.0)
    top_k_retrieval: int | None = Field(None, ge=1, le=20)
    max_context_chars: int | None = Field(None, ge=1000, le=32000)

    # Hybrid Search Settings (optional)
    hybrid_enabled: bool | None = None
    hybrid_k_vec: int | None = Field(None, ge=5, le=50)
    hybrid_k_lex: int | None = Field(None, ge=5, le=50)


class SettingsUpdateResponse(BaseModel):
    """Response after updating settings."""

    success: bool
    message: str
    updated_settings: SystemSettings
