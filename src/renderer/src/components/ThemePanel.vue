<script setup lang="ts">
import { reactive } from 'vue'
import { Dismiss24Regular } from '@vicons/fluent'
import { useAppearance, type Appearance } from '@renderer/composables/useAppearance'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const appearance = useAppearance()
/** 草稿：面板内的修改先写到这里，确定时才应用 */
const draft = reactive<Appearance>({ ...appearance })

function apply() {
  Object.assign(appearance, draft)
  emit('close')
}

function cancel() {
  emit('close')
}

const faceOptions = [
  { key: 'realistic' as const, label: '写实', desc: '经典人物牌' },
  { key: 'cartoon' as const, label: '卡通', desc: '简笔风人物' },
  { key: 'minimal' as const, label: '精简', desc: '中央大花色' },
]

const backPreviews = [
  { key: 1 as const, label: '经典斜纹' },
  { key: 2 as const, label: '宽条纹' },
  { key: 3 as const, label: '棋盘格' },
  { key: 4 as const, label: '钻石纹' },
]

const sizeOptions = [
  { key: 'small' as const, label: '小', scale: 0.88 },
  { key: 'medium' as const, label: '中', scale: 1.0 },
  { key: 'large' as const, label: '大', scale: 1.12 },
]
</script>

<template>
  <div class="overlay" @click.self="cancel">
    <div class="panel">
      <div class="panel-header">
        <h3>外观设置</h3>
        <button class="close-btn" @click="cancel">
          <Dismiss24Regular class="ui-icon" />
        </button>
      </div>

      <section>
        <h4>牌面主题</h4>
        <div class="row face-row">
          <button
            v-for="opt in faceOptions"
            :key="opt.key"
            class="tile-btn"
            :class="{ active: draft.faceTheme === opt.key }"
            @click="draft.faceTheme = opt.key"
          >
            <div class="tile-label">{{ opt.label }}</div>
            <div class="tile-desc">{{ opt.desc }}</div>
          </button>
        </div>
      </section>

      <section>
        <h4>牌背设计</h4>
        <div class="row back-row">
          <button
            v-for="b in backPreviews"
            :key="b.key"
            class="back-tile"
            :class="{ active: draft.cardBack === b.key }"
            @click="draft.cardBack = b.key"
          >
            <div class="back-preview" :class="`back-${b.key}`" />
            <div class="back-label">{{ b.label }}</div>
          </button>
        </div>
      </section>

      <section>
        <h4>牌面大小</h4>
        <div class="row size-row">
          <button
            v-for="s in sizeOptions"
            :key="s.key"
            class="tile-btn"
            :class="{ active: draft.cardSize === s.key }"
            @click="draft.cardSize = s.key"
          >
            <div class="tile-label">{{ s.label }}</div>
            <div class="tile-desc">{{ Math.round(s.scale * 100) }}%</div>
          </button>
        </div>
      </section>

      <div class="panel-footer">
        <button class="footer-btn ghost" @click="cancel">取消</button>
        <button class="footer-btn primary" @click="apply">确定</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel {
  width: 420px;
  max-width: 92vw;
  max-height: 92vh;
  overflow: auto;
  background: #0f3d27;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 20px 22px 24px;
  color: #e8f5e9;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.55);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #e8f5e9;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 18px;
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

section + section {
  margin-top: 28px;
}
section h4 {
  margin: 0 0 14px;
  font-size: 13px;
  font-weight: 600;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.row {
  display: flex;
  gap: 10px;
}

.tile-btn {
  flex: 1;
  padding: 12px 0;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #e8f5e9;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}
.tile-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}
.tile-btn.active {
  border-color: rgba(16, 185, 129, 0.6);
  background: rgba(16, 185, 129, 0.14);
}
.tile-label {
  font-size: 15px;
  font-weight: 600;
}
.tile-desc {
  font-size: 12px;
  opacity: 0.65;
  margin-top: 3px;
}

.back-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.back-tile {
  padding: 10px 0 8px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #e8f5e9;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}
.back-tile:hover {
  background: rgba(255, 255, 255, 0.1);
}
.back-tile.active {
  border-color: rgba(16, 185, 129, 0.6);
  background: rgba(16, 185, 129, 0.14);
}
.back-preview {
  width: 36px;
  height: 50px;
  border-radius: 5px;
  margin: 0 auto 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.back-label {
  font-size: 12px;
  opacity: 0.85;
}

/* 4 套牌背预览 */
.back-1 {
  background: repeating-linear-gradient(45deg, #1e3a5f 0 4px, #2a4f7a 4px 8px);
}
.back-2 {
  background: repeating-linear-gradient(0deg, #1e3a5f 0 8px, #2a4f7a 8px 16px);
}
.back-3 {
  background:
    repeating-linear-gradient(90deg, transparent 0 10px, rgba(255,255,255,0.06) 10px 11px),
    repeating-linear-gradient(0deg, transparent 0 10px, rgba(255,255,255,0.06) 10px 11px),
    #1e3a5f;
}
.back-4 {
  background:
    repeating-linear-gradient(45deg,  rgba(255,255,255,0.05) 0 8px, transparent 8px 16px),
    repeating-linear-gradient(-45deg, rgba(255,255,255,0.05) 0 8px, transparent 8px 16px),
    #1e3a5f;
}

.panel-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 28px;
}
.footer-btn {
  padding: 7px 20px;
  font-size: 13px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
}
.footer-btn.ghost {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
  color: #e8f5e9;
}
.footer-btn.ghost:hover {
  background: rgba(255, 255, 255, 0.15);
}
.footer-btn.primary {
  background: #059669;
  color: #fff;
  font-weight: 600;
}
.footer-btn.primary:hover {
  background: #10b981;
}
</style>
