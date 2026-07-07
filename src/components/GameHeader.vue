<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '@/stores/game';

const store = useGameStore();

const turnLabel = computed(() => {
  const s = store.state;
  if (s.turn === 0) return '—';
  if (s.over) return `Turn ${s.turn} · GAME OVER`;
  const phase =
    s.phase === 'draft'
      ? 'DRAFT PHASE'
      : s.phase === 'action'
        ? 'ACTION PHASE'
        : '…';
  return `Turn ${s.turn} · ${phase}`;
});

function newGame(): void {
  if (window.confirm('Abandon this game and start over?')) store.newGame();
}
</script>

<template>
  <header>
    <h1>SEVEN <span>PLANETS</span></h1>
    <div id="turn-ind">{{ turnLabel }}</div>
    <div class="spacer"></div>
    <label id="fast-label">
      <input
        type="checkbox"
        :checked="store.fastMode"
        @change="store.setFast(($event.target as HTMLInputElement).checked)" />
      ⏩ fast animations
    </label>
    <button class="btn small" @click="store.openModal('help')">❓ Rules</button>
    <button class="btn small" @click="newGame">🆕 New Game</button>
  </header>
</template>
