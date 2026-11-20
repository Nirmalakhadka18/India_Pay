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
      const skyline = document.querySelector('img[src*="illustration"], img[src*="home"], img[src*="morning"], [class*="illustration"], [class*="skyline"]');
      const allImgs = Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        rect: img.getBoundingClientRect()
      }));
      const welcomeContainer = document.querySelector('#welcome, .welcome-container, [id*=\"welcome\"]');
      const welcomeStyle = welcomeContainer ? window.getComputedStyle(welcomeContainer) : null;
      return {
        allImgs,
        welcomeBg: welcomeStyle ? welcomeStyle.backgroundImage || welcomeStyle.backgroundColor : null,
        welcomeClasses: welcomeContainer ? welcomeContainer.className : null
      };
    })()`,
    returnByValue: true
  });

  console.log('Images and styles:', JSON.stringify(info.result.value, null, 2));
  ws.close();
}

run().catch(console.error);
