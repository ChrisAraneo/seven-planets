import { getOver } from '@/stores/game/getters/get-over';
import { getPlayerAgent } from '@/game/engine/agent';
import { sleep } from '@/game/hooks';
import type { Player } from '@/game/types';

/** An agent-driven seat's action turn: the installed agent decides one
    action at a time (executing it through the shared store actions);
    the engine owns the pacing and the 12-action cap. */
export async function agentActionTurn(player: Player): Promise<void> {
  const agent = getPlayerAgent();
  await sleep(350);

  for (let i = 0; i < 12; i++) {
    if (getOver()) {
      return;
    }

    if (!(await agent.act(player))) {
      break;
    }

    await sleep(320);
  }
}
