"""RAG metrics and error tracking for observability."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class ErrorType(Enum):
    """Categorized error types for better tracking and handling."""

    LLM_QUOTA = "llm_quota_exceeded"
    LLM_TIMEOUT = "llm_timeout"
    LLM_INVALID_RESPONSE = "llm_invalid_response"
    RETRIEVAL_FAILED = "retrieval_failed"
    RETRIEVAL_EMPTY = "retrieval_empty"
    NORMALIZATION_FAILED = "normalization_failed"
    ANALYSIS_FAILED = "analysis_failed"
    UNKNOWN = "unknown_error"


@dataclass
class RAGMetrics:
    """Metrics for tracking RAG pipeline performance."""

    request_id: str
    question: str
    language: str = "unknown"

    # Timing metrics (in milliseconds)
    total_latency_ms: int = 0
    normalization_ms: int = 0
    analysis_ms: int = 0
    retrieval_ms: int = 0
    generation_ms: int = 0

    # Quality metrics
    num_sub_queries: int = 0
    num_contexts: int = 0
    num_unique_docs: int = 0
    confidence: float = 0.0
    fallback_triggered: bool = False

    # Retrieval quality metrics
    avg_retrieval_score: float = 0.0
    max_retrieval_score: float = 0.0
    min_retrieval_score: float = 0.0
    score_variance: float = 0.0
    diversity_score: float = 0.0  # Ratio of unique docs to total contexts

    # Error tracking
    error_type: Optional[ErrorType] = None
    error_message: Optional[str] = None

    # Internal timestamps
    _start_time: float = field(default_factory=time.time)
    _stage_times: dict = field(default_factory=dict)

    def start_stage(self, stage: str) -> None:
        """Mark the start of a pipeline stage."""
        self._stage_times[stage] = time.time()

    def end_stage(self, stage: str) -> int:
        """Mark the end of a stage and return duration in ms."""
        if stage not in self._stage_times:
            return 0
        duration_ms = int((time.time() - self._stage_times[stage]) * 1000)
        return duration_ms

    def finalize(self) -> None:
        """Calculate total latency at the end."""
        self.total_latency_ms = int((time.time() - self._start_time) * 1000)

    def to_dict(self) -> dict:
        """Convert metrics to dictionary for logging."""
        return {
            "request_id": self.request_id,
            "question_preview": (
                self.question[:50] + "..." if len(self.question) > 50 else self.question
            ),
            "language": self.language,
            "total_latency_ms": self.total_latency_ms,
            "normalization_ms": self.normalization_ms,
            "analysis_ms": self.analysis_ms,
            "retrieval_ms": self.retrieval_ms,
            "generation_ms": self.generation_ms,
            "num_sub_queries": self.num_sub_queries,
            "num_contexts": self.num_contexts,
            "num_unique_docs": self.num_unique_docs,
            "confidence": round(self.confidence, 3),
            "fallback_triggered": self.fallback_triggered,
            "avg_retrieval_score": round(self.avg_retrieval_score, 3),
            "max_retrieval_score": round(self.max_retrieval_score, 3),
            "min_retrieval_score": round(self.min_retrieval_score, 3),
            "score_variance": round(self.score_variance, 3),
            "diversity_score": round(self.diversity_score, 3),
            "error_type": self.error_type.value if self.error_type else None,
            "error_message": self.error_message,
        }

    def __str__(self) -> str:
        """Human-readable metrics summary."""
        status = (
            "ERROR" if self.error_type else ("FALLBACK" if self.fallback_triggered else "SUCCESS")
        )
        return (
            f"[{self.request_id}] {status} | "
            f"Latency: {self.total_latency_ms}ms | "
            f"Confidence: {self.confidence:.2f} | "
            f"Contexts: {self.num_contexts} ({self.num_unique_docs} docs) | "
            f"Sub-queries: {self.num_sub_queries}"
        )
