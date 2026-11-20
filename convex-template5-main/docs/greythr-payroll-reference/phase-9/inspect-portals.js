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
      // Let's dump all portals or popovers in shadowRoot or document
      const host = document.querySelector('#gt-nav-bar-shadow');
      const sr = host ? host.shadowRoot : null;
      
      const portalDivs = [];
      if (sr) {
        portalDivs.push(...Array.from(sr.querySelectorAll('[class*="menu"], [class*="popover"], [class*="portal"], [class*="list"], [id*="menu"]')).map(el => ({
          tag: el.tagName,
          id: el.id,
          class: el.className,
          text: el.innerText
        })));
      }
      portalDivs.push(...Array.from(document.querySelectorAll('.chakra-portal, [class*="portal"], [id*="menu-list"]')).map(el => ({
        tag: el.tagName,
        id: el.id,
        class: el.className,
        text: el.innerText
      })));

      return portalDivs;
    })()`,
    returnByValue: true
  });

  console.log('Portals / menus:', JSON.stringify(result.result.value, null, 2));
  ws.close();
}

run().catch(console.error);
