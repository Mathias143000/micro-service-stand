# Workload Platform Hardening

This repository is a supporting service-platform lab. The third hardening wave keeps the scope focused: make the workload topology safer and easier to review without turning this repo into the primary Kubernetes platform flagship.

## What Is Covered

- `auth-service` runtime image now drops to a non-root user
- Python service images already run as `appuser`
- Nginx edge has basic security headers, request timeouts, and per-IP request limiting
- CI runs a repo-local hardening policy check before the full stack smoke path
- CI still validates unit tests, compose manifests, full stack bootstrap, smoke, e2e, traffic generation, and backup/restore

## Local Validation

```powershell
python tools\hardening_check.py
docker compose --env-file infra\compose\.env.example -f infra\compose\docker-compose.devops-lab.yml config
docker compose --env-file infra\compose\.env.example -f infra\compose\docker-compose.devops-lab.yml -f infra\compose\docker-compose.observability.yml config
python tools\bootstrap_env.py up --with-observability --build --smoke-after-up
python tools\e2e_flow.py --base-url http://127.0.0.1:8088 --json
python tools\traffic_generator.py --base-url http://127.0.0.1:8088 --iterations 12 --concurrency 3 --json
```

The CI smoke path checks observability component readiness. Deeper log/trace evidence is available as an explicit operator check after the stack has warmed up:

```powershell
python tools\smoke_check.py --base-url http://127.0.0.1:8088 --check-auth --check-services --check-observability --check-logs --check-tracing
```

The hardening check writes a local report to:

```text
artifacts/hardening/hardening-report.json
```

The report is ignored by Git because it is runtime evidence, not source code.

## Deliberate Trade-Offs

- The edge hardening is a local lab guardrail, not a replacement for production ingress/WAF policy.
- `MinIO` remains a platform shell component in this repo; object-storage incident drills stay backlog.
- Outbox/inbox guarantees are documented as a future reliability step rather than being forced into this wave.

## Remaining Backlog

- outbox/inbox guarantees for event publishing and consumption
- broader trace coverage across listing/deal/profile/notification flows
- object-storage backup automation and incident simulation
- production ingress policy equivalent for the edge rules
