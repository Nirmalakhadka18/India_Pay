const WebSocket = require('C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/node_modules/ws');
const http = require('http');
const fs = require('fs');

async function sendCDP(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (msg) => {
      const res = JSON.parse(msg);
      if (res.id === id) {
        ws.off('message', handler);
        if (res.error) reject(res.error);
        else resolve(res.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function run() {
  const tabs = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/list', res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const greyTab = tabs.find(t => t.id === '9BE78206571C4B838AA7D7999D0E6AE9');
  console.log('Connecting to greytHR tab:', greyTab.webSocketDebuggerUrl);

  const ws = new WebSocket(greyTab.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  console.log('Navigating to Payroll Overview: https://victorchasex.greythr.com/ngapp/payroll/main/overview/');
  await sendCDP(ws, 'Page.navigate', { url: 'https://victorchasex.greythr.com/ngapp/payroll/main/overview/' });
  await new Promise(r => setTimeout(r, 5000));

  await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 1500));

  // Current URL and title check
  const state = await sendCDP(ws, 'Runtime.evaluate', {
    expression: '({ url: window.location.href, title: document.title })',
    returnByValue: true
  });
  console.log('Current page state:', state.result.value);

  // 1. Full-page / Viewport Screenshot 1920x1080
  const shotTop = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  const outDir = 'C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/docs/greythr-payroll-reference/phase-9';
  fs.writeFileSync(`${outDir}/greythr-payroll-top-1920x1080.png`, Buffer.from(shotTop.data, 'base64'));
  console.log('Saved greythr-payroll-top-1920x1080.png');

  // 2. Scroll middle and capture
  await sendCDP(ws, 'Runtime.evaluate', { expression: 'window.scrollTo(0, 500);' });
  await new Promise(r => setTimeout(r, 1000));
  const shotMid = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${outDir}/greythr-payroll-mid-1920x1080.png`, Buffer.from(shotMid.data, 'base64'));
  console.log('Saved greythr-payroll-mid-1920x1080.png');

  // 3. Scroll bottom and capture
  await sendCDP(ws, 'Runtime.evaluate', { expression: 'window.scrollTo(0, 1200);' });
  await new Promise(r => setTimeout(r, 1000));
  const shotBottom = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${outDir}/greythr-payroll-bottom-1920x1080.png`, Buffer.from(shotBottom.data, 'base64'));
  console.log('Saved greythr-payroll-bottom-1920x1080.png');

  // 4. Scroll back to top
  await sendCDP(ws, 'Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
  await new Promise(r => setTimeout(r, 500));

  // 5. Deep DOM Inspection of all visible sections, buttons, timeline, cards, and floating button
  const pageAudit = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      // Notification banner
      const banner = document.querySelector('[class*="banner"], [class*="alert"], [class*="notification"], .pf-wage, [class*="ceiling"]') || 
        Array.from(document.querySelectorAll('div')).find(d => /wage ceiling|pf contribution|epf/i.test(d.textContent));

      // Horizontal Month Timeline items
      const months = Array.from(document.querySelectorAll('.timeline-item, [class*="timeline"], [class*="month-item"], [class*="month"]')).map(el => ({
        text: el.innerText ? el.innerText.trim() : '',
        className: el.className
      })).filter(m => m.text.length > 0 && m.text.length < 30);

      // Section cards
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, .card-title, [class*="title"], [class*="header"]')).map(h => ({
        tag: h.tagName,
        text: h.innerText ? h.innerText.trim() : '',
        className: h.className
      })).filter(h => h.text.length > 0 && h.text.length < 80);

      // Action buttons
      const buttons = Array.from(document.querySelectorAll('button, a.btn, [role="button"]')).map(b => ({
        tag: b.tagName,
        text: b.innerText ? b.innerText.trim() : '',
        className: b.className
      })).filter(b => b.text.length > 0 && b.text.length < 50);

      // Floating button (What's New)
      const whatsNew = Array.from(document.querySelectorAll('button, div, a')).filter(el => /what's new|whats new/i.test(el.textContent)).map(el => ({
        text: el.innerText ? el.innerText.trim() : '',
        className: el.className,
        rect: el.getBoundingClientRect(),
        style: window.getComputedStyle(el).cssText.slice(0, 200)
      }));

      // More menu trigger
      const moreBtn = Array.from(document.querySelectorAll('button, a, div')).find(el => el.innerText && el.innerText.trim() === 'More');

      return {
        bannerText: banner ? banner.innerText.trim() : null,
        months: months.slice(0, 15),
        headings: headings.slice(0, 25),
        buttons: buttons.slice(0, 25),
        whatsNew: whatsNew,
        hasMoreBtn: Boolean(moreBtn)
      };
    })()`,
    returnByValue: true
  });

  fs.writeFileSync(`${outDir}/payroll-audit.json`, JSON.stringify(pageAudit.result.value, null, 2));
  console.log('Saved payroll-audit.json');

  // 6. Inspect & Click More dropdown to capture nested navigation structure
  const clickMore = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const moreBtn = Array.from(document.querySelectorAll('button, a, div')).find(el => el.innerText && el.innerText.trim() === 'More');
      if (moreBtn) {
        moreBtn.click();
        return { clicked: true };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('More button click result:', clickMore.result.value);

  await new Promise(r => setTimeout(r, 1500));

  // Capture More menu screenshot
  const shotMore = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${outDir}/greythr-payroll-more-menu.png`, Buffer.from(shotMore.data, 'base64'));
  console.log('Saved greythr-payroll-more-menu.png');

  // Extract More dropdown menu items
  const menuAudit = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const menuItems = Array.from(document.querySelectorAll('.dropdown-menu, [role="menu"], .popover, [class*="menu"], ul.dropdown')).map(m => ({
        className: m.className,
        items: Array.from(m.querySelectorAll('li, a, button, [role="menuitem"]')).map(i => i.innerText.trim()).filter(Boolean)
      }));
      return menuItems;
    })()`,
    returnByValue: true
  });
  fs.writeFileSync(`${outDir}/payroll-menu-items.json`, JSON.stringify(menuAudit.result.value, null, 2));
  console.log('Saved payroll-menu-items.json');

  ws.close();
}

run().catch(console.error);
