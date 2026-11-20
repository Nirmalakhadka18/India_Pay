const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const outDir = 'C:/Users/nirma/Downloads/Indian_payroll_system/convex-template5-main/docs/greythr-payroll-reference/phase-9-1';
const refPath = path.join(outDir, 'reference-greythr-payroll-1920x1080.png');
const localPath = path.join(outDir, 'local-indiapay-payroll-1920x1080.png');

const img1 = PNG.sync.read(fs.readFileSync(refPath));
const img2 = PNG.sync.read(fs.readFileSync(localPath));

const width = Math.min(img1.width, img2.width);
const height = Math.min(img1.height, img2.height);

const diff = new PNG({ width, height });
const overlay = new PNG({ width, height });

let diffCount = 0;
const totalPixels = width * height;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (width * y + x) << 2;

    const r1 = img1.data[idx];
    const g1 = img1.data[idx + 1];
    const b1 = img1.data[idx + 2];
    const a1 = img1.data[idx + 3];

    const r2 = img2.data[idx];
    const g2 = img2.data[idx + 1];
    const b2 = img2.data[idx + 2];
    const a2 = img2.data[idx + 3];

    // Overlay: 50% opacity blend
    overlay.data[idx] = Math.round(r1 * 0.5 + r2 * 0.5);
    overlay.data[idx + 1] = Math.round(g1 * 0.5 + g2 * 0.5);
    overlay.data[idx + 2] = Math.round(b1 * 0.5 + b2 * 0.5);
    overlay.data[idx + 3] = 255;

    // Diff: Calculate Euclidean distance or threshold
    const dr = Math.abs(r1 - r2);
    const dg = Math.abs(g1 - g2);
    const db = Math.abs(b1 - b2);

    if (dr > 15 || dg > 15 || db > 15) {
      diffCount++;
      // Mark diff in red
      diff.data[idx] = 255;
      diff.data[idx + 1] = 0;
      diff.data[idx + 2] = 0;
      diff.data[idx + 3] = 255;
    } else {
      // Subdued grayscale for matching pixels
      const gray = Math.round((r1 + g1 + b1) / 3 * 0.3);
      diff.data[idx] = gray;
      diff.data[idx + 1] = gray;
      diff.data[idx + 2] = gray;
      diff.data[idx + 3] = 255;
    }
  }
}

fs.writeFileSync(path.join(outDir, 'overlay-50-percent.png'), PNG.sync.write(overlay));
fs.writeFileSync(path.join(outDir, 'pixel-difference.png'), PNG.sync.write(diff));

const matchPercentage = (((totalPixels - diffCount) / totalPixels) * 100).toFixed(2);
const metrics = {
  width,
  height,
  totalPixels,
  matchingPixels: totalPixels - diffCount,
  diffPixels: diffCount,
  matchPercentage: `${matchPercentage}%`
};

fs.writeFileSync(path.join(outDir, 'comparison-metrics.json'), JSON.stringify(metrics, null, 2));
console.log('Metrics:', metrics);
