import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");

  return `scrypt:${salt}:${hash}`;
}

export function verifyPasswordHash(password: string, storedHash: string | null) {
  if (!storedHash) return false;

  const [method, salt, hash] = storedHash.split(":");
  if (method !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, KEY_LENGTH);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
