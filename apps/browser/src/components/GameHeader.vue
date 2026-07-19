<script setup lang="ts">
import { noop } from 'lodash-es';
import { match } from 'ts-pattern';
import { computed } from 'vue';
import { useEffectsStore, useGameStore, useUiStore } from '@/stores';

const ui = useUiStore();
const game = useGameStore();
const effects = useEffectsStore();

const turnLabel = computed(() =>
  match(game.state)
    .with({ turn: 0 }, () => '—')
    .when(
      ({ over }) => Boolean(over),
      ({ turn }) => `Turn ${turn} · GAME OVER`,
    )
    .otherwise(
      ({ turn, phase }) =>
        `Turn ${turn} · ${match(phase)
          .with('draft', () => 'DRAFT PHASE')
          .with('action', () => 'ACTION PHASE')
          .otherwise(() => '…')}`,
    ),
);

const newGame = (): void =>
  match(window.confirm('Abandon this game and start over?'))
    .with(true, () => ui.restartGame())
    .otherwise(noop);
</script>

<template>
  <header>
    <h1>SEVEN <span>PLANETS</span></h1>
    <div id="turn-ind">
      {{ turnLabel }}
    </div>
    <div class="spacer" />
    <label id="fast-label">
      <input
        v-model="effects.fastMode"
        type="checkbox"
      >
      ⏩ fast animations
    </label>
    <button
      class="btn small"
      @click="ui.openModal('help')"
    >
      ❓ Rules
    </button>
    <button
      class="btn small"
      @click="newGame"
    >
      🆕 New Game
    </button>
  </header>
</template>
