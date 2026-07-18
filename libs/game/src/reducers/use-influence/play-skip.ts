import { assign } from 'lodash-es';
import { match } from 'ts-pattern';

import { SKIP_TURNS } from '../../config/constants';
import { emitEffect } from '../../functions/emit-effect';
import { getFirstOwnedPlanet } from '../../functions/extractors/get-first-owned-planet';
import { getInfluenceTarget } from '../../functions/extractors/get-influence-target';
import { log } from '../../functions/log';
import type { GameState } from '../../interfaces/game-state';
import type { InfluenceType } from '../../interfaces/influence-type';
import { chain } from '../../utils/chain';
import { nullish } from '../../utils/p';
import { logPlay } from './log-play';
import { spendInfluenceCard } from './spend-influence-card';

export const playSkip = (
  state: GameState,
  playerId: number,
  influenceType: InfluenceType,
): boolean =>
  match(getInfluenceTarget(state, state.players[playerId], influenceType))
    .with(nullish, () => false)
    .otherwise((target) =>
      chain(state)
        .tap(() => spendInfluenceCard(state, playerId, influenceType))
        .tap(() => logPlay(state, playerId, influenceType, 'sys'))
        .tap(() =>
          assign(state.players[target.id], {
            skipTurns: state.players[target.id].skipTurns + SKIP_TURNS,
          }),
        )
        .tap(() =>
          assign(
            state,
            log(
              state,
              `⏭️ ${state.players[target.id].name} is paralysed — they skip their next ${SKIP_TURNS} turn${match(
                SKIP_TURNS,
              )
                .with(1, () => '')
                .otherwise(() => 's')}!`,
              'war',
            ),
          ),
        )
        .tap(() =>
          assign(
            state,
            emitEffect(state, {
              kind: 'floatText',
              planetId: getFirstOwnedPlanet(state, state.players[target.id]).id,
              text: '⏭️ SKIPPED',
              color: '#ffb0d8',
            }),
          ),
        )
        .thru(() => true)
        .value(),
    );
