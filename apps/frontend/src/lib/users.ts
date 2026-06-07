import { apiRoutes } from "@/lib/api"

export interface BasicUser {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
}

interface BasicUsersResponse {
  data: BasicUser[]
}

export async function fetchBasicUsers(userIds: string[]) {
  const ids = [...new Set(userIds.filter(Boolean))]

  if (ids.length === 0) {
    return new Map<string, BasicUser>()
  }

  const response = await fetch(apiRoutes.identity.basicUsers, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userIds: ids }),
  })

  if (!response.ok) {
    throw new Error("users-load-failed")
  }

  const body = (await response.json()) as BasicUsersResponse

  return new Map(body.data.map((user) => [user.id, user]))
}
