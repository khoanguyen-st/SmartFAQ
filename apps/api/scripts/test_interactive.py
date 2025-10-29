#!/usr/bin/env python3
"""
Interactive test script for RAG system
"""

import sys
import asyncio
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent.parent))

async def interactive_test():
    """Interactive RAG testing"""
    print("=" * 70)
    print("💬 SmartFAQ - Interactive RAG Test")
    print("=" * 70)
    print()
    print("This will test the RAG system with your custom queries.")
    print("Type 'quit' or 'exit' to stop.")
    print()
    
    # Initialize components
    print("📦 Initializing components...")
    from app.rag.orchestrator import RAGOrchestrator
    
    orch = RAGOrchestrator()
    print("✅ RAG system ready!")
    print()
    
    # Check if we have documents
    from app.rag.vector_store import get_vectorstore
    vs = get_vectorstore()
    
    try:
        count = vs._collection.count()
        print(f"📚 Found {count} documents in vector store")
        
        if count == 0:
            print()
            print("⚠️  Warning: No documents in vector store!")
            print("   Run first: python scripts/test_api_flow.py")
            print("   Or upload documents via API")
            print()
    except Exception as e:
        print(f"⚠️  Could not check document count: {e}")
        print()
    
    print("━" * 70)
    print()
    
    # Interactive loop
    while True:
        try:
            # Get user input
            query = input("🤔 Your question: ").strip()
            
            if not query:
                continue
            
            if query.lower() in ['quit', 'exit', 'q']:
                print("\n👋 Goodbye!")
                break
            
            # Special commands
            if query.lower() == 'help':
                print("\n📖 Available commands:")
                print("   - Type any question to query the RAG system")
                print("   - 'stats' - Show system statistics")
                print("   - 'examples' - Show example queries")
                print("   - 'quit' or 'exit' - Exit the program")
                print()
                continue
            
            if query.lower() == 'examples':
                print("\n📝 Example queries:")
                print("   - Học phí đại học Greenwich là bao nhiêu?")
                print("   - Làm thế nào để đăng ký học?")
                print("   - Thư viện mở cửa lúc mấy giờ?")
                print("   - Có học bổng nào không?")
                print("   - Liên hệ phòng tuyển sinh như thế nào?")
                print()
                continue
            
            if query.lower() == 'stats':
                print("\n📊 System Statistics:")
                try:
                    count = vs._collection.count()
                    print(f"   Documents in vector store: {count}")
                except:
                    print("   Could not retrieve stats")
                print()
                continue
            
            # Process query
            print()
            print("🔍 Processing...")
            
            result = await orch.query(
                question=query,
                top_k=5,
                return_top_sources=3
            )
            
            # Display results
            print()
            print("━" * 70)
            print("📝 Answer:")
            print("━" * 70)
            print()
            print(result['answer'])
            print()
            
            # Display metadata
            print("━" * 70)
            print("📊 Metadata:")
            print("━" * 70)
            print(f"   Confidence: {result['confidence']:.2%}")
            print(f"   Fallback Triggered: {'Yes' if result['fallback_triggered'] else 'No'}")
            print(f"   Response Time: {result['latency_ms']}ms")
            print(f"   Sources Used: {len(result['sources'])}")
            
            # Display sources
            if result['sources']:
                print()
                print("━" * 70)
                print("📚 Sources:")
                print("━" * 70)
                for i, source in enumerate(result['sources'], 1):
                    score = source.get('score')
                    src = source.get('source', 'N/A')
                    page = source.get('page')
                    
                    score_str = f"{score:.2%}" if score else "N/A"
                    page_str = f" (page {page})" if page else ""
                    
                    print(f"   {i}. {src}{page_str} - Relevance: {score_str}")
            
            print()
            print("━" * 70)
            print()
            
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            print()


if __name__ == "__main__":
    try:
        asyncio.run(interactive_test())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
        sys.exit(0)
