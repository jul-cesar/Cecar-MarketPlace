# Marketplace CECAR --- Technical Backlog (v0.1)

# Objetivo

Este documento contiene el backlog técnico oficial del proyecto
Marketplace CECAR.

Se organiza por milestones y epics, siguiendo la estrategia definida
durante la fase SDD.

------------------------------------------------------------------------

# M0 --- Foundation

Objetivo:

Preparar infraestructura, monorepo y base técnica.

Duración estimada:

1--3 días.

## EPIC-001 --- Monorepo Bootstrap

-   M0-T1 Crear repositorio marketplace-cecar
-   M0-T2 Crear estructura /apps /infra /docs /packages
-   M0-T3 Configurar README principal
-   M0-T4 Definir .gitignore global
-   M0-T5 Definir env strategy (.env.example)

Definition of Done:

-   repo clona y levanta estructura mínima

------------------------------------------------------------------------

## EPIC-002 --- Docker Foundation

-   M0-T6 Crear docker-compose base
-   M0-T7 Configurar PostgreSQL
-   M0-T8 Crear identity_db
-   M0-T9 Crear catalog_db
-   M0-T10 Crear messaging_db
-   M0-T11 Crear admin_db

DoD:

-   docker compose up levanta postgres

------------------------------------------------------------------------

## EPIC-003 --- Gateway Skeleton

-   M0-T12 Bootstrap Spring Gateway
-   M0-T13 Health endpoint
-   M0-T14 Configuración CORS
-   M0-T15 API v1 base path
-   M0-T16 Placeholder routes

DoD:

-   Gateway responde /health

------------------------------------------------------------------------

## EPIC-004 --- Docs + Architecture

-   M0-T17 Crear docs/specs
-   M0-T18 Crear docs/decisions
-   M0-T19 Registrar ADR iniciales
-   M0-T20 Diagramar arquitectura v1

DoD:

-   arquitectura documentada

------------------------------------------------------------------------

# M1 --- Identity + Gateway

Objetivo:

Autenticación end-to-end.

Duración:

3--5 días.

## EPIC-101 --- Identity Bootstrap

-   M1-T1 Bootstrap Node service
-   M1-T2 Config Better Auth
-   M1-T3 Google provider
-   M1-T4 PostgreSQL connection
-   M1-T5 Health endpoint

------------------------------------------------------------------------

## EPIC-102 --- Google Auth

-   M1-T6 OAuth callback
-   M1-T7 Restricción @cecar.edu.co
-   M1-T8 Create user on first login
-   M1-T9 Role USER default
-   M1-T10 Block invalid domains

------------------------------------------------------------------------

## EPIC-103 --- User API

-   M1-T11 GET /users/me
-   M1-T12 User DTO
-   M1-T13 Mapper
-   M1-T14 RFC7807 errors

------------------------------------------------------------------------

## EPIC-104 --- Gateway Auth Integration

-   M1-T15 Route auth → identity
-   M1-T16 Protected routes
-   M1-T17 401 handling
-   M1-T18 Header propagation

DoD:

-   login funcional vía gateway

------------------------------------------------------------------------

# M2 --- Media + Catalog

Objetivo:

Publicación de anuncios.

Duración:

5--7 días.

## Media

-   M2-T1 Bootstrap media-service
-   M2-T2 UploadThing config
-   M2-T3 Protected upload route
-   M2-T4 Upload response DTO

## Catalog

-   M2-T5 Bootstrap catalog-service
-   M2-T6 Category entity
-   M2-T7 Listing entity
-   M2-T8 Image entity
-   M2-T9 CRUD listings
-   M2-T10 Filters
-   M2-T11 Pagination
-   M2-T12 Public listing
-   M2-T13 Owner validation

DoD:

-   crear anuncio con imagen

------------------------------------------------------------------------

# M3 --- Messaging

Objetivo:

Mensajería funcional.

Duración:

3--4 días.

-   M3-T1 Bootstrap messaging
-   M3-T2 Conversation entity
-   M3-T3 Message entity
-   M3-T4 Create conversation
-   M3-T5 Reuse existing conversation
-   M3-T6 Permissions
-   M3-T7 Catalog integration

DoD:

-   mensajería funcional

------------------------------------------------------------------------

# M4 --- Admin

Objetivo:

Moderación.

Duración:

2--3 días.

-   M4-T1 Bootstrap admin
-   M4-T2 Report entity
-   M4-T3 Report API
-   M4-T4 Block user
-   M4-T5 Remove listing
-   M4-T6 Dashboard

DoD:

-   moderación funcional

------------------------------------------------------------------------

# M5 --- Deploy + CI/CD

Objetivo:

Demo desplegada.

Duración:

2--4 días.

-   M5-T1 VPS bootstrap
-   M5-T2 Docker prod compose
-   M5-T3 Nginx reverse proxy
-   M5-T4 HTTPS
-   M5-T5 GitHub Actions
-   M5-T6 Deploy workflow

DoD:

-   deploy automatizado

------------------------------------------------------------------------

# Estado

Backlog oficial v0.1 del Marketplace CECAR.
