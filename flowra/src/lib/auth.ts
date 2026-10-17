/**
 * Minimal email/password auth with a signed, httpOnly session cookie.
 * Token = base64url(JSON {uid, exp}) + "." + HMAC-SHA256(AUTH_SECRET).
 * Passwords are hashed with bcrypt (bcryptjs, cost 10).
 */
import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { User } from "@prisma/client";
import { prisma } from "./db";
import { HttpError } from "./api";

export const SESSION_COOKIE = "flowra_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set (32+ chars) in production");
  return "flowra-dev-only-insecure-secret-change-me-0000";
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string): string {
  const payload = b64url(JSON.stringify({ uid: userId, exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS }));
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { uid?: unknown; exp?: unknown };
    if (typeof data.uid !== "string" || typeof data.exp !== "number") return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return data.uid;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: NextResponse, userId: string): void {
  res.cookies.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export function getSessionUserId(): string | null {
  return verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
}

export async function getSessionUser(): Promise<User | null> {
  const uid = getSessionUserId();
  if (!uid) return null;
  return prisma.user.findUnique({ where: { id: uid } });
}

/** For API routes: returns the user or throws 401. */
export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, "Please sign in again.");
  return user;
}

/** For health-data routes: also requires consent. */
export async function requireConsentedUser(): Promise<User> {
  const user = await requireUser();
  if (!user.consentAt) throw new HttpError(403, "Please accept the consent screen first.");
  return user;
}

export function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export function checkPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

/** Admins: users with isAdmin, or whose email is listed in ADMIN_EMAILS (comma-separated). */
export function isAdminUser(user: Pick<User, "email" | "isAdmin">): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return user.isAdmin || list.includes(user.email.toLowerCase());
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!isAdminUser(user)) throw new HttpError(403, "Admins only.");
  return user;
}
