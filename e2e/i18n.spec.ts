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
