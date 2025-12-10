# Confidence & Relevance Metrics Update

## Tóm tắt thay đổi

Hệ thống đã được cập nhật để tách biệt và theo dõi 2 metrics riêng biệt:

### 1. **`confidence`** (Độ tin cậy tổng thể)

- Kết hợp từ 2 metrics: `(retrieval_quality + answer_confidence) / 2`
- Phản ánh **độ tin cậy tổng thể** của câu trả lời
- **Backward compatible**: Vẫn được lưu và sử dụng như trước
- Giá trị: 0.0 - 1.0 (trong DB) hoặc 0-100 (trong API response %)

### 2. **`relevance`** (Độ liên quan của tài liệu - MỚI)

- Chính là `retrieval_quality` (chất lượng tài liệu tìm được)
- Phản ánh **mức độ liên quan** của documents với câu hỏi
- Tính dựa trên: similarity scores, diversity, coverage
- Giá trị: 0.0 - 1.0 (trong DB) hoặc 0-100 (trong API response %)

---

## Chi tiết các metrics

### Retrieval Quality (= relevance)

**Đo lường:** Chất lượng của việc tìm kiếm tài liệu

**Tính toán:**

```python
retrieval_quality = base_relevance × diversity_bonus × coverage_ratio
```

**Các thành phần:**

- `base_relevance`: Điểm similarity trung bình có trọng số (decay)
- `diversity_bonus`: Thưởng nếu có nhiều documents khác nhau
- `coverage_ratio`: Phạt nếu số lượng kết quả ít so với mong đợi

### Answer Confidence

**Đo lường:** Độ tin cậy của LLM về câu trả lời

**Tính toán:** LLM tự đánh giá dựa trên:

- Relevance: Câu trả lời có trả lời đúng câu hỏi không?
- Completeness: Câu trả lời có đầy đủ không?
- Accuracy: Câu trả lời có được hỗ trợ bởi contexts không?
- Clarity: Câu trả lời có rõ ràng và cấu trúc tốt không?

### Final Confidence

**Đo lường:** Độ tin cậy tổng thể

**Tính toán:**

```python
final_confidence = (retrieval_quality + answer_confidence) / 2
```

---

## Thay đổi API Response

### `/api/chat/query` - ChatQueryResponse

```json
{
  "answer": "...",
  "sources": [...],
  "confidence": 75,          // ✅ VẪN CÓ (final confidence)
  "relevance": 80,           // 🆕 MỚI (retrieval quality)
  "language": "vi",
  "fallback": false,
  "chatId": "..."
}
```

### `/api/chat/history` - ChatHistoryMessage

```json
{
  "role": "assistant",
  "text": "...",
  "timestamp": "...",
  "chatId": "...",
  "confidence": 75, // ✅ VẪN CÓ
  "relevance": 80, // 🆕 MỚI
  "fallback": false
}
```

### `/api/chat/confidence` - ChatConfidenceResponse

```json
{
  "chatId": "...",
  "confidence": 75, // ✅ VẪN CÓ
  "relevance": 80, // 🆕 MỚI
  "threshold": 65,
  "fallbackTriggered": false
}
```

---

## Thay đổi MongoDB Schema

### Collection: `chat_messages`

**Thêm field mới:**

```javascript
{
  "_id": "...",
  "sessionId": "...",
  "role": "assistant",
  "text": "...",
  "confidence": 0.75,        // ✅ VẪN CÓ (final confidence)
  "relevance": 0.80,         // 🆕 MỚI (retrieval quality)
  "sources": [...],
  "queryLog": {...},
  "fallback": false,
  "feedback": null,
  "createdAt": "..."
}
```

**Lưu ý:**

- Field `relevance` là optional (nullable)
- Documents cũ không có `relevance` vẫn hoạt động bình thường
- Các message mới sẽ có cả `confidence` và `relevance`

---

## Migration Notes

### 1. **Không cần migration database**

- Field `relevance` là optional
- Hệ thống tự động handle null values
- Documents cũ vẫn hoạt động bình thường

### 2. **API backward compatible**

- `confidence` vẫn được trả về như cũ
- `relevance` là optional field mới
- Clients cũ không bị ảnh hưởng

### 3. **Sử dụng metrics**

**Khi nào dùng `confidence`:**

- Quyết định có hiển thị câu trả lời hay không
- So sánh với threshold
- Trigger fallback mechanism

**Khi nào dùng `relevance`:**

- Đánh giá chất lượng retrieval system
- Debug vấn đề về document search
- Phân tích performance của vector search

**Khi nào dùng cả 2:**

- Analytics và monitoring
- A/B testing
- Fine-tuning thresholds

---

## Example Usage

### Frontend Display

```typescript
// Hiển thị cả 2 metrics cho admin/debugging
if (response.confidence < 70) {
  console.warn("Low confidence:", response.confidence);
  console.warn("Retrieval quality:", response.relevance);

  if (response.relevance < 60) {
    // Vấn đề ở retrieval - cần cải thiện document search
    console.error("Poor document retrieval");
  } else {
    // Vấn đề ở answer generation - cần cải thiện prompt/LLM
    console.error("Good documents but poor answer generation");
  }
}
```

### Analytics Query

```javascript
// Tìm messages có relevance thấp nhưng confidence cao
db.chat_messages.find({
  relevance: { $lt: 0.6 },
  confidence: { $gte: 0.7 },
});
// → LLM đang tự tin nhưng documents không tốt - cần review
```

---

## Testing

### Test Case 1: Câu hỏi có documents tốt

```
Input: "Học phí ngành CNTT là bao nhiêu?"
Expected:
- relevance: > 0.8 (tìm được docs tốt)
- answer_confidence: > 0.8 (LLM tự tin)
- final_confidence: > 0.8
```

### Test Case 2: Câu hỏi mơ hồ

```
Input: "Học phí"
Expected:
- relevance: 0.6-0.7 (nhiều docs nhưng không chắc chắn)
- answer_confidence: 0.7-0.8 (LLM tổng hợp được)
- final_confidence: 0.65-0.75
```

### Test Case 3: Câu hỏi ngoài scope

```
Input: "Thời tiết hôm nay thế nào?"
Expected:
- relevance: < 0.3 (không tìm được docs liên quan)
- answer_confidence: < 0.3 (LLM không tự tin)
- final_confidence: < 0.3 → FALLBACK
```

---

## Files Changed

### Core Logic

- `app/rag/llm.py` - Thêm `evaluate_answer_confidence()`
- `app/rag/retriever.py` - Rename `calculate_confidence()` → `calculate_retrieval_quality()`
- `app/rag/orchestrator.py` - Kết hợp 2 metrics, thêm `relevance` vào response

### Schemas

- `app/schemas/chat.py` - Thêm `relevance` field
- `app/schemas/logs.py` - Thêm `relevance` field

### Services

- `app/services/chat_service.py` - Lưu và trả về `relevance`

### Constants

- `app/constants/departments.py` - NEW: Department contact information

---

## Breaking Changes

**KHÔNG CÓ** breaking changes. Tất cả thay đổi đều backward compatible.

- API clients cũ: Vẫn nhận được `confidence` như trước
- Database queries cũ: Vẫn hoạt động (relevance = null cho data cũ)
- Existing code: Không cần sửa logic dựa trên `confidence`

---

## Recommendations

1. **Monitor cả 2 metrics** để hiểu rõ performance
2. **Alert khi gap quá lớn** giữa relevance và answer_confidence
3. **Log metrics** vào analytics để fine-tune thresholds
4. **Display relevance** trong admin dashboard để debugging

---

## Questions?

Contact: Dev Team
Date: December 8, 2025
