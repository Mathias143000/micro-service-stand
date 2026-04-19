FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

WORKDIR /app

RUN useradd --create-home appuser

COPY app ./app
COPY tests ./tests
COPY README.md RUNBOOK.md .env.example ./

USER appuser

EXPOSE 8080

CMD ["python", "-m", "app.server"]
