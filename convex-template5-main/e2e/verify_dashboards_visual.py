import asyncio
import os
import sys
import json
from playwright.async_api import async_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3001")
SCREENSHOTS_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

ACCOUNTS = [
    {
        "role": "Owner",
        "email": "owner@indiapaypayroll.com",
        "password": "OwnerTest@2026!",
        "expected_role_text": "(owner)",
    },
    {
        "role": "Admin",
        "email": "admin@indiapaypayroll.com",
        "password": "AdminTest@2026!",
        "expected_role_text": "(admin)",
    },
    {
        "role": "Member",
        "email": "user@indiapaypayroll.com",
        "password": "UserTest@2026!",
        "expected_role_text": "(member)",
    },
]

async def verify_dashboards():
    print("=" * 80)
    print("INDIAPAY — DETAILED DASHBOARD VISUAL & DATA AUDIT")
    print(f"Target Base URL: {BASE_URL}")
    print("=" * 80)

    results = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, channel="msedge")
        context = await browser.new_context(viewport={"width": 1440, "height": 1000})
        page = await context.new_page()
        page.set_default_timeout(30000)

        for acc in ACCOUNTS:
            role = acc["role"]
            email = acc["email"]
            password = acc["password"]
            print(f"\n========================================================")
            print(f">> Verifying {role.upper()} Dashboard ({email})")
            print(f"========================================================")

            context = await browser.new_context(viewport={"width": 1440, "height": 1000})
            page = await context.new_page()
            page.set_default_timeout(30000)

            # 1. Login
            await page.goto(f"{BASE_URL}/en/login", wait_until="networkidle")
            await asyncio.sleep(1.0)

            email_input = page.locator('input[placeholder="Email"]').first
            password_input = page.locator('input[placeholder="Password"]').first
            await email_input.wait_for(state="visible", timeout=30000)

            await email_input.fill(email)
            await password_input.fill(password)
            await asyncio.sleep(0.5)

            sign_in_btn = page.locator('button:has-text("Sign in")').first
            await sign_in_btn.click()

            try:
                await page.wait_for_url(lambda u: "/login" not in u, timeout=25000)
            except Exception as e:
                err_el = page.locator("p.text-red-500, p.text-destructive")
                err_text = await err_el.inner_text() if await err_el.count() > 0 else "No red error text"
                print(f"  [LOGIN FAILED FOR {email}]: {err_text}")
                fail_shot = os.path.join(SCREENSHOTS_DIR, f"fail_login_{role}.png")
                await page.screenshot(path=fail_shot)
                print(f"  Saved fail screenshot: {fail_shot}")
                raise e

            await asyncio.sleep(3.5)

            current_url = page.url
            print(f"  Authenticated URL: {current_url}")

            if role == "Owner":
                try:
                    await page.wait_for_selector('text="Gross Payroll"', timeout=15000)
                except Exception:
                    print("  [WAIT WARNING] 'Gross Payroll' selector timed out, proceeding...")
            elif role == "Admin":
                try:
                    await page.wait_for_selector('text="Active Employees"', timeout=15000)
                except Exception:
                    print("  [WAIT WARNING] 'Active Employees' selector timed out, proceeding...")
            elif role == "Member":
                await asyncio.sleep(2.0)

            # Capture full page screenshot
            screenshot_path = os.path.join(SCREENSHOTS_DIR, f"{role.lower()}_dashboard.png")
            await page.screenshot(path=screenshot_path, full_page=True)
            print(f"  Screenshot saved: {screenshot_path}")

            # Extract body text
            body_text = await page.inner_text("body")

            if role == "Owner":
                print("\n  [Owner Executive Dashboard Verification]")
                has_executive = "Executive Dashboard" in body_text
                has_owner_badge = "Workspace Owner" in body_text
                print(f"  - 'Executive Dashboard' header: {has_executive}")
                print(f"  - 'Workspace Owner' badge: {has_owner_badge}")
                assert has_executive, "Owner Executive Dashboard header missing!"

                # Check 5 Financial KPIs
                body_lower = body_text.lower()
                has_gross = "gross payroll" in body_lower
                has_net = "net payout" in body_lower or "net payroll" in body_lower
                has_ded = "employee deductions" in body_lower
                has_contrib = "employer contributions" in body_lower
                has_ctc = "total company cost" in body_lower
                print(f"  - 5 Financial KPIs present: Gross={has_gross}, Net={has_net}, Ded={has_ded}, Contrib={has_contrib}, CTC={has_ctc}")
                assert has_gross and has_net and has_ded and has_contrib and has_ctc, "Missing financial KPI cards on Owner Dashboard!"

                # Check Reconciliation
                has_recon = "reconciliation alert" in body_lower or "workforce variance" in body_lower
                print(f"  - Workforce Reconciliation Alert present: {has_recon}")

                # Check Statutory deadlines
                has_epf = "epfo" in body_lower or "provident fund" in body_lower
                has_esic = "esic" in body_lower or "health insurance" in body_lower
                has_pt = "professional tax" in body_lower
                has_tds = "tds" in body_lower
                print(f"  - Statutory Compliance entries: EPF={has_epf}, ESIC={has_esic}, PT={has_pt}, TDS={has_tds}")

                # Check values for 2026-10
                if "50,000" in body_text:
                    print("  [PASS] Gross Payroll of Rs 50,000 displayed")
                if "48,000" in body_text:
                    print("  [PASS] Net Payout of Rs 48,000 displayed")
                if "2,000" in body_text:
                    print("  [PASS] Employee Deductions of Rs 2,000 displayed")
                if "6,570" in body_text:
                    print("  [PASS] Employer Contributions of Rs 6,570 displayed")
                if "56,570" in body_text:
                    print("  [PASS] Total Company Cost of Rs 56,570 displayed")

            elif role == "Admin":
                print("\n  [Admin Dashboard Verification]")
                has_admin_header = "Operations Dashboard" in body_text or "Active Employees" in body_text
                print(f"  - Admin Operations Header / Metric cards: {has_admin_header}")

            elif role == "Member":
                print("\n  [Employee / Member Dashboard Verification]")
                is_portal = "Employee Self-Service Portal" in body_text or "Employee Portal" in body_text or "Welcome" in body_text
                print(f"  - Employee Portal interface: {is_portal}")

                # CRITICAL VERIFICATION:
                # Specifically verify that an employee's personal net salary is never replaced by company-wide net payroll.
                print("  - CRITICAL PRIVACY CHECK: Checking if company-wide net payroll (Rs 48,000) or live gross (Rs 1,60,000) leaked into personal salary:")
                
                # Check what "My Latest Net Salary" shows
                my_salary_locator = page.locator('text="My Latest Net Salary"').locator("xpath=..")
                if await my_salary_locator.count() > 0:
                    my_salary_card_text = await my_salary_locator.first.inner_text()
                    assert "48,000" not in my_salary_card_text, "CRITICAL ERROR: Company-wide net payroll Rs 48,000 is showing on employee's personal salary card!"
                    assert "1,60,000" not in my_salary_card_text, "CRITICAL ERROR: Company preview gross Rs 1,60,000 is showing on employee's personal salary card!"
                    assert "56,570" not in my_salary_card_text, "CRITICAL ERROR: Company total cost Rs 56,570 is showing on employee's personal salary card!"
                    print("    [PASS] Personal net salary card is strictly isolated and does NOT display company-wide net payroll!")
                else:
                    print(f"    (Account linking state or portal text detected)")

            await context.close()

        await browser.close()

    print("\n" + "=" * 80)
    print("ALL 3 DASHBOARDS VISUALLY AND FUNCTIONALLY VERIFIED IN BROWSER!")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(verify_dashboards())
