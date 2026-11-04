import assert from 'node:assert/strict'
import test from 'node:test'
import { Pool } from 'pg'

// A Neon HTTP client cannot connect to the PostgreSQL container's TCP port.
test('uses a PostgreSQL TCP pool for the configured database', async () => {
  process.env.DATABASE_URL = 'postgresql://cecar_messaging:test@cecar-postgres:5432/messaging_db'
  const { db } = await import('../src/db/index.js')

  assert.ok(db.$client instanceof Pool)
  assert.equal(db.$client.options.connectionString, process.env.DATABASE_URL)
  await db.$client.end()
})
