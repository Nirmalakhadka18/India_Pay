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
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });

  const tab = tabs.find(t => t.id === 'D4375D5F586C394D1A869853CFC737FC');
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  console.log('Navigating to http://localhost:3000/en/admin/payroll...');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/en/admin/payroll' });
  await new Promise(r => setTimeout(r, 4000));

  const cur = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => ({
      url: window.location.href,
      title: document.title,
      headings: Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => h.innerText)
    }))()`,
    returnByValue: true
  });

  console.log('Result:', JSON.stringify(cur.result.value, null, 2));
  ws.close();
}

run().catch(console.error);
