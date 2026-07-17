import { getGameStateLastValue } from '../get-game-state-last-value';
import type { LogEntry } from '../interfaces/log-entry';

export const getLog = (): readonly LogEntry[] => getGameStateLastValue().log;
