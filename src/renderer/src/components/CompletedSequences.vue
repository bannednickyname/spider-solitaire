<script setup lang="ts">
import type { Card, CompletedSequence } from '@shared/types'
import CardItem from './Card.vue'

defineProps<{
  sequences: CompletedSequence[]
}>()

function kCard(seq: CompletedSequence): Card {
  return { id: `done-${seq.suit}`, suit: seq.suit, rank: 13, faceUp: true }
}
</script>

<template>
  <div class="completed-area">
    <div
      v-for="i in 8"
      :key="i"
      class="mini-stack"
    >
      <CardItem v-if="i <= sequences.length" :card="kCard(sequences[i - 1])" :face-up="true" />
    </div>
  </div>
</template>
