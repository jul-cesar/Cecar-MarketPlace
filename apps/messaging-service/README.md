# Messaging Service

Hono + Drizzle + Socket.IO service for marketplace conversations.

```sh
npm install
npm run dev
```

```text
http://localhost:3002
```

## Environment

- `DATABASE_URL`: messaging database connection string.
- `PORT`: optional, defaults to `3002`.
- `CATALOG_SERVICE_URL`: optional, defaults to `http://localhost:8081`.
- `IDENTITY_SERVICE_URL`: optional, defaults to `http://localhost:3000`.
- `FRONTEND_URL`: optional CORS origin for Socket.IO.
- `ENABLE_SERVICE_CORS`: optional, defaults to enabled for direct local browser tests. Set to `false` behind gateway/proxy.

## HTTP

Gateway path: `/api/v1/messaging/**`.

Service-local paths:

- `GET /health`
- `POST /conversations`
- `GET /conversations?limit=50`
- `GET /conversations/:conversationId/messages?limit=50&before=ISO_DATE`
- `POST /conversations/:conversationId/messages`
- `PATCH /conversations/:conversationId/read`

HTTP endpoints expect gateway-injected `X-User-Id` headers.

## Socket.IO

Socket.IO uses the same port and validates the Better Auth session cookie against Identity.

Client events:

- `conversation:join` with `{ conversationId }`
- `message:send` with `{ conversationId, body }`
- `messages:read` with `{ conversationId, lastReadMessageId? }`

Server events:

- `message:new`
- `conversation:updated`
- `messages:read`

Each client event supports an acknowledgement callback shaped as `{ ok: boolean, data?, error? }`.
