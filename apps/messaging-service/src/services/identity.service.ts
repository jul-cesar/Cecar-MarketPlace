export type BasicUser = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: string | null
}

const identityServiceUrl =
  process.env.IDENTITY_SERVICE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

export async function getBasicUsers(userIds: string[]) {
  const ids = [...new Set(userIds.filter(Boolean))]

  if (ids.length === 0) {
    return new Map<string, BasicUser>()
  }

  try {
    const response = await fetch(`${identityServiceUrl}/internal/v1/users/basic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userIds: ids }),
    })

    if (!response.ok) {
      return new Map<string, BasicUser>()
    }

    const payload = (await response.json()) as { data?: BasicUser[] }
    const users = Array.isArray(payload.data) ? payload.data : []

    return new Map(users.map((user) => [user.id, user]))
  } catch {
    return new Map<string, BasicUser>()
  }
}
