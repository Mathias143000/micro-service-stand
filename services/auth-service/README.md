# Auth Service

`auth-service` is the first extracted RomanEstate service. It owns the internal staff
authentication slice and keeps JWT compatibility with the current monolith.

## Scope

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `POST /api/auth/password/reset`
- `POST /api/auth/password/confirm`
- `GET /api/whoami`

## Run Locally

```powershell
cd services/auth-service
mvn spring-boot:run
```

## Operational Endpoints

- `/health`
- `/ready`
- `/live`
- `/metrics`
- `/info`
- `/swagger-ui/index.html`

## Notes

- The service uses the shared PostgreSQL transition model.
- Public marketplace auth under `/auth/**` stays in the monolith for now.
- Tokens remain compatible with the monolith because the signing format is preserved.
