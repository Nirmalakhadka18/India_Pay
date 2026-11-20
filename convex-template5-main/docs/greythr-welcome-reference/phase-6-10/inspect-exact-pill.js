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
      const pill = document.querySelector('.new-gen-nav-pills');
      const r = pill.getBoundingClientRect();
      const s = window.getComputedStyle(pill);
      const title = document.querySelector('.greeting-message .title');
      const rT = title.getBoundingClientRect();
      const sT = window.getComputedStyle(title);
      return JSON.stringify({
        pill: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), margin: s.margin, padding: s.padding },
        title: { x: Math.round(rT.x), y: Math.round(rT.y), w: Math.round(rT.width), h: Math.round(rT.height), font: sT.font, margin: sT.margin }
      });
    })()`
  });

  console.log(info.result.value);
  ws.close();
}

run().catch(console.error);
