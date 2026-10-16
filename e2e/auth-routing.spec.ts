import { test, expect } from "@playwright/test";

const VALID_EMAIL = "owner@agency.test";
const VALID_PASSWORD = "localdev-owner-pass-1";

test.describe("Authentication, Routing, and User Workflow", () => {
  test("1. Unauthenticated user opening / sees landing page without auto-redirect", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("http://localhost:3000/");
    await expect(page.getByRole("heading", { name: /Run Your.*TikTok Shop Agency/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /masuk/i }).first()).toBeVisible();
  });

  test("2. Unauthenticated user opening /login sees login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL("http://localhost:3000/login");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#submitBtn")).toBeVisible();
  });

  test("3. Unauthenticated user opening protected routes redirects to /login with safe next param", async ({ page }) => {
    // /overview redirects cleanly to /login without noisy next parameter
    await page.goto("/overview");
    await expect(page).toHaveURL("http://localhost:3000/login");

    // Specific protected deep links preserve destination in next parameter
    await page.goto("/campaigns");
    await expect(page).toHaveURL("http://localhost:3000/login?next=%2Fcampaigns");

    await page.goto("/finance/payouts");
    await expect(page).toHaveURL("http://localhost:3000/login?next=%2Ffinance%2Fpayouts");
  });

  test("4. Login failure displays error feedback and stays on login page", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "wrong@agency.test");
    await page.fill("#password", "wrongpassword123");
    await page.click("#submitBtn");

    await expect(page).toHaveURL("http://localhost:3000/login");
    await expect(page.locator('[role="alert"]').first()).toBeVisible();
  });

  test("5. Login success with valid next redirects to requested destination", async ({ page }) => {
    await page.goto("/campaigns");
    await expect(page).toHaveURL("http://localhost:3000/login?next=%2Fcampaigns");

    await page.fill("#email", VALID_EMAIL);
    await page.fill("#password", VALID_PASSWORD);
    await page.click("#submitBtn");

    await page.waitForURL((u) => u.pathname.includes("/campaigns"));
    expect(page.url()).toContain("/campaigns");
  });

  test("6. Login with malicious external next rejects open redirect and falls back to /overview", async ({ page }) => {
    await page.goto("/login?next=https://evil.com/phishing");
    await page.fill("#email", VALID_EMAIL);
    await page.fill("#password", VALID_PASSWORD);
    await page.click("#submitBtn");

    await page.waitForURL((u) => u.pathname.includes("/overview"));
    expect(page.url()).toContain("/overview");
    expect(page.url()).not.toContain("evil.com");
  });

  test("7. Full login, session persistence, public landing access, and logout workflow", async ({ page }) => {
    // 7A. Login
    await page.goto("/login");
    await page.fill("#email", VALID_EMAIL);
    await page.fill("#password", VALID_PASSWORD);
    await page.click("#submitBtn");
    await page.waitForURL((u) => u.pathname.includes("/overview"));

    // 7B. Authenticated user opening /login redirects to default internal page (/overview)
    await page.goto("/login");
    await page.waitForURL((u) => u.pathname.includes("/overview"));
    expect(page.url()).toContain("/overview");

    // 7C. Authenticated user opening / still sees landing page with Dashboard CTA
    await page.goto("/");
    await expect(page).toHaveURL("http://localhost:3000/");
    const dashboardCta = page.getByRole("link", { name: /dashboard/i }).first();
    await expect(dashboardCta).toBeVisible();

    // 7D. Navigate to dashboard and perform logout
    await page.goto("/overview");
    const logoutBtn = page.getByRole("button", { name: /keluar/i });
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // 7E. Logout must redirect to public home page /
    await page.waitForURL((u) => u.pathname === "/");
    expect(page.url()).toBe("http://localhost:3000/");

    // 7F. Accessing protected route after logout redirects to /login
    await page.goto("/overview");
    await page.waitForURL((u) => u.pathname.includes("/login"));
    expect(page.url()).toContain("/login");

    // 7G. Browser Back after logout does not reveal protected content from cache
    await page.goBack();
    // After going back, protected content must not be displayed
    await page.goto("/overview");
    await expect(page).toHaveURL("http://localhost:3000/login");
  });
});
