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

const DEFAULT_CUSTOMERS: PosCustomerRecord[] = [
  {
    id: "cust-1",
    name: "Rahul Sharma",
    phone: "+91 98765 43210",
    email: "rahul.sharma@gmail.com",
    tier: "Gold",
    loyaltyPoints: 340,
    visitCount: 6,
    lastVisit: "Yesterday",
  },
  {
    id: "cust-2",
    name: "Priya Verma",
    phone: "+91 98112 23344",
    email: "priya.verma@hotmail.com",
    tier: "Platinum VIP",
    loyaltyPoints: 820,
    visitCount: 14,
    lastVisit: "Today",
  },
  {
    id: "cust-3",
    name: "Amit Patel",
    phone: "+91 99887 76655",
    email: "amit.patel@yahoo.com",
    tier: "Silver",
    loyaltyPoints: 120,
    visitCount: 2,
    lastVisit: "3 days ago",
  },
  {
    id: "cust-4",
    name: "Sneha Rao",
    phone: "+91 91234 56789",
    email: "sneha.rao@outlook.com",
    tier: "Gold",
    loyaltyPoints: 490,
    visitCount: 9,
    lastVisit: "Last week",
  },
  {
    id: "cust-5",
    name: "Vikram Malhotra",
    phone: "+91 98711 22334",
    email: "vikram.m@gmail.com",
    tier: "Silver",
    loyaltyPoints: 80,
    visitCount: 1,
    lastVisit: "Today",
  },
];

export function getPosCustomers(outletId?: string): PosCustomerRecord[] {
  if (typeof window === "undefined") return DEFAULT_CUSTOMERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CUSTOMERS));
      return DEFAULT_CUSTOMERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_CUSTOMERS;
  } catch {
    return DEFAULT_CUSTOMERS;
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
  const now = new Date();
  const newCustomer: PosCustomerRecord = {
    id: `cust-${Date.now()}`,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    tier: input.tier || "Silver",
    loyaltyPoints: 50, // Welcome points
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
