from __future__ import annotations
import re
import asyncio
import logging
from typing import Optional, Tuple
logging.getLogger("app.rag.language").setLevel(logging.DEBUG)
_vi_common_words = {
    "la","toi","ban","anh","chi","em","cai","con","mot","hai","ba","muon","khong","co","duoc",
    "nguoi","hoc","truong","day","nay","hoi","cho","lam","lam","du","ve","ve","ai","may","la",
    "chao","xin","cam","on","toi","la","duong","dang","viet","ngon","ngu","viet","nam"
}
_en_common_words = {
    "the","is","i","you","he","she","it","we","they","a","an","and","or","not","to","of",
    "in","on","for","with","that","this","there","here","hello","who","what","where"
}
def _has_diacritics(s: str) -> bool:
    return bool(re.search(r"[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]", s, re.IGNORECASE))
def _tokenize(words: str) -> list[str]:
    return [w for w in re.findall(r"[a-zA-Z0-9\u00C0-\u017F]+", words.lower())]
def detect_language_enhanced(text: str, llm_wrapper: Optional[object] = None, async_: bool = False) -> str:
    if not text or not text.strip():
        return "other"
    if _has_diacritics(text):
        return "vi"
    tokens = _tokenize(text)
    if not tokens:
        return "other"
    vi_hits = sum(1 for t in tokens if t in _vi_common_words)
    en_hits = sum(1 for t in tokens if t in _en_common_words)
    if vi_hits >= max(1, en_hits):
        if vi_hits >= 1 and len(tokens) >= 1:
            return "vi"
    if en_hits > vi_hits:
        return "en"
    if llm_wrapper is None:
        return "other"
    try:
        if async_ and hasattr(llm_wrapper, "agenerate"):
            prompt = "Classify the language of the following text as 'vi' (Vietnamese) or 'en' (English) or 'other'. Return only the code. Text:\n\n" + text
            coro = llm_wrapper.agenerate(prompt)
            result = asyncio.get_event_loop().run_until_complete(coro)
            out = result if isinstance(result, str) else getattr(result, "text", str(result))
            out = out.strip().lower()
            if out.startswith("vi"):
                return "vi"
            if out.startswith("en"):
                return "en"
            return "other"
        elif not async_ and hasattr(llm_wrapper, "generate"):
            prompt = "Classify the language of the following text as 'vi' or 'en' or 'other'. Return only the code.\n\n" + text
            result = llm_wrapper.generate(prompt)
            out = result if isinstance(result, str) else getattr(result, "text", str(result))
            out = out.strip().lower()
            if out.startswith("vi"):
                return "vi"
            if out.startswith("en"):
                return "en"
            return "other"
    except Exception:
        return "other"
    return "other"
def _simple_restore_word(word: str, wordlist: set[str]) -> str:
    if word in wordlist:
        return word
    lower = word.lower()
    if lower in _vi_common_words:
        return lower
    return word
def _heuristic_restore(text: str) -> str:
    tokens = re.split(r"(\W+)", text)
    restored = []
    for t in tokens:
        if re.match(r"^[A-Za-z0-9]+$", t):
            restored.append(_simple_restore_word(t, _vi_common_words))
        else:
            restored.append(t)
    return "".join(restored)
def restore_diacritics(text: str, llm_wrapper: Optional[object] = None, async_: bool = False, max_length_for_llm: int = 2000) -> str:
    if not text or _has_diacritics(text):
        return text
    if llm_wrapper is None:
        return _heuristic_restore(text)
    try:
        if len(text) > max_length_for_llm:
            short_prompt = "Restore Vietnamese diacritics for the following short text. If unsure, keep original.\n\n"
            pieces = []
            pos = 0
            step = max_length_for_llm
            while pos < len(text):
                chunk = text[pos:pos+step]
                pieces.append(chunk)
                pos += step
            out_chunks = []
            for p in pieces:
                prompt = short_prompt + p + "\n\nReturn only the restored text."
                if async_ and hasattr(llm_wrapper, "agenerate"):
                    coro = llm_wrapper.agenerate(prompt)
                    res = asyncio.get_event_loop().run_until_complete(coro)
                    out = res if isinstance(res, str) else getattr(res, "text", str(res))
                    out_chunks.append(out.strip())
                elif not async_ and hasattr(llm_wrapper, "generate"):
                    res = llm_wrapper.generate(prompt)
                    out = res if isinstance(res, str) else getattr(res, "text", str(res))
                    out_chunks.append(out.strip())
                else:
                    out_chunks.append(_heuristic_restore(p))
            return " ".join(out_chunks)
        else:
            prompt = "Restore Vietnamese diacritics for the following text. Return only the restored text.\n\n" + text
            if async_ and hasattr(llm_wrapper, "agenerate"):
                coro = llm_wrapper.agenerate(prompt)
                res = asyncio.get_event_loop().run_until_complete(coro)
                out = res if isinstance(res, str) else getattr(res, "text", str(res))
                return out.strip()
            elif not async_ and hasattr(llm_wrapper, "generate"):
                res = llm_wrapper.generate(prompt)
                out = res if isinstance(res, str) else getattr(res, "text", str(res))
                return out.strip()
            else:
                return _heuristic_restore(text)
    except Exception:
        return _heuristic_restore(text)
def normalize_text(text: str, llm_wrapper: Optional[object] = None, force_restore: bool = False, async_: bool = False) -> Tuple[str, str]:
    if text is None:
        return "other", ""
    txt = text.strip()
    lang = detect_language_enhanced(txt, llm_wrapper=llm_wrapper, async_=async_)
    if lang == "vi":
        if _has_diacritics(txt) and not force_restore:
            return "vi", txt
        restored = restore_diacritics(txt, llm_wrapper=llm_wrapper, async_=async_)
        return "vi", restored
    if lang == "en":
        return "en", txt
    if llm_wrapper is not None:
        try:
            prompt = "Given the following text, respond with language code and a normalized version separated by a TAB. Language codes: vi,en,other.\nText:\n" + txt + "\n\nFormat: <code>\\t<normalized>"
            if async_ and hasattr(llm_wrapper, "agenerate"):
                coro = llm_wrapper.agenerate(prompt)
                res = asyncio.get_event_loop().run_until_complete(coro)
                out = res if isinstance(res, str) else getattr(res, "text", str(res))
            elif not async_ and hasattr(llm_wrapper, "generate"):
                res = llm_wrapper.generate(prompt)
                out = res if isinstance(res, str) else getattr(res, "text", str(res))
            else:
                return "other", txt
            out = out.strip()
            if "\t" in out:
                code, norm = out.split("\t", 1)
                code = code.strip().lower()
                norm = norm.strip()
                if code in ("vi", "en"):
                    if code == "vi" and not _has_diacritics(norm):
                        norm = restore_diacritics(norm, llm_wrapper=llm_wrapper, async_=async_)
                    return code, norm
                return "other", txt
            return "other", txt
        except Exception:
            return "other", txt
    return "other", txt
