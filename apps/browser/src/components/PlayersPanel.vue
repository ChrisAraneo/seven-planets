<script setup lang="ts">
import { getActiveId } from '@seven-planets/game';
import { getOver } from '@seven-planets/game';
import { getPlayers } from '@seven-planets/game';
import { useGameStore } from '@/stores';
import {
  CARDS,
  RESOURCE_TYPES,
  ACTION_TYPES,
  INFLUENCE_TYPES,
} from '@seven-planets/game';
import { buildingCount } from '@seven-planets/game';
import { getTechLevel } from '@seven-planets/game';
import { totalTroops } from '@seven-planets/game';
import type { Player } from '@seven-planets/game';

const game = useGameStore();

function resLine(p: Player): string {
  return RESOURCE_TYPES.map((t) => `${CARDS[t].icon}${p.hand[t]}`).join(' ');
}
function actLine(p: Player): string {
  const heldInf = INFLUENCE_TYPES.filter((t) => p.hand[t] > 0)
    .map((t) => `${CARDS[t].icon}${p.hand[t]}`)
    .join(' ');
  return (
    ACTION_TYPES.map((t) => `${CARDS[t].icon}${p.hand[t]}`).join(' ') +
    (heldInf ? ` · ${heldInf}` : '')
  );
}
</script>

<template>
  <div id="players-panel">
    <div
      v-for="p in getPlayers()"
      :key="p.id"
      class="prow"
      :class="{
        active: p.id === getActiveId() && !getOver(),
        dead: !p.isAlive,
      }"
      :style="{ borderLeftColor: p.color }">
      <span class="pname" :style="{ color: p.color }"
        >{{ p.name }}{{ p.isHuman ? ' ★' : '' }}</span
      >
      <div class="pstats">
        🪐{{
          game.state.planets.filter((pl) => pl.ownerId === p.id).length
        }}
        🔬T{{ getTechLevel(game.state, p) }} 🦵{{
          totalTroops(game.state, p)
        }}
        🏛️{{ buildingCount(game.state, p) }} ⭐{{ p.influence
        }}{{ p.skipTurns > 0 || p.skippedNow ? ' ⏭️' : '' }} ·
        {{ resLine(p) }}
      </div>
      <div class="pstats">{{ actLine(p) }}</div>
    </div>
  </div>
</template>
