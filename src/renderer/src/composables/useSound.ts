/**
 * 音效工具：使用 Web Audio API 合成，无需外部音频文件。
 * 涵盖：发牌、移动、提示、完成一组、通关、错误。
 */

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  // 用户交互后恢复（浏览器自动播放策略）
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  return ctx
}

/** 播放一个带包络的音调 */
function tone(
  freq: number,
  duration: number,
  opts: {
    type?: OscillatorType
    gain?: number
    attack?: number
    release?: number
    delay?: number
  } = {}
) {
  const ac = getCtx()
  if (!ac) return
  const {
    type = 'sine',
    gain = 0.15,
    attack = 0.01,
    release = 0.1,
    delay = 0
  } = opts

  const t0 = ac.currentTime + delay
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)

  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + attack)
  g.gain.setValueAtTime(gain, t0 + Math.max(attack, duration - release))
  g.gain.linearRampToValueAtTime(0, t0 + duration)

  osc.connect(g)
  g.connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

/** 发牌：短促的"唰"声（噪声 + 高通） */
function deal() {
  const ac = getCtx()
  if (!ac) return
  const bufferSize = ac.sampleRate * 0.12
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
  }
  const src = ac.createBufferSource()
  src.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 1200
  const g = ac.createGain()
  g.gain.value = 0.12
  src.connect(filter)
  filter.connect(g)
  g.connect(ac.destination)
  src.start()
}

/** 移动/落牌：低频轻击 */
function move() {
  tone(220, 0.12, { type: 'triangle', gain: 0.12, release: 0.08 })
  tone(160, 0.14, { type: 'sine', gain: 0.08, delay: 0.02 })
}

/** 提示：两音上行提示音 */
function hint() {
  tone(660, 0.14, { type: 'sine', gain: 0.1 })
  tone(990, 0.18, { type: 'sine', gain: 0.1, delay: 0.12 })
}

/** 完成一组（K→A）：上行琶音 */
function complete() {
  const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
  notes.forEach((f, i) => {
    tone(f, 0.22, { type: 'triangle', gain: 0.12, delay: i * 0.1 })
  })
}

/** 通关：更欢快的琶音 */
function win() {
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]
  notes.forEach((f, i) => {
    tone(f, 0.3, { type: 'triangle', gain: 0.14, delay: i * 0.12 })
  })
}

/** 错误：低频"嗡" */
function error() {
  tone(180, 0.18, { type: 'sawtooth', gain: 0.1, release: 0.12 })
  tone(140, 0.22, { type: 'square', gain: 0.06, delay: 0.04 })
}

/** 撤销：短促下行 */
function undo() {
  tone(440, 0.1, { type: 'sine', gain: 0.1 })
  tone(330, 0.12, { type: 'sine', gain: 0.1, delay: 0.08 })
}

export const useSound = () => ({
  deal,
  move,
  hint,
  complete,
  win,
  error,
  undo
})
