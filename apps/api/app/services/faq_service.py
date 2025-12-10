"""Service for generating FAQs based on user query patterns."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any, List, Optional

from motor.motor_asyncio import AsyncIOMotorCollection

from ..core.cache import get_cache_service
from ..rag.guardrail import GuardrailService
from ..rag.language import detect_language
from ..rag.llm import LLMWrapper
from .embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


class FAQService:
    """Service to generate FAQs from actual user queries."""

    def __init__(
        self,
        messages_collection: AsyncIOMotorCollection,
        use_semantic_grouping: bool = True,
        similarity_threshold: float = 0.75,
        refine_questions: bool = True,
    ):
        """
        Initialize FAQ Service.

        Args:
            messages_collection: MongoDB collection with chat messages
            use_semantic_grouping: Enable semantic similarity grouping
            similarity_threshold: Cosine similarity threshold (0-1)
            refine_questions: Use LLM to refine question text
        """
        self.messages_coll = messages_collection
        self.use_semantic_grouping = use_semantic_grouping
        self.similarity_threshold = similarity_threshold
        self.refine_questions = refine_questions

        # Lazy load services
        self._embedding_service: Optional[EmbeddingService] = None
        self._llm_wrapper: Optional[LLMWrapper] = None
        self._guardrail_service: Optional[GuardrailService] = None

    @property
    def embedding_service(self) -> EmbeddingService:
        """Lazy load embedding service."""
        if self._embedding_service is None:
            self._embedding_service = EmbeddingService()
        return self._embedding_service

    @property
    def llm_wrapper(self) -> LLMWrapper:
        """Lazy load LLM wrapper for question refinement."""
        if self._llm_wrapper is None:
            self._llm_wrapper = LLMWrapper(temperature=0.3, max_tokens=100)
        return self._llm_wrapper

    @property
    def guardrail_service(self) -> GuardrailService:
        """Lazy load guardrail service."""
        if self._guardrail_service is None:
            self._guardrail_service = GuardrailService(self.llm_wrapper)
        return self._guardrail_service

    async def _refine_question(self, raw_question: str, language: str) -> str:
        """
        Use LLM to refine/complete a raw user question.

        Args:
            raw_question: Raw question text from user
            language: Question language (vi or en)

        Returns:
            Refined, complete question
        """
        if not self.refine_questions:
            return raw_question

        # Skip refinement for very short or very long questions
        if len(raw_question) < 5 or len(raw_question) > 150:
            return raw_question

        try:
            prompt = f"""Bạn là trợ lý chuyên viết lại câu hỏi cho rõ ràng và hoàn chỉnh.

Nhiệm vụ: Viết lại câu hỏi dưới đây thành một câu hỏi hoàn chỉnh, rõ ràng, tự nhiên về mặt ngữ nghĩa.
- Giữ nguyên ý nghĩa ban đầu
- Không thêm thông tin mới
- Viết ngắn gọn, tự nhiên
- Nếu câu hỏi đã rõ ràng, giữ nguyên
- Trả về ĐÚNG ngôn ngữ của câu hỏi gốc (tiếng Việt hoặc tiếng Anh)

Câu hỏi gốc: "{raw_question}"

Câu hỏi đã hoàn thiện:"""

            refined = await self.llm_wrapper.generate_direct_answer_async(
                question=prompt, target_language=language
            )
            refined = refined.strip().strip('"').strip("'").strip()

            # Validate refinement
            if len(refined) > 0 and len(refined) <= 200:
                logger.debug(f"Refined question: '{raw_question}' -> '{refined}'")
                return refined
            else:
                return raw_question

        except Exception as e:
            logger.warning(f"Question refinement failed: {e}")
            return raw_question

    async def get_frequent_questions(
        self,
        language: str = "vi",
        limit: int = 10,
        days: int = 30,
        min_frequency: int = 3,
    ) -> List[dict[str, Any]]:
        """
        Get most frequently asked questions from chat history.

        Args:
            language: Filter by language ('vi' or 'en')
            limit: Maximum number of FAQs to return
            days: Number of days to look back in history
            min_frequency: Minimum times a question must be asked

        Returns:
            List of FAQ items with question, frequency, category
        """
        try:
            # Check cache first
            cache_service = get_cache_service()
            cache_key = f"faq:frequent:{language}:{limit}:{min_frequency}:{days}"
            cached = await cache_service.get(cache_key)
            if cached is not None:
                logger.info(f"Cache HIT for frequent FAQs (language={language})")
                return cached

            logger.info(f"Cache MISS for frequent FAQs (language={language})")

            # Calculate date threshold
            since_date = datetime.utcnow() - timedelta(days=days)

            # Aggregation pipeline to find frequent user questions
            pipeline = [
                # Match user messages only (not assistant)
                {
                    "$match": {
                        "role": "user",
                        "createdAt": {"$gte": since_date},
                    }
                },
                # Group by normalized question and count
                {
                    "$group": {
                        "_id": {"$toLower": {"$trim": {"input": "$text"}}},
                        "count": {"$sum": 1},
                        "originalText": {"$first": "$text"},
                        "lastAsked": {"$max": "$createdAt"},
                    }
                },
                # Filter by minimum frequency
                {"$match": {"count": {"$gte": min_frequency}}},
                # Sort by frequency (descending)
                {"$sort": {"count": -1}},
                # Limit results
                {"$limit": limit * 2},  # Get more for filtering
            ]

            cursor = self.messages_coll.aggregate(pipeline)
            results = await cursor.to_list(length=limit * 2)

            # Apply semantic grouping if enabled
            if self.use_semantic_grouping and len(results) > 1:
                results = await self._group_similar_questions(results, language)

            # Filter questions first
            filtered_questions = []
            for item in results:
                question = item["originalText"].strip()

                # Skip if too short or too long
                is_acronym = len(question) <= 4 and question.isupper()
                if (len(question) < 3 or len(question) > 200) and not is_acronym:
                    continue
                if len(question) < 3:
                    continue

                # Detect language
                detected_lang = detect_language(question)
                if detected_lang != language:
                    continue

                filtered_questions.append((question, item))
                if len(filtered_questions) >= limit:
                    break

            # Refine all questions in parallel for speed
            # Also check guardrails in parallel
            if self.refine_questions and filtered_questions:
                tasks = []
                for q, _ in filtered_questions:
                    tasks.append(self._refine_question(q, language))
                    tasks.append(self.guardrail_service.is_question_appropriate(q))

                results = await asyncio.gather(*tasks, return_exceptions=True)

                # Separate refinement and guardrail results
                refined_questions = results[::2]  # Even indices
                guardrail_checks = results[1::2]  # Odd indices
            else:
                refined_questions = [q for q, _ in filtered_questions]
                guardrail_checks = [True] * len(filtered_questions)

            # Build final FAQ list (filter out blocked questions)
            faqs = []
            for idx, ((original_q, item), refined_q, is_appropriate) in enumerate(
                zip(filtered_questions, refined_questions, guardrail_checks)
            ):
                # Skip if question is blocked by guardrail
                if isinstance(is_appropriate, bool) and not is_appropriate:
                    logger.info(f"FAQ question blocked by guardrail: '{original_q}'")
                    continue

                # Use refined question if successful, otherwise use original
                if isinstance(refined_q, Exception):
                    logger.warning(f"Refinement failed for '{original_q}': {refined_q}")
                    final_question = original_q
                else:
                    final_question = refined_q

                category = self._categorize_question(original_q)

                faqs.append(
                    {
                        "id": f"dyn_faq_{idx}",
                        "question": final_question,
                        "category": category,
                        "count": item["count"],
                    }
                )

            logger.info(f"Generated {len(faqs)} FAQs for language '{language}'")

            # Cache for 5 minutes (300 seconds)
            await cache_service.set(cache_key, faqs, ttl=300)

            return faqs

        except Exception as e:
            logger.error(f"Error generating FAQs: {e}", exc_info=True)
            return []

    async def get_trending_questions(
        self,
        language: str = "vi",
        limit: int = 5,
        hours: int = 24,
    ) -> List[dict[str, Any]]:
        """
        Get trending questions from recent hours.

        Args:
            language: Filter by language
            limit: Maximum number of trending questions
            hours: Number of hours to look back

        Returns:
            List of trending questions
        """
        # Check cache first
        cache_key = f"faq:trending:{language}:{limit}:{hours}"
        cache_service = get_cache_service()
        cached = await cache_service.get(cache_key)
        if cached is not None:
            logger.info(
                f"Returning cached trending questions for language '{language}' (cache hit)"
            )
            return cached

        try:
            since_date = datetime.utcnow() - timedelta(hours=hours)

            pipeline = [
                {
                    "$match": {
                        "role": "user",
                        "createdAt": {"$gte": since_date},
                    }
                },
                {
                    "$group": {
                        "_id": {"$toLower": {"$trim": {"input": "$text"}}},
                        "count": {"$sum": 1},
                        "originalText": {"$first": "$text"},
                    }
                },
                {"$match": {"count": {"$gte": 2}}},  # Asked at least twice
                {"$sort": {"count": -1}},
                {"$limit": limit},
            ]

            cursor = self.messages_coll.aggregate(pipeline)
            results = await cursor.to_list(length=limit)

            trending = []
            for idx, item in enumerate(results):
                question = item["originalText"].strip()
                detected_lang = detect_language(question)

                if detected_lang == language and 5 <= len(question) <= 200:
                    trending.append(
                        {
                            "id": f"trend_{idx}",
                            "question": question,
                            "count": item["count"],
                            "category": "trending",
                        }
                    )

            # Cache for 3 minutes (180 seconds) - shorter TTL for trending
            await cache_service.set(cache_key, trending, ttl=180)

            return trending

        except Exception as e:
            logger.error(f"Error getting trending questions: {e}", exc_info=True)
            return []

    def _categorize_question(self, question: str) -> str:
        """Categorize question based on keywords."""
        q_lower = question.lower()

        # Tuition/Fee keywords
        tuition_keywords = ["học phí", "tuition", "fee", "phí", "cost", "giá"]
        if any(kw in q_lower for kw in tuition_keywords):
            return "tuition"

        # Programs/Courses keywords
        program_keywords = ["ngành", "chuyên ngành", "program", "course", "major", "3+0"]
        if any(kw in q_lower for kw in program_keywords):
            return "programs"

        # Admission keywords
        admission_keywords = ["tuyển sinh", "admission", "đăng ký", "register", "nhập học"]
        if any(kw in q_lower for kw in admission_keywords):
            return "admission"

        # Scholarship keywords
        scholarship_keywords = ["học bổng", "scholarship", "miễn giảm", "discount"]
        if any(kw in q_lower for kw in scholarship_keywords):
            return "scholarship"

        # Facilities keywords
        facility_keywords = ["ký túc xá", "dorm", "facility", "cơ sở", "campus"]
        if any(kw in q_lower for kw in facility_keywords):
            return "facilities"

        return "general"

    async def _group_similar_questions(self, results: List[dict], language: str) -> List[dict]:
        """
        Group semantically similar questions together using embeddings.

        Args:
            results: List of aggregated results from MongoDB
            language: Language filter

        Returns:
            Deduplicated list with merged counts
        """
        try:
            # Extract questions
            questions = [item["originalText"] for item in results]

            if not questions:
                return results

            logger.info(
                f"Grouping {len(questions)} questions with semantic similarity (threshold={self.similarity_threshold})"
            )

            # Find similar groups
            groups = self.embedding_service.find_similar_groups(
                questions, threshold=self.similarity_threshold
            )

            # Merge results by group
            merged_results = []
            for group_indices in groups:
                # Get all items in this group
                group_items = [results[i] for i in group_indices]

                # Choose representative question (shortest)
                rep_text, rep_idx_in_group = self.embedding_service.get_representative_text(
                    questions, group_indices
                )

                # Sum up frequencies
                total_count = sum(item["count"] for item in group_items)

                # Get most recent timestamp
                latest_asked = max(item["lastAsked"] for item in group_items)

                # Create merged item
                merged_results.append(
                    {
                        "_id": rep_text.lower().strip(),
                        "originalText": rep_text,
                        "count": total_count,
                        "lastAsked": latest_asked,
                        "grouped_variants": len(group_indices),  # How many variants merged
                    }
                )

            # Sort by count again after grouping
            merged_results.sort(key=lambda x: x["count"], reverse=True)

            logger.info(
                f"Grouped into {len(merged_results)} unique questions (from {len(results)} original)"
            )

            return merged_results

        except Exception as e:
            logger.warning(f"Semantic grouping failed: {e}. Falling back to exact matching.")
            return results


__all__ = ["FAQService"]
