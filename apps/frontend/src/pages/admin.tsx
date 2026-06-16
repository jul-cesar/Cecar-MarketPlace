import { useCallback, useEffect, useState } from "react"
import { Navigate } from "react-router"
import {
  BarChart3,
  Ban,
  CheckCircle,
  FileText,
  Loader2,
  Shield,
  Users,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"

import { MarketplaceNavbar } from "@/components/MarketplaceNavbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSession } from "@/lib/auth"
import {
  fetchAdminUsers,
  banUser,
  unbanUser,
  fetchAdminMetrics,
  fetchAdminListings,
  blockListing,
  restoreListing,
  type AdminUser,
  type AdminMetrics,
  type AdminListing,
} from "@/lib/admin"

export default function AdminPage() {
  const { data, isPending } = useSession()

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data?.user) {
    return <Navigate to="/login" replace />
  }

  const user = data.user as typeof data.user & { role?: string | null }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold">Panel de Administración</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona usuarios, publicaciones y métricas del sistema
            </p>
          </div>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="size-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="listings" className="gap-1.5">
              <LayoutGrid className="size-4" />
              Publicaciones
            </TabsTrigger>
            <TabsTrigger value="metrics" className="gap-1.5">
              <BarChart3 className="size-4" />
              Métricas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
          <TabsContent value="listings">
            <ListingsTab />
          </TabsContent>
          <TabsContent value="metrics">
            <MetricsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [filter, setFilter] = useState<"all" | "active" | "banned">("all")
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    user: AdminUser | null
    action: "ban" | "unban"
  }>({ open: false, user: null, action: "ban" })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const banned = filter === "banned" ? true : filter === "active" ? false : undefined
      const res = await fetchAdminUsers(page, 20, banned)
      setUsers(res.content)
      setTotalPages(res.totalPages)
      setTotalElements(res.totalElements)
    } catch {
      toast.error("Error al cargar usuarios")
    } finally {
      setLoading(false)
    }
  }, [page, filter])

  useEffect(() => { loadUsers() }, [loadUsers])

  async function handleConfirm() {
    if (!confirmDialog.user) return
    setActionLoading(confirmDialog.user.id)
    try {
      if (confirmDialog.action === "ban") {
        await banUser(confirmDialog.user.id)
        toast.success(`Usuario ${confirmDialog.user.name} bloqueado`)
      } else {
        await unbanUser(confirmDialog.user.id)
        toast.success(`Usuario ${confirmDialog.user.name} desbloqueado`)
      }
      loadUsers()
    } catch {
      toast.error("Error al realizar la acción")
    } finally {
      setActionLoading(null)
      setConfirmDialog({ open: false, user: null, action: "ban" })
    }
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">Usuarios</h2>
          <p className="text-sm text-muted-foreground">{totalElements} usuarios registrados</p>
        </div>
        <div className="flex gap-2">
          {(["all", "active", "banned"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => { setFilter(f); setPage(0) }}
            >
              {f === "all" ? "Todos" : f === "active" ? "Activos" : "Bloqueados"}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.banned ? "destructive" : "success"}>
                      {u.banned ? "Bloqueado" : "Activo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString("es-CO")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={u.banned ? "outline" : "destructive"}
                      size="sm"
                      disabled={actionLoading === u.id}
                      onClick={() => setConfirmDialog({
                        open: true,
                        user: u,
                        action: u.banned ? "unban" : "ban",
                      })}
                    >
                      {actionLoading === u.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : u.banned ? (
                        <>
                          <CheckCircle className="size-3" />
                          Desbloquear
                        </>
                      ) : (
                        <>
                          <Ban className="size-3" />
                          Bloquear
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t p-4">
              <span className="text-sm text-muted-foreground">
                Página {page + 1} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.action === "ban" ? "Bloquear usuario" : "Desbloquear usuario"}
        description={
          confirmDialog.action === "ban"
            ? `¿Estás seguro de que deseas bloquear a ${confirmDialog.user?.name}? No podrá iniciar sesión.`
            : `¿Estás seguro de que deseas desbloquear a ${confirmDialog.user?.name}? Podrá iniciar sesión nuevamente.`
        }
        variant={confirmDialog.action === "ban" ? "destructive" : "default"}
        onConfirm={handleConfirm}
      />
    </div>
  )
}

function ListingsTab() {
  const [listings, setListings] = useState<AdminListing[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    listing: AdminListing | null
    action: "block" | "restore"
  }>({ open: false, listing: null, action: "block" })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadListings = useCallback(async () => {
    setLoading(true)
    try {
      const status = statusFilter === "all" ? undefined : statusFilter
      const res = await fetchAdminListings(page, 20, status)
      setListings(res.content)
      setTotalPages(res.totalPages)
      setTotalElements(res.totalElements)
    } catch {
      toast.error("Error al cargar publicaciones")
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { loadListings() }, [loadListings])

  async function handleConfirm() {
    if (!confirmDialog.listing) return
    setActionLoading(confirmDialog.listing.id)
    try {
      if (confirmDialog.action === "block") {
        await blockListing(confirmDialog.listing.id)
        toast.success(`Publicación "${confirmDialog.listing.title}" bloqueada`)
      } else {
        await restoreListing(confirmDialog.listing.id)
        toast.success(`Publicación "${confirmDialog.listing.title}" restaurada`)
      }
      loadListings()
    } catch {
      toast.error("Error al realizar la acción")
    } finally {
      setActionLoading(null)
      setConfirmDialog({ open: false, listing: null, action: "block" })
    }
  }

  const statusOptions = [
    { value: "all", label: "Todos" },
    { value: "ACTIVE", label: "Activos" },
    { value: "BLOCKED", label: "Bloqueados" },
    { value: "REMOVED", label: "Removidos" },
    { value: "PAUSED", label: "Pausados" },
    { value: "SOLD", label: "Vendidos" },
  ]

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">Publicaciones</h2>
          <p className="text-sm text-muted-foreground">{totalElements} publicaciones en total</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={statusFilter === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => { setStatusFilter(opt.value); setPage(0) }}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Vistas</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="max-w-48 truncate font-medium">{l.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{l.listingType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(l.status)}>{l.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {l.price ? `$${Number(l.price).toLocaleString("es-CO")}` : "—"}
                  </TableCell>
                  <TableCell>{l.viewCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(l.createdAt).toLocaleDateString("es-CO")}
                  </TableCell>
                  <TableCell className="text-right">
                    {l.status === "BLOCKED" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === l.id}
                        onClick={() => setConfirmDialog({
                          open: true,
                          listing: l,
                          action: "restore",
                        })}
                      >
                        {actionLoading === l.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="size-3" />
                            Restaurar
                          </>
                        )}
                      </Button>
                    ) : l.status !== "REMOVED" ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={actionLoading === l.id}
                        onClick={() => setConfirmDialog({
                          open: true,
                          listing: l,
                          action: "block",
                        })}
                      >
                        {actionLoading === l.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <>
                            <Ban className="size-3" />
                            Bloquear
                          </>
                        )}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Removida</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {listings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No se encontraron publicaciones
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t p-4">
              <span className="text-sm text-muted-foreground">
                Página {page + 1} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.action === "block" ? "Bloquear publicación" : "Restaurar publicación"}
        description={
          confirmDialog.action === "block"
            ? `¿Estás seguro de que deseas bloquear "${confirmDialog.listing?.title}"? No será visible para los usuarios.`
            : `¿Estás seguro de que deseas restaurar "${confirmDialog.listing?.title}"? Volverá a ser visible.`
        }
        variant={confirmDialog.action === "block" ? "destructive" : "default"}
        onConfirm={handleConfirm}
      />
    </div>
  )
}

function MetricsTab() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminMetrics()
      .then(setMetrics)
      .catch(() => toast.error("Error al cargar métricas"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!metrics) return null

  const cards = [
    {
      label: "Usuarios totales",
      value: metrics.totalUsers,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Usuarios bloqueados",
      value: metrics.bannedUsers,
      icon: Ban,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      label: "Sesiones activas",
      value: metrics.activeSessions,
      icon: FileText,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Publicaciones totales",
      value: metrics.totalListings,
      icon: LayoutGrid,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Publicaciones bloqueadas",
      value: metrics.blockedListings,
      icon: AlertTriangle,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <div className={`flex size-10 items-center justify-center rounded-lg ${card.bg}`}>
              <card.icon className={`size-5 ${card.color}`} />
            </div>
          </div>
          <p className="mt-2 font-heading text-3xl font-bold">
            {card.value.toLocaleString("es-CO")}
          </p>
        </div>
      ))}
    </div>
  )
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  variant = "default",
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  variant?: "default" | "destructive"
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {variant === "destructive" && (
              <AlertTriangle className="size-5 text-destructive" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case "ACTIVE":
      return "success" as const
    case "BLOCKED":
      return "destructive" as const
    case "REMOVED":
      return "destructive" as const
    case "PAUSED":
      return "warning" as const
    case "SOLD":
      return "secondary" as const
    default:
      return "secondary" as const
  }
}
