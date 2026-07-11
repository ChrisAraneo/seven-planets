<script setup lang="ts">
import { getPlanets } from '@seven-planets/game';
import { getPlayers } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import { computed, ref, watch } from 'vue';
import { attackPlanet } from '@seven-planets/game';
import { useGameStore, useUiStore } from '@/stores';
import ModalShell from './ModalShell.vue';
import {
  COMBAT,
  CONQUEST_TRUCE,
  HOME_FIELD,
  SHIELD_DEFENSE,
} from '@seven-planets/game';
import type { Planet } from '@seven-planets/game';
import { battleWinProb } from '@seven-planets/ai';
import { handSize } from '@seven-planets/game';
import { isPacifist } from '@seven-planets/game';
import { ownedPlanets } from '@seven-planets/game';
import { pacifistDefBonus } from '@seven-planets/game';
import { rocketCap } from '@seven-planets/game';
import { siloBonus } from '@seven-planets/game';
import { singularityDefBonus } from '@seven-planets/game';
import { isUnderTruce } from '@seven-planets/game';

const game = useGameStore();
const ui = useUiStore();

const human = game.state.players[0];

const breaksVow = computed(() => isPacifist(human));

const siloPls = ownedPlanets(game.state, human).filter(
  (pl) => pl.buildings.SILO && pl.troops >= 1,
);
const srcId = ref(siloPls.reduce((a, b) => (a.troops >= b.troops ? a : b)).id);
const sel = ref(-1);
const n = ref(1);

const source = computed(() => getPlanets()[srcId.value]);
const sources = computed(() =>
  ownedPlanets(game.state, human).filter((pl) => pl.buildings.SILO),
);
const targets = computed(() =>
  getPlanets().filter((pl: Planet) => pl.ownerId !== 0),
);
const openTargets = computed(() =>
  targets.value.filter((pl: Planet) => !isUnderTruce(pl)),
);
const cap = computed(() =>
  Math.min(rocketCap(source.value), source.value.troops),
);

// Keep the selected target valid and the troop count within capacity.
watch(
  [openTargets, srcId],
  () => {
    if (!openTargets.value.some((pl: Planet) => pl.id === sel.value))
      sel.value = openTargets.value.length ? openTargets.value[0].id : -1;
    n.value = Math.max(1, Math.min(n.value, cap.value));
  },
  { immediate: true },
);

const target = computed(() =>
  sel.value >= 0 ? getPlanets()[sel.value] : null,
);
const canLaunch = computed(() => sel.value >= 0 && source.value.troops >= 1);

const preview = computed(() => {
  if (!target.value) return null;
  const ap = 2 * n.value + siloBonus(source.value);
  const dp =
    2 * target.value.troops +
    (target.value.buildings.SHIELD || 0) * SHIELD_DEFENSE +
    pacifistDefBonus(game.state, target.value) +
    singularityDefBonus(target.value) +
    HOME_FIELD;
  const pWin = battleWinProb(ap, dp); // exact P(win), same math the dice roll
  const winPct = Math.round(pWin * 100);
  const note = pWin >= 0.6 ? 'good' : pWin >= 0.35 ? 'close' : 'suicide';
  const sendingAll = n.value >= source.value.troops;
  return { ap, dp, pWin, winPct, note, sendingAll };
});

function capFmt(pl = source.value): string {
  const c = rocketCap(pl);
  return c === Infinity ? '∞ (all troops)' : String(c);
}
function selectTarget(pl: { id: number; truce: boolean }): void {
  if (!pl.truce) sel.value = pl.id;
}
function dec(): void {
  if (n.value > 1) n.value--;
}
function inc(): void {
  if (n.value < cap.value) n.value++;
}
function launch(): void {
  if (!canLaunch.value) return;
  ui.closeModal();
  void attackPlanet({
    playerId: 0,
    sourceId: srcId.value,
    targetId: sel.value,
    n: n.value,
  });
}
</script>

<template>
  <ModalShell @close="ui.closeModal()">
    <h2>🚀 LAUNCH ATTACK</h2>
    <p class="dimtx">
      Rockets launch only from planets with a 🚀 Rocket Silo, using that
      planet's own army. Winning a battle grants no loot — wipe out the garrison
      to conquer the planet (then it's safe from attacks for
      {{ CONQUEST_TRUCE }} turns). Spends one ⚔️ Attack card (you have
      {{ human.hand.ATTACK }}).
    </p>
    <p v-if="breaksVow" class="vow-warning">
      ☮️➡️⚔️ You are a PACIFIST. Launching this attack breaks your vow
      <strong>permanently</strong>: you lose the +defense and +⭐ bonuses on
      every planet and can never become a PACIFIST again.
    </p>
    <p v-if="sources.length > 1">
      Launch from:
      <button
        v-for="pl in sources"
        :key="pl.id"
        class="tab"
        :class="{ active: pl.id === srcId }"
        @click="srcId = pl.id">
        {{ pl.name }} 🪖{{ pl.troops }}
      </button>
    </p>
    <div
      v-for="pl in targets"
      :key="pl.id"
      class="trow"
      :class="{ sel: pl.id === sel, truce: isUnderTruce(pl) }"
      @click="selectTarget({ id: pl.id, truce: isUnderTruce(pl) })">
      <div class="tinfo">
        <b :style="{ color: getPlayers()[pl.ownerId].color }">{{ pl.name }}</b>
        — {{ getPlayers()[pl.ownerId].name }}
        <span v-if="isUnderTruce(pl)" class="dimtx">
          🕊️ truce ({{ pl.protectedUntil - getTurn() + 1 }} turn{{
            pl.protectedUntil - getTurn() ? 's' : ''
          }})
        </span>
      </div>
      <div>
        🪖{{ pl.troops }} {{ '🛡️'.repeat(pl.buildings.SHIELD || 0) }}
        <span
          v-if="getPlayers()[pl.ownerId].hasPacifistStatus"
          title="Pacifist — +6 defense"
          >☮️</span
        >
        🃏{{ handSize(getPlayers()[pl.ownerId]) }}
      </div>
    </div>
    <p style="margin-top: 12px">
      Troops aboard:
      <span class="stepper">
        <button @click="dec">−</button><span class="sval">{{ n }}</span
        ><button @click="inc">+</button>
      </span>
      <span class="dimtx"
        >({{ source.name }} garrisons {{ source.troops }}, rocket capacity
        {{ capFmt() }})</span
      >
    </p>
    <p>
      <template v-if="preview">
        Your strike {{ preview.ap }} + 🎲0-{{
          COMBAT.attackRoll
        }}
        &nbsp;vs&nbsp; defense {{ preview.dp }} + 🎲0-{{ COMBAT.defenseRoll
        }}<br />
        <b
          :style="{
            color:
              preview.note === 'good'
                ? '#7dff8a'
                : preview.note === 'close'
                  ? '#ffd23d'
                  : '#ff6b6b',
          }"
          >Win chance: {{ preview.winPct }}%</b
        >
        —
        <span v-if="preview.note === 'good'" style="color: #7dff8a"
          >odds look good.</span
        >
        <span v-else-if="preview.note === 'close'" style="color: #ffd23d"
          >close fight, luck decides.</span
        >
        <span v-else class="warn">likely suicide.</span>
        <span v-if="preview.sendingAll" class="warn">
          Sending everyone leaves {{ source.name }} defenseless!</span
        >
      </template>
      <span v-else class="warn"
        >All enemy planets are under truce — no valid target.</span
      >
    </p>
    <div class="mbtns">
      <button class="btn danger" :disabled="!canLaunch" @click="launch">
        🚀 LAUNCH
      </button>
      <button class="btn" @click="ui.closeModal()">Cancel</button>
    </div>
  </ModalShell>
</template>

<style scoped>
.vow-warning {
  margin-top: 10px;
  padding: 8px 10px;
  border: 1px solid rgba(255, 107, 107, 0.55);
  border-radius: 6px;
  background: rgba(255, 107, 107, 0.1);
  color: #ffb0b0;
  font-size: 12.5px;
  line-height: 1.45;
}
</style>
