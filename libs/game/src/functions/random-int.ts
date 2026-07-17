export const randomInt = (minimum: number, maximum: number): number =>
  minimum + Math.floor(Math.random() * (maximum - minimum + 1));
