import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

test('serves auth behind the gateway with a public URL prefix', { timeout: 20_000 }, async (t) => {
  const server = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    env: {
      ...process.env,
      PORT: '0',
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test',
      FRONTEND_URL: 'https://marketplace.example.com',
      BETTER_AUTH_URL: 'https://marketplace.example.com/api/v1/identity/auth',
      BETTER_AUTH_SECRET: '0123456789abcdef'.repeat(4),
      GOOGLE_CLIENT_ID: 'test',
      GOOGLE_CLIENT_SECRET: 'test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  t.after(() => server.kill())

  const port = await new Promise<string>((resolve, reject) => {
    let output = ''
    server.on('error', reject)
    server.on('exit', (code) => reject(new Error(`Identity exited: ${code}`)))
    server.stderr.on('data', () => {})
    server.stdout.on('data', (chunk) => {
      output += chunk.toString()
      const match = output.match(/Server is running on http:\/\/localhost:(\d+)/)
      if (match) resolve(match[1]!)
    })
  })

  // The gateway strips /api/v1/identity before forwarding the request.
  const response = await fetch(`http://127.0.0.1:${port}/auth/ok`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true })

  const signIn = await fetch(`http://127.0.0.1:${port}/auth/sign-in/social`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://marketplace.example.com' },
    body: JSON.stringify({ provider: 'invalid' }),
  })
  assert.equal(signIn.status, 404)
  assert.deepEqual(await signIn.json(), { message: 'Provider not found', code: 'PROVIDER_NOT_FOUND' })
})
