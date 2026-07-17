import type { EngineCursor } from '../interfaces/engine-cursor';

export const getDoneCursor = (): EngineCursor => ({ phase: 'done' });
