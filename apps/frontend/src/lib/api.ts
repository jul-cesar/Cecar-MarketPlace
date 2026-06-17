const gatewayBaseUrl =
  (import.meta.env.VITE_GATEWAY_BASE_URL?.replace(/\/$/, '') ??
    'http://localhost:8080').replace(/\/api\/v1$/, '')

const messagingBaseUrl =
  import.meta.env.VITE_MESSAGING_BASE_URL?.replace(/\/$/, '') ??
  (import.meta.env.DEV ? 'http://localhost:3002' : gatewayBaseUrl)

const messagingApiPrefix =
  import.meta.env.VITE_MESSAGING_API_PREFIX ??
  (import.meta.env.DEV ? '' : '/api/v1/messaging')

function messagingUrl(path: string) {
  return `${messagingBaseUrl}${messagingApiPrefix}${path.startsWith('/') ? path : '/' + path}`
}

export function gatewayUrl(path: string) {
  return `${gatewayBaseUrl}${path.startsWith('/') ? path : '/' + path}`
}

export const apiRoutes = {
  auth: gatewayUrl('/api/v1/identity/auth'),
  gatewayBaseUrl,
  identity: {
    basicUsers: gatewayUrl('/api/v1/identity/internal/v1/users/basic'),
  },
  catalog: {
    categories: gatewayUrl('/api/v1/catalog/categories'),
    listings: gatewayUrl('/api/v1/catalog/listings'),
    listing: (id: string) => gatewayUrl('/api/v1/catalog/listings/' + id),
  },
  media: {
    upload: gatewayUrl('/api/v1/media'),
    delete: gatewayUrl('/api/v1/media/delete'),
  },
  messaging: {
    baseUrl: messagingBaseUrl,
    conversations: messagingUrl('/conversations'),
    conversationMessages: (conversationId: string) =>
      messagingUrl(`/conversations/${conversationId}/messages`),
    conversationRead: (conversationId: string) =>
      messagingUrl(`/conversations/${conversationId}/read`),
    socketPath: import.meta.env.DEV ? '/socket.io' : '/api/v1/messaging/socket.io',
  },
  admin: {
    users: gatewayUrl('/api/v1/admin/users'),
    user: (id: string) => gatewayUrl('/api/v1/admin/users/' + id),
    banUser: (id: string) => gatewayUrl(`/api/v1/admin/users/${id}/ban`),
    unbanUser: (id: string) => gatewayUrl(`/api/v1/admin/users/${id}/unban`),
    metrics: gatewayUrl('/api/v1/admin/metrics'),
    listings: gatewayUrl('/api/v1/admin/listings'),
    blockListing: (id: string) => gatewayUrl(`/api/v1/admin/listings/${id}/block`),
    restoreListing: (id: string) => gatewayUrl(`/api/v1/admin/listings/${id}/restore`),
    reports: {
      activity: gatewayUrl('/api/v1/admin/reports/activity'),
    },
  },
}
