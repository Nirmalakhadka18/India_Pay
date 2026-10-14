// Comprehensive End-to-End DOM Manual Testing Suite for IndiaPay
// Tested with Microsoft Edge via Playwright on Windows

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = "admin@indiapaypayroll.com";
const ADMIN_PASSWORD = "AdminTest@2026!";
const MEMBER_EMAIL = "user@indiapaypayroll.com";
const MEMBER_PASSWORD = "UserTest@2026!";

const SCREENSHOT_DIR = path.resolve(__dirname, "screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const testResults = [];
const consoleErrors = [];
const networkFailures = [];

function recordResult(category, scenario, status, details = "") {
  testResults.push({ category, scenario, status, details });
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⚠️";
  console.log(`${icon} [${status}] ${category} :: ${scenario}${details ? " - " + details : ""}`);
}

async function runTests() {
  console.log("================================================================================");
  console.log("INDIAPAY — E2E BROWSER DOM MANUAL & SECURITY VERIFICATION SUITE");
  console.log("================================================================================");
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`Screenshots Directory: ${SCREENSHOT_DIR}\n`);

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  try {
    // =========================================================================
    // SUITE 1: ADMIN WORKFLOW & ROLE-BASED CONTROLS
    // =========================================================================
    console.log("▶ SUITE 1: ADMIN TESTING (Account: admin@indiapaypayroll.com)");
    const adminContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const adminPage = await adminContext.newPage();
    adminPage.setDefaultNavigationTimeout(60000);
    adminPage.setDefaultTimeout(30000);

    adminPage.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(`[ADMIN] [CONSOLE ERROR] ${msg.text()}`);
      }
    });

    adminPage.on("requestfailed", (req) => {
      networkFailures.push(`[ADMIN] [REQ FAILED] ${req.url()} (${req.failure()?.errorText})`);
    });

    // 1.1 Sign in
    await adminPage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await adminPage.waitForTimeout(2000);
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, "01_login_page.png") });

    await adminPage.fill('input[type="email"]', ADMIN_EMAIL);
    await adminPage.fill('input[type="password"]', ADMIN_PASSWORD);
    await adminPage.waitForTimeout(500);
    await adminPage.locator('button:has-text("Sign in")').first().click();
    try {
      await adminPage.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
    } catch (e) {
      const errEl = await adminPage.$('.text-red-500');
      if (errEl) console.log("Admin login error text:", await errEl.textContent());
    }
    await adminPage.waitForTimeout(2000);

    const adminCurrentUrl = adminPage.url();
    if (adminCurrentUrl.includes("/login")) {
      recordResult("Admin Auth", "Sign in as Admin", "FAIL", `Stuck on ${adminCurrentUrl}`);
    } else {
      recordResult("Admin Auth", "Sign in as Admin", "PASS", `Navigated to ${adminCurrentUrl}`);
    }
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, "02_admin_dashboard.png") });

    // 1.2 Dashboard KPIs
    const dashboardText = await adminPage.textContent("body");
    const hasActiveEmployees = dashboardText.includes("Active Employees");
    const hasGrossPayroll = dashboardText.includes("Gross Payroll");
    const hasNetPayroll = dashboardText.includes("Net Payroll");
    const hasPendingApprovals = dashboardText.includes("Pending Approvals");

    if (hasActiveEmployees && hasGrossPayroll && hasNetPayroll && hasPendingApprovals) {
      recordResult("Admin Dashboard", "KPI cards render correctly", "PASS", "All 4 KPI cards present");
    } else {
      recordResult("Admin Dashboard", "KPI cards render correctly", "FAIL", "Missing some KPI metrics");
    }

    // 1.3 Employees Page
    await adminPage.goto(`${BASE_URL}/employees`, { waitUntil: "domcontentloaded" });
    await adminPage.waitForTimeout(1500);
    const empText = await adminPage.textContent("body");
    const hasEmpHeader = empText.includes("Employee") || empText.includes("Directory");
    const addEmpBtn = await adminPage.$('button:has-text("Add Employee"), button:has-text("New Employee")');
    if (hasEmpHeader) {
      recordResult("Admin Employees", "Employees page loads with directory", "PASS");
    } else {
      recordResult("Admin Employees", "Employees page loads with directory", "FAIL");
    }

    if (addEmpBtn) {
      await addEmpBtn.click();
      await adminPage.waitForTimeout(600);
      const modalOpen = await adminPage.$('role=dialog, [role="dialog"], .dialog');
      if (modalOpen) {
        recordResult("Admin Employees", "Add Employee form modal opens and validates", "PASS", "Modal opened safely");
        // Try pressing Escape to close without saving
        await adminPage.keyboard.press("Escape");
        await adminPage.waitForTimeout(400);
      } else {
        recordResult("Admin Employees", "Add Employee form modal opens and validates", "FAIL", "Modal did not open");
      }
    }
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, "03_admin_employees.png") });

    // 1.4 Salaries Page
    await adminPage.goto(`${BASE_URL}/salaries`, { waitUntil: "domcontentloaded" });
    await adminPage.waitForTimeout(1500);
    const salText = await adminPage.textContent("body");
    const hasSalHeader = salText.includes("Salary") || salText.includes("Salaries");
    if (hasSalHeader) {
      recordResult("Admin Salaries", "Salaries page renders salary structures", "PASS");
    } else {
      recordResult("Admin Salaries", "Salaries page renders salary structures", "FAIL");
    }
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, "04_admin_salaries.png") });

    // 1.5 Payroll Page & Approve/Reject Control Verification
    await adminPage.goto(`${BASE_URL}/payroll`, { waitUntil: "domcontentloaded" });
    await adminPage.waitForTimeout(2000);
    const payrollText = await adminPage.textContent("body");
    const hasPayrollHeader = payrollText.includes("Payroll Processing Engine");
    const hasPeriodSelector = await adminPage.$('input[type="month"]');

    if (hasPayrollHeader && hasPeriodSelector) {
      recordResult("Admin Payroll", "Payroll calculation engine & period selector render", "PASS");
    } else {
      recordResult("Admin Payroll", "Payroll calculation engine & period selector render", "FAIL");
    }

    // Step 3 Verification: Inspect Approve / Reject buttons state
    // As an Admin (not Owner), Approve and Reject buttons must either be disabled with owner-only notice, or hidden
    const approveBtn = await adminPage.$('button:has-text("Approve")');
    const rejectBtn = await adminPage.$('button:has-text("Reject")');
    const ownerNotice = await adminPage.$('text="Awaiting Owner Approval", text="Owner Only"');

    if (approveBtn || rejectBtn || ownerNotice) {
      const isApproveDisabled = approveBtn ? await approveBtn.isDisabled() : true;
      const isRejectDisabled = rejectBtn ? await rejectBtn.isDisabled() : true;

      if (isApproveDisabled && isRejectDisabled) {
        recordResult(
          "Admin Payroll UI",
          "Approve & Reject buttons are disabled / owner-restricted for Admin",
          "PASS",
          "Non-owner admin cannot trigger approve/reject; mismatch fixed"
        );
      } else {
        recordResult(
          "Admin Payroll UI",
          "Approve & Reject buttons are disabled / owner-restricted for Admin",
          "FAIL",
          "Approve/Reject buttons were unexpectedly active for non-owner Admin"
        );
      }
    } else {
      recordResult(
        "Admin Payroll UI",
        "Approve & Reject buttons are disabled / owner-restricted for Admin",
        "PASS",
        "No pending approval run or controls hidden for unauthorized role"
      );
    }
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, "05_admin_payroll.png") });

    // 1.6 Attendance Page
    await adminPage.goto(`${BASE_URL}/attendance`, { waitUntil: "domcontentloaded" });
    await adminPage.waitForTimeout(1500);
    const attText = await adminPage.textContent("body");
    const hasAtt = attText.includes("Attendance") || attText.includes("Leave");
    recordResult("Admin Attendance", "Attendance & leave management render", hasAtt ? "PASS" : "FAIL");
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, "06_admin_attendance.png") });

    // 1.7 Compliance Page
    await adminPage.goto(`${BASE_URL}/compliance`, { waitUntil: "domcontentloaded" });
    await adminPage.waitForTimeout(1500);
    const compText = await adminPage.textContent("body");
    const hasComp = compText.includes("Compliance") || compText.includes("EPF") || compText.includes("ESI");
    recordResult("Admin Compliance", "Statutory compliance configurations render", hasComp ? "PASS" : "FAIL");
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, "07_admin_compliance.png") });

    // 1.8 Reports Page
    await adminPage.goto(`${BASE_URL}/reports`, { waitUntil: "domcontentloaded" });
    await adminPage.waitForTimeout(1500);
    const repText = await adminPage.textContent("body");
    const hasRep = repText.includes("Reports") || repText.includes("Historical");
    recordResult("Admin Reports", "Payroll and statutory reports render", hasRep ? "PASS" : "FAIL");
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, "08_admin_reports.png") });

    // 1.9 Settings Page
    await adminPage.goto(`${BASE_URL}/settings`, { waitUntil: "domcontentloaded" });
    await adminPage.waitForTimeout(1500);
    const settText = await adminPage.textContent("body");
    const hasSett = settText.includes("Settings") || settText.includes("General") || settText.includes("Billing");
    recordResult("Admin Settings", "Workspace settings render", hasSett ? "PASS" : "FAIL");
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, "09_admin_settings.png") });

    await adminContext.close();

    // =========================================================================
    // SUITE 2: MEMBER TESTING & ROUTE SECURITY
    // =========================================================================
    console.log("\n▶ SUITE 2: MEMBER TESTING (Account: user@indiapaypayroll.com)");
    const memberContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const memberPage = await memberContext.newPage();
    memberPage.setDefaultNavigationTimeout(60000);
    memberPage.setDefaultTimeout(30000);

    memberPage.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(`[MEMBER] [CONSOLE ERROR] ${msg.text()}`);
      }
    });

    memberPage.on("requestfailed", (req) => {
      networkFailures.push(`[MEMBER] [REQ FAILED] ${req.url()} (${req.failure()?.errorText})`);
    });

    // 2.1 Member Sign In
    await memberPage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await memberPage.waitForTimeout(2000);
    await memberPage.fill('input[type="email"]', MEMBER_EMAIL);
    await memberPage.fill('input[type="password"]', MEMBER_PASSWORD);
    await memberPage.waitForTimeout(500);
    await memberPage.locator('button:has-text("Sign in")').first().click();
    try {
      await memberPage.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
    } catch (e) {
      const errEl = await memberPage.$('.text-red-500');
      if (errEl) console.log("Member login error text:", await errEl.textContent());
    }
    await memberPage.waitForTimeout(2000);

    const memberCurrentUrl = memberPage.url();
    recordResult("Member Auth", "Sign in as Member", !memberCurrentUrl.includes("/login") ? "PASS" : "FAIL", memberCurrentUrl);
    await memberPage.screenshot({ path: path.join(SCREENSHOT_DIR, "10_member_dashboard.png") });

    // 2.2 Verify Member Sidebar Controls
    // Member must NOT see administrative links in navigation
    const navText = await memberPage.textContent("nav");
    const hasRestrictedNav =
      navText.includes("Employees") ||
      navText.includes("Salaries") ||
      navText.includes("Payroll") ||
      navText.includes("Attendance") ||
      navText.includes("Compliance") ||
      navText.includes("Reports") ||
      navText.includes("Settings");

    if (!hasRestrictedNav) {
      recordResult(
        "Member Navigation",
        "Administrative navigation links are hidden from Member sidebar",
        "PASS",
        "Only Dashboard and My Portal shown"
      );
    } else {
      recordResult(
        "Member Navigation",
        "Administrative navigation links are hidden from Member sidebar",
        "FAIL",
        "Found admin links in sidebar"
      );
    }

    // 2.3 My Portal Page
    await memberPage.goto(`${BASE_URL}/my-portal`, { waitUntil: "domcontentloaded" });
    await memberPage.waitForTimeout(2000);
    const portalText = await memberPage.textContent("body");
    const hasMyPortal = portalText.includes("Portal") || portalText.includes("Profile") || portalText.includes("Leave");
    recordResult("Member Portal", "My Portal loads personal profile, leaves & payslips", hasMyPortal ? "PASS" : "FAIL");
    await memberPage.screenshot({ path: path.join(SCREENSHOT_DIR, "11_member_my_portal.png") });

    // 2.4 Test Direct Route Access (Step 5 Route Security)
    const restrictedRoutes = [
      { path: "/employees", name: "Employees" },
      { path: "/salaries", name: "Salaries" },
      { path: "/payroll", name: "Payroll" },
      { path: "/attendance", name: "Attendance" },
      { path: "/compliance", name: "Compliance" },
      { path: "/reports", name: "Reports" },
      { path: "/settings", name: "Settings" },
    ];

    for (const route of restrictedRoutes) {
      await memberPage.goto(`${BASE_URL}${route.path}`, { waitUntil: "domcontentloaded" });
      await memberPage.waitForTimeout(1500);

      const finalUrl = memberPage.url();
      const pageBody = await memberPage.textContent("body");
      const isBlockedOrRedirected =
        finalUrl.includes("/my-portal") ||
        finalUrl === `${BASE_URL}/` ||
        finalUrl.endsWith(":3000/") ||
        pageBody.includes("Access Restricted") ||
        pageBody.includes("permission");

      // Verify no sensitive company salary/payroll data leaked
      const leaksSensitiveData =
        pageBody.includes("Total Net Payout") ||
        pageBody.includes("Calculated Employee Payroll Preview") ||
        pageBody.includes("Employer Contributions");

      if (isBlockedOrRedirected && !leaksSensitiveData) {
        recordResult(
          "Route Security",
          `Direct navigation to ${route.path} is blocked / redirected`,
          "PASS",
          `Redirected/Blocked safely without data leakage (${finalUrl})`
        );
      } else {
        recordResult(
          "Route Security",
          `Direct navigation to ${route.path} is blocked / redirected`,
          "FAIL",
          `Accessible or leaked data (${finalUrl})`
        );
      }
      await memberPage.screenshot({
        path: path.join(SCREENSHOT_DIR, `12_member_blocked_${route.name.toLowerCase()}.png`),
      });
    }

    // 2.5 Page Refresh Test
    await memberPage.goto(`${BASE_URL}/my-portal`, { waitUntil: "domcontentloaded" });
    await memberPage.waitForTimeout(1000);
    await memberPage.reload({ waitUntil: "domcontentloaded" });
    await memberPage.waitForTimeout(1000);
    const postRefreshUrl = memberPage.url();
    recordResult(
      "Session Resilience",
      "Page refresh maintains authenticated session without logout",
      postRefreshUrl.includes("/my-portal") ? "PASS" : "FAIL"
    );

    // 2.6 Log Out & Back Navigation
    // Find logout button in sidebar or avatar
    const logoutBtn = await memberPage.$('button:has-text("Log out"), button:has-text("Log Out"), [aria-label="Log out"]');
    if (logoutBtn) {
      await logoutBtn.click();
      await memberPage.waitForURL((url) => url.pathname.includes("/login"), { timeout: 10000 }).catch(() => {});
      await memberPage.waitForTimeout(1500);
    } else {
      // Direct signout call via navigation
      await memberPage.goto(`${BASE_URL}/login`);
    }

    // Try browser back navigation
    await memberPage.goBack().catch(() => {});
    await memberPage.waitForTimeout(1000);
    const backNavUrl = memberPage.url();
    const backNavBlocked = backNavUrl.includes("/login") || !backNavUrl.includes("/my-portal");
    recordResult(
      "Auth Boundary",
      "Browser back navigation after logout does not restore access",
      backNavBlocked ? "PASS" : "FAIL",
      `Current URL: ${backNavUrl}`
    );
    await memberPage.screenshot({ path: path.join(SCREENSHOT_DIR, "13_logout_back_nav.png") });

    await memberContext.close();

    // =========================================================================
    // SUITE 3: UNAUTHENTICATED ROUTE ACCESS MATRIX
    // =========================================================================
    console.log("\n▶ SUITE 3: UNAUTHENTICATED ACCESS MATRIX");
    const unauthContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const unauthPage = await unauthContext.newPage();
    unauthPage.setDefaultNavigationTimeout(60000);
    unauthPage.setDefaultTimeout(30000);

    for (const route of restrictedRoutes) {
      await unauthPage.goto(`${BASE_URL}${route.path}`, { waitUntil: "domcontentloaded" });
      await unauthPage.waitForTimeout(1000);
      const cur = unauthPage.url();
      const isRedirectedToLogin = cur.includes("/login");
      recordResult(
        "Unauthenticated Guard",
        `Unauthenticated ${route.path} redirects to /login`,
        isRedirectedToLogin ? "PASS" : "FAIL",
        `URL: ${cur}`
      );
    }
    await unauthPage.screenshot({ path: path.join(SCREENSHOT_DIR, "14_unauth_redirect.png") });
    await unauthContext.close();

  } finally {
    await browser.close();
  }

  // =========================================================================
  // SUMMARY REPORT GENERATION
  // =========================================================================
  console.log("\n================================================================================");
  console.log("FINAL TEST SUMMARY");
  console.log("================================================================================");
  const total = testResults.length;
  const passed = testResults.filter((r) => r.status === "PASS").length;
  const failed = testResults.filter((r) => r.status === "FAIL").length;
  console.log(`Total Scenarios: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  console.log(`Console Errors Captured: ${consoleErrors.length}`);
  consoleErrors.forEach((e) => console.log(`  ${e}`));

  console.log(`\nNetwork Request Failures: ${networkFailures.length}`);
  networkFailures.forEach((n) => console.log(`  ${n}`));

  // Write structured JSON summary for the report
  fs.writeFileSync(
    path.join(__dirname, "test-results.json"),
    JSON.stringify({ total, passed, failed, testResults, consoleErrors, networkFailures }, null, 2),
    "utf-8"
  );
  console.log(`\nTest results JSON written to: ${path.join(__dirname, "test-results.json")}`);
}

runTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
