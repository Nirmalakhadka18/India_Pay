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

  const tab = tabs.find(t => t.id === 'D4375D5F586C394D1A869853CFC737FC') || tabs[0];
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  console.log('Navigating to http://localhost:3000/login...');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/login' });
  await new Promise(r => setTimeout(r, 3000));

  const loginRes = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(async () => {
      const emailInput = document.querySelector('input[type="email"]');
      const passInput = document.querySelector('input[type="password"]');
      const signInBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.trim() === 'Sign in');

      if (!emailInput || !passInput || !signInBtn) {
        return { error: 'elements missing' };
      }

      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(emailInput, 'admin@indiapaypayroll.com');
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));

      setter.call(passInput, 'AdminTest@2026!');
      passInput.dispatchEvent(new Event('input', { bubbles: true }));

      signInBtn.click();
      await new Promise(r => setTimeout(r, 4000));

      return {
        url: window.location.href,
        title: document.title,
        bodyTextSnippet: document.body.innerText.substring(0, 200).replace(/\\n+/g, ' ')
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Login result:', JSON.stringify(loginRes.result.value, null, 2));

  // Now navigate to /admin/payroll
  console.log('Navigating to /admin/payroll...');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/admin/payroll' });
  await new Promise(r => setTimeout(r, 3500));

  const payrollState = await sendCDP(ws, 'Runtime.evaluate', {
    expression: '({ url: window.location.href, title: document.title, headings: Array.from(document.querySelectorAll("h1, h2, h3, h4")).map(h => h.innerText) })',
    returnByValue: true
  });

  console.log('Payroll state:', JSON.stringify(payrollState.result.value, null, 2));

  ws.close();
}

run().catch(console.error);
