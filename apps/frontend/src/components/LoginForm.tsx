
import { useState } from "react"
import { cn } from "@/lib/utils"
import { GraduationCap, ShieldCheck } from "lucide-react"
import { authClient } from "@/lib/auth"

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  )
}

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleGoogleSignIn() {
    setError("")
    setLoading(true)
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      })
    } catch (err: any) {
      setError(err?.message || "Error al iniciar sesión con Google")
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex w-full flex-col gap-6", className)} {...props}>
      <div className="group relative overflow-hidden rounded-3xl border bg-card/70 shadow-2xl shadow-primary/10 backdrop-blur-xl">
        {/* Glow accent en el borde superior */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <div className="grid md:grid-cols-2">
          {/* Panel del formulario */}
          <div className="flex flex-col justify-center gap-8 p-8 md:p-10">
            <div className="animate-rise flex flex-col items-start gap-4" style={{ animationDelay: "60ms" }}>
            
              <h1 className="text-pretty text-3xl font-bold tracking-tight text-foreground">
                Bienvenido de nuevo
              </h1>
              <p className="text-pretty leading-relaxed text-muted-foreground">
                Ingresa con tu cuenta institucional de Google para comprar, vender e intercambiar
                dentro de la comunidad CECAR.
              </p>
            </div>

            {error && (
              <div className="animate-rise rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="animate-rise flex flex-col gap-5" style={{ animationDelay: "160ms" }}>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className={cn(
                  "group/btn relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-border bg-card px-5 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-300",
                  "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/15",
                  "active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-80",
                )}
              >
                {/* Brillo deslizante */}
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/10 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
                {loading ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    Redirigiendo a Google...
                  </>
                ) : (
                  <>
                    <GoogleIcon className="size-5 transition-transform duration-300 group-hover/btn:scale-110" />
                    Continuar con Google
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0 text-primary" />
                Solo se permiten correos institucionales{" "}
                <span className="font-medium text-foreground">@cecar.edu.co</span>
              </div>
            </div>
          </div>

          {/* Panel visual */}
          <div className="relative hidden min-h-[28rem] overflow-hidden md:block">
            <img
              src="/logoimg.png"
              alt="Estudiantes en el campus de CECAR"
              className="absolute inset-0 h-full w-full scale-105 object-fill transition-transform duration-[1.4s] ease-out group-hover:scale-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/20 to-transparent mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/30 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-2 p-8 text-primary-foreground">
              <GraduationCap className="size-7 drop-shadow" />
              <p className="text-balance text-lg font-semibold leading-snug drop-shadow">
                Conecta con tu comunidad universitaria
              </p>
              <p className="text-pretty text-sm text-primary-foreground/80">
                Productos, servicios y oportunidades para los estudiantes CECAR.
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="animate-rise px-6 text-center text-xs leading-relaxed text-muted-foreground" style={{ animationDelay: "260ms" }}>
        Al continuar aceptas las{" "}
        <a href="#" className="font-medium text-primary underline-offset-4 hover:underline">
          normas de uso
        </a>{" "}
        del Marketplace CECAR.
      </p>
    </div>
  )
}
