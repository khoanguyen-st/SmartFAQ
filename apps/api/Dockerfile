FROM python:3.11-slim

WORKDIR /app

COPY apps/api/pyproject.toml ./
COPY apps/api/requirements-dev.txt ./
RUN pip install --upgrade pip && pip install -r requirements-dev.txt

COPY apps/api/app ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
