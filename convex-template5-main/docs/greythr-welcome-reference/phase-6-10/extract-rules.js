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
      const styleSheets = Array.from(document.styleSheets);
      const matchedRules = [];
      for (const sheet of styleSheets) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule.selectorText && (
              rule.selectorText.includes('welcome-container') ||
              rule.selectorText.includes('widget-container') ||
              rule.selectorText.includes('main-container') ||
              rule.selectorText.includes('image-container') ||
              rule.selectorText.includes('my-tasks') ||
              rule.selectorText.includes('latest-updates')
            )) {
              matchedRules.push(rule.cssText);
            }
          }
        } catch (e) {}
      }
      return matchedRules.slice(0, 50).join('\\n\\n');
    })()`
  });

  console.log(info.result.value);
  ws.close();
}

run().catch(console.error);
