<script setup lang="ts">
import { assign, noop } from 'lodash-es';
import { match } from 'ts-pattern';
import { nextTick, ref, watch } from 'vue';
import { useGameStore } from '@/stores';
import { chain } from '@/utils/chain';
import { nullish } from '@/utils/p';

const game = useGameStore();
const el = ref<HTMLDivElement | null>(null);

watch(
  () => game.state.log.length,
  () =>
    nextTick(() =>
      match(el.value)
        .with(nullish, noop)
        .otherwise((element) =>
          chain(assign(element, { scrollTop: element.scrollHeight }))
            .thru(noop)
            .value(),
        ),
    ),
);
</script>

<template>
  <div id="log" ref="el">
    <div
      v-for="(entry, i) in game.state.log"
      :key="i"
      :class="'l-' + entry.cssClass">
      {{ entry.message }}
    </div>
  </div>
</template>
