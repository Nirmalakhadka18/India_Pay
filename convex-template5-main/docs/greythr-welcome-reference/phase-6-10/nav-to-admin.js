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

  await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/admin' });
  await new Promise(r => setTimeout(r, 3000));

  const check = await sendCDP(ws, 'Runtime.evaluate', {
    expression: '({ url: window.location.href, h1: document.querySelector("h1") ? document.querySelector("h1").innerText : null })',
    returnByValue: true
  });
  console.log('Navigated to /admin:', check.result.value);

  const fs = require('fs');
  const shot = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  const outDir = 'C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/docs/greythr-welcome-reference/phase-6-10';
  fs.writeFileSync(`${outDir}/local-indiapay-welcome-1920x1080.png`, Buffer.from(shot.data, 'base64'));
  console.log('Saved /admin screenshot!');
  ws.close();
}

run().catch(console.error);
