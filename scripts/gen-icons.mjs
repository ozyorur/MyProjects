import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

mkdirSync('public/icons', { recursive: true })

const svg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3390fb"/>
      <stop offset="1" stop-color="#175adc"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <g fill="#ffffff">
    <rect x="150" y="96" width="212" height="320" rx="16" fill="#ffffff" opacity="0.96"/>
    <path d="M150 112a16 16 0 0 1 16-16h180a16 16 0 0 1 16 16v18H150z" fill="#eaf2ff"/>
    <g fill="#1b70f0">
      <rect x="180" y="150" width="152" height="14" rx="7"/>
      <rect x="180" y="182" width="120" height="14" rx="7"/>
      <rect x="180" y="228" width="152" height="10" rx="5" opacity="0.6"/>
      <rect x="180" y="252" width="152" height="10" rx="5" opacity="0.6"/>
      <rect x="180" y="276" width="100" height="10" rx="5" opacity="0.6"/>
      <rect x="180" y="316" width="152" height="16" rx="8"/>
    </g>
    <path d="M150 402 165 416 180 402 195 416 210 402 225 416 240 402 255 416 270 402 285 416 300 402 315 416 330 402 345 416 362 402V416H150Z" fill="#ffffff" opacity="0.96"/>
  </g>
</svg>`

const sizes = [192, 512]
for (const size of sizes) {
  await sharp(Buffer.from(svg(size))).resize(size, size).png().toFile(`public/icons/icon-${size}.png`)
}
await sharp(Buffer.from(svg(512))).resize(180, 180).png().toFile('public/icons/apple-touch-icon.png')
await sharp(Buffer.from(svg(512))).resize(32, 32).png().toFile('public/favicon.png')
console.log('icons generated')
