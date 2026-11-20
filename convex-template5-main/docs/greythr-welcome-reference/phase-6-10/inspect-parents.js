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
      const pane = document.querySelector('#welcome');
      const p = pane ? pane.parentElement : null;
      const gp = p ? p.parentElement : null;
      const sP = p ? window.getComputedStyle(p) : null;
      const sGP = gp ? window.getComputedStyle(gp) : null;
      return JSON.stringify({
        parent: { tag: p ? p.tagName : null, class: p ? p.className : null, pad: sP ? sP.padding : null, mar: sP ? sP.margin : null },
        grandParent: { tag: gp ? gp.tagName : null, class: gp ? gp.className : null, pad: sGP ? sGP.padding : null, mar: sGP ? sGP.margin : null }
      });
    })()`
  });

  console.log('Parent layout:', info.result.value);
  ws.close();
}

run().catch(console.error);
