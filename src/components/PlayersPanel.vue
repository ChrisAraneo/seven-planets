<script setup lang="ts">
import { getActiveId } from '@/stores/game/getters/get-active-id';
import { getOver } from '@/stores/game/getters/get-over';
import { getPlayers } from '@/stores/game/getters/get-players';
import { useGameStore } from '@/stores/game';
import {
  CARDS,
  RESOURCE_TYPES,
  ACTION_TYPES,
  INFLUENCE_TYPES,
} from '@/game/constants';
import { buildingCount } from '@/game/engine/functions/building-count';
import { techLevel } from '@/game/actions/common/tech-level';
import { totalTroops } from '@/game/actions/common/total-troops';
import type { Player } from '@/game/types';

const store = useGameStore();

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
        dead: !p.alive,
      }"
      :style="{ borderLeftColor: p.color }">
      <span class="pname" :style="{ color: p.color }"
        >{{ p.name }}{{ p.isHuman ? ' ★' : '' }}</span
      >
      <div class="pstats">
        🪰{{ p.planets.length }} 🔬T{{ techLevel(p) }} 🦵{{
          totalTroops(p)
        }}
        🏛️{{ buildingCount(p) }} ⭐{{ p.influence
        }}{{ p.skipTurns > 0 || p.skippedNow ? ' ⏭️' : '' }} · {{ resLine(p) }}
      </div>
      <div class="pstats">{{ actLine(p) }}</div>
    </div>
  </div>
</template>
