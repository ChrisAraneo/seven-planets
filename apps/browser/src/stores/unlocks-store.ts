import { DIFFICULTIES, type Difficulty } from '@seven-planets/game';
import { defineStore } from 'pinia';
import { ref } from 'vue';

const STORAGE_KEY = 'seven-planets:unlocked-difficulties';

const UNLOCKED_BY_WIN: Partial<Record<Difficulty, Difficulty>> = {
  normal: 'hard',
  hard: 'impossible',
};

const rewarded = new Set<Difficulty>(Object.values(UNLOCKED_BY_WIN));
const ALWAYS_UNLOCKED: Difficulty[] = DIFFICULTIES.map(
  (difficultyDef) => difficultyDef.id,
).filter((id) => !rewarded.has(id));

const read = (): Set<Difficulty> => {
  const unlocked = new Set<Difficulty>(ALWAYS_UNLOCKED);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      for (const difficultyDef of DIFFICULTIES) {
        if (parsed.includes(difficultyDef.id)) {
          unlocked.add(difficultyDef.id);
        }
      }
    }
  } catch {}
  return unlocked;
};

const write = (unlocked: Set<Difficulty>): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...unlocked]));
  } catch {}
};

export const useUnlocksStore = defineStore('unlocks', () => {
  const unlocked = ref<Set<Difficulty>>(read());

  const isUnlocked = (id: Difficulty): boolean => unlocked.value.has(id);

  const recordWin = (level: Difficulty): Difficulty | null => {
    const next = UNLOCKED_BY_WIN[level];
    if (!next) {
      return null;
    }
    if (unlocked.value.has(next)) {
      return null;
    }
    unlocked.value.add(next);
    write(unlocked.value);
    return next;
  };

  return { unlocked, isUnlocked, recordWin };
});
