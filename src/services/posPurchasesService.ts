import httpClient from "@/utils/httpClient";

export interface PurchaseLineItem {
  id?: string;
  stockItemId?: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
}

export interface PurchasePaymentRecord {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  referenceNo: string;
  notes: string;
}

export interface UnifiedPurchaseDto {
  id: string;
  invoiceNo: string;
  vendorId?: string | null;
  vendorName: string;
  purchaseDate: string;
  invoiceDate: string;
  rawDate: string;
  dueDate?: string;
  totalAmount: number;
  taxAmount: number;
  paidAmount: number;
  balanceAmount: number;
  itemCount: number;
  paymentStatus: "Done" | "Pending" | "Partial";
  rawPaymentStatus: "PAID" | "UNPAID" | "PARTIAL";
  status: "Completed" | "Draft" | "Cancelled";
  notes?: string;
  items: PurchaseLineItem[];
  payments: PurchasePaymentRecord[];
  createdAt?: string;
}

export interface PurchaseVendor {
  id: string;
  name: string;
  phone: string;
  category: string;
  contactPerson?: string;
  email?: string;
  gstin?: string;
  address?: string;
}

const LOCAL_STORAGE_PURCHASES_KEY = "retrod_pos_unified_purchases";
const LOCAL_STORAGE_VENDORS_KEY = "retrod_pos_unified_vendors";

export const DEFAULT_VENDORS: PurchaseVendor[] = [
  { id: "v-1", name: "Metro Cash & Carry", phone: "+91 98200 12345", category: "Groceries & Dry Goods", contactPerson: "Vikram Patel", gstin: "27AABCM1234F1Z5" },
  { id: "v-2", name: "Royal Dairy Suppliers", phone: "+91 98200 54321", category: "Dairy & Milk", contactPerson: "Suresh Yadav", gstin: "27AADCR5678B1Z2" },
  { id: "v-3", name: "Fresh Farm Greens & Veggies", phone: "+91 98300 11223", category: "Fresh Produce", contactPerson: "Ramesh Kumar", gstin: "27AACCF9012K1Z9" },
  { id: "v-4", name: "Classic Spirits & Beverages", phone: "+91 98400 99887", category: "Beverages & Liquor", contactPerson: "Anand Shah", gstin: "27AABCS3456L1Z4" },
  { id: "v-5", name: "Supreme Poultry & Meat", phone: "+91 98500 44556", category: "Meat & Poultry", contactPerson: "Mohd. Aslam", gstin: "27AAECS7890M1Z8" },
];

export const DEFAULT_PURCHASES: UnifiedPurchaseDto[] = [
  {
    id: "PUR-9042",
    invoiceNo: "INV-20261017-001",
    vendorName: "Metro Cash & Carry",
    purchaseDate: "17 Oct 2026",
    invoiceDate: "17 Oct 2026",
    rawDate: "2026-10-17",
    dueDate: "24 Oct 2026",
    totalAmount: 18450.0,
    taxAmount: 922.5,
    paidAmount: 18450.0,
    balanceAmount: 0.0,
    itemCount: 3,
    paymentStatus: "Done",
    rawPaymentStatus: "PAID",
    status: "Completed",
    notes: "Weekly groceries consignment received in good condition.",
    items: [
      { name: "Basmati Biryani Rice (50kg)", quantity: 2, unit: "Bags", unitPrice: 4500, lineTotal: 9000 },
      { name: "Refined Sunflower Oil (15L)", quantity: 4, unit: "Tins", unitPrice: 1850, lineTotal: 7400 },
      { name: "Whole Spices Assorted", quantity: 5, unit: "kg", unitPrice: 410, lineTotal: 2050 },
    ],
    payments: [
      {
        id: "pm-1",
        amount: 18450.0,
        paymentMethod: "Bank Transfer",
        paymentDate: "17 Oct 2026",
        referenceNo: "NEFT-991204",
        notes: "Full settlement via HDFC NetBanking",
      },
    ],
  },
  {
    id: "PUR-9041",
    invoiceNo: "INV-20261017-002",
    vendorName: "Royal Dairy Suppliers",
    purchaseDate: "17 Oct 2026",
    invoiceDate: "17 Oct 2026",
    rawDate: "2026-10-17",
    dueDate: "20 Oct 2026",
    totalAmount: 8200.0,
    taxAmount: 410.0,
    paidAmount: 0.0,
    balanceAmount: 8200.0,
    itemCount: 2,
    paymentStatus: "Pending",
    rawPaymentStatus: "UNPAID",
    status: "Completed",
    notes: "Daily morning dairy delivery. Net 3 days credit terms.",
    items: [
      { name: "Dairy Butter 500g Blocks", quantity: 20, unit: "pcs", unitPrice: 240, lineTotal: 4800 },
      { name: "Fresh Paneer Malai", quantity: 10, unit: "kg", unitPrice: 340, lineTotal: 3400 },
    ],
    payments: [],
  },
  {
    id: "PUR-9040",
    invoiceNo: "INV-20261016-003",
    vendorName: "Fresh Farm Greens & Veggies",
    purchaseDate: "16 Oct 2026",
    invoiceDate: "16 Oct 2026",
    rawDate: "2026-10-16",
    dueDate: "23 Oct 2026",
    totalAmount: 12600.0,
    taxAmount: 0.0,
    paidAmount: 5000.0,
    balanceAmount: 7600.0,
    itemCount: 4,
    paymentStatus: "Partial",
    rawPaymentStatus: "PARTIAL",
    status: "Completed",
    notes: "Farm vegetables consignment. Advance ₹5,000 paid via UPI.",
    items: [
      { name: "Nashik Red Onions", quantity: 100, unit: "kg", unitPrice: 35, lineTotal: 3500 },
      { name: "Fresh Hybrid Tomatoes", quantity: 80, unit: "kg", unitPrice: 40, lineTotal: 3200 },
      { name: "Potatoes Jyoti Grade A", quantity: 120, unit: "kg", unitPrice: 28, lineTotal: 3360 },
      { name: "Ginger & Garlic Mixed", quantity: 15, unit: "kg", unitPrice: 170, lineTotal: 2540 },
    ],
    payments: [
      {
        id: "pm-2",
        amount: 5000.0,
        paymentMethod: "UPI / QR",
        paymentDate: "16 Oct 2026",
        referenceNo: "UPI-REF-88741",
        notes: "Advance on delivery",
      },
    ],
  },
  {
    id: "PUR-9039",
    invoiceNo: "INV-20261015-004",
    vendorName: "Supreme Poultry & Meat",
    purchaseDate: "15 Oct 2026",
    invoiceDate: "15 Oct 2026",
    rawDate: "2026-10-15",
    dueDate: "15 Oct 2026",
    totalAmount: 15500.0,
    taxAmount: 0.0,
    paidAmount: 15500.0,
    balanceAmount: 0.0,
    itemCount: 2,
    paymentStatus: "Done",
    rawPaymentStatus: "PAID",
    status: "Completed",
    notes: "Fresh boneless chicken & mutton cuts. Paid cash on delivery.",
    items: [
      { name: "Boneless Chicken Breast", quantity: 40, unit: "kg", unitPrice: 240, lineTotal: 9600 },
      { name: "Mutton Curry Cut", quantity: 10, unit: "kg", unitPrice: 590, lineTotal: 5900 },
    ],
    payments: [
      {
        id: "pm-3",
        amount: 15500.0,
        paymentMethod: "Cash",
        paymentDate: "15 Oct 2026",
        referenceNo: "CASH-REC-105",
        notes: "Settled on spot",
      },
    ],
  },
  {
    id: "PUR-9038",
    invoiceNo: "INV-20261014-005",
    vendorName: "Classic Spirits & Beverages",
    purchaseDate: "14 Oct 2026",
    invoiceDate: "14 Oct 2026",
    rawDate: "2026-10-14",
    dueDate: "21 Oct 2026",
    totalAmount: 24300.0,
    taxAmount: 2430.0,
    paidAmount: 0.0,
    balanceAmount: 24300.0,
    itemCount: 3,
    paymentStatus: "Pending",
    rawPaymentStatus: "UNPAID",
    status: "Completed",
    notes: "Bar inventory restock. Awaiting weekly consolidated statement.",
    items: [
      { name: "Tonic Water Cans (24 pack)", quantity: 10, unit: "Cases", unitPrice: 850, lineTotal: 8500 },
      { name: "Assorted Syrups & Purees", quantity: 12, unit: "Bottles", unitPrice: 650, lineTotal: 7800 },
      { name: "Craft Soda & Mixers", quantity: 16, unit: "Cases", unitPrice: 500, lineTotal: 8000 },
    ],
    payments: [],
  },
];

function getStoredPurchases(): UnifiedPurchaseDto[] {
  if (typeof window === "undefined") return DEFAULT_PURCHASES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PURCHASES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error("Failed to read purchases from localStorage", err);
  }
  return DEFAULT_PURCHASES;
}

function saveStoredPurchases(items: UnifiedPurchaseDto[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_PURCHASES_KEY, JSON.stringify(items));
  } catch (err) {
    console.error("Failed to save purchases to localStorage", err);
  }
}

function getStoredVendors(): PurchaseVendor[] {
  if (typeof window === "undefined") return DEFAULT_VENDORS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_VENDORS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error("Failed to read vendors from localStorage", err);
  }
  return DEFAULT_VENDORS;
}

function saveStoredVendors(items: PurchaseVendor[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_VENDORS_KEY, JSON.stringify(items));
  } catch (err) {
    console.error("Failed to save vendors to localStorage", err);
  }
}

export const posPurchasesService = {
  getVendors(): PurchaseVendor[] {
    return getStoredVendors();
  },

  async fetchVendors(search?: string): Promise<PurchaseVendor[]> {
    try {
      const res = await httpClient.get<{ success: boolean; vendors: PurchaseVendor[] }>(
        "/api/pos/stock/vendors/",
        { params: { search } },
      );
      if (res?.data?.vendors && res.data.vendors.length > 0) {
        saveStoredVendors(res.data.vendors);
        return res.data.vendors;
      }
    } catch {
      // Fallback
    }

    let list = getStoredVendors();
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((v) => v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q));
    }
    return list;
  },

  async createVendor(payload: {
    name: string;
    phone?: string;
    email?: string;
    contactPerson?: string;
    category?: string;
    gstin?: string;
    address?: string;
  }): Promise<PurchaseVendor> {
    try {
      const res = await httpClient.post<{ success: boolean; vendor: PurchaseVendor }>(
        "/api/pos/stock/vendors/",
        payload,
      );
      if (res?.data?.vendor) {
        const stored = getStoredVendors();
        const updated = [res.data.vendor, ...stored.filter((v) => v.id !== res.data.vendor.id)];
        saveStoredVendors(updated);
        return res.data.vendor;
      }
    } catch {
      // Fallback
    }

    const stored = getStoredVendors();
    const newVendor: PurchaseVendor = {
      id: `v-${Date.now()}`,
      name: payload.name.trim(),
      phone: payload.phone || "",
      email: payload.email || "",
      contactPerson: payload.contactPerson || "",
      category: payload.category || "General",
      gstin: payload.gstin || "",
      address: payload.address || "",
    };
    const updated = [newVendor, ...stored];
    saveStoredVendors(updated);
    return newVendor;
  },

  async deleteVendor(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/pos/stock/vendors/${id}/`);
    } catch {
      // Fallback
    }
    const stored = getStoredVendors();
    const updated = stored.filter((v) => v.id !== id);
    saveStoredVendors(updated);
    return true;
  },

  async fetchPurchases(params?: {
    startDate?: string;
    endDate?: string;
    vendor?: string;
    paymentStatus?: string;
    search?: string;
  }): Promise<UnifiedPurchaseDto[]> {
    try {
      const res = await httpClient.get<{ success: boolean; purchases: UnifiedPurchaseDto[] }>(
        "/api/pos/stock/purchases/",
        { params },
      );
      if (res?.data?.purchases && res.data.purchases.length > 0) {
        saveStoredPurchases(res.data.purchases);
        return res.data.purchases;
      }
    } catch {
      // Fallback
    }

    let items = getStoredPurchases();

    // Date range filter
    if (params?.startDate) {
      items = items.filter((p) => p.rawDate >= params.startDate!);
    }
    if (params?.endDate) {
      items = items.filter((p) => p.rawDate <= params.endDate!);
    }
    if (params?.vendor && params.vendor !== "All") {
      items = items.filter((p) => p.vendorName.toLowerCase().includes(params.vendor!.toLowerCase()));
    }
    if (params?.paymentStatus && params.paymentStatus !== "All") {
      const target = params.paymentStatus.toLowerCase();
      items = items.filter((p) => p.paymentStatus.toLowerCase() === target);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.invoiceNo.toLowerCase().includes(q) ||
          p.vendorName.toLowerCase().includes(q) ||
          (p.notes && p.notes.toLowerCase().includes(q)) ||
          p.items.some((i) => i.name.toLowerCase().includes(q)),
      );
    }

    return items;
  },

  async createPurchase(payload: {
    vendorName: string;
    invoiceNo?: string;
    invoiceDate?: string;
    totalAmount: number;
    taxAmount?: number;
    paymentStatus: "Done" | "Pending" | "Partial";
    paidAmount?: number;
    paymentMethod?: string;
    notes?: string;
    items?: PurchaseLineItem[];
  }): Promise<UnifiedPurchaseDto> {
    try {
      const res = await httpClient.post<UnifiedPurchaseDto>(
        "/api/pos/stock/purchases/",
        payload,
      );
      if (res?.data) {
        const stored = getStoredPurchases();
        const updated = [res.data, ...stored];
        saveStoredPurchases(updated);
        return res.data;
      }
    } catch {
      // Fallback
    }

    const stored = getStoredPurchases();
    const now = new Date();
    const invoiceNo =
      payload.invoiceNo?.trim() ||
      `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(stored.length + 1).padStart(3, "0")}`;
    const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const rawDate = payload.invoiceDate || now.toISOString().slice(0, 10);

    let paidAmount = 0;
    let balanceAmount = payload.totalAmount;

    if (payload.paymentStatus === "Done") {
      paidAmount = payload.totalAmount;
      balanceAmount = 0;
    } else if (payload.paymentStatus === "Partial") {
      paidAmount = payload.paidAmount || 0;
      balanceAmount = Math.max(0, payload.totalAmount - paidAmount);
    }

    const payments: PurchasePaymentRecord[] = [];
    if (paidAmount > 0) {
      payments.push({
        id: `pm-${Date.now()}`,
        amount: paidAmount,
        paymentMethod: payload.paymentMethod || "Cash",
        paymentDate: dateStr,
        referenceNo: invoiceNo,
        notes: "Initial payment recorded at inward entry",
      });
    }

    const newPurchase: UnifiedPurchaseDto = {
      id: `PUR-${Date.now()}`,
      invoiceNo,
      vendorName: payload.vendorName,
      purchaseDate: dateStr,
      invoiceDate: dateStr,
      rawDate,
      totalAmount: payload.totalAmount,
      taxAmount: payload.taxAmount || 0,
      paidAmount,
      balanceAmount,
      itemCount: payload.items?.length || 1,
      paymentStatus: balanceAmount <= 0 ? "Done" : paidAmount > 0 ? "Partial" : "Pending",
      rawPaymentStatus: balanceAmount <= 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID",
      status: "Completed",
      notes: payload.notes || "",
      items: payload.items || [],
      payments,
      createdAt: now.toISOString(),
    };

    const next = [newPurchase, ...stored];
    saveStoredPurchases(next);
    return newPurchase;
  },

  async recordPayment(
    invoiceId: string,
    payload: {
      amount: number;
      paymentMethod: string;
      referenceNo?: string;
      notes?: string;
    },
  ): Promise<UnifiedPurchaseDto | null> {
    try {
      const res = await httpClient.post<UnifiedPurchaseDto>(
        `/api/pos/stock/purchases/${invoiceId}/payment/`,
        payload,
      );
      if (res?.data) {
        const stored = getStoredPurchases();
        const updated = stored.map((p) => (p.id === invoiceId ? res.data : p));
        saveStoredPurchases(updated);
        return res.data;
      }
    } catch {
      // Fallback
    }

    const stored = getStoredPurchases();
    const found = stored.find((p) => p.id === invoiceId);
    if (!found) return null;

    const payAmt = payload.amount;
    const newPaid = Math.round((found.paidAmount + payAmt) * 100) / 100;
    const newBalance = Math.max(0, Math.round((found.totalAmount - newPaid) * 100) / 100);

    found.paidAmount = newPaid;
    found.balanceAmount = newBalance;
    found.paymentStatus = newBalance <= 0 ? "Done" : "Partial";
    found.rawPaymentStatus = newBalance <= 0 ? "PAID" : "PARTIAL";

    const now = new Date();
    found.payments.push({
      id: `pm-${Date.now()}`,
      amount: payAmt,
      paymentMethod: payload.paymentMethod || "Cash",
      paymentDate: now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      referenceNo: payload.referenceNo || "",
      notes: payload.notes || "",
    });

    saveStoredPurchases(stored);
    return found;
  },

  async deletePurchase(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/pos/stock/purchases/${id}/`);
    } catch {
      // Fallback
    }
    const stored = getStoredPurchases();
    const next = stored.filter((p) => p.id !== id);
    saveStoredPurchases(next);
    return true;
  },
};
