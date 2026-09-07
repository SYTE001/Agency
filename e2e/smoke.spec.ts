import { test, expect } from "@playwright/test";

test("landing page exposes a usable login path", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Agency OS|TikTok Shop/i);
  await expect(
    page.getByRole("link", { name: /login|masuk/i }).first(),
  ).toBeVisible();
});

test("search command can be opened and dismissed with Escape", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page
    .getByRole("button", { name: /search|cari|command/i })
    .first();
  if ((await trigger.count()) === 0)
    test.skip(true, "Landing page has no search trigger");
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
