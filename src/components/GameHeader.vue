<script setup lang="ts">
import { getOver } from '@/stores/game/getters/get-over';
import { getPhase } from '@/stores/game/getters/get-phase';
import { getTurn } from '@/stores/game/getters/get-turn';
import { computed } from 'vue';
import { store } from '@/stores';

const turnLabel = computed(() => {
  if (getTurn() === 0) return '—';
  if (getOver()) return `Turn ${getTurn()} · GAME OVER`;
  const phase =
    getPhase() === 'draft'
      ? 'DRAFT PHASE'
      : getPhase() === 'action'
        ? 'ACTION PHASE'
        : '…';
  return `Turn ${getTurn()} · ${phase}`;
});

function newGame(): void {
  if (window.confirm('Abandon this game and start over?'))
    void store.dispatch('ui/newGame');
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
        :checked="store.state.effects.fastMode"
        @change="
          store.commit(
            'effects/setFastMode',
            ($event.target as HTMLInputElement).checked,
          )
        " />
      ⏩ fast animations
    </label>
    <button class="btn small" @click="store.commit('ui/openModal', 'help')">
      ❓ Rules
    </button>
    <button class="btn small" @click="newGame">🆕 New Game</button>
  </header>
</template>
