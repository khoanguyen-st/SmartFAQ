"""RAG Evaluation Framework for measuring retrieval, answer, and confidence quality."""

from __future__ import annotations

import json
import logging
import re
from dataclasses import asdict, dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

from app.core.config import settings
from app.rag.orchestrator import RAGOrchestrator
from app.rag.retriever import Retriever

logger = logging.getLogger(__name__)


@dataclass
class EvaluationCase:
    """A single test case for RAG evaluation."""

    question: str
    relevant_doc_ids: List[str]  # Ground truth relevant document IDs
    relevant_chunk_ids: Optional[List[str]] = None  # Ground truth relevant chunk IDs
    expected_answer: Optional[str] = None  # Expected answer (for answer quality eval)
    department_id: Optional[int] = None  # Owning department (matches documents.department_id)
    language: str = "vi"  # Question language


@dataclass
class RetrievalMetrics:
    """Metrics for evaluating retrieval quality."""

    precision_at_k: float
    recall_at_k: float
    f1_at_k: float
    mrr: float  # Mean Reciprocal Rank
    ndcg: float  # Normalized Discounted Cumulative Gain
    hit_rate: float  # % of queries with at least one relevant result


@dataclass
class AnswerMetrics:
    """Metrics for evaluating answer quality."""

    avg_confidence: float
    fallback_rate: float
    avg_latency_ms: float
    avg_num_sources: float
    confidence_benchmark: Optional["ConfidenceBenchmark"] = None


@dataclass
class ConfidenceBenchmark:
    """
    Confidence calibration metrics collected from expected answers.

    Attributes:
        accuracy: Overall accuracy across evaluated cases.
        avg_confidence_correct: Avg confidence when answers were correct.
        avg_confidence_incorrect: Avg confidence when answers were incorrect.
        brier_score: Mean squared error between confidence and correctness labels.
        expected_calibration_error: Weighted average calibration gap across buckets.
        recommended_threshold: Threshold that maximizes F1 between precision & recall.
        accuracy_at_threshold: Accuracy among predictions above the recommended threshold.
        coverage_at_threshold: Percentage of cases whose confidence >= recommended threshold.
        buckets: Calibration buckets describing how confidence aligns with accuracy.
    """

    accuracy: float
    avg_confidence_correct: float
    avg_confidence_incorrect: float
    brier_score: float
    expected_calibration_error: float
    recommended_threshold: float
    accuracy_at_threshold: float
    coverage_at_threshold: float
    buckets: List[Dict[str, Any]]


class RAGEvaluator:
    """
    Evaluate RAG system performance with ground truth test cases.

    Usage:
        evaluator = RAGEvaluator()
        evaluator.load_test_cases("path/to/test_cases.json")

        retrieval_metrics = await evaluator.evaluate_retrieval(k=5)
        answer_metrics = await evaluator.evaluate_answers()

        print(f"Precision@5: {retrieval_metrics.precision_at_k:.3f}")
        print(f"Fallback Rate: {answer_metrics.fallback_rate:.2%}")
    """

    def __init__(
        self,
        retriever: Optional[Retriever] = None,
        orchestrator: Optional[RAGOrchestrator] = None,
    ):
        self.retriever = retriever or Retriever()
        self.orchestrator = orchestrator or RAGOrchestrator()
        self.test_cases: List[EvaluationCase] = []

    def load_test_cases(self, filepath: str | Path) -> None:
        """
        Load test cases from JSON file.

        Expected format:
        [
            {
                "question": "Học phí là bao nhiêu?",
                "relevant_doc_ids": ["doc_123", "doc_456"],
                "relevant_chunk_ids": ["chunk_abc", "chunk_def"],
                "expected_answer": "Học phí năm 2024...",
                "department_id": 1,
                "language": "vi"
            },
            ...
        ]
        """
        filepath = Path(filepath)
        if not filepath.exists():
            raise FileNotFoundError(f"Test cases file not found: {filepath}")

        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.test_cases = []
        for item in data:
            case = EvaluationCase(
                question=item["question"],
                relevant_doc_ids=item.get("relevant_doc_ids", []),
                relevant_chunk_ids=item.get("relevant_chunk_ids"),
                expected_answer=item.get("expected_answer"),
                department_id=item.get("department_id"),
                language=item.get("language", "vi"),
            )
            self.test_cases.append(case)

        logger.info(f"Loaded {len(self.test_cases)} test cases from {filepath}")

    async def evaluate_retrieval(self, k: int = 5) -> RetrievalMetrics:
        """
        Evaluate retrieval quality using Precision@K, Recall@K, MRR, NDCG.

        Args:
            k: Number of results to retrieve (top-k)

        Returns:
            RetrievalMetrics with aggregated metrics across all test cases
        """
        if not self.test_cases:
            raise ValueError("No test cases loaded. Call load_test_cases() first.")

        precisions = []
        recalls = []
        f1_scores = []
        reciprocal_ranks = []
        ndcg_scores = []
        hits = 0

        logger.info(f"Evaluating retrieval with k={k} on {len(self.test_cases)} test cases...")

        for case in self.test_cases:
            # Retrieve top-k results
            try:
                where_filter = (
                    {"department_id": case.department_id} if case.department_id is not None else None
                )
                results = self.retriever.retrieve(
                    case.question, top_k=k, with_score=True, where=where_filter
                )
            except Exception as e:
                logger.error(f"Retrieval failed for '{case.question}': {e}")
                continue

            # Extract retrieved document/chunk IDs
            retrieved_ids = set()
            for result in results:
                if case.relevant_chunk_ids:
                    # Use chunk-level evaluation if available
                    chunk_id = result.get("chunk_id")
                    if chunk_id:
                        retrieved_ids.add(chunk_id)
                else:
                    # Fall back to document-level evaluation
                    doc_id = result.get("document_id")
                    if doc_id:
                        retrieved_ids.add(doc_id)

            # Ground truth relevant IDs
            relevant_ids = set(
                case.relevant_chunk_ids if case.relevant_chunk_ids else case.relevant_doc_ids
            )

            if not relevant_ids:
                logger.warning(f"No relevant IDs for question: {case.question}")
                continue

            # Calculate metrics
            true_positives = len(retrieved_ids & relevant_ids)
            retrieved_count = len(retrieved_ids)
            relevant_count = len(relevant_ids)

            # Precision@K
            precision = true_positives / retrieved_count if retrieved_count > 0 else 0
            precisions.append(precision)

            # Recall@K
            recall = true_positives / relevant_count if relevant_count > 0 else 0
            recalls.append(recall)

            # F1@K
            if precision + recall > 0:
                f1 = 2 * (precision * recall) / (precision + recall)
            else:
                f1 = 0
            f1_scores.append(f1)

            # MRR (Mean Reciprocal Rank)
            rank = None
            for idx, result in enumerate(results, start=1):
                result_id = result.get("chunk_id") or result.get("document_id")
                if result_id in relevant_ids:
                    rank = idx
                    break

            if rank:
                reciprocal_ranks.append(1.0 / rank)
                hits += 1
            else:
                reciprocal_ranks.append(0.0)

            # NDCG (Normalized Discounted Cumulative Gain)
            # Binary relevance: 1 if relevant, 0 otherwise
            relevance_scores = [
                1 if (result.get("chunk_id") or result.get("document_id")) in relevant_ids else 0
                for result in results
            ]
            dcg = sum(rel / np.log2(idx + 2) for idx, rel in enumerate(relevance_scores))

            # Ideal DCG (all relevant docs ranked first)
            ideal_scores = [1] * min(len(relevant_ids), k) + [0] * max(0, k - len(relevant_ids))
            idcg = sum(rel / np.log2(idx + 2) for idx, rel in enumerate(ideal_scores))

            ndcg = dcg / idcg if idcg > 0 else 0
            ndcg_scores.append(ndcg)

        # Aggregate metrics
        return RetrievalMetrics(
            precision_at_k=float(np.mean(precisions)) if precisions else 0.0,
            recall_at_k=float(np.mean(recalls)) if recalls else 0.0,
            f1_at_k=float(np.mean(f1_scores)) if f1_scores else 0.0,
            mrr=float(np.mean(reciprocal_ranks)) if reciprocal_ranks else 0.0,
            ndcg=float(np.mean(ndcg_scores)) if ndcg_scores else 0.0,
            hit_rate=hits / len(self.test_cases) if self.test_cases else 0.0,
        )

    async def evaluate_answers(self, top_k: int = 5) -> AnswerMetrics:
        """
        Evaluate answer generation quality (confidence, fallback rate, latency).

        Returns:
            AnswerMetrics with aggregated statistics
        """
        if not self.test_cases:
            raise ValueError("No test cases loaded. Call load_test_cases() first.")

        confidences = []
        fallbacks = 0
        latencies = []
        num_sources_list = []
        calibration_records: List[Dict[str, float]] = []

        logger.info(f"Evaluating answers on {len(self.test_cases)} test cases...")

        for case in self.test_cases:
            try:
                result = await self.orchestrator.query(
                    case.question, top_k=top_k, department_id=case.department_id
                )

                confidence_score = float(result.get("confidence", 0.0) or 0.0)
                confidences.append(confidence_score)
                if result.get("fallback_triggered", False):
                    fallbacks += 1
                latencies.append(result.get("latency_ms", 0))
                num_sources_list.append(len(result.get("sources", [])))
                if case.expected_answer:
                    is_correct, similarity = self._evaluate_expected_answer(
                        result.get("answer", ""), case.expected_answer
                    )
                    calibration_records.append(
                        {
                            "confidence": confidence_score,
                            "correct": 1.0 if is_correct else 0.0,
                            "similarity": similarity,
                        }
                    )

            except Exception as e:
                logger.error(f"Answer generation failed for '{case.question}': {e}")
                fallbacks += 1
                continue

        benchmark = (
            self._build_confidence_benchmark(calibration_records) if calibration_records else None
        )

        return AnswerMetrics(
            avg_confidence=float(np.mean(confidences)) if confidences else 0.0,
            fallback_rate=fallbacks / len(self.test_cases) if self.test_cases else 0.0,
            avg_latency_ms=float(np.mean(latencies)) if latencies else 0.0,
            avg_num_sources=float(np.mean(num_sources_list)) if num_sources_list else 0.0,
            confidence_benchmark=benchmark,
        )

    async def run_full_evaluation(self, k: int = 5) -> Dict[str, Any]:
        """
        Run complete evaluation: retrieval + answer quality.

        Returns:
            Dictionary with all metrics
        """
        retrieval_metrics = await self.evaluate_retrieval(k=k)
        answer_metrics = await self.evaluate_answers(top_k=k)

        return {
            "retrieval": {
                "precision@k": retrieval_metrics.precision_at_k,
                "recall@k": retrieval_metrics.recall_at_k,
                "f1@k": retrieval_metrics.f1_at_k,
                "mrr": retrieval_metrics.mrr,
                "ndcg": retrieval_metrics.ndcg,
                "hit_rate": retrieval_metrics.hit_rate,
            },
            "answer_quality": {
                "avg_confidence": answer_metrics.avg_confidence,
                "fallback_rate": answer_metrics.fallback_rate,
                "avg_latency_ms": answer_metrics.avg_latency_ms,
                "avg_num_sources": answer_metrics.avg_num_sources,
                **(
                    {"confidence_benchmark": asdict(answer_metrics.confidence_benchmark)}
                    if answer_metrics.confidence_benchmark
                    else {}
                ),
            },
            "summary": {
                "total_test_cases": len(self.test_cases),
                "k": k,
            },
        }

    def print_evaluation_report(self, results: Dict[str, Any]) -> None:
        """Print a formatted evaluation report."""
        print("\n" + "=" * 70)
        print("RAG EVALUATION REPORT")
        print("=" * 70)
        print(f"\nTotal Test Cases: {results['summary']['total_test_cases']}")
        print(f"Top-K: {results['summary']['k']}")

        print("\n📊 RETRIEVAL METRICS:")
        print("-" * 70)
        ret = results["retrieval"]
        print(f"  Precision@{results['summary']['k']}: {ret['precision@k']:.3f}")
        print(f"  Recall@{results['summary']['k']}:    {ret['recall@k']:.3f}")
        print(f"  F1@{results['summary']['k']}:         {ret['f1@k']:.3f}")
        print(f"  MRR:            {ret['mrr']:.3f}")
        print(f"  NDCG:           {ret['ndcg']:.3f}")
        print(f"  Hit Rate:       {ret['hit_rate']:.2%}")

        print("\n🤖 ANSWER QUALITY METRICS:")
        print("-" * 70)
        ans = results["answer_quality"]
        print(f"  Avg Confidence: {ans['avg_confidence']:.3f}")
        print(f"  Fallback Rate:  {ans['fallback_rate']:.2%}")
        print(f"  Avg Latency:    {ans['avg_latency_ms']:.0f}ms")
        print(f"  Avg Sources:    {ans['avg_num_sources']:.1f}")
        benchmark = ans.get("confidence_benchmark")
        if benchmark:
            print("\n📐 CONFIDENCE BENCHMARK:")
            print("-" * 70)
            print(f"  Accuracy:            {benchmark['accuracy']:.2%}")
            print(f"  Brier Score:         {benchmark['brier_score']:.3f}")
            print(f"  Expected Cal. Error: {benchmark['expected_calibration_error']:.3f}")
            print(
                f"  Avg Conf (correct):   {benchmark['avg_confidence_correct']:.3f} "
                f"| Avg Conf (incorrect): {benchmark['avg_confidence_incorrect']:.3f}"
            )
            print(
                f"  Recommended Threshold: {benchmark['recommended_threshold']:.2f} "
                f"(accuracy {benchmark['accuracy_at_threshold']:.2%}, "
                f"coverage {benchmark['coverage_at_threshold']:.2%})"
            )
            print("  Buckets:")
            for bucket in benchmark["buckets"]:
                print(
                    f"    {bucket['range']:<9} "
                    f"avg_conf={bucket['avg_confidence']:.2f} "
                    f"accuracy={bucket['accuracy']:.2%} "
                    f"(n={bucket['count']})"
                )

        print("\n" + "=" * 70)

    @staticmethod
    def _normalize_text(text: str) -> str:
        if not text:
            return ""
        lowered = text.lower().strip()
        lowered = re.sub(r"[“”\"']", "", lowered)
        lowered = re.sub(r"\s+", " ", lowered)
        return lowered

    def _evaluate_expected_answer(self, answer: str, expected: str) -> tuple[bool, float]:
        if not expected:
            return False, 0.0

        normalized_answer = self._normalize_text(answer)
        normalized_expected = self._normalize_text(expected)

        if not normalized_answer or not normalized_expected:
            return False, 0.0

        if normalized_expected in normalized_answer:
            return True, 1.0

        similarity = SequenceMatcher(None, normalized_answer, normalized_expected).ratio()
        threshold = 0.72
        return similarity >= threshold, similarity

    def _build_confidence_benchmark(
        self, records: List[Dict[str, float]]
    ) -> ConfidenceBenchmark:
        if not records:
            raise ValueError("Cannot build benchmark without records")

        total = len(records)
        accuracy = sum(r["correct"] for r in records) / total

        conf_correct = [r["confidence"] for r in records if r["correct"] == 1.0]
        conf_incorrect = [r["confidence"] for r in records if r["correct"] == 0.0]

        avg_conf_correct = float(np.mean(conf_correct)) if conf_correct else 0.0
        avg_conf_incorrect = float(np.mean(conf_incorrect)) if conf_incorrect else 0.0

        brier = float(
            np.mean([(r["confidence"] - r["correct"]) ** 2 for r in records])
        )

        buckets = self._build_calibration_buckets(records)
        ece = 0.0
        for bucket in buckets:
            if bucket["count"] == 0:
                continue
            weight = bucket["count"] / total
            ece += weight * abs(bucket["accuracy"] - bucket["avg_confidence"])

        (
            recommended_threshold,
            coverage_at_threshold,
            accuracy_at_threshold,
        ) = self._find_best_threshold(records)

        return ConfidenceBenchmark(
            accuracy=accuracy,
            avg_confidence_correct=avg_conf_correct,
            avg_confidence_incorrect=avg_conf_incorrect,
            brier_score=brier,
            expected_calibration_error=ece,
            recommended_threshold=recommended_threshold,
            accuracy_at_threshold=accuracy_at_threshold,
            coverage_at_threshold=coverage_at_threshold,
            buckets=buckets,
        )

    @staticmethod
    def _build_calibration_buckets(
        records: List[Dict[str, float]], num_buckets: int = 5
    ) -> List[Dict[str, Any]]:
        if num_buckets <= 0:
            raise ValueError("num_buckets must be positive")

        bucket_size = 1.0 / num_buckets
        buckets: List[Dict[str, Any]] = []

        for idx in range(num_buckets):
            lower = round(idx * bucket_size, 2)
            upper = round((idx + 1) * bucket_size, 2) if idx < num_buckets - 1 else 1.0
            if idx == num_buckets - 1:
                bucket_records = [
                    r for r in records if lower <= r["confidence"] <= upper
                ]
            else:
                bucket_records = [
                    r for r in records if lower <= r["confidence"] < upper
                ]

            if bucket_records:
                avg_conf = float(np.mean([r["confidence"] for r in bucket_records]))
                accuracy = sum(r["correct"] for r in bucket_records) / len(
                    bucket_records
                )
            else:
                avg_conf = 0.0
                accuracy = 0.0

            buckets.append(
                {
                    "range": f"{lower:.2f}-{upper:.2f}",
                    "avg_confidence": avg_conf,
                    "accuracy": accuracy,
                    "count": len(bucket_records),
                }
            )

        return buckets

    def _find_best_threshold(
        self, records: List[Dict[str, float]]
    ) -> tuple[float, float, float]:
        if not records:
            return settings.CONFIDENCE_THRESHOLD, 0.0, 0.0

        total = len(records)
        default_threshold = round(float(settings.CONFIDENCE_THRESHOLD), 2)
        candidates = sorted(
            {round(i / 100, 2) for i in range(40, 96, 5)} | {default_threshold}
        )

        best_threshold = default_threshold
        best_score = -1.0
        best_coverage = 0.0
        best_accuracy = 0.0

        total_correct = sum(r["correct"] for r in records)

        for threshold in candidates:
            selected = [r for r in records if r["confidence"] >= threshold]
            if not selected:
                continue

            correct_in_selection = sum(r["correct"] for r in selected)
            coverage = len(selected) / total
            accuracy = (
                correct_in_selection / len(selected) if selected else 0.0
            )
            recall = (
                correct_in_selection / total_correct if total_correct > 0 else 0.0
            )

            if accuracy + recall == 0:
                f1 = 0.0
            else:
                f1 = 2 * (accuracy * recall) / (accuracy + recall)

            if f1 > best_score:
                best_score = f1
                best_threshold = threshold
                best_coverage = coverage
                best_accuracy = accuracy

        if best_score < 0:
            return default_threshold, 0.0, 0.0

        return best_threshold, best_coverage, best_accuracy
