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

  const result = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      // Look for floating elements (like What's New or chat)
      const allFixed = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        return (style.position === 'fixed' || style.position === 'absolute') && 
               el.getBoundingClientRect().bottom > 500 &&
               el.getBoundingClientRect().right > 500 &&
               el.innerText && el.innerText.length < 50;
      }).map(el => ({
        tag: el.tagName,
        text: el.innerText.trim(),
        class: el.className,
        rect: el.getBoundingClientRect(),
        bg: window.getComputedStyle(el).backgroundColor,
        color: window.getComputedStyle(el).color
      }));

      // Look at shadow DOM if any
      const host = document.querySelector('#gt-nav-bar-shadow');
      let shadowFixed = [];
      if (host && host.shadowRoot) {
        shadowFixed = Array.from(host.shadowRoot.querySelectorAll('*')).filter(el => {
          const style = window.getComputedStyle(el);
          return style.position === 'fixed' || style.position === 'absolute';
        }).map(el => ({
          tag: el.tagName,
          text: el.innerText ? el.innerText.trim() : '',
          class: el.className,
          rect: el.getBoundingClientRect()
        }));
      }

      return {
        allFixed: allFixed.slice(0, 15),
        shadowFixed: shadowFixed.slice(0, 10)
      };
    })()`,
    returnByValue: true
  });

  console.log('Fixed widgets:', JSON.stringify(result.result.value, null, 2));
  ws.close();
}

run().catch(console.error);
