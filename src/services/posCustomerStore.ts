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

let inMemoryCustomers: PosCustomerRecord[] = [];

// No hardcoded customers — starts clean, populated only by real added guests
export function getPosCustomers(outletId?: string): PosCustomerRecord[] {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return inMemoryCustomers;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return inMemoryCustomers;
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
      inMemoryCustomers = realCustomers;
      return realCustomers;
    }
    return inMemoryCustomers;
  } catch {
    return inMemoryCustomers;
  }
}

export function savePosCustomer(
  input: {
    name: string;
    phone: string;
    email?: string;
    tier?: "Silver" | "Gold" | "Platinum VIP";
    loyaltyPoints?: number;
    visitCount?: number;
    gstin?: string;
    address?: string;
    notes?: string;
  },
  outletId?: string
): PosCustomerRecord {
  const current = getPosCustomers(outletId);
  const cleanPhone = input.phone.trim();
  const existing = cleanPhone ? current.find((c) => c.phone.trim() === cleanPhone) : undefined;

  const newCustomer: PosCustomerRecord = {
    id: existing?.id || `cust-${Date.now()}`,
    name: input.name.trim(),
    phone: cleanPhone,
    email: input.email?.trim() || existing?.email || undefined,
    tier: input.tier || existing?.tier || "Silver",
    loyaltyPoints: input.loyaltyPoints !== undefined ? input.loyaltyPoints : (existing?.loyaltyPoints ?? 0),
    visitCount: input.visitCount !== undefined ? input.visitCount : (existing ? (existing.visitCount || 0) + 1 : 1),
    lastVisit: "Today",
    gstin: input.gstin?.trim() || existing?.gstin || undefined,
    address: input.address?.trim() || existing?.address || undefined,
    notes: input.notes?.trim() || existing?.notes || undefined,
    outletId: outletId || existing?.outletId || undefined,
  };

  const updated = [newCustomer, ...current.filter((c) => c.phone !== newCustomer.phone)];
  inMemoryCustomers = updated;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error("Failed to save customer into localStorage", err);
  }
  return newCustomer;
}
