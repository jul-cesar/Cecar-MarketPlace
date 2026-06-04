import { useSession } from "@/lib/auth"
import { UserCard } from "@/components/UserCard"
import { Navigate } from "react-router"

export default function HomePage() {
  const { data, isPending } = useSession()

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!data?.user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-md">
        <UserCard user={data.user} session={data.session} />
      </div>
    </div>
  )
}
