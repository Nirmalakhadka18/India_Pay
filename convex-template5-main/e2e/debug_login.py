import asyncio
from playwright.async_api import async_playwright

async def debug_login():
    p = await async_playwright().start()
    b = await p.chromium.launch(headless=True, channel="msedge")
    page = await b.new_page()
    page.on("console", lambda m: print("CONSOLE:", m.type, m.text))
    page.on("pageerror", lambda e: print("PAGE ERROR:", e))
    await page.goto("http://localhost:3001/login")
    await asyncio.sleep(2)
    await page.fill('input[placeholder="Email"]', "owner@indiapaypayroll.com")
    await page.fill('input[placeholder="Password"]', "OwnerTest@2026!")
    btn = page.locator('button:has-text("Sign in")').first
    await btn.click()
    print("Clicked sign in, waiting for workspace...")
    await page.wait_for_url(lambda u: "/login" not in u, timeout=20000)
    print("Authenticated, waiting for dashboard...")
    await asyncio.sleep(4)
    print("Current URL:", page.url)
    await page.screenshot(path="e2e/screenshots/owner_dashboard_live.png", full_page=True)
    body_text = await page.inner_text("body")
    print("BODY SNIPPET:", body_text[:600])
    await b.close()
    await p.stop()

if __name__ == "__main__":
    asyncio.run(debug_login())
