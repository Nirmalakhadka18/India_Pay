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
  const wsG = new WebSocket(greyTab.webSocketDebuggerUrl);
  await new Promise(r => wsG.on('open', r));

  const info = await sendCDP(wsG, 'Runtime.evaluate', {
    expression: `(() => {
      const inspect = sel => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const s = window.getComputedStyle(el);
        return {
          sel,
          rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
          pad: s.padding,
          mar: s.margin,
          border: s.border,
          bg: s.backgroundColor,
          bgImg: s.backgroundImage.slice(0, 100)
        };
      };

      return JSON.stringify({
        msg: inspect('.greeting-message'),
        sky: inspect('.image-container'),
        widget: inspect('.widget-container'),
        main: inspect('.main-container'),
        fav: inspect('#my-favourites'),
        favHeader: inspect('.my-favourites-header'),
        favWrapper: inspect('.my-favourites-wrapper'),
        addFav: inspect('.add-favourites'),
        favCard1: inspect('.newgen-action-item-card'),
        tasks: inspect('.my-tasks-wrapper'),
        tasksCount: inspect('.my-tasks-count-container'),
        tasksList: inspect('.my-tasks-list-container'),
        task1: inspect('.my-individual-task'),
        helpdesk: inspect('.newgen-image-helpdesk'),
        updates: inspect('.latest-updates-container'),
        links: inspect('.help-links-container')
      }, null, 2);
    })()`
  });

  console.log('Target Dimensions:');
  console.log(info.result.value);
  wsG.close();
}

run().catch(console.error);
