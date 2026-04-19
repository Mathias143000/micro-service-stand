# Backup and Restore Runbook

## Purpose

Use this runbook to demonstrate a simple PostgreSQL backup and restore verification flow for the RomanEstate DevOps lab.

## Preconditions

- the core stack is already up
- `postgres` is healthy in `docker compose ps`

## Create a Backup

```powershell
python tools\backup_postgres.py --output artifacts\realestate.sql
```

Expected result:

- an SQL dump is written to `artifacts\realestate.sql`

## Restore into a Verification Database

```powershell
python tools\restore_postgres.py --input artifacts\realestate.sql --target-db realestate_restore_check
```

Expected result:

- the target database is recreated
- the dump is restored
- the script verifies that public tables exist after restore

## Failure Notes

- if backup fails, inspect `docker compose ps` and confirm `postgres` is healthy
- if restore fails, inspect the SQL dump size first and then check `postgres` logs
- if verification reports zero tables, the dump may have been created before schema initialization
