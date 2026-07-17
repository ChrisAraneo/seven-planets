export const bumpNested = (
  record: Partial<Record<number, Record<string, number>>>,
  id: number,
  key: string,
  amount: number,
): Partial<Record<number, Record<string, number>>> => ({
  ...record,
  [id]: { ...record[id], [key]: (record[id]?.[key] || 0) + amount },
});
