// Temp check: grouped sidebar rendering (desktop / collapsed / mobile drawer)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
mkdirSync("qa-shots", { recursive: true });
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(60000);

await page.goto(`${BASE}/login`);
await page.fill('input[type="email"]', "owner@agency.test");
await page.fill('input[type="password"]', "dev-bootstrap-2026");
await page.click('form button[type="submit"]');
await page.waitForURL((u) => !u.pathname.includes("login"));
await page.waitForLoadState("domcontentloaded");
await page.waitForTimeout(1200);
await page.screenshot({ path: "qa-shots/nav-desktop.png", caret: "initial" });

// collapsed
await page.click('button[aria-label="Sembunyikan sidebar"]');
await page.waitForTimeout(400);
await page.screenshot({ path: "qa-shots/nav-collapsed.png", caret: "initial" });
await page.click('button[aria-label="Tampilkan sidebar"]');

// mobile drawer
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
await page.click('button[aria-label="Buka menu"]');
await page.waitForTimeout(400);
await page.screenshot({ path: "qa-shots/nav-mobile-drawer.png", caret: "initial" });

await browser.close();
console.log("done");
