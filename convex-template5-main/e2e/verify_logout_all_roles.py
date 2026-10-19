import asyncio
import os
import sys
from playwright.async_api import async_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")

ACCOUNTS = [
    {
        "role": "Admin",
        "email": "admin@indiapaypayroll.com",
        "password": "AdminTest@2026!",
        "expected_role_text": "(admin)",
    },
    {
        "role": "Owner",
        "email": "owner@indiapaypayroll.com",
        "password": "OwnerTest@2026!",
        "expected_role_text": "(owner)",
    },
    {
        "role": "Member",
        "email": "user@indiapaypayroll.com",
        "password": "UserTest@2026!",
        "expected_role_text": "(member)",
    },
]

async def main():
    print("=" * 80)
    print("INDIAPAY COMPREHENSIVE AUTH & LOGOUT VERIFICATION")
    print(f"Target: {BASE_URL}")
    print("=" * 80)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, channel="msedge")
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        for acc in ACCOUNTS:
            role = acc["role"]
            email = acc["email"]
            password = acc["password"]
            expected_role = acc["expected_role_text"]

            print(f"\n>> Testing {role} Account ({email})...")

            # 1. Navigate to login
            print("  1. Navigating to /login...")
            await page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded", timeout=60000)
            await asyncio.sleep(2.0)

            # 2. Fill credentials
            print(f"  2. Entering credentials for {email}...")
            email_input = page.locator('input[placeholder="Email"], input[name="email"], input[type="email"]').first
            password_input = page.locator('input[type="password"]').first
            await email_input.wait_for(state="visible", timeout=60000)
            await email_input.fill(email)
            await password_input.fill(password)
            await asyncio.sleep(0.5)
            # Verify inputs before submitting
            assert (await email_input.input_value()) == email, "Email input failed to fill"
            assert len(await password_input.input_value()) > 0, "Password input failed to fill"
            await page.locator('button:has-text("Sign in")').first.click()

            # 3. Wait for authenticated redirect
            try:
                await page.wait_for_url(lambda url: "/login" not in url, wait_until="commit", timeout=20000)
            except Exception as e:
                err_el = page.locator("p.text-red-500")
                err_text = await err_el.inner_text() if await err_el.count() > 0 else "No red error text"
                print(f"  [ERROR ON LOGIN SCREEN]: {err_text}")
                await page.screenshot(path=f"e2e/screenshots/login_fail_{role}.png")
                raise
            await asyncio.sleep(2.5)
            print(f"  [PASS] Authenticated at: {page.url}")

            # 4. Check workspace selector
            ws_select = page.locator("select")
            await page.wait_for_function('() => { const s = document.querySelector("select"); return s && !s.innerText.includes("Loading"); }', timeout=15000)
            ws_text = await ws_select.inner_text()
            print(f"  - Workspace selector: {ws_text.strip()}")
            assert expected_role.lower() in ws_text.lower(), f"Expected {expected_role} in workspace selector but got {ws_text}"
            assert "…" not in ws_text, f"Workspace selector still displays ellipsis placeholder!"

            # 5. Check dashboard stats
            try:
                await page.wait_for_selector('text="Active Employees"', timeout=8000)
            except Exception:
                pass
            body_text = await page.inner_text("body")
            assert "Demo placeholder" not in body_text, "Found 'Demo placeholder' text on dashboard!"

            if role in ["Admin", "Owner"]:
                print("  - Verifying KPI cards data...")
                body_lower = body_text.lower()
                assert "active employees" in body_lower, "Missing Active Employees card"
                assert "gross payroll" in body_lower, "Missing Gross Payroll card"
                assert "net payroll" in body_lower, "Missing Net Payroll card"
                assert "pending approvals" in body_lower, "Missing Pending Approvals card"

                # Check Gross & Net payroll values
                if "50,000" in body_text:
                    print("  [PASS] Real Gross Payroll verified: 50,000 (Period: 2026-10 Approved)")
                if "48,000" in body_text:
                    print("  [PASS] Real Net Payroll verified: 48,000")

            # 6. Click Logout
            print("  3. Clicking Log out...")
            logout_btn = page.locator('button:has-text("Log out")').first
            await logout_btn.click()

            # 7. Wait for redirect to /login
            await page.wait_for_url(lambda url: "/login" in url, wait_until="commit", timeout=15000)
            await asyncio.sleep(2.0)
            print(f"  [PASS] Redirected cleanly to: {page.url}")

            # Check that login page has no unhandled error toast/banner
            login_body = await page.inner_text("body")
            assert "Not authenticated" not in login_body, "Found 'Not authenticated' unhandled error on login screen!"
            print(f"  [PASS] Clean logout confirmed for {role}!")

        # 8. Test Protected Route Access While Logged Out
        print("\n>> Verifying Protected Route Access Blockade (Unauthenticated Guard)...")
        for protected_path in ["/payroll", "/employees", "/salaries", "/settings", "/"]:
            target_url = f"{BASE_URL}{protected_path}"
            print(f"  - Attempting GET {target_url} while logged out...")
            await page.goto(target_url, wait_until="domcontentloaded")
            await asyncio.sleep(1.0)
            current = page.url
            print(f"    Result URL: {current}")
            assert "/login" in current, f"Protected route {protected_path} was accessible without auth! Current URL: {current}"
            print(f"    [PASS] Blocked and redirected to /login.")

        # 9. Test Browser Back Navigation
        print("\n>> Verifying Browser Back Button Protection...")
        await page.go_back()
        await asyncio.sleep(1.0)
        back_url = page.url
        print(f"  - URL after browser Back: {back_url}")
        assert "/login" in back_url, f"Browser Back exposed protected route! URL: {back_url}"
        print("  [PASS] Browser Back button cannot bypass authentication.")

        await browser.close()

    print("\n" + "=" * 80)
    print("ALL AUTHENTICATION & LOGOUT VERIFICATIONS PASSED SUCCESSFULLY! (100%)")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(main())
