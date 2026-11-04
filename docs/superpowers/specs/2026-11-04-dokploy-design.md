# Despliegue en Dokploy

## Objetivo y alcance

Un único Docker Compose, elegido por el usuario, que construye los siete servicios y provisiona una instancia PostgreSQL con bases `identity_db`, `catalog_db` y `messaging_db`. Los nombres internos son fijos: `cecar-postgres`, `cecar-frontend`, `cecar-gateway`, `cecar-identity`, `cecar-catalog`, `cecar-media`, `cecar-messaging`, `cecar-admin`.

Admin mantiene su conexión a Identity: consulta y modifica sus usuarios y sesiones. Media y Gateway no necesitan base propia. No se cambia ese modelo ni se crean bases vacías innecesarias.

## Alternativas

- Un único Compose: elección del usuario; permite provisionar red, dependencias y almacenamiento juntos.
- Aplicaciones independientes en Dokploy: descartado por requerir más configuración manual de redes y dependencias.

## Decisiones de implementación

- PostgreSQL 17 con volumen nombrado y un usuario propietario por base; sin puerto publicado al host. Las bases se crean únicamente al inicializar un volumen vacío.
- Frontend conectado a `dokploy-network`; servicios y base en una red bridge propia. El dominio se asigna al frontend, puerto 80. Nginx reenvía API y WebSocket conservando cookies.
- Identidad y mensajería ejecutan migraciones Drizzle versionadas antes de iniciar. Admin espera la disponibilidad de Identity. Catalog conserva Flyway.
- Messaging pasa de Neon HTTP a `pg`, como ya hace Identity.
- Variables obligatorias sin secretos reales en Git. Los passwords de base deben ser hexadecimales para poder incluirlos directamente en URLs.
- El usuario configura dominio, TLS, OAuth, UploadThing, secretos y backups en Dokploy. No se despliega ni se migra información existente desde este entorno.

## Riesgos

Los nombres fijos permiten una única copia de este stack por host. Un volumen ya existente no vuelve a ejecutar la creación de bases ni actualiza contraseñas. El workflow SSH anterior debe deshabilitarse si Dokploy será responsable de desplegar. El acceso compartido de Admin a Identity es una limitación de la arquitectura actual.
