import { canAfford } from '@/game/constants';
import type { Player } from '@/game/types';
import { aiPickAttack } from './ai-pick-attack';
import { aiPickInfluencePlay } from './ai-pick-influence-play';
import { aiPlanTrade } from './ai-plan-trade';
import { doAttack } from './do-attack';
import { hasActionCard } from './has-action-card';
import { hasBuilding } from './has-building';
import { isPacifist } from './is-pacifist';
import { mastermindOneAction } from './mastermind-one-action';
import { moveTroops } from './move-troops';
import { ownedPlanets } from './owned-planets';
import { persOf } from './pers-of';
import { proposeTrade } from './propose-trade';
import { recruit } from './recruit';
import { recruitCost } from './recruit-cost';
import { rocketCap } from './rocket-cap';
import { singularityReadyPlanet } from './singularity-ready-planet';
import { troopTarget } from './troop-target';
import { useInfluenceCard } from './use-influence-card';

export async function aiOneAction(p: Player): Promise<boolean> {
  if (persOf(p) === 'mastermind') {
    return mastermindOneAction(p);
  }
  // 0. influence cards — already paid for at draft; play when the moment is right
  const infPlay = aiPickInfluencePlay(p);
  if (infPlay && useInfluenceCard(p, infPlay.type, infPlay)) {
    return true;
  }
  const readyPl = singularityReadyPlanet(p);
  const wantTroops = troopTarget(p);
  const pers = persOf(p);
  // The invasion staging site: the planet whose silo can launch the most troops.
  const staging = ownedPlanets(p).reduce((a, b) =>
    rocketCap(b) > rocketCap(a) ||
    (rocketCap(b) === rocketCap(a) && b.troops > a.troops)
      ? b
      : a,
  );
  const stagingCap = rocketCap(staging);
  const invasionNeed =
    pers !== 'pacifist' &&
    !isPacifist(p) &&
    p.hand.ATTACK > 0 &&
    hasBuilding(p, 'SILO') &&
    (stagingCap === Infinity
      ? staging.troops < wantTroops + 4
      : staging.troops < stagingCap + 3);

  // 1. recruit — ONLY possible on a Barracks planet the player can afford
  if (hasActionCard(p, 'RECRUIT')) {
    const barracksPls = ownedPlanets(p).filter(
      (pl) => pl.buildings.BARRACKS && canAfford(p.hand, recruitCost(pl)),
    );
    if (
      barracksPls.length > 0 &&
      (invasionNeed || ownedPlanets(p).some((pl) => pl.troops < wantTroops))
    ) {
      const best = barracksPls.reduce((a, b) =>
        b.buildings.BARRACKS > a.buildings.BARRACKS ||
        (b.buildings.BARRACKS === a.buildings.BARRACKS && b.troops < a.troops)
          ? b
          : a,
      );
      recruit(p, best);
      return true;
    }
  }

  // 2. attack — limited by the Attack cards in hand
  const atk = aiPickAttack(p);
  if (atk) {
    await doAttack(p, atk.source, atk.target, atk.n);
    return true;
  }

  // 3. move — needs a Spaceport; concentrate the invasion force on the staging planet…
  const canMove =
    hasActionCard(p, 'MOVE') &&
    hasBuilding(p, 'SPACEPORT') &&
    p.planets.length >= 2;
  if (canMove && invasionNeed) {
    const donors = ownedPlanets(p).filter(
      (pl) => pl !== staging && pl.troops > 4,
    );
    if (donors.length > 0) {
      const donor = donors.reduce((a, b) => (a.troops >= b.troops ? a : b));
      const n = Math.min(rocketCap(donor), donor.troops - 3);
      if (n >= 2) {
        await moveTroops(p, donor, staging, n);
        return true;
      }
    }
  }
  // …or shuttle troops from the strongest garrison to where defense is needed
  if (canMove) {
    const pls = ownedPlanets(p);
    const strongest = pls.reduce((a, b) => (a.troops >= b.troops ? a : b));
    const dest =
      readyPl && readyPl !== strongest
        ? readyPl
        : pls.reduce((a, b) => (a.troops <= b.troops ? a : b));
    if (dest !== strongest && strongest.troops - dest.troops >= 4) {
      const n = Math.min(
        rocketCap(strongest),
        Math.floor((strongest.troops - dest.troops) / 2),
      );
      if (n >= 1) {
        await moveTroops(p, strongest, dest, n);
        return true;
      }
    }
  }

  // 4. trade — requires a Trade card (spent only if the deal goes through)
  const tradeEager = pers === 'trader' || pers === 'pacifist';
  if (
    !p.tradedThisTurn &&
    hasActionCard(p, 'TRADE') &&
    (tradeEager || Math.random() < 0.55)
  ) {
    p.tradedThisTurn = true;
    const offer = aiPlanTrade(p);
    if (offer) {
      return await proposeTrade(p, offer);
    }
  }
  return false;
}
