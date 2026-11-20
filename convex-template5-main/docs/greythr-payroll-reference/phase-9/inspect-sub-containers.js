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
      const container = document.querySelector('#cougar-container');
      const allDivs = Array.from(container.querySelectorAll('.row-fluid, .widget-box, .widget-content, .card, [class*="payroll"]')).map(el => ({
        tag: el.tagName,
        class: el.className,
        text: el.innerText ? el.innerText.substring(0, 150).replace(/\\n+/g, ' ').trim() : ''
      })).filter(x => x.text.length > 5);

      return allDivs.slice(0, 25);
    })()`,
    returnByValue: true
  });

  console.log(JSON.stringify(result.result.value, null, 2));
  ws.close();
}

run().catch(console.error);
