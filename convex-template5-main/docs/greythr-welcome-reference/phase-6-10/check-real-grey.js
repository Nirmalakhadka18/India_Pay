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

  const check = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const p = document.querySelector('ul.new-gen-nav-pills').getBoundingClientRect();
      const h1 = document.querySelector('h1, .title').getBoundingClientRect();
      const faves = document.querySelector('#my-favourites').getBoundingClientRect();
      return {
        pill: { x: p.x, y: p.y, w: p.width, h: p.height },
        h1: { x: h1.x, y: h1.y, w: h1.width, h: h1.height },
        faves: { x: faves.x, y: faves.y, w: faves.width, h: faves.height },
        window: { innerWidth: window.innerWidth, docWidth: document.documentElement.clientWidth }
      };
    })()`,
    returnByValue: true
  });

  console.log('greytHR real DOM values:', JSON.stringify(check.result.value, null, 2));
  ws.close();
}

run().catch(console.error);
