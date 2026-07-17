import type { GameState } from '../interfaces/game-state';
import { chain } from '../utils/chain';
import type { IncomeTally } from './do-income';
import { formatCards } from './format-cards';
import { log } from './log';

export const logIncome = (state: GameState, tally: IncomeTally): GameState =>
  chain(state)
    .thru((current) =>
      Object.entries(tally.gains).reduce(
        (acc, [id, produced]) =>
          log(
            acc,
            `⚙️ ${acc.players[Number(id)].name} produces ${formatCards(produced ?? {})}`,
            'draft',
          ),
        current,
      ),
    )
    .thru((current) =>
      Object.entries(tally.moveGains).reduce(
        (acc, [id, count]) =>
          log(
            acc,
            `🛰️ ${acc.players[Number(id)].name} receives +${count}🛸 Move (L2 Spaceport)`,
            'draft',
          ),
        current,
      ),
    )
    .thru((current) =>
      Object.entries(tally.infGains).reduce(
        (acc, [id, count]) =>
          log(
            acc,
            `⭐ ${acc.players[Number(id)].name} gains +${count} Influence (L2 Embassy)`,
            'draft',
          ),
        current,
      ),
    )
    .thru((current) =>
      Object.entries(tally.pacGains).reduce(
        (acc, [id, count]) =>
          log(
            acc,
            `☮️ ${acc.players[Number(id)].name} gains +${count} Influence (Pacifist)`,
            'draft',
          ),
        current,
      ),
    )
    .value();
