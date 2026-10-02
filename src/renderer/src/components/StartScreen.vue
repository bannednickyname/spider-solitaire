<script setup lang="ts">
import { computed, ref } from 'vue'
import { Info24Filled, Person24Regular, Wand24Regular } from '@vicons/fluent'
import type { Difficulty } from '@shared/types'
// 品牌图形：Fluent 风格自绘蜘蛛（24 网格 / currentColor），规则见 styles.css
import spiderIcon from '@renderer/assets/icons/spider.svg?raw'
import { campaignDifficulty, useProgress, type GameMode } from '@renderer/composables/useProgress'
import RulesDialog from '@renderer/components/RulesDialog.vue'

/** 自绘骰子图标（Fluent 无骰子）：圆角方块 + 5 点 */
const diceIcon = `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" stroke-width="1.8" fill="none"/>
  <circle cx="8" cy="8" r="1.6" fill="currentColor"/>
  <circle cx="16" cy="8" r="1.6" fill="currentColor"/>
  <circle cx="12" cy="12" r="1.6" fill="currentColor"/>
  <circle cx="8" cy="16" r="1.6" fill="currentColor"/>
  <circle cx="16" cy="16" r="1.6" fill="currentColor"/>
</svg>`

const emit = defineEmits<{
  (e: 'start', payload: { mode: GameMode; difficulty: Difficulty; level: number }): void
}>()

const { data: progress, setPlayer, peekPlayer } = useProgress()

/* ===== 三步向导：1 起名 → 2 模式/关卡 → 3 难度 ===== */
const step = ref(1)
const mode = ref<GameMode>('free')
const difficulty = ref<Difficulty>(1)
/** 玩家名：默认留空，只显示水印提示 */
const name = ref('')
const showRules = ref(false)

const STEPS = ['起名', '选择模式', '选择难度'] as const

const DIFFICULTY_INFO: Record<Difficulty, { label: string; desc: string }> = {
  1: { label: '1 花色', desc: '黑桃单一花色，适合新手熟悉规则' },
  2: { label: '2 花色', desc: '黑桃与红心，中等挑战' },
  4: { label: '4 花色', desc: '四色全开，经典高难度' }
}

/** 难度图示：每个难度展示的示例牌花色 */
const SUIT_PREVIEW: Record<Difficulty, { symbol: string; red: boolean }[]> = {
  1: [{ symbol: '♠', red: false }],
  2: [
    { symbol: '♠', red: false },
    { symbol: '♥', red: true }
  ],
  4: [
    { symbol: '♠', red: false },
    { symbol: '♥', red: true },
    { symbol: '♦', red: true },
    { symbol: '♣', red: false }
  ]
}

const campaignDiff = computed(() => campaignDifficulty(progress.campaignLevel))
const canNext = computed(() => (step.value === 1 ? name.value.trim().length > 0 : true))
/** 关卡模式难度由关卡由易到难自动决定，无需选择，第 2 步即可直接开始 */
const isLastStep = computed(
  () => step.value === 3 || (step.value === 2 && mode.value === 'campaign')
)

/* ===== 随机起名 ===== */
const RANDOM_NAMES = [
  '蜘蛛大侠', '纸牌高手', '摸鱼大师', '王牌猎人', '连胜机器',
  '幸运星', '牌桌老饕', '清风徐来', '夜猫子', '小诸葛',
  '闪电手', '开心豆', '一鸣惊人', '稳如泰山', '锦鲤本鲤'
]

/** 掷骰动画计数：每次点击 +1，配合 :key 重放动画 */
const rollCount = ref(0)

/** 随机换一个与当前不同的名字 */
function randomName() {
  rollCount.value++
  let candidate = name.value
  while (candidate === name.value) {
    candidate = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]
  }
  name.value = candidate
}

/* ===== 名字占用检查：仅对已真正开始过的老玩家提示 ===== */
const nameDialog = ref<{ level: number; xpLevel: number; totalScore: number } | null>(null)

function xpToLevel(xp: number): number {
  let level = 1
  let remaining = xp
  while (remaining >= level * 400) {
    remaining -= level * 400
    level++
  }
  return level
}

/** 下一步：第 1 步先检查名字占用（老玩家弹回归提示），否则直接进入下一步 */
function next() {
  if (step.value === 1) {
    const n = name.value.trim()
    if (!n) return
    const existing = peekPlayer(n)
    // 只有进度已经离开第 1 关初始状态（过关或有经验）才提示欢迎回来
    if (existing && (existing.campaignLevel > 1 || existing.xp > 0)) {
      nameDialog.value = {
        level: existing.campaignLevel,
        xpLevel: xpToLevel(existing.xp),
        totalScore: existing.totalScore
      }
    } else {
      setPlayer(n)
      step.value = 2
    }
    return
  }
  if (step.value < 3) step.value++
}

/** 名字对话框确定：绑定玩家并进入下一步 */
function confirmName() {
  setPlayer(name.value)
  nameDialog.value = null
  step.value = 2
}

/** 返回上一步 */
function back() {
  if (step.value > 1) step.value--
}

/** 开始游戏：关卡模式按难度曲线取难度，自由模式用所选难度 */
function start() {
  if (!name.value.trim()) return
  setPlayer(name.value)
  if (mode.value === 'campaign') {
    emit('start', {
      mode: 'campaign',
      difficulty: campaignDiff.value,
      level: progress.campaignLevel
    })
  } else {
    emit('start', { mode: 'free', difficulty: difficulty.value, level: 0 })
  }
}
</script>

<template>
  <div class="start-screen">
    <div class="start-panel">
      <div class="wizard-badge">
        <Wand24Regular aria-hidden="true" />
        <span>游戏向导</span>
      </div>
      <div class="logo ui-icon" v-html="spiderIcon" aria-hidden="true" />

      <h1 class="game-title">蜘蛛纸牌</h1>
      <button class="info-btn" aria-label="玩法说明" title="玩法说明" @click="showRules = true">
        <Info24Filled aria-hidden="true" />
        <span>玩法说明</span>
      </button>
      <p class="subtitle">Spider Solitaire</p>

      <!-- 步骤指示器 -->
      <div class="steps">
        <div
          v-for="(label, i) in STEPS"
          :key="label"
          v-show="i < 2 || mode === 'free'"
          class="step-dot"
          :class="{ active: step === i + 1, done: step > i + 1 }"
        >
          <span class="step-num">{{ i + 1 }}</span>
          <span class="step-label">{{ label }}</span>
        </div>
      </div>

      <!-- 第 1 步：玩家起名（不显示关卡信息，下一步时才检查名字） -->
      <template v-if="step === 1">
        <div class="step-body step-name">
          <div class="name-intro">
            <div class="avatar ui-icon"><Person24Regular aria-hidden="true" /></div>
            <div class="bubble">给我起个名字吧</div>
          </div>
          <div class="name-row">
            <input
              v-model="name"
              class="name-input"
              type="text"
              maxlength="12"
              placeholder="输入名字或者点击右侧“骰子”随机给自己起个名字"
              @keyup.enter="canNext && next()"
            />
            <button class="dice-btn" aria-label="随机起名" title="随机起名" @click="randomName">
              <span
                :key="rollCount"
                class="dice-icon ui-icon"
                :class="{ rolling: rollCount > 0 }"
                v-html="diceIcon"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </template>

      <!-- 第 2 步：模式 / 关卡（竖排单选） -->
      <template v-else-if="step === 2">
        <div class="step-body">
          <div class="mode-list">
            <label class="mode-option" :class="{ active: mode === 'free' }">
              <input v-model="mode" type="radio" value="free" class="mode-radio" />
              <span class="mode-text">
                <span class="mode-name">自由模式</span>
                <span class="mode-sub">自选花色难度，普通一局，不计经验与积分</span>
              </span>
            </label>
            <label class="mode-option" :class="{ active: mode === 'campaign' }">
              <input v-model="mode" type="radio" value="campaign" class="mode-radio" />
              <span class="mode-text">
                <span class="mode-name">关卡模式</span>
                <span class="mode-sub">通关挑战模式，经验和积分累加，难度由易到难</span>
              </span>
            </label>
          </div>
        </div>
      </template>

      <!-- 第 3 步：难度（带花色图示）——仅自由模式；关卡模式由关卡自动决定难度 -->
      <template v-else>
        <div class="step-body">
          <div class="difficulty-options">
            <button
              v-for="d in [1, 2, 4] as Difficulty[]"
              :key="d"
              class="diff-card"
              :class="{ active: difficulty === d }"
              @click="difficulty = d"
            >
              <span class="diff-suits">
                <span
                  v-for="s in SUIT_PREVIEW[d]"
                  :key="s.symbol"
                  class="mini-card"
                  :class="{ red: s.red }"
                >{{ s.symbol }}</span>
              </span>
              <span class="diff-label">{{ DIFFICULTY_INFO[d].label }}</span>
              <span class="diff-desc">{{ DIFFICULTY_INFO[d].desc }}</span>
            </button>
          </div>
        </div>
      </template>

      <!-- 底部导航 -->
      <div class="wizard-nav">
        <button v-if="step > 1" class="nav-btn" @click="back">上一步</button>
        <span v-else />
        <button v-if="!isLastStep" class="nav-btn primary" :disabled="!canNext" @click="next">
          下一步
        </button>
        <button v-else class="nav-btn primary" :disabled="!name.trim()" @click="start">
          开始游戏
        </button>
      </div>
    </div>

    <!-- 玩法说明对话框 -->
    <RulesDialog v-if="showRules" @close="showRules = false" />

    <!-- 老玩家回归提示 -->
    <div v-if="nameDialog" class="name-overlay">
      <div class="name-dialog">
        <h3>欢迎回来，{{ name.trim() }}</h3>
        <p>
          将继续你的存档进度：<br />
          <strong>
            第 {{ nameDialog.level }} 关 · Lv.{{ nameDialog.xpLevel }} · 累计积分
            {{ nameDialog.totalScore }}
          </strong>
        </p>
        <button class="nav-btn primary name-ok" @click="confirmName">确定</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.start-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f3d2e 0%, #1a5c45 50%, #0f3d2e 100%);
  z-index: 5000;
  overflow-y: auto;
  padding: 20px;
}

.start-panel {
  position: relative;
  background: rgba(15, 35, 30, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 44px 40px 36px;
  max-width: 560px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  text-align: center;
  backdrop-filter: blur(8px);
}

.logo {
  font-size: 56px;
  line-height: 1;
  margin: 0 auto 10px;
  color: #6ee7b7;
}

.game-title {
  font-size: 32px;
  margin: 0;
  color: #fff;
  letter-spacing: 2px;
}

/* 面板左上角：游戏向导标识 */
.wizard-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  font-size: 13px;
  letter-spacing: 1px;
  color: #6ee7b7;
}

.wizard-badge svg {
  width: 16px;
  height: 16px;
}

/* 玩法说明按钮：固定在面板右上角，不参与标题居中 */
.info-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  font-size: 13px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition: color 0.15s;
}

.info-btn:hover {
  color: #6ee7b7;
}

.info-btn svg {
  width: 16px;
  height: 16px;
}

.subtitle {
  color: rgba(255, 255, 255, 0.5);
  margin: 6px 0 32px;
  font-size: 14px;
  letter-spacing: 1px;
}

/* 步骤指示器：当前步放大突出并带弹出动画，已完成恢复正常 */
.steps {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 36px;
}

.step-dot {
  display: flex;
  align-items: center;
  gap: 7px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  transition: transform 0.3s ease, color 0.3s ease;
  transform-origin: center;
  white-space: nowrap;
}

.step-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.3s ease;
}

.step-dot.done {
  color: #6ee7b7;
}

.step-dot.done .step-num {
  background: rgba(16, 185, 129, 0.25);
  border-color: rgba(16, 185, 129, 0.5);
  color: #6ee7b7;
}

/* 当前步：序号和文字整体放大 */
.step-dot.active {
  color: #fff;
  transform: scale(1.18);
}

.step-dot.active .step-num {
  width: 30px;
  height: 30px;
  font-size: 16px;
  background: #10b981;
  border-color: #10b981;
  box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.18), 0 4px 14px rgba(16, 185, 129, 0.4);
}

/* 切换到当前步时的弹出动画 */
.step-dot.active .step-num,
.step-dot.active .step-label {
  animation: step-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes step-pop {
  0% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  60% {
    transform: scale(1.12);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 步骤内容区：立体毛玻璃圆角方框 */
.step-body {
  /* 固定高度 + 垂直居中：切换步骤时面板高度不跳变（各步内容均 ≤ 300px） */
  height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 30px 28px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.04));
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 12px 32px rgba(0, 0, 0, 0.35);
  box-sizing: border-box;
}

/* 第 1 步内容少：垂直居中 */
.step-name {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.step-name .name-row {
  width: 400px;
  max-width: 100%;
}

/* 起名引导：蜘蛛头像 + 说话气泡 */
.name-intro {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 26px;
}

.avatar {
  box-sizing: border-box;
  width: 56px;
  height: 56px;
  padding: 11px;
  color: #6ee7b7;
  background: rgba(110, 231, 183, 0.12);
  border: 1px solid rgba(110, 231, 183, 0.45);
  border-radius: 50%;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  animation: avatar-float 3.2s ease-in-out infinite;
}

.bubble {
  position: relative;
  margin-bottom: 8px;
  padding: 10px 16px;
  font-size: 15px;
  color: #eafff3;
  /* 必须不透明：半透明底色会与尾巴叠加出双重透明度而穿帮 */
  background: #274439;
  border: 1px solid rgba(110, 231, 183, 0.4);
  border-radius: 14px;
}

/* 气泡尾巴：指向头像；与气泡同色，实心部分盖住气泡边框形成连贯缺口 */
.bubble::before {
  content: '';
  position: absolute;
  bottom: 9px;
  left: -5px;
  width: 10px;
  height: 10px;
  background: #274439;
  border-left: 1px solid rgba(110, 231, 183, 0.4);
  border-bottom: 1px solid rgba(110, 231, 183, 0.4);
  transform: rotate(45deg);
}

@keyframes avatar-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

/* 玩家起名：输入框 + 骰子 */
.name-row {
  display: flex;
  gap: 10px;
}

.name-input {
  flex: 1;
  padding: 16px 18px;
  font-size: 17px;
  text-align: center;
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.name-input::placeholder {
  /* 水印文案较长，用小一号字体保证完整显示 */
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.35);
}

.name-input:focus {
  border-color: #10b981;
}

.dice-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  padding: 0;
  overflow: hidden;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.35);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.dice-btn:hover {
  background: rgba(251, 191, 36, 0.2);
  border-color: rgba(251, 191, 36, 0.65);
}

.dice-icon {
  /* 尺寸走全局 .ui-icon（1em 跟随 font-size） */
  font-size: 26px;
}

/* 掷骰：点击后旋转一圈并轻微放大，动画被按钮 overflow:hidden 限制在内部 */
.dice-icon.rolling {
  animation: dice-roll 0.45s cubic-bezier(0.3, 0.6, 0.3, 1);
}

@keyframes dice-roll {
  0% {
    transform: rotate(0deg) scale(1);
  }
  55% {
    transform: rotate(360deg) scale(1.18);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

/* 模式选择：竖排 radio，卡片间距松散 */
.mode-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 24px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.mode-option:hover {
  background: rgba(255, 255, 255, 0.09);
}

.mode-option.active {
  background: rgba(16, 185, 129, 0.15);
  border-color: #10b981;
  box-shadow: 0 0 0 1px #10b981;
}

.mode-radio {
  width: 20px;
  height: 20px;
  margin: 0;
  flex-shrink: 0;
  accent-color: #10b981;
  cursor: pointer;
}

.mode-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mode-name {
  font-size: 17px;
  font-weight: 600;
  color: #fff;
}

.mode-sub {
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.55);
}

/* 难度卡片（带花色图示） */
.difficulty-options {
  display: flex;
  gap: 14px;
}

.diff-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 8px 18px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  color: #fff;
}

.diff-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(110, 231, 183, 0.4);
}

.diff-card.active {
  background: rgba(16, 185, 129, 0.18);
  border-color: #10b981;
  box-shadow: 0 0 0 1px #10b981;
}

/* 花色图示：迷你牌 */
.diff-suits {
  display: flex;
  gap: 4px;
  min-height: 34px;
  align-items: center;
  justify-content: center;
}

.mini-card {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 34px;
  font-size: 17px;
  font-weight: 700;
  color: #1f2937;
  background: #faf9f6;
  border: 1px solid #d4d0c8;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.mini-card.red {
  color: #dc2626;
}

.diff-label {
  font-size: 18px;
  font-weight: 600;
}

.diff-desc {
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.55);
}

/* 底部导航：按钮收敛，视觉重心留给关键信息 */
.wizard-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
}

.nav-btn {
  min-width: 92px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.nav-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.14);
}

.nav-btn.primary {
  color: #fff;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
}

.nav-btn.primary:hover:not(:disabled) {
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
}

.nav-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* 名字检查对话框 */
.name-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.name-dialog {
  width: 340px;
  max-width: calc(100vw - 48px);
  background: rgba(15, 35, 30, 0.97);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  padding: 28px 28px 22px;
  text-align: center;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
}

.name-dialog h3 {
  margin: 0 0 14px;
  font-size: 19px;
  color: #fff;
}

.name-dialog p {
  margin: 0 0 22px;
  font-size: 14px;
  line-height: 1.9;
  color: rgba(255, 255, 255, 0.75);
}

.name-dialog strong {
  font-size: 16px;
  color: #6ee7b7;
}

.name-ok {
  min-width: 96px;
}
</style>
