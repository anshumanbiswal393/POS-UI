export interface PosCustomerRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tier: "Silver" | "Gold" | "Platinum VIP";
  loyaltyPoints: number;
  visitCount: number;
  lastVisit: string;
  gstin?: string;
  address?: string;
  notes?: string;
  outletId?: string;
}

const STORAGE_KEY = "retrod:pos:customers:store";

// No hardcoded customers — starts clean, populated only by real added guests
export function getPosCustomers(outletId?: string): PosCustomerRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Purge any legacy dummy mock customers
      const realCustomers = parsed.filter(
        (c) =>
          !["cust-1", "cust-2", "cust-3", "cust-4", "cust-5"].includes(c.id) &&
          !["Rahul Sharma", "Priya Verma", "Amit Patel", "Sneha Rao", "Vikram Malhotra"].includes(c.name)
      );
      if (realCustomers.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(realCustomers));
      }
      return realCustomers;
    }
    return [];
  } catch {
    return [];
  }
}

export function savePosCustomer(
  input: {
    name: string;
    phone: string;
    email?: string;
    tier?: "Silver" | "Gold" | "Platinum VIP";
    gstin?: string;
    address?: string;
    notes?: string;
  },
  outletId?: string
): PosCustomerRecord {
  const current = getPosCustomers(outletId);
  const newCustomer: PosCustomerRecord = {
    id: `cust-${Date.now()}`,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    tier: input.tier || "Silver",
    loyaltyPoints: 0,
    visitCount: 1,
    lastVisit: "Today",
    gstin: input.gstin?.trim() || undefined,
    address: input.address?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    outletId: outletId || undefined,
  };

  const updated = [newCustomer, ...current.filter((c) => c.phone !== newCustomer.phone)];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save customer into localStorage", err);
  }
  return newCustomer;
}
