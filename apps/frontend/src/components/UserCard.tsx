import { useState } from "react"
import { useNavigate } from "react-router"
import { authClient } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface User {
  id: string
  name: string
  email: string
  image?: string | null
  emailVerified: boolean
  role?: string
  createdAt: Date
  updatedAt: Date
}

interface Session {
  id: string
  token: string
  expiresAt: Date
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: Date
  updatedAt: Date
}

interface UserCardProps {
  user: User
  session: Session
}

export function UserCard({ user, session }: UserCardProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await authClient.signOut()
    navigate("/login")
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-lg">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate">{user.name}</CardTitle>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Role</p>
              <p className="font-medium">{user.role || "user"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email verified</p>
              <p className="font-medium">{user.emailVerified ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">User ID</p>
              <p className="font-medium font-mono text-xs truncate">{user.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Session expires</p>
              <p className="font-medium text-xs">
                {new Date(session.expiresAt).toLocaleString()}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={handleLogout}
            disabled={loading}
          >
            {loading ? "Signing out..." : "Sign out"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
