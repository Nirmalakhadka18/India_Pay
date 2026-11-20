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

  const styles = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const result = {};
      const selectors = [
        '.welcome-container',
        '.greeting-container',
        '.greeting-message',
        '.greeting-message .title',
        '.greeting-message .sub-title',
        '.image-container',
        '.widget-container',
        '.main-container',
        '#my-favourites',
        '.add-favourites',
        '.favourite-item',
        '.latest-updates-wrapper, [class*="latest-update"]'
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          const r = el.getBoundingClientRect();
          const s = window.getComputedStyle(el);
          result[sel] = {
            rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
            bg: s.backgroundColor,
            bgImg: s.backgroundImage.slice(0, 100),
            padding: s.padding,
            margin: s.margin,
            fontSize: s.fontSize,
            lineHeight: s.lineHeight,
            borderRadius: s.borderRadius
          };
        }
      }
      return JSON.stringify(result);
    })()`
  });

  console.log('CSS metrics:');
  console.log(styles.result.value);
  ws.close();
}

run().catch(console.error);
