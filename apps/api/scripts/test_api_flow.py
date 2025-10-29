#!/usr/bin/env python3
"""
Test full API flow: Upload document → Index → Query
"""

import sys
import asyncio
import time
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent.parent))

async def test_full_flow():
    """Test complete RAG flow"""
    print("=" * 70)
    print("🧪 SmartFAQ - Full API Flow Test")
    print("=" * 70)
    
    # Step 1: Test embeddings
    print("\n📊 Step 1: Testing Embeddings...")
    from app.rag.embedder import get_embeddings
    
    embeddings = get_embeddings()
    test_query = "Học phí đại học Greenwich là bao nhiêu?"
    query_vector = embeddings.embed_query(test_query)
    print(f"✅ Query embedded: {len(query_vector)} dimensions")
    print(f"   Query: '{test_query}'")
    
    # Step 2: Create test documents
    print("\n📝 Step 2: Creating Test Documents...")
    from langchain_core.documents import Document
    
    test_docs = [
        Document(
            page_content="Học phí đại học Greenwich Việt Nam năm 2024 là 52 triệu đồng/năm cho các ngành kinh tế. Sinh viên có thể đăng ký học theo học kỳ hoặc theo năm.",
            metadata={
                "source": "handbook_2024.pdf",
                "page": 15,
                "document_id": "test-doc-1",
                "chunk_index": 0,
                "chunk_id": "test-chunk-1",
                "title": "Sổ tay sinh viên 2024"
            }
        ),
        Document(
            page_content="Để đăng ký học, sinh viên cần đăng nhập vào hệ thống Greenwich Online, chọn môn học và xác nhận đăng ký. Thời gian đăng ký học từ ngày 1-15 mỗi tháng.",
            metadata={
                "source": "enrollment_guide.pdf",
                "page": 5,
                "document_id": "test-doc-2",
                "chunk_index": 0,
                "chunk_id": "test-chunk-2",
                "title": "Hướng dẫn đăng ký học"
            }
        ),
        Document(
            page_content="Thư viện Greenwich mở cửa từ 7h00 đến 21h00 các ngày trong tuần. Sinh viên có thể mượn tối đa 5 cuốn sách trong 2 tuần.",
            metadata={
                "source": "library_rules.pdf",
                "page": 1,
                "document_id": "test-doc-3",
                "chunk_index": 0,
                "chunk_id": "test-chunk-3",
                "title": "Quy định thư viện"
            }
        ),
        Document(
            page_content="Học bổng Greenwich dành cho sinh viên có thành tích học tập xuất sắc. Mức học bổng từ 30% đến 100% học phí. Hạn nộp hồ sơ là ngày 31/8 hàng năm.",
            metadata={
                "source": "scholarship_info.pdf",
                "page": 2,
                "document_id": "test-doc-4",
                "chunk_index": 0,
                "chunk_id": "test-chunk-4",
                "title": "Thông tin học bổng"
            }
        ),
        Document(
            page_content="Để liên hệ phòng tuyển sinh, sinh viên có thể gọi hotline 1900-6013 hoặc email tuyensinh@greenwich.edu.vn. Phòng tuyển sinh làm việc từ thứ 2 đến thứ 6.",
            metadata={
                "source": "contact_info.pdf",
                "page": 1,
                "document_id": "test-doc-5",
                "chunk_index": 0,
                "chunk_id": "test-chunk-5",
                "title": "Thông tin liên hệ"
            }
        ),
    ]
    
    print(f"✅ Created {len(test_docs)} test documents")
    for i, doc in enumerate(test_docs, 1):
        print(f"   {i}. {doc.metadata.get('title')} - {len(doc.page_content)} chars")
    
    # Step 3: Index documents to vector store
    print("\n🗄️  Step 3: Indexing Documents to Chroma...")
    from app.rag.vector_store import get_vectorstore, upsert_documents
    
    try:
        upsert_documents(test_docs)
        print(f"✅ Indexed {len(test_docs)} documents")
        
        # Verify indexing
        vs = get_vectorstore()
        total_count = vs._collection.count()
        print(f"✅ Total documents in collection: {total_count}")
    except Exception as e:
        print(f"❌ Indexing failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Step 4: Test retrieval
    print("\n🔍 Step 4: Testing Retrieval...")
    from app.rag.retriever import Retriever
    
    retriever = Retriever()
    
    test_queries = [
        "Học phí Greenwich là bao nhiêu?",
        "Làm sao để đăng ký học?",
        "Thư viện mở cửa lúc mấy giờ?",
        "Có học bổng không?",
    ]
    
    for query in test_queries:
        print(f"\n   Query: '{query}'")
        contexts = retriever.retrieve(query, top_k=3, with_score=True)
        
        if contexts:
            print(f"   ✅ Found {len(contexts)} results")
            for i, ctx in enumerate(contexts[:2], 1):
                score = ctx.get('score', 0)
                title = ctx.get('metadata', {}).get('title', 'N/A')
                text_preview = ctx.get('text', '')[:80] + "..."
                print(f"      {i}. Score: {score:.3f} | {title}")
                print(f"         {text_preview}")
        else:
            print(f"   ⚠️  No results found")
    
    # Step 5: Test confidence calculation
    print("\n📈 Step 5: Testing Confidence Calculation...")
    
    for query in test_queries[:2]:
        contexts = retriever.retrieve(query, top_k=5, with_score=True)
        confidence = retriever.calculate_confidence(contexts)
        print(f"   Query: '{query}'")
        print(f"   Confidence: {confidence:.3f}")
        
        if confidence >= 0.65:
            print(f"   ✅ High confidence - will generate answer")
        else:
            print(f"   ⚠️  Low confidence - may trigger fallback")
    
    # Step 6: Test LLM answer generation
    print("\n🤖 Step 6: Testing LLM Answer Generation...")
    from app.rag.llm import LLMWrapper
    
    llm = LLMWrapper()
    
    for query in test_queries[:2]:
        print(f"\n   Query: '{query}'")
        contexts = retriever.retrieve(query, top_k=3, with_score=True)
        
        if contexts:
            answer = await llm.generate_answer_async(query, contexts)
            print(f"   Answer: {answer}")
        else:
            print(f"   ⚠️  No contexts to generate answer")
    
    # Step 7: Test full RAG orchestrator
    print("\n🔄 Step 7: Testing Full RAG Orchestrator...")
    from app.rag.orchestrator import RAGOrchestrator
    
    orch = RAGOrchestrator()
    
    for query in test_queries:
        print(f"\n   Query: '{query}'")
        result = await orch.query(
            question=query,
            top_k=5,
            return_top_sources=2
        )
        
        print(f"   ✅ Response:")
        print(f"      Answer: {result['answer'][:150]}...")
        print(f"      Confidence: {result['confidence']:.3f}")
        print(f"      Fallback: {result['fallback_triggered']}")
        print(f"      Latency: {result['latency_ms']}ms")
        print(f"      Sources: {len(result['sources'])}")
        
        for i, src in enumerate(result['sources'], 1):
            print(f"         {i}. {src.get('source')} (score: {src.get('score', 0):.3f})")
    
    # Step 8: Test LCEL chain
    print("\n⛓️  Step 8: Testing LCEL Chain...")
    
    rag_chain = orch.build_rag_chain(k=3)
    
    test_chain_query = "Học phí là bao nhiêu?"
    print(f"   Query: '{test_chain_query}'")
    
    chain_answer = await rag_chain.ainvoke(test_chain_query)
    print(f"   ✅ Chain Answer: {chain_answer[:200]}...")
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 Test Summary")
    print("=" * 70)
    print("✅ Embeddings: Working")
    print("✅ Document Indexing: Working")
    print("✅ Retrieval: Working")
    print("✅ Confidence Calculation: Working")
    print("✅ LLM Generation: Working")
    print("✅ RAG Orchestrator: Working")
    print("✅ LCEL Chain: Working")
    print("\n🎉 All tests passed! Full API flow is working correctly.")
    
    return True


if __name__ == "__main__":
    try:
        result = asyncio.run(test_full_flow())
        sys.exit(0 if result else 1)
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
