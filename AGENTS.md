# AGENTS.md

## Project Status

M0/M1 in progress. Identity service and Gateway service have initial implementations. Frontend has auth client configured. Other services are empty scaffolds.

## Architecture

Microservices monorepo. Each service has its own database — **no foreign keys across services**. Cross-service references are logical (UUID) or via API only.

```
apps/
  frontend/            React + Vite + shadcn/ui + TanStack Query + Zustand
  gateway-service/     Spring Cloud Gateway (Java 21)
  identity-service/    Hono + Better Auth + Drizzle + PostgreSQL
  media-service/       Node.js + UploadThing
  catalog-service/     Spring Boot 3.x (Java 21)
  messaging-service/   Spring Boot 3.x (Java 21)
  admin-service/       Spring Boot 3.x (Java 21)
```

## Identity Service (In Progress)

**Stack:** Hono + Better Auth + Drizzle ORM + PostgreSQL (Neon)

**Endpoints:**
- `POST/GET /auth/*` — Better Auth handler (login, register, session)
- `GET /internal/v1/validate-session` — Gateway calls this to validate session cookies, returns `{ userId, email, role }`

**Gateway routing:**
- `/api/v1/identity/**` → identity-service with StripPrefix=3
- Better Auth `basePath: "/auth"` → final path: `/api/v1/identity/auth/sign-in/email`

**Env vars:**
- `BETTER_AUTH_SECRET` — encryption secret
- `BETTER_AUTH_URL` — service URL (for cookie domain)
- `FRONTEND_URL` — frontend origin for CORS (default: `http://localhost:5173`)
- `DATABASE_URL` — PostgreSQL connection string

**Commands:**
```bash
npm run dev      # tsx watch src/index.ts
npm run build    # tsc
npx drizzle-kit push  # apply schema changes
```

## Gateway Service (In Progress)

**Stack:** Spring Boot 3.5.x + Spring Cloud 2025.0.x + Spring Cloud Gateway (WebMVC) + Java 21

**Port:** 8080

**Routes:**
- `/api/v1/identity/**` → identity-service:3000 (StripPrefix=3)

**Config:** Spring Cloud Gateway WebMVC usa `spring.cloud.gateway.server.webmvc.routes` (no `spring.cloud.gateway.routes`)

**Auth filter:** Servlet filter validates sessions via identity-service, injects `X-User-Id`, `X-User-Email`, `X-User-Role` headers. Skips auth for `/api/v1/identity/**` and `/actuator/**`.

**CORS:** Gateway handles CORS centrally. **Do not add CORS middleware to downstream services** (causes duplicate headers).

**Env vars (application.yml):**
- `frontend.url` — frontend origin for CORS (default: `http://localhost:5173`)
- `identity-service.url` — identity service URL (default: `http://localhost:3000`)

**Commands:**
```bash
.\mvnw.cmd spring-boot:run   # start gateway
.\mvnw.cmd compile            # compile
```

## Frontend (In Progress)

**Stack:** React 19 + Vite + shadcn/ui + React Router + Better Auth client

**Auth client:** `src/lib/auth.ts` — `createAuthClient` from `better-auth/react` with `baseURL: "http://localhost:8080/api/v1/identity/auth"` (Gateway URL + `/auth` basePath — Better Auth client does NOT auto-append basePath)

**Commands:**
```bash
npm run dev      # vite dev server (port 5173)
npm run build    # tsc + vite build
npm run lint     # eslint
```

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
