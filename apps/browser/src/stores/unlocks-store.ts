import { DIFFICULTIES, type Difficulty } from '@seven-planets/game';
import { noop } from 'lodash-es';
import { defineStore } from 'pinia';
import { tryCatch } from 'ramda';
import { match } from 'ts-pattern';
import { ref } from 'vue';

import { chain } from '@/utils/chain';
import { nullish } from '@/utils/p';

const STORAGE_KEY = 'seven-planets:unlocked-difficulties';

const UNLOCKED_BY_WIN: Partial<Record<Difficulty, Difficulty>> = {
  normal: 'hard',
  hard: 'impossible',
};

const rewarded = new Set<Difficulty>(Object.values(UNLOCKED_BY_WIN));
const ALWAYS_UNLOCKED: Difficulty[] = DIFFICULTIES.map(
  (difficultyDef) => difficultyDef.id,
).filter((id) => !rewarded.has(id));

const parseStored = (): unknown =>
  match(localStorage.getItem(STORAGE_KEY))
    .with(nullish, (): unknown => [])
    .otherwise((raw): unknown => JSON.parse(raw));

const read = (): Set<Difficulty> =>
  tryCatch(
    (): Set<Difficulty> =>
      match(parseStored())
        .when(
          Array.isArray,
          (parsed) =>
            new Set<Difficulty>([
              ...ALWAYS_UNLOCKED,
              ...DIFFICULTIES.map((difficultyDef) => difficultyDef.id).filter(
                (id) => parsed.includes(id),
              ),
            ]),
        )
        .otherwise(() => new Set<Difficulty>(ALWAYS_UNLOCKED)),
    (): Set<Difficulty> => new Set<Difficulty>(ALWAYS_UNLOCKED),
  )();

const write = (unlocked: Set<Difficulty>): void =>
  tryCatch(
    (): void =>
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...unlocked])),
    noop,
  )();

export const useUnlocksStore = defineStore('unlocks', () => {
  const unlocked = ref<Set<Difficulty>>(read());

  const isUnlocked = (id: Difficulty): boolean => unlocked.value.has(id);

  const recordWin = (level: Difficulty): Difficulty | null =>
    match(UNLOCKED_BY_WIN[level])
      .with(nullish, () => null)
      .when(
        (next) => unlocked.value.has(next),
        () => null,
      )
      .otherwise((next) =>
        chain(unlocked.value.add(next))
          .tap((set) => write(set))
          .thru(() => next)
          .value(),
      );

  return { unlocked, isUnlocked, recordWin };
});
