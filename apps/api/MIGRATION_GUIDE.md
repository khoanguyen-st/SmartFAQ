# Migration Guide: RAG Enhancements

## 🎯 Quick Start

Follow these steps to deploy the enhanced RAG pipeline.

---

## Step 1: Update Environment Variables

Add the following to your `.env` file:

```bash
# New setting for confidence calculation
CONFIDENCE_DECAY=0.6

# If not already present, add hybrid search settings:
HYBRID_ENABLED=true
HYBRID_K_VEC=20
HYBRID_K_LEX=20
HYBRID_FUSION_K=60
HYBRID_MAX_DOCS=5000
```

**Note:** If you're using Docker, update `.env.docker` as well.

---

## Step 2: No Database Migrations Required

✅ **Good news:** These changes don't require database migrations. The updates are code-only.

---

## Step 3: Update Dependencies

All dependencies remain the same. No new packages required.

```bash
# If needed, reinstall to ensure everything is current:
cd apps/api
source venv/bin/activate
pip install -r requirements.txt
```

---

## Step 4: Restart Services

### Docker Compose
```bash
docker compose restart api
docker compose logs -f api
```

### Manual/Development
```bash
# Restart the API server
pkill -f "uvicorn app.main:app"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Step 5: Verify Changes

### Check Logs
Look for the new log format with request IDs:

```
[a3f7b9c2] Query Start: 'Học phí là bao nhiêu?' | History: 0
[a3f7b9c2] Normalized: 'Học phí là bao nhiêu?' | Lang: vi
[a3f7b9c2] Analysis: valid | Sub-questions: 1
[a3f7b9c2] Retrieved 5 contexts from 3 docs
[a3f7b9c2] SUCCESS | Latency: 1234ms | Confidence: 0.85 | Contexts: 5 (3 docs) | Sub-queries: 1
```

### Test API Response
```bash
curl -X POST http://localhost:8000/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Học phí là bao nhiêu?"}' | jq
```

Expected response includes new fields:
```json
{
  "answer": "...",
  "confidence": 0.85,
  "sources": [...],
  "fallback_triggered": false,
  "latency_ms": 1234,
  "request_id": "a3f7b9c2",
  "metrics": {
    "num_sub_queries": 1,
    "num_contexts": 5,
    "num_unique_docs": 3,
    "language": "vi"
  }
}
```

---

## Step 6: Monitor for Issues

### Watch for Errors
```bash
# Monitor error logs
docker compose logs -f api | grep ERROR

# Or for manual setup:
tail -f logs/api.log | grep ERROR
```

### Common Issues & Solutions

#### Issue: `KeyError: 'CONFIDENCE_DECAY'`
**Solution:** Add `CONFIDENCE_DECAY=0.6` to your `.env` file

#### Issue: Confidence scores seem different
**Solution:** This is expected! The new calculation is more accurate. Monitor for 1-2 days and adjust `CONFIDENCE_THRESHOLD` if needed.

#### Issue: Different error messages
**Solution:** This is intentional. Users now see clearer, more helpful messages.

---

## Step 7: Adjust Confidence Threshold (Optional)

The new confidence calculation may produce different scores. Monitor the distribution:

```python
# Query your logs/metrics to see confidence distribution
# If most scores are lower than before, you may want to adjust:

# In .env:
CONFIDENCE_THRESHOLD=0.60  # Lower from 0.65 if needed
```

**Recommendation:** Wait 1 week before adjusting to gather enough data.

---

## Rollback Plan (If Needed)

If you encounter critical issues:

### Quick Rollback
```bash
git checkout main~1  # Go back one commit
docker compose restart api
```

### Targeted Rollback
If only specific features are problematic:

1. **Revert confidence calculation:**
```bash
git checkout main~1 -- apps/api/app/rag/retriever.py
```

2. **Revert error handling:**
```bash
git checkout main~1 -- apps/api/app/rag/orchestrator.py
rm apps/api/app/rag/metrics.py
```

3. **Restart services**

---

## Testing Checklist

Use this checklist to verify everything works:

- [ ] API starts without errors
- [ ] Logs show request IDs (8-character codes)
- [ ] Confidence scores are calculated (check logs)
- [ ] Error messages are user-friendly (test invalid queries)
- [ ] Bullet points appear in answers (test "list" questions)
- [ ] Response includes `request_id` and `metrics` fields
- [ ] Performance is similar or better (check `latency_ms`)

---

## Performance Comparison

### Before Enhancement
```
Average latency: ~1200ms
Confidence range: 0.45-0.95
Error clarity: Low (generic messages)
Observability: Minimal
```

### After Enhancement
```
Average latency: ~1200ms (similar)
Confidence range: 0.40-0.90 (more accurate spread)
Error clarity: High (specific messages)
Observability: Excellent (request IDs, stage timings)
```

---

## Support & Troubleshooting

### Get Help
1. Check `CHANGELOG_RAG_ENHANCEMENTS.md` for details
2. Review logs with request IDs for specific queries
3. Create GitHub issue with request ID and error message

### Useful Commands
```bash
# Check current config
docker compose exec api python -c "from app.core.config import settings; print(settings.CONFIDENCE_DECAY)"

# View recent errors
docker compose logs api --tail=100 | grep ERROR

# Test confidence calculation
docker compose exec api python -c "
from app.rag.retriever import Retriever
r = Retriever()
contexts = [{'score': 0.9, 'document_id': 'doc1'}, {'score': 0.8, 'document_id': 'doc2'}]
print(f'Confidence: {r.calculate_confidence(contexts, num_sub_queries=1):.3f}')
"
```

---

## Next Steps

After successful deployment:

1. ✅ Monitor logs for 48 hours
2. ✅ Gather user feedback on answer quality
3. ✅ Review confidence score distribution
4. ✅ Adjust thresholds if needed
5. ✅ Set up metrics dashboard (Priority 2)

---

## Questions?

- **Technical issues:** Check GitHub Issues
- **Documentation:** See `CHANGELOG_RAG_ENHANCEMENTS.md`
- **Best practices:** See "Tips & Best Practices" section in changelog

---

_Last updated: December 3, 2025_
