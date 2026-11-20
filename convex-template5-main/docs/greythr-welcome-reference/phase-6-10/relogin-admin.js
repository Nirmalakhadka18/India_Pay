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

  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/login' });
  await new Promise(r => setTimeout(r, 2000));

  // Fill in admin credentials
  await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const emailInput = document.querySelector('input[type="email"], input[name="email"], input[placeholder*="email" i]');
      const passInput = document.querySelector('input[type="password"], input[name="password"]');
      const submitBtn = document.querySelector('button[type="submit"]');

      if (emailInput && passInput) {
        emailInput.value = 'admin@indiapaypayroll.com';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        passInput.value = 'AdminTest@2026!';
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
        if (submitBtn) submitBtn.click();
        return 'Submitted form';
      }
      return 'Inputs not found';
    })()`
  });

  await new Promise(r => setTimeout(r, 4000));

  const check = await sendCDP(ws, 'Runtime.evaluate', {
    expression: 'window.location.href'
  });
  console.log('After login URL:', check.result.value);

  ws.close();
}

run().catch(console.error);
