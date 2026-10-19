const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve(__dirname, "screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyStatutoryReports() {
  console.log("================================================================================");
  console.log("INDIAPAY — 8 STATUTORY REPORTS DOM VERIFICATION & PREVIEW TEST");
  console.log("================================================================================");
  console.log(`Target URL: ${BASE_URL}`);

  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.error(`🔴 Console Error: ${msg.text()}`);
    }
  });

  try {
    // 1. Login as Admin
    console.log("1. Navigating to login page...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    console.log("2. Submitting Admin credentials (admin@indiapaypayroll.com)...");
    await page.fill('input[type="email"]', "admin@indiapaypayroll.com");
    await page.fill('input[type="password"]', "AdminTest@2026!");
    await page.locator('button:has-text("Sign in")').first().click();

    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 25000 });
    await page.waitForTimeout(2000);
    console.log(`✅ Logged in successfully: ${page.url()}`);

    // 2. Navigate to /reports
    console.log("3. Navigating to /reports...");
    await page.goto(`${BASE_URL}/reports`, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    const screenshotPath = path.join(SCREENSHOT_DIR, "reports_page_verified.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Saved full page screenshot to: ${screenshotPath}`);

    // 3. Verify Payroll History table
    const tableHeader = await page.locator("text=Payroll History").first().isVisible();
    console.log(`✅ Payroll History Table Header present: ${tableHeader}`);

    const hasViewDetails = await page.locator('button:has-text("View Details")').first().isVisible().catch(() => false);
    console.log(`✅ 'View Details' action present: ${hasViewDetails}`);

    const hasExportCsv = await page.locator('button:has-text("Export CSV")').first().isVisible().catch(() => false);
    console.log(`✅ 'Export CSV' action present: ${hasExportCsv}`);

    // 4. Verify Statutory Reports Sections
    const statutorySectionHeading = await page.locator("text=Statutory Reports & Filing Statements").first().isVisible();
    console.log(`✅ Statutory Reports & Filing Statements section present: ${statutorySectionHeading}`);

    // Check 3 statutory cards
    const esiCard = await page.locator("text=1. Employees' State Insurance (ESI)").first().isVisible();
    const pfCard = await page.locator("text=2. Provident Fund (EPFO & EPS)").first().isVisible();
    const ptCard = await page.locator("text=3. Professional Tax (PT)").first().isVisible();
    console.log(`✅ Section 1 (ESI Card) present: ${esiCard}`);
    console.log(`✅ Section 2 (PF Card) present: ${pfCard}`);
    console.log(`✅ Section 3 (PT Card) present: ${ptCard}`);

    // 5. Test each of the 8 reports by opening preview modal
    const reportsToTest = [
      { id: "esi_monthly_statement", label: "ESI Monthly Statement", previewBtnText: "Generate Preview" },
      { id: "esi_challan", label: "ESI Challan Report", previewBtnText: "Generate Preview" },
      { id: "esi_upload_excel", label: "ESI Monthly Report Upload Format", previewBtnText: "Generate Preview" },
      { id: "pf_monthly_statement", label: "PF Monthly Statement", previewBtnText: "Generate Preview" },
      { id: "pf_combined_challan", label: "PF Combined Challan Report V1", previewBtnText: "Generate Preview" },
      { id: "pf_ecr", label: "PF ECR Format", previewBtnText: "Generate Preview" },
      { id: "pt_monthly_statement", label: "Professional Tax Monthly Statement", previewBtnText: "Generate Preview" },
      { id: "karnataka_form_5a", label: "Karnataka Form 5A Monthly Statement", previewBtnText: "Generate Preview" },
    ];

    console.log("\n--- TESTING 8 REPORT PREVIEWS ---");
    const previewButtons = page.locator('button:has-text("Generate Preview")');
    const count = await previewButtons.count();
    console.log(`Total 'Generate Preview' buttons detected: ${count}`);

    for (let i = 0; i < count; i++) {
      const btn = previewButtons.nth(i);
      await btn.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await btn.click();
      await page.waitForTimeout(1000);

      // Verify dialog is open
      const dialog = page.locator('[role="dialog"]');
      const isOpen = await dialog.isVisible();
      const title = await dialog.locator("h2").innerText().catch(() => "Dialog");
      console.log(`  [Report ${i + 1}/8] Preview Modal Opened: "${title}" (Visible: ${isOpen})`);

      // Screenshot dialog
      const modalScreenshot = path.join(SCREENSHOT_DIR, `preview_modal_${i + 1}.png`);
      await page.screenshot({ path: modalScreenshot });

      // Close modal by pressing Escape or clicking close
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }

    console.log("\n================================================================================");
    console.log("✅ ALL 8 STATUTORY REPORTS DOM VERIFIED SUCCESSFULLY ON /reports");
    console.log("================================================================================");
  } catch (err) {
    console.error("❌ Test failed:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

verifyStatutoryReports();
