<script setup lang="ts">
import ModalShell from './ModalShell.vue';
import { DIFFICULTIES, type Difficulty } from '@seven-planets/game';
import { useUiStore, useUnlocksStore } from '@/stores';

const ui = useUiStore();

// Unlocks live in the unlocks store; they only change on a win, which
// reloads the page, so reading the set once here is safe.
const unlocked = useUnlocksStore().unlocked;

function choose(level: Difficulty): void {
  if (!unlocked.has(level)) return; // locked — earn it by winning the level below
  ui.chooseDifficulty(level);
}
</script>

<template>
  <!-- No overlay-close: the human must pick a difficulty to begin. -->
  <ModalShell>
    <h2>🌌 CHOOSE YOUR DIFFICULTY</h2>
    <p class="dimtx">
      Seven worlds, one victor. Select a challenge to begin your conquest.
    </p>
    <div class="difficulty-grid">
      <button
        v-for="difficulty in DIFFICULTIES"
        :key="difficulty.id"
        class="difficulty-card"
        :class="{ locked: !unlocked.has(difficulty.id) }"
        :disabled="!unlocked.has(difficulty.id)"
        @click="choose(difficulty.id)">
        <span class="difficulty-icon">{{
          unlocked.has(difficulty.id) ? difficulty.icon : '🔒'
        }}</span>
        <span class="difficulty-name">{{ difficulty.name }}</span>
        <span class="difficulty-blurb">
          {{
            unlocked.has(difficulty.id)
              ? difficulty.blurb
              : 'Win the level below to unlock.'
          }}
        </span>
      </button>
    </div>
  </ModalShell>
</template>

<style scoped>
.difficulty-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 16px;
}
@media (max-width: 520px) {
  .difficulty-grid {
    grid-template-columns: 1fr;
  }
}
.difficulty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  background: #0c1428;
  border: 1px solid rgba(61, 240, 255, 0.35);
  color: #cfe3ff;
  border-radius: 8px;
  padding: 18px 12px;
  cursor: pointer;
  font-family: inherit;
  transition:
    background 0.15s,
    box-shadow 0.15s,
    transform 0.1s;
}
.difficulty-card:hover:not(.locked) {
  background: #14274a;
  box-shadow: 0 0 14px rgba(61, 240, 255, 0.35);
  transform: translateY(-2px);
}
.difficulty-card.locked {
  border-color: rgba(90, 123, 173, 0.25);
  opacity: 0.5;
  cursor: not-allowed;
}
.difficulty-card.locked .difficulty-name {
  color: #5a7bad;
}
.difficulty-icon {
  font-size: 30px;
}
.difficulty-name {
  color: #3df0ff;
  font-size: 15px;
  letter-spacing: 2px;
}
.difficulty-blurb {
  color: #5a7bad;
  font-size: 11.5px;
  line-height: 1.4;
}
</style>
