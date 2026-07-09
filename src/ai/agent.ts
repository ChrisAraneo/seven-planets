import { getPendingOffer } from '@/stores/game/getters/get-pending-offer';
import { type PlayerAgent, setPlayerAgent } from '@/game/engine/agent';
import { canPickCard } from '@/game/actions/common/can-pick-card';
import type { Planet, Player } from '@/game/types';
import { getGameState, getStore } from '@/stores/game-state';

import { shouldAcceptTrade } from './functions/should-accept-trade';
import { mastermindAction } from './functions/mastermind-action';
import { mastermindDraftPick } from './functions/mastermind-draft-pick';

/* =====================================================================
   The mastermind player agent: the AI's ONLY connection to a running
   game. Like the human player it may read the game state (and the
   public rules), and it acts exclusively by dispatching the same store
   actions the human's clicks dispatch — it never mutates the state or
   calls engine internals directly.
   ===================================================================== */

function dispatch(action: string, payload: unknown): Promise<unknown> {
  return getStore().dispatch(`game/${action}`, payload);
}

export const mastermindAgent: PlayerAgent = {
  /** One action-turn decision: the brain picks, the store action acts. */
  async act(p: Player): Promise<boolean> {
    const d = mastermindAction(p);
    if (!d) {
      return false;
    }
    switch (d.kind) {
      case 'influence': {
        return (
          (await dispatch('useInfluence', {
            playerId: p.id,
            type: d.type,
            opts: d.opts,
          })) === true
        );
      }
      case 'attack': {
        return (
          (await dispatch('attackPlanet', {
            playerId: p.id,
            sourceId: d.source.id,
            targetId: d.target.id,
            n: d.n,
          })) === true
        );
      }
      case 'recruit': {
        return (
          (await dispatch('recruitTroops', {
            playerId: p.id,
            planetId: d.planet.id,
          })) === true
        );
      }
      case 'move': {
        return (
          (await dispatch('moveTroops', {
            playerId: p.id,
            fromId: d.from.id,
            toId: d.to.id,
            n: d.n,
          })) === true
        );
      }
      case 'trade': {
        return (
          (await dispatch('tradeResources', {
            playerId: p.id,
            partnerId: d.partner.id,
            gives: d.gives,
            gets: d.gets,
          })) === true
        );
      }
    }
    return false;
  },

  /** Draft pick: choose a pool card and take it via the `pick` action. */
  pickCard(p: Player, planet: Planet): void {
    const pickable = getGameState().pool.map((t) => canPickCard(p, t, planet));
    let idx = mastermindDraftPick(p, planet, pickable);
    if (idx < 0 || !pickable[idx]) {
      // The engine only asks when something is pickable — fall back to the
      // First legal card rather than leave the draft parked.
      idx = pickable.indexOf(true);
    }
    void dispatch('pickCard', { playerId: p.id, idx });
  },

  /** Answer the trade offer waiting in getPendingOffer() (addressed to `p`). */
  considerOffer(p: Player): void {
    const offer = getPendingOffer();
    if (!offer || offer.toId !== p.id) {
      return;
    }
    const proposer = getGameState().players[offer.fromId];
    // PendingOffer is from the proposer's perspective; flip it to `p`'s.
    const accept = shouldAcceptTrade(p, offer.gets, offer.gives, proposer);
    void dispatch('resolveOffer', { playerId: p.id, accept });
  },
};

/** Seat the mastermind agent at the engine's table. Called by the app,
    the headless scripts and the tests before any game runs. */
export function installAi(): void {
  setPlayerAgent(mastermindAgent);
}
