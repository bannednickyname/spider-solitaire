/**
 * electron-builder afterPack 钩子：
 * 删除本应用用不到的 Electron 运行时文件，缩减安装后体积。
 * - locales：仅保留 en-US / zh-CN（游戏界面为中文，无需其余 100+ 语言 pak）
 * - ffmpeg.dll：音效用 Web Audio 合成，无音视频播放需求
 * - vk_swiftshader / libvk_swiftshader / vulkan-1：软件渲染/WebGPU 用不到
 */
const fs = require('fs')
const path = require('path')

const KEEP_LOCALES = new Set(['en-US.pak', 'zh-CN.pak'])

const REMOVE_FILES = ['ffmpeg.dll', 'vk_swiftshader.dll', 'vulkan-1.dll']

exports.default = async function afterPack(context) {
  const appDir = context.appOutDir
  let saved = 0

  // 1. 裁剪语言包
  const localesDir = path.join(appDir, 'locales')
  if (fs.existsSync(localesDir)) {
    for (const f of fs.readdirSync(localesDir)) {
      if (!KEEP_LOCALES.has(f)) {
        const p = path.join(localesDir, f)
        saved += fs.statSync(p).size
        fs.unlinkSync(p)
      }
    }
  }

  // 2. 删除无用 DLL
  for (const f of REMOVE_FILES) {
    const p = path.join(appDir, f)
    if (fs.existsSync(p)) {
      saved += fs.statSync(p).size
      fs.unlinkSync(p)
    }
  }
  // libvk_swiftshader_icd.json 若存在一并删除
  const icd = path.join(appDir, 'vk_swiftshader_icd.json')
  if (fs.existsSync(icd)) {
    saved += fs.statSync(icd).size
    fs.unlinkSync(icd)
  }

  console.log(`[afterPack] trimmed ${(saved / 1024 / 1024).toFixed(1)} MB`)
}
