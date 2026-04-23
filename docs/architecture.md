# RomanEstate DevOps Lab Architecture

## Objective

This document records the target service-platform architecture implemented by this lab.
The current application remains the source of truth, while new services and infrastructure
are introduced around it in a staged, migration-friendly way.

## Current State

RomanEstate is currently a monolith-centered platform inside one repository:

- `back/src` - Spring Boot backend with marketplace, internal office, auth, analytics, deals, support chat, and media flows.
- `back/public-frontend` - public marketplace frontend.
- `back/internal-frontend` - internal office frontend.
- `back/e2e` - Playwright browser smoke and end-to-end tests.
- `back/uploads` - local media storage.
- `back/docker-compose.yml` - local PostgreSQL only.

The monolith already contains domain-shaped packages, which is a strong starting point for
modular-monolith refactoring before extraction.

## Current Domain Map

| Domain area | Current Java packages | Current API groups | Target service |
| --- | --- | --- | --- |
| Edge / delivery | `web`, frontend apps | `/`, `/internal`, SPA routes | `edge` via `nginx` |
| Auth / identity | `user`, `security`, part of `marketplace` | `/auth/**`, `/api/auth/**`, `/api/me`, `/api/whoami` | `auth-service` |
| Listings / property catalog | `marketplace`, `property`, `favorite` | `/posts/**`, `/api/listings/**`, `/api/properties/**`, `/api/favorites/**` | `listing-service` |
| Profile / user cabinet | `marketplace`, `user`, `favorite` | `/users/**`, `/api/profile/**` style flows inside current `/api` endpoints | `profile-service` |
| Deals / transaction workflows | `deal`, `contract`, `credit`, `payment`, `chat`, part of `marketplace` | `/api/deals/**`, `/api/contracts/**`, `/api/credits/**`, `/api/payments/**`, `/api/chats/**`, `/api/marketplace-deals/**` | `deal-service` |
| Support | `supportchat` | `/api/support-chat/**`, `/api/internal/support-chat/**` | `support-service` |
| Analytics / dashboards | `analytics`, `dashboard` | `/api/analytics/**`, `/api/internal/dashboard/**` | `analytics-service` |
| Organizations / internal admin | `org`, part of `user` | `/api/organizations/**`, `/api/users/**` | `internal-backoffice-service` or split internal services |
| Media | `property` + filesystem storage | `/api/properties/{id}/images`, `/api/images/{id}` | `media-service` |

## Target Architecture

### Phase 1 target

The first strong version of the DevOps lab keeps business logic in the current monolith,
but places a production-style platform around it:

- `nginx` as edge, reverse proxy, and routing entrypoint
- shared infrastructure through Docker Compose
- explicit architecture docs and ADRs
- service golden path and extraction rules
- migration path from monolith packages to extracted services

### Phase 2 target

The first extracted services should be:

1. `auth-service`
2. `listing-service`
3. `deal-service`

These give the best architectural value quickly because they are high-traffic, easy to
explain in interviews, and map well to existing package boundaries.

## Migration Strategy

### Step 1. Strengthen the modular monolith

- keep the current backend deployable
- treat packages as bounded contexts
- formalize inter-module contracts
- standardize logging, tracing, health, and configuration

### Step 2. Introduce the platform shell

- add `nginx` edge
- add shared infra services: PostgreSQL, Redis, RabbitMQ, MinIO
- add the observability stack in follow-up waves

### Step 3. Extract services one by one

- move one bounded context at a time
- preserve compatibility through edge routing
- use transactional event publishing for async handoff
- avoid premature database fragmentation

## Repository Strategy

RomanEstate stays a `monorepo`.

Recommended target layout:

```text
.
|-- back/                      # current monolith and frontends
|-- docs/
|   |-- adr/
|   `-- architecture.md
|-- infra/
|   |-- compose/
|   |-- nginx/
|   `-- observability/
|-- services/
|   |-- auth-service/
|   |-- listing-service/
|   |-- deal-service/
|   |-- profile-service/
|   |-- support-service/
|   |-- analytics-service/
|   `-- notification-service/
`-- tools/
```

The `back` directory remains active during migration. New services appear under `services/`
only when their boundaries, contracts, and operational requirements are already defined.

## Service Boundaries

### Auth service

Owns:

- authentication
- JWT issuance and validation strategy
- refresh token lifecycle
- user identity and roles
- public and internal login flows

Should publish events such as:

- `user.registered`
- `user.role-changed`

### Listing service

Owns:

- public listing search
- property cards and details
- favorites and saved state linked to discovery
- property metadata
- listing publication lifecycle

Should publish events such as:

- `listing.created`
- `listing.updated`
- `listing.price-changed`

### Deal service

Owns:

- viewing requests
- deal stages
- contracts
- credit applications
- payments
- deal chat

Should publish events such as:

- `viewing-request.created`
- `deal.created`
- `deal.status-changed`

### Profile service

Owns:

- user cabinet
- favorites overview
- saved searches
- recently viewed state
- profile settings

### Support service

Owns:

- support inbox
- public support chat
- internal support conversation handling

### Analytics service

Owns:

- derived metrics
- dashboard aggregation
- export-oriented analytics views

## Shared Database Transition

The migration begins with a shared PostgreSQL instance, but with explicit ownership:

- each bounded context gets a documented table ownership list
- cross-context writes are forbidden except through approved transition seams
- extracted services may still use the same PostgreSQL instance at first, but with separate schemas where possible
- long term target is database-per-service where it is justified

This keeps the transition realistic instead of over-engineered.

## Eventing Strategy

RomanEstate will use `RabbitMQ` for asynchronous workflows.

Required patterns:

- `outbox pattern` for producers
- idempotent consumers
- retry strategy
- DLQ strategy
- versioned event schemas

This is mandatory before critical workflows depend on asynchronous messaging.

## Edge Routing Plan

Initial edge routes:

- `/` -> public frontend
- `/internal/` -> internal frontend
- `/api/` -> backend monolith for now, then progressively to extracted services
- `/auth/` -> backend monolith for now, then `auth-service`
- `/posts/` -> backend monolith for now, then `listing-service`
- `/users/` -> backend monolith for now, then `profile-service`
- `/uploads/` -> backend monolith now, then `media-service` or MinIO-backed media flow

The edge layer becomes the migration seam that hides backend changes from clients.

## Developer Workflow

### Current golden path

1. Start shared infra through Docker Compose.
2. Run monolith and both frontends locally.
3. Access the system through `nginx` edge.
4. Add new services only when they meet the golden path contract.

### Future golden path

1. Start the full lab through Compose.
2. Inspect health through `/healthz`, Actuator, and service probes.
3. Inspect logs, metrics, and traces through the observability stack.
4. Run smoke/e2e and service-level checks.

## Near-Term Deliverables

Wave 1 should deliver:

- architecture documentation
- ADR layer
- service golden path
- initial DevOps compose scaffold
- `nginx` edge config for the current monolith + frontends

Wave 2 should deliver:

- extracted `auth-service`
- extracted `listing-service`
- extracted `deal-service`
- initial Prometheus and Grafana setup

## Extracted Services Status

### Auth service

`auth-service` is now the first concrete extraction slice in the repository:

- code lives under `services/auth-service`
- it uses the shared PostgreSQL transition model
- it preserves the current JWT token format for compatibility
- `nginx` routes `/api/auth/**` and `/api/whoami` to it in the DevOps lab compose setup
- runtime smoke is validated through `edge` for `/healthz`, `/api/auth/login`, and `/api/auth/me`

This extraction is intentionally narrow and safe: internal staff authentication moves first,
while public marketplace auth under `/auth/**` stays in the monolith for now.

### Platform shell and observability

The DevOps lab now has a working platform shell around the monolith and the first extracted service:

- `docker-compose.devops-lab.yml` brings up `edge`, `auth-service`, `PostgreSQL`, `Redis`, `RabbitMQ`, and `MinIO`
- `docker-compose.observability.yml` adds `Prometheus` and `Grafana`
- observability provisioning lives in repo under `infra/observability/`
- `tools/bootstrap_env.py` is the current bootstrap entrypoint for `core` and `core + observability`

This means the migration is no longer only design-first. The repository already contains a
working extraction seam, a reproducible runtime shell, and a starter observability stack.
