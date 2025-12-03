# RAG Evaluation Framework

## Overview

Framework đánh giá chất lượng RAG pipeline với 2 nhóm metrics:
- **Retrieval Metrics**: Precision@K, Recall@K, F1@K, MRR, NDCG, Hit Rate
- **Answer Quality Metrics**: Confidence, Fallback Rate, Latency, Number of Sources

## Quick Start

### 1. Tạo Test Cases

Tạo file `tests/evaluation/test_cases.json`:

```json
[
  {
    "question": "Học phí năm học 2024 là bao nhiêu?",
    "relevant_doc_ids": ["tuition_2024"],
    "category": "tuition",
    "language": "vi"
  },
  {
    "question": "CNTT",
    "relevant_doc_ids": ["program_cntt"],
    "category": "program",
    "language": "vi"
  }
]
```

### 2. Run Evaluation

```bash
cd apps/api
python scripts/run_evaluation.py
```

### 3. Check Results

Kết quả được lưu vào `tests/evaluation/results.json` và in ra console:

```
======================================================================
RAG EVALUATION REPORT
======================================================================

Total Test Cases: 10
Top-K: 5

📊 RETRIEVAL METRICS:
----------------------------------------------------------------------
  Precision@5: 0.650
  Recall@5:    0.820
  F1@5:         0.725
  MRR:            0.780
  NDCG:           0.845
  Hit Rate:       95.00%

🤖 ANSWER QUALITY METRICS:
----------------------------------------------------------------------
  Avg Confidence: 0.742
  Fallback Rate:  8.00%
  Avg Latency:    1250ms
  Avg Sources:    4.2

======================================================================
```

## Metrics Explained

### Retrieval Metrics

**Precision@K**: Tỉ lệ kết quả relevant trong top-K
- `Precision@5 = 0.650` → 65% kết quả trong top-5 là relevant

**Recall@K**: Tỉ lệ relevant documents được tìm thấy trong top-K
- `Recall@5 = 0.820` → Tìm được 82% relevant documents

**F1@K**: Harmonic mean của Precision và Recall
- `F1@5 = 0.725` → Balance giữa precision và recall

**MRR (Mean Reciprocal Rank)**: Trung bình nghịch đảo của rank đầu tiên có relevant result
- `MRR = 0.780` → Trung bình relevant result đầu tiên ở vị trí 1.28

**NDCG (Normalized Discounted Cumulative Gain)**: Đánh giá ranking quality
- `NDCG = 0.845` → Ranking quality cao (1.0 là perfect)

**Hit Rate**: % queries có ít nhất 1 relevant result trong top-K
- `Hit Rate = 95%` → 95% queries tìm được ít nhất 1 relevant result

### Answer Quality Metrics

**Avg Confidence**: Trung bình confidence score của answers
- `0.742` → Hệ thống khá tự tin về câu trả lời

**Fallback Rate**: Tỉ lệ queries trigger fallback
- `8%` → 8% queries không đủ context để trả lời

**Avg Latency**: Thời gian trung bình để generate answer
- `1250ms` → Trung bình 1.25 giây/query

**Avg Sources**: Số lượng sources trung bình được sử dụng
- `4.2` → Trung bình sử dụng 4.2 sources/answer

## Test Cases Format

### Basic Format

```json
{
  "question": "Câu hỏi test",
  "relevant_doc_ids": ["doc_id_1", "doc_id_2"],
  "category": "tuition",
  "language": "vi"
}
```

### Advanced Format (với chunk-level evaluation)

```json
{
  "question": "Học phí là bao nhiêu?",
  "relevant_doc_ids": ["tuition_2024"],
  "relevant_chunk_ids": ["chunk_abc", "chunk_def"],
  "expected_answer": "Học phí năm 2024 là 25 triệu đồng/năm",
  "category": "tuition",
  "language": "vi"
}
```

### Fields

- `question` (required): Câu hỏi test
- `relevant_doc_ids` (required): IDs của documents relevant
- `relevant_chunk_ids` (optional): IDs của chunks relevant (chi tiết hơn doc-level)
- `expected_answer` (optional): Câu trả lời mong đợi (để đánh giá answer quality)
- `category` (optional): Category của câu hỏi (tuition, program, policy, etc.)
- `language` (optional): Ngôn ngữ (vi, en)

## How to Get Document/Chunk IDs

### Option 1: From Database

```python
from app.repositories.faq_repository import FAQRepository

repo = FAQRepository()
faqs = await repo.get_all()

for faq in faqs:
    print(f"Question: {faq.question}")
    print(f"Doc ID: {faq.id}")
```

### Option 2: From ChromaDB

```python
from app.rag.retriever import Retriever

retriever = Retriever()
results = retriever.retrieve("học phí", top_k=5)

for result in results:
    print(f"Chunk ID: {result.get('chunk_id')}")
    print(f"Doc ID: {result.get('document_id')}")
    print(f"Content: {result.get('content')[:100]}...")
```

### Option 3: Manual Labeling

1. Query system với test question
2. Xem sources được trả về
3. Note lại IDs của sources relevant
4. Add vào test cases

## Best Practices

### 1. Diverse Test Cases

Cover nhiều categories:
```json
[
  {"category": "tuition", "question": "Học phí..."},
  {"category": "program", "question": "CNTT..."},
  {"category": "policy", "question": "Thôi học..."},
  {"category": "scholarship", "question": "Học bổng..."}
]
```

### 2. Query Complexity Levels

- **Short queries**: "CNTT", "Học phí"
- **Medium queries**: "Học phí năm 2024"
- **Long queries**: "Làm thế nào để đăng ký học lại môn bị điểm F?"

### 3. Ambiguous Queries

Test queries có nhiều ý nghĩa:
```json
{
  "question": "Thôi học",
  "relevant_doc_ids": ["voluntary_withdrawal", "forced_withdrawal"],
  "category": "policy"
}
```

### 4. Regular Updates

- Thêm test cases mới khi có user feedback
- Update relevant IDs khi data thay đổi
- Run evaluation after mỗi major update

## Integration with CI/CD

### 1. Add to Test Suite

```python
# tests/test_rag_evaluation.py
import pytest
from app.rag.evaluation import RAGEvaluator

@pytest.mark.asyncio
async def test_rag_quality():
    evaluator = RAGEvaluator()
    evaluator.load_test_cases("tests/evaluation/test_cases.json")
    
    metrics = await evaluator.evaluate_retrieval(k=5)
    
    # Set quality thresholds
    assert metrics.precision_at_k >= 0.60, "Precision@5 too low"
    assert metrics.recall_at_k >= 0.70, "Recall@5 too low"
    assert metrics.hit_rate >= 0.90, "Hit rate too low"
```

### 2. GitHub Actions

```yaml
# .github/workflows/rag-evaluation.yml
name: RAG Evaluation

on: [push, pull_request]

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run RAG Evaluation
        run: |
          cd apps/api
          python scripts/run_evaluation.py
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: evaluation-results
          path: apps/api/tests/evaluation/results.json
```

## Troubleshooting

### Low Precision

- Check if retrieval is returning irrelevant results
- Tune hybrid search weights (alpha)
- Improve embeddings quality

### Low Recall

- Increase `top_k` parameter
- Check if relevant docs are in database
- Improve query expansion

### High Fallback Rate

- Check LLM prompt quality
- Verify context is sufficient
- Review confidence thresholds

### High Latency

- Enable caching for embeddings
- Optimize database queries
- Consider async processing

## Future Enhancements

1. **Answer Quality Metrics**
   - BLEU/ROUGE scores với expected_answer
   - Human evaluation interface
   - A/B testing framework

2. **Automated Test Generation**
   - Generate test cases from user logs
   - Active learning for hard cases

3. **Real-time Monitoring**
   - Dashboard với Grafana/Kibana
   - Alerts khi metrics drop
   - Trend analysis over time
