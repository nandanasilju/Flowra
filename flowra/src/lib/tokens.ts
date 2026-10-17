/** Random URL-safe tokens; only their SHA-256 hash is stored in the database. */
import { createHash, randomBytes } from "crypto";

export function newToken(): { token: string; hash: string } {
  const token = randomBytes(24).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
