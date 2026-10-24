// The shopper's logins ("Where you're logged in" on the profile page). Supabase keeps one row per
// login in auth.sessions; our database role can read it and end a login by deleting its row.
import "server-only";
import { prisma } from "@/lib/prisma";

export interface LoginSession {
  id: string;
  device: string; // "Chrome on Windows"
  mobile: boolean;
  signedInAt: Date;
  lastActiveAt: Date;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isSessionId = (id: unknown): id is string => typeof id === "string" && UUID.test(id);

// A readable name from the browser's user agent, enough to tell one's own devices apart
export function describeDevice(userAgent: string | null) {
  const ua = userAgent ?? "";
  const browser = /Edg(e|A|iOS)?\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /SamsungBrowser/.test(ua)
        ? "Samsung Internet"
        : /Chrome\/|CriOS/.test(ua)
          ? "Chrome"
          : /Firefox\/|FxiOS/.test(ua)
            ? "Firefox"
            : /Safari\//.test(ua)
              ? "Safari"
              : "";
  const os = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X|Macintosh/.test(ua)
            ? "Mac"
            : /CrOS/.test(ua)
              ? "Chromebook"
              : /Linux/.test(ua)
                ? "Linux"
                : "";
  const device = browser && os ? `${browser} on ${os}` : browser || os || "Unknown device";
  return { device, mobile: /Mobi|iPhone|Android/.test(ua) };
}

export async function listSessions(userId: string): Promise<LoginSession[]> {
  const rows = await prisma.$queryRaw<
    { id: string; user_agent: string | null; created_at: Date; last_active: Date }[]
  >`
    SELECT id::text AS id, user_agent, created_at,
           GREATEST(created_at, COALESCE(updated_at, created_at), COALESCE(refreshed_at AT TIME ZONE 'UTC', created_at)) AS last_active
    FROM auth.sessions
    WHERE user_id = ${userId}::uuid AND (not_after IS NULL OR not_after > now())
    ORDER BY last_active DESC
  `;
  return rows.map((r) => ({
    id: r.id,
    ...describeDevice(r.user_agent),
    signedInAt: r.created_at,
    lastActiveAt: r.last_active,
  }));
}

// Ends one login of this shopper; the user id check means nobody can end someone else's
export async function endSession(userId: string, sessionId: string) {
  if (!isSessionId(sessionId)) return 0;
  return prisma.$executeRaw`DELETE FROM auth.sessions WHERE id = ${sessionId}::uuid AND user_id = ${userId}::uuid`;
}

// Whether a login still exists, so one removed from another device stops working at once
// instead of when its token runs out
export async function sessionExists(sessionId: string) {
  if (!isSessionId(sessionId)) return false;
  const rows = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok FROM auth.sessions WHERE id = ${sessionId}::uuid`;
  return rows.length > 0;
}
