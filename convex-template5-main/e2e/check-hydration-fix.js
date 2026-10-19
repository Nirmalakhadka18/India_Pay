const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage();
  let hydrationLog = null;
  page.on("console", (msg) => {
    if (msg.text().toLowerCase().includes("hydration")) {
      hydrationLog = msg.text();
      console.log("HYDRATION LOG:", msg.text());
    }
  });
  page.on("pageerror", (err) => {
    console.log("PAGE ERROR:", err.message);
  });

  console.log("Navigating to login...");
  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2000);

  console.log("Signing in as Admin...");
  await page.fill('input[type="email"]', "admin@indiapaypayroll.com");
  await page.fill('input[type="password"]', "AdminTest@2026!");
  await page.waitForTimeout(500);
  await page.locator('button:has-text("Sign in")').first().click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });
  await page.waitForTimeout(4000);

  const errorDialog = await page.$("nextjs-portal");
  console.log("On Dashboard URL:", page.url());
  console.log("NextJS error overlay present on dashboard:", !!errorDialog);
  console.log("Hydration error detected on dashboard:", hydrationLog);

  await page.screenshot({ path: "e2e/screenshots/live_dashboard_no_error.png" });
  await browser.close();
})();
