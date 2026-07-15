<script setup lang="ts">
import { computed, ref } from 'vue';
import { createUseInfluenceAction, dispatch } from '@seven-planets/game';
import { useGameStore, useUiStore } from '@/stores';
import ModalShell from './ModalShell.vue';
import {
  ACTION_TYPES,
  BUILD_ORDER,
  BUILDINGS,
  CARDS,
  CONQUEST_TRUCE,
  INFLUENCE_CARDS,
  INFLUENCE_TYPES,
} from '@seven-planets/game';
import { filterAlivePlayers } from '@seven-planets/game';
import { getCoupTargets } from '@seven-planets/game';
import { getInfluenceTarget } from '@seven-planets/game';
import { isPacifist } from '@seven-planets/game';
import type {
  BuildingType,
  InfluenceOptions,
  InfluenceType,
  Planet,
  Player,
} from '@seven-planets/game';

const game = useGameStore();
const ui = useUiStore();

const human = game.state.players[0];

function playInfluence(
  type: InfluenceType,
  options: InfluenceOptions = {},
): void {
  ui.closeModal();
  dispatch(createUseInfluenceAction({ playerId: 0, type, options }));
}

type View = 'main' | 'coup' | 'steal';
const view = ref<View>('main');

const held = computed(() =>
  INFLUENCE_TYPES.filter(
    (influenceType) => (human.hand[influenceType] || 0) > 0,
  ),
);
const coupList = computed(() => getCoupTargets(game.state, human));
// A Pacifist may coup a rival's last planet (their only path to a win); everyone
// else is barred from eliminating a player by influence card.
const canCoupLast = computed(() => isPacifist(human));
const rivals = computed(() =>
  filterAlivePlayers(game.state).filter((player) => !player.isHuman),
);

function skipTarget(influenceType: InfluenceType): Player | null {
  return influenceType.startsWith('SKIP_')
    ? getInfluenceTarget(game.state, human, influenceType)
    : null;
}

function chooseCard(influenceType: InfluenceType): void {
  if (influenceType === 'STEAL_ACTION') {
    view.value = 'steal';
    return;
  }
  if (influenceType === 'COUP') {
    view.value = 'coup';
    return;
  }
  playInfluence(influenceType);
}

function coupIcons(planet: Planet): string {
  return BUILD_ORDER.filter((b) => planet.buildings[b])
    .map(
      (b: BuildingType) =>
        BUILDINGS[b].icon +
        (planet.buildings[b] > 1 ? planet.buildings[b] : ''),
    )
    .join(' ');
}

function doCoup(planet: Planet): void {
  playInfluence('COUP', { planet });
}
function doSteal(
  target: Player,
  cardType: 'RECRUIT' | 'ATTACK' | 'MOVE' | 'TRADE',
): void {
  playInfluence('STEAL_ACTION', { target, cardType });
}
</script>

<template>
  <ModalShell @close="ui.closeModal()">
    <!-- main view -->
    <template v-if="view === 'main'">
      <h2>⭐ PLAY INFLUENCE CARD</h2>
      <p class="dimtx">
        These cards were paid for at draft time — playing one is free. Click a
        card to play it.
      </p>
      <div
        v-for="influenceType in held"
        :key="influenceType"
        class="trow"
        @click="chooseCard(influenceType)">
        <div class="tinfo">
          <b
            >{{ INFLUENCE_CARDS[influenceType].icon }}
            {{ INFLUENCE_CARDS[influenceType].name }}</b
          >
          ×{{ human.hand[influenceType] }}
          —
          <span class="dimtx">{{ INFLUENCE_CARDS[influenceType].desc }}</span>
          <template v-if="influenceType.startsWith('SKIP_')">
            <span v-if="skipTarget(influenceType)" class="dimtx">
              → would hit
              <b :style="{ color: skipTarget(influenceType)!.color }">{{
                skipTarget(influenceType)!.name
              }}</b></span
            >
            <span v-else class="warn"> (no rival to target)</span>
          </template>
        </div>
      </div>
      <div class="mbtns">
        <button class="btn" @click="ui.closeModal()">Cancel</button>
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
          v-for="planet in coupList"
          :key="planet.id"
          class="trow"
          @click="doCoup(planet)">
          <div class="tinfo">
            <b :style="{ color: game.state.players[planet.ownerId].color }">{{
              planet.name
            }}</b>
            — {{ game.state.players[planet.ownerId].name }}
          </div>
          <div>🪖{{ planet.troops }} {{ coupIcons(planet) }}</div>
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
        <button class="btn" @click="ui.closeModal()">Cancel</button>
      </div>
    </template>

    <!-- steal view -->
    <template v-else>
      <h2>🎭 EXTORTION</h2>
      <p class="dimtx">
        Take one action card of your choice from a chosen rival (influence cards
        cannot be taken).
      </p>
      <div v-for="rival in rivals" :key="rival.id" class="trow">
        <div class="tinfo">
          <b :style="{ color: rival.color }">{{ rival.name }}</b> —
          <template
            v-if="
              ACTION_TYPES.some((actionType) => rival.hand[actionType] > 0)
            ">
            <template v-for="actionType in ACTION_TYPES" :key="actionType">
              <button
                v-if="rival.hand[actionType] > 0"
                class="tab"
                @click="doSteal(rival, actionType)">
                {{ CARDS[actionType].icon }} {{ CARDS[actionType].name }} ×{{
                  rival.hand[actionType]
                }}
              </button>
            </template>
          </template>
          <span v-else class="dimtx">no action cards</span>
        </div>
      </div>
      <div class="mbtns">
        <button class="btn" @click="view = 'main'">Back</button>
        <button class="btn" @click="ui.closeModal()">Cancel</button>
      </div>
    </template>
  </ModalShell>
</template>
