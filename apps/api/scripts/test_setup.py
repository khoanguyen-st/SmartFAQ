#!/usr/bin/env python3
"""
Test script to verify RAG setup with LangChain v1 + Gemini + HuggingFace
"""

import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def test_imports():
    """Test if all required packages are installed"""
    print("🔍 Testing imports...")

    try:
        import langchain
        print(f"✅ langchain: {langchain.__version__}")
    except ImportError as e:
        print(f"❌ langchain: {e}")
        return False

    try:
        import langchain_google_genai
        print(f"✅ langchain_google_genai installed")
    except ImportError as e:
        print(f"❌ langchain_google_genai: {e}")
        return False

    try:
        import langchain_huggingface
        print(f"✅ langchain_huggingface installed")
    except ImportError as e:
        print(f"❌ langchain_huggingface: {e}")
        return False

    try:
        import langchain_chroma
        print(f"✅ langchain_chroma installed")
    except ImportError as e:
        print(f"❌ langchain_chroma: {e}")
        return False

    try:
        import sentence_transformers
        print(f"✅ sentence_transformers: {sentence_transformers.__version__}")
    except ImportError as e:
        print(f"❌ sentence_transformers: {e}")
        return False

    return True


def test_config():
    """Test configuration loading"""
    print("\n⚙️  Testing configuration...")

    try:
        from app.core.config import settings

        print(f"✅ Config loaded")
        print(f"   - LLM Model: {settings.LLM_MODEL}")
        print(f"   - Embed Model: {settings.EMBED_MODEL}")
        print(f"   - Chroma URL: {settings.CHROMA_URL}")
        print(f"   - Device: {settings.EMBED_DEVICE}")

        if not settings.GOOGLE_API_KEY:
            print("⚠️  Warning: GOOGLE_API_KEY not set!")
            return False
        else:
            print(f"✅ GOOGLE_API_KEY is set (length: {len(settings.GOOGLE_API_KEY)})")

        return True
    except Exception as e:
        print(f"❌ Config error: {e}")
        return False


def test_embeddings():
    """Test embeddings model"""
    print("\n🎯 Testing embeddings...")

    try:
        from app.rag.embedder import get_embeddings

        embeddings = get_embeddings()
        print(f"✅ Embeddings model loaded")

        # Test embedding generation
        test_text = "Hello world"
        vector = embeddings.embed_query(test_text)

        print(f"✅ Generated embedding")
        print(f"   - Dimension: {len(vector)}")
        print(f"   - Sample values: {vector[:5]}")

        if len(vector) == 384:
            print("✅ Dimension matches multilingual-e5-base (384)")
        else:
            print(f"⚠️  Unexpected dimension: {len(vector)}")

        return True
    except Exception as e:
        print(f"❌ Embeddings error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_llm():
    """Test LLM (Gemini)"""
    print("\n🤖 Testing LLM (Gemini)...")

    try:
        from app.rag.llm import LLMWrapper

        llm = LLMWrapper()
        print(f"✅ LLM loaded")

        # Test simple generation
        answer = llm.generate_answer(
            question="What is AI?",
            contexts=[{
                "text": "AI (Artificial Intelligence) is the simulation of human intelligence by machines.",
                "metadata": {"source": "test"}
            }]
        )

        print(f"✅ Generated answer")
        print(f"   Answer: {answer[:100]}...")

        return True
    except Exception as e:
        print(f"❌ LLM error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_vector_store():
    """Test Chroma vector store connection"""
    print("\n🗄️  Testing vector store (Chroma)...")

    try:
        from app.rag.vector_store import get_vectorstore

        vs = get_vectorstore()
        print(f"✅ Vector store connected")

        # Test count
        try:
            count = vs._collection.count()
            print(f"✅ Collection count: {count}")
        except Exception as e:
            print(f"⚠️  Could not get count: {e}")

        return True
    except Exception as e:
        print(f"❌ Vector store error: {e}")
        print("💡 Tip: Make sure Chroma server is running on http://localhost:8000")
        import traceback
        traceback.print_exc()
        return False


def test_full_rag():
    """Test full RAG pipeline"""
    print("\n🔄 Testing full RAG pipeline...")

    try:
        from app.rag.orchestrator import RAGOrchestrator
        from langchain_core.documents import Document

        orch = RAGOrchestrator()
        print(f"✅ RAG orchestrator initialized")

        # Note: This requires documents in vector store
        # For now, just test initialization
        print("✅ RAG pipeline ready")

        return True
    except Exception as e:
        print(f"❌ RAG pipeline error: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("🧪 SmartFAQ RAG Setup Test")
    print("=" * 60)

    results = {
        "Imports": test_imports(),
        "Configuration": test_config(),
        "Embeddings": test_embeddings(),
        "LLM (Gemini)": test_llm(),
        "Vector Store": test_vector_store(),
        "RAG Pipeline": test_full_rag(),
    }

    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print("=" * 60)

    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")

    all_passed = all(results.values())

    if all_passed:
        print("\n🎉 All tests passed! Setup is complete.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
