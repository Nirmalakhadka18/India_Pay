const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve(__dirname, "screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function reproduceLogout() {
  console.log("=== REPRODUCING LOGOUT FLOW ===");
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleLogs = [];
  const errors = [];
  const networkFailures = [];

  page.on("console", (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === "error") {
      errors.push(`[CONSOLE ERROR] ${msg.text()}`);
      console.error(`🔴 Console Error: ${msg.text()}`);
    }
  });

  page.on("pageerror", (err) => {
    errors.push(`[PAGE ERROR] ${err.message}`);
    console.error(`💥 Page Error: ${err.message}\n${err.stack}`);
  });

  page.on("requestfailed", (req) => {
    networkFailures.push(`[FAILED REQ] ${req.method()} ${req.url()}: ${req.failure()?.errorText}`);
    console.warn(`⚠️ Request Failed: ${req.method()} ${req.url()}`);
  });

  try {
    console.log("1. Navigating to login page...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    console.log("2. Submitting Admin credentials...");
    await page.fill('input[type="email"]', "admin@indiapaypayroll.com");
    await page.fill('input[type="password"]', "AdminTest@2026!");
    await page.locator('button:has-text("Sign in")').first().click();

    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });
    await page.waitForTimeout(2500);

    console.log(`Authenticated at: ${page.url()}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "repro_01_authenticated.png") });

    // Inspect workspace dropdown
    const wsSelect = page.locator("select");
    const wsText = await wsSelect.innerText().catch(() => "not found");
    console.log(`Workspace dropdown before logout: ${wsText.trim()}`);

    // Inspect dashboard stats
    const statsCards = await page.locator("div.grid > div").allInnerTexts().catch(() => []);
    console.log(`Dashboard cards before logout:\n`, statsCards.join("\n---\n"));

    console.log("3. Clicking Log out button...");
    const logoutBtn = page.locator('button:has-text("Log out")').first();
    await logoutBtn.click();
    console.log("Clicked Log out button. Waiting 3 seconds to observe state...");
    await page.waitForTimeout(3000);

    console.log(`Current URL after clicking Logout: ${page.url()}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "repro_02_after_logout_click.png") });

    const wsTextAfter = await wsSelect.innerText().catch(() => "not found");
    console.log(`Workspace dropdown after logout: ${wsTextAfter.trim()}`);

    const statsCardsAfter = await page.locator("div.grid > div").allInnerTexts().catch(() => []);
    console.log(`Dashboard cards after logout:\n`, statsCardsAfter.join("\n---\n"));

    console.log("\n4. Checking if protected routes can still be loaded without auth...");
    await page.goto(`${BASE_URL}/payroll`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    console.log(`URL after navigating to /payroll: ${page.url()}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "repro_03_goto_payroll.png") });

    console.log("\n=== LOG SUMMARY ===");
    console.log(`Total Errors: ${errors.length}`);
    console.log(`Total Network Failures: ${networkFailures.length}`);
    if (errors.length > 0) {
      console.log("Errors logged:\n", errors.join("\n"));
    }
  } catch (err) {
    console.error("Test execution failure:", err);
  } finally {
    await browser.close();
  }
}

reproduceLogout();
