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

  console.log('Testing sign in with admin@indiapaypayroll.com / AdminTest@2026!...');

  const result = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(async () => {
      // Find email input
      const emailInput = document.querySelector('input[type="email"]');
      const passInput = document.querySelector('input[type="password"]');
      const signInBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.trim() === 'Sign in');

      if (!emailInput || !passInput || !signInBtn) {
        return { error: 'elements not found' };
      }

      // Fill in values using React value setter
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(emailInput, 'admin@indiapaypayroll.com');
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));

      nativeInputValueSetter.call(passInput, 'AdminTest@2026!');
      passInput.dispatchEvent(new Event('input', { bubbles: true }));

      signInBtn.click();

      // Wait a few seconds
      await new Promise(r => setTimeout(r, 4000));

      const errorEl = document.querySelector('.text-red-500, [class*="red"]');

      return {
        url: window.location.href,
        title: document.title,
        errorMessage: errorEl ? errorEl.innerText : null
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Result:', JSON.stringify(result.result.value, null, 2));
  ws.close();
}

run().catch(console.error);
