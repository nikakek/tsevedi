import "dotenv/config";
import { expect, type Page } from "@playwright/test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

export const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** Removes drivers (and their listings, via cascade) whose name starts with the given prefix. */
export async function cleanupDrivers(namePrefix: string) {
  await db.driver.deleteMany({ where: { name: { startsWith: namePrefix } } });
}

/** Removes test users (sessions and saved items cascade). */
export async function cleanupUsers(emailPrefix: string) {
  await db.user.deleteMany({ where: { email: { startsWith: emailPrefix } } });
}

/**
 * Signs in through the test-only email login (ENABLE_TEST_AUTH=1), creating the account if needed.
 * Real users use Google or Facebook, which can't be automated.
 */
export async function signIn(page: Page, email: string, next = "/en/account") {
  await page.goto(`/en/signin?next=${encodeURIComponent(next)}`);
  // Next.js keeps recently visited pages mounted but hidden, so target visible elements only.
  const field = (label: string) =>
    page.getByLabel(label, { exact: true }).filter({ visible: true });
  await field("Name").fill(email.split("@")[0]);
  await field("Email").fill(email);
  await field("Password").fill("e2e-password-123");
  await page
    .getByRole("button", { name: "Sign in", exact: true })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL(new RegExp(next.replace(/[?]/g, "\\?")));
}

export async function adminSignIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Password").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Tsevedi admin" })).toBeVisible();
}

export function uniqueEmail(prefix: string, project: string) {
  return `${prefix}${project}-${Date.now()}@example.com`;
}
