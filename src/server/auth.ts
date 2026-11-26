import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { bearer } from "better-auth/plugins/bearer";
import { SITE_URL } from "@/lib/paths";
import { db } from "./db";

/** Social providers are enabled only when their keys are configured, so local dev works without them. */
function socialProviders() {
  const providers: Record<string, { clientId: string; clientSecret: string }> = {};
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }
  if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    providers.facebook = {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    };
  }
  return providers;
}

export const enabledProviders = Object.keys(socialProviders()) as Array<"google" | "facebook">;

/**
 * Email + password exists only for automated tests (ENABLE_TEST_AUTH=1). Real users sign in with
 * Google or Facebook. Never set that variable in production.
 */
export const testAuthEnabled = process.env.ENABLE_TEST_AUTH === "1";

export const auth = betterAuth({
  appName: "Tsevedi",
  database: prismaAdapter(db, { provider: "postgresql" }),
  // Reuses SESSION_SECRET / NEXT_PUBLIC_SITE_URL so deployments don't need extra variables.
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.SESSION_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? SITE_URL,
  socialProviders: socialProviders(),
  emailAndPassword: { enabled: testAuthEnabled, autoSignIn: true },
  // Built-in sign-in rate limits; turned off only for automated tests.
  rateLimit: { enabled: process.env.DISABLE_RATE_LIMIT !== "1" },
  account: {
    // Signing in with Google and later Facebook (same email) lands in the same account.
    accountLinking: { enabled: true, trustedProviders: ["google", "facebook"] },
  },
  user: {
    additionalFields: {
      banned: { type: "boolean", input: false, defaultValue: false, returned: true },
    },
    deleteUser: { enabled: true },
  },
  databaseHooks: {
    session: {
      create: {
        // Banned accounts can't start new sessions.
        before: async (session) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { banned: true },
          });
          if (user?.banned)
            throw new APIError("FORBIDDEN", { message: "This account has been banned." });
        },
      },
    },
  },
  // bearer(): the upcoming mobile app sends "Authorization: Bearer <token>" instead of cookies.
  // nextCookies() must stay last so server actions can set auth cookies.
  plugins: [bearer(), nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
