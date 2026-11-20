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

  const greyTab = tabs.find(t => t.url && t.url.includes('victorchasex.greythr.com'));
  const ws = new WebSocket(greyTab.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  const info = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const header = document.querySelector('header, .navbar, .gt-header, #single-spa-application\\\\:@greytip\\\\/navbar, [id*="navbar"]');
      if (!header) return 'No header found';
      const r = header.getBoundingClientRect();
      const s = window.getComputedStyle(header);
      return {
        tag: header.tagName,
        id: header.id,
        class: header.className,
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        bg: s.backgroundColor,
        padding: s.padding,
        borderBottom: s.borderBottom
      };
    })()`,
    returnByValue: true
  });

  console.log('Header info:', JSON.stringify(info.result.value, null, 2));
  ws.close();
}

run().catch(console.error);
