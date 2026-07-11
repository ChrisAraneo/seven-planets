import { hasActionCard } from '../functions/has-action-card';
import { setBusy } from '../functions/set-busy';
import type { GameState } from '../interfaces/game-state';
import { checkWin } from '../functions/check-win';
import {
  CONQUEST_TRUCE,
  fmtCards,
  CARD_TYPES,
  INFLUENCE_TYPES,
  choice,
  COMBAT,
  HOME_FIELD,
  PACIFIST_DEF_BONUS,
  PACIFIST_INFLUENCE,
  randInt,
  SHIELD_DEFENSE,
  TAUNTS,
  NO_PRESENTATION,
} from '../config/constants';
import { handSize } from '../functions/hand-size';
import { log } from '../functions/log';
import { stealCards } from '../functions/steal-cards';
import { siloBonus } from '../functions/silo-bonus';
import { singularityDefBonus } from '../functions/singularity-def-bonus';
import { isUnderTruce } from '../functions/is-under-truce';
import { ownedPlanets } from '../functions/owned-planets';
import { pacifistDefBonus } from '../functions/pacifist-def-bonus';
import { spendActionCard } from '../functions/spend-action-card';
import { getGameState, setGameState } from '../game-state';
import { cloneDeep } from 'lodash-es';
import type { PresentationHooks } from '../interfaces/presentation-hooks';

export interface AttackPlanetPayload {
  playerId: number;
  sourceId: number;
  targetId: number;
  n: number;
}

export async function attackPlanet(
  payload: AttackPlanetPayload,
  hooks: PresentationHooks = NO_PRESENTATION,
): Promise<void> {
  const state = cloneDeep(getGameState());
  const { playerId, sourceId, targetId, n } = payload;

  if (playerId !== state.activeId || state.over) {
    return;
  }

  if (!hasActionCard(state.players[playerId], 'ATTACK')) {
    return;
  }

  Object.assign(state, setBusy(state, true));

  try {
    await doAttack(state, playerId, sourceId, targetId, n, hooks);
  } finally {
    Object.assign(state, setBusy(state, false));
  }

  setGameState(state);
}

async function doAttack(
  state: GameState,
  attackerId: number,
  sourceId: number,
  targetId: number,
  n: number,
  hooks: PresentationHooks,
): Promise<void> {
  const source = state.planets[sourceId];
  const target = state.planets[targetId];

  if (isUnderTruce(target)) {
    return;
  } // Freshly conquered planets cannot be attacked

  if (!source.buildings.SILO) {
    return;
  } // No silo, no rockets

  // Breaking the vow: a PACIFIST may attack, but doing so permanently strips the
  // Status and its bonuses — and pacifismForfeited bars them from ever regaining it.
  if (state.players[attackerId].pacifistStatus) {
    state.players[attackerId].pacifistStatus = false;
    state.players[attackerId].pacifismForfeited = true;

    Object.assign(
      state,
      log(
        state,
        `⚔️ ${state.players[attackerId].name} breaks their pacifist vow to strike — the +${PACIFIST_DEF_BONUS} defense and +${PACIFIST_INFLUENCE}⭐ per planet are gone for good.`,
        'war',
      ),
    );

    for (const pl of ownedPlanets(state, state.players[attackerId])) {
      hooks.floatText(pl, '⚔️ VOW BROKEN', '#ff6b6b');
    }
  }

  Object.assign(state, spendActionCard(state, attackerId, 'ATTACK'));

  state.players[attackerId].lastAttackTurn = state.turn; // Resets the pacifist countdown
  const defenderId = target.ownerId;

  source.troops -= n;
  Object.assign(
    state,
    log(
      state,
      `🚀 ${state.players[attackerId].name} launches a rocket with ${n} troops from ${source.name} at ${target.name} (${state.players[defenderId].name})!`,
      'war',
    ),
  );

  if (!state.players[attackerId].isHuman && Math.random() < 0.4) {
    Object.assign(
      state,
      log(
        state,
        `   ${state.players[attackerId].name}: ${choice(TAUNTS)}`,
        'war',
      ),
    );
  }
  await hooks.rocket(source, target, state.players[attackerId].color);

  // Battle resolution reads every coefficient from constants.COMBAT so the
  // Planning AI (./ai) predicts with the exact numbers the dice use.
  const shieldDef = (target.buildings.SHIELD || 0) * SHIELD_DEFENSE; // Shields stack
  const ap =
    COMBAT.attackPerTroop * n +
    siloBonus(source) +
    randInt(0, COMBAT.attackRoll);
  const dp =
    COMBAT.defensePerTroop * target.troops +
    shieldDef +
    pacifistDefBonus(state, target) +
    singularityDefBonus(target) +
    HOME_FIELD +
    randInt(0, COMBAT.defenseRoll);
  const win = ap > dp;

  let attLoss: number, defLoss: number;
  if (win) {
    defLoss = Math.min(
      target.troops,
      Math.ceil((n * COMBAT.winDefLoss.num) / COMBAT.winDefLoss.den),
    );
    attLoss = Math.floor((n * COMBAT.winAttLoss.num) / COMBAT.winAttLoss.den);
  } else {
    attLoss = Math.ceil((n * COMBAT.loseAttLoss.num) / COMBAT.loseAttLoss.den);
    defLoss = Math.min(
      target.troops,
      Math.floor((n * COMBAT.loseDefLoss.num) / COMBAT.loseDefLoss.den),
    );
  }
  const survivors = n - attLoss;
  target.troops -= defLoss;
  hooks.boom(target);
  Object.assign(
    state,
    log(
      state,
      `💥 Battle for ${target.name}: attack ${ap} vs defense ${dp} — ${win ? `${state.players[attackerId].name} WINS` : `${state.players[defenderId].name} holds`}! Losses: ${state.players[attackerId].name} -${attLoss}🪖, ${state.players[defenderId].name} -${defLoss}🪖`,
      'war',
    ),
  );

  if (win) {
    // No spoils for merely winning a battle — only conquest pays
    if (target.troops <= 0) {
      conquerPlanet(state, attackerId, targetId, survivors, hooks); // The surviving strike force garrisons it
    } else {
      source.troops += survivors; // Raiders fly home
      hooks.floatText(target, 'RAIDED!', '#ff8a97');
    }
  } else {
    source.troops += survivors;
    hooks.floatText(target, 'DEFENDED!', '#7dff8a');
  }

  Object.assign(state, checkWin(state));
}

function conquerPlanet(
  state: GameState,
  attackerId: number,
  targetId: number,
  garrison: number,
  hooks: PresentationHooks,
): void {
  const target = state.planets[targetId];
  const defenderId = target.ownerId;

  target.ownerId = attackerId;
  state.players[defenderId].planets = state.players[defenderId].planets.filter(
    (id) => id !== targetId,
  );
  state.players[attackerId].planets.push(targetId);
  target.troops = garrison;
  target.protectedUntil = state.turn + CONQUEST_TRUCE;

  hooks.floatText(target, 'CONQUERED!', '#ff9e3d');
  Object.assign(
    state,
    log(
      state,
      `🏴 ${state.players[attackerId].name} CONQUERS ${target.name} — ${garrison}🪖 garrison it! Under truce for ${CONQUEST_TRUCE} turns.`,
      'war',
    ),
  );

  if (state.players[defenderId].planets.length === 0) {
    const lootN = Math.min(6, handSize(state.players[defenderId]));

    if (lootN > 0) {
      const { state: looted, taken } = stealCards(
        state,
        defenderId,
        attackerId,
        lootN,
      );
      Object.assign(state, looted);
      Object.assign(
        state,
        log(
          state,
          `💰 ${state.players[attackerId].name} salvages ${fmtCards(taken)} from the ruins!`,
          'war',
        ),
      );
    }

    for (const cardType of CARD_TYPES) {
      state.players[defenderId].hand[cardType] = 0;
    }

    for (const influenceType of INFLUENCE_TYPES) {
      state.players[defenderId].hand[influenceType] = 0;
    }

    state.players[defenderId].alive = false;

    Object.assign(
      state,
      log(
        state,
        `☠️ ${state.players[defenderId].name} has been wiped from the galaxy!`,
        'war',
      ),
    );
  } else {
    const lootN = Math.min(
      5,
      Math.ceil(handSize(state.players[defenderId]) / 2),
    );

    if (lootN > 0) {
      const { state: looted, taken } = stealCards(
        state,
        defenderId,
        attackerId,
        lootN,
      );
      Object.assign(state, looted);
      Object.assign(
        state,
        log(
          state,
          `💰 ${state.players[attackerId].name} seizes ${fmtCards(taken)} from the fleeing ${state.players[defenderId].name}!`,
          'war',
        ),
      );
    }
  }

  Object.assign(state, checkWin(state));
}
