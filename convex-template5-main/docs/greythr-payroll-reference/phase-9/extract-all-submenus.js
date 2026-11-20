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
  const ws = new WebSocket(greyTab.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  const allMenus = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const host = document.querySelector('#gt-nav-bar-shadow');
      const sr = host.shadowRoot;

      const triggers = [
        { key: 'info', triggerId: 'popover-trigger-payroll-info', contentId: 'popover-content-payroll-info' },
        { key: 'inputs', triggerId: 'popover-trigger-payroll-inputs', contentId: 'popover-content-payroll-inputs' },
        { key: 'process', triggerId: 'popover-trigger-payroll-process', contentId: 'popover-content-payroll-process' },
        { key: 'verify', triggerId: 'popover-trigger-payroll-verify', contentId: 'popover-content-payroll-verify' },
        { key: 'payout', triggerId: 'popover-trigger-payroll-payout', contentId: 'popover-content-payroll-payout' },
        { key: 'publishedinfo', triggerId: 'popover-trigger-payroll-publishedinfo', contentId: 'popover-content-payroll-publishedinfo' },
        { key: 'admin', triggerId: 'popover-trigger-payroll-admin', contentId: 'popover-content-payroll-admin' },
        { key: 'setup', triggerId: 'popover-trigger-payroll-setup', contentId: 'popover-content-payroll-setup' }
      ];

      const results = {};

      for (const t of triggers) {
        const btn = sr.querySelector('#' + t.triggerId);
        if (btn) {
          btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
          btn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
        const sec = sr.querySelector('#' + t.contentId);
        if (sec) {
          const links = Array.from(sec.querySelectorAll('a')).map(a => {
            const titleEl = a.querySelector('.title, p, span');
            return {
              title: titleEl ? titleEl.textContent.trim() : a.textContent.trim(),
              href: a.getAttribute('href')
            };
          });
          results[t.key] = links;
        }
      }

      return results;
    })()`,
    returnByValue: true
  });

  console.log('All Payroll submenus extracted:');
  console.log(JSON.stringify(allMenus.result.value, null, 2));

  fs.writeFileSync(
    'C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/docs/greythr-payroll-reference/phase-9/payroll-submenus-all.json',
    JSON.stringify(allMenus.result.value, null, 2)
  );

  ws.close();
}

run().catch(console.error);
