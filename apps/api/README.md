# SmartFAQ RAG System

## 🎯 Overview

Smart FAQ system sử dụng RAG (Retrieval-Augmented Generation) để trả lời câu hỏi của sinh viên dựa trên tài liệu của Đại học Greenwich Việt Nam.

### Technology Stack

- **LLM:** Google Gemini 2.5 Flash (via Gemini API)
- **Embeddings:** HuggingFace multilingual-e5-base (local)
- **Vector Store:** Chroma (HTTP client)
- **Framework:** LangChain v1.0
- **Backend:** FastAPI + Python 3.11+

## 🏗️ Architecture

```
┌─────────────┐
│   User      │
│  Question   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│      RAG Orchestrator           │
├─────────────────────────────────┤
│  1. Retrieve (top-k chunks)     │
│  2. Calculate confidence        │
│  3. Generate answer (Gemini)    │
└──────┬──────────────────────────┘
       │
       ├──► Retriever ──► Vector Store (Chroma)
       │                      │
       │                      ▼
       │                  Embeddings
       │                (multilingual-e5)
       │
       └──► LLM Wrapper ──► Gemini API
```

## 📁 Project Structure

```
apps/api/
├── app/
│   ├── rag/
│   │   ├── __init__.py
│   │   ├── embedder.py         # HuggingFace embeddings
│   │   ├── llm.py              # Gemini LLM wrapper
│   │   ├── vector_store.py     # Chroma vector store
│   │   ├── retriever.py        # Document retrieval
│   │   ├── orchestrator.py     # Main RAG pipeline
│   │   ├── document_processor.py # PDF/DOCX processing
│   │   └── document.py         # Document upload service
│   ├── api/                    # API endpoints
│   ├── core/                   # Config & security
│   ├── models/                 # Database models
│   ├── services/              # Business logic
│   └── workers/               # Celery tasks
├── scripts/
│   └── test_setup.py          # Setup verification
├── SETUP_LOCAL.md             # Setup guide
├── MIGRATION_V1.md           # Migration guide
└── pyproject.toml            # Dependencies
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- Google Gemini API key ([Get here](https://aistudio.google.com/app/apikey))

### 1. Clone & Setup

```bash
# Clone repository
git clone <your-repo>
cd SmartFAQ

# Run quick start script
chmod +x scripts/quick-start.sh
./scripts/quick-start.sh
```

### 2. Manual Setup (Alternative)

```bash
# Start services
docker-compose up -d postgres redis chroma

# Setup Python environment
cd apps/api
python -m venv venv
source venv/bin/activate
pip install -e .

# Setup environment
cp ../../.env.example .env
# Edit .env and set GOOGLE_API_KEY

# Run migrations
alembic upgrade head

# Test setup
python scripts/test_setup.py
```

### 3. Start API Server

```bash
cd apps/api
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🔧 Configuration

### Key Environment Variables

```bash
# Google Gemini LLM
GOOGLE_API_KEY=your-key-here
LLM_MODEL=gemini-2.0-flash-exp
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=2048

# HuggingFace Embeddings
EMBED_MODEL=intfloat/multilingual-e5-base
EMBED_DEVICE=cpu  # or cuda
EMBED_NORMALIZE=true
EMBED_BATCH=32

# Chroma Vector Store
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION=kb_main
CHROMA_METRIC=cosine

# RAG Settings
CONFIDENCE_THRESHOLD=0.65
TOP_K_RETRIEVAL=5
MAX_CONTEXT_CHARS=8000

# MongoDB (chat persistence)
MONGO_URL=mongodb://localhost:27017
MONGO_DB=smartfaq
MONGO_CHAT_COLLECTION=chat_messages
MONGO_SESSION_COLLECTION=chat_sessions
```

- Chat sessions are dual-written to Postgres and MongoDB.
- Chat messages, sources, and query logs are persisted in MongoDB only.

## 📊 RAG Components

### 1. Embedder (`embedder.py`)

Converts text to vector embeddings using multilingual-e5-base.

```python
from app.rag.embedder import get_embeddings

embeddings = get_embeddings()
vector = embeddings.embed_query("Your text here")
# Returns 384-dimensional vector
```

**Features:**

- ✅ Multilingual support (100+ languages)
- ✅ Vietnamese optimized
- ✅ Local inference (no API costs)
- ✅ GPU support (optional)
- ✅ Batch processing

### 2. LLM Wrapper (`llm.py`)

Manages Google Gemini API for answer generation.

```python
from app.rag.llm import LLMWrapper

llm = LLMWrapper()
answer = llm.generate_answer(
    question="What is AI?",
    contexts=[{"text": "...", "metadata": {...}}]
)
```

**Features:**

- ✅ Gemini 2.0 Flash (fast & free tier)
- ✅ Vietnamese prompts
- ✅ Context formatting with sources
- ✅ Async support
- ✅ Token management

### 3. Vector Store (`vector_store.py`)

Chroma HTTP client for vector storage and retrieval.

```python
from app.rag.vector_store import get_vectorstore, upsert_documents

# Get vectorstore
vs = get_vectorstore()

# Add documents
upsert_documents(documents)

# Search
results = vs.similarity_search("query", k=5)
```

**Features:**

- ✅ HTTP client (server-based)
- ✅ Metadata filtering
- ✅ Idempotent upserts (hash-based IDs)
- ✅ Cosine similarity
- ✅ Persistent storage

### 4. Retriever (`retriever.py`)

Handles document retrieval with scoring.

```python
from app.rag.retriever import Retriever

retriever = Retriever()
contexts = retriever.retrieve(
    query="How to enroll?",
    top_k=5,
    where={"document_type": "handbook"}
)
```

**Features:**

- ✅ Similarity search with scores
- ✅ Metadata filtering
- ✅ Confidence calculation
- ✅ MMR support (diversity)
- ✅ LangChain retriever interface

### 5. Orchestrator (`orchestrator.py`)

Main RAG pipeline coordinator.

```python
from app.rag.orchestrator import RAGOrchestrator

orch = RAGOrchestrator()
result = await orch.query(
    question="What are the tuition fees?",
    top_k=5,
    return_top_sources=3
)

# Returns:
# {
#     "answer": "...",
#     "confidence": 0.85,
#     "sources": [...],
#     "fallback_triggered": false,
#     "latency_ms": 1234
# }
```

**Features:**

- ✅ End-to-end RAG pipeline
- ✅ Confidence-based fallback
- ✅ Source tracking
- ✅ Performance metrics
- ✅ LCEL chain builder

### 6. Document Processor (`document_processor.py`)

Processes PDF and DOCX files into chunks.

```python
from app.rag.document_processor import DocumentProcessor

processor = DocumentProcessor(
    chunk_size=1000,
    chunk_overlap=200
)

documents = processor.process_document(
    file_path="handbook.pdf",
    document_id="doc-123",
    metadata={"type": "handbook"}
)
```

**Features:**

- ✅ PDF & DOCX support
- ✅ Smart chunking (page-aware)
- ✅ Metadata preservation
- ✅ Chunk ID generation
- ✅ Text cleaning

## 🔄 Document Upload Flow

```
1. User uploads PDF/DOCX
   ↓
2. DocumentService saves file & creates DB record
   ↓
3. DocumentProcessor extracts text & chunks
   ↓
4. Embedder generates vectors
   ↓
5. VectorStore indexes chunks
   ↓
6. Update DB status to "active"
```

## 🗄️ Database Migrations

### Quick Commands

```bash
cd apps/api

# Check migration status
make migrate-check

# Run migrations
make migrate

# Create new migration
make migrate-create MSG="add new field"

# Auto-merge multiple heads
make migrate-merge

# View migration history
make migrate-history
```

### Migration Conflict Detection

Hệ thống tự động phát hiện và xử lý migration conflicts qua:

- ✅ **Pre-push hook**: Block push nếu có multiple heads
- ✅ **CI check**: Fail CI nếu phát hiện conflict
- ✅ **Auto-merge**: Script tự động merge heads

📚 **Chi tiết:** Xem [MIGRATION_AUTO_CHECK.md](MIGRATION_AUTO_CHECK.md)

## 🧪 Testing

### Run All Tests

```bash
cd apps/api
python scripts/test_setup.py
```

### Test Individual Components

```bash
# Test embeddings
python -c "
from app.rag.embedder import get_embeddings
emb = get_embeddings()
vec = emb.embed_query('test')
print(f'Dim: {len(vec)}')
"

# Test LLM
python -c "
from app.rag.llm import LLMWrapper
llm = LLMWrapper()
ans = llm.generate_answer('Hi?', [{'text': 'Hello!', 'metadata': {}}])
print(ans)
"

# Test RAG
python -c "
from app.rag.orchestrator import RAGOrchestrator
import asyncio
orch = RAGOrchestrator()
result = asyncio.run(orch.query('What is AI?'))
print(result)
"
```

## 📈 Performance Tuning

### Embeddings Speed

```bash
# Use GPU (10x faster)
EMBED_DEVICE=cuda

# Increase batch size
EMBED_BATCH=64

# Use smaller model (faster but less accurate)
EMBED_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
```

### LLM Speed

```bash
# Use faster model
LLM_MODEL=gemini-1.5-flash

# Reduce max tokens
LLM_MAX_TOKENS=1024
```

### Retrieval Quality

```bash
# Increase top-k
TOP_K_RETRIEVAL=10

# Use MMR for diversity
search_type="mmr"

# Adjust confidence threshold
CONFIDENCE_THRESHOLD=0.7
```

## 🐛 Troubleshooting

### Issue: Import errors

```bash
# Reinstall dependencies
pip install -e . --force-reinstall
```

### Issue: Chroma connection refused

```bash
# Check if Chroma is running
docker ps | grep chroma
curl http://localhost:8000/api/v1/heartbeat
```

### Issue: Gemini API errors

```bash
# Check API key
echo $GOOGLE_API_KEY

# Check quota
# Visit: https://aistudio.google.com/app/apikey
```

### Issue: Slow embeddings

```bash
# Download model first
python -c "
from sentence_transformers import SentenceTransformer
SentenceTransformer('intfloat/multilingual-e5-base')
"
```

## 📚 Resources

- [Setup Guide](SETUP_LOCAL.md) - Detailed setup instructions
- [Migration Guide](MIGRATION_V1.md) - Upgrading to v1
- [LangChain v1 Docs](https://docs.langchain.com/oss/python/releases/langchain-v1)
- [Gemini API](https://ai.google.dev/gemini-api/docs)
- [multilingual-e5-base](https://huggingface.co/intfloat/multilingual-e5-base)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run tests: `python scripts/test_setup.py`
4. Submit PR

## 📝 License

[Your License]
