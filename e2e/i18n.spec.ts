import { expect, test } from "@playwright/test";

test("the root URL redirects based on the browser language", async ({ browser }) => {
  for (const [browserLocale, locale] of [
    ["ka-GE", "ka"],
    ["ru-RU", "ru"],
    ["de-DE", "en"],
  ] as const) {
    const context = await browser.newContext({ locale: browserLocale });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page).toHaveURL(new RegExp(`/${locale}$`));
    await expect(page.locator("html")).toHaveAttribute("lang", locale === "ka" ? "ka-GE" : locale);
    await context.close();
  }
});

test("unknown routes and places show a not-found page", async ({ page }) => {
  await page.goto("/en/routes/tbilisi/atlantis");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

test("dark mode survives switching language and reloading", async ({ page }) => {
  await page.goto("/en/places/ambrolauri");
  const html = page.locator("html");
  await page.getByRole("button", { name: /dark mode/i }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");

  await page.locator("summary[aria-label=Language]:visible").first().click();
  await page.getByRole("link", { name: "ქართული" }).first().click();
  await expect(page).toHaveURL(/\/ka\/places\/ambrolauri$/);
  await expect(html).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "ღია რეჟიმზე გადართვა" }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
});
