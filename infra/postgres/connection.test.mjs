import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { after, test } from 'node:test'

const emptyEnvDirectory = mkdtempSync(join(tmpdir(), 'cecar-pg-test-'))
after(() => rmSync(emptyEnvDirectory, { recursive: true, force: true }))

for (const service of ['identity-service', 'messaging-service']) {
  for (const mode of ['PG variables', 'DATABASE_URL', 'migration']) {
    test(`${service}: ${mode} accepts a password containing URL delimiters`, () => {
      const password = ['example', '/', '#', '?', '@', '%', ':', '$'].join('')
      const env = {
        ...process.env,
        DOTENV_CONFIG_PATH: join(emptyEnvDirectory, '.env'),
        PGHOST: '127.0.0.1',
        PGPORT: '1',
        PGCONNECT_TIMEOUT: '2',
        PGUSER: 'test',
        PGPASSWORD: password,
        PGDATABASE: 'test',
      }
      delete env.DATABASE_URL
      if (mode === 'DATABASE_URL') {
        env.DATABASE_URL = `postgresql://test:${encodeURIComponent(password)}@127.0.0.1:1/test`
      }

      // A refused TCP connection proves configuration parsing succeeded; no database is needed.
      const args = mode === 'migration'
        ? ['--import', 'tsx', 'src/db/migrate.ts']
        : ['--import', 'tsx', '--input-type=module', '-e', `
            import assert from 'node:assert/strict';
            import { db } from './src/db/index.ts';
            try {
              await assert.rejects(db.$client.query('SELECT 1'), { code: 'ECONNREFUSED' });
            } finally {
              await db.$client?.end();
            }
          `]
      const result = spawnSync(process.execPath, args, {
        cwd: fileURLToPath(new URL(`../../apps/${service}/`, import.meta.url)),
        env,
        encoding: 'utf8',
        timeout: 10_000,
      })

      assert.ifError(result.error)
      assert.equal(result.status, mode === 'migration' ? 1 : 0, result.stderr)
      if (mode === 'migration') assert.match(result.stderr, /ECONNREFUSED/)
    })
  }
}
