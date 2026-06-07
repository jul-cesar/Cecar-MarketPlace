import type { IncomingHttpHeaders } from 'node:http'
import type { AuthUser } from '../http/auth.js'

type SessionValidationResponse = {
  userId: string
  email?: string
  role?: string
}

const identityServiceUrl =
  process.env.IDENTITY_SERVICE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

export async function validateSocketSession(headers: IncomingHttpHeaders) {
  return validateSessionCookie(headers.cookie)
}

export async function validateSessionCookie(cookieHeader: string | undefined) {
  const sessionCookie = extractSessionCookie(cookieHeader)

  if (!sessionCookie) {
    return null
  }

  const response = await fetch(`${identityServiceUrl}/internal/v1/validate-session`, {
    headers: {
      Cookie: sessionCookie,
    },
  })

  if (!response.ok) {
    return null
  }

  const session = (await response.json()) as Partial<SessionValidationResponse>

  if (!session.userId) {
    return null
  }

  return {
    id: session.userId,
    email: session.email,
    role: session.role,
  } satisfies AuthUser
}

function extractSessionCookie(cookieHeader: string | undefined) {
  if (!cookieHeader) {
    return null
  }

  const cookies = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)

  return (
    cookies.find((cookie) => cookie.startsWith('better-auth.session_token=')) ??
    cookies.find((cookie) => cookie.startsWith('__Secure-better-auth.session_token=')) ??
    null
  )
}
