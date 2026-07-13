<script setup lang="ts">
import { computed } from 'vue';
import { useEffectsStore, useGameStore, useUiStore } from '@/stores';

const ui = useUiStore();
const game = useGameStore();
const effects = useEffectsStore();

const turnLabel = computed(() => {
  const { turn, over, phase } = game.state;
  if (turn === 0) return '—';
  if (over) return `Turn ${turn} · GAME OVER`;
  const phaseLabel =
    phase === 'draft'
      ? 'DRAFT PHASE'
      : phase === 'action'
        ? 'ACTION PHASE'
        : '…';
  return `Turn ${turn} · ${phaseLabel}`;
});

function newGame(): void {
  if (window.confirm('Abandon this game and start over?')) ui.newGame();
}
</script>

<template>
  <header>
    <h1>SEVEN <span>PLANETS</span></h1>
    <div id="turn-ind">{{ turnLabel }}</div>
    <div class="spacer"></div>
    <label id="fast-label">
      <input type="checkbox" v-model="effects.fastMode" />
      ⏩ fast animations
    </label>
    <button class="btn small" @click="ui.openModal('help')">❓ Rules</button>
    <button class="btn small" @click="newGame">🆕 New Game</button>
  </header>
</template>
