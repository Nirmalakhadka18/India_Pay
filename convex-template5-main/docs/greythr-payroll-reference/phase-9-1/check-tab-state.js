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

  const localTab = tabs.find(t => t.url && t.url.includes('localhost:3000')) || tabs[0];
  const ws = new WebSocket(localTab.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  const state = await sendCDP(ws, 'Runtime.evaluate', {
    expression: '({ url: window.location.href, title: document.title, text: document.body.innerText.substring(0, 300) })',
    returnByValue: true
  });
  console.log('Current state:', state.result.value);

  ws.close();
}

run().catch(console.error);
