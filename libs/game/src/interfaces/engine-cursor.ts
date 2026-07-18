export type EngineCursor =
  | { phase: 'SETUP' }
  | {
      phase: 'DRAFT';
      seatQueue: number[];
      seatIdx: number;
      slot: number;
      pick: number;
      picksTotal: number;
    }
  | {
      phase: 'ACTION';
      seatQueue: number[];
      seatIdx: number;
    }
  | { phase: 'd1' };
