"""
Enhanced JSON logging for RAG metrics.

Formats RAGMetrics as structured JSON for consumption by Grafana, Kibana, or other monitoring tools.
"""

import json
import logging
import sys
from datetime import datetime
from typing import Any, Dict

from app.rag.metrics import RAGMetrics


class RAGJSONFormatter(logging.Formatter):
    """
    Custom formatter that outputs RAG metrics as structured JSON.

    Usage:
        import logging
        from app.utils.logging_config import RAGJSONFormatter

        handler = logging.StreamHandler()
        handler.setFormatter(RAGJSONFormatter())
        logger = logging.getLogger("rag_metrics")
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)

        # Log metrics
        logger.info("RAG request completed", extra={
            "metrics": metrics.to_dict(),
            "request_id": "abc123"
        })
    """

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add request metadata if available
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id

        # Add RAG metrics if available
        if hasattr(record, "metrics"):
            metrics_dict = record.metrics
            if isinstance(metrics_dict, dict):
                log_data["metrics"] = metrics_dict
            elif isinstance(metrics_dict, RAGMetrics):
                log_data["metrics"] = metrics_dict.to_dict()

        # Add error information
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add extra fields
        for key, value in record.__dict__.items():
            if key not in [
                "name",
                "msg",
                "args",
                "created",
                "filename",
                "funcName",
                "levelname",
                "levelno",
                "lineno",
                "module",
                "msecs",
                "message",
                "pathname",
                "process",
                "processName",
                "relativeCreated",
                "thread",
                "threadName",
                "exc_info",
                "exc_text",
                "stack_info",
                "request_id",
                "metrics",
            ]:
                log_data[key] = value

        return json.dumps(log_data, ensure_ascii=False)


def setup_rag_metrics_logger(log_file: str = "logs/rag_metrics.json") -> logging.Logger:
    """
    Setup a dedicated logger for RAG metrics with JSON formatting.

    Args:
        log_file: Path to JSON log file

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger("rag_metrics")
    logger.setLevel(logging.INFO)
    logger.propagate = False  # Don't propagate to root logger

    # Console handler (JSON)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(RAGJSONFormatter())
    logger.addHandler(console_handler)

    # File handler (JSON)
    from pathlib import Path

    log_path = Path(log_file)
    log_path.parent.mkdir(parents=True, exist_ok=True)

    file_handler = logging.FileHandler(log_file)
    file_handler.setFormatter(RAGJSONFormatter())
    logger.addHandler(file_handler)

    return logger


# Example metrics log entries for Grafana/Kibana queries
EXAMPLE_METRICS_LOG = {
    "timestamp": "2024-01-15T10:30:45.123Z",
    "level": "INFO",
    "logger": "rag_metrics",
    "message": "RAG request completed",
    "request_id": "a1b2c3d4",
    "metrics": {
        "request_id": "a1b2c3d4",
        "query": "Học phí năm 2024",
        "answer_preview": "Học phí năm học 2024-2025 là 25 triệu đồng/năm...",
        "confidence": 0.85,
        "num_sources": 4,
        "fallback_triggered": False,
        "error_type": None,
        "stage_timings": {
            "normalization_ms": 50,
            "analysis_ms": 120,
            "retrieval_ms": 450,
            "generation_ms": 1200,
        },
        "retrieval_details": {
            "query_type": "specific",
            "top_k": 5,
            "num_retrieved": 5,
            "avg_relevance_score": 0.78,
        },
        "total_latency_ms": 1820,
    },
}
