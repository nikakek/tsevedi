import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { fieldErrors } from "@/lib/validation";
import { clientIp, rateLimit } from "@/server/rate-limit";

/** Every response is either { data } or { error: { code, message, fields? } }. */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(status: number, code: string, message: string, fields?: Record<string, string>) {
  return NextResponse.json({ error: { code, message, ...(fields ? { fields } : {}) } }, { status });
}

export const notFound = (what: string) => fail(404, "not_found", `${what} not found`);

export function invalid(error: ZodError) {
  return fail(422, "validation_failed", "Some fields are invalid", fieldErrors(error));
}

export async function readJson(request: Request): Promise<unknown | undefined> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export function limited(request: Request, action: string, limit: number) {
  return !rateLimit(`api:${action}:${clientIp(request.headers)}`, limit, 60 * 60 * 1000);
}

export const tooMany = () => fail(429, "rate_limited", "Too many requests, try again later");
