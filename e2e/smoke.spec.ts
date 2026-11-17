import { expect, test } from "@playwright/test";

const OWNER_EMAIL = "owner@agency.test";
const OWNER_PASSWORD = "localdev-owner-pass-1";

test("landing page exposes a usable login path", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Agency OS|TikTok Shop/i);
  await expect(
    page.getByRole("link", { name: /login|masuk/i }).first(),
  ).toBeVisible();
});

// The search command lives in the authenticated shell topbar, so exercise it
// through the real app flow: log in with the existing synthetic owner in this
// test's own browser context, then open and dismiss the palette.
test("authenticated user can open and dismiss search with Escape", async ({
  page,
}) => {
  await page.goto("/login");
  await page.fill("#email", OWNER_EMAIL);
  await page.fill("#password", OWNER_PASSWORD);
  await page.click("#submitBtn");
  await page.waitForURL((u) => u.pathname.includes("/overview"));

  const trigger = page
    .getByRole("button", { name: /cari|search|command/i })
    .first();
  await expect(trigger).toBeVisible();
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: /pencarian/i });
  await expect(dialog).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
