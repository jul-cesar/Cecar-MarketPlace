import 'dotenv/config';
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js"; 

console.log('[auth] Initializing Better Auth with:', {
    database: 'pg',
    basePath: '/auth',
    googleClientId: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING',
    betterAuthUrl: process.env.BETTER_AUTH_URL,
});

export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
        provider: "pg", 
        schema: schema,
    }),
    basePath: "/auth",
    trustedOrigins: [
        "http://localhost",
        "http://localhost:5173",
        "https://cecarhub.com",
        "https://www.cecarhub.com",
        process.env.FRONTEND_URL || "http://localhost",
    ].filter(Boolean),
    socialProviders: {
        google: { 
            clientId: process.env.GOOGLE_CLIENT_ID as string, 
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            redirectUri: "https://cecarhub.com/api/v1/identity/auth/callback/google",
        }, 
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