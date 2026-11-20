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
      const sr = host ? host.shadowRoot : null;
      if (!sr) return null;

      const popoverSections = Array.from(sr.querySelectorAll('section[id^="popover-content-payroll-"]')).map(sec => {
        return {
          id: sec.id,
          html: sec.innerHTML,
          links: Array.from(sec.querySelectorAll('a, button, li')).map(el => ({
            tag: el.tagName,
            text: el.innerText ? el.innerText.trim() : '',
            href: el.getAttribute('href') || ''
          }))
        };
      });

      return popoverSections;
    })()`,
    returnByValue: true
  });

  console.log('Popover sections:', JSON.stringify(result.result.value, null, 2));
  ws.close();
}

run().catch(console.error);
