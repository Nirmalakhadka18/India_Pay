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
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });

  const outDir = 'C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/docs/greythr-welcome-reference/phase-6-9';

  // 1. greytHR Tab
  const greyTab = tabs.find(t => t.url && t.url.includes('victorchasex.greythr.com'));
  if (greyTab) {
    console.log('Capturing greytHR Welcome & Dashboard...');
    const ws = new WebSocket(greyTab.webSocketDebuggerUrl);
    await new Promise(r => ws.on('open', r));

    await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });

    // Navigate to greytHR home
    await sendCDP(ws, 'Page.navigate', { url: 'https://victorchasex.greythr.com/home#/' });
    await new Promise(r => setTimeout(r, 4000));

    // Capture Welcome
    const shotWelcome = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${outDir}/reference-greythr-welcome-1920x1080.png`, Buffer.from(shotWelcome.data, 'base64'));
    console.log('Saved reference-greythr-welcome-1920x1080.png');

    // Click Dashboard tab if exists
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `(() => {
        const dBtn = Array.from(document.querySelectorAll('button, a, div, span')).find(el => el.innerText && el.innerText.trim() === 'Dashboard');
        if (dBtn) dBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 3000));

    // Capture Dashboard
    const shotDashboard = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${outDir}/reference-greythr-dashboard-1920x1080.png`, Buffer.from(shotDashboard.data, 'base64'));
    console.log('Saved reference-greythr-dashboard-1920x1080.png');

    ws.close();
  }

  // 2. Local Tab
  const localTab = tabs.find(t => t.url && t.url.includes('localhost:3000')) || tabs[0];
  if (localTab) {
    console.log('Capturing IndiaPay Welcome & Dashboard...');
    const ws = new WebSocket(localTab.webSocketDebuggerUrl);
    await new Promise(r => ws.on('open', r));

    await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });

    // Navigate to admin
    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/admin' });
    await new Promise(r => setTimeout(r, 4000));

    // Capture Welcome
    const shotWelcome = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${outDir}/local-indiapay-welcome-1920x1080.png`, Buffer.from(shotWelcome.data, 'base64'));
    console.log('Saved local-indiapay-welcome-1920x1080.png');

    // Switch to Dashboard tab
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `(() => {
        const dBtn = Array.from(document.querySelectorAll('button')).find(el => el.innerText && el.innerText.trim() === 'Dashboard');
        if (dBtn) dBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1500));

    // Capture Dashboard
    const shotDashboard = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${outDir}/local-indiapay-dashboard-1920x1080.png`, Buffer.from(shotDashboard.data, 'base64'));
    console.log('Saved local-indiapay-dashboard-1920x1080.png');

    ws.close();
  }
}

run().catch(console.error);
