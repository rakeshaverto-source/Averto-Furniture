export interface AddressParts {
  address: string;
  locality?: string;
  landmark?: string;
  city: string;
  tehsil?: string;
  state: string;
  pincode: string;
}

// A delivery address as lines, the same way everywhere it is shown. The tehsil is for the team and
// couriers, so it is left out unless asked for.
export function addressLines(a: AddressParts, { tehsil = false } = {}): string[] {
  const withTehsil = tehsil && a.tehsil && a.tehsil.toLowerCase() !== a.city.toLowerCase();
  return [
    [a.address, a.locality].filter(Boolean).join(", "),
    a.landmark ? `Landmark: ${a.landmark}` : "",
    `${a.city}${withTehsil ? ` (Tehsil ${a.tehsil})` : ""}, ${a.state} ${a.pincode}`,
  ].filter(Boolean);
}
