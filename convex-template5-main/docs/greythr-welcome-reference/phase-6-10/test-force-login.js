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

  // Clear browser cookies via CDP Network domain
  await sendCDP(ws, 'Network.clearBrowserCookies');
  await sendCDP(ws, 'Runtime.evaluate', { expression: 'localStorage.clear(); sessionStorage.clear();' });
  console.log('Cleared all cookies and web storage');

  // Navigate to login?force=1
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/login?force=1' });
  await new Promise(r => setTimeout(r, 3000));

  const check = await sendCDP(ws, 'Runtime.evaluate', {
    expression: '({ url: window.location.href, inputs: document.querySelectorAll("input").length, text: document.body.innerText })',
    returnByValue: true
  });
  console.log('Login page check:');
  console.log(JSON.stringify(check.result.value, null, 2));

  // Try signing in as user
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

  console.log('User login attempt result:');
  console.log(JSON.stringify(loginRes.result.value, null, 2));

  ws.close();
}

run().catch(console.error);
