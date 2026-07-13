<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { useGameStore } from '@/stores';

const game = useGameStore();
const el = ref<HTMLDivElement | null>(null);

// Auto-scroll to the newest entry as the log grows.
watch(
  () => game.state.log.length,
  () => {
    nextTick(() => {
      if (el.value) el.value.scrollTop = el.value.scrollHeight;
    });
  },
);
</script>

<template>
  <div id="log" ref="el">
    <div
      v-for="(entry, i) in game.state.log"
      :key="i"
      :class="'l-' + entry.cls">
      {{ entry.msg }}
    </div>
  </div>
</template>
