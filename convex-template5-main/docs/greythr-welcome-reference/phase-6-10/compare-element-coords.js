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
  const localTab = tabs.find(t => t.url && t.url.includes('localhost:3000'));

  const wsG = new WebSocket(greyTab.webSocketDebuggerUrl);
  await new Promise(r => wsG.on('open', r));
  const resG = await sendCDP(wsG, 'Runtime.evaluate', {
    expression: `(() => {
      const getR = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
      };
      return JSON.stringify({
        pill: getR('.new-gen-nav-pills'),
        h1: getR('.title, h1'),
        subtitle: getR('.sub-title'),
        skyline: getR('.image-container'),
        main: getR('.main-container'),
        updates: getR('.latest-updates-container'),
        favesAdd: getR('.add-favourites'),
        tasksContainer: getR('.my-tasks-wrapper'),
        tasksPeach: getR('.my-tasks-count-container'),
        helpdesk: getR('.newgen-image-helpdesk'),
        links: getR('.help-links-container')
      });
    })()`
  });
  wsG.close();

  const wsL = new WebSocket(localTab.webSocketDebuggerUrl);
  await new Promise(r => wsL.on('open', r));
  await sendCDP(wsL, 'Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });
  const resL = await sendCDP(wsL, 'Runtime.evaluate', {
    expression: `(() => {
      const getR = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
      };
      return JSON.stringify({
        pill: getR('ul'),
        h1: getR('h1'),
        subtitle: getR('p.text-\\\\[18px\\\\]'),
        skyline: getR('.bg-right'),
        main: getR('[style*=\"linear-gradient\"]'),
        updates: getR('.rounded-\\\\[12px\\\\].bg-\\\\[\\\\#FCF2FF\\\\]'),
        favesAdd: getR('button[title=\"Add Favourite\"]'),
        tasksContainer: getR('.flex-col.md\\\\:flex-row'),
        tasksPeach: getR('.bg-\\\\[\\\\#FFF0DE\\\\]'),
        helpdesk: getR('[style*=\"helpdesk.svg\"]'),
        links: getR('.flex.flex-wrap.items-center.gap-4')
      });
    })()`
  });
  wsL.close();

  console.log('=== greytHR (Target) ===');
  console.log(resG.result.value);
  console.log('=== IndiaPay (Current) ===');
  console.log(resL.result.value);
}

run().catch(console.error);
