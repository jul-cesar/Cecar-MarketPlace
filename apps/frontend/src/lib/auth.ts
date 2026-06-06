import { createAuthClient } from "better-auth/react";
import { apiRoutes } from "@/lib/api";

export const authClient = createAuthClient({
  baseURL: apiRoutes.auth,
  
  fetchOptions: {
    credentials: "include",
  },
  
});

export const { useSession } = authClient;
