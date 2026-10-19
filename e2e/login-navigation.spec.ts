import { test, expect } from "@playwright/test";

test.describe("Login navigation and overlay lifecycle", () => {
  test("Desktop: navigates from landing to /login with smooth brand reveal and clean state", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const loginLink = page.getByRole("link", { name: "Masuk", exact: true });
    await expect(loginLink).toBeVisible();

    await loginLink.click();
    await page.waitForURL("**/login");

    // Login form elements must be visible and interactive
    const emailInput = page.locator("#email");
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(emailInput).toBeEnabled();

    // After reveal phase finishes (340ms), overlay should be completely removed from DOM
    await page.waitForTimeout(450);
    const overlay = page.locator(".login-transition-root");
    await expect(overlay).toHaveCount(0);

    // Body and HTML classes must be clean
    const bodyClass = await page.locator("body").getAttribute("class");
    expect(bodyClass).not.toContain("login-nav-in-flight");
    expect(bodyClass).not.toContain("splash-active");

    const htmlClass = await page.locator("html").getAttribute("class");
    expect(htmlClass).not.toContain("splash-active");

    // Splash should NOT appear when coming from transition
    const splash = page.locator(".login-splash");
    await expect(splash).toHaveCount(0);
  });

  test("Mobile: navigates from drawer to /login without blank screen or stuck transition", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    // Open mobile hamburger menu
    const burger = page.locator(".burger");
    await expect(burger).toBeVisible();
    await burger.click();

    const mobileLoginLink = page.locator("#mainNav").getByRole("link", { name: /masuk/i });
    await expect(mobileLoginLink).toBeVisible();

    await mobileLoginLink.click();
    await page.waitForURL("**/login");

    // Check login form appears and is functional
    const emailInput = page.locator("#email");
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(emailInput).toBeEnabled();

    // Form card must be fully visible and opaque
    const card = page.locator(".card");
    await expect(card).toBeVisible();

    // After transition completes, overlay must be removed
    await page.waitForTimeout(450);
    const overlay = page.locator(".login-transition-root");
    await expect(overlay).toHaveCount(0);

    // Classes clean
    const bodyClass = await page.locator("body").getAttribute("class");
    expect(bodyClass).not.toContain("login-nav-in-flight");
    expect(bodyClass).not.toContain("splash-active");

    // Splash must not mount
    const splash = page.locator(".login-splash");
    await expect(splash).toHaveCount(0);
  });

  test("Mobile: navigates from Hero CTA to /login cleanly", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const heroCta = page.locator("#hero").getByRole("link", { name: /masuk ke workspace/i });
    await expect(heroCta).toBeVisible();
    await heroCta.click();

    await page.waitForURL("**/login");

    const emailInput = page.locator("#email");
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(emailInput).toBeEnabled();

    await page.waitForTimeout(450);
    await expect(page.locator(".login-transition-root")).toHaveCount(0);
    await expect(page.locator(".login-splash")).toHaveCount(0);
  });

  test("Repeated navigation: Landing -> /login -> Back -> Landing -> /login", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    // 1st navigation via navbar drawer
    const burger = page.locator(".burger");
    await burger.click();
    const link1 = page.locator("#mainNav").getByRole("link", { name: /masuk/i });
    await link1.click();
    await page.waitForURL("**/login");
    await expect(page.locator("#email")).toBeVisible();
    await page.waitForTimeout(450);

    // Back to landing page
    await page.goBack();
    await page.waitForURL("**/");

    // Verify clean body and landing page interactive
    const bodyClass = await page.locator("body").getAttribute("class");
    expect(bodyClass).not.toContain("login-nav-in-flight");
    expect(bodyClass).not.toContain("splash-active");

    // 2nd navigation via Hero CTA
    const heroCta = page.locator("#hero").getByRole("link", { name: /masuk ke workspace/i });
    await expect(heroCta).toBeVisible();
    await heroCta.click();
    await page.waitForURL("**/login");

    // Verify form interactive and overlay unmounted
    await expect(page.locator("#email")).toBeVisible();
    await page.waitForTimeout(450);
    await expect(page.locator(".login-transition-root")).toHaveCount(0);
    await expect(page.locator(".login-splash")).toHaveCount(0);
  });

  test("Accessibility: prefers-reduced-motion bypasses overlay and splash", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const heroCta = page.locator("#hero").getByRole("link", { name: /masuk ke workspace/i });
    await heroCta.click();
    await page.waitForURL("**/login");

    // Immediate form visibility
    const emailInput = page.locator("#email");
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toBeEnabled();

    // No overlay or splash
    await expect(page.locator(".login-transition-root")).toHaveCount(0);
    await expect(page.locator(".login-splash")).toHaveCount(0);

    const bodyClass = await page.locator("body").getAttribute("class");
    expect(bodyClass).not.toContain("login-nav-in-flight");
    expect(bodyClass).not.toContain("splash-active");
  });

  test("Cold direct visit to /login shows normal splash and reveals form", async ({
    page,
  }) => {
    await page.goto("/login");

    // Direct cold visit mounts splash
    const splash = page.locator(".login-splash");
    await expect(splash).toBeVisible({ timeout: 2000 });

    // After splash completes (~1.6s), form is visible
    const emailInput = page.locator("#email");
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(emailInput).toBeEnabled();
  });
});
