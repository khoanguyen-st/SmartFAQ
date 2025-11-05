"""
Script debug check flow RAG:
"""
import asyncio
import sys
import os
from pathlib import Path
from typing import Any, Dict


sys.path.insert(0, str(Path(__file__).parent.parent))

from app.rag.orchestrator import RAGOrchestrator
from app.rag.llm import LLMWrapper
from app.rag.retriever import Retriever
from app.core.config import settings


def print_section(title: str):
    """section and format ."""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)


def print_subsection(title: str):
    """ subsection."""
    print(f"\n--- {title} ---")


async def debug_rag_flow(question: str):
    """
    Debug flow RAG and show step.
    """
    print_section("🔍 DEBUG RAG FLOW - KIỂM TRA TƯƠNG TÁC VỚI GEMINI")


    print_subsection("1. Khởi tạo components")
    retriever = Retriever()
    llm_wrapper = LLMWrapper()
    orchestrator = RAGOrchestrator(retriever=retriever, llm_wrapper=llm_wrapper)

    print(f"   ✓ Retriever: {type(retriever).__name__}")
    print(f"   ✓ LLM Wrapper: {type(llm_wrapper).__name__}")
    print(f"   ✓ LLM Model: {settings.LLM_MODEL}")
    print(f"   ✓ Temperature: {settings.LLM_TEMPERATURE}")
    print(f"   ✓ Max Tokens: {settings.LLM_MAX_TOKENS}")


    print_section("2. RETRIEVE DOCUMENTS (Tìm kiếm trong vector store)")
    print(f"   Câu hỏi: '{question}'")
    print(f"   Top-K: 5")

    contexts = retriever.retrieve(
        query=question,
        top_k=5,
        with_score=True,
    )

    print(f"\n   ✅ Tìm thấy {len(contexts)} document chunks:")
    for i, ctx in enumerate(contexts, start=1):
        score = ctx.get("score", 0.0)
        source = ctx.get("source", "N/A")
        page = ctx.get("page")
        text_preview = ctx.get("text", "")[:100] + "..." if len(ctx.get("text", "")) > 100 else ctx.get("text", "")

        print(f"\n   📄 Chunk {i}:")
        print(f"      • Score: {score:.4f}")
        print(f"      • Source: {source}")
        if page:
            print(f"      • Page: {page}")
        print(f"      • Content preview: {text_preview}")
        print(f"      • Full length: {len(ctx.get('text', ''))} ký tự")

    print_section("3. TÍNH CONFIDENCE (Độ tin cậy)")
    confidence = retriever.calculate_confidence(contexts)
    threshold = settings.CONFIDENCE_THRESHOLD
    print(f"   Confidence: {confidence:.4f}")
    print(f"   Threshold: {threshold:.4f}")
    print(f"   Status: {'✅ ĐỦ TIN CẬY' if confidence >= threshold else '⚠️ THẤP - vẫn sẽ gọi Gemini nhưng có cảnh báo'}")


    print_section("4. FORMAT CONTEXT (Sắp xếp document chunks thành prompt)")
    context_text = llm_wrapper.format_contexts(contexts, max_sources=8)

    print(f"   Context length: {len(context_text)} ký tự")
    print(f"   Max context chars: {llm_wrapper.max_context_chars}")
    print(f"\n   📝 CONTEXT TEXT (sẽ gửi đến Gemini):")
    print("   " + "-" * 76)


    for line in context_text.split("\n"):
        print(f"   {line}")
    print("   " + "-" * 76)


    print_section("5. PROMPT TEMPLATE (Mẫu prompt gửi đến Gemini)")
    print("   System Prompt:")
    for line in llm_wrapper.system_prompt.split("\n"):
        print(f"      {line}")

    print("\n   Prompt Structure:")
    print("      [System] Bạn là trợ lý AI... (rules)")
    print("      [System] Context:\n{context}")
    print("      [Human] {question}")


    print_section("6. PROMPT HOÀN CHỈNH (Prompt cuối cùng gửi đến Gemini)")


    messages = llm_wrapper.prompt.format_messages(
        context=context_text,
        question=question
    )

    print("   Messages structure:")
    for i, msg in enumerate(messages, start=1):
        msg_type = msg.__class__.__name__
        content_preview = msg.content[:200] + "..." if len(msg.content) > 200 else msg.content
        print(f"\n   Message {i} ({msg_type}):")
        print(f"      {content_preview}")

    # Call gemini API
    print_section("7. GỌI GEMINI API (Generate answer)")
    print("   ⏳ Đang gọi Gemini API...")

    try:
        answer = await llm_wrapper.generate_answer_async(question, contexts)
        print(f"   ✅ Thành công!")
        print(f"\n   📤 Response từ Gemini:")
        print("   " + "-" * 76)

        for line in answer.split("\n"):
            print(f"   {line}")
        print("   " + "-" * 76)
    except Exception as e:
        print(f"   ❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()
        return

    # Result
    print_section("8. KẾT QUẢ CUỐI CÙNG (Từ RAGOrchestrator)")
    result = await orchestrator.query(
        question=question,
        top_k=5,
        return_top_sources=3,
    )

    print(f"   Answer: {result['answer']}")
    print(f"   Confidence: {result['confidence']}")
    print(f"   Fallback triggered: {result['fallback_triggered']}")
    print(f"   Latency: {result['latency_ms']} ms")
    print(f"\n   Sources:")
    for i, src in enumerate(result['sources'], start=1):
        print(f"      {i}. {src.get('source')} (page {src.get('page', 'N/A')}, score: {src.get('score', 0):.4f})")

    print_section("✅ HOÀN TẤT")


if __name__ == "__main__":
    # Set UTF-8 encoding for Windows console
    import sys
    if sys.platform == "win32":
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

    #Example question
    question = "Greenwich University Vietnam Tuition Fees"

    if len(sys.argv) > 1:
        question = " ".join(sys.argv[1:])

    print(f"\n🚀 Bắt đầu debug RAG flow với câu hỏi: '{question}'\n")

    asyncio.run(debug_rag_flow(question))

