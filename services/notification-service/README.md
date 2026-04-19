# Notification Service

Generated from `platform-engineering-starter-kit`.

## Purpose

This service starts from the platform golden path and includes:

- health, readiness, liveness, and metrics endpoints
- structured JSON request logs
- a standard Dockerfile
- a minimal CI template
- starter docs and runbook

## Local Run

```powershell
python -m app.server
```

Service defaults to port `8080`.

## Endpoints

- `/`
- `/health`
- `/ready`
- `/live`
- `/metrics`

## Validation

```powershell
python -m py_compile app/server.py tests/test_service.py
python -m unittest discover -s tests
docker build -t notification-service .
```
