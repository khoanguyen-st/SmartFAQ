# Environment Variables Guide

## 🆕 New RAG Retrieval Variables (December 2025)

### Confidence Calculation

| Variable                      | Type  | Default | Description                                           |
| ----------------------------- | ----- | ------- | ----------------------------------------------------- |
| `CONFIDENCE_THRESHOLD`        | float | 0.65    | Minimum confidence score to trust answer              |
| `CONFIDENCE_DECAY`            | float | 0.6     | Decay factor for weighted score calculation (0.0-1.0) |
| `CONFIDENCE_DIVERSITY_TARGET` | int   | 3       | Target number of unique docs for diversity bonus      |

**Example:**

```bash
CONFIDENCE_THRESHOLD=0.65
CONFIDENCE_DECAY=0.6
CONFIDENCE_DIVERSITY_TARGET=3
```

**Impact:**

- Higher `CONFIDENCE_THRESHOLD` → More strict, fewer "I don't know" responses
- Higher `CONFIDENCE_DECAY` → Top results matter less, considers more results
- Higher `CONFIDENCE_DIVERSITY_TARGET` → Requires more diverse sources for high confidence

---

### Retrieval Settings

| Variable            | Type | Default | Description                                |
| ------------------- | ---- | ------- | ------------------------------------------ |
| `TOP_K_RETRIEVAL`   | int  | 5       | Default top-k for retrieval API            |
| `MAX_SUB_QUERIES`   | int  | 3       | Maximum sub-queries from question analysis |
| `TOP_K_PER_QUERY`   | int  | 5       | Results to retrieve per query/sub-query    |
| `MAX_CONTEXT_CHARS` | int  | 8000    | Max chars to send to LLM                   |

**Example:**

```bash
TOP_K_RETRIEVAL=5
MAX_SUB_QUERIES=3
TOP_K_PER_QUERY=5
MAX_CONTEXT_CHARS=8000
```

**Math:**

```
Total docs retrieved = MAX_SUB_QUERIES × (1 + QUERY_EXPANSION_MAX) × TOP_K_PER_QUERY
                     = 3 × (1 + 1) × 5
                     = 30 documents (before deduplication)
```

---

### Query Expansion

| Variable                    | Type | Default | Description                             |
| --------------------------- | ---- | ------- | --------------------------------------- |
| `QUERY_EXPANSION_ENABLED`   | bool | true    | Enable/disable query expansion          |
| `QUERY_EXPANSION_MAX`       | int  | 1       | Max expansion queries per sub-query     |
| `QUERY_EXPANSION_MIN_WORDS` | int  | 3       | Min words in query to trigger expansion |

**Example:**

```bash
QUERY_EXPANSION_ENABLED=true
QUERY_EXPANSION_MAX=1
QUERY_EXPANSION_MIN_WORDS=3
```

**Behavior:**

- Query "học phí" (2 words) → No expansion, just context variations
- Query "học phí năm 2024" (4 words) → Expands to "chi phí học tập năm 2024", etc.

---

### Hybrid Search Settings

| Variable          | Type | Default | Description                          |
| ----------------- | ---- | ------- | ------------------------------------ |
| `HYBRID_ENABLED`  | bool | true    | Enable hybrid (vector + BM25) search |
| `HYBRID_K_VEC`    | int  | 20      | Results from vector search           |
| `HYBRID_K_LEX`    | int  | 20      | Results from BM25 lexical search     |
| `HYBRID_FUSION_K` | int  | 60      | RRF fusion parameter                 |
| `HYBRID_MAX_DOCS` | int  | 5000    | Max docs for BM25 index              |

**Example:**

```bash
HYBRID_ENABLED=true
HYBRID_K_VEC=20
HYBRID_K_LEX=20
HYBRID_FUSION_K=60
HYBRID_MAX_DOCS=5000
```

**RRF Formula:**

```python
score_rrf = 1/(HYBRID_FUSION_K + rank_vector) + 1/(HYBRID_FUSION_K + rank_lexical)
```

Higher `HYBRID_FUSION_K` → Smoother fusion, less emphasis on rank differences

---

## 📊 Configuration Presets

### Development (Fast feedback)

```bash
CONFIDENCE_THRESHOLD=0.5
CONFIDENCE_DIVERSITY_TARGET=2
MAX_SUB_QUERIES=2
TOP_K_PER_QUERY=3
QUERY_EXPANSION_ENABLED=true
QUERY_EXPANSION_MAX=1
HYBRID_ENABLED=true
```

### Production (Balanced)

```bash
CONFIDENCE_THRESHOLD=0.65
CONFIDENCE_DIVERSITY_TARGET=3
MAX_SUB_QUERIES=3
TOP_K_PER_QUERY=5
QUERY_EXPANSION_ENABLED=true
QUERY_EXPANSION_MAX=1
HYBRID_ENABLED=true
```

### High Precision (Strict quality)

```bash
CONFIDENCE_THRESHOLD=0.75
CONFIDENCE_DIVERSITY_TARGET=4
MAX_SUB_QUERIES=2
TOP_K_PER_QUERY=3
QUERY_EXPANSION_ENABLED=false
QUERY_EXPANSION_MAX=0
HYBRID_ENABLED=true
HYBRID_K_VEC=10
HYBRID_K_LEX=10
```

### High Recall (Maximum coverage)

```bash
CONFIDENCE_THRESHOLD=0.5
CONFIDENCE_DIVERSITY_TARGET=2
MAX_SUB_QUERIES=4
TOP_K_PER_QUERY=7
QUERY_EXPANSION_ENABLED=true
QUERY_EXPANSION_MAX=2
HYBRID_ENABLED=true
HYBRID_K_VEC=30
HYBRID_K_LEX=30
```

### Performance Mode (Low latency)

```bash
CONFIDENCE_THRESHOLD=0.6
CONFIDENCE_DIVERSITY_TARGET=2
MAX_SUB_QUERIES=1
TOP_K_PER_QUERY=5
QUERY_EXPANSION_ENABLED=false
QUERY_EXPANSION_MAX=0
HYBRID_ENABLED=false  # Vector-only
```

---

## 🔧 Tuning Guidelines

### If queries are too slow:

1. ✅ Reduce `MAX_SUB_QUERIES` (3 → 2 or 1)
2. ✅ Disable `QUERY_EXPANSION_ENABLED`
3. ✅ Reduce `TOP_K_PER_QUERY` (5 → 3)
4. ✅ Set `HYBRID_ENABLED=false` (vector-only)

### If answers lack context:

1. ✅ Increase `TOP_K_PER_QUERY` (5 → 7)
2. ✅ Increase `MAX_SUB_QUERIES` (3 → 4)
3. ✅ Enable `QUERY_EXPANSION_ENABLED`
4. ✅ Increase `QUERY_EXPANSION_MAX` (1 → 2)

### If too many "I don't know" responses:

1. ✅ Lower `CONFIDENCE_THRESHOLD` (0.65 → 0.5)
2. ✅ Lower `CONFIDENCE_DIVERSITY_TARGET` (3 → 2)
3. ✅ Increase `CONFIDENCE_DECAY` (0.6 → 0.7)

### If answers include irrelevant info:

1. ✅ Raise `CONFIDENCE_THRESHOLD` (0.65 → 0.75)
2. ✅ Disable `QUERY_EXPANSION_ENABLED`
3. ✅ Reduce `QUERY_EXPANSION_MAX` (1 → 0)
4. ✅ Reduce `TOP_K_PER_QUERY` (5 → 3)

---

## 📈 Monitoring

### Key Metrics to Watch

After changing these variables, monitor:

1. **avg_retrieval_score** (in logs)
   - Target: > 0.7
   - Low values → Poor retrieval quality

2. **diversity_score** (in logs)
   - Target: 0.5 - 0.8
   - Too low → Retrieving same doc repeatedly
   - Too high → Might be too scattered

3. **num_sub_queries** (in logs)
   - Should match or be less than `MAX_SUB_QUERIES`

4. **total_latency_ms** (in logs)
   - Target: < 2000ms for good UX
   - High values → Reduce query expansion or sub-queries

### Example Log Analysis

```bash
# Check average retrieval scores
cat logs/rag_metrics.json | jq '.metrics.avg_retrieval_score' | awk '{sum+=$1; count++} END {print sum/count}'

# Check average latency
cat logs/rag_metrics.json | jq '.metrics.total_latency_ms' | awk '{sum+=$1; count++} END {print sum/count}'

# Find queries with low confidence
cat logs/rag_metrics.json | jq 'select(.metrics.confidence < 0.5) | .question_preview'
```

---

## 🚨 Common Issues

### Issue: BM25 index taking too long to build

**Solution:**

```bash
HYBRID_MAX_DOCS=1000  # Reduce from 5000
# or
HYBRID_ENABLED=false  # Use vector-only
```

### Issue: Getting duplicate results

**Cause:** Low diversity in retrieval  
**Solution:**

```bash
CONFIDENCE_DIVERSITY_TARGET=4  # Increase from 3
TOP_K_PER_QUERY=3  # Reduce from 5
```

### Issue: Query expansion creating noise

**Solution:**

```bash
QUERY_EXPANSION_MAX=0  # Disable expansion
# or
QUERY_EXPANSION_MIN_WORDS=5  # Only expand longer queries
```

---

## 📚 Related Files

- Configuration: `app/core/config.py`
- Retriever logic: `app/rag/retriever.py`
- Orchestrator: `app/rag/orchestrator.py`
- Query expander: `app/rag/query_expander.py`
- Metrics: `app/rag/metrics.py`
- Documentation: `RETRIEVAL_IMPROVEMENTS.md`

---

Last updated: December 4, 2025
