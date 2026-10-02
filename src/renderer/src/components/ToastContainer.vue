<script setup lang="ts">
import type { Component } from 'vue'
import {
  ErrorCircle24Filled,
  Info24Filled,
  CheckmarkCircle24Filled
} from '@vicons/fluent'
import { useToast } from '@renderer/composables/useToast'

const { toasts, remove } = useToast()

const ICON: Record<string, Component> = {
  error: ErrorCircle24Filled,
  info: Info24Filled,
  success: CheckmarkCircle24Filled
}
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast" tag="div">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast"
        :class="t.type"
        @click="remove(t.id)"
      >
        <component :is="ICON[t.type]" class="ui-icon toast-icon" aria-hidden="true" />
        <span class="toast-msg">{{ t.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>
