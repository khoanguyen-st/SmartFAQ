# RAG Metrics Dashboard Setup Guide

## Overview

Hướng dẫn setup monitoring dashboard cho RAG pipeline với Grafana hoặc Kibana.

## Architecture

```
RAG Pipeline → JSON Logs → Log Aggregator → Dashboard
                   ↓
            logs/rag_metrics.json
                   ↓
        Filebeat/Fluentd/Vector
                   ↓
        Elasticsearch/Loki
                   ↓
          Grafana/Kibana
```

## Option 1: Grafana + Loki (Recommended)

### 1. Enable JSON Logging

```python
# app/main.py
from app.utils.logging_config import setup_rag_metrics_logger

# Setup RAG metrics logger
rag_logger = setup_rag_metrics_logger("logs/rag_metrics.json")

# Log metrics in orchestrator
rag_logger.info(
    "RAG request completed",
    extra={
        "request_id": metrics.request_id,
        "metrics": metrics.to_dict(),
    }
)
```

### 2. Install Promtail (Log Shipper)

```bash
# Download Promtail
wget https://github.com/grafana/loki/releases/download/v2.9.0/promtail-linux-amd64.zip
unzip promtail-linux-amd64.zip
chmod +x promtail-linux-amd64
```

### 3. Configure Promtail

Create `promtail-config.yml`:

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: rag-metrics
    static_configs:
      - targets:
          - localhost
        labels:
          job: rag-metrics
          __path__: /path/to/SmartFAQ/apps/api/logs/rag_metrics.json
    pipeline_stages:
      - json:
          expressions:
            timestamp: timestamp
            level: level
            message: message
            request_id: request_id
            confidence: metrics.confidence
            latency_ms: metrics.total_latency_ms
            fallback: metrics.fallback_triggered
            error_type: metrics.error_type
      - timestamp:
          source: timestamp
          format: RFC3339
      - labels:
          level:
          error_type:
```

### 4. Docker Compose Setup

Add to `docker-compose.yml`:

```yaml
services:
  loki:
    image: grafana/loki:2.9.0
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml
      - loki-data:/loki
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:2.9.0
    volumes:
      - ./promtail-config.yml:/etc/promtail/config.yml
      - ./apps/api/logs:/logs
    command: -config.file=/etc/promtail/config.yml

  grafana:
    image: grafana/grafana:10.2.0
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning

volumes:
  loki-data:
  grafana-data:
```

### 5. Create Grafana Dashboard

#### Panel 1: Request Rate
```promql
rate({job="rag-metrics"}[5m])
```

#### Panel 2: Average Latency
```promql
avg_over_time({job="rag-metrics"} | json | unwrap latency_ms [5m])
```

#### Panel 3: Average Confidence
```promql
avg_over_time({job="rag-metrics"} | json | unwrap confidence [5m])
```

#### Panel 4: Fallback Rate
```promql
sum(rate({job="rag-metrics", fallback="true"}[5m])) / 
sum(rate({job="rag-metrics"}[5m]))
```

#### Panel 5: Error Distribution
```promql
sum by (error_type) (
  count_over_time({job="rag-metrics", error_type!=""} [5m])
)
```

#### Panel 6: Latency by Stage
```promql
# Retrieval
avg_over_time({job="rag-metrics"} | json | line_format "{{.metrics.stage_timings.retrieval_ms}}" | unwrap retrieval_ms [5m])

# Generation
avg_over_time({job="rag-metrics"} | json | line_format "{{.metrics.stage_timings.generation_ms}}" | unwrap generation_ms [5m])
```

## Option 2: Kibana + Elasticsearch

### 1. Install Filebeat

```bash
curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-8.11.0-linux-x86_64.tar.gz
tar xzvf filebeat-8.11.0-linux-x86_64.tar.gz
cd filebeat-8.11.0-linux-x86_64/
```

### 2. Configure Filebeat

Edit `filebeat.yml`:

```yaml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /path/to/SmartFAQ/apps/api/logs/rag_metrics.json
    json.keys_under_root: true
    json.add_error_key: true
    fields:
      log_type: rag_metrics

output.elasticsearch:
  hosts: ["localhost:9200"]
  index: "rag-metrics-%{+yyyy.MM.dd}"

setup.kibana:
  host: "localhost:5601"

setup.template.name: "rag-metrics"
setup.template.pattern: "rag-metrics-*"
```

### 3. Docker Compose Setup

```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - es-data:/usr/share/elasticsearch/data

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.11.0
    user: root
    volumes:
      - ./filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - ./apps/api/logs:/logs:ro
    depends_on:
      - elasticsearch

volumes:
  es-data:
```

### 4. Create Kibana Dashboard

#### Visualization 1: Request Volume
```json
{
  "query": {
    "match_all": {}
  },
  "aggs": {
    "requests_over_time": {
      "date_histogram": {
        "field": "timestamp",
        "interval": "1m"
      }
    }
  }
}
```

#### Visualization 2: Average Confidence
```json
{
  "query": {
    "match_all": {}
  },
  "aggs": {
    "avg_confidence": {
      "avg": {
        "field": "metrics.confidence"
      }
    }
  }
}
```

#### Visualization 3: Latency Percentiles
```json
{
  "query": {
    "match_all": {}
  },
  "aggs": {
    "latency_percentiles": {
      "percentiles": {
        "field": "metrics.total_latency_ms",
        "percents": [50, 75, 90, 95, 99]
      }
    }
  }
}
```

#### Visualization 4: Error Types
```json
{
  "query": {
    "exists": {
      "field": "metrics.error_type"
    }
  },
  "aggs": {
    "error_types": {
      "terms": {
        "field": "metrics.error_type.keyword",
        "size": 10
      }
    }
  }
}
```

## Key Metrics to Monitor

### 1. Performance Metrics
- **Request Rate**: Requests/second
- **Average Latency**: Total time to answer
- **P95 Latency**: 95th percentile
- **P99 Latency**: 99th percentile

### 2. Quality Metrics
- **Average Confidence**: Overall answer quality
- **Fallback Rate**: % queries without good answer
- **Sources per Query**: Context utilization

### 3. Error Metrics
- **Error Rate**: Total errors/requests
- **Error Distribution**: By ErrorType
- **LLM Quota Errors**: API limit hits

### 4. Stage Breakdown
- **Normalization Time**: Input processing
- **Analysis Time**: Query understanding
- **Retrieval Time**: Document search
- **Generation Time**: Answer creation

## Alerts Setup

### Grafana Alerts

```yaml
# High Latency Alert
- alert: HighRAGLatency
  expr: avg_over_time({job="rag-metrics"} | json | unwrap latency_ms [5m]) > 3000
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High RAG latency detected"
    description: "Average latency is {{ $value }}ms (threshold: 3000ms)"

# High Fallback Rate Alert
- alert: HighFallbackRate
  expr: |
    sum(rate({job="rag-metrics", fallback="true"}[5m])) / 
    sum(rate({job="rag-metrics"}[5m])) > 0.2
  for: 10m
  labels:
    severity: critical
  annotations:
    summary: "High fallback rate detected"
    description: "Fallback rate is {{ $value | humanizePercentage }}"

# Low Confidence Alert
- alert: LowRAGConfidence
  expr: avg_over_time({job="rag-metrics"} | json | unwrap confidence [5m]) < 0.5
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "Low RAG confidence detected"
    description: "Average confidence is {{ $value }}"
```

### Kibana Watcher

```json
{
  "trigger": {
    "schedule": {
      "interval": "5m"
    }
  },
  "input": {
    "search": {
      "request": {
        "indices": ["rag-metrics-*"],
        "body": {
          "query": {
            "range": {
              "timestamp": {
                "gte": "now-5m"
              }
            }
          },
          "aggs": {
            "avg_latency": {
              "avg": {
                "field": "metrics.total_latency_ms"
              }
            }
          }
        }
      }
    }
  },
  "condition": {
    "compare": {
      "ctx.payload.aggregations.avg_latency.value": {
        "gt": 3000
      }
    }
  },
  "actions": {
    "send_email": {
      "email": {
        "to": "ops@example.com",
        "subject": "High RAG Latency Alert",
        "body": "Average latency: {{ctx.payload.aggregations.avg_latency.value}}ms"
      }
    }
  }
}
```

## Dashboard Examples

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│ RAG Performance Dashboard                               │
├──────────────┬──────────────┬──────────────┬───────────┤
│ Request Rate │ Avg Latency  │ Avg Conf.    │ Fallback %│
│   125 req/s  │   1.2s       │   0.78       │   5.2%    │
├──────────────┴──────────────┴──────────────┴───────────┤
│ Latency Over Time (Line Chart)                         │
│ ───────────────────────────────────────────────────────│
│                                                         │
├──────────────────────────────┬─────────────────────────┤
│ Error Distribution (Pie)     │ Stage Breakdown (Bar)   │
│                              │                         │
├──────────────────────────────┴─────────────────────────┤
│ Recent Errors (Table)                                   │
│ ───────────────────────────────────────────────────────│
│ Time     | Request ID | Error Type        | Message    │
└─────────────────────────────────────────────────────────┘
```

## Best Practices

### 1. Log Retention

```yaml
# Loki retention
limits_config:
  retention_period: 30d

# Elasticsearch ILM
PUT _ilm/policy/rag-metrics-policy
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {}
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

### 2. Sampling for High Traffic

```python
# Sample 10% of requests for metrics
import random

if random.random() < 0.1:
    rag_logger.info("RAG request completed", extra={"metrics": metrics.to_dict()})
```

### 3. Aggregation Intervals

- Real-time: 1-minute windows
- Historical: 1-hour aggregations
- Long-term: Daily summaries

## Troubleshooting

### Issue: Logs not appearing in Grafana

**Check:**
1. Promtail is running: `docker ps | grep promtail`
2. Log file path is correct in `promtail-config.yml`
3. Loki is accessible: `curl http://localhost:3100/ready`

### Issue: High memory usage in Elasticsearch

**Solution:**
```yaml
# Reduce heap size
environment:
  - "ES_JAVA_OPTS=-Xms256m -Xmx256m"
```

### Issue: Dashboard queries are slow

**Solution:**
- Add indexes: `timestamp`, `request_id`, `error_type`
- Use shorter time ranges
- Aggregate data before querying

## Next Steps

1. **Custom Metrics**: Add business-specific metrics (e.g., queries by category)
2. **User Analytics**: Track user satisfaction, query patterns
3. **A/B Testing**: Compare different RAG configurations
4. **Cost Monitoring**: Track LLM API costs per query
