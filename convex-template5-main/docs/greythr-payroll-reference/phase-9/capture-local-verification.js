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

  const localTab = tabs.find(t => t.id === 'D4375D5F586C394D1A869853CFC737FC') || tabs.find(t => t.url.includes('localhost:3000'));
  console.log('Connecting to local app tab:', localTab ? localTab.webSocketDebuggerUrl : 'not found');
  if (!localTab) return;

  const ws = new WebSocket(localTab.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  console.log('Navigating to http://localhost:3000/admin/payroll...');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/admin/payroll' });
  await new Promise(r => setTimeout(r, 4000));

  await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 1000));

  // 1. Capture Overview
  const shot1 = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  const outDir = 'C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/docs/greythr-payroll-reference/phase-9';
  fs.writeFileSync(`${outDir}/indiapay-payroll-overview-1920x1080.png`, Buffer.from(shot1.data, 'base64'));
  fs.writeFileSync('C:/Users/nirma/.gemini/antigravity/brain/dfff8ff6-9284-4952-899a-e09c886e427e/indiapay-payroll-overview-1920x1080.png', Buffer.from(shot1.data, 'base64'));
  console.log('Saved indiapay-payroll-overview-1920x1080.png');

  // 2. Hover over "Payroll Inputs" to open flyout menu and capture
  await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Payroll Inputs'));
      if (btn) {
        btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  const shot2 = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${outDir}/indiapay-payroll-inputs-menu-1920x1080.png`, Buffer.from(shot2.data, 'base64'));
  fs.writeFileSync('C:/Users/nirma/.gemini/antigravity/brain/dfff8ff6-9284-4952-899a-e09c886e427e/indiapay-payroll-inputs-menu-1920x1080.png', Buffer.from(shot2.data, 'base64'));
  console.log('Saved indiapay-payroll-inputs-menu-1920x1080.png');

  // 3. Hover over "Payout" to open flyout menu and capture
  await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Payout'));
      if (btn) {
        btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  const shot3 = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${outDir}/indiapay-payroll-payout-menu-1920x1080.png`, Buffer.from(shot3.data, 'base64'));
  fs.writeFileSync('C:/Users/nirma/.gemini/antigravity/brain/dfff8ff6-9284-4952-899a-e09c886e427e/indiapay-payroll-payout-menu-1920x1080.png', Buffer.from(shot3.data, 'base64'));
  console.log('Saved indiapay-payroll-payout-menu-1920x1080.png');

  ws.close();
}

run().catch(console.error);
