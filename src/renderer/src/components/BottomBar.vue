<script setup lang="ts">
import {
  Add24Filled,
  Lightbulb24Filled,
  ArrowReset24Filled,
  ArrowUndo24Filled,
  Settings24Filled
} from '@vicons/fluent'

defineProps<{
  canUndo: boolean
}>()

const emit = defineEmits<{
  (e: 'new-game'): void
  (e: 'hint'): void
  (e: 'undo-all'): void
  (e: 'undo'): void
  (e: 'settings'): void
}>()
</script>

<template>
  <div class="bottom-bar">
    <button class="op-btn op-new" @click="emit('new-game')">
      <Add24Filled class="ui-icon" aria-hidden="true" />
      <span>新游戏</span>
    </button>
    <button class="op-btn op-hint" @click="emit('hint')">
      <Lightbulb24Filled class="ui-icon" aria-hidden="true" />
      <span>提示</span>
    </button>
    <button class="op-btn op-undo-all" :disabled="!canUndo" @click="emit('undo-all')">
      <ArrowReset24Filled class="ui-icon" aria-hidden="true" />
      <span>撤消全部</span>
    </button>
    <button class="op-btn op-undo" :disabled="!canUndo" @click="emit('undo')">
      <ArrowUndo24Filled class="ui-icon" aria-hidden="true" />
      <span>撤销</span>
    </button>
    <button class="op-btn op-settings" aria-label="外观设置" @click="emit('settings')">
      <Settings24Filled class="ui-icon" aria-hidden="true" />
      <span>外观</span>
    </button>
  </div>
</template>

<style scoped>
.bottom-bar {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 12px 120px;
  background: rgba(10, 25, 20, 0.85);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.op-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 1;
  padding: 8px 0;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.1;
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.op-btn .ui-icon {
  width: 20px;
  height: 20px;
}

.op-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.op-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 彩色立体：每个按钮固定颜色 */
.op-new {
  color: #34d399;
  border-color: rgba(52, 211, 153, 0.35);
}
.op-new:hover:not(:disabled) {
  background: rgba(52, 211, 153, 0.18);
  border-color: rgba(52, 211, 153, 0.65);
}

.op-hint {
  color: #fde047;
  border-color: rgba(253, 224, 71, 0.35);
}
.op-hint:hover:not(:disabled) {
  background: rgba(253, 224, 71, 0.18);
  border-color: rgba(253, 224, 71, 0.65);
}

.op-undo-all {
  color: #f472b6;
  border-color: rgba(244, 114, 182, 0.35);
}
.op-undo-all:hover:not(:disabled) {
  background: rgba(244, 114, 182, 0.18);
  border-color: rgba(244, 114, 182, 0.65);
}

.op-undo {
  color: #60a5fa;
  border-color: rgba(96, 165, 250, 0.35);
}
.op-undo:hover:not(:disabled) {
  background: rgba(96, 165, 250, 0.18);
  border-color: rgba(96, 165, 250, 0.65);
}

.op-settings {
  color: #a78bfa;
  border-color: rgba(167, 139, 250, 0.35);
}
.op-settings:hover:not(:disabled) {
  background: rgba(167, 139, 250, 0.18);
  border-color: rgba(167, 139, 250, 0.65);
}
</style>
