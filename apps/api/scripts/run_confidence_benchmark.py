"""
Confidence benchmarking pipeline based on curated test cases.

Usage:
    python scripts/run_confidence_benchmark.py \
        --cases apps/api/test-case.json \
        --output /tmp/confidence_report.json
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
from dataclasses import asdict
from pathlib import Path
from typing import Any, Dict, Tuple

from app.rag.evaluation import AnswerMetrics, RAGEvaluator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Benchmark confidence calibration.")
    default_cases = Path(__file__).resolve().parents[1] / "test-case.json"
    parser.add_argument(
        "--cases",
        type=Path,
        default=default_cases,
        help="Path to JSON test cases with expected answers.",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=5,
        help="Number of contexts per question when building LLM answers.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Optional path to persist metrics as JSON.",
    )
    return parser.parse_args()


async def _run_evaluation(args: argparse.Namespace) -> Tuple[int, AnswerMetrics]:
    evaluator = RAGEvaluator()
    evaluator.load_test_cases(args.cases)

    # Retrieval metrics are not required for calibration but running a smaller
    # top-k during answer evaluation keeps latency predictable.
    metrics = await evaluator.evaluate_answers(top_k=args.top_k)
    return len(evaluator.test_cases), metrics


def _print_report(total_cases: int, metrics: AnswerMetrics) -> None:
    print("\n" + "=" * 60)
    print("CONFIDENCE BENCHMARK REPORT")
    print("=" * 60)
    print(f"Total cases:      {total_cases}")
    print(f"Avg confidence:   {metrics.avg_confidence:.3f}")
    print(f"Fallback rate:    {metrics.fallback_rate:.2%}")
    print(f"Avg latency:      {metrics.avg_latency_ms:.0f} ms")
    print(f"Avg #sources:     {metrics.avg_num_sources:.1f}")

    benchmark = metrics.confidence_benchmark
    if not benchmark:
        print("\nNo expected answers found in test cases. "
              "Add `expected_answer` to enable calibration.")
        print("=" * 60)
        return

    print("\nConfidence calibration:")
    print(f"  Accuracy:             {benchmark.accuracy:.2%}")
    print(f"  Avg conf (correct):   {benchmark.avg_confidence_correct:.3f}")
    print(f"  Avg conf (incorrect): {benchmark.avg_confidence_incorrect:.3f}")
    print(f"  Brier score:          {benchmark.brier_score:.3f}")
    print(f"  Expected cal. error:  {benchmark.expected_calibration_error:.3f}")
    print(
        f"  Recommended threshold: {benchmark.recommended_threshold:.2f} "
        f"(accuracy={benchmark.accuracy_at_threshold:.2%}, "
        f"coverage={benchmark.coverage_at_threshold:.2%})"
    )
    print("  Buckets:")
    for bucket in benchmark.buckets:
        print(
            f"    {bucket['range']:>9} | "
            f"avg_conf={bucket['avg_confidence']:.2f} "
            f"accuracy={bucket['accuracy']:.2%} "
            f"(n={bucket['count']})"
        )
    print("=" * 60)


def _maybe_write_output(
    path: Path | None, total_cases: int, metrics: AnswerMetrics
) -> None:
    if not path:
        return

    payload: Dict[str, Any] = {
        "cases": total_cases,
        "avg_confidence": metrics.avg_confidence,
        "fallback_rate": metrics.fallback_rate,
        "avg_latency_ms": metrics.avg_latency_ms,
        "avg_num_sources": metrics.avg_num_sources,
    }

    if metrics.confidence_benchmark:
        payload["confidence_benchmark"] = asdict(metrics.confidence_benchmark)

    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fp:
        json.dump(payload, fp, indent=2, ensure_ascii=False)

    logger.info("Confidence benchmark saved to %s", path)


def main() -> None:
    args = _parse_args()
    total_cases, metrics = asyncio.run(_run_evaluation(args))
    _print_report(total_cases, metrics)
    _maybe_write_output(args.output, total_cases, metrics)


if __name__ == "__main__":
    main()
