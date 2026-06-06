import * as React from 'react'
import { Link } from 'react-router'
import {
  Eye,
  ImageIcon,
  MapPin,
  MessageCircle,
  RefreshCw,
  Tag,
} from 'lucide-react'

import type {
  ListingCondition,
  ListingImageResponse,
  ListingSummaryResponse,
  ListingType,
} from '@/lib/mock-marketplace'
import { Card, CardContent } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
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
  const [carouselApi, setCarouselApi] = React.useState<CarouselApi>()
  const [currentSlide, setCurrentSlide] = React.useState(0)
  const images = getListingImages(listing)
  const primaryCategory = listing.categories[0]
  const hasMultipleImages = images.length > 1

  React.useEffect(() => {
    if (!carouselApi) return

    function updateSlide(api: CarouselApi) {
      if (!api) return
      setCurrentSlide(api.selectedScrollSnap())
    }

    updateSlide(carouselApi)
    carouselApi.on('select', updateSlide)
    carouselApi.on('reInit', updateSlide)

    return () => {
      carouselApi.off('select', updateSlide)
      carouselApi.off('reInit', updateSlide)
    }
  }, [carouselApi])

  return (
    <Card className="overflow-hidden rounded-[2rem] border bg-background/95 py-0 shadow-sm shadow-foreground/5 transition-shadow duration-300 hover:shadow-xl hover:shadow-foreground/10">
      <CardContent className="space-y-4 p-0">
        <div className="flex items-center gap-3 px-4 pt-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {getSellerInitial(listing.title)}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              to={`/listings/${listing.id}`}
              className="line-clamp-1 font-heading text-base font-semibold leading-tight hover:text-primary"
            >
              {listing.title}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{primaryCategory?.name ?? 'General'}</span>
              {listing.location ? (
                <>
                  <span aria-hidden="true">•</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" />
                    {listing.location}
                  </span>
                </>
              ) : null}
            </div>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs font-medium',
              listing.listingType === 'SERVICE' && 'bg-emerald-500 text-white',
              listing.listingType === 'EXCHANGE' && 'bg-amber-400 text-amber-950',
              listing.listingType === 'SALE' && 'bg-primary text-primary-foreground',
            )}
          >
            {listingTypeLabel[listing.listingType]}
          </span>
        </div>

        <div className="relative border-y bg-muted/70">
          {images.length > 0 ? (
            <Carousel setApi={setCarouselApi} opts={{ loop: hasMultipleImages }}>
              <CarouselContent className="ml-0">
                {images.map((image, index) => (
                  <CarouselItem key={image.id ?? image.url} className="pl-0">
                    <Link to={`/listings/${listing.id}`}>
                      <img
                        src={image.url}
                        alt={image.name ?? `${listing.title} - imagen ${index + 1}`}
                        className="aspect-square w-full object-cover sm:aspect-[4/3]"
                        loading="lazy"
                      />
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {hasMultipleImages ? (
                <>
                  <CarouselPrevious className="left-3 border-0 bg-background/85 shadow-md backdrop-blur hover:bg-background" />
                  <CarouselNext className="right-3 border-0 bg-background/85 shadow-md backdrop-blur hover:bg-background" />
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-foreground/45 px-2 py-1 backdrop-blur">
                    {images.map((image, index) => (
                      <span
                        key={image.id ?? image.url}
                        className={cn(
                          'size-1.5 rounded-full bg-background/60 transition-all',
                          currentSlide === index && 'w-4 bg-background',
                        )}
                      />
                    ))}
                  </div>
                  <span className="absolute right-3 top-3 rounded-full bg-foreground/60 px-2.5 py-1 text-xs font-medium text-background backdrop-blur">
                    {currentSlide + 1}/{images.length}
                  </span>
                </>
              ) : null}
            </Carousel>
          ) : (
            <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 text-muted-foreground sm:aspect-[4/3]">
              <ImageIcon className="size-10" />
              <span className="text-sm">Sin imagen</span>
            </div>
          )}
        </div>

        <div className="space-y-4 px-4 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <Link
                to={`/listings/${listing.id}`}
                className="line-clamp-2 font-heading text-lg font-semibold leading-tight hover:text-primary"
              >
                {listing.title}
              </Link>
              <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {listing.description || 'Sin descripcion disponible.'}
              </p>
            </div>
            <p className="shrink-0 text-right text-base font-semibold">
              {formatListingPrice(listing)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
            <Link
              to={`/listings/${listing.id}`}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <MessageCircle className="size-3" />
              Ver detalle
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function getListingImages(listing: ListingSummaryResponse): ListingImageResponse[] {
  if (listing.images?.length > 0) {
    return [...listing.images].sort((a, b) => a.sortOrder - b.sortOrder)
  }

  if (!listing.coverImageUrl) {
    return []
  }

  return [
    {
      id: listing.id,
      url: listing.coverImageUrl,
      sortOrder: 0,
      createdAt: listing.createdAt,
    },
  ]
}

function getSellerInitial(title: string) {
  return title.trim().charAt(0).toUpperCase() || 'C'
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
