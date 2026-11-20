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
      const els = Array.from(document.querySelectorAll('*'));
      const welcome = els.find(e => e.innerText && e.innerText.trim() === 'Welcome' && e.children.length === 0);
      if (!welcome) return 'Welcome not found';
      const p = welcome.parentElement;
      const gp = p ? p.parentElement : null;
      return {
        welcomeTag: welcome.tagName,
        welcomeClass: welcome.className,
        welcomeParentTag: p ? p.tagName : null,
        welcomeParentClass: p ? p.className : null,
        parentHTML: p ? p.outerHTML : null,
        grandParentHTML: gp ? gp.outerHTML : null
      };
    })()`,
    returnByValue: true
  });

  console.log('Switcher element info:', JSON.stringify(info.result.value, null, 2));

  // Now trigger click on welcome element specifically
  const click = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const els = Array.from(document.querySelectorAll('*'));
      const welcome = els.find(e => e.innerText && e.innerText.trim() === 'Welcome' && e.children.length === 0);
      if (welcome) {
        welcome.click();
        if (welcome.parentElement) welcome.parentElement.click();
        return 'Clicked!';
      }
      return 'Not found';
    })()`,
    returnByValue: true
  });
  console.log('Click result:', click.result.value);

  ws.close();
}

run().catch(console.error);
