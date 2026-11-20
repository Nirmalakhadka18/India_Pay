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

  await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });
  await sendCDP(ws, 'Emulation.setVisibleSize', { width: 1920, height: 1080 });

  const metrics = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const getMetrics = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          sel,
          rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }
        };
      };

      return JSON.stringify({
        switcher: getMetrics('.new-gen-nav-pills'),
        greeting: getMetrics('.greeting-message .title'),
        skyline: getMetrics('.image-container'),
        mainContainer: getMetrics('.main-container'),
        favourites: getMetrics('#my-favourites'),
        tasks: getMetrics('.my-tasks-wrapper'),
        updates: getMetrics('.latest-updates-container'),
        helpLinks: getMetrics('.help-links-container')
      });
    })()`
  });

  console.log(metrics.result.value);
  ws.close();
}

run().catch(console.error);
