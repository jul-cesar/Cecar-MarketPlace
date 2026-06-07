import { httpError } from '../http/problem.js'

type CatalogListing = {
  id: string
  sellerId: string
  title: string
  coverImageUrl?: string | null
  status?: string
}

const catalogServiceUrl =
  process.env.CATALOG_SERVICE_URL?.replace(/\/$/, '') ?? 'http://localhost:8081'

export async function getListingForConversation(listingId: string) {
  const response = await fetch(
    `${catalogServiceUrl}/listings/${encodeURIComponent(listingId)}`,
  )

  if (response.status === 404) {
    httpError({
      type: 'not-found',
      title: 'Listing not found',
      status: 404,
      detail: 'The listing does not exist',
    })
  }

  if (!response.ok) {
    httpError({
      type: 'catalog-unavailable',
      title: 'Catalog unavailable',
      status: 502,
      detail: 'Could not validate listing before creating conversation',
    })
  }

  const listing = (await response.json()) as Partial<CatalogListing>

  if (!listing.id || !listing.sellerId) {
    httpError({
      type: 'catalog-invalid-response',
      title: 'Catalog invalid response',
      status: 502,
      detail: 'Catalog listing response is missing required fields',
    })
  }

  if (listing.status && listing.status !== 'ACTIVE') {
    httpError({
      type: 'listing-unavailable',
      title: 'Listing unavailable',
      status: 409,
      detail: 'Only active listings can receive new conversations',
    })
  }

  return listing as CatalogListing
}

export async function getBasicListings(listingIds: string[]) {
  const ids = [...new Set(listingIds.filter(Boolean))]
  const entries = await Promise.all(
    ids.map(async (listingId) => {
      try {
        const response = await fetch(
          `${catalogServiceUrl}/listings/${encodeURIComponent(listingId)}`,
        )

        if (!response.ok) {
          return null
        }

        const listing = (await response.json()) as Partial<CatalogListing>

        if (!listing.id) {
          return null
        }

        return [
          listing.id,
          {
            id: listing.id,
            sellerId: listing.sellerId ?? '',
            title: listing.title ?? 'Publicacion sin titulo',
            coverImageUrl: listing.coverImageUrl ?? null,
            status: listing.status,
          },
        ] as const
      } catch {
        return null
      }
    }),
  )

  return new Map(entries.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)))
}
