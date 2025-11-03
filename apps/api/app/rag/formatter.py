from __future__ import annotations

import re
import logging
from typing import Dict, Any, List, Optional
from urllib.parse import quote

logger = logging.getLogger(__name__)


class ResponseFormatter:
    """
    Formats LLM-generated answers with text formatting and source attribution.
    
    Handles:
    - Markdown/HTML-safe formatting
    - Source citations at bottom
    - Error handling for invalid/empty responses
    - Linkable document references
    """
    
    def __init__(self, document_preview_url: Optional[str] = None):
        self.document_preview_url = document_preview_url
        
        self.bullet_point_re = re.compile(r'^\s*[-•]\s+', flags=re.MULTILINE)
        self.numbered_list_re = re.compile(r'^\s*(\d+)\.\s+', flags=re.MULTILINE)
        
        self.leading_ws_re = re.compile(r'^[ \t]+', flags=re.MULTILINE)
        self.trailing_ws_re = re.compile(r'[ \t]+$', flags=re.MULTILINE)
        self.multi_space_re = re.compile(r'[ \t]{2,}')
        
        self.highlight_patterns = [
            (re.compile(r'\b(\d{4})\b', flags=re.IGNORECASE), r'**\1**'),
            (re.compile(r'\b(\d{1,2}/\d{1,2}/\d{4})\b', flags=re.IGNORECASE), r'**\1**'),
            (re.compile(r'\b(Khoa|Ngành|Chương trình|Đại học|Cao đẳng)\b', flags=re.IGNORECASE), r'**\1**'),
            (re.compile(r'\b(học kỳ|kỳ thi|tín chỉ|học phí)\b', flags=re.IGNORECASE), r'**\1**'),
            (re.compile(r'\b(giấy tờ|hồ sơ|đơn|bằng|chứng chỉ)\b', flags=re.IGNORECASE), r'**\1**'),
        ]
    
    def format(
        self, 
        raw_answer: str, 
        sources: List[Dict[str, Any]],
        fallback_triggered: bool = False
    ) -> Dict[str, Any]:
        if not raw_answer or not raw_answer.strip():
            logger.warning("Empty or invalid answer received")
            return self._format_error_response(sources)
        
        try:
            cleaned_text = self._clean_text(raw_answer)
            formatted_with_sources = self._add_source_attribution(cleaned_text, sources)
            enhanced_sources = self._enhance_sources(sources)
            
            return {
                "formatted_text": formatted_with_sources,
                "raw_text": raw_answer,
                "sources": enhanced_sources,
                "has_error": False,
                "fallback_triggered": fallback_triggered
            }
        except Exception as e:
            logger.error(f"Formatting error: {e}", exc_info=True)
            return self._format_error_response(sources)
    
    def _clean_text(self, text: str) -> str:
        if not text:
            return ""

        text = self.bullet_point_re.sub('- ', text)
        text = self.numbered_list_re.sub(r'\1. ', text)

        text = self.leading_ws_re.sub('', text)
        text = self.trailing_ws_re.sub('', text)
        text = self.multi_space_re.sub(' ', text)

        for pattern, replacement in self.highlight_patterns:
            text = pattern.sub(replacement, text)

        return text.strip()
    
    def _add_source_attribution(self, text: str, sources: List[Dict[str, Any]]) -> str:
        if not sources:
            return text
        # Gom các trang của cùng một tài liệu
        source_pages = {}
        for source in sources:
            source_name = source.get("source") or "Unknown"
            page = source.get("page")
            if source_name not in source_pages:
                source_pages[source_name] = set()
            if page is not None:
                try:
                    source_pages[source_name].add(int(page))
                except Exception:
                    pass
        source_lines = []
        for source_name, pages in source_pages.items():
            pages = sorted(pages)
            if pages:
                if len(pages) == 1:
                    page_ref = f"Trang {pages[0]}"
                else:
                    page_ref = f"Trang {pages[0]}–{pages[-1]}"
                source_lines.append(f"Nguồn: {source_name} ({page_ref})")
            else:
                source_lines.append(f"Nguồn: {source_name}")
        if source_lines:
            attribution = "\n\n---\n" + "\n".join(f"- {line}" for line in source_lines)
            return text + attribution
        return text
    
    def _enhance_sources(self, sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        enhanced = []
        for source in sources:
            doc_id = source.get("document_id")
            source_name = source.get("source") or "Unknown"
            page = source.get("page")
            
            preview_url = None
            if self.document_preview_url and doc_id:
                safe_doc_id = quote(str(doc_id))
                if page is not None:
                    preview_url = f"{self.document_preview_url}/{safe_doc_id}?page={page}"
                else:
                    preview_url = f"{self.document_preview_url}/{safe_doc_id}"
            
            enhanced.append({
                **source,
                "preview_url": preview_url,
                "display_name": self._clean_source_name(source_name)
            })
        
        return enhanced
    
    def _clean_source_name(self, source: str) -> str:
        if not source:
            return "Unknown"
        parts = source.replace("\\", "/").split("/")
        filename = parts[-1] if parts else source
        filename = filename.replace("uploads/", "").replace("../", "")
        
        return filename
    
    def _format_error_response(self, sources: List[Dict[str, Any]]) -> Dict[str, Any]:
        error_message = (
            "Xin lỗi, không thể tạo phản hồi lúc này. "
            "Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ."
        )
        
        return {
            "formatted_text": error_message,
            "raw_text": error_message,
            "sources": self._enhance_sources(sources) if sources else [],
            "has_error": True,
            "fallback_triggered": True
        }


default_formatter = ResponseFormatter()