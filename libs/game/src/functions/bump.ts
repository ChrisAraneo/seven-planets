export const bump = (
  record: Partial<Record<number, number>>,
  id: number,
  amount: number,
): Partial<Record<number, number>> => ({
  ...record,
  [id]: (record[id] || 0) + amount,
});
