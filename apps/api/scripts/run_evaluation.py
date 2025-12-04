"""
Example script for running RAG evaluation.

Usage:
    python scripts/run_evaluation.py
"""

import asyncio
import json
import logging
from pathlib import Path

from app.rag.evaluation import RAGEvaluator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main():
    """Run RAG evaluation and print results."""
    # Initialize evaluator
    evaluator = RAGEvaluator()

    # Load test cases
    test_cases_path = Path(__file__).parent.parent / "tests" / "evaluation" / "test_cases.json"
    evaluator.load_test_cases(test_cases_path)

    # Run evaluation with k=5
    logger.info("Starting RAG evaluation...")
    results = await evaluator.run_full_evaluation(k=5)

    # Print formatted report
    evaluator.print_evaluation_report(results)

    # Save results to JSON
    output_path = Path(__file__).parent.parent / "tests" / "evaluation" / "results.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    logger.info(f"\n✅ Results saved to {output_path}")


if __name__ == "__main__":
    asyncio.run(main())
