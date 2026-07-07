<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGameStore } from '@/stores/game';
import ModalShell from './ModalShell.vue';
import {
  ACTION_TYPES,
  BUILD_ORDER,
  BUILDINGS,
  CARDS,
  CONQUEST_TRUCE,
  INFLUENCE_CARDS,
  INFLUENCE_TYPES,
} from '@/game/constants';
import {
  alivePlayers,
  coupTargets,
  influenceTarget,
  isPacifist,
} from '@/game/engine/index.ts';
import type { BuildingType, InfluenceType, Planet, Player } from '@/game/types';

const store = useGameStore();
const human = store.human;

type View = 'main' | 'coup' | 'steal';
const view = ref<View>('main');

const held = computed(() =>
  INFLUENCE_TYPES.filter((t) => (human.hand[t] || 0) > 0),
);
const coupList = computed(() => coupTargets(human));
// A Pacifist may coup a rival's last planet (their only path to a win); everyone
// else is barred from eliminating a player by influence card.
const canCoupLast = computed(() => isPacifist(human));
const rivals = computed(() => alivePlayers().filter((x) => !x.isHuman));

function skipTarget(t: InfluenceType): Player | null {
  return t.startsWith('SKIP_') ? influenceTarget(human, t) : null;
}

function chooseCard(t: InfluenceType): void {
  if (t === 'STEAL_ACTION') {
    view.value = 'steal';
    return;
  }
  if (t === 'COUP') {
    view.value = 'coup';
    return;
  }
  store.playInfluence(t);
}

function coupIcons(pl: Planet): string {
  return BUILD_ORDER.filter((b) => pl.buildings[b])
    .map(
      (b: BuildingType) =>
        BUILDINGS[b].icon + (pl.buildings[b] > 1 ? pl.buildings[b] : ''),
    )
    .join(' ');
}

function doCoup(pl: Planet): void {
  store.playInfluence('COUP', { planet: pl });
}
function doSteal(
  target: Player,
  cardType: 'RECRUIT' | 'ATTACK' | 'MOVE' | 'TRADE',
): void {
  store.playInfluence('STEAL_ACTION', { target, cardType });
}
</script>

<template>
  <ModalShell @close="store.closeModal()">
    <!-- main view -->
    <template v-if="view === 'main'">
      <h2>⭐ PLAY INFLUENCE CARD</h2>
      <p class="dimtx">
        These cards were paid for at draft time — playing one is free. Click a
        card to play it.
      </p>
      <div v-for="t in held" :key="t" class="trow" @click="chooseCard(t)">
        <div class="tinfo">
          <b>{{ INFLUENCE_CARDS[t].icon }} {{ INFLUENCE_CARDS[t].name }}</b> ×{{
            human.hand[t]
          }}
          —
          <span class="dimtx">{{ INFLUENCE_CARDS[t].desc }}</span>
          <template v-if="t.startsWith('SKIP_')">
            <span v-if="skipTarget(t)" class="dimtx">
              → would hit
              <b :style="{ color: skipTarget(t)!.color }">{{
                skipTarget(t)!.name
              }}</b></span
            >
            <span v-else class="warn"> (no rival to target)</span>
          </template>
        </div>
      </div>
      <div class="mbtns">
        <button class="btn" @click="store.closeModal()">Cancel</button>
      </div>
    </template>

    <!-- coup view -->
    <template v-else-if="view === 'coup'">
      <h2>👑 COUP D'ÉTAT</h2>
      <p class="dimtx">
        The chosen planet defects to you instantly — half its garrison disbands,
        the rest joins you (then a
        {{ CONQUEST_TRUCE }}-turn truce).
        <template v-if="canCoupLast">
          ☮️ As a PACIFIST, you may even take a rival's LAST planet —
          eliminating them. Only a truce protects a planet from a coup.
        </template>
        <template v-else>
          A rival's LAST planet is coup-proof — you cannot eliminate a player by
          influence card (only a PACIFIST can). A truce also protects a planet.
        </template>
      </p>
      <template v-if="coupList.length">
        <div
          v-for="pl in coupList"
          :key="pl.id"
          class="trow"
          @click="doCoup(pl)">
          <div class="tinfo">
            <b :style="{ color: store.state.players[pl.ownerId].color }">{{
              pl.name
            }}</b>
            — {{ store.state.players[pl.ownerId].name }}
          </div>
          <div>🪖{{ pl.troops }} {{ coupIcons(pl) }}</div>
        </div>
      </template>
      <p v-else class="warn">
        No valid target — planets under truce cannot be couped{{
          canCoupLast
            ? ''
            : ", and a rival's last planet can only be taken by a Pacifist"
        }}.
      </p>
      <div class="mbtns">
        <button class="btn" @click="view = 'main'">Back</button>
        <button class="btn" @click="store.closeModal()">Cancel</button>
      </div>
    </template>

    <!-- steal view -->
    <template v-else>
      <h2>🎭 EXTORTION</h2>
      <p class="dimtx">
        Take one action card of your choice from a chosen rival (influence cards
        cannot be taken).
      </p>
      <div v-for="r in rivals" :key="r.id" class="trow">
        <div class="tinfo">
          <b :style="{ color: r.color }">{{ r.name }}</b> —
          <template v-if="ACTION_TYPES.some((a) => r.hand[a] > 0)">
            <template v-for="a in ACTION_TYPES" :key="a">
              <button v-if="r.hand[a] > 0" class="tab" @click="doSteal(r, a)">
                {{ CARDS[a].icon }} {{ CARDS[a].name }} ×{{ r.hand[a] }}
              </button>
            </template>
          </template>
          <span v-else class="dimtx">no action cards</span>
        </div>
      </div>
      <div class="mbtns">
        <button class="btn" @click="view = 'main'">Back</button>
        <button class="btn" @click="store.closeModal()">Cancel</button>
      </div>
    </template>
  </ModalShell>
</template>
