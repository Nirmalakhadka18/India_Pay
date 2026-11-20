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
      const fav = document.querySelector('#my-favourites');
      const tasks = document.querySelector('[gt-tasks]');
      const updates = document.querySelector('.latest-updates-container');
      const links = document.querySelector('.help-links-container');

      return JSON.stringify({
        favHTML: fav ? fav.outerHTML : null,
        tasksHTML: tasks ? tasks.outerHTML.slice(0, 3000) : null,
        updatesHTML: updates ? updates.outerHTML.slice(0, 3000) : null,
        linksHTML: links ? links.outerHTML : null
      });
    })()`
  });

  console.log(info.result.value);
  ws.close();
}

run().catch(console.error);
