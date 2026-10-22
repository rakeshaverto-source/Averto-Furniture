// Signs this phone out of the driver app, or this browser out of the /driver pages
import { cookies } from "next/headers";
import { DRIVER_COOKIE, endDriverSession } from "@/lib/driver-auth";

export async function POST(request: Request) {
  await endDriverSession(request);
  (await cookies()).delete(DRIVER_COOKIE);
  return Response.json({ ok: true });
}
