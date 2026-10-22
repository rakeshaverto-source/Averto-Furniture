// Stops one email address from being sent code after code (each send uses up the shop's daily Gmail
// quota). Kept in memory: enough for a single server; a restart simply forgets the timers.
import "server-only";

const WAIT_MS = 60_000;
const lastSent = new Map<string, number>();

// True when this key may send now (and starts its wait); false when it must wait a little longer
export function mayResend(key: string) {
  const now = Date.now();
  const last = lastSent.get(key);
  if (last && now - last < WAIT_MS) return false;
  lastSent.set(key, now);
  if (lastSent.size > 5000) {
    for (const [k, t] of lastSent) if (now - t > WAIT_MS) lastSent.delete(k);
  }
  return true;
}
