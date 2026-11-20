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

  // 1. Clear session from localStorage
  await sendCDP(ws, 'Runtime.evaluate', {
    expression: 'localStorage.clear()'
  });
  console.log('Cleared localStorage');

  // 2. Navigate to /login
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/login' });
  await new Promise(r => setTimeout(r, 3000));

  // 3. Verify on login page
  const pageCheck = await sendCDP(ws, 'Runtime.evaluate', {
    expression: '({ url: window.location.href, inputs: document.querySelectorAll("input").length, text: document.body.innerText })',
    returnByValue: true
  });
  console.log('Page check after navigating to /login:');
  console.log(JSON.stringify(pageCheck.result.value, null, 2));

  // 4. Submit user login
  const loginRes = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(async () => {
      const emailInput = document.querySelector('input[type="email"], input[name="email"]');
      const passInput = document.querySelector('input[type="password"], input[name="password"]');
      const submitBtn = document.querySelector('button[type="submit"]');

      if (!emailInput || !passInput || !submitBtn) return { error: 'form elements not found' };

      emailInput.value = 'user@indiapaypayroll.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      passInput.value = 'UserTest@2026!';
      passInput.dispatchEvent(new Event('input', { bubbles: true }));

      submitBtn.click();
      await new Promise(r => setTimeout(r, 4000));
      return {
        url: window.location.href,
        text: document.body.innerText
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Login attempt result:');
  console.log(JSON.stringify(loginRes.result.value, null, 2));

  ws.close();
}

run().catch(console.error);
