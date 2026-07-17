<script setup lang="ts">
import { computed } from 'vue';
import { resolveOffer as resolveGameOffer } from '@seven-planets/game';
import { useGameStore } from '@/stores';
import ModalShell from './ModalShell.vue';
import { formatCards } from '@seven-planets/game';

const game = useGameStore();

const offer = computed(() => game.state.pendingOffer);
const from = computed(() =>
  offer.value ? game.state.players[offer.value.fromId] : null,
);

function resolveOffer(isAccepted: boolean): void {
  resolveGameOffer({ playerId: 0, isAccepted });
}
</script>

<template>
  <ModalShell v-if="offer && from">
    <h2>📡 INCOMING TRANSMISSION</h2>
    <p>
      <b :style="{ color: from.color }">{{ from.name }}</b> proposes a trade:
    </p>
    <p>
      They give you: <b>{{ formatCards(offer.gives) }}</b>
    </p>
    <p>
      They want: <b>{{ formatCards(offer.gets) }}</b>
    </p>
    <div class="mbtns">
      <button class="btn" @click="resolveOffer(true)">Accept</button>
      <button class="btn danger" @click="resolveOffer(false)">Decline</button>
    </div>
  </ModalShell>
</template>
