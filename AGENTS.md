# AGENTS.md

## Repo Shape

- Microservices monorepo under `apps/`; there is no root workspace manifest, so run commands from the target service directory.
- Node services currently use npm lockfiles (`package-lock.json`); do not assume pnpm workspace commands.
- Implemented services: `frontend/`, `identity-service`, `gateway-service`, `catalog-service`, and a minimal `media-service`; `admin-service/` and `messaging-service/` are placeholders.
- Cross-service references are logical UUIDs/API calls only; do not add foreign keys between service databases.

## Commands

- Frontend (`apps/frontend`): `npm run dev`, `npm run build` (`tsc -b && vite build`), `npm run lint`, `npm run preview`.
- Identity (`apps/identity-service`): `npm run dev`, `npm run build`, `npm run start`, `npx drizzle-kit push` for Drizzle schema pushes.
- Media (`apps/media-service`): `npm run dev`, `npm run build`, `npm run start`; UploadThing files are served by Hono at `/api/uploadthing`.
- Gateway (`apps/gateway-service`): `./mvnw.cmd spring-boot:run`, `./mvnw.cmd compile`, `./mvnw.cmd test`, focused test `./mvnw.cmd -Dtest=MarketplaceApplicationTests test`.
- Catalog (`apps/catalog-service`): `./mvnw.cmd spring-boot:run`, `./mvnw.cmd compile`, `./mvnw.cmd test`, focused test `./mvnw.cmd -Dtest=MarketplaceCatalogApplicationTests test`.
- There are no frontend, identity, or media test scripts in `package.json` yet.

## Ports And Routing

- Frontend Vite dev server defaults to `http://localhost:5173`.
- Identity listens on `3000`; Better Auth is mounted at `/auth/*` and session validation at `/internal/v1/validate-session`.
- Media listens on `3001`; gateway `/api/v1/media/**` rewrites to media `/api/uploadthing`.
- Gateway listens on `8080` and uses Spring Cloud Gateway WebMVC config under `spring.cloud.gateway.server.webmvc.routes`.
- Gateway routes `/api/v1/identity/**` to identity and `/api/v1/catalog/**` to catalog, both with `StripPrefix=3`; downstream controllers should not include `/api/v1/...` in their mappings.
- Catalog listens on `8081`; its controllers are mounted at service-local paths such as `/listings` and `/categories`.

## Auth And CORS

- Frontend Better Auth client base URL is `http://localhost:8080/api/v1/identity/auth`; Better Auth client does not append `/auth` automatically here.
- Gateway `AuthFilter` skips `/api/v1/identity/**`, `/actuator/**`, and all `OPTIONS`; other routes require the `better-auth.session_token` cookie.
- Gateway validates sessions by calling identity `/internal/v1/validate-session`, then injects `X-User-Id`, `X-User-Email`, and `X-User-Role` headers for downstream services.
- Gateway owns CORS via `CorsConfig`; do not add duplicate CORS handling to downstream services.

## Data And Migrations

- Identity uses Better Auth + Drizzle (`src/db/schema.ts`, `drizzle.config.ts`) and reads `DATABASE_URL` from dotenv.
- Identity env vars used in code: `DATABASE_URL`, `FRONTEND_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`; Better Auth also needs its secret/URL in the environment for real auth flows.
- Catalog uses Spring Data JPA with `spring.jpa.hibernate.ddl-auto=validate`; change schema through Flyway migrations in `apps/catalog-service/src/main/resources/db/migration`.
- Catalog expects gateway-provided `X-User-Id` headers for owner-scoped listing operations.

## API Conventions

- Public API path prefix is `/api/v1/*` at the gateway; internal service-to-service endpoints use `/internal/v1/*`.
- Java APIs return RFC 7807 `ProblemDetail` errors via controller advice; keep that shape for new errors.
- Do not expose JPA entities directly from Spring controllers; use DTOs and MapStruct mappers.
- Use UUIDs for domain IDs and cross-service references.
