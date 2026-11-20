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
  const gWin = await sendCDP(wsG, 'Browser.getWindowForTarget');
  console.log('greytHR window ID:', gWin.windowId, 'bounds:', gWin.bounds);

  const localTab = tabs.find(t => t.url && t.url.includes('localhost:3000'));
  const wsL = new WebSocket(localTab.webSocketDebuggerUrl);
  await new Promise(r => wsL.on('open', r));
  const lWin = await sendCDP(wsL, 'Browser.getWindowForTarget');
  console.log('Local window ID:', lWin.windowId, 'bounds:', lWin.bounds);

  wsG.close();
  wsL.close();
}

run().catch(console.error);
