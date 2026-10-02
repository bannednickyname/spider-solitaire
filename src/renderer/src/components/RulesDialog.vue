<script setup lang="ts">
import { Info24Filled } from '@vicons/fluent'

defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <div class="rules-overlay" @click.self="$emit('close')">
    <div class="rules-dialog">
      <div class="rules-header">
        <div class="rules-title">
          <Info24Filled class="rules-icon" aria-hidden="true" />
          <h3>玩法说明</h3>
        </div>
        <button class="rules-close" aria-label="关闭" @click="$emit('close')">×</button>
      </div>

      <div class="rules-content">
        <h4>游戏目标</h4>
        <p>将全部 8 组「同花色、从 K 到 A 依次排列」的完整序列收走，即可获胜通关。</p>

        <h4>牌局布局</h4>
        <ul>
          <li>共 10 列：前 4 列各 6 张牌，后 6 列各 5 张牌，每列仅顶牌翻开</li>
          <li>剩余 50 张牌组成右下角备牌堆，可分 5 轮发出</li>
        </ul>

        <h4>移动规则</h4>
        <ul>
          <li>任何牌都可以放到点数比它大 1 的牌上，不限花色（如 7 可放到 8 上）</li>
          <li>同花色且点数连续的序列可以整组一起拖动（如 ♠9-8-7）</li>
          <li>空列可以放置任意牌或任意合法序列</li>
        </ul>

        <h4>发牌</h4>
        <ul>
          <li>点击右下角备牌堆，向每一列各发 1 张翻开的牌</li>
          <li>所有列都非空时才能发牌</li>
        </ul>

        <h4>收牌与计分</h4>
        <ul>
          <li>某列底部形成同花色 K→A 完整序列时自动收走，+100 分</li>
          <li>初始 500 分，每移动一步或发一轮牌 -1 分</li>
        </ul>

        <h4>工具栏</h4>
        <ul>
          <li>提示：高亮一组合法移动，连续点击轮换所有走法</li>
          <li>撤销：回退上一步；撤消全部：回到本局最初状态</li>
          <li>外观：更换牌面主题、牌背图案与牌面大小</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rules-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 6000;
}

.rules-dialog {
  width: 460px;
  max-width: calc(100vw - 48px);
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  background: rgba(15, 35, 30, 0.97);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  padding: 20px 24px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
}

.rules-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.rules-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rules-icon {
  width: 20px;
  height: 20px;
  color: #6ee7b7;
}

.rules-header h3 {
  margin: 0;
  font-size: 17px;
  color: #6ee7b7;
}

.rules-close {
  background: none;
  border: none;
  font-size: 22px;
  line-height: 1;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0 4px;
}

.rules-close:hover {
  color: #fff;
}

.rules-content {
  overflow-y: auto;
  text-align: left;
}

.rules-content h4 {
  margin: 14px 0 6px;
  font-size: 14px;
  color: #a7f3d0;
}

.rules-content h4:first-child {
  margin-top: 4px;
}

.rules-content p {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.8;
}

.rules-content ul {
  margin: 0;
  padding-left: 18px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
  line-height: 1.9;
}
</style>
