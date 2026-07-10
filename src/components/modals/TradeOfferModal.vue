<script setup lang="ts">
import { getPendingOffer } from '@/game/getters/get-pending-offer.ts';
import { getPlayers } from '@/game/getters/get-players.ts';
import { computed } from 'vue';
import { store } from '@/stores';
import ModalShell from './ModalShell.vue';
import { fmtCards } from '@/game/config/constants.ts';

const offer = computed(() => getPendingOffer());
const from = computed(() =>
  offer.value ? getPlayers()[offer.value.fromId] : null,
);

function resolveOffer(accept: boolean): void {
  void store.dispatch('game/resolveOffer', { playerId: 0, accept });
}
</script>

<template>
  <ModalShell v-if="offer && from">
    <h2>📡 INCOMING TRANSMISSION</h2>
    <p>
      <b :style="{ color: from.color }">{{ from.name }}</b> proposes a trade:
    </p>
    <p>
      They give you: <b>{{ fmtCards(offer.gives) }}</b>
    </p>
    <p>
      They want: <b>{{ fmtCards(offer.gets) }}</b>
    </p>
    <div class="mbtns">
      <button class="btn" @click="resolveOffer(true)">Accept</button>
      <button class="btn danger" @click="resolveOffer(false)">Decline</button>
    </div>
  </ModalShell>
</template>
