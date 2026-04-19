# ADR 0002: RabbitMQ Over Kafka For Async Workflows

- Status: Accepted
- Date: 2026-03-30

## Context

The DevOps lab needs asynchronous workflows for business events, retries, and failure demos.
The project is a portfolio-grade stand, not a high-scale event-streaming platform.

## Decision

Use `RabbitMQ` as the initial broker instead of Kafka.

## Consequences

- The platform is easier to run, explain, and troubleshoot locally.
- Async business flows remain credible without adding unnecessary operational weight.
- If future requirements demand true streaming semantics, a later ADR can revisit the broker.
