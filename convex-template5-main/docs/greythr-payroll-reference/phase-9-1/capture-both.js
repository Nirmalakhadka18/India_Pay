const WebSocket = require('C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/node_modules/ws');
const http = require('http');
const fs = require('fs');

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
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const outDir = 'C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/docs/greythr-payroll-reference/phase-9-1';

  // 1. Capture greytHR Reference at 1920x1080
  const greyTab = tabs.find(t => t.url && t.url.includes('victorchasex.greythr.com'));
  if (greyTab) {
    console.log('Capturing greytHR reference...');
    const ws = new WebSocket(greyTab.webSocketDebuggerUrl);
    await new Promise(r => ws.on('open', r));

    await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });
    await sendCDP(ws, 'Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
    await new Promise(r => setTimeout(r, 1500));

    const shot = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${outDir}/reference-greythr-payroll-1920x1080.png`, Buffer.from(shot.data, 'base64'));
    console.log('Saved reference-greythr-payroll-1920x1080.png');
    ws.close();
  } else {
    console.warn('greytHR tab not found!');
  }

  // 2. Capture Local IndiaPay at 1920x1080
  const localTab = tabs.find(t => t.url && t.url.includes('localhost:3000')) || tabs[0];
  if (localTab) {
    console.log('Capturing IndiaPay local...');
    const ws = new WebSocket(localTab.webSocketDebuggerUrl);
    await new Promise(r => ws.on('open', r));

    await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/admin/payroll' });
    await new Promise(r => setTimeout(r, 4000));
    await sendCDP(ws, 'Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
    await new Promise(r => setTimeout(r, 1000));

    const shot = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${outDir}/local-indiapay-payroll-1920x1080.png`, Buffer.from(shot.data, 'base64'));
    console.log('Saved local-indiapay-payroll-1920x1080.png');
    ws.close();
  }
}

run().catch(console.error);
