# ADR 0001: Monorepo Strategy For The DevOps Lab

- Status: Accepted
- Date: 2026-03-30

## Context

RomanEstate is being transformed from a single deployable application into a multi-service
DevOps lab. The project needs one walkthrough-friendly repository, one shared compose setup,
one CI story, and shared contracts during migration.

## Decision

Use a `monorepo` strategy. Keep the current application under `back/`, introduce platform
assets under `docs/`, `infra/`, and `tools/`, and add extracted services under `services/`
as they become real.

## Consequences

- CI/CD stays centralized and easier to explain.
- Shared contracts and migration assets are simpler to manage.
- Local development remains easier than a multirepo setup.
- Repository discipline becomes more important because unrelated changes can accumulate.
