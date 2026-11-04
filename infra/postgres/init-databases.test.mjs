import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const script = fileURLToPath(new URL('./init-databases.sh', import.meta.url))
const required = [
  'POSTGRES_USER',
  'POSTGRES_DB',
  'IDENTITY_DATABASE_PASSWORD',
  'CATALOG_DATABASE_PASSWORD',
  'MESSAGING_DATABASE_PASSWORD',
]

for (const missing of required) {
  test(`rejects a missing ${missing} before calling PostgreSQL`, () => {
    const env = { ...process.env }
    for (const key of required) env[key] = 'test'
    delete env[missing]

    const result = spawnSync('sh', [script], { env, encoding: 'utf8' })
    assert.ifError(result.error)
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, new RegExp(`${missing}.*required`))
  })
}
