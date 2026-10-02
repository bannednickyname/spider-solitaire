<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  List24Filled,
  ArrowLeft24Filled,
  FullScreenMaximize24Filled,
  FullScreenMinimize24Filled,
  ChevronUp24Filled,
  Settings24Filled,
  Info24Filled
} from '@vicons/fluent'
import type { Difficulty } from '@shared/types'
import type { GameMode } from '@renderer/composables/useProgress'

const props = defineProps<{
  score: number
  moves: number
  elapsedMs: number
  difficulty: Difficulty
  mode: GameMode
  level: number
}>()

const emit = defineEmits<{
  (e: 'menu'): void
  (e: 'rules'): void
  (e: 'back'): void
  (e: 'toggle-hud'): void
}>()

const timeLabel = computed(() => {
  const totalSec = Math.floor(props.elapsedMs / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const difficultyLabel = computed(() => {
  return props.difficulty === 1 ? '1 花色' : props.difficulty === 2 ? '2 花色' : '4 花色'
})

/* 全屏切换 */
const isFullscreen = ref(false)

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen().catch(() => {})
  }
}

document.addEventListener('fullscreenchange', () => {
  isFullscreen.value = !!document.fullscreenElement
})

/* 菜单下拉 */
const menuOpen = ref(false)

function openTheme() {
  menuOpen.value = false
  emit('menu')
}

function openRules() {
  menuOpen.value = false
  emit('rules')
}
</script>

<template>
  <div class="hud">
    <!-- 左侧：菜单 + 返回 + 模式徽章（关卡数量 + 难度） -->
    <div class="hud-left">
      <div class="menu-wrap">
        <button
          class="hud-btn hud-btn-menu"
          aria-label="菜单"
          @click="menuOpen = !menuOpen"
        >
          <List24Filled class="ui-icon" aria-hidden="true" />
          <span>菜单</span>
        </button>
        <div v-if="menuOpen" class="menu-pop">
          <button class="menu-item" @click="openTheme">
            <Settings24Filled class="ui-icon" aria-hidden="true" />
            <span>外观设置</span>
          </button>
          <button class="menu-item" @click="openRules">
            <Info24Filled class="ui-icon" aria-hidden="true" />
            <span>玩法说明</span>
          </button>
        </div>
      </div>
      <!-- 点击遮罩关闭下拉 -->
      <div v-if="menuOpen" class="menu-mask" @click="menuOpen = false" />
      <button class="hud-btn hud-btn-back" aria-label="返回" @click="$emit('back')">
        <ArrowLeft24Filled class="ui-icon" aria-hidden="true" />
        <span>返回</span>
      </button>
      <span class="mode-badge">
        <template v-if="mode === 'campaign'">第 {{ level }} 关 · </template>
        <template v-else>自由 · </template>
        {{ difficultyLabel }}
      </span>
    </div>

    <div class="spacer" />

    <!-- 右侧：分数 + 步数 + 时间 + 全屏 -->
    <div class="hud-right">
      <div class="stat">
        <span class="label">分数</span>
        <span class="value">{{ score }}</span>
      </div>
      <div class="stat">
        <span class="label">步数</span>
        <span class="value">{{ moves }}</span>
      </div>
      <div class="stat">
        <span class="label">时间</span>
        <span class="value">{{ timeLabel }}</span>
      </div>

      <button
        class="hud-btn icon-only hud-btn-fullscreen"
        :aria-label="isFullscreen ? '退出全屏' : '全屏'"
        :data-tooltip="isFullscreen ? '退出全屏' : '全屏'"
        @click="toggleFullscreen"
      >
        <FullScreenMinimize24Filled v-if="isFullscreen" class="ui-icon" aria-hidden="true" />
        <FullScreenMaximize24Filled v-else class="ui-icon" aria-hidden="true" />
      </button>

      <button
        class="hud-btn icon-only hud-btn-collapse"
        aria-label="收起顶栏"
        data-tooltip="收起顶栏"
        @click="$emit('toggle-hud')"
      >
        <ChevronUp24Filled class="ui-icon" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
