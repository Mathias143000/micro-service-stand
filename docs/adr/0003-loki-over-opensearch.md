# ADR 0003: Loki Plus Alloy As The Initial Logging Stack

- Status: Accepted
- Date: 2026-03-30

## Context

RomanEstate needs centralized logging for the DevOps lab, but the first strong version
should avoid heavyweight operational complexity.

## Decision

Use `Loki + Grafana Alloy` as the initial centralized logging stack.

## Consequences

- The logging layer fits naturally into a Grafana-centric observability stack.
- The platform stays lighter than an ELK/OpenSearch-first design.
- Search capabilities are sufficient for a first strong demo, though less feature-rich than a heavier stack.
- The runtime avoids adopting `Promtail`, which reached end-of-life in 2026 and is no longer the forward-looking agent choice.
