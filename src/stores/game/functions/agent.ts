import type { Planet, Player } from '@/game/types';

/* =====================================================================
   Player-agent bridge: how a non-human seat is asked to play.

   The engine treats every seat identically — it parks on the same
   input resolvers (pool pick, trade offer) and executes the same store
   actions regardless of who is deciding. When a seat is not controlled
   by the human UI, the engine notifies the installed agent, which may
   only READ the game state and answer by dispatching the same store
   actions the human's clicks dispatch (pick / attack / move / recruit /
   trade / scheme / resolveOffer).

   The game core defines only this interface; the implementation lives
   in src/ai and is installed by the composition roots (main.ts, the
   headless scripts and the tests) via setPlayerAgent().
   ===================================================================== */

export interface PlayerAgent {
  /** Decide and perform ONE action for `p` by dispatching a store action.
      Return false when the seat has nothing more to do this turn. */
  act(p: Player): Promise<boolean>;
  /** It is `p`'s draft pick for `planet` and at least one pool card is
      pickable — answer by dispatching the `pick` store action. */
  pickCard(p: Player, planet: Planet): void;
  /** A trade offer for `p` is waiting in state.pendingOffer — answer by
      dispatching the `resolveOffer` store action. */
  considerOffer(p: Player): void;
}

let agent: PlayerAgent | null = null;

export function setPlayerAgent(a: PlayerAgent): void {
  agent = a;
}

export function getPlayerAgent(): PlayerAgent {
  if (!agent) {
    throw new Error(
      'No player agent installed — call installAi() (src/ai/agent.ts) before running the game.',
    );
  }
  return agent;
}
