import { hasActionCard } from '../../functions/has-action-card';
import { setBusy } from '../../functions/set-busy';
import type { GameState, Planet, Player } from '@/game/types';
import { checkWin } from '../../functions/check-win';
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
} from '@/game/config/constants';
import { animateRocket, boom, floatText } from '@/game/hooks';
import { handSize } from '../../functions/hand-size';
import { log } from '../../functions/log';
import { stealCards } from '../../functions/steal-cards';
import { siloBonus } from '@/game/functions/silo-bonus';
import { singularityDefBonus } from '@/game/functions/singularity-def-bonus';
import { isUnderTruce } from '../../functions/is-under-truce';
import { ownedPlanets } from '../../functions/owned-planets';
import { pacifistDefBonus } from '../../functions/pacifist-def-bonus';
import { spendActionCard } from '../../functions/spend-action-card';
import type { GameModuleState } from '../../game';
import { cloneDeep } from 'lodash-es';

/* The `attack` store action: launch a rocket from one planet at another.
   The human's AttackModal and the AI agent both dispatch this. Returns
   whether an Attack card was spent on the launch attempt. */
export interface AttackPlanetPayload {
  playerId: number;
  sourceId: number;
  targetId: number;
  n: number;
}

export async function attackPlanet(
  moduleState: GameModuleState,
  payload: AttackPlanetPayload,
): Promise<void> {
  const state = cloneDeep(moduleState.state);
  const { playerId, sourceId, targetId, n } = payload;

  if (playerId !== state.activeId || state.over) {
    return;
  }

  const player = state.players[playerId];

  if (!hasActionCard(player, 'ATTACK')) {
    return;
  }

  setBusy(state, true);

  try {
    await doAttack(
      state,
      player,
      state.planets[sourceId],
      state.planets[targetId],
      n,
    );
  } finally {
    setBusy(state, false);
  }

  moduleState.state = state;
}

function conquerPlanet(
  state: GameState,
  attacker: Player,
  target: Planet,
  garrison: number,
): void {
  const defender = state.players[target.ownerId];

  target.ownerId = attacker.id;
  defender.planets = defender.planets.filter((id) => id !== target.id);
  attacker.planets.push(target.id);
  target.troops = garrison;
  target.protectedUntil = state.turn + CONQUEST_TRUCE;

  floatText(target, 'CONQUERED!', '#ff9e3d');
  log(
    state,
    `🏴 ${attacker.name} CONQUERS ${target.name} — ${garrison}🪖 garrison it! Under truce for ${CONQUEST_TRUCE} turns.`,
    'war',
  );

  if (defender.planets.length === 0) {
    const lootN = Math.min(6, handSize(defender));

    if (lootN > 0) {
      const taken = stealCards(defender, attacker, lootN);
      log(
        state,
        `💰 ${attacker.name} salvages ${fmtCards(taken)} from the ruins!`,
        'war',
      );
    }

    for (const cardType of CARD_TYPES) {
      defender.hand[cardType] = 0;
    }

    for (const influenceType of INFLUENCE_TYPES) {
      defender.hand[influenceType] = 0;
    }

    defender.alive = false;

    log(state, `☠️ ${defender.name} has been wiped from the galaxy!`, 'war');
  } else {
    const lootN = Math.min(5, Math.ceil(handSize(defender) / 2));

    if (lootN > 0) {
      const taken = stealCards(defender, attacker, lootN);
      log(
        state,
        `💰 ${attacker.name} seizes ${fmtCards(taken)} from the fleeing ${defender.name}!`,
        'war',
      );
    }
  }

  checkWin(state);
}

async function doAttack(
  state: GameState,
  attacker: Player,
  source: Planet,
  target: Planet,
  n: number,
): Promise<void> {
  if (isUnderTruce(target)) {
    return;
  } // Freshly conquered planets cannot be attacked

  if (!source.buildings.SILO) {
    return;
  } // No silo, no rockets

  // Breaking the vow: a PACIFIST may attack, but doing so permanently strips the
  // Status and its bonuses — and pacifismForfeited bars them from ever regaining it.
  if (attacker.pacifistStatus) {
    attacker.pacifistStatus = false;
    attacker.pacifismForfeited = true;

    log(
      state,
      `⚔️ ${attacker.name} breaks their pacifist vow to strike — the +${PACIFIST_DEF_BONUS} defense and +${PACIFIST_INFLUENCE}⭐ per planet are gone for good.`,
      'war',
    );

    for (const pl of ownedPlanets(state, attacker)) {
      floatText(pl, '⚔️ VOW BROKEN', '#ff6b6b');
    }
  }

  spendActionCard(attacker, 'ATTACK');

  attacker.lastAttackTurn = state.turn; // Resets the pacifist countdown
  const defender = state.players[target.ownerId];

  source.troops -= n;
  log(
    state,
    `🚀 ${attacker.name} launches a rocket with ${n} troops from ${source.name} at ${target.name} (${defender.name})!`,
    'war',
  );

  if (!attacker.isHuman && Math.random() < 0.4) {
    log(state, `   ${attacker.name}: ${choice(TAUNTS)}`, 'war');
  }
  await animateRocket(source, target, attacker.color);

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
  boom(target);
  log(
    state,
    `💥 Battle for ${target.name}: attack ${ap} vs defense ${dp} — ${win ? `${attacker.name} WINS` : `${defender.name} holds`}! Losses: ${attacker.name} -${attLoss}🪖, ${defender.name} -${defLoss}🪖`,
    'war',
  );

  if (win) {
    // No spoils for merely winning a battle — only conquest pays
    if (target.troops <= 0) {
      conquerPlanet(state, attacker, target, survivors); // The surviving strike force garrisons it
    } else {
      source.troops += survivors; // Raiders fly home
      floatText(target, 'RAIDED!', '#ff8a97');
    }
  } else {
    source.troops += survivors;
    floatText(target, 'DEFENDED!', '#7dff8a');
  }

  checkWin(state);
}
