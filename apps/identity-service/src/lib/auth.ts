import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js"; 

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", 
        schema: schema,
    }),
    basePath: "/auth",
    trustedOrigins: [
        process.env.FRONTEND_URL || "http://localhost:5173",
    ],
    emailAndPassword: { 
        enabled: true, 
    }, 
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "user",
            },
        },
    },
});