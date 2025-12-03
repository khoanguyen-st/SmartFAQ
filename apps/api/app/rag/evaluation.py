"""RAG Evaluation Framework for measuring retrieval and answer quality."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

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
    category: str = "general"  # Question category (tuition, admission, etc.)
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
                "category": "tuition",
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
                category=item.get("category", "general"),
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
                results = self.retriever.retrieve(case.question, top_k=k, with_score=True)
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

    async def evaluate_answers(self) -> AnswerMetrics:
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

        logger.info(f"Evaluating answers on {len(self.test_cases)} test cases...")

        for case in self.test_cases:
            try:
                result = await self.orchestrator.query(case.question, top_k=5)

                confidences.append(result.get("confidence", 0.0))
                if result.get("fallback_triggered", False):
                    fallbacks += 1
                latencies.append(result.get("latency_ms", 0))
                num_sources_list.append(len(result.get("sources", [])))

            except Exception as e:
                logger.error(f"Answer generation failed for '{case.question}': {e}")
                fallbacks += 1
                continue

        return AnswerMetrics(
            avg_confidence=float(np.mean(confidences)) if confidences else 0.0,
            fallback_rate=fallbacks / len(self.test_cases) if self.test_cases else 0.0,
            avg_latency_ms=float(np.mean(latencies)) if latencies else 0.0,
            avg_num_sources=float(np.mean(num_sources_list)) if num_sources_list else 0.0,
        )

    async def run_full_evaluation(self, k: int = 5) -> Dict[str, Any]:
        """
        Run complete evaluation: retrieval + answer quality.

        Returns:
            Dictionary with all metrics
        """
        retrieval_metrics = await self.evaluate_retrieval(k=k)
        answer_metrics = await self.evaluate_answers()

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

        print("\n" + "=" * 70)
