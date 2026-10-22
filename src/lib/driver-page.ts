// The signed-in driver for the /driver pages (the website version of the driver app)
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DRIVER_COOKIE, driverForToken } from "@/lib/driver-auth";

export async function currentDriver() {
  return driverForToken((await cookies()).get(DRIVER_COOKIE)?.value);
}

export async function requireDriver() {
  const driver = await currentDriver();
  if (!driver) redirect("/driver/login");
  return driver;
}
