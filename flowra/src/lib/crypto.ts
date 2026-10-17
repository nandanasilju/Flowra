/**
 * Field-level encryption for free-text health data (transcripts, notes).
 *
 * Envelope encryption:
 *   - ENCRYPTION_KEY (env) = 32-byte master key (KEK), base64. Never stored in the database.
 *   - Each user gets a random 32-byte data key (DEK), stored in User.dataKey wrapped with the KEK.
 *   - Fields are encrypted with the user's DEK using AES-256-GCM (random 96-bit IV, 128-bit auth tag).
 * Format: "enc:v1:<iv b64>:<tag b64>:<ciphertext b64>". Values without the prefix are read as plain
 * text (legacy rows). Deleting a user deletes her DEK, which makes any leftover ciphertext unreadable.
 *
 * Honest scope: structured fields (dates, pain scores, symptom codes) are NOT encrypted because the
 * server must query and score them; they are protected by database/host security and HTTPS.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import type { User } from "@prisma/client";
import { prisma } from "./db";

const PREFIX = "enc:v1:";
const ALG = "aes-256-gcm";

let warned = false;
function masterKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (raw) {
    const key = Buffer.from(raw, "base64");
    if (key.length === 32) return key;
    throw new Error("ENCRYPTION_KEY must be 32 bytes, base64-encoded");
  }
  if (process.env.NODE_ENV === "production") throw new Error("ENCRYPTION_KEY must be set in production");
  if (!warned) {
    console.warn("[crypto] ENCRYPTION_KEY not set: using an insecure development key");
    warned = true;
  }
  return Buffer.alloc(32, 7);
}

export function encryptWith(key: Buffer, plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALG, key, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decryptWith(key: Buffer, value: string): string {
  if (!value.startsWith(PREFIX)) return value; // legacy plain text
  const [ivB, tagB, ctB] = value.slice(PREFIX.length).split(":");
  if (!ivB || !tagB || ctB === undefined) return "";
  try {
    const decipher = createDecipheriv(ALG, key, Buffer.from(ivB, "base64"));
    decipher.setAuthTag(Buffer.from(tagB, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(ctB, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return "[could not decrypt]";
  }
}

export function isEncrypted(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith(PREFIX));
}

/** Per-user field cipher. Empty strings stay empty (nothing to protect, keeps rows small). */
export interface FieldCipher {
  enc: (v: string) => string;
  encN: (v: string | null | undefined) => string | null;
  dec: (v: string) => string;
  decN: (v: string | null | undefined) => string | null;
}

export function cipherFromKey(key: Buffer): FieldCipher {
  if (key.length !== 32) {
    throw new Error("Your data key could not be unlocked. Was ENCRYPTION_KEY changed? Restore the original key (or re-seed a development database).");
  }
  return {
    enc: (v) => (v ? encryptWith(key, v) : ""),
    encN: (v) => (v ? encryptWith(key, v) : null),
    dec: (v) => (v ? decryptWith(key, v) : ""),
    decN: (v) => (v ? decryptWith(key, v) : null),
  };
}

/** Load (or create on first use) the user's data key and return a field cipher. */
export async function userCipher(user: Pick<User, "id" | "dataKey">): Promise<FieldCipher> {
  const kek = masterKey();
  if (user.dataKey) return cipherFromKey(Buffer.from(decryptWith(kek, user.dataKey), "base64"));
  const dek = randomBytes(32);
  const wrapped = encryptWith(kek, dek.toString("base64"));
  // Only set if still empty (avoids two concurrent requests creating different keys).
  const { count } = await prisma.user.updateMany({ where: { id: user.id, dataKey: null }, data: { dataKey: wrapped } });
  if (count === 0) {
    const fresh = await prisma.user.findUnique({ where: { id: user.id }, select: { dataKey: true } });
    if (fresh?.dataKey) return cipherFromKey(Buffer.from(decryptWith(kek, fresh.dataKey), "base64"));
  }
  return cipherFromKey(dek);
}
