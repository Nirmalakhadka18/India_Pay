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
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const greyTab = tabs.find(t => t.id === '9BE78206571C4B838AA7D7999D0E6AE9');
  const ws = new WebSocket(greyTab.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  // Find the exact button element for 'Information' and dispatch mouseenter/mouseover/click
  const triggerRes = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const host = document.querySelector('#gt-nav-bar-shadow');
      const sr = host.shadowRoot;
      const btn = Array.from(sr.querySelectorAll('button')).find(b => b.innerText && b.innerText.trim() === 'Information');
      if (!btn) return { error: 'not found' };

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      btn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      return {
        id: btn.id,
        className: btn.className,
        rect: btn.getBoundingClientRect()
      };
    })()`,
    returnByValue: true
  });

  console.log('Trigger result:', triggerRes.result.value);

  await new Promise(r => setTimeout(r, 1000));

  // Now check popover-content-payroll-info
  const contentRes = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const host = document.querySelector('#gt-nav-bar-shadow');
      const sr = host.shadowRoot;
      const sec = sr.querySelector('#popover-content-payroll-info');
      if (!sec) return { error: 'section not found' };

      return {
        innerHTML: sec.innerHTML,
        text: sec.innerText,
        links: Array.from(sec.querySelectorAll('a, button, li')).map(el => ({
          text: el.innerText.trim(),
          href: el.getAttribute('href')
        }))
      };
    })()`,
    returnByValue: true
  });

  console.log('Information popover content:', JSON.stringify(contentRes.result.value, null, 2));

  ws.close();
}

run().catch(console.error);
