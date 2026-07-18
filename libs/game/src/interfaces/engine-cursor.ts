export type EngineCursor =
  | { phase: 'setup' }
  | {
      phase: 'draft';
      seatQueue: number[];
      seatIdx: number;
      slot: number;
      pick: number;
      picksTotal: number;
    }
  | {
      phase: 'action';
      seatQueue: number[];
      seatIdx: number;
    }
  | { phase: 'd1' };
