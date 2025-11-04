from __future__ import annotations
import re
import math
import logging
from typing import Any, Dict, List, Optional, Tuple
from app.rag.question_understanding import Intent, IntentDetector
STOP_WORDS = {"the", "a", "an", "is", "are", "was", "were", "be", "been", "of", "for", "in", "on", "at", "to", "from"}
logger = logging.getLogger(__name__)

class RuleBasedIntentDetector(IntentDetector):
    def __init__(self):
        self.intent_patterns: Dict[str, Tuple[List[str], List[str]]] = {
            "ask_admission_process": (
                [
                    "admission", "admit", "enroll", "enrollment", "apply",
                    "application", "applicant", "tuyển sinh", "nhập học",
                    "đăng ký", "nộp hồ sơ", "hồ sơ tuyển sinh",
                ],
                [
                    "process", "procedure", "step", "how to", "way",
                    "quy trình", "thủ tục", "cách thức", "làm sao",
                ],
            ),
            "ask_tuition_fee": (
                [
                    "tuition", "fee", "fees", "cost", "costs", "price", "pricing",
                    "payment", "pay", "scholarship", "financial aid",
                    "học phí", "phí", "chi phí", "giá", "thanh toán",
                    "học bổng", "trợ cấp",
                ],
                [
                    "how much", "what is", "amount", "semester", "year",
                    "bao nhiêu", "là bao nhiêu", "học kỳ", "năm học",
                ],
            ),
            "ask_deadline": (
                [
                    "deadline", "due date", "date", "closing date",
                    "application deadline", "submission deadline",
                    "hạn chót", "hạn nộp", "deadline", "hết hạn", "đóng", "cuối",
                ],
                [
                    "when", "apply", "submit", "application", "admission",
                    "nộp", "gửi", "đăng ký", "hồ sơ", "ngày", "khi nào",
                ],
            ),
            "ask_requirements": (
                [
                    "requirement", "requirements", "prerequisite", "prerequisites",
                    "qualification", "qualifications", "eligibility", "eligible",
                    "need", "needed", "what do i need", "what is needed",
                    "yêu cầu", "điều kiện", "tiêu chuẩn", "cần gì",
                    "cần những gì", "phải có",
                    "yêu cầu tuyển sinh", "admission requirements",
                    "tuyển sinh yêu cầu", "requirements for admission",
                ],
                [
                    "ielts", "toefl", "gpa", "grade", "transcript",
                    "diploma", "degree", "certificate", "document",
                    "bằng cấp", "chứng chỉ", "bảng điểm",
                    "tuyển sinh",
                ],
            ),
            "ask_schedule": (
                [
                    "schedule", "timetable", "calendar", "academic calendar",
                    "what time", "class time", "course schedule",
                    "lịch học", "thời khóa biểu", "lịch trình",
                    "thời gian", "giờ học",
                    "classes", "class", "when",
                    "when are", "when is", "when do",
                ],
                [
                    "semester", "term", "session", "week", "day",
                    "học kỳ", "kỳ học", "tuần", "ngày", "buổi",
                    "khi nào",
                ],
            ),
            "ask_contact": (
                [
                    "contact", "phone", "email", "address", "location",
                    "where", "how to contact", "reach", "call",
                    "liên hệ", "điện thoại", "số điện thoại", "email",
                    "địa chỉ", "ở đâu", "cách liên hệ", "gọi",
                ],
                [
                    "office", "department", "staff", "person", "who",
                    "phòng", "văn phòng", "nhân viên", "ai", "người",
                ],
            ),
        }
    
    def detect(self, question: str, context: Optional[Dict[str, Any]] = None) -> Intent:
        if question is None:
            logger.warning("None question received in intent detector")
            return Intent(
                label="other",
                confidence=0.0,
                metadata={"reason": "none_question", "error": "Question is None"},
            )
        if not question or not question.strip():
            logger.debug("Empty question received in intent detector")
            return Intent(
                label="other",
                confidence=0.0,
                metadata={"reason": "empty_question"},
            )
        if len(question) > 500:
            logger.warning(f"Question too long for intent detection: {len(question)} chars")
            question = question[:500]
        try:
            normalized_q = re.sub(r'\s+', ' ', question.lower().strip())
        except Exception as e:
            logger.error(f"Intent detection error: {e}", exc_info=True)
            return Intent(
                label="other",
                confidence=0.0,
                metadata={
                    "reason": "detection_error",
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
            )
            
        def match_compound_keyword(text: str, keyword: str) -> bool:
            keyword_parts = keyword.split()
            keyword_clean = " ".join([w for w in keyword_parts if w not in STOP_WORDS])
            text_words = text.split()
            text_clean = " ".join([w for w in text_words if w not in STOP_WORDS])
            if keyword_clean in text_clean:
                return True
            keyword_words = keyword_clean.split()
            text_words_clean = text_clean.split()
            if len(keyword_words) == 0:
                return False
            i = 0
            for word in text_words_clean:
                if word == keyword_words[i]:
                    i += 1
                    if i == len(keyword_words):
                        return True
            return False
        intent_scores: Dict[str, float] = {}
        intent_matches: Dict[str, Dict[str, List[str]]] = {}
        for intent_label, (primary_keywords, secondary_keywords) in self.intent_patterns.items():
            primary_matches = []
            secondary_matches = []
            working_text = normalized_q
            sorted_primary = sorted(primary_keywords, key=len, reverse=True)
            compound_keywords = [kw for kw in sorted_primary if len(kw.split()) > 1]
            single_keywords = [kw for kw in sorted_primary if len(kw.split()) == 1]
            matched_compound_positions = set()
            for keyword in compound_keywords:
                if match_compound_keyword(working_text, keyword):
                    primary_matches.append(keyword)
                    keyword_words = keyword.split()
                    for word in keyword_words:
                        if word not in STOP_WORDS:
                            matched_compound_positions.add(word.lower())
            for keyword in single_keywords:
                if keyword.lower() in working_text:
                    if keyword.lower() not in matched_compound_positions:
                        primary_matches.append(keyword)
            for keyword in secondary_keywords:
                if keyword.lower() in normalized_q:
                    secondary_matches.append(keyword)
            primary_score = len(primary_matches) * 2.0
            if intent_label == "ask_requirements":
                has_admission = any("admission" in kw.lower() for kw in primary_matches) or \
                               any("admission" in kw.lower() for kw in secondary_matches) or \
                               "admission" in normalized_q
                has_requirements = any("requirement" in kw.lower() for kw in primary_matches) or \
                                  "requirements" in normalized_q or \
                                  "requirement" in normalized_q
                has_need = any("need" in kw.lower() for kw in primary_matches) or \
                          any("need" in kw.lower() for kw in secondary_matches) or \
                          "need" in normalized_q
                has_apply = "apply" in normalized_q or \
                           "application" in normalized_q
                if (has_admission and has_requirements) or (has_need and has_apply):
                    primary_score += 1.5
            secondary_score = len(secondary_matches) * 1.0
            total_score = primary_score + secondary_score
            if len(normalized_q) > 50:
                length_factor = 1.0 + math.log(len(normalized_q) / 50)
                normalized_score = total_score / length_factor if total_score > 0 else 0.0
            else:
                normalized_score = total_score
            intent_scores[intent_label] = normalized_score
            intent_matches[intent_label] = {
                "primary": primary_matches,
                "secondary": secondary_matches,
            }
        if not intent_scores or max(intent_scores.values()) == 0.0:
            return Intent(
                label="other",
                confidence=0.3,
                metadata={
                    "reason": "no_keyword_matches",
                    "all_scores": intent_scores,
                },
            )
        best_intent = max(intent_scores.items(), key=lambda x: x[1])
        intent_label, score = best_intent
        raw_confidence = 1.0 - math.exp(-score)
        confidence = min(raw_confidence * 1.1, 0.95)
        if confidence < 0.4:
            return Intent(
                label="other",
                confidence=confidence,
                metadata={
                    "reason": "low_confidence_match",
                    "detected_intent": intent_label,
                    "scores": intent_scores,
                },
            )
        return Intent(
            label=intent_label,
            confidence=round(confidence, 3),
            metadata={
                "matched_keywords": intent_matches[intent_label],
                "raw_score": round(score, 3),
                "all_scores": {k: round(v, 3) for k, v in intent_scores.items()},
                "method": "rule_based",
            },
        )
    
    def get_available_intents(self) -> List[str]:
        return list(self.intent_patterns.keys()) + ["other"]