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
      const sky = document.querySelector('.image-container');
      const s = window.getComputedStyle(sky);
      const r = sky.getBoundingClientRect();
      const p = sky.parentElement;
      const sP = window.getComputedStyle(p);
      const rP = p.getBoundingClientRect();

      return JSON.stringify({
        parent: { rect: rP, display: sP.display, justify: sP.justifyContent, align: sP.alignItems, gap: sP.gap, pad: sP.padding },
        sky: { rect: r, display: s.display, bgSize: s.backgroundSize, bgPos: s.backgroundPosition, bgRepeat: s.backgroundRepeat, w: s.width, h: s.height }
      }, null, 2);
    })()`
  });

  console.log('greytHR skyline container details:');
  console.log(info.result.value);
  ws.close();
}

run().catch(console.error);
