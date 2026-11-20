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

  const outDir = 'C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/docs/greythr-welcome-reference/phase-6-10';
  const imgRefPath = `${outDir}/reference-greythr-welcome-fresh-1920x1080.png`;
  const imgLocPath = `${outDir}/local-indiapay-welcome-1920x1080.png`;

  const refB64 = fs.readFileSync(imgRefPath).toString('base64');
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

      // Overlay 50%
      const cOverlay = document.createElement('canvas');
      cOverlay.width = w; cOverlay.height = h;
      const ctxO = cOverlay.getContext('2d');
      ctxO.globalAlpha = 1.0;
      ctxO.drawImage(imgRef, 0, 0);
      ctxO.globalAlpha = 0.5;
      ctxO.drawImage(imgLocal, 0, 0);
      const overlayData = cOverlay.toDataURL('image/png').split(',')[1];

      // Difference
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

      const cDiff = document.createElement('canvas');
      cDiff.width = w; cDiff.height = h;
      const ctxD = cDiff.getContext('2d');
      const diffImg = ctxD.createImageData(w, h);
      const dOut = diffImg.data;

      let diffPixels = 0;
      const totalPixels = w * h;

      for (let i = 0; i < dRef.length; i += 4) {
        const rDiff = Math.abs(dRef[i] - dLoc[i]);
        const gDiff = Math.abs(dRef[i+1] - dLoc[i+1]);
        const bDiff = Math.abs(dRef[i+2] - dLoc[i+2]);
        const isDiff = (rDiff + gDiff + bDiff) > 30;

        if (isDiff) {
          diffPixels++;
          dOut[i] = 255;
          dOut[i+1] = 0;
          dOut[i+2] = 0;
          dOut[i+3] = 255;
        } else {
          dOut[i] = Math.round(dRef[i] * 0.3);
          dOut[i+1] = Math.round(dRef[i+1] * 0.3);
          dOut[i+2] = Math.round(dRef[i+2] * 0.3);
          dOut[i+3] = 255;
        }
      }
      ctxD.putImageData(diffImg, 0, 0);
      const diffData = cDiff.toDataURL('image/png').split(',')[1];

      const similarity = ((totalPixels - diffPixels) / totalPixels) * 100;

      return {
        overlayData,
        diffData,
        totalPixels,
        diffPixels,
        similarity: similarity.toFixed(2) + '%'
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  const res = result.result.value;
  console.log(`Phase 6.10 Welcome Visual Comparison:`);
  console.log(`Total Pixels: ${res.totalPixels}`);
  console.log(`Different Pixels: ${res.diffPixels}`);
  console.log(`Visual Similarity Match: ${res.similarity}`);

  fs.writeFileSync(`${outDir}/welcome-overlay-50-percent.png`, Buffer.from(res.overlayData, 'base64'));
  fs.writeFileSync(`${outDir}/welcome-pixel-difference.png`, Buffer.from(res.diffData, 'base64'));
  fs.writeFileSync(`${outDir}/welcome-comparison-metrics.json`, JSON.stringify({
    totalPixels: res.totalPixels,
    diffPixels: res.diffPixels,
    similarity: res.similarity,
    timestamp: new Date().toISOString()
  }, null, 2));

  console.log('Saved overlay and difference images.');
  ws.close();
}

run().catch(console.error);
