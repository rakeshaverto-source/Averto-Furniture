// Driver app sign-in with phone number and PIN. After 5 wrong PINs the account waits 15 minutes.
import { prisma } from "@/lib/prisma";
import { LOCK_MINUTES, MAX_FAILED_LOGINS, createDriverSession, normalisePhone, verifyPin } from "@/lib/driver-auth";
import { fail } from "@/lib/driver-orders";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phone = normalisePhone(String(body?.phone ?? ""));
  const pin = String(body?.pin ?? "");
  const wrong = () => fail(401, "Wrong phone number or PIN.");
  if (!phone || !pin) return wrong();

  const driver = await prisma.driver.findUnique({ where: { phone } });
  if (!driver || !driver.isActive) return wrong();
  if (driver.lockedUntil && driver.lockedUntil > new Date()) {
    return fail(429, `Too many wrong PINs. Try again after ${LOCK_MINUTES} minutes, or ask the office.`);
  }

  if (!verifyPin(pin, driver.pinHash)) {
    const failedLogins = driver.failedLogins + 1;
    const locked = failedLogins >= MAX_FAILED_LOGINS;
    await prisma.driver.update({
      where: { id: driver.id },
      data: locked ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000) } : { failedLogins },
    });
    return wrong();
  }

  if (driver.failedLogins || driver.lockedUntil) {
    await prisma.driver.update({ where: { id: driver.id }, data: { failedLogins: 0, lockedUntil: null } });
  }
  const token = await createDriverSession(driver.id);
  return Response.json({ token, driver: { name: driver.name, phone: driver.phone, vehicleNumber: driver.vehicleNumber } });
}
