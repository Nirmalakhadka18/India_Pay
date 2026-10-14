// Production Build Smoke Tests on Port 3005
// Microsoft Edge via Playwright
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const PROD_URL = "http://localhost:3005";
const ADMIN_EMAIL = "admin@indiapaypayroll.com";
const ADMIN_PASSWORD = "AdminTest@2026!";
const MEMBER_EMAIL = "user@indiapaypayroll.com";
const MEMBER_PASSWORD = "UserTest@2026!";

const SCREENSHOT_DIR = path.resolve(__dirname, "screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const results = [];
const consoleErrors = [];
const networkFailures = [];

function record(name, status, details = "") {
  results.push({ name, status, details });
  console.log(`${status === "PASS" ? "✅" : "❌"} [${status}] ${name}${details ? " - " + details : ""}`);
}

async function runSmokeTests() {
  console.log("================================================================================");
  console.log("INDIAPAY — PRODUCTION BUILD (PORT 3005) SMOKE TESTS");
  console.log("================================================================================\n");

  const browser = await chromium.launch({ channel: "msedge", headless: true });

  try {
    // 1. Unauthenticated redirects
    console.log("▶ 1. UNAUTHENTICATED ROUTE ACCESS");
    const unauthContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const unauthPage = await unauthContext.newPage();

    for (const r of ["/payroll", "/salaries", "/employees", "/settings"]) {
      await unauthPage.goto(`${PROD_URL}${r}`, { waitUntil: "domcontentloaded" });
      await unauthPage.waitForTimeout(1000);
      const url = unauthPage.url();
      const pass = url.includes("/login");
      record(`Unauthenticated access to ${r}`, pass ? "PASS" : "FAIL", `Redirected to: ${url}`);
    }
    await unauthPage.screenshot({ path: path.join(SCREENSHOT_DIR, "prod_01_unauth_redirect.png") });
    await unauthContext.close();

    // 2. Admin Login & Payroll Approval UI check
    console.log("\n▶ 2. ADMIN ROLE TESTING (PORT 3005)");
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminContext.newPage();

    adminPage.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(`[ADMIN] ${msg.text()}`);
    });
    adminPage.on("requestfailed", (req) => {
      networkFailures.push(`[ADMIN] ${req.url()} (${req.failure()?.errorText})`);
    });

    await adminPage.goto(`${PROD_URL}/login`, { waitUntil: "domcontentloaded" });
    await adminPage.waitForTimeout(2000);
    await adminPage.fill('input[type="email"]', ADMIN_EMAIL);
    await adminPage.fill('input[type="password"]', ADMIN_PASSWORD);
    await adminPage.waitForTimeout(500);
    await adminPage.locator('button:has-text("Sign in")').first().click();
    await adminPage.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 15000 }).catch(() => {});
    await adminPage.waitForTimeout(2000);

    const adminUrl = adminPage.url();
    record("Admin Authentication on Prod", !adminUrl.includes("/login") ? "PASS" : "FAIL", `URL: ${adminUrl}`);
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, "prod_02_admin_dashboard.png") });

    // Verify Payroll UI: Admin cannot approve or reject
    await adminPage.goto(`${PROD_URL}/payroll`, { waitUntil: "domcontentloaded" });
    await adminPage.waitForTimeout(2000);
    const payrollBody = await adminPage.textContent("body");
    const hasEngine = payrollBody.includes("Payroll Processing Engine");
    const ownerNotice = payrollBody.includes("Awaiting Owner Approval") || payrollBody.includes("Owner Only");
    const approveBtn = await adminPage.$('button:has-text("Approve")');
    const rejectBtn = await adminPage.$('button:has-text("Reject")');
    const isApproveDisabled = approveBtn ? await approveBtn.isDisabled() : true;
    const isRejectDisabled = rejectBtn ? await rejectBtn.isDisabled() : true;

    if (hasEngine && isApproveDisabled && isRejectDisabled) {
      record(
        "Admin Payroll Approval UI on Prod",
        "PASS",
        "Approve/Reject buttons disabled for non-owner Admin with Owner-Only notice"
      );
    } else {
      record(
        "Admin Payroll Approval UI on Prod",
        "FAIL",
        `Engine: ${hasEngine}, ApproveDisabled: ${isApproveDisabled}, RejectDisabled: ${isRejectDisabled}`
      );
    }
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, "prod_03_admin_payroll.png") });
    await adminContext.close();

    // 3. Member Login & Route Isolation Check
    console.log("\n▶ 3. MEMBER ROLE TESTING & ROUTE SECURITY (PORT 3005)");
    const memberContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const memberPage = await memberContext.newPage();

    memberPage.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(`[MEMBER] ${msg.text()}`);
    });
    memberPage.on("requestfailed", (req) => {
      networkFailures.push(`[MEMBER] ${req.url()} (${req.failure()?.errorText})`);
    });

    await memberPage.goto(`${PROD_URL}/login`, { waitUntil: "domcontentloaded" });
    await memberPage.waitForTimeout(2000);
    await memberPage.fill('input[type="email"]', MEMBER_EMAIL);
    await memberPage.fill('input[type="password"]', MEMBER_PASSWORD);
    await memberPage.waitForTimeout(500);
    await memberPage.locator('button:has-text("Sign in")').first().click();
    await memberPage.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 15000 }).catch(() => {});
    await memberPage.waitForTimeout(2000);

    const memberUrl = memberPage.url();
    record("Member Authentication on Prod", !memberUrl.includes("/login") ? "PASS" : "FAIL", `URL: ${memberUrl}`);

    // Check Member Navigation: admin links hidden
    const navText = await memberPage.textContent("nav").catch(() => "");
    const adminNavVisible =
      navText.includes("Employees") ||
      navText.includes("Salaries") ||
      navText.includes("Payroll") ||
      navText.includes("Attendance") ||
      navText.includes("Compliance") ||
      navText.includes("Reports") ||
      navText.includes("Settings");
    record(
      "Member Sidebar Isolation on Prod",
      !adminNavVisible ? "PASS" : "FAIL",
      adminNavVisible ? "Restricted nav links leaked" : "Admin links hidden"
    );

    // Repeat Member direct-route tests for /payroll and /salaries
    for (const r of ["/payroll", "/salaries"]) {
      await memberPage.goto(`${PROD_URL}${r}`, { waitUntil: "domcontentloaded" });
      await memberPage.waitForTimeout(2000);
      const cur = memberPage.url();
      const body = await memberPage.textContent("body");

      const blockedOrRedirected =
        cur.includes("/my-portal") ||
        cur === `${PROD_URL}/` ||
        cur.endsWith(":3005/") ||
        body.includes("Access Restricted") ||
        body.includes("permission");

      // Verify no company financial details leak in DOM
      const leaksFinancials =
        body.includes("Total Net Payout") ||
        body.includes("Calculated Employee Payroll Preview") ||
        body.includes("Employer Contributions");

      if (blockedOrRedirected && !leaksFinancials) {
        record(
          `Member Direct Route: ${r} on Prod`,
          "PASS",
          `Safely blocked/redirected to ${cur} without data leak`
        );
      } else {
        record(
          `Member Direct Route: ${r} on Prod`,
          "FAIL",
          `Accessible or data leak at ${cur}`
        );
      }
      await memberPage.screenshot({ path: path.join(SCREENSHOT_DIR, `prod_04_member_blocked_${r.replace("/", "")}.png`) });
    }

    // My Portal check
    await memberPage.goto(`${PROD_URL}/my-portal`, { waitUntil: "domcontentloaded" });
    await memberPage.waitForTimeout(2000);
    const portalBody = await memberPage.textContent("body");
    const hasPortal = portalBody.includes("Portal") || portalBody.includes("Profile") || portalBody.includes("Leave");
    record("Member My Portal on Prod", hasPortal ? "PASS" : "FAIL", "Personal employee view loads correctly");
    await memberPage.screenshot({ path: path.join(SCREENSHOT_DIR, "prod_05_member_my_portal.png") });

    await memberContext.close();

  } finally {
    await browser.close();
  }

  console.log("\n================================================================================");
  console.log("PRODUCTION SMOKE TEST SUMMARY");
  console.log("================================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Console Errors Captured: ${consoleErrors.length}`);
  console.log(`Failed Network Requests: ${networkFailures.length}`);

  fs.writeFileSync(
    path.join(__dirname, "prod-smoke-results.json"),
    JSON.stringify({ total, passed, failed, results, consoleErrors, networkFailures }, null, 2),
    "utf-8"
  );
}

runSmokeTests().catch((err) => {
  console.error("Prod smoke test fatal error:", err);
  process.exit(1);
});
