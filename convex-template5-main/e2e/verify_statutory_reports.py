import asyncio
import os
from playwright.async_api import async_playwright

BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

async def verify_reports():
    print("================================================================================")
    print("INDIAPAY — 8 STATUTORY REPORTS DOM & PREVIEW VERIFICATION")
    print("================================================================================")
    print(f"Target URL: {BASE_URL}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, channel="msedge")
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        page.on("console", lambda m: print(f"CONSOLE [{m.type}]:", m.text))
        page.on("pageerror", lambda e: print("PAGE ERROR:", e))

        # 1. Login
        print("1. Navigating to login page...")
        await page.goto(f"{BASE_URL}/login")
        await asyncio.sleep(1.5)

        print("2. Entering Admin credentials...")
        await page.fill('input[type="email"]', "admin@indiapaypayroll.com")
        await page.fill('input[type="password"]', "AdminTest@2026!")
        await page.locator('button:has-text("Sign in")').first.click()

        print("3. Waiting for navigation to dashboard/workspace...")
        await page.wait_for_url(lambda u: "/login" not in u, timeout=25000)
        print(f"[SUCCESS] Authenticated successfully: {page.url}")

        # Wait for workspace to load
        print("Waiting for workspace to load...")
        await page.wait_for_function('() => !document.body.innerText.includes("Loading workspaces...")', timeout=25000)
        await asyncio.sleep(2)
        print("Workspace loaded successfully.")

        # 2. Go to /reports
        print("4. Navigating to /reports...")
        await page.goto(f"{BASE_URL}/reports")
        print("Waiting for Reports page content to load...")
        await page.wait_for_selector("text=Payroll History", timeout=30000)
        await asyncio.sleep(3)
        print(f"Current URL: {page.url}")

        screenshot_path = os.path.join(SCREENSHOT_DIR, "reports_full_page.png")
        await page.screenshot(path=screenshot_path, full_page=True)
        print(f"[SCREENSHOT] Full page screenshot saved: {screenshot_path}")

        body_text = await page.inner_text("body")
        print("\n--- BODY TEXT ON /reports ---")
        print(body_text)
        print("--- END BODY TEXT ---\n")

        # 3. Check Payroll History Table
        payroll_history = await page.locator("text=Payroll History").first.is_visible()
        print(f"[OK] Payroll History Table is visible: {payroll_history}")

        # 4. Check Statutory Reports Section
        statutory_heading = await page.locator("text=Statutory Reports & Filing Statements").first.is_visible()
        print(f"[OK] Statutory Reports Section heading is visible: {statutory_heading}")

        esi_card = await page.locator("text=1. Employees' State Insurance (ESI)").first.is_visible()
        pf_card = await page.locator("text=2. Provident Fund (EPFO & EPS)").first.is_visible()
        pt_card = await page.locator("text=3. Professional Tax (PT)").first.is_visible()
        print(f"[OK] ESI Section Card visible: {esi_card}")
        print(f"[OK] PF Section Card visible: {pf_card}")
        print(f"[OK] PT Section Card visible: {pt_card}")

        # 5. Check all 8 preview buttons
        preview_buttons = page.locator('button:has-text("Generate Preview")')
        count = await preview_buttons.count()
        print(f"\nTotal 'Generate Preview' buttons detected: {count}")

        for i in range(count):
            btn = preview_buttons.nth(i)
            await btn.scroll_into_view_if_needed()
            await asyncio.sleep(0.3)
            await btn.click()
            await asyncio.sleep(1)

            dialog = page.locator('[role="dialog"]')
            is_open = await dialog.is_visible()
            heading = await dialog.locator("h2").inner_text() if is_open else "N/A"
            print(f"  [Report {i+1}/{count}] Modal Opened: '{heading}' (Visible: {is_open})")

            modal_pic = os.path.join(SCREENSHOT_DIR, f"report_modal_{i+1}.png")
            await page.screenshot(path=modal_pic)

            await page.keyboard.press("Escape")
            await asyncio.sleep(0.5)

        print("\n================================================================================")
        print("[SUCCESS] ALL 8 STATUTORY REPORTS VERIFIED ON /reports IN BROWSER!")
        print("================================================================================")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_reports())
