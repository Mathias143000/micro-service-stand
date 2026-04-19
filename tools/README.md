# Tools

Operational helper scripts for the RomanEstate DevOps lab.

## Available Scripts

- `bootstrap_env.py` - bring the DevOps lab up or down, optionally including the observability stack, and run the base smoke flow
- `compose_doctor.py` - diagnose local prerequisites, compose config, ports, and the current DevOps lab shape
- `smoke_check.py` - run lightweight HTTP smoke checks against the edge, extracted services, and observability stack
- `e2e_flow.py` - execute the end-to-end auth -> listing -> profile -> deal -> notification scenario
- `traffic_generator.py` - generate lightweight parallel load against the listing and deal paths
- `backup_postgres.py` - create a PostgreSQL dump from the running compose stack
- `restore_postgres.py` - restore a PostgreSQL dump into a verification database

## Examples

```powershell
python tools/bootstrap_env.py up --build --smoke-after-up
python tools/bootstrap_env.py up --with-observability
python tools/bootstrap_env.py ps --with-observability
python tools/compose_doctor.py
python tools/compose_doctor.py --json
python tools/smoke_check.py --base-url http://127.0.0.1:8088
python tools/smoke_check.py --base-url http://127.0.0.1:8088 --check-auth --check-services
python tools/smoke_check.py --base-url http://127.0.0.1:8088 --check-auth --check-services --check-observability --check-tracing
python tools/e2e_flow.py --base-url http://127.0.0.1:8088 --json
python tools/traffic_generator.py --base-url http://127.0.0.1:8088 --iterations 12 --concurrency 3 --json
python tools/backup_postgres.py --output artifacts\realestate.sql
python tools/restore_postgres.py --input artifacts\realestate.sql --target-db realestate_restore_check
```
