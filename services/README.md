# Services Workspace

This directory is reserved for services extracted from the current backend monolith.

Current state:

- the production logic still lives in `back/`
- architecture rules live in `docs/`
- platform bootstrap lives in `infra/`

Target extracted services:

- `auth-service`
- `listing-service`
- `profile-service`
- `deal-service`
- `support-service`
- `analytics-service`
- `notification-service`
- `media-service`

Use [../docs/golden-path-service.md](../docs/golden-path-service.md) before scaffolding any new service.

Implemented so far:

- `auth-service`
