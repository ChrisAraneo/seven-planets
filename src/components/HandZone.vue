<script setup lang="ts">
import { computed } from 'vue';
import { store } from '@/stores';
import {
  CARD_TYPES,
  CARDS,
  INFLUENCE_CARDS,
  INFLUENCE_TYPES,
} from '@/game/config/constants';
import type { InfluenceType } from '@/game/types';

const human = computed(() => store.state.game.state.players[0]);

const regular = computed(() =>
  CARD_TYPES.map((t) => {
    const n = human.value.hand[t];
    const hint =
      t === 'RELIC'
        ? ' (wildcard — substitutes any resource)'
        : CARDS[t].action
          ? ` (action card — spent to ${CARDS[t].name.toLowerCase()})`
          : '';
    return {
      t,
      n,
      icon: CARDS[t].icon,
      name: CARDS[t].name,
      color: CARDS[t].color,
      action: !!CARDS[t].action,
      title: `${CARDS[t].name}${hint}`,
    };
  }),
);

const influence = computed(() =>
  INFLUENCE_TYPES.filter((t) => human.value.hand[t] > 0).map(
    (t: InfluenceType) => ({
      t,
      n: human.value.hand[t],
      icon: CARDS[t].icon,
      name: CARDS[t].name,
      color: CARDS[t].color,
      title: `${INFLUENCE_CARDS[t].name}: ${INFLUENCE_CARDS[t].desc} (play it via the ⭐ Influence button on your action turn)`,
    }),
  ),
);
</script>

<template>
  <div id="hand-zone">
    <div class="zone-label">YOUR HAND</div>
    <div id="hand">
      <div
        v-for="c in regular"
        :key="c.t"
        class="card"
        :class="{ dim: c.n === 0, action: c.action }"
        :style="{ borderColor: c.color }"
        :title="c.title">
        <div class="ic">{{ c.icon }}</div>
        <div class="nm">{{ c.name }}</div>
        <div class="ct">{{ c.n }}</div>
      </div>
      <div
        v-for="c in influence"
        :key="c.t"
        class="card action"
        :style="{ borderColor: c.color }"
        :title="c.title">
        <div class="ic">{{ c.icon }}</div>
        <div class="nm">{{ c.name }}</div>
        <div class="ct">{{ c.n }}</div>
      </div>
    </div>
  </div>
</template>
