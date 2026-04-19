# ADR 0005: Shared PostgreSQL Transition During Service Extraction

- Status: Accepted
- Date: 2026-03-30

## Context

The current system is a Spring Boot monolith backed by one PostgreSQL database. Immediate
database-per-service would add migration cost before service boundaries and platform guardrails
are stable.

## Decision

Start with a shared PostgreSQL deployment during migration, but document data ownership by
bounded context and move toward schema or database isolation progressively.

## Consequences

- Migration remains practical and incremental.
- Strong ownership rules are required to prevent hidden coupling.
- Some technical debt remains until the most important services are fully isolated.
