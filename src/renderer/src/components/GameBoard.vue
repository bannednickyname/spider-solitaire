<script setup lang="ts">
import { nextTick, onUnmounted, watch } from 'vue'
import type { GameStore } from '@renderer/game/store'
import { useDragDrop } from '@renderer/composables/useDragDrop'
import { useToast } from '@renderer/composables/useToast'
import { useSound } from '@renderer/composables/useSound'
import TableauColumn from './TableauColumn.vue'
import StockPile from './StockPile.vue'
import CompletedSequences from './CompletedSequences.vue'

const props = defineProps<{
  store: GameStore
}>()

const { screenShake, startDrag } = useDragDrop(props.store)
const { add: toast } = useToast()
const sound = useSound()

function onCardPointerDown(
  colIndex: number,
  cardIndex: number,
  e: PointerEvent,
  el: HTMLElement
) {
  startDrag(colIndex, cardIndex, e, el)
}

function onDeal() {
  const ok = props.store.dealStock()
  if (ok) {
    sound.deal()
  } else {
    if (props.store.stockRoundsLeft.value === 0) {
      toast('没有更多的牌了', 'error')
    } else {
      toast('有空列时不能发牌', 'error')
    }
    sound.error()
  }
}

/* ===== 提示自动移动动画 ===== */
const HINT_ANIM_MS = 1100 // 单次动画时长
const HINT_ITERATIONS = 2 // 播放次数
let hintCleanupTimer: ReturnType<typeof setTimeout> | null = null
const hintAnims: Animation[] = []

function clearHintMoveAnim() {
  if (hintCleanupTimer) {
    clearTimeout(hintCleanupTimer)
    hintCleanupTimer = null
  }
  // 取消所有 WAAPI 动画
  while (hintAnims.length) {
    const a = hintAnims.pop()
    try {
      a?.cancel()
    } catch {
      /* ignore */
    }
  }
  document.querySelectorAll('.hint-moving').forEach((el) => {
    el.classList.remove('hint-moving')
  })
}

/** 计算源牌到目标牌的位移，并让源牌播放飞向目标的动画（两次） */
async function playHintMoveAnim() {
  clearHintMoveAnim()
  const hint = props.store.hint.value
  if (!hint) return

  await nextTick()

  const colEls = document.querySelectorAll<HTMLElement>('.column')
  const sourceCol = colEls[hint.fromCol]
  const targetCol = colEls[hint.toCol]
  if (!sourceCol || !targetCol) return

  const sourceWrappers = Array.from(sourceCol.querySelectorAll<HTMLElement>('.hint-source'))
  if (sourceWrappers.length === 0) return

  // 目标牌：目标列的底牌；若为空列则用占位框
  const targetWrapper = targetCol.querySelector<HTMLElement>('.hint-target-card')
  const targetEl = targetWrapper
    ? targetWrapper.querySelector<HTMLElement>('.card')
    : targetCol.querySelector<HTMLElement>('.hint-target-slot')
  if (!targetEl) return

  const sourceRect = sourceWrappers[0].getBoundingClientRect()
  const targetRect = targetEl.getBoundingClientRect()
  // 模拟真实叠放：源牌第一张落在目标牌顶部 + 露出间距(28px) 的位置，
  // 这样目标牌顶部一小条仍可见，而不是被完全覆盖
  const STACK_OVERLAP = 28
  const dx = targetRect.left - sourceRect.left
  const dy = targetRect.top + STACK_OVERLAP - sourceRect.top
  const to = `translate(${dx}px, ${dy}px)`

  sound.hint()

  sourceWrappers.forEach((el) => {
    // 仅用 class 控制层级和指针事件，动画由 WAAPI 驱动，
    // 避免覆盖/重播 .card-enter 上的 dealIn 动画导致落位后下浮
    el.classList.add('hint-moving')
    const anim = el.animate(
      [
        { transform: 'translate(0, 0)' },
        { transform: to, offset: 0.45 },
        { transform: to, offset: 0.8 },
        { transform: 'translate(0, 0)' }
      ],
      {
        duration: HINT_ANIM_MS,
        iterations: HINT_ITERATIONS,
        easing: 'ease-in-out',
        fill: 'none'
      }
    )
    hintAnims.push(anim)
  })

  // 两次动画播放完毕后，再保留高亮 1 秒，然后自动清除提示
  hintCleanupTimer = setTimeout(() => {
    clearHintMoveAnim()
    props.store.clearHint()
  }, HINT_ANIM_MS * HINT_ITERATIONS + 1000)
}

watch(
  () => props.store.hint.value,
  (hint) => {
    if (hint) {
      playHintMoveAnim()
    } else {
      clearHintMoveAnim()
    }
  }
)

onUnmounted(() => {
  clearHintMoveAnim()
})
</script>

<template>
  <div class="board" :class="{ shaking: screenShake }">
    <div class="board-top">
      <CompletedSequences :sequences="store.state.completed" />
    </div>

    <div class="tableau">
      <TableauColumn
        v-for="(col, i) in store.state.tableau"
        :key="i"
        :col-index="i"
        :column="col"
        :placed-ids="store.placedIds.value"
        :dealt-ids="store.dealtIds.value"
        :hint-from="store.hint.value ? { col: store.hint.value.fromCol, index: store.hint.value.fromIndex } : null"
        :hint-to="store.hint.value?.toCol ?? null"
        @pointerdown="onCardPointerDown"
      />
    </div>

    <StockPile
      class="stock-bottom-right"
      :rounds-left="store.stockRoundsLeft.value"
      :disabled="store.state.tableau.some((c) => c.cards.length === 0) || store.stockRoundsLeft.value === 0"
      @deal="onDeal"
    />
  </div>
</template>
