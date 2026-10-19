"use server";

export interface PincodeArea {
  name: string; // the post office: a locality in a city, or a village
  tehsil: string;
}

export type PincodeResult =
  | { ok: true; city: string; state: string; areas: PincodeArea[] }
  | { ok: false; error: string };

interface PostOffice {
  Name?: string;
  Block?: string;
  District?: string;
  State?: string;
}

// India Post writes "NA" when it has no tehsil for an office
const known = (value?: string) => (value && value.trim().toUpperCase() !== "NA" ? value.trim() : "");

// Looks a pincode up in India Post's free public directory (api.postalpincode.in), so the checkout can
// fill in the city, state and the list of areas. It runs on the server so the browser never talks to a
// third party, and any failure falls back to the customer typing the details themselves.
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
    const areas = new Map<string, PincodeArea>();
    for (const o of offices) {
      const name = known(o.Name);
      if (name && !areas.has(name)) areas.set(name, { name, tehsil: known(o.Block) });
    }
    return {
      ok: true,
      city: known(first.District),
      state: known(first.State),
      areas: [...areas.values()].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 60),
    };
  } catch {
    return { ok: false, error: "We could not look that pincode up right now. Please fill in the city and state yourself." };
  }
}
