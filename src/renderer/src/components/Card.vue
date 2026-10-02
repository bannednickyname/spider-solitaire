<script setup lang="ts">
import { computed } from 'vue'
import type { Card } from '@shared/types'
import { useAppearance } from '@renderer/composables/useAppearance'
import CartoonFace from './CartoonFace.vue'

// 传统写实花牌（David Bellot SVG-cards）
import spadeJack from '@renderer/assets/cards/spade-jack.svg'
import spadeQueen from '@renderer/assets/cards/spade-queen.svg'
import spadeKing from '@renderer/assets/cards/spade-king.svg'
import heartJack from '@renderer/assets/cards/heart-jack.svg'
import heartQueen from '@renderer/assets/cards/heart-queen.svg'
import heartKing from '@renderer/assets/cards/heart-king.svg'
import diamondJack from '@renderer/assets/cards/diamond-jack.svg'
import diamondQueen from '@renderer/assets/cards/diamond-queen.svg'
import diamondKing from '@renderer/assets/cards/diamond-king.svg'
import clubJack from '@renderer/assets/cards/club-jack.svg'
import clubQueen from '@renderer/assets/cards/club-queen.svg'
import clubKing from '@renderer/assets/cards/club-king.svg'

const props = defineProps<{
  card: Card
  faceUp?: boolean
  dragging?: boolean
}>()

const appearance = useAppearance()

const SUIT_SYMBOL: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣'
}

const RANK_LABEL: Record<number, string> = {
  1: 'A',
  11: 'J',
  12: 'Q',
  13: 'K'
}

const rankLabel = computed(() => RANK_LABEL[props.card.rank] ?? String(props.card.rank))
const suitSymbol = computed(() => SUIT_SYMBOL[props.card.suit])
const isRed = computed(() => props.card.suit === 'hearts' || props.card.suit === 'diamonds')
const isFace = computed(() => props.card.rank >= 11)
const isAce = computed(() => props.card.rank === 1)

const FACE_IMG: Record<string, string> = {
  'spades-11': spadeJack, 'spades-12': spadeQueen, 'spades-13': spadeKing,
  'hearts-11': heartJack, 'hearts-12': heartQueen, 'hearts-13': heartKing,
  'diamonds-11': diamondJack, 'diamonds-12': diamondQueen, 'diamonds-13': diamondKing,
  'clubs-11': clubJack, 'clubs-12': clubQueen, 'clubs-13': clubKing
}
const faceImg = computed(() => FACE_IMG[`${props.card.suit}-${props.card.rank}`] ?? '')

const pipPositions = computed(() => {
  const r = props.card.rank
  const p = (top: number, left: number, rotate = 0) => ({ top, left, rotate })
  switch (r) {
    case 1: return [p(50, 50)]
    case 2: return [p(19, 50), p(83, 50, 180)]
    case 3: return [p(19, 50), p(50, 50), p(83, 50, 180)]
    case 4: return [p(19, 28), p(19, 72), p(83, 28, 180), p(83, 72, 180)]
    case 5: return [p(19, 28), p(19, 72), p(50, 50), p(83, 28, 180), p(83, 72, 180)]
    case 6: return [p(19, 28), p(19, 72), p(50, 28), p(50, 72), p(83, 28, 180), p(83, 72, 180)]
    case 7: return [p(19, 28), p(19, 72), p(34, 50), p(50, 28), p(50, 72), p(83, 28, 180), p(83, 72, 180)]
    case 8: return [p(19, 28), p(19, 72), p(34, 50), p(50, 28), p(50, 72), p(67, 50, 180), p(83, 28, 180), p(83, 72, 180)]
    case 9: return [p(19, 28), p(19, 72), p(40, 28), p(40, 72), p(50, 50), p(61, 28, 180), p(61, 72, 180), p(83, 28, 180), p(83, 72, 180)]
    case 10: return [p(19, 28), p(19, 72), p(29, 50), p(40, 28), p(40, 72), p(61, 28, 180), p(61, 72, 180), p(72, 50, 180), p(83, 28, 180), p(83, 72, 180)]
    default: return []
  }
})
/** 卡通主题：牌点带固定伪随机微倾，显得更手绘 */
function pipTilt(i: number): number {
  if (appearance.faceTheme !== 'cartoon') return 0
  return ((i * 37 + props.card.rank * 13) % 13) - 6
}
</script>

<template>
  <div
    class="card"
    :class="{
      'face-up': faceUp,
      'face-down': !faceUp,
      red: faceUp && isRed,
      black: faceUp && !isRed,
      dragging
    }"
  >
    <div class="card-inner" :class="{ flipped: !faceUp }">
      <!-- 正面 -->
      <div class="card-face card-front" :class="{ 'is-face': isFace }">
        <!-- ===== 精简模式：所有牌只保留角标 + 中央大花色 ===== -->
        <template v-if="appearance.faceTheme === 'minimal'">
          <div class="card-corner tl">
            <span class="rank" :class="{ 'two-digit': card.rank === 10 }">{{ rankLabel }}</span>
            <span class="suit">{{ suitSymbol }}</span>
          </div>
          <div class="card-corner br">
            <span class="rank" :class="{ 'two-digit': card.rank === 10 }">{{ rankLabel }}</span>
            <span class="suit">{{ suitSymbol }}</span>
          </div>
          <div class="card-center">
            <span class="minimal-suit">{{ suitSymbol }}</span>
          </div>
        </template>

        <!-- ===== 写实 / 卡通 ===== -->
        <template v-else>
          <!-- JQK 人物图案 -->
          <template v-if="isFace">
            <!-- 写实：传统 SVG 花牌 -->
            <img v-if="appearance.faceTheme === 'realistic'" class="face-card-img" :src="faceImg" alt="" draggable="false" />
            <!-- 卡通：简笔手绘人物 -->
            <CartoonFace v-else :rank="card.rank" class="face-card-img" />

            <!-- 统一角标 -->
            <div class="card-corner tl">
              <span class="rank">{{ rankLabel }}</span>
              <span class="suit">{{ suitSymbol }}</span>
            </div>
            <div class="card-corner br">
              <span class="rank">{{ rankLabel }}</span>
              <span class="suit">{{ suitSymbol }}</span>
            </div>
          </template>

          <!-- A-10 点数牌 -->
          <template v-else>
            <div class="card-corner tl">
              <span class="rank" :class="{ 'two-digit': card.rank === 10 }">{{ rankLabel }}</span>
              <span class="suit">{{ suitSymbol }}</span>
            </div>
            <div class="card-corner br">
              <span class="rank" :class="{ 'two-digit': card.rank === 10 }">{{ rankLabel }}</span>
              <span class="suit">{{ suitSymbol }}</span>
            </div>
            <div class="card-center">
              <template v-if="isAce">
                <span class="ace-suit">{{ suitSymbol }}</span>
              </template>
              <template v-else>
                <span
                  v-for="(pos, i) in pipPositions"
                  :key="i"
                  class="pip"
                  :style="{ top: pos.top + '%', left: pos.left + '%', transform: `translate(-50%, -50%) rotate(${pos.rotate + pipTilt(i)}deg)` }"
                >{{ suitSymbol }}</span>
              </template>
            </div>
          </template>
        </template>
      </div>

      <!-- 背面 -->
      <div class="card-face card-back" :class="`back-${appearance.cardBack}`" />
    </div>
  </div>
</template>
