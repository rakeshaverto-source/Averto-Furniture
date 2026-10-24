// PLACEHOLDER business details shown on invoices and the account pages.
// Replace every value before launch, and have your CA confirm the invoice format (GST, HSN codes).
export const BUSINESS = {
  legalName: "Averto Furniture (PLACEHOLDER legal name)",
  address: "PLACEHOLDER street address, City, State 000000",
  gstin: "PLACEHOLDER GSTIN",
  email: "concierge@averto.in",
  phone: "+91 99999 99999",
  // Whether prices included GST on orders placed before GST was added on top at checkout (those have gst = 0).
  // New orders add GST_PERCENT from src/data/store.ts on top.
  pricesIncludeGst: true,
};
