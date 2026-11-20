const WebSocket = require('C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/node_modules/ws');
const http = require('http');

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

  const result = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const host = document.querySelector('#gt-nav-bar-shadow');
      if (!host || !host.shadowRoot) return null;
      const sr = host.shadowRoot;

      // Click each of the buttons and see what submenus appear
      const subMenus = {};
      const categoryNames = ['Information', 'Payroll Inputs', 'Process', 'Verify', 'Payout', 'Published Info', 'Admin', 'Setup'];

      const allBtns = Array.from(sr.querySelectorAll('button, a'));
      for (const name of categoryNames) {
        const btn = allBtns.find(b => b.innerText && b.innerText.trim() === name);
        if (btn) {
          subMenus[name] = { found: true };
        }
      }

      return {
        categories: Object.keys(subMenus)
      };
    })()`,
    returnByValue: true
  });

  console.log('Categories found:', JSON.stringify(result.result.value, null, 2));

  // Let's click "Information" button and inspect the menu popup
  const clickInfo = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const host = document.querySelector('#gt-nav-bar-shadow');
      const sr = host.shadowRoot;
      const btn = Array.from(sr.querySelectorAll('button')).find(b => b.innerText && b.innerText.trim() === 'Information');
      if (btn) {
        btn.click();
        return { clicked: true };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Click info result:', clickInfo.result.value);

  await new Promise(r => setTimeout(r, 1000));

  // Find opened menu in document or shadow root
  const menuInfo = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const host = document.querySelector('#gt-nav-bar-shadow');
      const sr = host.shadowRoot;
      const srItems = Array.from(sr.querySelectorAll('[role="menuitem"], a, button')).map(el => el.innerText.trim()).filter(Boolean);
      const docItems = Array.from(document.querySelectorAll('.chakra-menu__menu-list [role="menuitem"], [role="menu"] [role="menuitem"]')).map(el => el.innerText.trim()).filter(Boolean);
      return { srItems, docItems };
    })()`,
    returnByValue: true
  });

  console.log('Menu items for Information:', JSON.stringify(menuInfo.result.value, null, 2));

  ws.close();
}

run().catch(console.error);
