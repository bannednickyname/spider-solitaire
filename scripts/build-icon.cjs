/**
 * 应用图标生成脚本：
 * build/icon.svg --(sharp 渲染 256px PNG)--> png2icons 打包为多尺寸 --> build/icon.ico
 * 用法：node scripts/build-icon.cjs
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const png2icons = require('png2icons')

const root = path.join(__dirname, '..')
const svgPath = path.join(root, 'build', 'icon.svg')
const icoPath = path.join(root, 'build', 'icon.ico')

async function main() {
  const png = await sharp(svgPath, { density: 384 })
    .resize(256, 256)
    .png()
    .toBuffer()

  const ico = png2icons.createICO(png, png2icons.BILINEAR, 0, true)
  if (!ico) {
    throw new Error('ICO 生成失败')
  }
  fs.writeFileSync(icoPath, ico)
  console.log(`[build-icon] ${icoPath} ${(ico.length / 1024).toFixed(1)} KB`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
