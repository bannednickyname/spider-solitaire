<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { ChevronDown24Filled } from '@vicons/fluent'
import type { Difficulty } from '@shared/types'
import { useGameStore } from '@renderer/game/store'
import HudBar from '@renderer/components/HudBar.vue'
import GameBoard from '@renderer/components/GameBoard.vue'
import ToastContainer from '@renderer/components/ToastContainer.vue'
import StartScreen from '@renderer/components/StartScreen.vue'
import BottomBar from '@renderer/components/BottomBar.vue'
import ThemePanel from '@renderer/components/ThemePanel.vue'
import RulesDialog from '@renderer/components/RulesDialog.vue'
import { useToast } from '@renderer/composables/useToast'
import { useSound } from '@renderer/composables/useSound'
import { useProgress, SAVE_KEY, campaignDifficulty, type GameMode, type SaveData } from '@renderer/composables/useProgress'

const store = useGameStore()
const gameStarted = ref(false)
const { add: toast } = useToast()
const sound = useSound()
const progress = useProgress()
const showThemePanel = ref(false)
const showRules = ref(false)

/* ===== 游戏运行状态 ===== */
const gameMode = ref<GameMode>('free')
const campaignLevel = ref(1)
let originalDifficulty: Difficulty = 1

/* ===== 底栏自动隐藏（HUD 不参与，仅手动折叠）=====
 * 规则：开局/重开后显示，10 秒无操作隐藏；
 * 隐藏后鼠标移到屏幕底部边缘唤回 —— 这种"经过唤回"的，移开立即隐藏，不再等 10 秒。
 */
const barVisible = ref(true)
let barHoverOnly = false
let barTimer: ReturnType<typeof setTimeout> | null = null

function clearBarTimer() {
  if (barTimer) {
    clearTimeout(barTimer)
    barTimer = null
  }
}

function showBar() {
  barHoverOnly = !barVisible.value
  clearBarTimer()
  barVisible.value = true
}

function scheduleBarHide() {
  clearBarTimer()
  if (barHoverOnly) {
    barVisible.value = false
    barHoverOnly = false
    return
  }
  barTimer = setTimeout(() => {
    barVisible.value = false
  }, 10000)
}

function resetHud() {
  barHoverOnly = false
  clearBarTimer()
  barVisible.value = true
  barTimer = setTimeout(() => {
    barVisible.value = false
  }, 10000)
}

/* ===== HUD 手动折叠 ===== */
const hudVisible = ref(true)
function toggleHud() {
  hudVisible.value = !hudVisible.value
}

let timer: ReturnType<typeof setInterval> | null = null
let tickCount = 0

function startTimer() {
  if (timer) return
  timer = setInterval(() => {
    if (!store.won.value) {
      store.state.elapsedMs += 1000
      // 每 10 秒持久化一次，防止强制退出丢失计时与局面
      if (++tickCount % 10 === 0) saveCurrentGame()
    }
  }, 1000)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

/** 从向导界面开始游戏 */
function onStart(payload: { mode: GameMode; difficulty: Difficulty; level: number }) {
  gameMode.value = payload.mode
  originalDifficulty = payload.difficulty
  campaignLevel.value = payload.level
  store.newGame(payload.difficulty)
  gameStarted.value = true
  resetHud()
  saveCurrentGame()
}

/** 关卡模式通关：结算经验与积分 + 进入下一关 */
function onCampaignWin() {
  const diff = originalDifficulty
  const result = progress.addWin(diff)
  progress.addScore(store.state.score)
  progress.advanceCampaign()
  if (result.leveledUp) {
    toast(`升级！当前等级 Lv.${result.level}，经验 +${result.xpGained}`, 'info', 4000)
  } else {
    toast(`通关第 ${campaignLevel.value} 关！经验 +${result.xpGained}`, 'info', 3000)
  }
  campaignLevel.value = progress.data.campaignLevel
}

/** 返回向导界面 */
function onBack() {
  stopTimer()
  saveCurrentGame()
  gameStarted.value = false
}

/** 存档：保存当前对局以便下次恢复 */
function saveCurrentGame() {
  if (!gameStarted.value || store.won.value) return
  try {
    const data = JSON.stringify({
      mode: gameMode.value,
      level: campaignLevel.value,
      originalDifficulty,
      player: progress.playerName.value,
      state: store.serialize(),
      savedAt: Date.now()
    })
    localStorage.setItem(SAVE_KEY, data)
  } catch {
    /* 忽略存储错误 */
  }
}

/* ===== 断点续玩：检测到未完成对局时提示 ===== */
const pendingSave = ref<SaveData | null>(null)

function resumeGame() {
  const d = pendingSave.value
  if (!d) return
  // 先切换到存档所属玩家，确保关卡/经验记录到正确档案
  if (d.player) progress.setPlayer(d.player)
  gameMode.value = d.mode
  campaignLevel.value = d.level
  originalDifficulty = d.originalDifficulty ?? d.state.difficulty
  store.restore(d.state)
  pendingSave.value = null
  gameStarted.value = true
  resetHud()
}

function discardSave() {
  progress.clearSave()
  pendingSave.value = null
}

onMounted(() => {
  const d = progress.readSave()
  if (d) pendingSave.value = d
})

/** 顶部栏的"新游戏"：自由模式以当前难度重开；关卡模式（通关后）进入下一关 */
function onNewGame() {
  stopTimer()
  if (gameMode.value === 'campaign') {
    const diff = campaignDifficulty(campaignLevel.value)
    originalDifficulty = diff
    store.newGame(diff)
  } else {
    store.newGame(store.state.difficulty)
  }
  resetHud()
  saveCurrentGame()
}

function onUndo() {
  if (store.undo()) {
    sound.undo()
  }
}

/** 撤消全部：回到本局最初状态 */
function onUndoAll() {
  if (store.undoAll()) {
    sound.undo()
  }
}

/** 提示：高亮一个合法移动 */
function onHint() {
  const hasMove = store.showHint()
  if (!hasMove) {
    toast('没有可移动的牌，试试发牌吧', 'info')
  }
}

// 监听步数：玩家移动第一张牌后开始计时；每次变化都自动存档
watch(
  () => store.state.moves,
  (moves) => {
    if (moves > 0 && !store.won.value) {
      startTimer()
    }
    saveCurrentGame()
  }
)

// 通关时停止计时并播放胜利音效；关卡模式结算经验并清除存档
watch(
  () => store.won.value,
  (won) => {
    if (won) {
      stopTimer()
      sound.win()
      // 仅关卡模式结算经验/积分；自由模式是普通一局，结束即重新计分
      if (gameMode.value === 'campaign') {
        onCampaignWin()
      }
      progress.clearSave()
    }
  }
)

// 完成一组 K→A 时播放音效
let prevCompleted = store.state.completed.length
watch(
  () => store.state.completed.length,
  (len) => {
    if (len > prevCompleted) {
      sound.complete()
    }
    prevCompleted = len
  }
)

onUnmounted(() => {
  stopTimer()
  clearBarTimer()
})
</script>

<template>
  <StartScreen v-if="!gameStarted" @start="onStart" />

  <!-- 恢复对局提示 -->
  <div v-if="pendingSave" class="resume-overlay">
    <div class="resume-panel">
      <h3>检测到未完成的对局</h3>
      <p>
        <template v-if="pendingSave.player">{{ pendingSave.player }} · </template>
        {{ pendingSave.mode === 'campaign' ? `第 ${pendingSave.level} 关` : '自由模式' }} ·
        {{ pendingSave.state.difficulty === 1 ? '1 花色' : pendingSave.state.difficulty === 2 ? '2 花色' : '4 花色' }}
        · 步数 {{ pendingSave.state.moves }}
      </p>
      <div class="resume-actions">
        <button class="resume-btn primary" @click="resumeGame">继续对局</button>
        <button class="resume-btn" @click="discardSave">放弃存档</button>
      </div>
    </div>
  </div>

  <template v-else>
    <!-- HUD：手动折叠/展开，不参与自动隐藏 -->
    <div class="hud-wrap" :class="{ 'hud-hidden': !hudVisible }">
      <div class="hud-clip">
        <HudBar
          :score="store.state.score"
          :moves="store.state.moves"
          :elapsed-ms="store.state.elapsedMs"
          :difficulty="store.state.difficulty"
          :mode="gameMode"
          :level="campaignLevel"
          @menu="showThemePanel = true"
          @rules="showRules = true"
          @back="onBack"
          @toggle-hud="toggleHud"
        />
      </div>
    </div>

    <!-- HUD 收起后：顶部展开按钮 -->
    <div v-if="!hudVisible" class="hud-expand" @click="toggleHud">
      <ChevronDown24Filled class="ui-icon" aria-hidden="true" />
    </div>
    <GameBoard :store="store" />

    <ToastContainer />

    <div
      class="bar-wrap"
      :class="{ 'bar-hidden': !barVisible }"
      @mouseenter="showBar"
      @mouseleave="scheduleBarHide"
    >
      <BottomBar
        :can-undo="store.canUndo.value"
        @new-game="onNewGame"
        @hint="onHint"
        @undo-all="onUndoAll"
        @undo="onUndo"
        @settings="showThemePanel = true"
      />
    </div>

    <ThemePanel v-if="showThemePanel" @close="showThemePanel = false" />
    <RulesDialog v-if="showRules" @close="showRules = false" />

    <div v-if="store.won.value" class="win-overlay">
      <div class="panel">
        <h2>🎉 恭喜通关！</h2>
        <template v-if="gameMode === 'campaign'">
          <p class="campaign-sub">第 {{ campaignLevel - 1 }} 关 · {{ store.state.difficulty }} 花色</p>
        </template>
        <p>最终分数：{{ store.state.score }}</p>
        <p>总步数：{{ store.state.moves }}</p>
        <p>
          用时：{{
            Math.floor(store.state.elapsedMs / 60000) +
              ':' +
              String(Math.floor((store.state.elapsedMs % 60000) / 1000)).padStart(2, '0')
          }}
        </p>
        <div class="win-actions">
          <button class="action primary" @click="onNewGame">
            {{ gameMode === 'campaign' ? '进入下一关' : '再来一局' }}
          </button>
          <button v-if="gameMode === 'campaign'" class="action" @click="onBack">返回主页</button>
        </div>
      </div>
    </div>
  </template>
</template>
