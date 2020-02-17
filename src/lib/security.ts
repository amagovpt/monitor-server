import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

export async function generatePasswordHash(password: string): Promise<string> {
  return bcrypt.hash(password.trim(), 10);
}

export async function comparePasswordHash(password: string, passwordHash: string): Promise<boolean> {
  return await bcrypt.compare(password, passwordHash);
}

export function createRandomUniqueHash(): string {
  const current_date = (new Date()).valueOf().toString();
  const random = Math.random().toString();
  return createHash('sha256').update(current_date + random).digest('hex');
}