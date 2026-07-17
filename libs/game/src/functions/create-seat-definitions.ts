import {
  AI_COLORS,
  AI_NAMES,
  AI_PLANET_NAMES,
  PLANET_STYLES,
} from '../config/constants';
import { chain } from '../utils/chain';
import type { SeatDefinition } from './create-initial-game-state';
import { shuffleArray } from './shuffle-array';

const AI_SEATS = 6;
export const createSeatDefinitions = (): SeatDefinition[] =>
  chain({
    names: shuffleArray(AI_NAMES).slice(0, AI_SEATS),
    planetNames: shuffleArray(AI_PLANET_NAMES).slice(0, AI_SEATS),
    colors: shuffleArray(AI_COLORS).slice(0, AI_SEATS),
    styles: shuffleArray(
      PLANET_STYLES.map((_, index) => index).filter((index) => index !== 0),
    ).slice(0, AI_SEATS),
  })
    .thru(({ names, planetNames, colors, styles }): SeatDefinition[] => [
      {
        name: 'You',
        planet: 'Terra Prime',
        color: '#3df0ff',
        isHuman: true,
        styleIdx: 0,
      },
      ...names.map((name: string, index: number) => ({
        name,
        planet: planetNames[index],
        color: colors[index],
        styleIdx: styles[index],
        isHuman: false,
      })),
    ])
    .value();
