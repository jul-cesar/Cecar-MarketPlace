import * as React from "react";
import { Link, Navigate } from "react-router";
import { ArrowUpRight, Plus, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import { CategoryRail } from "@/components/CategoryRail";
import { ListingCard } from "@/components/ListingCard";
import { MarketplaceNavbar } from "@/components/MarketplaceNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRoutes } from "@/lib/api";
import { useInstitutionalSessionGuard } from "@/lib/auth-policy";
import { useSession } from "@/lib/auth";
import {
  type CategoryResponse,
  type ListingSummaryResponse,
  type ListingType,
} from "@/lib/mock-marketplace";
import { fetchBasicUsers, type BasicUser } from "@/lib/users";
import { cn } from "@/lib/utils";
import { Spotlight } from "@/components/ui/spotlight";

type ListingTypeFilter = "all" | ListingType;

const listingTypeFilters: Array<{ label: string; value: ListingTypeFilter }> = [
  { label: "Todo", value: "all" },
  { label: "Ventas", value: "SALE" },
  { label: "Cambios", value: "EXCHANGE" },
  { label: "Servicios", value: "SERVICE" },
];

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export default function HomePage() {
  const { data, isPending } = useSession();
  const { isBlocking, isInstitutionalUser } = useInstitutionalSessionGuard(data, isPending)
  const [query, setQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [selectedType, setSelectedType] =
    React.useState<ListingTypeFilter>("all");
  const [categories, setCategories] = React.useState<CategoryResponse[]>([]);
  const [listings, setListings] = React.useState<ListingSummaryResponse[]>([]);
  const [authorsById, setAuthorsById] = React.useState<Map<string, BasicUser>>(
    () => new Map(),
  );
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let ignore = false;

    async function loadData() {
      setIsLoading(true);

      const [categoriesRes, listingsRes] = await Promise.all([
        fetch(apiRoutes.catalog.categories, { credentials: "include" }),
        fetch(apiRoutes.catalog.listings + "?page=0&size=50", {
          credentials: "include",
        }),
      ]);

      if (!ignore) {
        if (categoriesRes.ok) {
          setCategories((await categoriesRes.json()) as CategoryResponse[]);
        }

        if (listingsRes.ok) {
          const page =
            (await listingsRes.json()) as PageResponse<ListingSummaryResponse>;
          setListings(page.content);
        } else {
          toast.error("No pudimos cargar las publicaciones");
        }

        setIsLoading(false);
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  React.useEffect(() => {
    let ignore = false;

    async function loadAuthors() {
      try {
        const authors = await fetchBasicUsers(
          listings.map((listing) => listing.sellerId),
        );

        if (!ignore) {
          setAuthorsById(authors);
        }
      } catch {
        if (!ignore) {
          setAuthorsById(new Map());
        }
      }
    }

    loadAuthors();

    return () => {
      ignore = true;
    };
  }, [listings]);

  const deferredQuery = React.useDeferredValue(query);

  const listingCountByCategory = React.useMemo(
    () => countListingsByCategory(listings),
    [listings],
  );

  const filteredListings = React.useMemo(
    () =>
      filterListings({
        listings,
        query: deferredQuery,
        selectedCategory,
        selectedType,
      }),
    [listings, deferredQuery, selectedCategory, selectedType],
  );

  function handleCategoryChange(slug: string) {
    React.startTransition(() => {
      setSelectedCategory(slug);
    });
  }

  function handleTypeChange(type: ListingTypeFilter) {
    React.startTransition(() => {
      setSelectedType(type);
    });
  }

  if (isPending || isBlocking) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_top,var(--color-primary)_0,transparent_32rem)]">
        <div className="rounded-full border bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur">
          Preparando tu mercado del campus...
        </div>
      </div>
    );
  }

  if (!data?.user) {
    return <Navigate to="/login" replace />;
  }

  if (!isInstitutionalUser) {
    return null
  }

  return (
    <div className="min-h-svh  text-foreground">
      <MarketplaceNavbar user={data.user} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        
        <section className="relative overflow-hidden rounded-[2rem] border bg-background p-6 shadow-sm shadow-foreground/5 sm:p-10">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <Spotlight
              className="-top-40 left-0 md:-top-10 md:left-60 opacity-100 animate-spotlight-left"
              fill="green"
            />
            <Spotlight
              className="-top-40 right-0 md:-top-20 md:right-60 opacity-100 animate-spotlight-right"
              fill="white"
            />
          
            <span className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              Marketplace privado para comunidad CECAR
              <ArrowUpRight className="size-3" />
            </span>

            <div className="space-y-4">
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Encuentra lo que se mueve entre clases.
              </h1>
              <p className="mx-auto max-w-xl text-base leading-7 text-pretty text-muted-foreground">
                Compra, cambia o encuentra servicios dentro del campus:
                ubicacion, categoria, estado y contacto listos para coordinar.
              </p>
            </div>

            {/* Buscador */}
            <div className="mx-auto flex max-w-2xl flex-col gap-3 rounded-3xl border bg-background p-2 shadow-lg shadow-foreground/5 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2 px-2">
                <Search className="size-5 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar ..."
                  className="h-11 border-0 bpx-0 text-base shadow-none focus-visible:ring-0"
                />
              </div>
              <Button className="h-11 rounded-2xl px-5" type="button">
                Explorar
              </Button>
            </div>

            {/* Filtros por tipo */}
            <div className="flex flex-wrap justify-center gap-2">
              {listingTypeFilters.map((filter) => (
                <Button
                  key={filter.value}
                  type="button"
                  variant={
                    selectedType === filter.value ? "default" : "outline"
                  }
                  size="sm"
                  className={cn(
                    "rounded-full",
                    selectedType !== filter.value && "bg-background/70",
                  )}
                  onClick={() => handleTypeChange(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">Categorias</p>
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                Navega por mood de campus
              </h2>
            </div>
            <Button
              variant="outline"
              className="hidden rounded-full bg-background/70 sm:inline-flex"
            >
              <SlidersHorizontal className="size-4" />
              Mas filtros
            </Button>
          </div>

          {categories.length > 0 ? (
            <CategoryRail
              categories={categories}
              selectedCategory={selectedCategory}
              listingCountByCategory={listingCountByCategory}
              onSelectCategory={handleCategoryChange}
            />
          ) : (
            <div className="rounded-[2rem] border border-dashed bg-background/70 p-6 text-center text-sm text-muted-foreground">
              Cargando categorias...
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Cargando..." : filteredListings.length} resultados
              encontrados
            </p>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Publicaciones destacadas
            </h2>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,42rem)_320px]">
            <div>
              {isLoading ? (
                <div className="grid w-full gap-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[34rem] animate-pulse rounded-[2rem] border bg-muted/70"
                    />
                  ))}
                </div>
              ) : filteredListings.length > 0 ? (
                <div className="grid w-full gap-5">
                  {filteredListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      author={authorsById.get(listing.sellerId)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-dashed bg-background/70 p-10 text-center">
                  <p className="font-heading text-xl font-semibold">
                    Nada por aqui todavia
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Prueba con otra categoria, cambia el tipo de publicacion o borra
                    parte de la busqueda.
                  </p>
                </div>
              )}
            </div>

          <aside className="hidden space-y-4 lg:sticky lg:top-6 lg:block">
            <div className="rounded-[2rem] border bg-foreground p-5 text-background shadow-xl shadow-foreground/10">
              <p className="text-sm text-background/70">Vende o cambia rapido</p>
              <h3 className="mt-2 font-heading text-2xl font-semibold leading-tight">
                Publica algo para la comunidad CECAR
              </h3>
              <p className="mt-3 text-sm leading-6 text-background/70">
                Sube fotos claras, escribe una descripcion corta y deja tu medio
                de contacto para coordinar dentro del campus.
              </p>
              <Button asChild className="mt-5 w-full rounded-full bg-background text-foreground hover:bg-background/90">
                <Link to="/publish">
                  <Plus className="size-4" />
                  Crear publicacion
                </Link>
              </Button>
            </div>

            <div className="rounded-[2rem] border bg-background/80 p-5 shadow-sm shadow-foreground/5">
              <p className="text-sm font-medium text-primary">Tips para publicar</p>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p className="rounded-2xl bg-muted px-3 py-2">
                  Usa varias fotos si el producto tiene detalles importantes.
                </p>
                <p className="rounded-2xl bg-muted px-3 py-2">
                  Incluye ubicacion aproximada y estado real del articulo.
                </p>
                <p className="rounded-2xl bg-muted px-3 py-2">
                  Si aceptas cambios, di claramente que estas buscando.
                </p>
              </div>
            </div>
          </aside>
          </div>
        </section>
      </main>
    </div>
  );
}

interface FilterListingsInput {
  listings: ListingSummaryResponse[];
  query: string;
  selectedCategory: string;
  selectedType: ListingTypeFilter;
}

function filterListings({
  listings,
  query,
  selectedCategory,
  selectedType,
}: FilterListingsInput) {
  const normalizedQuery = query.trim().toLowerCase();

  return listings.filter((listing) => {
    const matchesCategory =
      selectedCategory === "all" ||
      listing.categories.some((category) => category.slug === selectedCategory);
    const matchesType =
      selectedType === "all" || listing.listingType === selectedType;
    const searchableText = [
      listing.title,
      listing.description ?? "",
      listing.location ?? "",
      ...listing.categories.map((category) => category.name),
    ]
      .join(" ")
      .toLowerCase();
    const matchesQuery =
      !normalizedQuery || searchableText.includes(normalizedQuery);

    return matchesCategory && matchesType && matchesQuery;
  });
}

function countListingsByCategory(listings: ListingSummaryResponse[]) {
  return listings.reduce<Record<string, number>>((counts, listing) => {
    for (const category of listing.categories) {
      counts[category.slug] = (counts[category.slug] ?? 0) + 1;
    }

    return counts;
  }, {});
}
