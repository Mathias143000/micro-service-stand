# Observability

Expanded observability baseline for the RomanEstate DevOps lab.

## Included

- `Prometheus` for scraping platform and service metrics
- `Grafana` with repo-provisioned datasource and dashboard
- `Alertmanager` for rule-based notifications and alert routing
- `Loki` for centralized log storage
- `Grafana Alloy` for Docker log collection into Loki
- `postgres-exporter` for PostgreSQL metrics
- `redis-exporter` for Redis metrics
- `node-exporter` for host-level metrics
- `cAdvisor` for container metrics
- starter dashboard: `RomanEstate Platform Overview`

## Compose

Use the observability compose file together with the core lab compose file:

```powershell
docker compose --env-file infra/compose/.env.example `
  -f infra/compose/docker-compose.devops-lab.yml `
  -f infra/compose/docker-compose.observability.yml up -d --build
```

## URLs

- Prometheus: `http://127.0.0.1:9090`
- Grafana: `http://127.0.0.1:3000`
- Alertmanager: `http://127.0.0.1:9093`
- Loki: `http://127.0.0.1:3100`
- Alloy: `http://127.0.0.1:12345`

Default credentials are read from `infra/compose/.env.example`.

## Smoke validation

The lightweight smoke script can also verify the observability endpoints:

```powershell
python tools/smoke_check.py `
  --base-url http://127.0.0.1:8088 `
  --check-auth `
  --skip-public-root `
  --check-observability
```

This now verifies:

- edge health
- auth login and `/api/auth/me`
- Prometheus, Grafana, Alertmanager, and Loki readiness
- that Docker logs for `auth-service` are queryable from Loki
