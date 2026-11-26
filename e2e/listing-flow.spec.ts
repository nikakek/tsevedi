import { expect, test, type Page } from "@playwright/test";
import { cleanupDrivers, db } from "./helpers";

/**
 * The core loop of the product: someone adds a route → the admin approves it after a phone call →
 * a traveller finds it by searching in any script → reports how the ride went.
 */
test.describe.configure({ mode: "serial" });

const PREFIX = "E2E Driver";
let driverName: string;
let phoneDigits: string;

test.beforeAll(async ({}, testInfo) => {
  driverName = `${PREFIX} ${testInfo.project.name} ${Date.now()}`;
  phoneDigits = `599${String(Date.now()).slice(-6)}`;
});

test.afterAll(async () => {
  await cleanupDrivers(driverName);
  await db.$disconnect();
});

async function pickPlace(page: Page, label: string, query: string, option: string) {
  const input = page.getByRole("combobox", { name: label, exact: true });
  await input.click();
  await input.fill(query);
  await page
    .getByRole("option", { name: new RegExp(option) })
    .first()
    .click();
}

test("a visitor can submit a route", async ({ page }) => {
  await page.goto("/en/add?from=tbilisi&to=oni");
  await expect(page.getByRole("combobox", { name: "Starts in" })).toHaveValue("Tbilisi");
  await expect(page.getByRole("combobox", { name: "Goes to" })).toHaveValue("Oni");

  await page.getByRole("button", { name: "Add a stop on the way" }).click();
  await pickPlace(page, "Stop 1", "ambro", "Ambrolauri");

  await page.getByLabel("Departure time").fill("09:00");
  await page.getByLabel("Where does it leave from?").fill("Didube bus station, platform 4");
  await page.getByLabel("Price per seat (₾)").fill("25");
  await page.getByLabel("Driver's name").fill(driverName);
  await page.getByLabel("Phone number").fill(phoneDigits);
  await page.getByLabel("WhatsApp").check();
  await page.getByRole("button", { name: "Submit route" }).click();

  await expect(page.getByRole("heading", { name: "Thank you!" })).toBeVisible();
  const listing = await db.listing.findFirst({
    where: { driver: { name: driverName } },
    include: { stops: true },
  });
  expect(listing?.status).toBe("PENDING");
  expect(listing?.stops).toHaveLength(3);
});

test("invalid submissions show translated field errors", async ({ page }) => {
  await page.goto("/ru/add");
  await page.getByRole("button", { name: "Отправить маршрут" }).click();
  await expect(page.getByText("Выберите, откуда и куда идёт маршрут")).toBeVisible();
  await expect(page.getByText("Введите правильный номер телефона")).toBeVisible();
});

test("the admin approves the route", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Wrong password.")).toBeVisible();

  await page.getByLabel("Password").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Tsevedi admin" })).toBeVisible();

  const card = page.getByRole("listitem").filter({ hasText: driverName });
  await expect(card).toContainText("Tbilisi → Ambrolauri → Oni");
  await card.getByRole("button", { name: /Approve/ }).click();
  await expect(page.getByRole("listitem").filter({ hasText: driverName })).toHaveCount(0);

  const listing = await db.listing.findFirst({ where: { driver: { name: driverName } } });
  expect(listing?.status).toBe("APPROVED");
  expect(listing?.lastConfirmedAt).not.toBeNull();
});

test("a traveller finds it by searching in Russian and Georgian", async ({ page }) => {
  await page.goto("/en");
  await pickPlace(page, "From", "тбилиси", "Tbilisi");
  await pickPlace(page, "To", "ამბრ", "Ambrolauri");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  await expect(page).toHaveURL(/\/en\/routes\/tbilisi\/ambrolauri$/);
  const card = page.getByRole("article").filter({ hasText: driverName });
  await expect(card).toContainText("09:00");
  await expect(card).toContainText("25₾");
  await expect(card).toContainText("Didube bus station, platform 4");
  await expect(card).toContainText("Confirmed today");
  await expect(card.getByRole("link", { name: "Call" })).toHaveAttribute(
    "href",
    `tel:+995${phoneDigits}`,
  );
  await expect(card.getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
    "href",
    new RegExp(`wa\\.me/995${phoneDigits}\\?text=`),
  );

  await card.getByRole("button", { name: "Georgian card" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("ამბროლაურში მინდა წასვლა.");
  await expect(dialog).toContainText("ფასი 25 ლარია, ასეა?");
  await dialog.getByRole("tab", { name: "Ask your host to call" }).click();
  await expect(dialog).toContainText("მივდივარ თბილისიდან ამბროლაურში.");
  await dialog.getByRole("button", { name: "Close" }).click();
});

test("stops along the way and the place page link to the listing", async ({ page }) => {
  await page.goto("/en/routes/ambrolauri/oni");
  await expect(page.getByRole("article").filter({ hasText: driverName })).toBeVisible();
  await page.goto("/en/routes/oni/tbilisi");
  await expect(page.getByRole("article").filter({ hasText: driverName })).toHaveCount(0);

  await page.goto("/en/places/ambrolauri");
  await expect(page.getByRole("link", { name: /Ambrolauri\s*Oni/ })).toBeVisible();
});

test("a traveller reports a ride and switches language", async ({ page }) => {
  await page.goto("/en/routes/tbilisi/oni");
  await page
    .getByRole("article")
    .filter({ hasText: driverName })
    .getByRole("link", { name: "Details" })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tbilisi → Oni");

  await page.getByRole("button", { name: "I took this ride" }).click();
  await page.getByLabel("Price paid (₾)").fill("25");
  await page.getByRole("button", { name: "Send report" }).click();
  await expect(page.getByText("Thank you! Your report helps the next traveller.")).toBeVisible();

  await page.locator("summary[aria-label=Language]").first().click();
  await page.getByRole("link", { name: "ქართული" }).first().click();
  await expect(page).toHaveURL(/\/ka\/listings\//);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("თბილისი → ონი");
});
