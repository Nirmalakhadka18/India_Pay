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
      const pill = document.querySelector('ul');
      const rP = pill ? pill.getBoundingClientRect() : null;
      const title = document.querySelector('h1');
      const rT = title ? title.getBoundingClientRect() : null;
      const main = document.querySelector('.main-container, [style*="linear-gradient"]');
      const rM = main ? main.getBoundingClientRect() : null;
      return JSON.stringify({
        pill: rP ? { x: Math.round(rP.x), y: Math.round(rP.y), w: Math.round(rP.width), h: Math.round(rP.height) } : null,
        title: rT ? { x: Math.round(rT.x), y: Math.round(rT.y), w: Math.round(rT.width), h: Math.round(rT.height) } : null,
        main: rM ? { x: Math.round(rM.x), y: Math.round(rM.y), w: Math.round(rM.width), h: Math.round(rM.height) } : null
      });
    })()`
  });

  console.log('Local positions:', info.result.value);
  ws.close();
}

run().catch(console.error);
