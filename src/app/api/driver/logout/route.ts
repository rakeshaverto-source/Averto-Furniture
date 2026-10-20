// Signs this phone out of the driver app
import { endDriverSession } from "@/lib/driver-auth";

export async function POST(request: Request) {
  await endDriverSession(request);
  return Response.json({ ok: true });
}
