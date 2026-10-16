export type PincodeAddressDetails = {
  country: string;
  state: string;
  city: string;
  area: string;
  timezone: string;
};

type PostalApiOffice = {
  Name?: string;
  District?: string;
  State?: string;
  Country?: string;
  Block?: string;
  Division?: string;
  Region?: string;
};

type PostalApiResponse = Array<{
  Status?: string;
  Message?: string;
  PostOffice?: PostalApiOffice[] | null;
}>;

/**
 * Resolve Indian address fields from a 6-digit PIN via public Postal PIN API.
 */
export async function fetchAddressFromPincode(
  pincode: string,
): Promise<PincodeAddressDetails> {
  const pin = pincode.replace(/\D/g, "").slice(0, 6);
  if (pin.length !== 6) {
    throw new Error("Enter a valid 6-digit zip / PIN code");
  }

  const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
    method: "GET",
  });
  if (!res.ok) {
    throw new Error("Unable to reach PIN code service");
  }

  const data = (await res.json()) as PostalApiResponse;
  const row = Array.isArray(data) ? data[0] : null;
  const offices = row?.PostOffice?.filter(Boolean) ?? [];
  if (row?.Status !== "Success" || offices.length === 0) {
    throw new Error(row?.Message || "No address found for this PIN code");
  }

  const primary = offices[0];
  const state = (primary.State || "").trim();
  const city = (primary.District || "").trim();
  const area =
    (primary.Name || primary.Block || primary.Division || "").trim() || city;
  const country = (primary.Country || "India").trim() || "India";

  return {
    country,
    state,
    city,
    area,
    timezone: country.toLowerCase() === "india" ? "Asia/Calcutta" : "UTC",
  };
}
