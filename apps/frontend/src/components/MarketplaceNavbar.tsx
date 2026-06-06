import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { LogOut, Plus, Sparkles, UserRound } from "lucide-react"
import { authClient } from "@/lib/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface MarketplaceUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string | null
}

interface MarketplaceNavbarProps {
  user: MarketplaceUser
}

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "Usuario"

  return source
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function MarketplaceNavbar({ user }: MarketplaceNavbarProps) {
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleSignOut() {
    setIsSigningOut(true)
    await authClient.signOut()
    navigate("/login", { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
            <Sparkles className="size-4" />
          </div>
          <div>
            <p className="font-heading text-base font-semibold tracking-tight">
              CECAR Market
            </p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Campus exchange club
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild className="h-10 rounded-full px-3 sm:px-4">
            <Link to="/publish">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Publicar</span>
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 gap-2 rounded-full pl-1.5 pr-3">
                <Avatar size="sm">
                  <AvatarImage src={user.image ?? undefined} alt={user.name ?? "Usuario"} />
                  <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-36 truncate sm:inline">
                  {user.name ?? "Mi cuenta"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-2">
              <DropdownMenuLabel className="px-2 py-2">
                <div className="flex items-center gap-3">
                  <Avatar size="lg">
                    <AvatarImage src={user.image ?? undefined} alt={user.name ?? "Usuario"} />
                    <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.name ?? "Usuario CECAR"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email ?? "Sin correo"}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 px-2 py-2">
                <UserRound className="size-4" />
                <span>Rol</span>
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {user.role ?? "user"}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                className="gap-2 px-2 py-2"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                <LogOut className="size-4" />
                {isSigningOut ? "Cerrando sesion..." : "Cerrar sesion"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
