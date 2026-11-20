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
      let el = document.querySelector('h1');
      const chain = [];
      while (el && el !== document.body) {
        const r = el.getBoundingClientRect();
        const s = window.getComputedStyle(el);
        chain.push({
          tag: el.tagName,
          class: el.className,
          w: Math.round(r.width),
          maxW: s.maxWidth,
          pad: s.padding,
          mar: s.margin
        });
        el = el.parentElement;
      }
      return JSON.stringify(chain, null, 2);
    })()`
  });

  console.log('Parent chain for h1 on local:', info.result.value);
  ws.close();
}

run().catch(console.error);
