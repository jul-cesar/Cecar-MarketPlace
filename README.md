# Marketplace CECAR --- Contexto Maestro para Agente y Team (v0.1)

# 1. Proyecto

Marketplace institucional para la comunidad CECAR (estudiantes, docentes
y administrativos).

Objetivo:

Crear una plataforma web para compra, venta e intercambio de bienes y
servicios dentro de CECAR.

Problema identificado:

Actualmente la comunidad usa canales informales (WhatsApp/Facebook),
sin:

-   validación institucional
-   trazabilidad
-   organización
-   moderación
-   confianza

El proyecto adopta:

-   Spec Driven Development (SDD)
-   Domain Driven Design (DDD)
-   Arquitectura de microservicios

------------------------------------------------------------------------

# 2. Visión del MVP

Tipo:

Facebook Marketplace universitario.

No incluye inicialmente:

-   pagos
-   checkout
-   reservas
-   reputación compleja
-   mobile

Sí incluye:

-   login institucional
-   publicaciones
-   búsqueda
-   mensajería
-   moderación

------------------------------------------------------------------------

# 3. Bounded Contexts

Core:

-   Identity
-   Catalog
-   Messaging
-   Admin

Futuro:

-   Rating
-   IA
-   pagos

------------------------------------------------------------------------

# 4. Stack Técnico Oficial

Frontend:

-   React
-   Vite
-   shadcn/ui
-   TanStack Query
-   Zustand
-   fetch wrapper

Backend:

Gateway: - Spring Cloud Gateway

Identity: - Node.js - Better Auth - Google OAuth

Media: - Node.js - UploadThing

Dominio: - Spring Boot 3.x - Java 21 - JPA - MapStruct - Flyway -
PostgreSQL

Infra:

-   Docker
-   Docker Compose
-   VPS
-   Nginx
-   GitHub Actions (futuro)

------------------------------------------------------------------------

# 5. Arquitectura

``` text
React
    ↓
Spring Cloud Gateway
    ↓
Identity Service
Media Service
Catalog Service
Messaging Service
Admin Service
    ↓
PostgreSQL (multi-db)
```

Monorepo:

``` text
apps/
web
gateway
identity-service
media-service
catalog-service
messaging-service
admin-service

infra/
docker
nginx
```

------------------------------------------------------------------------

# 6. Database Strategy

1 instancia PostgreSQL.

Varias bases:

-   identity_db
-   catalog_db
-   messaging_db
-   admin_db

Regla crítica:

NO existen foreign keys entre microservicios.

Relaciones:

-   lógicas
-   por API
-   no físicas

IDs:

-   UUID

Migrations:

-   Flyway

------------------------------------------------------------------------

# 7. Seguridad

Modelo oficial:

Session + HttpOnly Cookies.

Flow:

``` text
Google Login
↓
Better Auth
↓
Session
↓
Cookie HttpOnly
↓
Gateway
↓
Identity validate-session
↓
headers internos
↓
microservicios
```

Gateway:

centraliza autenticación.

Headers internos:

-   X-User-Id
-   X-User-Email
-   X-User-Role

Internal auth MVP:

-   trusted docker network

------------------------------------------------------------------------

# 8. Convenciones API

Versionado:

``` text
/api/v1/*
```

Internal:

``` text
/internal/v1/*
```

Error model:

RFC7807 Problem Details.

Ejemplo:

``` json
{
  "type": "validation-error",
  "title": "Validation failed",
  "status": 400
}
```

DTO strategy:

-   Entity
-   DTO
-   Mapper
-   Service
-   Controller

Nunca exponer entidades JPA.

MapStruct oficial.

------------------------------------------------------------------------

# 9. Specs de Servicios

Identity:

-   Google login
-   restricción @cecar.edu.co
-   roles
-   users/me

Catalog:

-   anuncios
-   categorías
-   imágenes
-   filtros
-   CRUD

Messaging:

-   conversaciones
-   mensajes
-   permisos

Admin:

-   reportes
-   moderación
-   bloqueo usuarios

Media:

-   UploadThing
-   URLs firmadas
-   upload protegido

------------------------------------------------------------------------

# 10. Frontend Architecture

Feature based.

``` text
features/
auth
catalog
messaging
admin
```

Layouts:

-   PublicLayout
-   AppLayout
-   AdminLayout

UX:

-   marketplace directo
-   sidebar persistente
-   dark/light mode
-   mensajería tipo WhatsApp split view

Rutas:

``` text
/login
/
/listings
/listings/:id
/publish
/my-listings
/messages
/admin
```

------------------------------------------------------------------------

# 11. DevOps Blueprint

Local:

Docker Compose.

Producción:

``` text
Internet
↓
Nginx HTTPS
↓
Frontend
↓
Gateway
↓
Microservices
```

Registry futuro:

-   GHCR

CI/CD:

-   GitHub Actions

Health:

-   /health
-   actuator/health

Logs MVP:

-   docker compose logs

------------------------------------------------------------------------

# 12. Roadmap

M0 Foundation M1 Identity + Gateway M2 Media + Catalog M3 Messaging M4
Admin M5 Deploy + CI/CD

------------------------------------------------------------------------

# 13. Standards

Branching:

``` text
main
develop
feature/*
```

Node:

-   LTS

Java:

-   21 LTS

Package manager:

-   pnpm

Testing:

-   mínimo viable MVP

------------------------------------------------------------------------

# 14. ADRs

-   ADR-001 Monorepo
-   ADR-002 Gateway central
-   ADR-003 PostgreSQL multi-db
-   ADR-004 REST First
-   ADR-005 Better Auth
-   ADR-006 RFC7807
-   ADR-007 API v1

------------------------------------------------------------------------

# 15. Estado Actual

Arquitectura y planeación cerradas.

Siguiente fase:

IMPLEMENTATION-001

Bootstrap real del monorepo y comienzo del desarrollo.


# BACKLOG 

Product Backlog [Ver](/docs/backlog.md) 
