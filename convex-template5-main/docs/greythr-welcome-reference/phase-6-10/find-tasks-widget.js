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

  const greyTab = tabs.find(t => t.url && t.url.includes('victorchasex.greythr.com'));
  const ws = new WebSocket(greyTab.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  const info = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const headings = Array.from(document.querySelectorAll('*')).filter(el => el.innerText && el.innerText.trim() === 'My Tasks');
      if (headings.length === 0) return 'No My Tasks found';
      const h = headings[0];
      const widget = h.closest('.ng-scope, [class*="widget"], div');
      return {
        hTag: h.tagName,
        hClass: h.className,
        widgetHTML: widget ? widget.parentElement.innerHTML.slice(0, 3000) : null
      };
    })()`,
    returnByValue: true
  });

  console.log(info.result.value);
  ws.close();
}

run().catch(console.error);
