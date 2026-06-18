import * as React from "react"
import { useNavigate } from "react-router"

import { authClient } from "@/lib/auth"

const INSTITUTIONAL_DOMAIN = "@cecar.edu.co"

export function isInstitutionalEmail(email?: string | null) {
  return typeof email === "string" && email.endsWith(INSTITUTIONAL_DOMAIN)
}

export function getInstitutionalAccessMessage() {
  return "Solo estudiantes de CECAR con correo institucional @cecar.edu.co pueden ingresar."
}

export function useInstitutionalSessionGuard(
  data: { user?: { email?: string | null; role?: string | null } } | null | undefined,
  isPending: boolean,
) {
  const navigate = useNavigate()
  const [isBlocking, setIsBlocking] = React.useState(false)

  React.useEffect(() => {
    if (isPending || !data?.user || isInstitutionalEmail(data.user.email)) {
      return
    }

    let cancelled = false
    setIsBlocking(true)

    authClient
      .signOut()
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          navigate("/login?error=cecar_email_required", { replace: true })
        }
      })

    return () => {
      cancelled = true
    }
  }, [data, isPending, navigate])

  return {
    isBlocking,
    isInstitutionalUser: !!data?.user && isInstitutionalEmail(data.user.email),
  }
}
