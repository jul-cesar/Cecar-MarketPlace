import { Eye, MapPin, RefreshCw, Tag } from 'lucide-react'
import type {
  ListingCondition,
  ListingSummaryResponse,
  ListingType,
} from '@/lib/mock-marketplace'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const listingTypeLabel: Record<ListingType, string> = {
  SALE: 'Venta',
  EXCHANGE: 'Intercambio',
  SERVICE: 'Servicio',
}

const conditionLabel: Record<ListingCondition, string> = {
  NEW: 'Nuevo',
  LIKE_NEW: 'Como nuevo',
  USED: 'Usado',
}

interface ListingCardProps {
  listing: ListingSummaryResponse
}

export function ListingCard({ listing }: ListingCardProps) {
  const coverImage = listing.coverImageUrl
  const primaryCategory = listing.categories[0]

  return (
    <Card className="group overflow-hidden rounded-3xl bg-background/80 py-0 shadow-sm shadow-foreground/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-foreground/10">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {coverImage ? (
          <img
            src={coverImage}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            Sin imagen
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-medium shadow-sm backdrop-blur">
            {primaryCategory?.name ?? 'General'}
          </span>
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium shadow-sm backdrop-blur',
              listing.listingType === 'SERVICE' && 'bg-emerald-500 text-white',
              listing.listingType === 'EXCHANGE' && 'bg-amber-400 text-amber-950',
              listing.listingType === 'SALE' && 'bg-primary text-primary-foreground',
            )}
          >
            {listingTypeLabel[listing.listingType]}
          </span>
        </div>
      </div>

      <CardContent className="space-y-4 p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 font-heading text-base font-semibold leading-tight">
              {listing.title}
            </h3>
            <p className="shrink-0 text-right text-sm font-semibold">
              {formatListingPrice(listing)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {listing.location ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
              <MapPin className="size-3" />
              {listing.location}
            </span>
          ) : null}
          {listing.condition ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
              <Tag className="size-3" />
              {conditionLabel[listing.condition]}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
            {listing.listingType === 'EXCHANGE' ? (
              <RefreshCw className="size-3" />
            ) : (
              <Eye className="size-3" />
            )}
            {listing.viewCount} vistas
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function formatListingPrice(listing: ListingSummaryResponse) {
  if (listing.listingType === 'EXCHANGE') {
    return listing.price ? formatCop(Number(listing.price)) : 'Cambio'
  }

  if (!listing.price) {
    return 'A convenir'
  }

  return formatCop(Number(listing.price))
}

function formatCop(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}
