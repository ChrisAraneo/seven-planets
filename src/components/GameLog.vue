<script setup lang="ts">
import { getLog } from '@/stores/game/getters/get-log';
import { nextTick, ref, watch } from 'vue';
import { useGameStore } from '@/stores/game';

const store = useGameStore();
const el = ref<HTMLDivElement | null>(null);

// Auto-scroll to the newest entry as the log grows.
watch(
  () => getLog().length,
  () => {
    nextTick(() => {
      if (el.value) el.value.scrollTop = el.value.scrollHeight;
    });
  },
);
</script>

<template>
  <div id="log" ref="el">
    <div v-for="(entry, i) in getLog()" :key="i" :class="'l-' + entry.cls">
      {{ entry.msg }}
    </div>
  </div>
</template>
