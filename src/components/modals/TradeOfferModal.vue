<script setup lang="ts">
import { getPendingOffer } from '@/stores/game/getters/get-pending-offer.ts';
import { getPlayers } from '@/stores/game/getters/get-players.ts';
import { computed } from 'vue';
import { useGameStore } from '@/stores/game.ts';
import ModalShell from './ModalShell.vue';
import { fmtCards } from '@/game/config/constants.ts';

const store = useGameStore();
const offer = computed(() => getPendingOffer());
const from = computed(() =>
  offer.value ? getPlayers()[offer.value.fromId] : null,
);
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
      <button class="btn" @click="store.resolveOffer(true)">Accept</button>
      <button class="btn danger" @click="store.resolveOffer(false)">
        Decline
      </button>
    </div>
  </ModalShell>
</template>
