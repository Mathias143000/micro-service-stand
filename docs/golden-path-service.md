# Golden Path For Any New Service

## Purpose

Every new service in RomanEstate must look and behave like part of one coherent platform.
This document is the baseline contract for any service extracted from the monolith.

## Directory Layout

Recommended service structure:

```text
services/<service-name>/
|-- src/
|   |-- main/
|   `-- test/
|-- migrations/
|-- openapi/
|-- Dockerfile
|-- .env.example
|-- README.md
`-- Makefile or task runner entry
```

## Operational Contract

Every service must provide:

- `GET /health` - shallow process health
- `GET /ready` - readiness including critical dependencies
- `GET /live` - liveness check for process supervision
- `GET /metrics` - Prometheus-compatible metrics

## Required Platform Capabilities

Every service must have:

- structured JSON logging
- request id and correlation id propagation
- OpenTelemetry tracing middleware
- clear configuration through environment variables
- container-first startup flow
- graceful shutdown
- timeout and retry defaults for downstream calls

## API Contract Rules

- own a clear path prefix or API surface
- publish an OpenAPI spec
- version public APIs intentionally
- avoid leaking persistence shapes directly to clients
- keep error envelopes consistent across services

## Data Rules

- each service must document owned tables, schemas, and entities
- direct writes into another service's owned data are forbidden
- async workflows must use outbox-based publishing
- consumers must be idempotent

## Docker Contract

Each service must ship a production-ready Dockerfile with:

- multi-stage build when justified
- non-root runtime where possible
- predictable exposed port
- healthcheck-compatible runtime
- no baked-in secrets

## Configuration Contract

Each service must have `.env.example` with:

- server port
- database variables
- broker variables if needed
- cache variables if needed
- tracing and metrics variables
- auth/security variables
- feature flags only when justified

## Test Layout

Each service must have:

- unit tests for business logic
- integration tests with real dependencies where useful
- contract tests for exposed APIs or events
- smoke check for container startup and health endpoints

## Documentation Contract

Each service `README.md` must explain:

- what the service owns
- which APIs it serves
- which events it emits and consumes
- required environment variables
- local run instructions
- health endpoints
- test commands

## Extraction Checklist

Before a new service is created, confirm:

- the bounded context is already defined
- the owner-data boundary is documented
- the route ownership is known
- the event contract is known if async behavior is involved
- the migration seam from the monolith is documented

## Starter Checklist

When scaffolding a new service, create:

- service README
- `.env.example`
- Dockerfile
- health endpoints
- metrics endpoint
- tracing and structured logging setup
- OpenAPI stub
- test skeleton
