import { apiRoutes } from "@/lib/api"

const headers = { "Content-Type": "application/json" }

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", headers, ...init })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || `HTTP ${res.status}`)
  }
  return res.json()
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  emailVerified: boolean
  image: string | null
  banned: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminMetrics {
  totalUsers: number
  bannedUsers: number
  activeSessions: number
  totalListings: number
  blockedListings: number
}

export interface AdminListing {
  id: string
  sellerId: string
  title: string
  description: string
  price: string | null
  listingType: string
  condition: string | null
  status: string
  location: string | null
  contactInfo: Record<string, string> | null
  viewCount: number
  createdAt: string
  updatedAt: string
}

export interface ActivityResponse {
  recentUsers: {
    id: string
    name: string
    email: string
    role: string
    banned: boolean
    createdAt: string
  }[]
  recentSessions: {
    id: string
    userId: string
    ipAddress: string
    createdAt: string
    expiresAt: string
  }[]
}

interface PageResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
}

export async function fetchAdminUsers(
  page = 0,
  size = 20,
  banned?: boolean
): Promise<PageResponse<AdminUser>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (banned !== undefined) params.set("banned", String(banned))
  return fetchJson(`${apiRoutes.admin.users}?${params}`)
}

export async function banUser(id: string): Promise<AdminUser> {
  return fetchJson(apiRoutes.admin.banUser(id), { method: "PATCH" })
}

export async function unbanUser(id: string): Promise<AdminUser> {
  return fetchJson(apiRoutes.admin.unbanUser(id), { method: "PATCH" })
}

export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  return fetchJson(apiRoutes.admin.metrics)
}

export async function fetchAdminListings(
  page = 0,
  size = 20,
  status?: string
): Promise<PageResponse<AdminListing>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (status) params.set("status", status)
  return fetchJson(`${apiRoutes.admin.listings}?${params}`)
}

export async function blockListing(id: string): Promise<AdminListing> {
  return fetchJson(apiRoutes.admin.blockListing(id), { method: "PATCH" })
}

export async function restoreListing(id: string): Promise<AdminListing> {
  return fetchJson(apiRoutes.admin.restoreListing(id), { method: "PATCH" })
}

export async function fetchActivity(): Promise<ActivityResponse> {
  return fetchJson(apiRoutes.admin.reports.activity)
}
