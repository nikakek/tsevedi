import "server-only";
import { headers } from "next/headers";
import { auth } from "./auth";
import { db } from "./db";

export type CurrentUser = { id: string; name: string; email: string; image: string | null };

/**
 * The signed-in, non-banned user for this request, or null.
 * Bans are re-checked against the database so they apply to existing sessions immediately.
 */
export async function getCurrentUser(requestHeaders?: Headers): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: requestHeaders ?? (await headers()) });
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, banned: true },
  });
  if (!user || user.banned) return null;
  return { id: user.id, name: user.name, email: user.email, image: user.image };
}
