# AGENTS.md

## Project Status

Pre-implementation (M0 Foundation). All service directories are empty scaffolds. No build tooling, Docker, or package configs exist yet.

## Architecture

Microservices monorepo. Each service has its own database — **no foreign keys across services**. Cross-service references are logical (UUID) or via API only.

```
apps/
  gateway-service/     Spring Cloud Gateway (Java 21)
  identity-service/    Node.js + Better Auth + Google OAuth
  media-service/       Node.js + UploadThing
  catalog-service/     Spring Boot 3.x (Java 21)
  messaging-service/   Spring Boot 3.x (Java 21)
  admin-service/       Spring Boot 3.x (Java 21)
```

Frontend (`apps/web`) does not exist yet. Stack: React + Vite + shadcn/ui + TanStack Query + Zustand.

## Auth Flow

Google OAuth -> Better Auth -> HttpOnly session cookie -> Gateway validates -> internal headers (`X-User-Id`, `X-User-Email`, `X-User-Role`) propagated to downstream services. Gateway centralizes auth; services trust the internal Docker network.

Identity service restricts login to `@cecar.edu.co` emails.

## API Conventions

- Public: `/api/v1/*`
- Internal (service-to-service): `/internal/v1/*`
- Errors: RFC 7807 Problem Details
- DTOs: never expose JPA entities; use MapStruct for mapping
- IDs: UUID everywhere

## Database

Single PostgreSQL instance, multiple databases: `identity_db`, `catalog_db`, `messaging_db`, `admin_db`. Migrations via Flyway (Spring Boot services).

## Conventions

- Package manager: **pnpm** (Node services)
- Java: **21 LTS**
- Node: **LTS**
- Branching: `main` / `develop` / `feature/*`
- Frontend structure: feature-based (`features/auth`, `features/catalog`, etc.)
- Layouts: PublicLayout, AppLayout, AdminLayout

## Key References

- `README.md` — full architecture, stack, and ADR summary
- `docs/backlog.md` — milestone/epic/task breakdown with implementation order
