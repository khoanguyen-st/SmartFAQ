"""Mock LLM for development without Google API key."""

from typing import Any, Dict, Optional, Sequence, Union

from langchain_core.documents import Document
from langchain_core.messages import AIMessage, BaseMessage


class MockLLMWrapper:
    """Mock LLM wrapper that returns sample responses without requiring external API."""

    def __init__(
        self,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_context_chars: int = 8000,
        max_tokens: Optional[int] = None,
    ):
        self.model = model or "mock-gemini-pro"
        self.temperature = temperature or 0.7
        self.max_context_chars = max_context_chars
        self.max_tokens = max_tokens or 1024

    def ask(
        self,
        question: str,
        docs: Optional[Sequence[Union[Document, Dict[str, Any]]]] = None,
    ) -> str:
        """
        Mock response based on question keywords.
        Returns sample answers for common questions.
        """
        q_lower = question.lower()

        # Vietnamese responses
        if any(word in q_lower for word in ["xin chào", "hello", "hi", "chào"]):
            return "Xin chào! Tôi là trợ lý AI của Đại học Greenwich Việt Nam. Tôi có thể giúp gì cho bạn hôm nay?"

        if any(word in q_lower for word in ["học phí", "tuition", "fee"]):
            return (
                "Học phí tại Đại học Greenwich Việt Nam dao động từ 40-60 triệu đồng/năm tùy theo chương trình học. "
                "Để biết thông tin chính xác, bạn vui lòng liên hệ phòng Tài chính qua email: finance@greenwich.edu.vn "
                "hoặc số điện thoại: 028 3859 0000."
            )

        if any(word in q_lower for word in ["đăng ký", "register", "enroll", "môn học"]):
            return (
                "Để đăng ký môn học, bạn đăng nhập vào hệ thống MyGreenwich tại https://mygreenwich.edu.vn, "
                "chọn mục 'Đăng ký môn học' và làm theo hướng dẫn. Thời gian đăng ký thường mở vào đầu mỗi học kỳ. "
                "Nếu gặp khó khăn, vui lòng liên hệ phòng Đào tạo."
            )

        if any(word in q_lower for word in ["thời khóa biểu", "schedule", "timetable"]):
            return (
                "Bạn có thể xem thời khóa biểu cá nhân trên hệ thống MyGreenwich. "
                "Đăng nhập vào https://mygreenwich.edu.vn và chọn mục 'Thời khóa biểu'. "
                "Lịch học sẽ được cập nhật định kỳ và có thể thay đổi, vui lòng kiểm tra thường xuyên."
            )

        if any(word in q_lower for word in ["thư viện", "library", "sách"]):
            return (
                "Thư viện Greenwich mở cửa từ 7:00 - 21:00 các ngày trong tuần và 8:00 - 17:00 vào cuối tuần. "
                "Bạn có thể mượn sách bằng thẻ sinh viên và tìm kiếm tài liệu online tại: library.greenwich.edu.vn. "
                "Liên hệ: library@greenwich.edu.vn."
            )

        if any(word in q_lower for word in ["ký túc xá", "dormitory", "kí túc", "ktx"]):
            return (
                "Đại học Greenwich có ký túc xá dành cho sinh viên với mức giá từ 1.5-3 triệu đồng/tháng. "
                "Để đăng ký, vui lòng nộp đơn tại phòng Công tác sinh viên hoặc email: student.affairs@greenwich.edu.vn. "
                "Số phòng có giới hạn, nên đăng ký sớm."
            )

        if any(word in q_lower for word in ["học bổng", "scholarship"]):
            return (
                "Greenwich có nhiều loại học bổng: học bổng thành tích, học bổng tài năng, và học bổng hỗ trợ. "
                "Thông tin chi tiết và cách đăng ký tại: https://greenwich.edu.vn/scholarships hoặc "
                "liên hệ phòng Tuyển sinh: admissions@greenwich.edu.vn."
            )

        if any(word in q_lower for word in ["liên hệ", "contact", "email", "phone"]):
            return (
                "Thông tin liên hệ Đại học Greenwich Việt Nam:\n"
                "- Địa chỉ: 64 Võ Văn Ngân, Q. Thủ Đức, TP.HCM\n"
                "- Điện thoại: 028 3859 0000\n"
                "- Email: info@greenwich.edu.vn\n"
                "- Website: https://greenwich.edu.vn"
            )

        # English responses
        if "tuition" in q_lower or "fee" in q_lower:
            return (
                "Tuition fees at Greenwich University Vietnam range from 40-60 million VND per year depending on the program. "
                "For exact information, please contact the Finance Office at finance@greenwich.edu.vn or call 028 3859 0000."
            )

        # Context-based response if docs provided
        if docs and len(docs) > 0:
            return (
                "Dựa trên thông tin tôi tìm thấy, câu trả lời cho câu hỏi của bạn như sau: "
                "[Đây là câu trả lời mẫu dựa trên tài liệu được cung cấp]. "
                "Vui lòng tham khảo tài liệu gốc để biết chi tiết đầy đủ."
            )

        # Default response
        return (
            "Tôi không tìm thấy thông tin cụ thể về câu hỏi này trong cơ sở dữ liệu. "
            "Vui lòng liên hệ phòng ban liên quan hoặc email info@greenwich.edu.vn để được hỗ trợ tốt hơn."
        )

    def ask_with_history(
        self,
        question: str,
        history: Optional[Sequence[BaseMessage]] = None,
    ) -> AIMessage:
        """
        Mock chat with history support.
        Returns AIMessage with sample content.
        """
        # Check if question references previous context
        q_lower = question.lower()
        if any(word in q_lower for word in ["đó", "that", "it", "vậy", "thế"]) and history:
            response = (
                "Dựa trên cuộc trò chuyện trước đó, tôi hiểu bạn đang hỏi về thông tin liên quan. "
                "Vui lòng cung cấp thêm chi tiết để tôi có thể hỗ trợ tốt hơn."
            )
        else:
            # Use the regular ask method
            response = self.ask(question)

        return AIMessage(content=response)

    def stream_chat(
        self,
        question: str,
        history: Optional[Sequence[BaseMessage]] = None,
    ):
        """
        Mock streaming response.
        Yields chunks of the response.
        """
        response = self.ask(question)
        # Simulate streaming by splitting into words
        words = response.split()
        for word in words:
            yield word + " "
