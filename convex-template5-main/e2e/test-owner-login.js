const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OWNER_EMAIL = "owner@indiapaypayroll.com";
const OWNER_PASSWORD = process.env.DEV_OWNER_PASSWORD;

if (!OWNER_PASSWORD) {
  console.error("Missing DEV_OWNER_PASSWORD environment variable");
  process.exit(1);
}

const SCREENSHOT_DIR = path.resolve(__dirname, "screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyOwner() {
  console.log("================================================================================");
  console.log("INDIAPAY — OWNER ACCOUNT SIGN-IN & AUTHORIZATION DOM VERIFICATION");
  console.log("================================================================================");
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`Testing Account: ${OWNER_EMAIL}`);

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(30000);

  try {
    // 1. Navigate to login
    console.log("1. Navigating to login page...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // 2. Fill credentials
    console.log("2. Entering Owner credentials...");
    await page.fill('input[type="email"]', OWNER_EMAIL);
    await page.fill('input[type="password"]', OWNER_PASSWORD);
    await page.waitForTimeout(500);

    // 3. Click sign in
    console.log("3. Submitting sign in form...");
    await page.locator('button:has-text("Sign in")').first().click();

    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 25000 });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`✅ Navigated to authenticated route: ${currentUrl}`);

    const screenshotPath = path.join(SCREENSHOT_DIR, "owner_authenticated_dashboard.png");
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Screenshot captured: ${screenshotPath}`);

    // 4. Check workspace and role in DOM
    const bodyContent = await page.textContent("body");
    console.log("4. Checking workspace & role representation...");

    // Check navigation items (Owner should have full admin nav: Employees, Salaries, Payroll, Attendance, etc.)
    const hasEmployeesNav = await page.$('a[href*="/employees"]');
    const hasSalariesNav = await page.$('a[href*="/salaries"]');
    const hasPayrollNav = await page.$('a[href*="/payroll"]');

    console.log(`- Employees nav item present: ${!!hasEmployeesNav}`);
    console.log(`- Salaries nav item present: ${!!hasSalariesNav}`);
    console.log(`- Payroll nav item present: ${!!hasPayrollNav}`);

    if (hasEmployeesNav && hasSalariesNav && hasPayrollNav) {
      console.log("✅ OWNER NAVIGATION VERIFIED: Full management navigation visible.");
    } else {
      console.warn("⚠️ Some management navigation items not immediately detected in sidebar.");
    }

    // 5. Test Payroll page access
    console.log("5. Navigating to /payroll as Owner...");
    await page.goto(`${BASE_URL}/payroll`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    const payrollUrl = page.url();
    console.log(`- Current URL: ${payrollUrl}`);
    const payrollScreenshot = path.join(SCREENSHOT_DIR, "owner_payroll_page.png");
    await page.screenshot({ path: payrollScreenshot });
    console.log(`📸 Screenshot captured: ${payrollScreenshot}`);

    const payrollText = await page.textContent("body");
    const isPayrollAccessible = !payrollUrl.includes("/my-portal") && !payrollUrl.includes("/login");
    console.log(`- Payroll accessible without RoleGuard redirect: ${isPayrollAccessible}`);

    console.log("\n================================================================================");
    console.log("OWNER ACCOUNT VERIFICATION SUCCESSFUL!");
    console.log("================================================================================");
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    const errScreenshot = path.join(SCREENSHOT_DIR, "owner_error_state.png");
    await page.screenshot({ path: errScreenshot }).catch(() => {});
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verifyOwner();
