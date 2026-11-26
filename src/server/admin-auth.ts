import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export const ADMIN_COOKIE = "tsevedi_admin";
const SESSION_DAYS = 7;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32)
    throw new Error("SESSION_SECRET must be set to at least 32 characters");
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  // Hash first so inputs of different lengths can still be compared in constant time.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Token format: "<expiry ms>.<HMAC of expiry>". Stateless; rotating SESSION_SECRET logs everyone out. */
export function createSessionToken(now = Date.now()) {
  const expires = String(now + SESSION_DAYS * 24 * 60 * 60 * 1000);
  return { token: `${expires}.${sign(expires)}`, expires: new Date(Number(expires)) };
}

export function verifySessionToken(token: string | undefined, now = Date.now()): boolean {
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || !/^\d+$/.test(expires)) return false;
  return safeEqual(signature, sign(expires)) && Number(expires) > now;
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(input, expected);
}

export async function isAdmin() {
  // Session checks are per request by nature; never let them run during prerendering.
  await connection();
  return verifySessionToken((await cookies()).get(ADMIN_COOKIE)?.value);
}

/** Call at the top of every admin page and server action: server actions are public endpoints. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
