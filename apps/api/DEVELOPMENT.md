# 🛠️ Development Guide for Interns

Hướng dẫn phát triển dành cho sinh viên thực tập làm việc với SmartFAQ RAG System.

## 📋 Table of Contents

- [Before You Start](#before-you-start)
- [Development Workflow](#development-workflow)
- [Code Organization](#code-organization)
- [Common Tasks](#common-tasks)
- [Python Best Practices](#python-best-practices)
- [RAG Concepts](#rag-concepts)
- [Testing Guidelines](#testing-guidelines)
- [Debugging Tips](#debugging-tips)
- [Common Mistakes](#common-mistakes)

---

## 🎯 Before You Start

### Required Knowledge

**Cần biết:**

- ✅ Python basics (functions, classes, async/await)
- ✅ REST API concepts (GET, POST, JSON)
- ✅ Git basics (clone, commit, push, pull)

**Sẽ học trong quá trình:**

- 📚 RAG (Retrieval-Augmented Generation)
- 📚 Vector embeddings & similarity search
- 📚 LangChain framework
- 📚 FastAPI web framework

### Setup Your Environment

```bash
# 1. Clone & setup (follow README.md first)
cd SmartFAQ/apps/api
source venv/bin/activate

# 2. Install development tools
pip install -e ".[dev]"

# 3. Setup IDE (VS Code recommended)
# Install extensions:
# - Python (Microsoft)
# - Pylance (Microsoft)
# - Black Formatter
```

### Understanding the Stack

```
User Question
    ↓
FastAPI (API endpoints) ← You will work here mostly
    ↓
RAG Orchestrator (main logic) ← Learn this first
    ↓
├── Retriever (find relevant docs) ← Understand how search works
│   └── Vector Store (Chroma) ← Just use it, don't modify
│
├── LLM (Gemini) ← Generate answers
│   └── Prompt templates ← You can customize these
│
└── Embedder (text → vectors) ← Just use it, don't modify
```

---

## 🔄 Development Workflow

### Step-by-Step Process

#### 1. **Pick a Task**

Ví dụ: "Add document list API"

#### 2. **Understand Requirements**

```python
# What should the API do?
# GET /api/docs → List all documents
# Response: {"documents": [...], "total": 10}
```

#### 3. **Find Where to Add Code**

```bash
# API endpoints → app/api/
# Business logic → app/services/
# Database models → app/models/
# RAG logic → app/rag/
```

#### 4. **Write Code (Start Small)**

```python
# app/api/docs.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.document import Document

router = APIRouter()

@router.get("/")
async def list_documents(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10
):
    """
    List all documents with pagination.

    Args:
        skip: Number of documents to skip (for pagination)
        limit: Maximum number of documents to return

    Returns:
        List of documents with metadata
    """
    # Query database
    documents = db.query(Document)\
                  .offset(skip)\
                  .limit(limit)\
                  .all()

    total = db.query(Document).count()

    return {
        "documents": [doc.to_dict() for doc in documents],
        "total": total,
        "skip": skip,
        "limit": limit
    }
```

#### 5. **Test Your Code**

```bash
# Start server
uvicorn app.main:app --reload

# Test with curl
curl http://localhost:8000/api/docs

# Or use test script
python scripts/test_api_endpoints.sh
```

#### 6. **Add Tests**

```python
# tests/test_docs_api.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_documents():
    response = client.get("/api/docs")
    assert response.status_code == 200
    assert "documents" in response.json()
    assert "total" in response.json()
```

#### 7. **Commit & Push**

```bash
git checkout -b feature/list-documents-api
git add .
git commit -m "Add document list API with pagination"
git push origin feature/list-documents-api
```

---

## 📂 Code Organization

### Where to Put Your Code

| Task                 | Location               | Example                            |
| -------------------- | ---------------------- | ---------------------------------- |
| Add API endpoint     | `app/api/*.py`         | `app/api/docs.py`                  |
| Add database model   | `app/models/*.py`      | `app/models/document.py`           |
| Add business logic   | `app/services/*.py`    | `app/services/document_service.py` |
| Modify RAG logic     | `app/rag/*.py`         | `app/rag/orchestrator.py`          |
| Add background task  | `app/workers/tasks.py` | Celery tasks                       |
| Add utility function | `app/utils/*.py`       | Helper functions                   |

### File Naming Conventions

```python
# ✅ Good - descriptive, lowercase, underscores
document_service.py
user_authentication.py
query_logger.py

# ❌ Bad - vague, camelCase, hyphens
service.py
UserAuth.py
query-logger.py
```

### Function/Class Naming

```python
# ✅ Functions: verb_noun, lowercase_with_underscores
def get_document(doc_id: str) -> Document:
    pass

def calculate_confidence_score(contexts: list) -> float:
    pass

# ✅ Classes: PascalCase, noun
class DocumentService:
    pass

class RAGOrchestrator:
    pass

# ❌ Bad naming
def document(id):  # Vague
    pass

def GetDocument(id):  # Wrong case
    pass
```

---

## 🔨 Common Tasks

### Task 1: Add a New API Endpoint

**Requirement:** Add `/api/docs/{doc_id}` to get document details

```python
# Step 1: Define in app/api/docs.py
from fastapi import HTTPException

@router.get("/{doc_id}")
async def get_document(
    doc_id: str,
    db: Session = Depends(get_db)
):
    """Get document by ID."""
    # Query database
    document = db.query(Document).filter(Document.id == doc_id).first()

    # Handle not found
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return document.to_dict()

# Step 2: Test
# curl http://localhost:8000/api/docs/doc-123
```

### Task 2: Modify RAG Prompt

**Requirement:** Make answers more friendly and informal

```python
# app/rag/llm.py

# ❌ Old prompt (formal)
ANSWER_PROMPT = """
You are a helpful assistant. Answer the question based on the context.

Context: {context}

Question: {question}

Answer:
"""

# ✅ New prompt (friendly)
ANSWER_PROMPT = """
Bạn là trợ lý AI thân thiện của Đại học Greenwich Việt Nam! 😊

Hãy trả lời câu hỏi dựa trên thông tin sau, dùng giọng văn gần gũi,
dễ hiểu như đang nói chuyện với bạn bè.

📚 Thông tin tham khảo:
{context}

❓ Câu hỏi: {question}

💬 Trả lời:
"""
```

### Task 3: Add Document Filtering

**Requirement:** Filter documents by type (handbook, policy, etc.)

```python
# app/api/docs.py

@router.get("/")
async def list_documents(
    db: Session = Depends(get_db),
    doc_type: str = None,  # ← New parameter
    skip: int = 0,
    limit: int = 10
):
    """List documents with optional type filter."""
    query = db.query(Document)

    # Apply filter if provided
    if doc_type:
        query = query.filter(Document.document_type == doc_type)

    documents = query.offset(skip).limit(limit).all()
    total = query.count()

    return {
        "documents": [doc.to_dict() for doc in documents],
        "total": total,
        "filters": {"doc_type": doc_type}
    }

# Test: GET /api/docs?doc_type=handbook
```

### Task 4: Add Logging

**Requirement:** Log all chat queries for analysis

```python
# app/services/logger.py
import logging
from datetime import datetime
from ..models.query_log import QueryLog

logger = logging.getLogger(__name__)

def log_query(
    question: str,
    answer: str,
    confidence: float,
    user_id: str,
    db: Session
):
    """Log a chat query to database."""
    try:
        log_entry = QueryLog(
            question=question,
            answer=answer,
            confidence=confidence,
            user_id=user_id,
            timestamp=datetime.utcnow()
        )
        db.add(log_entry)
        db.commit()
        logger.info(f"Logged query from user {user_id}")
    except Exception as e:
        logger.error(f"Failed to log query: {e}")
        db.rollback()

# Use in app/rag/orchestrator.py
async def query(self, question: str, user_id: str = None):
    result = await self._run_rag_pipeline(question)

    # Log the query
    if user_id:
        log_query(
            question=question,
            answer=result["answer"],
            confidence=result["confidence"],
            user_id=user_id,
            db=db
        )

    return result
```

---

## 🐍 Python Best Practices

### 1. Type Hints (Always Use!)

```python
# ✅ Good - clear types
def calculate_score(contexts: list[dict], threshold: float) -> float:
    scores = [ctx.get("score", 0.0) for ctx in contexts]
    return max(scores) if scores else 0.0

# ❌ Bad - no types
def calculate_score(contexts, threshold):
    return max([c.get("score", 0) for c in contexts])
```

### 2. Async/Await

```python
# ✅ When to use async
# - Calling external APIs (Gemini, Chroma)
# - Database queries with async drivers
# - I/O operations (file upload)

async def get_answer(question: str) -> str:
    # await for async operations
    contexts = await retriever.retrieve(question)
    answer = await llm.generate(question, contexts)
    return answer

# ✅ When NOT to use async
# - Simple calculations
# - Sync libraries (most DB drivers)

def calculate_confidence(score: float) -> float:
    return min(score, 1.0)
```

### 3. Error Handling

```python
# ✅ Specific exceptions with context
from fastapi import HTTPException

async def get_document(doc_id: str, db: Session):
    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            raise HTTPException(
                status_code=404,
                detail=f"Document {doc_id} not found"
            )
        return doc
    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Database error occurred"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )

# ❌ Bad - catch all, no context
try:
    doc = db.query(Document).get(doc_id)
    return doc
except:
    return None
```

### 4. List Comprehensions (Python Magic!)

```python
# ✅ Clean and Pythonic
active_docs = [doc for doc in documents if doc.status == "active"]

scores = [ctx["score"] for ctx in contexts if ctx["score"] > 0.7]

doc_ids = {doc.id for doc in documents}  # Set comprehension

# ❌ Verbose
active_docs = []
for doc in documents:
    if doc.status == "active":
        active_docs.append(doc)
```

### 5. F-Strings (Python 3.6+)

```python
# ✅ Modern and readable
name = "Alice"
score = 0.85
message = f"User {name} got score {score:.2f}"

# ❌ Old style
message = "User %s got score %.2f" % (name, score)
message = "User {} got score {:.2f}".format(name, score)
```

### 6. Context Managers

```python
# ✅ Always close resources
with open("data.txt", "r") as f:
    content = f.read()
# File automatically closed

# Database sessions
with SessionLocal() as db:
    documents = db.query(Document).all()
# Session automatically closed

# ❌ Manual cleanup (risky)
f = open("data.txt", "r")
content = f.read()
f.close()  # Might forget this!
```

---

## 🧠 RAG Concepts (For Beginners)

### What is RAG?

**RAG = Retrieval-Augmented Generation**

```
Traditional chatbot:
Question → LLM → Answer (might hallucinate)

RAG system:
Question → Search relevant docs → Give docs to LLM → Accurate answer
```

### Key Components Explained

#### 1. **Embeddings** (Text → Numbers)

```python
# What embeddings do:
text = "How to enroll?"
embedding = embedder.embed(text)
# → [0.12, -0.45, 0.78, ..., 0.33]  (384 numbers)

# Why? Computers can compare numbers, not text directly
similarity = cosine_similarity(
    embed("How to enroll?"),
    embed("Enrollment process")
)
# → 0.89 (very similar!)
```

#### 2. **Vector Store** (Database for Embeddings)

```python
# Store documents
vectorstore.add_documents([
    {"text": "Tuition is $5000/year", "embedding": [...]},
    {"text": "Enrollment opens in June", "embedding": [...]}
])

# Search similar documents
results = vectorstore.search("When to enroll?", k=5)
# Returns: [
#     {"text": "Enrollment opens in June", "score": 0.91},
#     {"text": "Tuition is $5000/year", "score": 0.45}
# ]
```

#### 3. **Retriever** (Smart Search)

```python
# Retriever finds relevant documents
contexts = retriever.retrieve("scholarship requirements", top_k=5)

# Returns best matching chunks with scores
# [
#   {"text": "GPA > 3.5 for scholarship", "score": 0.87},
#   {"text": "Apply by March 1st", "score": 0.75},
#   ...
# ]
```

#### 4. **LLM** (Answer Generator)

```python
# LLM generates human-like answers
prompt = f"""
Question: {question}
Context: {retrieved_docs}
Answer in Vietnamese:
"""

answer = llm.generate(prompt)
# → "Để nhận học bổng, bạn cần GPA trên 3.5..."
```

#### 5. **Orchestrator** (Connects Everything)

```python
class RAGOrchestrator:
    async def query(self, question: str):
        # Step 1: Retrieve relevant docs
        contexts = await self.retriever.retrieve(question)

        # Step 2: Calculate confidence
        confidence = self._calculate_confidence(contexts)

        # Step 3: Generate answer
        if confidence > threshold:
            answer = await self.llm.generate(question, contexts)
        else:
            answer = "Sorry, I don't have enough information"

        return {"answer": answer, "confidence": confidence}
```

### Confidence Score Explained

```python
# How we calculate confidence:
# 1. Get similarity scores from retrieval
scores = [0.85, 0.78, 0.65, 0.45, 0.32]  # Top 5 documents

# 2. Take max score (best match)
confidence = max(scores)  # 0.85

# 3. Decide if we can answer
if confidence > 0.65:
    # High confidence → Generate answer
    return llm.generate(...)
else:
    # Low confidence → Fallback
    return "I'm not sure about this. Please contact admin."
```

---

## 🧪 Testing Guidelines

### 1. Unit Tests (Test Individual Functions)

```python
# tests/test_confidence.py
from app.rag.orchestrator import RAGOrchestrator

def test_confidence_calculation():
    """Test confidence score calculation."""
    orch = RAGOrchestrator()

    # Mock contexts with known scores
    contexts = [
        {"score": 0.85, "text": "..."},
        {"score": 0.70, "text": "..."}
    ]

    confidence = orch._calculate_confidence(contexts)

    # Assert expected result
    assert confidence == 0.85
    assert 0 <= confidence <= 1.0

def test_fallback_triggered():
    """Test fallback when confidence is low."""
    orch = RAGOrchestrator()

    low_confidence_contexts = [
        {"score": 0.45, "text": "..."}
    ]

    result = orch._should_fallback(low_confidence_contexts)
    assert result is True
```

### 2. Integration Tests (Test API Endpoints)

```python
# tests/test_api_chat.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_chat_query_success():
    """Test successful chat query."""
    response = client.post(
        "/api/chat/query",
        json={"question": "What is AI?", "lang": "vi"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "confidence" in data
    assert data["confidence"] > 0

def test_chat_query_empty():
    """Test empty question handling."""
    response = client.post(
        "/api/chat/query",
        json={"question": "", "lang": "vi"}
    )

    assert response.status_code == 422  # Validation error
```

### 3. Manual Testing

```bash
# Test embeddings
python -c "
from app.rag.embedder import get_embeddings
emb = get_embeddings()
vec = emb.embed_query('test')
assert len(vec) == 384
print('✅ Embeddings working')
"

# Test RAG pipeline
python -c "
from app.rag.orchestrator import RAGOrchestrator
import asyncio
orch = RAGOrchestrator()
result = asyncio.run(orch.query('test question'))
print(f'Answer: {result[\"answer\"]}')
print(f'Confidence: {result[\"confidence\"]}')
"

# Test API
curl -X POST http://localhost:8000/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is AI?", "lang": "vi"}'
```

---

## 🐛 Debugging Tips

### 1. Print Debugging (Quick & Dirty)

```python
async def query(self, question: str):
    print(f"🔍 Question: {question}")  # Debug input

    contexts = await self.retriever.retrieve(question)
    print(f"📚 Found {len(contexts)} contexts")  # Debug retrieval
    print(f"📊 Scores: {[c['score'] for c in contexts]}")

    confidence = self._calculate_confidence(contexts)
    print(f"✅ Confidence: {confidence}")  # Debug calculation

    if confidence > self.threshold:
        answer = await self.llm.generate(question, contexts)
        print(f"💬 Answer length: {len(answer)}")  # Debug output

    return {"answer": answer, "confidence": confidence}
```

### 2. Logging (Production-Ready)

```python
import logging

logger = logging.getLogger(__name__)

async def query(self, question: str):
    logger.info(f"Processing query: {question}")

    try:
        contexts = await self.retriever.retrieve(question)
        logger.debug(f"Retrieved {len(contexts)} contexts")

        confidence = self._calculate_confidence(contexts)
        logger.info(f"Confidence score: {confidence}")

        if confidence < self.threshold:
            logger.warning(f"Low confidence ({confidence}), triggering fallback")

        return result
    except Exception as e:
        logger.error(f"Query failed: {e}", exc_info=True)
        raise
```

### 3. Interactive Debugging (VS Code)

```python
# Set breakpoint in VS Code (click left of line number)
async def query(self, question: str):
    contexts = await self.retriever.retrieve(question)
    # → Set breakpoint here
    confidence = self._calculate_confidence(contexts)
    return result

# Run in debug mode (F5)
# When it stops:
# - Inspect variables (hover or Debug Console)
# - Step through code (F10 = step over, F11 = step into)
# - Evaluate expressions in Debug Console
```

### 4. Common Issues & Solutions

**Issue: "Module not found"**

```bash
# Solution: Install in editable mode
pip install -e .

# Or add to PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:/path/to/SmartFAQ/apps/api"
```

**Issue: "Async function not awaited"**

```python
# ❌ Wrong
result = retriever.retrieve(question)  # Returns coroutine, not result

# ✅ Correct
result = await retriever.retrieve(question)
```

**Issue: "Database session closed"**

```python
# ❌ Wrong - session closed after 'with' block
with SessionLocal() as db:
    doc = db.query(Document).first()
# doc.attribute ← Error! Session closed

# ✅ Correct - use data before session closes
with SessionLocal() as db:
    doc = db.query(Document).first()
    doc_dict = doc.to_dict()  # Convert to dict
# doc_dict['attribute'] ← OK!
```

---

## ❌ Common Mistakes

### 1. Modifying Core RAG Components Without Understanding

```python
# ❌ DON'T do this unless you understand embeddings
def get_embeddings():
    # Changed model randomly
    return HuggingFaceEmbeddings(model_name="random-model")
    # → Breaks vector store compatibility!

# ✅ DO ask first or test in separate environment
```

### 2. Forgetting to Handle None/Empty Cases

```python
# ❌ Crashes if no documents found
@router.get("/docs/{doc_id}")
async def get_document(doc_id: str, db: Session):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    return doc.to_dict()  # ← Error if doc is None!

# ✅ Always check for None
@router.get("/docs/{doc_id}")
async def get_document(doc_id: str, db: Session):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc.to_dict()
```

### 3. Hardcoding Values

```python
# ❌ Bad - hardcoded, can't change easily
CONFIDENCE_THRESHOLD = 0.65
TOP_K = 5

# ✅ Good - use environment variables
from app.core.config import settings

CONFIDENCE_THRESHOLD = settings.CONFIDENCE_THRESHOLD
TOP_K = settings.TOP_K_RETRIEVAL
```

### 4. Not Using Type Hints

```python
# ❌ No one knows what this returns
def process(data):
    return data.get("result")

# ✅ Clear types help everyone
def process(data: dict[str, any]) -> str | None:
    return data.get("result")
```

### 5. Mixing Sync and Async

```python
# ❌ Wrong - calling async function without await
async def handler():
    result = async_function()  # Returns coroutine
    return result  # Wrong!

# ✅ Correct
async def handler():
    result = await async_function()
    return result
```

### 6. Not Testing Before Committing

```bash
# ❌ Bad workflow
git add .
git commit -m "Added feature"
git push
# → Breaks production!

# ✅ Good workflow
python scripts/test_setup.py  # Run tests
curl http://localhost:8000/api/... # Manual test
git add .
git commit -m "Added feature with tests"
git push
```

### 7. Poor Git Commit Messages

```bash
# ❌ Bad - vague
git commit -m "fix"
git commit -m "update"
git commit -m "changes"

# ✅ Good - descriptive
git commit -m "Fix document upload validation for PDF files"
git commit -m "Add pagination to document list API"
git commit -m "Update RAG prompt to be more friendly"
```

---

## 📚 Learning Resources

### Python

- [Real Python](https://realpython.com) - Tutorials & guides
- [Python Type Hints](https://docs.python.org/3/library/typing.html) - Official docs
- [Async Python](https://realpython.com/async-io-python/) - Understanding async/await

### RAG & LangChain

- [LangChain Docs](https://python.langchain.com/docs/get_started/introduction) - Official documentation
- [RAG Explained](https://www.pinecone.io/learn/retrieval-augmented-generation/) - Visual guide
- [Vector Databases](https://www.pinecone.io/learn/vector-database/) - Understanding vector stores

### FastAPI

- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/) - Official tutorial
- [FastAPI Best Practices](https://github.com/zhanymkanov/fastapi-best-practices) - Production tips

### Tools

- [VS Code Python](https://code.visualstudio.com/docs/python/python-tutorial) - Setup guide
- [Git Basics](https://www.atlassian.com/git) - Version control
- [Postman](https://www.postman.com/api-platform/api-testing/) - API testing

---

## 🎓 Exercises for Beginners

### Exercise 1: Add Health Check

**Goal:** Add `/health` endpoint

```python
# app/api/admin.py
@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

# Test: curl http://localhost:8000/api/admin/health
```

### Exercise 2: Add Document Count by Type

**Goal:** Add `/api/docs/stats` endpoint

```python
# app/api/docs.py
from sqlalchemy import func

@router.get("/stats")
async def get_document_stats(db: Session = Depends(get_db)):
    stats = db.query(
        Document.document_type,
        func.count(Document.id).label("count")
    ).group_by(Document.document_type).all()

    return {
        "total": sum(s.count for s in stats),
        "by_type": {s.document_type: s.count for s in stats}
    }
```

### Exercise 3: Customize Fallback Message

**Goal:** Make fallback more helpful

```python
# app/rag/orchestrator.py
def _generate_fallback_response(self, question: str) -> str:
    return f"""
    Xin lỗi, tôi không tìm thấy thông tin chính xác về "{question}".

    Bạn có thể:
    📧 Email: info@greenwich.edu.vn
    📞 Hotline: 1900-xxxx
    🌐 Website: greenwich.edu.vn/faq

    Hoặc thử hỏi lại với từ khóa khác nhé!
    """
```

---

## 🚀 Next Steps

1. **Week 1-2:** Setup environment, understand codebase
2. **Week 3-4:** Start with small tasks (add endpoints, modify prompts)
3. **Week 5-6:** Implement features (filtering, logging, metrics)
4. **Week 7-8:** Optimize RAG (improve prompts, tune confidence)
5. **Week 9-10:** Testing & documentation

---

## 💬 Getting Help

### When Stuck:

1. **Read error message carefully** - Python errors are usually descriptive
2. **Check logs** - `tail -f logs/app.log`
3. **Google the error** - Someone probably solved it
4. **Ask senior dev** - Better than guessing!

### Before Asking:

1. What did you try?
2. What error did you get? (paste full traceback)
3. What do you expect to happen?

### Good Question Example:

> "I'm trying to add pagination to `/api/docs` but getting `TypeError: 'int' object is not iterable` on line 45. I think `offset()` expects a list but I'm passing an int. Here's my code: [paste code]. Should I convert skip/limit to a list?"

---

## ✅ Checklist Before Submitting PR

- [ ] Code runs without errors
- [ ] Tests pass (`python scripts/test_setup.py`)
- [ ] Added type hints to new functions
- [ ] Added docstrings to new functions
- [ ] No hardcoded values (use config)
- [ ] Error handling in place
- [ ] Tested manually with curl/Postman
- [ ] Git commit message is descriptive
- [ ] No sensitive data (API keys, passwords) in code

---

Good luck! Remember: **It's OK to make mistakes - that's how we learn!** 🚀

If you get stuck, don't spend more than 30 minutes - ask for help! 💪
