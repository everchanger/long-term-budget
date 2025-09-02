import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { db } from "../../db";
import {
  users,
  sessions,
  accounts,
  verifications,
  households,
} from "../../db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  baseURL:
    process.env.NODE_ENV === "production"
      ? process.env.AUTH_BASE_URL
      : "http://localhost:3000",
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Check if this is a successful sign-up
      if (ctx.path.startsWith("/sign-up")) {
        const newSession = ctx.context.newSession;
        if (newSession && newSession.user) {
          try {
            // Create a default household for the new user
            await db.insert(households).values({
              name: `${newSession.user.name}'s Household`,
              userId: newSession.user.id,
            });
            console.log(
              `Created default household for user: ${newSession.user.id}`
            );
          } catch (error) {
            console.error("Failed to create default household:", error);
            // Don't throw error as this would break user creation
          }
        }
      }
    }),
  },
});

export type Session = typeof auth.$Infer.Session;
