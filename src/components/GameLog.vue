<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useGameStore } from '@/stores/game'

const store = useGameStore()
const el = ref<HTMLDivElement | null>(null)

// Auto-scroll to the newest entry as the log grows.
watch(
  () => store.state.log.length,
  () => {
    nextTick(() => {
      if (el.value) el.value.scrollTop = el.value.scrollHeight
    })
  },
)
</script>

<template>
  <div id="log" ref="el">
    <div v-for="(entry, i) in store.state.log" :key="i" :class="'l-' + entry.cls">{{ entry.msg }}</div>
  </div>
</template>
