from __future__ import annotations
import re
import logging
from typing import Dict, List
from app.rag.question_understanding import QuestionNormalizer
logger = logging.getLogger(__name__)

class RuleBasedNormalizer(QuestionNormalizer):
    def __init__(self):
        self.spell_corrections: Dict[str, str] = {
            "admision": "admission",
            "addmission": "admission",
            "admisson": "admission",
            "enrolllment": "enrollment",
            "enrolment": "enrollment",
            "applly": "apply",
            "aplly": "apply",
            "requirment": "requirement",
            "requirments": "requirements",
            "prerequsite": "prerequisite",
            "prerequsites": "prerequisites",
            "qualifaction": "qualification",
            "qualifactions": "qualifications",
            "eligble": "eligible",
            "eligibility": "eligibility",
            "tution": "tuition",
            "tutition": "tuition",
            "scolarship": "scholarship",
            "scholorship": "scholarship",
            "schedule": "schedule", 
            "calender": "calendar",
            "calandar": "calendar",
            "timetable": "timetable",  
            "contat": "contact",
            "contack": "contact",
            "email": "email", 
            "teh": "the",
            "adn": "and",
            "taht": "that",
            "wich": "which",
            "recieve": "receive",
            "seperate": "separate",
        }
        self.abbreviations: Dict[str, str] = {
            "ielts req": "ielts requirement",
            "ielts req.": "ielts requirement",
            "toefl req": "toefl requirement",
            "toefl req.": "toefl requirement",
            "gpa req": "gpa requirement",
            "gpa req.": "gpa requirement",
            "app proc": "application process",
            "app proc.": "application process",
            "admission proc": "admission process",
            "admission proc.": "admission process",
            "tuition fee": "tuition fee",  
            "tuition": "tuition fee",  
            "fee": "tuition fee",  
            "class sched": "class schedule",
            "class sched.": "class schedule",
            "academic cal": "academic calendar",
            "academic cal.": "academic calendar",
            "email addr": "email address",
            "email addr.": "email address",
            "phone num": "phone number",
            "phone num.": "phone number",
            "học phí": "học phí", 
            "hp": "học phí", 
        }
        self.synonyms: Dict[str, str] = {
            "apply": "apply", 
            "application": "application", 
            "enroll": "enroll", 
            "enrollment": "enrollment",
            "need": "requirement",  
            "needed": "requirements",  
            "prerequisite": "requirement",  
            "prerequisites": "requirements",  
            "timetable": "schedule",
            "calender": "calendar",
            "reach": "contact",
            "reach out": "contact",
            "get in touch": "contact",
        }
        self.contextual_patterns: List[tuple] = [
            (r'\bfee\b', 'tuition fee', ['tuition', 'cost', 'price', 'how much']),
            (r'\bcourse\b', 'program', ['study', 'degree', 'major']),
        ]
    
    def normalize(self, question: str) -> str:
        if question is None:
            logger.warning("None question received in normalizer")
            return ""
        if not question:
            return ""
        if not question.strip():
            return ""
        try:
            normalized = question.strip()
            normalized = re.sub(r'\s+', ' ', normalized)
            trailing_punct = ""
            if normalized.endswith(('?', '!')):
                trailing_punct = normalized[-1]
                normalized = normalized[:-1]
            normalized = normalized.strip('.,;:')
            if trailing_punct:
                normalized = normalized + trailing_punct
            lower_normalized = normalized.lower()
            words = lower_normalized.split()
            corrected_words = []
            for word in words:
                word_clean = word.strip('.,!?;:()[]{}')
                if word_clean in self.spell_corrections:
                    corrected_word = self.spell_corrections[word_clean]
                    if word != word_clean:
                        corrected_word = word.replace(word_clean, corrected_word)
                    corrected_words.append(corrected_word)
                else:
                    corrected_words.append(word)
            normalized = ' '.join(corrected_words)
            sorted_abbrevs = sorted(self.abbreviations.items(), key=lambda x: len(x[0]), reverse=True)
            for abbrev, expansion in sorted_abbrevs:
                pattern = r'\b' + re.escape(abbrev.lower()) + r'\b'
                if re.search(pattern, normalized, re.IGNORECASE):
                    normalized = re.sub(pattern, expansion.lower(), normalized, flags=re.IGNORECASE)
            words = normalized.split()
            synonym_normalized_words = []
            for i, word in enumerate(words):
                word_clean = word.strip('.,!?;:()[]{}')
                if word_clean in self.synonyms:
                    context_window = 3 
                    start = max(0, i - context_window)
                    end = min(len(words), i + context_window + 1)
                    context_words = ' '.join(words[start:end]).lower()  
                    should_replace = True
                    for pattern, replacement, context_keywords in self.contextual_patterns:
                        if re.search(pattern, word, re.IGNORECASE):
                            has_context = any(kw in context_words for kw in context_keywords)
                            if not has_context:
                                should_replace = False
                                break
                    if should_replace:
                        replacement = self.synonyms[word_clean]
                        if word != word_clean:
                            replacement = word.replace(word_clean, replacement)
                        synonym_normalized_words.append(replacement)
                    else:
                        synonym_normalized_words.append(word)
                else:
                    synonym_normalized_words.append(word)
            normalized = ' '.join(synonym_normalized_words)
            normalized = re.sub(r'\s+', ' ', normalized).strip()
            if trailing_punct and not normalized.endswith(trailing_punct):
                normalized = normalized + trailing_punct
            if question and question[0].isupper():
                normalized = normalized.capitalize()
            return normalized
        except Exception as e:
            logger.error(f"Normalization error: {e}", exc_info=True)
            return question.strip()
    
    def get_spell_corrections(self) -> Dict[str, str]:
        return self.spell_corrections.copy()
    
    def get_abbreviations(self) -> Dict[str, str]:
        return self.abbreviations.copy()
    
    def get_synonyms(self) -> Dict[str, str]:
        return self.synonyms.copy()