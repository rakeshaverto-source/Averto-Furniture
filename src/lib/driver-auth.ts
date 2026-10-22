// Sign-in for the driver app. Drivers are not Supabase users: they sign in with their phone number
// and a PIN set by the admin, and the app sends back a random token on every request.
import "server-only";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

// Indian mobile numbers as 10 digits, whether typed with +91, 0 or spaces
export function normalisePhone(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export const isValidPin = (pin: string) => /^\d{4,6}$/.test(pin);

export function hashPin(pin: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pin, salt, 32).toString("hex")}`;
}

export function verifyPin(pin: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(pin, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

// A new signed-in phone for this driver; the token is returned once and only its hash is kept
export async function createDriverSession(driverId: string) {
  const token = randomBytes(32).toString("base64url");
  await prisma.driverSession.create({ data: { driverId, tokenHash: hashToken(token) } });
  return token;
}

// The website version (/driver) keeps the same token in an httpOnly cookie instead
export const DRIVER_COOKIE = "averto_driver";
export const DRIVER_COOKIE_DAYS = 60;

const bearer = (request: Request) => request.headers.get("authorization")?.match(/^Bearer (\S+)$/)?.[1] ?? null;

function cookieToken(request: Request) {
  const raw = request.headers.get("cookie") ?? "";
  const match = raw.split(/;\s*/).find((c) => c.startsWith(`${DRIVER_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(DRIVER_COOKIE.length + 1)) : null;
}

// A cookie is sent by the browser on its own, so a change made with one must come from our own pages
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return !!origin && !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}

// The driver behind an app request (Bearer token) or a /driver page request (cookie), or null.
// Turning a driver off in the admin panel signs them out of both.
export async function getDriver(request: Request) {
  let token = bearer(request);
  if (!token) {
    token = cookieToken(request);
    if (token && request.method !== "GET" && !sameOrigin(request)) return null;
  }
  return driverForToken(token);
}

// For the /driver pages, which read the cookie themselves
export async function driverForToken(token: string | null | undefined) {
  if (!token) return null;
  const session = await prisma.driverSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { driver: true },
  });
  if (!session || !session.driver.isActive) return null;
  // Note when the phone was last seen, at most every 10 minutes so location updates stay cheap
  if (Date.now() - session.lastUsedAt.getTime() > 10 * 60 * 1000) {
    await prisma.driverSession.update({ where: { id: session.id }, data: { lastUsedAt: new Date() } });
  }
  return session.driver;
}

export async function endDriverSession(request: Request) {
  const token = bearer(request) ?? cookieToken(request);
  if (token) await prisma.driverSession.deleteMany({ where: { tokenHash: hashToken(token) } });
}
