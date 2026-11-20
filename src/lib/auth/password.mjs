// Password hashing shared by the app and scripts/create-user.mjs.
// Format: scrypt$N$r$p$<salt base64>$<hash base64>
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const N = 2 ** 15;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;

export const MIN_PASSWORD_LENGTH = 10;

/** @returns {Promise<Buffer>} */
function derive(password, salt, n, r, p) {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, KEY_LENGTH, { N: n, r, p, maxmem: 256 * n * r }, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
}

/**
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P);
  return ["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

/**
 * @param {string} password
 * @param {string} stored
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, stored) {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [n, r, p] = parts.slice(1, 4).map(Number);
  const salt = Buffer.from(parts[4], "base64");
  const expected = Buffer.from(parts[5], "base64");
  if (!n || !r || !p || expected.length !== KEY_LENGTH) return false;
  const key = await derive(password, salt, n, r, p);
  return timingSafeEqual(key, expected);
}
