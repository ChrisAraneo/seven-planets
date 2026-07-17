<script setup lang="ts">
import { useGameStore } from '@/stores';
import {
  CARDS,
  RESOURCE_TYPES,
  ACTION_TYPES,
  INFLUENCE_TYPES,
} from '@seven-planets/game';
import { getBuildingCount } from '@seven-planets/game';
import { getTechLevel } from '@seven-planets/game';
import { computeTotalTroops } from '@seven-planets/game';
import type { Player } from '@seven-planets/game';

const game = useGameStore();

function resLine(player: Player): string {
  return RESOURCE_TYPES.map((t) => `${CARDS[t].icon}${player.hand[t]}`).join(
    ' ',
  );
}
function actLine(player: Player): string {
  const heldInf = INFLUENCE_TYPES.filter((t) => player.hand[t] > 0)
    .map((t) => `${CARDS[t].icon}${player.hand[t]}`)
    .join(' ');
  return (
    ACTION_TYPES.map((t) => `${CARDS[t].icon}${player.hand[t]}`).join(' ') +
    (heldInf ? ` · ${heldInf}` : '')
  );
}
</script>

<template>
  <div id="players-panel">
    <div
      v-for="player in game.state.players"
      :key="player.id"
      class="prow"
      :class="{
        active: player.id === game.state.activeId && !game.state.over,
        dead: !player.isAlive,
      }"
      :style="{ borderLeftColor: player.color }">
      <span class="pname" :style="{ color: player.color }"
        >{{ player.name }}{{ player.isHuman ? ' ★' : '' }}</span
      >
      <div class="pstats">
        🪐{{
          game.state.planets.filter((planet) => planet.ownerId === player.id)
            .length
        }}
        🔬T{{ getTechLevel(game.state, player) }} 🦵{{
          computeTotalTroops(game.state, player)
        }}
        🏛️{{ getBuildingCount(game.state, player) }} ⭐{{ player.influence
        }}{{ player.skipTurns > 0 || player.isSkippedNow ? ' ⏭️' : '' }} ·
        {{ resLine(player) }}
      </div>
      <div class="pstats">
        {{ actLine(player) }}
      </div>
    </div>
  </div>
</template>
