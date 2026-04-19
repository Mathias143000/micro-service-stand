# Demo Runbook

## Purpose

Use this runbook to bring the RomanEstate DevOps lab up in full demo mode and prove the main platform story.

## Start the Stack

```powershell
python tools\bootstrap_env.py up --with-observability --build --smoke-after-up
```

Expected result:

- edge available on `http://127.0.0.1:8088`
- Grafana available on `http://127.0.0.1:3000`
- smoke confirms auth, extracted services, metrics, logs, and traces

## Run the End-to-End Flow

```powershell
python tools\e2e_flow.py --base-url http://127.0.0.1:8088 --json
```

Expected result:

- login succeeds through `auth-service`
- a listing is created through `listing-service`
- a favorite is stored through `profile-service`
- a viewing request is created through `deal-service`
- `notification-service` consumes `listing.created` and `viewing-request.created`

## Check Platform Signals

- `http://127.0.0.1:3000` for dashboards and trace exploration
- `http://127.0.0.1:9090` for Prometheus target state
- `http://127.0.0.1:9093` for Alertmanager readiness
- `http://127.0.0.1:8088/internal/` for internal quick links

## Run the Lightweight Load Scenario

```powershell
python tools\traffic_generator.py --base-url http://127.0.0.1:8088 --iterations 12 --concurrency 3 --json
```

## Shut the Stack Down

```powershell
python tools\bootstrap_env.py down --with-observability
```
