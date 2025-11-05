from langdetect import detect_langs, DetectorFactory
import re

DetectorFactory.seed = 0

# Ký tự dấu tiếng Việt (lowercase)
VIETNAMESE_DIACRITIC_RE = re.compile(
    r"[ắằấầẹẽỉộớợụủỹáàảãạéèẻẽíìỉĩịóòỏõọúùủũụôơưăêđ]", re.IGNORECASE
)

def detect_language(text: str) -> tuple[str, float]:
    """
    Return (lang_code, confidence)
    lang_code: 'vi', 'en', or other iso code; 'und' if unknown
    confidence: 0..1 (probability-like). Heuristic Vietnamese returns high confidence.
    """
    if not text or not text.strip():
        return ("und", 0.0)

    txt = text.strip()

    # 1) Heuristic: nếu có dấu tiếng Việt -> "vi"
    if VIETNAMESE_DIACRITIC_RE.search(txt):
        return ("vi", 0.99)

    # 2) Try langdetect
    try:
        langs = detect_langs(txt)
        if not langs:
            return ("und", 0.0)
        top = langs[0]
        lang = top.lang
        prob = float(top.prob)
        # Normalize: if langdetected 'vi' -> 'vi', 'en' -> 'en'
        if lang.startswith("vi"):
            return ("vi", prob)
        if lang.startswith("en"):
            return ("en", prob)
        return (lang, prob)
    except Exception:
        return ("und", 0.0)
