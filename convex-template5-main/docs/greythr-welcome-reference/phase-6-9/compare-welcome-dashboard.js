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

  const tab = tabs[0];
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  const outDir = 'C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/docs/greythr-welcome-reference/phase-6-9';

  // Function to process comparison
  async function compareImages(imgRefPath, imgLocPath, prefix) {
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

        // Overlay
        const cOverlay = document.createElement('canvas');
        cOverlay.width = w; cOverlay.height = h;
        const ctxO = cOverlay.getContext('2d');
        ctxO.globalAlpha = 1.0;
        ctxO.drawImage(imgRef, 0, 0);
        ctxO.globalAlpha = 0.5;
        ctxO.drawImage(imgLocal, 0, 0);
        const overlayData = cOverlay.toDataURL('image/png').split(',')[1];

        // Diff
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

    const { overlayData, diffData, metrics } = result.result.value;
    fs.writeFileSync(`${outDir}/${prefix}-overlay-50-percent.png`, Buffer.from(overlayData, 'base64'));
    fs.writeFileSync(`${outDir}/${prefix}-pixel-difference.png`, Buffer.from(diffData, 'base64'));
    fs.writeFileSync(`${outDir}/${prefix}-comparison-metrics.json`, JSON.stringify(metrics, null, 2));

    const artDir = 'C:/Users/nirma/.gemini/antigravity/brain/dfff8ff6-9284-4952-899a-e09c886e427e';
    fs.writeFileSync(`${artDir}/${prefix}-overlay-50-percent.png`, Buffer.from(overlayData, 'base64'));
    fs.writeFileSync(`${artDir}/${prefix}-pixel-difference.png`, Buffer.from(diffData, 'base64'));

    console.log(`${prefix} Metrics:`, metrics);
  }

  console.log('Comparing Welcome tab...');
  await compareImages(`${outDir}/reference-greythr-welcome-1920x1080.png`, `${outDir}/local-indiapay-welcome-1920x1080.png`, 'welcome');

  console.log('Comparing Dashboard tab...');
  await compareImages(`${outDir}/reference-greythr-dashboard-1920x1080.png`, `${outDir}/local-indiapay-dashboard-1920x1080.png`, 'dashboard');

  ws.close();
}

run().catch(console.error);
