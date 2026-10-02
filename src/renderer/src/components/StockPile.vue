<script setup lang="ts">
import type { Card } from '@shared/types'
import CardItem from './Card.vue'

defineProps<{
  roundsLeft: number
  disabled: boolean
}>()

const emit = defineEmits<{ (e: 'deal'): void }>()

// 牌堆只显示背面，花色/点数不影响视觉
const dummyCard: Card = { id: 'stock', suit: 'spades', rank: 1, faceUp: false }

function onClick() {
  emit('deal')
}
</script>

<template>
  <div
    class="stock"
    :class="{ disabled }"
    @click="disabled ? undefined : onClick()"
  >
    <div class="fan">
      <template v-if="roundsLeft > 0">
        <div
          v-for="i in Math.min(roundsLeft, 5)"
          :key="i"
          class="fan-card"
          :style="{ left: (i - 1) * 6 + 'px' }"
        >
          <CardItem :card="dummyCard" :face-up="false" />
        </div>
      </template>
      <div v-else class="fan-card" style="opacity: 0.25">
        <CardItem :card="dummyCard" :face-up="false" />
      </div>
    </div>
    <span class="count">{{ roundsLeft }} 轮</span>
  </div>
</template>
