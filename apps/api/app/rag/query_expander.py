"""Query expansion for better retrieval coverage."""

from __future__ import annotations

import logging
from typing import List, Optional

from app.rag.llm import LLMWrapper

logger = logging.getLogger(__name__)


class QueryExpander:
    """Expand queries to improve retrieval coverage."""

    def __init__(self, llm_wrapper: Optional[LLMWrapper] = None):
        self.llm = llm_wrapper

        # Domain-specific expansions for common queries
        self.domain_expansions = {
            # Academic programs
            "cntt": [
                "công nghệ thông tin",
                "ngành công nghệ thông tin",
                "chương trình cntt",
                "đào tạo cntt",
            ],
            "công nghệ thông tin": [
                "cntt",
                "ngành công nghệ thông tin",
                "chương trình công nghệ thông tin",
            ],
            "qtkd": ["quản trị kinh doanh", "ngành quản trị kinh doanh", "chương trình qtkd"],
            "quản trị kinh doanh": ["qtkd", "ngành quản trị kinh doanh", "chương trình quản trị"],
            # Fees and payments
            "học phí": [
                "chi phí học tập",
                "mức học phí",
                "thu học phí",
                "đóng học phí",
                "thanh toán học phí",
            ],
            "tuition": ["tuition fee", "học phí", "payment", "cost"],
            # Withdrawal/dropout
            "thôi học": ["chủ động thôi học", "bị buộc thôi học", "quy định thôi học", "ngừng học"],
            "bảo lưu": ["tạm ngưng", "hoãn học", "nghỉ học tạm thời"],
            # Scholarships
            "học bổng": ["hỗ trợ học phí", "miễn giảm học phí", "scholarship"],
            # Registration
            "đăng ký": ["đăng ký học phần", "đăng ký môn học", "enrollment", "registration"],
            # Exams and grades
            "thi": ["kỳ thi", "thi lại", "exam", "examination"],
            "điểm": ["điểm số", "kết quả học tập", "gpa", "grade"],
        }

    def expand_query(self, query: str, max_expansions: int = 3) -> List[str]:
        """
        Expand a single query into multiple related queries.

        Args:
            query: Original query text
            max_expansions: Maximum number of expansion queries to generate

        Returns:
            List of queries including original and expansions
        """
        query_lower = query.lower().strip()
        queries = [query]

        # Check domain-specific expansions
        for key, expansions in self.domain_expansions.items():
            if key in query_lower:
                # Add variations
                for exp in expansions[:max_expansions]:
                    if exp not in query_lower:
                        expanded = query_lower.replace(key, exp)
                        if expanded not in queries:
                            queries.append(expanded.capitalize())
                break

        # Add contextual variations for very short queries
        if len(query_lower.split()) <= 2:
            queries.extend(self._add_context_variations(query))

        # Deduplicate and limit
        seen = set()
        unique_queries = []
        for q in queries:
            q_normalized = q.lower().strip()
            if q_normalized not in seen:
                seen.add(q_normalized)
                unique_queries.append(q)

        return unique_queries[: max_expansions + 1]

    def _add_context_variations(self, query: str) -> List[str]:
        """Add contextual variations for very short queries."""
        query_lower = query.lower().strip()
        variations = []

        # Educational context patterns
        patterns = {
            "học phí": [
                "mức học phí của trường",
                "thông tin về học phí",
                "cách thanh toán học phí",
            ],
            "thôi học": ["quy định về thôi học", "trường hợp thôi học", "thủ tục thôi học"],
            "bảo lưu": ["điều kiện bảo lưu", "thời gian bảo lưu", "thủ tục bảo lưu"],
            "cntt": [
                "thông tin ngành công nghệ thông tin",
                "chương trình đào tạo công nghệ thông tin",
            ],
            "qtkd": [
                "thông tin ngành quản trị kinh doanh",
                "chương trình đào tạo quản trị kinh doanh",
            ],
        }

        for key, vars in patterns.items():
            if key in query_lower:
                variations.extend(vars[:2])
                break

        return variations

    async def expand_with_llm(self, query: str, max_expansions: int = 2) -> List[str]:
        """
        Use LLM to generate semantic expansions (optional, more expensive).

        Args:
            query: Original query
            max_expansions: Maximum expansions to generate

        Returns:
            List including original query and LLM-generated expansions
        """
        if not self.llm:
            return [query]

        prompt = f"""Given this Vietnamese university student query, generate {max_expansions} semantically related queries that would help find comprehensive information.

Original query: "{query}"

Rules:
1. Keep variations specific to Greenwich University Vietnam context
2. Include synonyms and different phrasings
3. Don't change the core meaning
4. Output as JSON array

Example:
Query: "học phí"
Output: {{"queries": ["mức học phí năm học", "chi phí đào tạo", "thanh toán học phí"]}}

Now generate for the query above:"""

        try:
            result = await self.llm.invoke_json(prompt, "")
            if isinstance(result, dict) and "queries" in result:
                expansions = result["queries"]
                if isinstance(expansions, list):
                    return [query] + expansions[:max_expansions]
        except Exception as e:
            logger.warning(f"LLM query expansion failed: {e}")

        return [query]


def get_query_expander(llm_wrapper: Optional[LLMWrapper] = None) -> QueryExpander:
    """Factory function to get QueryExpander instance."""
    return QueryExpander(llm_wrapper=llm_wrapper)
