import asyncio
from playwright.async_api import async_playwright

async def check():
    p = await async_playwright().start()
    b = await p.chromium.launch(headless=True, channel="msedge")
    page = await b.new_page()
    await page.goto("http://localhost:3000/login")
    await page.fill('input[type="email"]', "admin@indiapaypayroll.com")
    await page.fill('input[type="password"]', "AdminTest@2026!")
    await page.locator('button:has-text("Sign in")').first.click()
    await page.wait_for_url(lambda u: "/login" not in u, timeout=20000)
    await page.wait_for_function('() => !document.body.innerText.includes("Loading workspaces...")', timeout=20000)
    await page.goto("http://localhost:3000/reports")
    await page.wait_for_selector("text=Payroll History", timeout=20000)
    await asyncio.sleep(2)
    html = await page.inner_html("body")
    with open("reports_dom.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("HTML written to reports_dom.html, length:", len(html))
    await b.close()
    await p.stop()

if __name__ == "__main__":
    asyncio.run(check())
