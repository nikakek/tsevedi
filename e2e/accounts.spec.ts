import { expect, test } from "@playwright/test";
import { adminSignIn, cleanupDrivers, cleanupUsers, db, signIn, uniqueEmail } from "./helpers";

/**
 * Accounts: a driver registers and, once approved, publishes routes directly; travellers save
 * drivers and trips; the admin can ban accounts.
 */
test.describe.configure({ mode: "serial" });

const NAME_PREFIX = "E2E Account Driver";
let driverName: string;
let driverEmail: string;
let travellerEmail: string;
let phone: string;

test.beforeAll(async ({}, testInfo) => {
  const p = testInfo.project.name;
  driverName = `${NAME_PREFIX} ${p} ${Date.now()}`;
  driverEmail = uniqueEmail("e2e-driver-", p);
  travellerEmail = uniqueEmail("e2e-traveller-", p);
  phone = `598${String(Date.now()).slice(-6)}`;
});

test.afterAll(async () => {
  await cleanupDrivers(driverName);
  await cleanupUsers(driverEmail);
  await cleanupUsers(travellerEmail);
  await db.$disconnect();
});

test("a driver registers and waits for approval", async ({ page }) => {
  await signIn(page, driverEmail, "/en/driver");
  await expect(page).toHaveURL(/\/en\/driver\/register$/);
  const main = page.getByRole("main").filter({ visible: true });
  await main.getByLabel("Driver's name").fill(driverName);
  await main.getByLabel("Phone number").fill(phone);
  await main.getByLabel("WhatsApp").check();
  await page.getByRole("button", { name: "Send registration" }).click();
  await expect(page.getByRole("heading", { name: "Registration received" })).toBeVisible();

  const driver = await db.driver.findFirst({
    where: { name: driverName },
    include: { user: true },
  });
  expect(driver?.status).toBe("PENDING");
  expect(driver?.user?.email).toBe(driverEmail);
});

test("the admin approves the driver account", async ({ page }) => {
  await adminSignIn(page);
  await page.goto("/admin?tab=drivers");
  const card = page.getByRole("listitem").filter({ hasText: driverName });
  await card.getByRole("button", { name: /Approve/ }).click();
  await expect(page.getByRole("listitem").filter({ hasText: driverName })).toContainText("routes");
  expect((await db.driver.findFirst({ where: { name: driverName } }))?.status).toBe("APPROVED");
});

test("an approved driver publishes, edits and removes a route", async ({ page }) => {
  await signIn(page, driverEmail, "/en/driver");
  await page.getByRole("main").getByRole("link", { name: "Add a route" }).click();
  await expect(page).toHaveURL(/\/en\/driver\/routes\/new$/);

  const pick = async (label: string, query: string, option: string) => {
    const input = page.getByRole("combobox", { name: label, exact: true });
    await input.click();
    await input.fill(query);
    await page
      .getByRole("option", { name: new RegExp(option) })
      .first()
      .click();
  };
  await pick("Starts in", "kutais", "Kutaisi");
  await pick("Goes to", "lentekh", "Lentekhi");
  await page.getByLabel("Departure time").fill("08:15");
  await page.getByLabel("Where does it leave from?").fill("Kutaisi central bus station");
  await page.getByLabel("Price per seat (₾)").fill("15");
  await page.getByRole("button", { name: "Add a route" }).click();
  await expect(page).toHaveURL(/\/en\/driver$/);

  // Published immediately, no admin review.
  await page.goto("/en/routes/kutaisi/lentekhi");
  const card = page.getByRole("article").filter({ hasText: driverName });
  await expect(card).toContainText("15₾");
  await expect(card).toContainText("Confirmed today");

  await page.goto("/en/driver");
  const row = page.getByRole("listitem").filter({ hasText: "Kutaisi → Lentekhi" });
  await row.getByRole("link", { name: "Edit" }).click();
  await expect(page.getByLabel("Price per seat (₾)")).toHaveValue("15");
  await page.getByLabel("Price per seat (₾)").fill("18");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/\/en\/driver$/);
  await page.goto("/en/routes/kutaisi/lentekhi");
  await expect(page.getByRole("article").filter({ hasText: driverName })).toContainText("18₾");

  await page.goto("/en/driver");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("listitem")
    .filter({ hasText: "Kutaisi → Lentekhi" })
    .getByRole("button", { name: "Remove" })
    .click();
  await expect(page.getByText("You haven't added any routes yet.")).toBeVisible();
});

test("a traveller saves a driver and a trip to their profile", async ({ page }) => {
  // The driver publishes a route through their own form (which also refreshes cached pages).
  await signIn(page, driverEmail, "/en/driver/routes/new");
  for (const [label, query, option] of [
    ["Starts in", "tbilis", "Tbilisi"],
    ["Goes to", "oni", "Oni"],
  ] as const) {
    const input = page.getByRole("combobox", { name: label, exact: true });
    await input.click();
    await input.fill(query);
    await page
      .getByRole("option", { name: new RegExp(`^${option}`) })
      .first()
      .click();
  }
  await page.getByLabel("Departure time").fill("09:00");
  await page.getByLabel("Where does it leave from?").fill("Didube");
  await page.getByRole("button", { name: "Add a route" }).click();
  await expect(page).toHaveURL(/\/en\/driver$/);
  const driver = await db.driver.findFirstOrThrow({ where: { name: driverName } });
  const listing = await db.listing.findFirstOrThrow({
    where: { driverId: driver.id, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  });
  await page.context().clearCookies();

  // Signed out: the heart leads to sign-in and back to the listing.
  await page.goto(`/en/listings/${listing.id}`);
  await page.getByRole("link", { name: "Save trip" }).click();
  await expect(page).toHaveURL(/\/en\/signin\?next=/);

  await signIn(page, travellerEmail, `/en/listings/${listing.id}`);
  await page.getByRole("button", { name: "Save trip" }).click();
  await expect(page.getByRole("button", { name: "Trip saved" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Save driver" }).click();
  await expect(page.getByRole("button", { name: "Driver saved" })).toBeVisible();

  await page.goto("/en/account");
  const trips = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Saved trips" }) });
  await expect(trips.getByRole("article").filter({ hasText: driverName })).toBeVisible();
  const drivers = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Saved drivers" }) });
  await expect(drivers).toContainText(driverName);
  await expect(drivers).toContainText("Tbilisi → Oni");

  // Unsave from the profile.
  await trips.getByRole("button", { name: "Trip saved" }).click();
  await page.reload();
  await expect(
    page.getByText("Tap ♡ on a trip to save it here.").filter({ visible: true }),
  ).toBeVisible();
});

test("a banned user is signed out and can't contribute", async ({ page, browser }) => {
  await signIn(page, travellerEmail, "/en/account");

  const admin = await browser.newPage();
  await adminSignIn(admin);
  await admin.goto(`/admin?tab=users&q=${encodeURIComponent(travellerEmail)}`);
  await admin
    .getByRole("listitem")
    .filter({ hasText: travellerEmail })
    .getByRole("button", { name: "Ban" })
    .click();
  await expect(admin.getByRole("listitem").filter({ hasText: travellerEmail })).toContainText(
    "banned",
  );
  await admin.close();

  await page.goto("/en/add");
  await expect(page.getByRole("heading", { name: "Sign in to continue" })).toBeVisible();
  // Signing in again is refused.
  await page.goto("/en/signin");
  await page.getByLabel("Email", { exact: true }).filter({ visible: true }).fill(travellerEmail);
  await page
    .getByLabel("Password", { exact: true })
    .filter({ visible: true })
    .fill("e2e-password-123");
  await page
    .getByRole("button", { name: "Sign in", exact: true })
    .filter({ visible: true })
    .click();
  await expect(
    page.getByText("Sign-in failed. Please try again.").filter({ visible: true }),
  ).toBeVisible();
});
