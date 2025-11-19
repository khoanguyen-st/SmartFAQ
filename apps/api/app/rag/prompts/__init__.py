"""
AI Prompts for Natural Language Understanding (NLU) Components
This package contains system prompts for:
- Question Normalization (spell correction, abbreviation expansion, synonym normalization)
- Intent Detection (classifying user questions into specific intents)
- Entity Extraction (extracting key entities from questions)
All prompts are designed to handle both Vietnamese (with/without diacritics) and English.
"""

from .prompts_entity_extractor import get_entity_extraction_prompt
from .prompts_intent_detector import get_intent_detection_prompt
from .prompts_normalizer import get_normalization_prompt

__all__ = [
    "get_normalization_prompt",
    "get_intent_detection_prompt",
    "get_entity_extraction_prompt",
]