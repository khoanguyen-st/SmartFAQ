# 🎓 SmartFAQ RAG System - Quick Start

**LangChain v1 + Gemini + HuggingFace**

---

## 📋 Setup in 4 Steps

### 1️⃣ Get Gemini API Key

- Visit: https://aistudio.google.com/app/apikey
- Create new API key
- Copy key for step 2

### 2️⃣ Configure Environment

```bash
cp .env.example apps/api/.env
# Edit apps/api/.env
# Set GOOGLE_API_KEY=your-key-here
```

### 3️⃣ Install dependencies

```bash
cd apps/api
source venv/bin/activate
pip install -e ".[dev]"
```

### 4️⃣ Start API Server

```bash
uvicorn app.main:app --reload
```

---

## 📚 Documentation

- **SUMMARY.md** - Overview & quick reference
- **SETUP_CHECKLIST.md** - Step-by-step checklist
- **SETUP_LOCAL.md** - Detailed setup guide
- **MIGRATION_V1.md** - Migration from v0 to v1
- **RAG_README.md** - Technical documentation

---

## 🔧 Tech Stack

| Component      | Technology                                |
| -------------- | ----------------------------------------- |
| **LLM**        | Google Gemini 2.5 Flash (via Gemini API)  |
| **Embeddings** | multilingual-e5-base (HuggingFace local) |
| **Vector DB**  | Chroma (HTTP client-server)               |
| **Framework**  | LangChain v1.0                            |
| **Backend**    | FastAPI + Python 3.11+                    |

---

## ✅ Verify Setup

```bash
python scripts/test_setup.py
```

**Expected output:**

```
✅ PASS - Imports
✅ PASS - Configuration
✅ PASS - Embeddings
✅ PASS - LLM (Gemini)
✅ PASS - Vector Store
✅ PASS - RAG Pipeline

🎉 All tests passed! Setup is complete.
```

---

## 🆘 Need Help?

1. Check logs: `docker-compose logs -f`
2. Run tests: `python scripts/test_setup.py`
3. Read docs: `cat SETUP_LOCAL.md`
4. Verify env: `cat apps/api/.env`

---

## 🚀 API Endpoints

| Endpoint       | Method | URL                                                 |
| -------------- | ------ | --------------------------------------------------- |
| **Health**     | GET    | http://localhost:8000/health                        |
| **Upload Doc** | POST   | http://localhost:8000/api/v1/admin/documents/upload |
| **Query**      | POST   | http://localhost:8000/api/v1/chat/query             |
| **API Docs**   | GET    | http://localhost:8000/docs                          |

---
