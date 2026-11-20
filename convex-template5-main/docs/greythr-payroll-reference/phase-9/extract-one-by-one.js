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

  const keys = ['inputs', 'process', 'verify', 'payout', 'publishedinfo', 'admin', 'setup'];
  const fullResults = {};

  for (const k of keys) {
    const triggerId = 'popover-trigger-payroll-' + k;
    const contentId = 'popover-content-payroll-' + k;

    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `(() => {
        const sr = document.querySelector('#gt-nav-bar-shadow').shadowRoot;
        const btn = sr.querySelector('#${triggerId}');
        if (btn) btn.click();
      })()`
    });

    await new Promise(r => setTimeout(r, 600));

    const res = await sendCDP(ws, 'Runtime.evaluate', {
      expression: `(() => {
        const sr = document.querySelector('#gt-nav-bar-shadow').shadowRoot;
        const sec = sr.querySelector('#${contentId}');
        if (!sec) return [];
        return Array.from(sec.querySelectorAll('a')).map(a => {
          const t = a.querySelector('.title, p, span');
          return {
            title: t ? t.textContent.trim() : a.textContent.trim(),
            href: a.getAttribute('href')
          };
        });
      })()`,
      returnByValue: true
    });

    fullResults[k] = res.result.value;
  }

  console.log('Results:');
  console.log(JSON.stringify(fullResults, null, 2));

  ws.close();
}

run().catch(console.error);
