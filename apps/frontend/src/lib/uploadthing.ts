import { generateReactHelpers } from "@uploadthing/react"
import { apiRoutes } from "@/lib/api"

export const { useUploadThing } = generateReactHelpers({
  url: apiRoutes.media.upload,
})

export async function deleteImageFiles(keys: string[]) {
  if (!keys.length) return { success: true }

  const response = await fetch(apiRoutes.media.delete, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ keys }),
  })

  if (!response.ok) {
    console.error("[uploadthing] delete failed", response.status)
    return { success: false }
  }

  return response.json()
}
