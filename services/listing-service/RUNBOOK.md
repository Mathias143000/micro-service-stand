# Runbook: Listing Service

## Start

```powershell
python -m app.server
```

## Health Validation

- `GET /health`
- `GET /ready`
- `GET /live`
- `GET /metrics`

## Standard Troubleshooting

- confirm the port is free
- run unit tests
- validate Docker build
- inspect JSON logs in stdout
