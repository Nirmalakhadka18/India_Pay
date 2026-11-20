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
      // Dump text and hierarchy of main container
      const container = document.querySelector('#cougar-container') || document.body;
      const sections = Array.from(container.children).map(c => ({
        tag: c.tagName,
        className: c.className,
        id: c.id,
        textPreview: c.innerText ? c.innerText.substring(0, 300).replace(/\\n+/g, ' ') : ''
      }));

      // Look at month navbar classes
      const monthNav = document.querySelector('.month-nav, [class*="month"]');
      const monthParent = monthNav ? monthNav.parentElement : null;

      // Look at Payout Details
      const payoutH3 = Array.from(document.querySelectorAll('h3, h4')).find(h => h.innerText && h.innerText.includes('Payout Details'));
      const payoutCard = payoutH3 ? payoutH3.closest('.card, .row-fluid, div') : null;

      return {
        sections,
        monthNavHTML: monthParent ? monthParent.outerHTML.substring(0, 1000) : '',
        payoutCardHTML: payoutCard ? payoutCard.outerHTML.substring(0, 1500) : ''
      };
    })()`,
    returnByValue: true
  });

  console.log(JSON.stringify(result.result.value, null, 2));
  ws.close();
}

run().catch(console.error);
