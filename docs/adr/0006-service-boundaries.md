# ADR 0006: Initial Service Boundaries

- Status: Accepted
- Date: 2026-03-30

## Context

RomanEstate already contains package-level domain boundaries inside the monolith. The DevOps
lab needs service boundaries that are easy to justify technically and easy to demonstrate.

## Decision

Use the following initial service boundaries:

- `auth-service`
- `listing-service`
- `profile-service`
- `deal-service`
- `support-service`
- `analytics-service`
- `notification-service`
- `media-service`

Keep internal backoffice capabilities in the monolith until route ownership, role handling,
and operational boundaries are clearer.

## Consequences

- Extraction can proceed in slices that map to existing code.
- The first three extraction candidates are `auth-service`, `listing-service`, and `deal-service`.
- Some internal admin capabilities remain transitional for a while, which is acceptable for the first stage.
