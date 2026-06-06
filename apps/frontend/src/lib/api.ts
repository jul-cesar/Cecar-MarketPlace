const gatewayBaseUrl =
  import.meta.env.VITE_GATEWAY_BASE_URL?.replace(/\/$/, '') ??
  'http://localhost:8080'

export function gatewayUrl(path: string) {
  return `${gatewayBaseUrl}${path.startsWith('/') ? path : '/' + path}`
}

export const apiRoutes = {
  auth: gatewayUrl('/api/v1/identity/auth'),
  catalog: {
    categories: gatewayUrl('/api/v1/catalog/categories'),
    listings: gatewayUrl('/api/v1/catalog/listings'),
    listing: (id: string) => gatewayUrl('/api/v1/catalog/listings/' + id),
  },
  media: {
    upload: gatewayUrl('/api/v1/media'),
    delete: gatewayUrl('/api/v1/media/delete'),
  },
}
