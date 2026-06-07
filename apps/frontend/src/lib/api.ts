const gatewayBaseUrl =
  import.meta.env.VITE_GATEWAY_BASE_URL?.replace(/\/$/, '') ??
  'http://localhost:8080'

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
}
