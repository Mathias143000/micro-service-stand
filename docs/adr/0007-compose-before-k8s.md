# ADR 0007: Docker Compose Is The Golden Path Before Kubernetes

- Status: Accepted
- Date: 2026-03-30

## Context

The platform goal is a polished DevOps demo stand. Kubernetes is valuable, but only after the
local platform is stable, explainable, and easy to run.

## Decision

Use `docker compose` as the primary runtime and demo path. Treat Kubernetes as a later bonus track only.

## Consequences

- The platform gets to a working demo state faster.
- Local troubleshooting is easier during migration.
- Kubernetes remains available as a strong follow-up milestone rather than a blocker.
