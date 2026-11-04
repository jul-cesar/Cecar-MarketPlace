# Despliegue en Dokploy

## Configuración del proyecto

1. Crea un servicio **Docker Compose** en Dokploy con este repositorio. Usa el modo **Compose**, no Stack/Swarm.
2. Selecciona `docker-compose.yml` en la raíz y conserva la raíz del repositorio como contexto. El script de inicialización necesita `infra/postgres/init-databases.sh`.
3. Copia `.env.example` al apartado **Environment**. Sustituye todos los valores de ejemplo.
4. Define `FRONTEND_URL` con el origen HTTPS público, **sin barra final ni ruta**; por ejemplo, `https://marketplace.example.com`.
5. Genera cinco secretos independientes con `openssl rand -hex 32`: las cuatro contraseñas PostgreSQL y `BETTER_AUTH_SECRET`. Usa contraseñas hexadecimales: el Compose las incorpora a las URLs de conexión.
6. Configura Google OAuth y UploadThing. En Google registra este redirect, sustituyendo el dominio:

   ```text
   https://marketplace.example.com/api/v1/identity/auth/callback/google
   ```

7. En **Domains**, asigna tu dominio al servicio **`frontend`**, puerto de contenedor **`80`**, ruta `/`, con HTTPS. No uses Strip Path. Solo necesitas este dominio para web, API y chat.
8. Despliega. Dokploy proporciona la red externa `dokploy-network`; únicamente el frontend se conecta a ella. No publiques puertos de los otros servicios ni añadas dominios directamente a Identity o PostgreSQL.

El Compose fija los nombres y la red. No hace falta crear otra base como recurso separado de Dokploy. No actives opciones que reescriban estos nombres/redes; esta configuración gestiona su propia red privada y usa la red estándar de Dokploy para la entrada HTTP.

**Desactiva el workflow SSH anterior** (`.github/workflows/deploy.yml`) en GitHub Actions si Dokploy será responsable de desplegar. Sigue configurado para ejecutar `docker compose down/up` al completar CI y podría interferir con Dokploy. No se modificó ese workflow automáticamente.

## DNS de la red interna

Estos nombres funcionan entre los contenedores conectados a **`cecar-marketplace-internal`**. No son nombres DNS públicos ni son accesibles desde otras aplicaciones que solo estén en `dokploy-network`.

| Servicio | Contenedor / host interno | Puerto | Base | Usuario PostgreSQL |
| --- | --- | --- | --- | --- |
| PostgreSQL | `cecar-postgres` | `5432` | Tres bases | `postgres` solo para administración |
| Frontend / Nginx | `cecar-frontend` | `80` | No requiere | — |
| Identity | `cecar-identity` | `3000` | `identity_db` | `cecar_identity` |
| Gateway | `cecar-gateway` | `8080` | No requiere | — |
| Catalog | `cecar-catalog` | `8081` | `catalog_db` | `cecar_catalog` |
| Media | `cecar-media` | `3001` | No requiere | — |
| Messaging | `cecar-messaging` | `3002` | `messaging_db` | `cecar_messaging` |
| Admin | `cecar-admin` | `8082` | `identity_db`, compartida con Identity | `cecar_identity` |

Admin administra usuarios y sesiones de Identity directamente en su base actual. Darle una base vacía independiente rompería esas operaciones. Separar ese acceso requiere cambiar la arquitectura, no solo el despliegue.

Ejemplos internos, con la contraseña correspondiente:

```text
postgresql://cecar_identity:CONTRASENA@cecar-postgres:5432/identity_db
jdbc:postgresql://cecar-postgres:5432/catalog_db
postgresql://cecar_messaging:CONTRASENA@cecar-postgres:5432/messaging_db
```

Los servicios ya reciben sus conexiones en el Compose. Las aplicaciones no usan el usuario administrador `postgres`.

## Entrada HTTP

```text
HTTPS /              -> frontend:80 -> SPA
HTTPS /api/*         -> frontend:80 -> gateway:8080 -> microservicio
HTTPS /socket.io/*   -> frontend:80 -> messaging:3002 (HTTP polling y WebSocket)
```

Nginx conserva cookies y cabeceras de proxy. El gateway conserva la validación de sesión para las APIs protegidas y Messaging valida la sesión del socket con Identity.

Las variables `VITE_*` se generan a partir de `FRONTEND_URL` durante la construcción del frontend. Si cambias el dominio, **reconstruye la imagen**; cambiar solo el entorno de un contenedor ya construido no modifica el JavaScript.

`BETTER_AUTH_URL` se deriva como `${FRONTEND_URL}/api/v1/identity/auth`. Identity adapta la ruta interna `/auth/*` que recibe del gateway a la ruta pública esperada por Better Auth.

`UPLOADTHING_CALLBACK_URL` se fija en `${FRONTEND_URL}/api/v1/media` para que los webhooks de UploadThing regresen a la ruta pública, no al nombre interno del contenedor.

## Bases, migraciones y persistencia

- Imagen: `postgres:17-alpine`. Volumen persistente: **`cecar-postgres-data`**.
- El script `infra/postgres/init-databases.sh` crea los tres usuarios y bases **solo al inicializar un volumen vacío**. Revoca el acceso público a esas bases; cada usuario es propietario de la suya.
- La comprobación de PostgreSQL usa TCP para no confundir el servidor temporal de inicialización con el servidor listo.
- Identity y Messaging aplican las migraciones Drizzle versionadas antes de iniciar HTTP. Si una migración falla, no inicia el servicio.
- Admin espera a que Identity haya terminado su inicialización. Catalog ejecuta sus migraciones Flyway al arrancar.
- Messaging utiliza `pg` en lugar del controlador HTTP de Neon, que no sirve para esta instancia PostgreSQL estándar.
- Un reinicio no borra datos ni repite las migraciones ya registradas. Configura backups del volumen o dumps PostgreSQL desde Dokploy antes de cargar información importante.

**No borres el volumen ni ejecutes `docker compose down -v` sobre datos que quieras conservar.** Cambiar las contraseñas del entorno no cambia usuarios de un volumen existente: coordina un `ALTER ROLE ... PASSWORD ...` con el cambio de entorno y el reinicio de los servicios.

Esto prepara una instancia nueva; **no importa datos desde Neon u otra base**. Si restauras esquemas existentes, revisa primero el historial de migraciones de Drizzle y Flyway; una base creada con `drizzle-kit push` puede carecer de ese historial.

Los nombres fijos de contenedores, red y volumen permiten **una sola instalación de este stack por host**. No uses este Compose sin renombrarlos para un segundo entorno de pruebas en el mismo servidor.

## Verificaciones

Antes de desplegar, desde un entorno con Docker Compose y las variables configuradas:

```sh
docker compose config --quiet
```

Después del despliegue:

```sh
docker compose ps
curl --fail https://TU_DOMINIO/api/v1/identity/auth/ok
curl --fail https://TU_DOMINIO/api/v1/messaging/health
```

Desde una terminal del contenedor PostgreSQL puedes comprobar las bases:

```sh
psql -U postgres -d postgres -c '\l'
```

Pruebas locales adicionales:

```sh
node --test infra/postgres/init-databases.test.mjs
cd apps/identity-service && npm ci && npm test && npm run build
# Desde la raiz, en otra terminal:
cd apps/messaging-service && npm ci && npm test && npm run build
```

En el entorno de preparación se validaron el esquema oficial Compose, la sintaxis shell, las pruebas y la compilación TypeScript de Identity/Messaging. No había Docker, PostgreSQL, Nginx ni Java: falta verificar imágenes, arranque completo, migraciones contra PostgreSQL real y login OAuth con credenciales reales.

### Aviso de dependencias

`npm audit --omit=dev` detectó vulnerabilidades existentes en las dependencias de producción, incluida una **crítica en Better Auth**, además de altas en Hono y dependencias de mensajería. No se hizo una actualización general de dependencias como parte de este cambio. Revisa y corrige esos avisos antes de exponer la aplicación a Internet.

Referencias: [Compose en Dokploy](https://docs.dokploy.com/docs/core/docker-compose), [dominios y redes](https://docs.dokploy.com/docs/core/docker-compose/domains).
