# ADR 0004: Tempo As The Tracing Backend

- Status: Accepted
- Date: 2026-03-30

## Context

The observability strategy is centered on Grafana, Prometheus, Loki, and Alertmanager.
Tracing should integrate cleanly with that stack.

## Decision

Use `OpenTelemetry Collector + Tempo` for tracing instead of maintaining a parallel Jaeger path.

## Consequences

- The observability stack stays more cohesive.
- Dashboards and drill-down workflows are easier to present in demos.
- The project avoids carrying two tracing storylines at once.
