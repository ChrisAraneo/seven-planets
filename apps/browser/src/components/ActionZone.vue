<script setup lang="ts">
import { canAfford, INFLUENCE_TYPES } from '@seven-planets/game';
import { hasBuilding } from '@seven-planets/game';
import { ownedPlanets } from '@seven-planets/game';
import { recruitCost } from '@seven-planets/game';
import { isPacifist } from '@seven-planets/game';
import { hasActionCard } from '@seven-planets/game';
import { totalTroops } from '@seven-planets/game';
import { filterAlivePlayers } from '@seven-planets/game';
import { getAwaitingAction } from '@seven-planets/game';
import { getBusy } from '@seven-planets/game';
import { getOver } from '@seven-planets/game';
import { store } from '@/stores';
import { computed } from 'vue';

const my = computed(() => getAwaitingAction() && !getBusy() && !getOver());
const human = computed(() => store.state.game.state.players[0]);

const hasBarracks = computed(() =>
  hasBuilding(store.state.game.state, human.value, 'BARRACKS'),
);
const hasPort = computed(() =>
  hasBuilding(store.state.game.state, human.value, 'SPACEPORT'),
);
const hasEmbassy = computed(() =>
  hasBuilding(store.state.game.state, human.value, 'EMBASSY'),
);
const canRecruitSomewhere = computed(() =>
  ownedPlanets(store.state.game.state, human.value).some(
    (pl) =>
      pl.buildings.BARRACKS && canAfford(human.value.hand, recruitCost(pl)),
  ),
);
const isPeaceful = computed(() => isPacifist(human.value));
const canLaunchSomewhere = computed(() =>
  ownedPlanets(store.state.game.state, human.value).some(
    (pl) => pl.buildings.SILO && pl.troops >= 1,
  ),
);
const heldInf = computed(() =>
  INFLUENCE_TYPES.reduce((s, t) => s + (human.value.hand[t] || 0), 0),
);

const recruitTitle = computed(() =>
  hasBarracks.value
    ? 'Spends one 🪖 Recruit card + 1⛏️ per troop. Yields troops equal to the Barracks yield (1/2/4) on the chosen planet.'
    : 'Requires a 🎖️ Barracks — you cannot recruit without one.',
);
const attackTitle = computed(() =>
  isPeaceful.value
    ? '☮️ You are a PACIFIST. You MAY attack — but doing so breaks your vow permanently, forfeiting the defense and ⭐ bonuses for good (you can never regain PACIFIST status).'
    : canLaunchSomewhere.value
      ? "Spends one ⚔️ Attack card per rocket launch (uses the launching planet's army)"
      : 'Requires a 🚀 Rocket Silo with troops garrisoned — rockets launch only from Silo planets.',
);
const moveTitle = computed(() =>
  hasPort.value
    ? 'Spends one 🛸 Move card to redeploy troops between your planets. Spaceport L2: +1 free Move card every 3 turns.'
    : 'Requires a 🛰️ Spaceport — you cannot redeploy troops without one.',
);
const tradeTitle = computed(() =>
  hasEmbassy.value
    ? 'Spends one 🔁 Trade card per accepted deal. Every deal you initiate earns +1 ⭐ Influence. Embassy L2: +1 ⭐ every turn.'
    : 'Requires a 🤝 Embassy — you cannot trade without one.',
);
const influenceTitle = computed(() =>
  heldInf.value
    ? 'Play a held ⭐ influence card (already paid for at draft time).'
    : 'No influence cards in hand — draft them from the pool (turn 30+) by paying their ⭐ cost.',
);

function recruit(planetId: number): void {
  store.commit('ui/closeModal');
  void store.dispatch('game/recruitTroops', { playerId: 0, planetId });
}

function onRecruit(): void {
  const pls = ownedPlanets(store.state.game.state, human.value).filter(
    (pl) =>
      pl.buildings.BARRACKS && canAfford(human.value.hand, recruitCost(pl)),
  );
  if (!pls.length) return;
  if (pls.length === 1) recruit(pls[0].id);
  else store.commit('ui/openModal', 'recruit');
}
</script>

<template>
  <div id="action-zone">
    <div class="zone-label">ACTIONS</div>
    <button
      class="btn action"
      :disabled="
        !my || !hasActionCard(human, 'RECRUIT') || !canRecruitSomewhere
      "
      :title="recruitTitle"
      @click="onRecruit">
      🪖 Recruit ×{{ human.hand.RECRUIT }}
    </button>
    <button
      class="btn action"
      :disabled="!my || !hasActionCard(human, 'ATTACK') || !canLaunchSomewhere"
      :title="attackTitle"
      @click="store.commit('ui/openModal', 'attack')">
      ⚔️ Attack ×{{ human.hand.ATTACK }}
    </button>
    <button
      class="btn action"
      :disabled="
        !my ||
        !hasActionCard(human, 'MOVE') ||
        !hasPort ||
        human.planets.length < 2 ||
        totalTroops(store.state.game.state, human) < 1
      "
      :title="moveTitle"
      @click="store.commit('ui/openModal', 'move')">
      🛸 Move ×{{ human.hand.MOVE }}
    </button>
    <button
      class="btn action"
      :disabled="
        !my ||
        !hasActionCard(human, 'TRADE') ||
        !hasEmbassy ||
        filterAlivePlayers(store.state.game.state).length < 2
      "
      :title="tradeTitle"
      @click="store.commit('ui/openModal', 'trade')">
      🔁 Trade ×{{ human.hand.TRADE }}
    </button>
    <button
      class="btn action"
      :disabled="!my || heldInf < 1"
      :title="influenceTitle"
      @click="store.commit('ui/openModal', 'influence')">
      ⭐ Influence ×{{ heldInf }}
    </button>
    <button
      class="btn action end"
      id="btn-end"
      :disabled="!my"
      @click="store.dispatch('game/endTurn', { playerId: 0 })">
      ⏭️ End Turn
    </button>
  </div>
</template>
