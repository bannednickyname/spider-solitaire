<script setup lang="ts">
defineProps<{
  rank: number // 11=J 12=Q 13=K
}>()
</script>

<template>
  <svg class="cartoon-face" viewBox="0 0 68 104" xmlns="http://www.w3.org/2000/svg">
    <!-- 身体：衣服颜色跟随花色 -->
    <path d="M10 104 C10 76 22 68 34 68 C46 68 58 76 58 104 Z" fill="currentColor" />
    <!-- 衣领 -->
    <path d="M28 70 L34 78 L40 70 L40 66 L28 66 Z" fill="#fff" opacity="0.9" />

    <!-- 头发（耳后） -->
    <circle v-if="rank === 12" cx="17" cy="40" r="8" fill="#6b4226" />
    <circle v-if="rank === 12" cx="51" cy="40" r="8" fill="#6b4226" />
    <path v-if="rank !== 12" d="M18 38 C18 22 50 22 50 38 L50 34 C50 20 18 20 18 34 Z" fill="#6b4226" />
    <path v-if="rank === 12" d="M16 36 C16 18 52 18 52 36 L52 30 C52 14 16 14 16 30 Z" fill="#6b4226" />

    <!-- 脸 -->
    <circle cx="34" cy="42" r="17" fill="#ffdcbd" />
    <!-- 耳朵 -->
    <circle cx="17.5" cy="43" r="3.4" fill="#ffdcbd" />
    <circle cx="50.5" cy="43" r="3.4" fill="#ffdcbd" />

    <!-- K：络腮胡 -->
    <path
      v-if="rank === 13"
      d="M20 42 C20 58 26 63 34 63 C42 63 48 58 48 42 L48 46 C48 56 42 59.5 34 59.5 C26 59.5 20 56 20 46 Z"
      fill="#e8e8e8"
    />

    <!-- 眼睛 -->
    <circle cx="27.5" cy="40" r="2.3" fill="#2b2b2b" />
    <circle cx="40.5" cy="40" r="2.3" fill="#2b2b2b" />
    <!-- 腮红 -->
    <circle cx="24" cy="47" r="2.6" fill="#ff9d9d" opacity="0.6" />
    <circle cx="44" cy="47" r="2.6" fill="#ff9d9d" opacity="0.6" />
    <!-- 嘴 -->
    <path
      v-if="rank !== 13"
      d="M29.5 50 Q34 54.5 38.5 50"
      stroke="#c0392b"
      stroke-width="1.8"
      fill="none"
      stroke-linecap="round"
    />
    <path
      v-else
      d="M30 51.5 Q34 55 38 51.5"
      stroke="#8a6d3b"
      stroke-width="1.8"
      fill="none"
      stroke-linecap="round"
    />

    <!-- 头饰 -->
    <!-- J：翻边小帽 -->
    <g v-if="rank === 11">
      <path d="M19 30 C19 18 49 18 49 30 L46 30 C46 22 22 22 22 30 Z" fill="currentColor" />
      <rect x="18" y="28" width="32" height="5" rx="2.5" fill="currentColor" />
      <circle cx="50" cy="24" r="4" fill="#f1c40f" />
    </g>
    <!-- Q：镶宝石发箍 -->
    <g v-if="rank === 12">
      <path d="M20 31 C20 17 48 17 48 31" stroke="#f1c40f" stroke-width="3.5" fill="none" />
      <circle cx="34" cy="16.5" r="4" fill="#e74c3c" stroke="#f1c40f" stroke-width="1.5" />
    </g>
    <!-- K：三叉皇冠 -->
    <g v-if="rank === 13">
      <path d="M20 29 L20 17 L27 24 L34 13 L41 24 L48 17 L48 29 Z" fill="#f1c40f" />
      <circle cx="34" cy="19.5" r="2.2" fill="#e74c3c" />
    </g>

    <!-- 胸前纽扣 -->
    <circle cx="34" cy="86" r="2.2" fill="#fff" opacity="0.85" />
    <circle cx="34" cy="95" r="2.2" fill="#fff" opacity="0.85" />
  </svg>
</template>
