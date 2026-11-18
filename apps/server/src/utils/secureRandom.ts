import { randomInt } from 'crypto';

export function secureRandomInt(min: number, max: number): number {
  return randomInt(min, max);
}
