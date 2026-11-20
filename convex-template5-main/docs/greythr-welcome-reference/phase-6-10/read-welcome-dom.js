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

  const greyTab = tabs.find(t => t.id === '9BE78206571C4B838AA7D7999D0E6AE9');
  const ws = new WebSocket(greyTab.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  const dom = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      // Find segmented switcher
      const switcher = Array.from(document.querySelectorAll('*')).find(el => {
        return el.innerText && el.innerText.includes('Welcome') && el.innerText.includes('Dashboard') && el.children.length === 2;
      });

      // Find all main headings and containers
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => ({
        tag: h.tagName,
        text: h.innerText.trim(),
        rect: h.getBoundingClientRect()
      }));

      // Find images
      const images = Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        rect: img.getBoundingClientRect()
      }));

      return {
        switcherRect: switcher ? switcher.getBoundingClientRect() : null,
        headings,
        images
      };
    })()`,
    returnByValue: true
  });

  console.log(JSON.stringify(dom.result.value, null, 2));
  ws.close();
}

run().catch(console.error);
