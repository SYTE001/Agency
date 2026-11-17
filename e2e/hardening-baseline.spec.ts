import { expect, test } from "@playwright/test";
import { HARDENING_IDS } from "../tests/fixtures/hardening";

const widths = [390, 768, 1440];

for (const width of widths) {
  test(`capture ten baseline routes at ${width}px`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width, height: 960 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto("/login");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator(".login-splash")).toHaveCount(0);
    await page.screenshot({
      path: testInfo.outputPath("login.png"),
      fullPage: true,
      caret: "initial",
    });
    await page.locator("#email").fill("owner@agency.test");
    await page.locator("#password").fill("localdev-owner-pass-1");
    await page.locator("#password").press("Enter");
    await expect(page).toHaveURL(/\/overview$/);

    const routes = [
      ["overview", "/overview", /Selamat/],
      ["creators", "/creators", "Creators"],
      ["brands", "/brands", "Brands"],
      ["content", "/content", "Content"],
      ["live-calendar", "/live/schedule", "Jadwal LIVE"],
      ["finance", "/finance", "Finance"],
      ["reports", "/reports", "Reports"],
      ["integrations", "/settings/integrations", "Integrasi"],
    ] as const;

    const keyboard: { route: string; focused: string | null }[] = [];
    for (const [name, href, heading] of routes) {
      await page.goto(href);
      await expect(
        page.getByRole("heading", { name: heading, level: 1 }),
      ).toBeVisible();
      await page.keyboard.press("Control+k");
      await expect(
        page.getByRole("dialog", { name: "Pencarian global" }),
      ).toBeVisible();
      await expect(
        page.getByRole("textbox", { name: "Cari global" }),
      ).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("dialog", { name: "Pencarian global" }),
      ).toHaveCount(0);
      await page.keyboard.press("Tab");
      keyboard.push({
        route: href,
        focused: await page.evaluate(
          () =>
            document.activeElement?.getAttribute("aria-label") ??
            document.activeElement?.textContent?.trim().slice(0, 100) ??
            null,
        ),
      });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: testInfo.outputPath(`${name}.png`),
        fullPage: true,
        caret: "initial",
      });
    }

    await page.goto(`/campaigns/${HARDENING_IDS.campaignA1}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Baseline|Hardening/,
    );
    await page.screenshot({
      path: testInfo.outputPath("campaign-detail.png"),
      fullPage: true,
      caret: "initial",
    });

    await testInfo.attach("keyboard-observations.json", {
      body: JSON.stringify(keyboard, null, 2),
      contentType: "application/json",
    });
    await testInfo.attach("console-errors.json", {
      body: JSON.stringify(errors, null, 2),
      contentType: "application/json",
    });
    expect(
      errors,
      "Application errors must be investigated, not suppressed",
    ).toEqual([]);
  });
}
