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
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const tab = tabs[0];
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  const outDir = 'C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/docs/greythr-payroll-reference/phase-9-1';
  const refB64 = fs.readFileSync(`${outDir}/reference-greythr-payroll-1920x1080.png`).toString('base64');
  const localB64 = fs.readFileSync(`${outDir}/local-indiapay-payroll-1920x1080.png`).toString('base64');

  const result = await sendCDP(ws, 'Runtime.evaluate', {
    expression: `(async () => {
      const loadImg = (b64) => new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = 'data:image/png;base64,' + b64;
      });

      const [imgRef, imgLocal] = await Promise.all([loadImg('${refB64}'), loadImg('${localB64}')]);
      const w = 1920, h = 1080;

      // 1. Overlay (50% opacity)
      const cOverlay = document.createElement('canvas');
      cOverlay.width = w; cOverlay.height = h;
      const ctxO = cOverlay.getContext('2d');
      ctxO.globalAlpha = 1.0;
      ctxO.drawImage(imgRef, 0, 0);
      ctxO.globalAlpha = 0.5;
      ctxO.drawImage(imgLocal, 0, 0);
      const overlayData = cOverlay.toDataURL('image/png').split(',')[1];

      // 2. Pixel Difference
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
      const imgDataDiff = ctxD.createImageData(w, h);
      const dDiff = imgDataDiff.data;

      let diffCount = 0;
      const totalPixels = w * h;

      for (let i = 0; i < dRef.length; i += 4) {
        const dr = Math.abs(dRef[i] - dLoc[i]);
        const dg = Math.abs(dRef[i+1] - dLoc[i+1]);
        const db = Math.abs(dRef[i+2] - dLoc[i+2]);

        if (dr > 25 || dg > 25 || db > 25) {
          diffCount++;
          dDiff[i] = 255;
          dDiff[i+1] = 0;
          dDiff[i+2] = 0;
          dDiff[i+3] = 255;
        } else {
          const gray = Math.round((dRef[i] + dRef[i+1] + dRef[i+2]) / 3 * 0.25);
          dDiff[i] = gray;
          dDiff[i+1] = gray;
          dDiff[i+2] = gray;
          dDiff[i+3] = 255;
        }
      }

      ctxD.putImageData(imgDataDiff, 0, 0);
      const diffData = cDiff.toDataURL('image/png').split(',')[1];
      const matchPct = (((totalPixels - diffCount) / totalPixels) * 100).toFixed(2);

      return {
        overlayData,
        diffData,
        metrics: {
          totalPixels,
          matchingPixels: totalPixels - diffCount,
          diffPixels: diffCount,
          matchPercentage: matchPct + '%'
        }
      };
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  if (result.result.value) {
    const { overlayData, diffData, metrics } = result.result.value;
    fs.writeFileSync(`${outDir}/overlay-50-percent.png`, Buffer.from(overlayData, 'base64'));
    fs.writeFileSync(`${outDir}/pixel-difference.png`, Buffer.from(diffData, 'base64'));
    fs.writeFileSync(`${outDir}/comparison-metrics.json`, JSON.stringify(metrics, null, 2));

    // Also copy to artifacts dir
    const artDir = 'C:/Users/nirma/.gemini/antigravity/brain/dfff8ff6-9284-4952-899a-e09c886e427e';
    fs.writeFileSync(`${artDir}/overlay-50-percent.png`, Buffer.from(overlayData, 'base64'));
    fs.writeFileSync(`${artDir}/pixel-difference.png`, Buffer.from(diffData, 'base64'));

    console.log('Comparison metrics:', metrics);
    console.log('Saved overlay and difference images successfully.');
  }

  ws.close();
}

run().catch(console.error);
