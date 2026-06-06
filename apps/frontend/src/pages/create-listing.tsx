import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  Check,
  ImagePlus,
  Info,
  Loader2,
  MapPin,
  Sparkles,
  Trash2,
} from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { Link, Navigate, useNavigate } from "react-router"
import * as z from "zod"

import { MarketplaceNavbar } from "@/components/MarketplaceNavbar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { type CategoryResponse } from "@/lib/mock-marketplace"
import { apiRoutes } from "@/lib/api"
import { useSession } from "@/lib/auth"
import { useUploadThing, deleteImageFiles } from "@/lib/uploadthing"
import { cn } from "@/lib/utils"

const MAX_IMAGE_COUNT = 5

const listingTypes = [
  {
    value: "SALE",
    label: "Venta",
    description: "Publica un precio y recibe interesados.",
  },
  {
    value: "EXCHANGE",
    label: "Intercambio",
    description: "Propón trueques con otros estudiantes.",
  },
  {
    value: "SERVICE",
    label: "Servicio",
    description: "Ofrece tutorias, reparaciones o apoyo academico.",
  },
] as const

const conditions = [
  { value: "", label: "No aplica" },
  { value: "NEW", label: "Nuevo" },
  { value: "LIKE_NEW", label: "Como nuevo" },
  { value: "USED", label: "Usado" },
] as const

const formSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, "El titulo debe tener al menos 5 caracteres.")
      .max(120, "El titulo no puede superar 120 caracteres."),
    description: z
      .string()
      .trim()
      .min(20, "La descripcion debe tener al menos 20 caracteres.")
      .max(2000, "La descripcion no puede superar 2000 caracteres."),
    price: z
      .string()
      .trim()
      .refine((value) => value === "" || /^\d+$/.test(value), {
        message: "Ingresa el precio en COP sin letras ni simbolos.",
      })
      .refine((value) => value === "" || Number(value) >= 0, {
        message: "El precio no puede ser negativo.",
      }),
    listingType: z.enum(["SALE", "EXCHANGE", "SERVICE"], {
      message: "Selecciona el tipo de transaccion.",
    }),
    condition: z.enum(["NEW", "LIKE_NEW", "USED"]).or(z.literal("")),
    location: z
      .string()
      .trim()
      .max(255, "La ubicacion no puede superar 255 caracteres."),
    whatsapp: z.string().trim(),
    instagram: z.string().trim(),
    email: z
      .string()
      .trim()
      .refine((value) => value === "" || z.email().safeParse(value).success, {
        message: "Ingresa un correo valido.",
      }),
    categoryIds: z
      .array(z.uuid())
      .min(1, "Selecciona al menos una categoria."),
    imageFiles: z
      .array(z.instanceof(File))
      .max(MAX_IMAGE_COUNT, `Puedes subir hasta ${MAX_IMAGE_COUNT} imagenes.`),
  })
  .superRefine((values, context) => {
    if (values.listingType === "EXCHANGE") {
      return
    }

    if (values.price === "" || Number(values.price) <= 0) {
      context.addIssue({
        code: "custom",
        path: ["price"],
        message: "El precio es obligatorio y debe ser mayor a 0 para ventas y servicios.",
      })
    }
  })

type ListingFormValues = z.infer<typeof formSchema>

export default function CreateListingPage() {
  const { data, isPending } = useSession()
  const navigate = useNavigate()
  const [categories, setCategories] = React.useState<CategoryResponse[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(true)
  const [categoryError, setCategoryError] = React.useState<string | null>(null)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const { startUpload, isUploading } = useUploadThing("imageUploader")

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      listingType: "SALE",
      condition: "",
      location: "",
      whatsapp: "",
      instagram: "",
      email: data?.user.email ?? "",
      categoryIds: [],
      imageFiles: [],
    },
  })

  const imageFiles = useWatch({ control: form.control, name: "imageFiles" })
  const selectedType = useWatch({ control: form.control, name: "listingType" })
  const titleValue = useWatch({ control: form.control, name: "title" })
  const priceValue = useWatch({ control: form.control, name: "price" })
  const locationValue = useWatch({ control: form.control, name: "location" })
  const previewUrls = React.useMemo(
    () => imageFiles.map((file) => URL.createObjectURL(file)),
    [imageFiles]
  )

  React.useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  React.useEffect(() => {
    if (!data?.user.email || form.getFieldState("email").isDirty) {
      return
    }

    form.setValue("email", data.user.email)
  }, [data?.user.email, form])

  React.useEffect(() => {
    let ignore = false

    async function loadCategories() {
      setIsLoadingCategories(true)
      setCategoryError(null)

      try {
        const response = await fetch(apiRoutes.catalog.categories, {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("category-load-failed")
        }

        const nextCategories = (await response.json()) as CategoryResponse[]

        if (!ignore) {
          setCategories(nextCategories)
        }
      } catch {
        if (!ignore) {
          setCategories([])
          setCategoryError("No pudimos cargar categorias del catalogo. Mostramos categorias locales temporalmente.")
        }
      } finally {
        if (!ignore) {
          setIsLoadingCategories(false)
        }
      }
    }

    loadCategories()

    return () => {
      ignore = true
    }
  }, [])

  async function onSubmit(values: ListingFormValues) {
    setSubmitError(null)

    interface ListingImagePayload {
      url: string
      name: string
      key: string
    }

    let images: ListingImagePayload[] = []

    if (values.imageFiles.length > 0) {
      try {
        const uploadedFiles = await startUpload(values.imageFiles)
        images =
          uploadedFiles
            ?.filter((file) => file.url)
            .map((file) => ({
              url: file.url,
              name: file.name,
              key: file.key ?? file.name,
            })) ?? []
      } catch {
        setSubmitError("No pudimos subir las imagenes. Intenta de nuevo antes de publicar.")
        return
      }

      if (images.length !== values.imageFiles.length) {
        setSubmitError("No todas las imagenes terminaron de subirse. Intenta de nuevo.")
        return
      }
    }

    const contactInfo = Object.fromEntries(
      [
        ["whatsapp", values.whatsapp],
        ["instagram", values.instagram],
        ["email", values.email],
      ].filter(([, value]) => value.trim() !== "")
    )

    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      price: values.price.trim() === "" ? null : values.price.trim(),
      listingType: values.listingType,
      condition: values.condition === "" ? null : values.condition,
      location: values.location.trim() === "" ? null : values.location.trim(),
      contactInfo: Object.keys(contactInfo).length > 0 ? contactInfo : null,
      categoryIds: values.categoryIds,
      images,
    }

    const response = await fetch(apiRoutes.catalog.listings, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const uploadedKeys = images.map((img) => img.key).filter(Boolean)
      if (uploadedKeys.length > 0) {
        try {
          await deleteImageFiles(uploadedKeys)
        } catch {
          console.warn("[create-listing] image cleanup failed")
        }
      }
      setSubmitError("No pudimos crear la publicacion. Revisa los datos e intenta de nuevo.")
      return
    }

    const createdListing = (await response.json()) as { id?: string }
    navigate(createdListing.id ? `/listings/${createdListing.id}` : "/")
  }

  function updateImages(files: FileList | null) {
    if (!files) {
      return
    }

    const currentFiles = form.getValues("imageFiles")
    const nextFiles = [...currentFiles, ...Array.from(files)].slice(0, MAX_IMAGE_COUNT)
    form.setValue("imageFiles", nextFiles, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function removeImage(index: number) {
    form.setValue(
      "imageFiles",
      form.getValues("imageFiles").filter((_, fileIndex) => fileIndex !== index),
      { shouldDirty: true, shouldValidate: true }
    )
  }

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f7f5ef]">
        <div className="rounded-full border bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur">
          Preparando el editor de publicacion...
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

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="rounded-[2rem] bg-background/95 py-0 shadow-sm shadow-foreground/5">
            <CardHeader className="border-b p-6 sm:p-8">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="size-3" />
                Nueva publicacion
              </span>
              <div className="space-y-2">
                <CardTitle className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                  Cuéntale a CECAR qué tienes para ofrecer.
                </CardTitle>
                <CardDescription className="max-w-2xl text-base leading-7">
                  Completa la informacion principal. Las imagenes quedan listas en el formulario; luego conectaremos el uploader definitivo del servicio de media.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-8">
              <form
                id="create-listing-form"
                className="space-y-8"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FieldGroup>
                  <Controller
                    name="title"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="listing-title">Titulo</FieldLabel>
                        <Input
                          {...field}
                          id="listing-title"
                          aria-invalid={fieldState.invalid}
                          className="h-11 rounded-xl text-base"
                          placeholder="Ej. Calculadora Casio para parciales"
                          autoComplete="off"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="description"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="listing-description">Descripcion</FieldLabel>
                        <Textarea
                          {...field}
                          id="listing-description"
                          aria-invalid={fieldState.invalid}
                          className="min-h-36 resize-none rounded-xl text-base leading-7"
                          placeholder="Describe el estado, que incluye, como lo entregas y cualquier detalle importante."
                        />
                        <FieldDescription>
                          Mientras mas claro seas, mas rapido te contactaran.
                        </FieldDescription>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="listingType"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <FieldSet>
                        <FieldLegend>Tipo de publicacion</FieldLegend>
                        <div className="grid gap-3 md:grid-cols-3">
                          {listingTypes.map((type) => {
                            const checked = field.value === type.value

                            return (
                              <button
                                key={type.value}
                                type="button"
                                className={cn(
                                  "rounded-2xl border bg-background p-4 text-left transition hover:border-primary/50 hover:bg-primary/5",
                                  checked && "border-primary bg-primary/10 ring-2 ring-primary/20"
                                )}
                                onClick={() => field.onChange(type.value)}
                              >
                                <div className="mb-3 flex items-center justify-between gap-3">
                                  <span className="font-medium">{type.label}</span>
                                  <span
                                    className={cn(
                                      "flex size-6 items-center justify-center rounded-full border text-primary",
                                      checked && "border-primary bg-primary text-primary-foreground"
                                    )}
                                  >
                                    {checked && <Check className="size-3.5" />}
                                  </span>
                                </div>
                                <p className="text-sm leading-6 text-muted-foreground">
                                  {type.description}
                                </p>
                              </button>
                            )
                          })}
                        </div>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </FieldSet>
                    )}
                  />
                </FieldGroup>

                <div className="grid gap-5 md:grid-cols-2">
                  <Controller
                    name="price"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="listing-price">Precio</FieldLabel>
                        <Input
                          {...field}
                          id="listing-price"
                          inputMode="decimal"
                          aria-invalid={fieldState.invalid}
                          className="h-11 rounded-xl"
                          placeholder={selectedType === "EXCHANGE" ? "Opcional" : "85000"}
                        />
                        <FieldDescription>
                          Obligatorio para ventas y servicios. En intercambio puede quedar vacio.
                        </FieldDescription>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="condition"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="listing-condition">Estado</FieldLabel>
                        <select
                          id="listing-condition"
                          name={field.name}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          aria-invalid={fieldState.invalid}
                          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
                        >
                          {conditions.map((condition) => (
                            <option key={condition.value} value={condition.value}>
                              {condition.label}
                            </option>
                          ))}
                        </select>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name="categoryIds"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <FieldSet data-invalid={fieldState.invalid}>
                      <FieldLegend>Categorias</FieldLegend>
                      <FieldDescription>
                        Selecciona una o varias para que aparezca en las busquedas correctas.
                      </FieldDescription>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {categories.map((category) => {
                          const checked = field.value.includes(category.id)

                          return (
                            <button
                              key={category.id}
                              type="button"
                              className={cn(
                                "flex items-center justify-between rounded-2xl border bg-background px-4 py-3 text-sm font-medium transition hover:border-primary/50 hover:bg-primary/5",
                                checked && "border-primary bg-primary/10 text-primary ring-2 ring-primary/15"
                              )}
                              onClick={() => {
                                field.onChange(
                                  checked
                                    ? field.value.filter((id) => id !== category.id)
                                    : [...field.value, category.id]
                                )
                              }}
                            >
                              {category.name}
                              {checked && <Check className="size-4" />}
                            </button>
                          )
                        })}
                      </div>
                      {isLoadingCategories && (
                        <FieldDescription>Cargando categorias del catalogo...</FieldDescription>
                      )}
                      {categoryError && (
                        <FieldDescription className="text-amber-700">
                          {categoryError}
                        </FieldDescription>
                      )}
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </FieldSet>
                  )}
                />

                <div className="grid gap-5 md:grid-cols-2">
                  <Controller
                    name="location"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="listing-location">Ubicacion</FieldLabel>
                        <Input
                          {...field}
                          id="listing-location"
                          aria-invalid={fieldState.invalid}
                          className="h-11 rounded-xl"
                          placeholder="Campus Sincelejo, Bloque B o ciudad"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="whatsapp"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="listing-whatsapp">WhatsApp</FieldLabel>
                        <Input
                          {...field}
                          id="listing-whatsapp"
                          aria-invalid={fieldState.invalid}
                          className="h-11 rounded-xl"
                          placeholder="+57 300 123 4567"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="instagram"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="listing-instagram">Instagram</FieldLabel>
                        <Input
                          {...field}
                          id="listing-instagram"
                          aria-invalid={fieldState.invalid}
                          className="h-11 rounded-xl"
                          placeholder="@usuario"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="email"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="listing-email">Correo</FieldLabel>
                        <Input
                          {...field}
                          id="listing-email"
                          type="email"
                          aria-invalid={fieldState.invalid}
                          className="h-11 rounded-xl"
                          placeholder="correo@cecar.edu.co"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name="imageFiles"
                  control={form.control}
                  render={({ fieldState }) => (
                    <FieldSet data-invalid={fieldState.invalid}>
                      <FieldLegend>Imagenes</FieldLegend>
                      <FieldDescription>
                        Agrega hasta {MAX_IMAGE_COUNT} archivos. Por ahora solo se previsualizan; las URLs se conectaran al servicio de imagenes despues.
                      </FieldDescription>
                      <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed bg-muted/40 p-6 text-center transition hover:border-primary/60 hover:bg-primary/5">
                        <ImagePlus className="mb-3 size-8 text-primary" />
                        <span className="font-medium">Arrastra o selecciona imagenes</span>
                        <span className="mt-1 text-sm text-muted-foreground">
                          JPG, PNG o WEBP. Maximo {MAX_IMAGE_COUNT} archivos.
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={(event) => {
                            updateImages(event.target.files)
                            event.target.value = ""
                          }}
                        />
                      </label>
                      {previewUrls.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                          {previewUrls.map((url, index) => (
                            <div key={url} className="group relative overflow-hidden rounded-2xl border bg-muted">
                              <img
                                src={url}
                                alt={`Imagen ${index + 1} de la publicacion`}
                                className="aspect-square w-full object-cover"
                              />
                              <Button
                                type="button"
                                size="icon-xs"
                                variant="destructive"
                                className="absolute right-2 top-2 opacity-100 shadow-sm sm:opacity-0 sm:group-hover:opacity-100"
                                onClick={() => removeImage(index)}
                                aria-label={`Eliminar imagen ${index + 1}`}
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </FieldSet>
                  )}
                />

                {submitError && (
                  <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    <Info className="mt-0.5 size-4" />
                    {submitError}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-full px-5"
                    onClick={() => {
                      setSubmitError(null)
                      form.reset()
                    }}
                  >
                    Limpiar
                  </Button>
                  <Button
                    type="submit"
                    className="h-11 rounded-full px-6"
                    disabled={form.formState.isSubmitting || isUploading}
                  >
                    {(form.formState.isSubmitting || isUploading) && <Loader2 className="size-4 animate-spin" />}
                    {isUploading ? "Subiendo imagenes..." : "Publicar ahora"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <aside className="lg:sticky lg:top-6 lg:h-fit">
            <Card className="rounded-[2rem] bg-foreground text-background shadow-xl shadow-foreground/10">
              <CardHeader>
                <CardTitle className="text-xl">Vista rapida</CardTitle>
                <CardDescription className="text-background/65">
                  Asi se sentira tu publicacion en el marketplace.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-hidden rounded-[1.5rem] bg-background/10">
                  {previewUrls[0] ? (
                    <img
                      src={previewUrls[0]}
                      alt="Previsualizacion principal"
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center border border-dashed border-background/20">
                      <ImagePlus className="size-10 text-background/50" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="inline-flex rounded-full bg-background/10 px-3 py-1 text-xs font-medium text-background/80">
                    {listingTypes.find((type) => type.value === selectedType)?.label}
                  </div>
                  <h2 className="font-heading text-2xl font-semibold leading-tight">
                    {titleValue.trim() || "Titulo de tu publicacion"}
                  </h2>
                  <p className="text-3xl font-semibold">
                    {priceValue.trim() ? formatCopPrice(priceValue) : "Precio opcional"}
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-background/10 p-3 text-sm text-background/75">
                  <MapPin className="size-4" />
                  {locationValue.trim() || "Punto de encuentro en campus"}
                </div>
              </CardContent>
            </Card>
          </aside>
        </section>
      </main>
    </div>
  )
}

function formatCopPrice(value: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value))
}
