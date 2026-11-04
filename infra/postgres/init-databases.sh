#!/bin/sh
set -eu

: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${IDENTITY_DATABASE_PASSWORD:?IDENTITY_DATABASE_PASSWORD is required}"
: "${CATALOG_DATABASE_PASSWORD:?CATALOG_DATABASE_PASSWORD is required}"
: "${MESSAGING_DATABASE_PASSWORD:?MESSAGING_DATABASE_PASSWORD is required}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  --set=identity_password="$IDENTITY_DATABASE_PASSWORD" \
  --set=catalog_password="$CATALOG_DATABASE_PASSWORD" \
  --set=messaging_password="$MESSAGING_DATABASE_PASSWORD" <<'SQL'
CREATE USER cecar_identity WITH PASSWORD :'identity_password';
CREATE USER cecar_catalog WITH PASSWORD :'catalog_password';
CREATE USER cecar_messaging WITH PASSWORD :'messaging_password';

CREATE DATABASE identity_db OWNER cecar_identity;
CREATE DATABASE catalog_db OWNER cecar_catalog;
CREATE DATABASE messaging_db OWNER cecar_messaging;

REVOKE CONNECT ON DATABASE identity_db FROM PUBLIC;
REVOKE CONNECT ON DATABASE catalog_db FROM PUBLIC;
REVOKE CONNECT ON DATABASE messaging_db FROM PUBLIC;
SQL
