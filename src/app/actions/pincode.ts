"use server";

export type PincodeResult =
  | { ok: true; city: string; state: string; areas: string[] }
  | { ok: false; error: string };

interface PostOffice {
  Name?: string;
  District?: string;
  State?: string;
}

// Looks a pincode up in India Post's free public directory (api.postalpincode.in), so the checkout can
// fill in the city and state. It runs on the server so the browser never talks to a third party, and
// any failure falls back to the customer typing the details themselves.
export async function lookupPincode(pin: string): Promise<PincodeResult> {
  const pincode = String(pin ?? "").trim();
  if (!/^\d{6}$/.test(pincode)) return { ok: false, error: "Enter a 6-digit pincode." };

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw new Error(`status ${response.status}`);

    const data = (await response.json()) as { Status?: string; PostOffice?: PostOffice[] | null }[];
    const offices = data?.[0]?.PostOffice;
    if (data?.[0]?.Status !== "Success" || !offices?.length) {
      return { ok: false, error: "We could not find that pincode. Please fill in the city and state yourself." };
    }

    const first = offices[0];
    const areas = [...new Set(offices.map((o) => o.Name).filter((n): n is string => !!n))].slice(0, 8);
    return { ok: true, city: first.District ?? "", state: first.State ?? "", areas };
  } catch {
    return { ok: false, error: "We could not look that pincode up right now. Please fill in the city and state yourself." };
  }
}
