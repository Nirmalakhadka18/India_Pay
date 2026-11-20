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
      const dump = (el) => {
        if (!el) return null;
        const s = window.getComputedStyle(el);
        return {
          display: s.display,
          position: s.position,
          flexDirection: s.flexDirection,
          justifyContent: s.justifyContent,
          alignItems: s.alignItems,
          width: s.width,
          maxWidth: s.maxWidth,
          height: s.height,
          padding: s.padding,
          margin: s.margin,
          gap: s.gap,
          background: s.background
        };
      };

      return JSON.stringify({
        welcomeContainer: dump(document.querySelector('.welcome-container')),
        greetingContainer: dump(document.querySelector('.greeting-container')),
        greetingMessage: dump(document.querySelector('.greeting-message')),
        imageContainer: dump(document.querySelector('.image-container')),
        widgetContainer: dump(document.querySelector('.widget-container')),
        mainContainer: dump(document.querySelector('.main-container')),
        latestUpdatesContainer: dump(document.querySelector('.latest-updates-container'))
      }, null, 2);
    })()`
  });

  console.log(info.result.value);
  ws.close();
}

run().catch(console.error);
