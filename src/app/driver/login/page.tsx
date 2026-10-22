import { redirect } from "next/navigation";
import { currentDriver } from "@/lib/driver-page";
import DriverLoginForm from "@/components/driver/DriverLoginForm";

export default async function DriverLoginPage() {
  if (await currentDriver()) redirect("/driver");
  return (
    <div className="pt-16">
      <h1 className="text-center font-serif text-5xl text-[#111110]">Averto</h1>
      <p className="mt-1 mb-10 text-center text-stone-500">Driver</p>
      <DriverLoginForm />
      <p className="mt-6 text-center text-sm text-stone-500">Your PIN is given by the Averto office.</p>
    </div>
  );
}
