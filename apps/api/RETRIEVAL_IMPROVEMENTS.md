# RAG Retrieval Logic Improvements

**Date**: December 4, 2025  
**Version**: 1.0

## 📋 Summary

Đã cải thiện retrieval logic trong RAG pipeline với focus vào:

- ✅ Config-driven parameters (loại bỏ hardcoded values)
- ✅ Improved RRF score normalization
- ✅ Enhanced retrieval metrics tracking
- ✅ Optimized query expansion strategy

---

## 🔧 Changes Implemented

### 1. **Config-Driven Parameters**

#### Before:

```python
# Hardcoded values scattered throughout code
diversity_bonus = min(1.0, unique_docs / 3.0)  # Magic number
sub_qs = sub_qs[:3]  # Hardcoded limit
docs = self.retriever.retrieve(sq, top_k=5)  # Hardcoded top_k
```

#### After:

```python
# Centralized in config.py
CONFIDENCE_DIVERSITY_TARGET=3
MAX_SUB_QUERIES=3
TOP_K_PER_QUERY=5
```

**New Environment Variables Added:**

- `CONFIDENCE_DIVERSITY_TARGET`: Target unique docs for diversity bonus (default: 3)
- `MAX_SUB_QUERIES`: Max sub-queries from question analysis (default: 3)
- `TOP_K_PER_QUERY`: Results per query/sub-query (default: 5)
- `QUERY_EXPANSION_ENABLED`: Enable/disable query expansion (default: true)
- `QUERY_EXPANSION_MAX`: Max expansion queries (default: 1, reduced from 2)
- `QUERY_EXPANSION_MIN_WORDS`: Min words to trigger expansion (default: 3)

---

### 2. **Improved RRF Normalization**

#### Before:

```python
# Theoretical max score calculation
denom = 0.0
if ctx.get("rank_vec") is not None:
    denom += 1.0 / (k_param + 1.0)
if ctx.get("rank_lex") is not None:
    denom += 1.0 / (k_param + 1.0)
ctx["score"] = min(raw / denom, 1.0) if denom > 0 else 0.0
```

**Problem**: Assumes both sources always have rank=1, không phản ánh thực tế

#### After:

```python
# Actual max score normalization
max_rrf = max((ctx.get("score_rrf_raw", 0.0) for ctx in fused.values()), default=1.0)
if max_rrf > 0:
    for ctx in fused.values():
        raw = ctx.get("score_rrf_raw", 0.0)
        ctx["score"] = min(raw / max_rrf, 1.0)
```

**Benefit**: Scores phản ánh chính xác hơn relative ranking trong batch

---

### 3. **Enhanced Retrieval Metrics**

#### New Metrics Added to RAGMetrics:

```python
avg_retrieval_score: float = 0.0    # Average similarity score
max_retrieval_score: float = 0.0    # Best match score
min_retrieval_score: float = 0.0    # Worst match score
score_variance: float = 0.0          # Score distribution
diversity_score: float = 0.0         # unique_docs / total_contexts
```

#### Calculation in Orchestrator:

```python
if unique_docs:
    scores = [d.get("score", 0.0) for d in unique_docs if d.get("score") is not None]
    if scores:
        metrics.avg_retrieval_score = sum(scores) / len(scores)
        metrics.max_retrieval_score = max(scores)
        metrics.min_retrieval_score = min(scores)
        mean = metrics.avg_retrieval_score
        metrics.score_variance = sum((s - mean) ** 2 for s in scores) / len(scores)
    metrics.diversity_score = metrics.num_unique_docs / metrics.num_contexts
```

**Benefits**:

- Monitor retrieval quality over time
- Detect degradation in search performance
- Identify queries with low-confidence results
- Track diversity of retrieved contexts

---

### 4. **Optimized Query Expansion**

#### Changes:

1. **Reduced default expansions**: `max_expansions=2` → `max_expansions=1`
2. **Made it configurable**: Can disable via `QUERY_EXPANSION_ENABLED=false`
3. **Smart expansion logic**:
   ```python
   # Only expand if query has enough words
   if len(query_lower.split()) < settings.QUERY_EXPANSION_MIN_WORDS:
       # Just add context variations for very short queries
       queries.extend(self._add_context_variations(query))
   ```

**Impact**:

- ✅ Reduced noise from over-expansion
- ✅ Lower latency (fewer queries to process)
- ✅ Better precision (less irrelevant results)
- ✅ Configurable per deployment

---

## 📊 Expected Performance Improvements

### Before:

```
3 sub-queries × 2 expansions = 6 queries × 5 docs = 30 documents
→ Deduplicate → ~15-20 unique contexts
→ High latency, potential noise
```

### After (with default config):

```
3 sub-queries × 1 expansion = 3-6 queries × 5 docs = 15-30 documents
→ Deduplicate → ~10-15 unique contexts
→ Lower latency, better precision
```

### Configurable Tuning:

```bash
# For high-precision use case
QUERY_EXPANSION_ENABLED=false
MAX_SUB_QUERIES=1
TOP_K_PER_QUERY=3

# For high-recall use case
QUERY_EXPANSION_ENABLED=true
QUERY_EXPANSION_MAX=2
MAX_SUB_QUERIES=3
TOP_K_PER_QUERY=7
```

---

## 🔍 How to Monitor

### 1. Check RAG Metrics Logs

```bash
tail -f logs/rag_metrics.json | jq '.'
```

Look for:

- `avg_retrieval_score`: Should be > 0.7 for good matches
- `diversity_score`: Should be > 0.5 for diverse results
- `score_variance`: Lower = more consistent results
- `num_sub_queries`: Track expansion effectiveness

### 2. Example Metrics Output

```json
{
  "request_id": "a1b2c3d4",
  "avg_retrieval_score": 0.823,
  "max_retrieval_score": 0.912,
  "min_retrieval_score": 0.654,
  "score_variance": 0.012,
  "diversity_score": 0.67,
  "num_sub_queries": 4,
  "num_contexts": 12,
  "num_unique_docs": 8
}
```

---

## 🚀 Deployment Guide

### 1. Update Environment Variables

Add to your `.env` file:

```bash
# New required variables
CONFIDENCE_DIVERSITY_TARGET=3
MAX_SUB_QUERIES=3
TOP_K_PER_QUERY=5
QUERY_EXPANSION_ENABLED=true
QUERY_EXPANSION_MAX=1
QUERY_EXPANSION_MIN_WORDS=3
```

### 2. Restart API Service

```bash
# Docker
docker compose restart api

# Local
make restart-api
```

### 3. Verify Configuration

```python
from app.core.config import settings

print(f"Max sub-queries: {settings.MAX_SUB_QUERIES}")
print(f"Query expansion: {settings.QUERY_EXPANSION_ENABLED}")
print(f"Expansion max: {settings.QUERY_EXPANSION_MAX}")
```

---

## 🎯 Recommended Settings by Use Case

### Production (Balanced)

```bash
CONFIDENCE_DIVERSITY_TARGET=3
MAX_SUB_QUERIES=3
TOP_K_PER_QUERY=5
QUERY_EXPANSION_ENABLED=true
QUERY_EXPANSION_MAX=1
QUERY_EXPANSION_MIN_WORDS=3
```

### High Precision (Less noise)

```bash
CONFIDENCE_DIVERSITY_TARGET=2
MAX_SUB_QUERIES=2
TOP_K_PER_QUERY=3
QUERY_EXPANSION_ENABLED=false
QUERY_EXPANSION_MAX=0
```

### High Recall (More coverage)

```bash
CONFIDENCE_DIVERSITY_TARGET=4
MAX_SUB_QUERIES=4
TOP_K_PER_QUERY=7
QUERY_EXPANSION_ENABLED=true
QUERY_EXPANSION_MAX=2
QUERY_EXPANSION_MIN_WORDS=2
```

---

## 📝 Testing Checklist

- [ ] Verify all new env variables are set
- [ ] Restart API service
- [ ] Test simple query: "học phí"
- [ ] Test complex query: "Làm sao để đăng ký học bổng cho sinh viên CNTT năm 2?"
- [ ] Check metrics in logs
- [ ] Monitor avg_retrieval_score
- [ ] Verify diversity_score
- [ ] Compare latency before/after

---

## 🔮 Future Improvements

### High Priority:

1. ⚠️ **BM25 Index Optimization**
   - Current: Rebuild entire index on add/remove
   - Proposed: Persistent index or batch updates

2. ⚠️ **Metadata Filtering for Hybrid Mode**
   - Current: Disabled in hybrid mode
   - Proposed: Post-filter after RRF fusion

### Medium Priority:

3. 📝 **Semantic Reranking**
   - Add cross-encoder reranking stage
   - Improve top-k result quality

4. 📝 **Context Quality Scoring**
   - Score chunk text length/quality
   - Detect incomplete or low-quality chunks

### Low Priority:

5. 🔧 **Query Performance Caching**
   - Cache frequent queries
   - Reduce latency for common questions

6. 🔧 **A/B Testing Framework**
   - Compare different retrieval strategies
   - Data-driven optimization

---

## 📚 References

- **Code Files Modified**:
  - `app/core/config.py`
  - `app/rag/retriever.py`
  - `app/rag/orchestrator.py`
  - `app/rag/query_expander.py`
  - `app/rag/metrics.py`
  - `.env.example`
  - `.env.local`

- **Related Documentation**:
  - `DEVELOPMENT.md`
  - `docs/EVALUATION_GUIDE.md`
  - `docs/METRICS_DASHBOARD_SETUP.md`

---

## 🤝 Contributors

- Initial review and improvements: GitHub Copilot
- Implementation date: December 4, 2025
