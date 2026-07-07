import {
  COMBAT,
  PACIFIST_DEF_BONUS,
  PACIFIST_INFLUENCE,
  randInt,
  TAUNTS,
  choice,
  HOME_FIELD,
  SHIELD_DEFENSE,
} from '@/game/constants';
import { animateRocket, boom, floatText } from '@/game/effects';
import type { Planet, Player } from '@/game/types';
import { getState } from '../state';
import { conquerPlanet } from './conquer-planet';
import { log } from './log';
import { ownedPlanets } from './owned-planets';
import { pacifistDefBonus } from './pacifist-def-bonus';
import { siloBonus } from './silo-bonus';
import { singularityDefBonus } from './singularity-def-bonus';
import { spendActionCard } from './spend-action-card';
import { underTruce } from './under-truce';
import { checkWin } from './check-win';

// An attack launches from one of the attacker's planets, using THAT planet's army.
export async function doAttack(
  att: Player,
  source: Planet,
  target: Planet,
  n: number,
): Promise<void> {
  if (underTruce(target)) {
    return;
  } // Freshly conquered planets cannot be attacked
  if (!source.buildings.SILO) {
    return;
  } // No silo, no rockets
  // Breaking the vow: a PACIFIST may attack, but doing so permanently strips the
  // Status and its bonuses — and pacifismForfeited bars them from ever regaining it.
  if (att.pacifistStatus) {
    att.pacifistStatus = false;
    att.pacifismForfeited = true;
    log(
      `⚔️ ${att.name} breaks their pacifist vow to strike — the +${PACIFIST_DEF_BONUS} defense and +${PACIFIST_INFLUENCE}⭐ per planet are gone for good.`,
      'war',
    );
    for (const pl of ownedPlanets(att)) {
      floatText(pl, '⚔️ VOW BROKEN', '#ff6b6b');
    }
  }
  spendActionCard(att, 'ATTACK');
  att.lastAttackTurn = getState().turn; // Resets the pacifist countdown
  const def = getState().players[target.ownerId];
  source.troops -= n;
  log(
    `🚀 ${att.name} launches a rocket with ${n} troops from ${source.name} at ${target.name} (${def.name})!`,
    'war',
  );
  if (!att.isHuman && Math.random() < 0.4) {
    log(`   ${att.name}: ${choice(TAUNTS)}`, 'war');
  }
  await animateRocket(source, target, att.color);

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
    pacifistDefBonus(target) +
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
    `💥 Battle for ${target.name}: attack ${ap} vs defense ${dp} — ${win ? `${att.name} WINS` : `${def.name} holds`}! Losses: ${att.name} -${attLoss}🪖, ${def.name} -${defLoss}🪖`,
    'war',
  );

  if (win) {
    // No spoils for merely winning a battle — only conquest pays
    if (target.troops <= 0) {
      conquerPlanet(att, target, survivors); // The surviving strike force garrisons it
    } else {
      source.troops += survivors; // Raiders fly home
      floatText(target, 'RAIDED!', '#ff8a97');
    }
  } else {
    source.troops += survivors;
    floatText(target, 'DEFENDED!', '#7dff8a');
  }
  checkWin();
}
