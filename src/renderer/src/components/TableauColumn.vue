<script setup lang="ts">
import { computed } from 'vue'
import type { Card, Column } from '@shared/types'
import CardItem from './Card.vue'

const props = defineProps<{
  colIndex: number
  column: Column
  placedIds: Set<string>
  dealtIds: Set<string>
  hintFrom: { col: number; index: number } | null
  hintTo: number | null
}>()

const emit = defineEmits<{
  (e: 'pointerdown', colIndex: number, cardIndex: number, event: PointerEvent, el: HTMLElement): void
}>()

/** 每张牌的顶部偏移：背面牌间距小、正面牌间距大 */
const offsets = computed(() => {
  const arr: number[] = []
  let top = 0
  const cards = props.column.cards
  for (let i = 0; i < cards.length; i++) {
    arr.push(top)
    const step = cards[i].faceUp ? 28 : 14
    top += step
  }
  return arr
})

const columnHeight = computed(() => {
  if (props.column.cards.length === 0) return 'var(--card-h)'
  const last = offsets.value[offsets.value.length - 1]
  return `calc(${last}px + var(--card-h))`
})

/** 刚被拖拽移动的牌：跳过入场动画，直接吸附到位 */
function isPlaced(cardId: string): boolean {
  return props.placedIds.has(cardId)
}

/** 刚从 stock 发出的牌：逐张飞入动画 */
function isDealt(cardId: string): boolean {
  return props.dealtIds.has(cardId)
}

/** 是否为提示的源牌 */
function isHintSource(cardIndex: number): boolean {
  const h = props.hintFrom
  if (!h) return false
  return h.col === props.colIndex && cardIndex >= h.index
}

/** 本列是否为提示的目标列 */
function isHintTarget(): boolean {
  return props.hintTo === props.colIndex
}

/** 是否为提示目标列的底牌（接收移动的那张牌） */
function isHintTargetCard(cardIndex: number): boolean {
  if (!isHintTarget()) return false
  return cardIndex === props.column.cards.length - 1
}

function onCardPointerDown(card: Card, cardIndex: number, e: PointerEvent) {
  if (!card.faceUp) return
  const el = e.currentTarget as HTMLElement
  emit('pointerdown', props.colIndex, cardIndex, e, el)
}
</script>

<template>
  <div
    class="column"
    :class="{ empty: column.cards.length === 0 }"
    :data-col-index="colIndex"
    :style="{ height: columnHeight }"
  >
    <div
      v-if="column.cards.length === 0"
      class="drop-hint"
      :class="{ 'hint-target-slot': isHintTarget() }"
    />
    <div
      v-for="(card, i) in column.cards"
      :key="isPlaced(card.id) ? card.id + '::placed' : card.id"
      :class="[
        'card-enter',
        {
          placed: isPlaced(card.id),
          dealt: isDealt(card.id),
          'hint-source': isHintSource(i),
          'hint-target-card': isHintTargetCard(i)
        }
      ]"
      :style="
        isPlaced(card.id)
          ? {
              position: 'absolute',
              left: '0',
              top: offsets[i] + 'px',
              animation: 'none',
              transition: 'none'
            }
          : isDealt(card.id)
            ? {
                position: 'absolute',
                left: '0',
                top: offsets[i] + 'px',
                animationDelay: colIndex * 90 + 'ms'
              }
            : {
                position: 'absolute',
                left: '0',
                top: offsets[i] + 'px',
                animationDelay: (colIndex * 15 + i * 25) + 'ms'
              }
      "
      @pointerdown="onCardPointerDown(card, i, $event)"
    >
      <CardItem :card="card" :face-up="card.faceUp" />
    </div>
  </div>
</template>
