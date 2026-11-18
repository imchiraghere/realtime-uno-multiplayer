import { randomInt } from 'crypto';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARS[randomInt(0, CHARS.length)];
  }
  return code;
}
