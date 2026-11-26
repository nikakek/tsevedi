import "server-only";
import { getDriverForUser } from "./drivers";
import { getCurrentUser } from "./session";

/** Who is looking at a driver page: signed out, a user without a driver profile, or a driver. */
export async function getDriverContext() {
  const user = await getCurrentUser();
  if (!user) return { user: null, driver: null } as const;
  return { user, driver: await getDriverForUser(user.id) } as const;
}
