const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

function getSvg(innerScale = 0.6) {
  // SVG viewBox is 0 0 100 100
  // CRMate Official Logo Geometry:
  // Top Wing: M 52 16 L 80 28 (#8FC2F0)
  // Bottom Wing: M 52 84 L 80 72 (#8FC2F0)
  // C-Chevron: M 52 16 L 20 50 L 52 84 (#FFFFFF)
  // Dot: circle cx 58 cy 50 r 9.5 (#77CE69)
  return `
    <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 52 16 L 80 28" stroke="#8FC2F0" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 52 84 L 80 72" stroke="#8FC2F0" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 52 16 L 20 50 L 52 84" stroke="#FFFFFF" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="58" cy="50" r="9.5" fill="#77CE69" />
    </svg>
  `;
}

function getHtml(size, isMaskable = false, borderRadius = 0) {
  // For maskable, Android requires full bleed background and the core symbol within the safe zone (middle 60-70%).
  // For standard icons, a neat rounded squircle or solid background with comfortable padding is standard.
  const symbolScale = isMaskable ? 0.60 : 0.68;
  const symbolSize = Math.round(size * symbolScale);
  const br = borderRadius > 0 ? `${borderRadius}px` : '0px';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            width: ${size}px;
            height: ${size}px;
            overflow: hidden;
            background: transparent;
          }
          .container {
            width: ${size}px;
            height: ${size}px;
            background-color: #292D32;
            border-radius: ${br};
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .icon-wrapper {
            width: ${symbolSize}px;
            height: ${symbolSize}px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon-wrapper">
            ${getSvg()}
          </div>
        </div>
      </body>
    </html>
  `;
}

async function generateIcons() {
  console.log('Launching browser to render CRMate PWA icons...');
  const browser = await chromium.launch({ headless: true });

  const iconConfigs = [
    {
      name: 'icon-192x192.png',
      size: 192,
      isMaskable: false,
      borderRadius: 40, // modern rounded square
    },
    {
      name: 'icon-512x512.png',
      size: 512,
      isMaskable: false,
      borderRadius: 106, // proportional rounded square
    },
    {
      name: 'icon-maskable-192x192.png',
      size: 192,
      isMaskable: true,
      borderRadius: 0, // full-bleed solid background for maskable
    },
    {
      name: 'icon-maskable-512x512.png',
      size: 512,
      isMaskable: true,
      borderRadius: 0, // full-bleed solid background for maskable
    },
    {
      name: 'apple-touch-icon.png',
      size: 180,
      isMaskable: false,
      borderRadius: 0, // iOS automatically clips icons, square solid bg recommended
    },
  ];

  for (const config of iconConfigs) {
    const page = await browser.newPage({
      viewport: { width: config.size, height: config.size },
      deviceScaleFactor: 1,
    });

    const htmlContent = getHtml(config.size, config.isMaskable, config.borderRadius);
    await page.setContent(htmlContent);

    const outPath = path.join(iconsDir, config.name);
    await page.screenshot({
      path: outPath,
      omitBackground: false,
      type: 'png',
    });

    const stats = fs.statSync(outPath);
    console.log(`Generated ${config.name} (${config.size}x${config.size}) - ${stats.size} bytes`);
    await page.close();
  }

  await browser.close();
  console.log('All PWA icons generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
