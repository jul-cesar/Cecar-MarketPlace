import type { Context, Next } from 'hono'
import { validateSessionCookie } from '../socket/auth.js'
import { problem } from './problem.js'

export type AuthUser = {
  id: string
  email?: string
  role?: string
}

export type AppBindings = {
  Variables: {
    user: AuthUser
  }
}

export async function requireUser(c: Context<AppBindings>, next: Next) {
  const userId = c.req.header('X-User-Id')

  if (userId) {
    c.set('user', {
      id: userId,
      email: c.req.header('X-User-Email'),
      role: c.req.header('X-User-Role'),
    })

    await next()
    return
  }

  const user = await validateSessionCookie(c.req.header('Cookie'))

  if (!user) {
    return problem(c, {
      type: 'unauthorized',
      title: 'Unauthorized',
      status: 401,
      detail: 'Missing or invalid authenticated session',
    })
  }

  c.set('user', user)

  await next()
}
