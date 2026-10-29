import httpClient from "@/utils/httpClient";
import { isBackendOutletId } from "@/utils/outletId";
import { posInventoryService } from "@/services/posInventoryService";

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

const LOCAL_STORAGE_PURCHASES_KEY = "retrod_pos_unified_purchases_v2";
const LOCAL_STORAGE_VENDORS_KEY = "retrod_pos_unified_vendors";

export const DEFAULT_VENDORS: PurchaseVendor[] = [];

export const DEFAULT_PURCHASES: UnifiedPurchaseDto[] = [];

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
      if (Array.isArray(parsed) && parsed.length > 0) {
        const dummyIds = new Set(["v-1", "v-2", "v-3", "v-4", "v-5"]);
        return parsed.filter((v: PurchaseVendor) => !dummyIds.has(v.id));
      }
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
      if (res?.data?.vendors) {
        saveStoredVendors(res.data.vendors);
        let list = res.data.vendors;
        if (search) {
          const q = search.toLowerCase();
          list = list.filter(
            (v) => v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q),
          );
        }
        return list;
      }
    } catch {
      // Fall through to stored vendors created in this browser
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
    outletId?: string;
  }): Promise<UnifiedPurchaseDto[]> {
    try {
      const res = await httpClient.get<{ success: boolean; purchases: UnifiedPurchaseDto[] }>(
        "/api/pos/stock/purchases/",
        { params: { ...params, outlet_id: params?.outletId } },
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
    outletId?: string;
  }): Promise<UnifiedPurchaseDto> {
    if (isBackendOutletId(payload.outletId)) {
      try {
        const res = await httpClient.post<UnifiedPurchaseDto>(
          "/api/pos/stock/purchases/",
          payload,
          { params: { outlet_id: payload.outletId } },
        );
        if (res?.data) {
          const stored = getStoredPurchases();
          const updated = [res.data, ...stored];
          saveStoredPurchases(updated);
          return res.data;
        }
      } catch {
        // Fall through to local ledger
      }
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
    if (!isBackendOutletId(payload.outletId)) {
      for (const line of payload.items || []) {
        if (!line.stockItemId) continue;
        posInventoryService.adjustMockStock(
          line.stockItemId,
          Number(line.quantity) || 0,
          "PURCHASE_IN",
          invoiceNo,
          { unitCost: line.unitPrice },
        );
      }
    }
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
