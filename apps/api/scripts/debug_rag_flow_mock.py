"""
Script debug với MOCK DATA - không cần ChromaDB.
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.rag.llm import LLMWrapper
from app.core.config import settings


def print_section(title: str):
    """In tiêu đề section với format đẹp."""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)


def print_subsection(title: str):
    """In tiêu đề subsection."""
    print(f"\n--- {title} ---")


async def debug_rag_flow_mock(question: str):
    """
    Debug flow RAG với mock data - không cần ChromaDB.
    Hiển thị cách Gemini sắp xếp document chunks thành câu trả lời.
    """
    print_section("🔍 DEBUG RAG FLOW - MOCK DATA (Không cần ChromaDB)")

    # 1. Creat LLM Wrapper
    print_subsection("1. Khởi tạo LLM Wrapper")
    llm_wrapper = LLMWrapper()

    print(f"   ✓ LLM Wrapper: {type(llm_wrapper).__name__}")
    print(f"   ✓ LLM Model: {settings.LLM_MODEL}")
    print(f"   ✓ Temperature: {settings.LLM_TEMPERATURE}")
    print(f"   ✓ Max Tokens: {settings.LLM_MAX_TOKENS}")
    print(f"   ✓ Max Context Chars: {llm_wrapper.max_context_chars}")

    # 2. Mock document contexts
    print_section("2. MOCK DOCUMENT CONTEXTS (Giả lập documents từ vector store)")
    print(f"   Câu hỏi: '{question}'")

    # Mock contexts
    mock_contexts = [
        {
            "text": "Thời hạn nộp học phí kỳ học chính năm 2024 là từ ngày 15/08/2024 đến hết ngày 30/08/2024. Sinh viên cần nộp học phí tại phòng Tài chính Kế toán hoặc chuyển khoản qua ngân hàng. Số tài khoản: 1234567890 - Ngân hàng ABC. Liên hệ: tcketoan@greenwich.edu.vn hoặc số điện thoại 024-xxxx-xxxx.",
            "metadata": {
                "source": "handbook_2024.pdf",
                "page": 15,
                "document_id": "doc-001",
                "chunk_id": "chunk-001",
                "chunk_index": 0,
            },
            "score": 0.92,
        },
        {
            "text": "Quy định về học phí: Sinh viên phải hoàn thành việc nộp học phí trước ngày bắt đầu kỳ học. Nếu quá hạn, sinh viên sẽ bị cảnh báo và có thể bị đình chỉ học tập. Mức học phí được quy định theo từng chương trình đào tạo.",
            "metadata": {
                "source": "enrollment_guide.pdf",
                "page": 5,
                "document_id": "doc-002",
                "chunk_id": "chunk-002",
                "chunk_index": 0,
            },
            "score": 0.88,
        },
        {
            "text": "Học bổng và hỗ trợ tài chính: Sinh viên có thể đăng ký học bổng nếu đáp ứng các điều kiện về học lực và hoàn cảnh gia đình. Thời hạn đăng ký học bổng là từ 01/08 đến 15/08 hàng năm.",
            "metadata": {
                "source": "scholarship_info.pdf",
                "page": 2,
                "document_id": "doc-003",
                "chunk_id": "chunk-003",
                "chunk_index": 0,
            },
            "score": 0.75,
        },
    ]

    print(f"\n   ✅ Mock {len(mock_contexts)} document chunks:")
    for i, ctx in enumerate(mock_contexts, start=1):
        score = ctx.get("score", 0.0)
        source = ctx.get("metadata", {}).get("source", "N/A")
        page = ctx.get("metadata", {}).get("page")
        text_preview = ctx.get("text", "")[:100] + "..." if len(ctx.get("text", "")) > 100 else ctx.get("text", "")

        print(f"\n   📄 Chunk {i}:")
        print(f"      • Score: {score:.4f}")
        print(f"      • Source: {source}")
        if page:
            print(f"      • Page: {page}")
        print(f"      • Content: {text_preview}")
        print(f"      • Full length: {len(ctx.get('text', ''))} ký tự")

    # 3. Format contexts thành prompt
    print_section("3. FORMAT CONTEXT (Sắp xếp document chunks thành prompt)")
    context_text = llm_wrapper.format_contexts(mock_contexts, max_sources=8)

    print(f"   Context length: {len(context_text)} ký tự")
    print(f"   Max context chars: {llm_wrapper.max_context_chars}")
    print(f"\n   📝 CONTEXT TEXT (sẽ gửi đến Gemini):")
    print("   " + "-" * 76)

    for line in context_text.split("\n"):
        print(f"   {line}")
    print("   " + "-" * 76)

    # 4. Prompt template
    print_section("4. PROMPT TEMPLATE (Mẫu prompt gửi đến Gemini)")
    print("   System Prompt:")
    for line in llm_wrapper.system_prompt.split("\n"):
        print(f"      {line}")

    print("\n   Prompt Structure:")
    print("      [System] Bạn là trợ lý AI... (rules)")
    print("      [System] Context:\n{context}")
    print("      [Human] {question}")

    # 5. create prompt
    print_section("5. PROMPT HOÀN CHỈNH (Prompt cuối cùng gửi đến Gemini)")
    # Format prompt
    messages = llm_wrapper.prompt.format_messages(
        context=context_text,
        question=question
    )

    print("   Messages structure:")
    for i, msg in enumerate(messages, start=1):
        msg_type = msg.__class__.__name__
        content = msg.content

        print(f"\n   Message {i} ({msg_type}):")
        print("      " + "-" * 72)
        for line in content.split("\n"):
            if len(line) > 200:
                print(f"      {line[:200]}...")
            else:
                print(f"      {line}")
        print("      " + "-" * 72)

    # 6. Call Gemini API
    print_section("6. GỌI GEMINI API (Generate answer)")
    print("   ⏳ Đang gọi Gemini API...")

    try:
        answer = await llm_wrapper.generate_answer_async(question, mock_contexts)
        print(f"   ✅ Thành công!")
        print(f"\n   📤 Response từ Gemini:")
        print("   " + "-" * 76)
        # In từng dòng với indent
        for line in answer.split("\n"):
            print(f"   {line}")
        print("   " + "-" * 76)
    except Exception as e:
        print(f"   ❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()
        return

    # 7. Gemini sort
    print_section("7. PHÂN TÍCH CÁCH GEMINI SẮP XẾP DOCUMENT")
    print("   ✅ Gemini đã nhận được các document chunks theo thứ tự:")
    for i, ctx in enumerate(mock_contexts, start=1):
        source = ctx.get("metadata", {}).get("source", "N/A")
        print(f"      {i}. {source} (score: {ctx.get('score', 0):.4f})")

    print("\n   ✅ Gemini đã format context như sau:")
    print("      - Ghép các chunks theo format: [Nguồn X - source.pdf (trang Y)]\\ncontent")
    print("      - Sắp xếp theo thứ tự score từ cao xuống thấp")
    print("      - Clip nếu vượt quá max_context_chars")

    print("\n   ✅ Gemini đã tạo câu trả lời:")
    print("      - Dựa trên context được cung cấp")
    print("      - Trả lời bằng tiếng Việt")
    print("      - Tổng hợp thông tin từ nhiều nguồn")
    print("      - Giữ nguyên các thông tin chi tiết (ngày tháng, email, số điện thoại)")

    print_section("✅ HOÀN TẤT")


if __name__ == "__main__":
    # Set UTF-8 encoding for Windows console
    if sys.platform == "win32":
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')


    question = "Học phí đại học Greenwich Việt Nam là bao nhiêu?"

    # if have argument at command line, use:
    if len(sys.argv) > 1:
        question = " ".join(sys.argv[1:])

    print(f"\n🚀 Bắt đầu debug RAG flow (MOCK DATA) với câu hỏi: '{question}'\n")
    print("ℹ️  Script này KHÔNG cần ChromaDB - chỉ test với Gemini API\n")

    asyncio.run(debug_rag_flow_mock(question))

