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

  const localTab = tabs.find(t => t.url && t.url.includes('localhost:3000'));
  const ws = new WebSocket(localTab.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  const info = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      // Find workspace select or switchers or any button in top header/sidebar
      const buttons = Array.from(document.querySelectorAll('button, a, div')).filter(b => {
        const t = (b.innerText || '').toLowerCase();
        return t.includes('workspace') || t.includes('indiapay') || t.includes('victor');
      });
      return buttons.slice(0, 10).map(b => ({ text: b.innerText, class: b.className }));
    })()`,
    returnByValue: true
  });
  console.log('Matching elements:', JSON.stringify(info.result.value, null, 2));
  ws.close();
}

run().catch(console.error);
