const WebSocket = require('C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/node_modules/ws');
const http = require('http');
const fs = require('fs');

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

  const tab = tabs.find(t => t.url && t.url.includes('localhost:3000')) || tabs[0];
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  const p69Ref = 'C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/docs/greythr-welcome-reference/phase-6-9/reference-greythr-welcome-1920x1080.png';
  const imgLocPath = 'C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/docs/greythr-welcome-reference/phase-6-10/local-indiapay-welcome-1920x1080.png';

  const refB64 = fs.readFileSync(p69Ref).toString('base64');
  const locB64 = fs.readFileSync(imgLocPath).toString('base64');

  const result = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(async () => {
      const loadImg = (b64) => new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = 'data:image/png;base64,' + b64;
      });

      const [imgRef, imgLocal] = await Promise.all([loadImg('${refB64}'), loadImg('${locB64}')]);
      const w = 1920, h = 1080;

      const cRef = document.createElement('canvas');
      cRef.width = w; cRef.height = h;
      const ctxR = cRef.getContext('2d');
      ctxR.drawImage(imgRef, 0, 0);
      const dRef = ctxR.getImageData(0, 0, w, h).data;

      const cLoc = document.createElement('canvas');
      cLoc.width = w; cLoc.height = h;
      const ctxL = cLoc.getContext('2d');
      ctxL.drawImage(imgLocal, 0, 0);
      const dLoc = ctxL.getImageData(0, 0, w, h).data;

      let diffPixels = 0;
      const totalPixels = w * h;

      for (let i = 0; i < dRef.length; i += 4) {
        const rDiff = Math.abs(dRef[i] - dLoc[i]);
        const gDiff = Math.abs(dRef[i+1] - dLoc[i+1]);
        const bDiff = Math.abs(dRef[i+2] - dLoc[i+2]);
        if ((rDiff + gDiff + bDiff) > 30) diffPixels++;
      }

      return {
        totalPixels,
        diffPixels,
        similarity: (((totalPixels - diffPixels) / totalPixels) * 100).toFixed(2) + '%'
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Comparison against Phase 6.9 reference:', JSON.stringify(result.result.value));
  ws.close();
}

run().catch(console.error);
