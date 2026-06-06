import * as React from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router"
import { ArrowLeft, ImageIcon, Loader2, MapPin, Tag } from "lucide-react"
import { toast } from "sonner"

import { MarketplaceNavbar } from "@/components/MarketplaceNavbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { apiRoutes } from "@/lib/api"
import { useSession } from "@/lib/auth"
import { deleteImageFiles } from "@/lib/uploadthing"
import type { ListingDetailResponse } from "@/lib/mock-marketplace"

export default function ListingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isPending } = useSession()
  const [listing, setListing] = React.useState<ListingDetailResponse | null>(null)
  const [isLoadingListing, setIsLoadingListing] = React.useState(true)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let ignore = false

    async function loadListing() {
      if (!id) {
        setIsLoadingListing(false)
        return
      }

      setIsLoadingListing(true)

      try {
        const response = await fetch(apiRoutes.catalog.listing(id), {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("listing-load-failed")
        }

        const nextListing = (await response.json()) as ListingDetailResponse

        if (!ignore) {
          setListing(nextListing)
        }
      } catch {
        if (!ignore) {
          setListing(null)
        }
      } finally {
        if (!ignore) {
          setIsLoadingListing(false)
        }
      }
    }

    loadListing()

    return () => {
      ignore = true
    }
  }, [id])

  async function handleDelete() {
    if (!listing || !id) return

    setIsDeleting(true)
    setDeleteError(null)

    const imageKeys = listing.images
      .map((img) => img.key)
      .filter((k): k is string => Boolean(k))

    if (imageKeys.length > 0) {
      try {
        await deleteImageFiles(imageKeys)
      } catch {
        console.warn("[listing] image cleanup failed, continuing with listing delete")
      }
    }

    try {
      const response = await fetch(apiRoutes.catalog.listing(id), {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("delete-failed")
      }

      toast.success("Publicacion eliminada")
      navigate("/")
    } catch {
      setDeleteError("No pudimos eliminar la publicacion. Intenta de nuevo.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f7f5ef]">
        <div className="rounded-full border bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur">
          Cargando publicacion...
        </div>
      </div>
    )
  }

  if (!data?.user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-svh bg-[#f7f5ef] text-foreground">
      <MarketplaceNavbar user={data.user} />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Button asChild variant="ghost" className="w-fit rounded-full">
          <Link to="/">
            <ArrowLeft className="size-4" />
            Volver al mercado
          </Link>
        </Button>

        {isLoadingListing ? (
          <Card className="rounded-[2rem] bg-background/90 p-8 text-center text-muted-foreground">
            Buscando el anuncio...
          </Card>
        ) : listing ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="overflow-hidden rounded-[2rem] bg-background py-0 shadow-sm shadow-foreground/5">
              {listing.images[0]?.url ? (
                <img
                  src={listing.images[0].url}
                  alt={listing.title}
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-muted text-muted-foreground">
                  <ImageIcon className="size-10" />
                </div>
              )}
              <CardContent className="space-y-5 p-6 sm:p-8">
                <div className="flex flex-wrap gap-2">
                  {listing.categories.map((category) => (
                    <span key={category.id} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {category.name}
                    </span>
                  ))}
                </div>
                <div className="space-y-3">
                  <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                    {listing.title}
                  </h1>
                  <p className="whitespace-pre-wrap text-base leading-7 text-muted-foreground">
                    {listing.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            <aside className="lg:sticky lg:top-6 lg:h-fit">
              <Card className="rounded-[2rem] bg-foreground text-background shadow-xl shadow-foreground/10">
                <CardContent className="space-y-5 p-6">
                  <p className="text-sm text-background/70">Precio</p>
                  <p className="text-3xl font-semibold">{formatListingPrice(listing)}</p>
                  <div className="grid gap-3 text-sm text-background/75">
                    <div className="flex items-center gap-2 rounded-2xl bg-background/10 p-3">
                      <Tag className="size-4" />
                      {listing.listingType}
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl bg-background/10 p-3">
                      <MapPin className="size-4" />
                      {listing.location ?? "Ubicacion por acordar"}
                    </div>
                  </div>

                  {deleteError && (
                    <p className="rounded-xl bg-destructive/20 px-3 py-2 text-sm text-destructive-foreground">
                      {deleteError}
                    </p>
                  )}

                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full rounded-full"
                    disabled={isDeleting}
                    onClick={handleDelete}
                  >
                    {isDeleting && <Loader2 className="size-4 animate-spin" />}
                    {isDeleting ? "Eliminando..." : "Eliminar publicacion"}
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </section>
        ) : (
          <Card className="rounded-[2rem] bg-background/90 p-8 text-center">
            <p className="font-heading text-xl font-semibold">No encontramos esta publicacion</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Puede que haya sido removida o que el enlace no sea correcto.
            </p>
          </Card>
        )}
      </main>
    </div>
  )
}

function formatListingPrice(listing: ListingDetailResponse) {
  if (listing.listingType === "EXCHANGE" && !listing.price) {
    return "Cambio"
  }

  if (!listing.price) {
    return "A convenir"
  }

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(listing.price))
}
