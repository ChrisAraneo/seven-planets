<script setup lang="ts">
import { computed } from 'vue';
import { pickCard } from '@seven-planets/game';
import { useGameStore } from '@/stores';
import {
  BUILDINGS,
  computeBuildingCost,
  CARDS,
  getCostLabel,
  INFLUENCE_CARDS,
  getMaxLevel,
} from '@seven-planets/game';
import { canPickCard } from '@seven-planets/game';
import { getBuildingLevel } from '@seven-planets/game';
import { getHomePlanet } from '@seven-planets/game';
import { isBuildingType, isInfluenceType } from '@seven-planets/game';
import type {
  BuildingType,
  GameState,
  InfluenceType,
  Planet,
  Player,
  PoolType,
} from '@seven-planets/game';
import { noop } from 'lodash-es';
import { match } from 'ts-pattern';

import { chain } from '@/utils/chain';

const game = useGameStore();

const isPicking = computed(
  () =>
    game.state.isAwaitingPick && game.state.activeId === 0 && !game.state.over,
);

interface PoolCardVM {
  poolIndex: number;
  type: PoolType;
  kind: 'building' | 'influence' | 'regular';
  cls: string;
  color: string;
  valid: boolean;
  icon: string;
  name: string;
  cost?: string;
  bonus?: string;
  badge?: string;
  title: string;
}

const hints: Partial<Record<PoolType, string>> = {
  ATTACK:
    ' (needs a 🚀 Rocket Silo and at least 1 soldier to pick — attacks launch only from Silo planets)',
  MOVE: ' (needs a 🛰️ Spaceport and 2+ planets to pick — troops redeploy only FROM a Spaceport planet)',
  RECRUIT:
    ' (needs a 🎖️ Barracks to pick — recruiting is impossible without one)',
  TRADE: ' (needs a 🤝 Embassy to pick — trading is impossible without one)',
};

const buildBuildingCard = (
  draftPlanet: Planet,
  picking: boolean,
  buildingType: BuildingType,
  poolIndex: number,
  base: string,
  valid: boolean,
): PoolCardVM =>
  chain({
    buildingDef: BUILDINGS[buildingType],
    cur: match(picking)
      .with(true, () => getBuildingLevel(draftPlanet, buildingType))
      .otherwise(() => 0),
  })
    .thru(({ buildingDef, cur }) =>
      chain({
        buildingDef,
        cur,
        next: Math.min(cur + 1, getMaxLevel(buildingType)),
      })
        .thru(({ next }) => ({
          buildingDef,
          next,
          cost: getCostLabel(computeBuildingCost(buildingType, next)),
          badge: match(cur > 0 && cur < getMaxLevel(buildingType))
            .with(true, () => ` ⬆L${cur + 1}`)
            .otherwise(() => ''),
        }))
        .thru(
          ({ buildingDef: def, next, cost, badge }): PoolCardVM => ({
            poolIndex,
            type: buildingType,
            kind: 'building',
            cls: base + ' bcard',
            color: CARDS[buildingType].color,
            valid,
            icon: def.icon,
            name: def.name,
            cost,
            bonus: def.short,
            badge,
            title: `${def.name}: ${def.desc} — cost ${cost} for level ${next} (level N costs N× base, max L${getMaxLevel(buildingType)}, capped by your tech). Picking builds or upgrades it instantly on the drafting planet.`,
          }),
        )
        .value(),
    )
    .value();

const buildInfluenceCard = (
  influenceType: InfluenceType,
  poolIndex: number,
  base: string,
  valid: boolean,
): PoolCardVM =>
  chain(INFLUENCE_CARDS[influenceType])
    .thru(
      (influenceCard): PoolCardVM => ({
        poolIndex,
        type: influenceType,
        kind: 'influence',
        cls: base + ' bcard',
        color: CARDS[influenceType].color,
        valid,
        icon: influenceCard.icon,
        name: influenceCard.name,
        cost: `${influenceCard.cost}⭐`,
        bonus: 'influence',
        title: `${influenceCard.name}: ${influenceCard.desc} — costs ${influenceCard.cost}⭐ Influence now; goes to your hand and can be played on any of your action turns.`,
      }),
    )
    .value();

const buildPoolCard = (
  state: GameState,
  picking: boolean,
  human: Player,
  draftPlanet: Planet,
  poolType: PoolType,
  poolIndex: number,
): PoolCardVM =>
  chain({
    card: CARDS[poolType],
    valid: picking && canPickCard(state, human, poolType, draftPlanet),
  })
    .thru(({ card, valid }) =>
      chain(
        `card ${match(picking)
          .with(true, () =>
            match(valid)
              .with(true, () => 'pickable')
              .otherwise(() => 'locked'),
          )
          .otherwise(() => '')} ${match(Boolean(card.isAction))
          .with(true, () => 'action')
          .otherwise(() => '')}`,
      )
        .thru((base) =>
          match(poolType)
            .when(isBuildingType, (buildingType) =>
              buildBuildingCard(
                draftPlanet,
                picking,
                buildingType,
                poolIndex,
                base,
                valid,
              ),
            )
            .when(isInfluenceType, (influenceType) =>
              buildInfluenceCard(influenceType, poolIndex, base, valid),
            )
            .otherwise(
              (regularType): PoolCardVM => ({
                poolIndex,
                type: regularType,
                kind: 'regular',
                cls: base,
                color: card.color,
                valid,
                icon: card.icon,
                name: card.name,
                title: `${card.name}${hints[regularType] || ''}`,
              }),
            ),
        )
        .value(),
    )
    .value();

const poolCards = computed<PoolCardVM[]>(() =>
  match(game.state)
    .when(
      (state) => state.phase !== 'draft' || Boolean(state.over),
      (): PoolCardVM[] => [],
    )
    .otherwise((state) =>
      state.pool.map((poolType: PoolType, poolIndex: number) =>
        buildPoolCard(
          state,
          isPicking.value,
          state.players[0],
          state.planets[state.draftPlanetId] ||
            getHomePlanet(state, state.players[0]),
          poolType,
          poolIndex,
        ),
      ),
    ),
);

const pick = (poolCard: PoolCardVM): void =>
  match(isPicking.value && poolCard.valid)
    .with(true, () =>
      chain(pickCard({ playerId: 0, index: poolCard.poolIndex }))
        .thru(noop)
        .value(),
    )
    .otherwise(noop);
</script>

<template>
  <div
    id="pool-zone"
    :class="{ empty: !poolCards.length }"
  >
    <div id="status">
      {{ game.state.status }}
    </div>
    <div id="pool">
      <div
        v-for="poolCard in poolCards"
        :key="poolCard.poolIndex"
        v-tooltip="poolCard.title"
        :class="poolCard.cls"
        :style="{ borderColor: poolCard.color }"
        @click="pick(poolCard)"
      >
        <template v-if="poolCard.kind === 'regular'">
          <div class="ic">
            {{ poolCard.icon }}
          </div>
          <div class="nm">
            {{ poolCard.name }}
          </div>
        </template>
        <template v-else>
          <div class="bhead">
            <span class="bic2">{{ poolCard.icon }}</span><span class="bnm">{{ poolCard.name }}{{ poolCard.badge }}</span>
          </div>
          <div class="bcost2">
            {{ poolCard.cost }}
          </div>
          <div class="bbonus">
            {{ poolCard.bonus }}
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
