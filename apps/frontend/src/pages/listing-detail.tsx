import * as React from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router"
import {
  ArrowLeft,
  ImageIcon,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Tag,
} from "lucide-react"
import { toast } from "sonner"

import { MarketplaceNavbar } from "@/components/MarketplaceNavbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { apiRoutes } from "@/lib/api"
import { useInstitutionalSessionGuard } from "@/lib/auth-policy"
import { useSession } from "@/lib/auth"
import { createConversation } from "@/lib/messaging"
import { deleteImageFiles } from "@/lib/uploadthing"
import { fetchBasicUsers, type BasicUser } from "@/lib/users"
import type {
  ListingCondition,
  ListingDetailResponse,
  ListingType,
} from "@/lib/mock-marketplace"

export default function ListingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isPending } = useSession()
  const { isBlocking, isInstitutionalUser } = useInstitutionalSessionGuard(data, isPending)
  const [listing, setListing] = React.useState<ListingDetailResponse | null>(null)
  const [author, setAuthor] = React.useState<BasicUser | null>(null)
  const [isLoadingListing, setIsLoadingListing] = React.useState(true)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isContacting, setIsContacting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0)

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
        const authors = await fetchBasicUsers([nextListing.sellerId])

        if (!ignore) {
          setListing(nextListing)
          setAuthor(authors.get(nextListing.sellerId) ?? null)
          setSelectedImageIndex(0)
        }
      } catch {
        if (!ignore) {
          setListing(null)
          setAuthor(null)
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

    if (listing.sellerId !== data?.user.id) {
      toast.error("Solo el autor puede eliminar esta publicacion")
      return
    }

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

  async function handleContactSeller() {
    if (!listing) return

    if (listing.sellerId === data?.user.id) {
      toast.info("Esta publicacion es tuya")
      return
    }

    setIsContacting(true)

    try {
      const conversation = await createConversation(listing.id)

      navigate(`/messages?conversationId=${conversation.id}`)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No pudimos iniciar la conversacion",
      )
    } finally {
      setIsContacting(false)
    }
  }

  if (isPending || isBlocking) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="rounded-full border bg-background px-4 py-2 text-sm text-muted-foreground shadow-sm">
          Cargando publicacion...
        </div>
      </div>
    )
  }

  if (!data?.user) {
    return <Navigate to="/login" replace />
  }

  if (!isInstitutionalUser) {
    return null
  }

  const isOwner = listing?.sellerId === data.user.id

  return (
    <div className="min-h-svh bg-background text-foreground">
      <MarketplaceNavbar user={data.user} />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Button asChild variant="ghost" className="w-fit rounded-full">
          <Link to="/">
            <ArrowLeft className="size-4" />
            Volver al mercado
          </Link>
        </Button>

        {isLoadingListing ? (
          <ListingDetailSkeleton />
        ) : listing ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <Card className="overflow-hidden rounded-[2rem] bg-background py-0 shadow-sm shadow-foreground/5">
                <div className="relative bg-muted">
                  {listing.images[selectedImageIndex]?.url ? (
                    <img
                      src={listing.images[selectedImageIndex].url}
                      alt={listing.images[selectedImageIndex].name ?? listing.title}
                      className="aspect-[4/3] w-full object-cover sm:aspect-video"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground sm:aspect-video">
                      <ImageIcon className="size-12" />
                      <span className="text-sm">Esta publicacion no tiene fotos</span>
                    </div>
                  )}

                  {listing.images.length > 1 ? (
                    <span className="absolute right-4 top-4 rounded-full border bg-background px-3 py-1 text-xs font-medium text-foreground shadow-sm">
                      {selectedImageIndex + 1}/{listing.images.length}
                    </span>
                  ) : null}
                </div>

                {listing.images.length > 1 ? (
                  <div className="flex gap-3 overflow-x-auto border-t bg-background p-3">
                    {listing.images.map((image, index) => (
                      <button
                        key={image.id}
                        type="button"
                        className={`shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                          selectedImageIndex === index
                            ? "border-primary"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <img
                          src={image.url}
                          alt={image.name ?? `${listing.title} miniatura ${index + 1}`}
                          className="size-20 object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </Card>

              <Card className="rounded-[2rem] bg-background shadow-sm shadow-foreground/5">
                <CardContent className="space-y-6 p-6 sm:p-8">
                  <div className="flex flex-wrap gap-2">
                    {listing.categories.map((category) => (
                      <span
                        key={category.id}
                        className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-foreground"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Detalle de la publicacion</p>
                    <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                      {listing.title}
                    </h1>
                    <div className="flex items-center gap-3 rounded-2xl border bg-background p-3">
                      {author?.image ? (
                        <img
                          src={author.image}
                          alt={getAuthorName(author)}
                          className="size-10 rounded-full border object-cover"
                        />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-full border bg-background text-sm font-semibold">
                          {getAuthorInitial(author, listing.sellerId)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Publicado por</p>
                        <p className="truncate text-sm font-medium text-foreground">
                          {getAuthorName(author)}
                        </p>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-base leading-8 text-muted-foreground">
                      {listing.description || "El vendedor no agrego una descripcion."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
              <Card className="rounded-[2rem] bg-background shadow-sm shadow-foreground/5">
                <CardContent className="space-y-5 p-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Precio</p>
                    <p className="mt-1 text-3xl font-semibold">{formatListingPrice(listing)}</p>
                  </div>

                  <div className="grid gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 rounded-2xl border bg-background p-3">
                      <Tag className="size-4" />
                      {formatListingType(listing.listingType)}
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border bg-background p-3">
                      <ShieldCheck className="size-4" />
                      {listing.condition ? formatCondition(listing.condition) : "Estado por acordar"}
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border bg-background p-3">
                      <MapPin className="size-4" />
                      {listing.location ?? "Ubicacion por acordar"}
                    </div>
                  </div>

                  {isOwner && deleteError && (
                    <p className="rounded-xl border px-3 py-2 text-sm text-muted-foreground">
                      {deleteError}
                    </p>
                  )}

                  {isOwner ? (
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
                  ) : null}
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] bg-background shadow-sm shadow-foreground/5">
                <CardContent className="space-y-4 p-5">
                  <div>
                    <p className="text-sm font-medium text-foreground">Contacto</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Coordina directamente con el vendedor.
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="w-full rounded-full"
                    disabled={isContacting || isOwner}
                    onClick={handleContactSeller}
                  >
                    {isContacting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MessageCircle className="size-4" />
                    )}
                    {isOwner
                      ? "Es tu publicacion"
                      : isContacting
                        ? "Abriendo chat..."
                        : "Contactar vendedor"}
                  </Button>
                  <ContactLinks contactInfo={listing.contactInfo} />
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-dashed bg-background shadow-sm shadow-foreground/5">
                <CardContent className="space-y-2 p-5 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Compra segura en campus</p>
                  <p>Revisa el articulo antes de pagar y acuerda entregas en zonas concurridas.</p>
                </CardContent>
              </Card>
            </aside>
          </section>
        ) : (
          <Card className="rounded-[2rem] bg-background p-8 text-center">
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

function ListingDetailSkeleton() {
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <Card className="overflow-hidden rounded-[2rem] bg-background py-0 shadow-sm shadow-foreground/5">
          <div className="aspect-[4/3] animate-pulse bg-muted sm:aspect-video" />
          <div className="flex gap-3 border-t bg-background p-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="size-20 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        </Card>

        <Card className="rounded-[2rem] bg-background shadow-sm shadow-foreground/5">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="flex gap-2">
              <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
              <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-36 animate-pulse rounded-full bg-muted" />
              <div className="h-10 w-3/4 animate-pulse rounded-2xl bg-muted" />
              <div className="h-4 w-full animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-11/12 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted" />
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
        <Card className="rounded-[2rem] bg-background shadow-sm shadow-foreground/5">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <div className="h-4 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-9 w-40 animate-pulse rounded-2xl bg-muted" />
            </div>
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-11 animate-pulse rounded-2xl bg-muted"
                />
              ))}
            </div>
            <div className="h-10 animate-pulse rounded-full bg-muted" />
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] bg-background shadow-sm shadow-foreground/5">
          <CardContent className="space-y-3 p-5">
            <div className="h-4 w-20 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-48 animate-pulse rounded-full bg-muted" />
            <div className="h-10 animate-pulse rounded-2xl bg-muted" />
          </CardContent>
        </Card>
      </aside>
    </section>
  )
}

function ContactLinks({ contactInfo }: { contactInfo: Record<string, string> | null }) {
  const whatsapp = contactInfo?.whatsapp
  const instagram = contactInfo?.instagram
  const email = contactInfo?.email

  if (!whatsapp && !instagram && !email) {
    return (
      <p className="rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
        Esta publicacion no tiene contacto visible.
      </p>
    )
  }

  return (
    <div className="grid gap-2 text-sm">
      {whatsapp ? (
        <a
          href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-2xl border bg-background px-3 py-2 transition hover:bg-muted"
        >
          <Phone className="size-4" />
          WhatsApp
        </a>
      ) : null}
      {instagram ? (
        <a
          href={`https://instagram.com/${instagram.replace(/^@/, "")}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-2xl border bg-background px-3 py-2 transition hover:bg-muted"
        >
          <MessageCircle className="size-4" />
          {instagram.startsWith("@") ? instagram : `@${instagram}`}
        </a>
      ) : null}
      {email ? (
        <a
          href={`mailto:${email}`}
          className="flex items-center gap-2 rounded-2xl border bg-background px-3 py-2 transition hover:bg-muted"
        >
          <Mail className="size-4" />
          {email}
        </a>
      ) : null}
    </div>
  )
}

function getAuthorName(author?: BasicUser | null) {
  return author?.name?.trim() || author?.email || "Usuario CECAR"
}

function getAuthorInitial(author: BasicUser | null, fallbackId: string) {
  return getAuthorName(author).trim().charAt(0).toUpperCase() || fallbackId.charAt(0).toUpperCase() || "U"
}

function formatListingType(type: ListingType) {
  const labels: Record<ListingType, string> = {
    SALE: "Venta",
    EXCHANGE: "Intercambio",
    SERVICE: "Servicio",
  }

  return labels[type]
}

function formatCondition(condition: ListingCondition) {
  const labels: Record<ListingCondition, string> = {
    NEW: "Nuevo",
    LIKE_NEW: "Como nuevo",
    USED: "Usado",
  }

  return labels[condition]
}
