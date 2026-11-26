import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

export const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** Removes drivers (and their listings, via cascade) whose name starts with the given prefix. */
export async function cleanupDrivers(namePrefix: string) {
  await db.driver.deleteMany({ where: { name: { startsWith: namePrefix } } });
}
