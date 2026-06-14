import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";

const COOKIE_NAME = "wc_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

export function hashAdminPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120_000, 32, "sha256").toString("hex");
  return `pbkdf2_sha256$120000$${salt}$${hash}`;
}

export function verifyAdminPassword(password: string, storedHash: string) {
  const [scheme, iterations, salt, expected] = storedHash.split("$");
  if (scheme !== "pbkdf2_sha256" || !iterations || !salt || !expected) return false;
  const actual = crypto.pbkdf2Sync(password, salt, Number(iterations), 32, "sha256");
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), actual);
}

export function createAdminSession(username: string, now = Math.floor(Date.now() / 1000)) {
  const payload = Buffer.from(JSON.stringify({ username, exp: now + SESSION_TTL_SECONDS })).toString("base64url");
  const signature = crypto.createHmac("sha256", env.ADMIN_SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyAdminSession(token?: string | null) {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = crypto.createHmac("sha256", env.ADMIN_SESSION_SECRET).update(payload).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp: number };
  return parsed.exp > Math.floor(Date.now() / 1000);
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return verifyAdminSession(cookieStore.get(COOKIE_NAME)?.value);
}

export async function requireAdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin");
}

export function adminCookieName() {
  return COOKIE_NAME;
}
