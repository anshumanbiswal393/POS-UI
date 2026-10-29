import httpClient from "@/utils/httpClient";
import { isBackendOutletId } from "@/utils/outletId";
import type {
  StockPurchaseRecord,
  PurchaseOrderRecord,
  PurchaseReturnRecord,
  InventoryVendor,
  StockItem,
  StockOverview,
  StockAlert,
  DishRecipe,
  InventorySettings,
} from "@/types/posInventory";

const initialVendors: InventoryVendor[] = [];

const STOCK_STORE_KEY = "retrod_pos_stock_items_v1";
const MOVEMENT_STORE_KEY = "retrod_pos_stock_movements_v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

let purchasesStore: StockPurchaseRecord[] = [];
let purchaseOrdersStore: PurchaseOrderRecord[] = [];
let purchaseReturnsStore: PurchaseReturnRecord[] = [];
let vendorsStore: InventoryVendor[] = [...initialVendors];
let stockStore: StockItem[] = readJson<StockItem[]>(STOCK_STORE_KEY, []);
let mockMovements: StockOverview["movements"] = readJson<StockOverview["movements"]>(
  MOVEMENT_STORE_KEY,
  [],
);

function persistMockLedger() {
  writeJson(STOCK_STORE_KEY, stockStore);
  writeJson(MOVEMENT_STORE_KEY, mockMovements);
}

function adjustMockStock(
  stockItemId: string,
  signedQty: number,
  type: string,
  notes = "",
  extra?: { unitCost?: number },
) {
  const sku = stockStore.find((item) => item.id === stockItemId);
  if (!sku) return;
  const next = Math.max(0, Number(sku.availableStock || 0) + signedQty);
  const reorder = sku.reorderLevel ?? sku.minThreshold ?? 0;
  stockStore = stockStore.map((item) =>
    item.id === stockItemId
      ? {
          ...item,
          availableStock: next,
          closingStock: next,
          isLow: reorder > 0 ? next < reorder : next === 0,
          unitCost: extra?.unitCost ?? item.unitCost,
        }
      : item,
  );
  mockMovements = [
    {
      id: `mov-${Date.now()}-${Math.abs(signedQty)}`,
      stockItemId,
      name: sku.rawMaterial,
      type,
      quantity: Math.abs(signedQty),
      signedQty,
      unit: sku.unit,
      notes,
      createdAt: new Date().toISOString(),
    },
    ...mockMovements,
  ].slice(0, 30);
  persistMockLedger();
}

function scopeParams(outletId?: string) {
  return isBackendOutletId(outletId) ? { outlet_id: outletId } : {};
}

function mapStock(raw: Partial<StockItem> & { id: string }): StockItem {
  const name = raw.rawMaterial || raw.name || "";
  const qty = raw.availableStock ?? raw.quantityOnHand ?? raw.closingStock ?? 0;
  return {
    ...raw,
    rawMaterial: name,
    name,
    category: raw.category || "",
    unit: raw.unit || "Kg",
    availableStock: qty,
    closingStock: raw.closingStock ?? qty,
    quantityOnHand: qty,
    parLevel: raw.parLevel ?? 0,
    reorderLevel: raw.reorderLevel ?? raw.minThreshold ?? 0,
    minThreshold: raw.minThreshold ?? raw.reorderLevel ?? 0,
    unitCost: raw.unitCost ?? 0,
    itemKind: raw.itemKind || "RAW",
    isLow: raw.isLow ?? false,
  };
}

export const posInventoryService = {
  getVendors: async (outletId?: string): Promise<InventoryVendor[]> => {
    if (isBackendOutletId(outletId)) {
      try {
        const res = await httpClient.get<{ success: boolean; vendors?: InventoryVendor[] }>(
          "/api/pos/stock/vendors/",
          { params: scopeParams(outletId) },
        );
        return res.data.vendors || [];
      } catch {
        return [];
      }
    }
    return [...vendorsStore];
  },

  getPurchases: async (outletId?: string): Promise<StockPurchaseRecord[]> => {
    if (isBackendOutletId(outletId)) {
      try {
        const res = await httpClient.get<{ success: boolean; purchases: StockPurchaseRecord[] }>(
          "/api/pos/stock/purchases/",
          { params: scopeParams(outletId) },
        );
        return res.data.purchases || [];
      } catch {
        return [];
      }
    }
    return [...purchasesStore];
  },
  createPurchase: async (
    data: Omit<StockPurchaseRecord, "id">,
    outletId?: string,
  ): Promise<StockPurchaseRecord> => {
    if (isBackendOutletId(outletId)) {
      const res = await httpClient.post<StockPurchaseRecord>("/api/pos/stock/purchases/", data, {
        params: scopeParams(outletId),
      });
      return res.data;
    }
    const newPurchase: StockPurchaseRecord = { ...data, id: `pur-${Date.now()}` };
    purchasesStore = [newPurchase, ...purchasesStore];
    for (const line of data.items || []) {
      if (!line.stockItemId) continue;
      adjustMockStock(line.stockItemId, line.quantity, "PURCHASE_IN", data.invoiceNo, {
        unitCost: line.unitPrice,
      });
    }
    return newPurchase;
  },
  deletePurchase: async (id: string, outletId?: string): Promise<boolean> => {
    if (isBackendOutletId(outletId)) {
      await httpClient.delete(`/api/pos/stock/purchases/${id}/`);
      return true;
    }
    purchasesStore = purchasesStore.filter((p) => p.id !== id);
    return true;
  },

  getPurchaseOrders: async (outletId?: string): Promise<PurchaseOrderRecord[]> => {
    if (isBackendOutletId(outletId)) {
      try {
        const res = await httpClient.get<{ success: boolean; purchaseOrders: PurchaseOrderRecord[] }>(
          "/api/pos/stock/purchase-orders/",
          { params: scopeParams(outletId) },
        );
        return res.data.purchaseOrders || [];
      } catch {
        /* fallback */
      }
    }
    return [...purchaseOrdersStore];
  },
  createPurchaseOrder: async (
    data: Omit<PurchaseOrderRecord, "id"> & { items?: Array<{ stockItemId?: string; name: string; quantity: number; unit?: string; unitPrice?: number }> },
    outletId?: string,
  ): Promise<PurchaseOrderRecord> => {
    if (isBackendOutletId(outletId)) {
      const res = await httpClient.post<PurchaseOrderRecord>("/api/pos/stock/purchase-orders/", data, {
        params: scopeParams(outletId),
      });
      return res.data;
    }
    const newPO: PurchaseOrderRecord = { ...data, id: `po-${Date.now()}` };
    purchaseOrdersStore = [newPO, ...purchaseOrdersStore];
    return newPO;
  },
  deletePurchaseOrder: async (id: string, outletId?: string): Promise<boolean> => {
    if (isBackendOutletId(outletId)) {
      await httpClient.delete(`/api/pos/stock/purchase-orders/${id}/`);
      return true;
    }
    purchaseOrdersStore = purchaseOrdersStore.filter((p) => p.id !== id);
    return true;
  },
  receivePurchaseOrder: async (id: string, outletId?: string) => {
    const res = await httpClient.post(`/api/pos/stock/purchase-orders/${id}/receive/`, {}, { params: scopeParams(outletId) });
    return res.data;
  },

  getPurchaseReturns: async (outletId?: string): Promise<PurchaseReturnRecord[]> => {
    if (isBackendOutletId(outletId)) {
      try {
        const res = await httpClient.get<{ success: boolean; purchaseReturns: PurchaseReturnRecord[] }>(
          "/api/pos/stock/purchase-returns/",
          { params: scopeParams(outletId) },
        );
        return res.data.purchaseReturns || [];
      } catch {
        /* fallback */
      }
    }
    return [...purchaseReturnsStore];
  },
  createPurchaseReturn: async (
    data: Omit<PurchaseReturnRecord, "id"> & { items?: Array<{ stockItemId?: string; name: string; quantity: number; unit?: string; unitPrice?: number }> },
    outletId?: string,
  ): Promise<PurchaseReturnRecord> => {
    if (isBackendOutletId(outletId)) {
      const res = await httpClient.post<PurchaseReturnRecord>("/api/pos/stock/purchase-returns/", data, {
        params: scopeParams(outletId),
      });
      return res.data;
    }
    const newReturn: PurchaseReturnRecord = { ...data, id: `pr-${Date.now()}` };
    purchaseReturnsStore = [newReturn, ...purchaseReturnsStore];
    return newReturn;
  },
  deletePurchaseReturn: async (id: string, outletId?: string): Promise<boolean> => {
    if (isBackendOutletId(outletId)) {
      await httpClient.delete(`/api/pos/stock/purchase-returns/${id}/`);
      return true;
    }
    purchaseReturnsStore = purchaseReturnsStore.filter((p) => p.id !== id);
    return true;
  },

  getStockItems: async (outletId?: string): Promise<StockItem[]> => {
    if (isBackendOutletId(outletId)) {
      try {
        const res = await httpClient.get<{ success: boolean; items: StockItem[] }>("/api/pos/stock/items/", {
          params: scopeParams(outletId),
        });
        return (res.data.items || []).map(mapStock);
      } catch {
        return [];
      }
    }
    return [...stockStore];
  },

  upsertStockItem: async (
    data: Partial<StockItem> & { code?: string; name?: string; rawMaterial?: string },
    outletId?: string,
  ): Promise<StockItem> => {
    if (isBackendOutletId(outletId)) {
      const res = await httpClient.post<StockItem>(
        "/api/pos/stock/items/",
        {
          code: data.code,
          name: data.name || data.rawMaterial,
          rawMaterial: data.rawMaterial || data.name,
          category: data.category,
          unit: data.unit,
          availableStock: data.availableStock,
          parLevel: data.parLevel,
          reorderLevel: data.reorderLevel ?? data.minThreshold,
          unitCost: data.unitCost,
          itemKind: data.itemKind || "RAW",
          isFavorite: data.isFavorite,
        },
        { params: scopeParams(outletId) },
      );
      return mapStock(res.data);
    }
    const qty = data.availableStock ?? 0;
    const reorder = data.reorderLevel ?? data.minThreshold ?? 0;
    const created: StockItem = {
      id: data.id || `st-${Date.now()}`,
      code: data.code,
      rawMaterial: data.rawMaterial || data.name || "",
      category: data.category || "",
      unit: data.unit || "Kg",
      availableStock: qty,
      closingStock: qty,
      reorderLevel: reorder,
      parLevel: data.parLevel,
      unitCost: data.unitCost,
      itemKind: data.itemKind || "RAW",
      isFavorite: data.isFavorite,
      isActive: data.isActive !== false,
      isLow: reorder > 0 ? qty < reorder : qty === 0,
    };
    stockStore = [created, ...stockStore.filter((s) => s.id !== created.id)];
    persistMockLedger();
    return created;
  },

  deleteStockItem: async (id: string, outletId?: string): Promise<boolean> => {
    if (isBackendOutletId(outletId)) {
      await httpClient.delete(`/api/pos/stock/items/${id}/`);
      return true;
    }
    stockStore = stockStore.filter((s) => s.id !== id);
    persistMockLedger();
    return true;
  },

  patchStockItem: async (
    id: string,
    data: Partial<StockItem>,
    outletId?: string,
  ): Promise<StockItem> => {
    if (isBackendOutletId(outletId)) {
      const res = await httpClient.patch<StockItem>(`/api/pos/stock/items/${id}/`, data, {
        params: scopeParams(outletId),
      });
      return mapStock(res.data);
    }
    stockStore = stockStore.map((item) => (item.id === id ? mapStock({ ...item, ...data, id }) : item));
    persistMockLedger();
    return stockStore.find((item) => item.id === id)!;
  },

  updateStockItem: async (
    id: string,
    newStock: number,
    notes?: string,
    outletId?: string,
  ): Promise<StockItem | undefined> => {
    if (isBackendOutletId(outletId)) {
      await httpClient.post(`/api/pos/stock/items/${id}/adjust/`, {
        quantity: newStock,
        movementType: "ADJUST",
        notes,
      });
      const items = await posInventoryService.getStockItems(outletId);
      return items.find((i) => i.id === id);
    }
    stockStore = stockStore.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          newStock,
          variance: newStock - item.closingStock,
          notes: notes !== undefined ? notes : item.notes,
        };
      }
      return item;
    });
    persistMockLedger();
    return stockStore.find((i) => i.id === id);
  },

  saveClosingStock: async (
    entries: { id: string; newStock: number; notes?: string }[],
    outletId?: string,
    businessDate?: string,
  ): Promise<boolean> => {
    if (isBackendOutletId(outletId)) {
      await httpClient.post(
        "/api/pos/stock/closing/",
        { date: businessDate, entries },
        { params: scopeParams(outletId) },
      );
      return true;
    }
    entries.forEach((e) => {
      stockStore = stockStore.map((item) => {
        if (item.id === e.id) {
          return {
            ...item,
            closingStock: e.newStock,
            availableStock: e.newStock,
            newStock: undefined,
            variance: 0,
            notes: e.notes || item.notes,
          };
        }
        return item;
      });
    });
    persistMockLedger();
    return true;
  },

  getOverview: async (outletId?: string): Promise<StockOverview | null> => {
    if (!isBackendOutletId(outletId)) {
      const valuation = stockStore.reduce(
        (sum, item) => sum + Number(item.availableStock || 0) * Number(item.unitCost || 0),
        0,
      );
      const lowStock = stockStore.filter((item) => item.isLow || item.availableStock === 0);
      return {
        success: true,
        skuActive: stockStore.length,
        valuation,
        lowStockCount: lowStock.length,
        atParCount: 0,
        critical: stockStore.filter((item) => item.availableStock === 0).length,
        wastageTodayQty: mockMovements
          .filter((mov) => mov.type === "WASTAGE")
          .reduce((sum, mov) => sum + mov.quantity, 0),
        lowStock,
        atPar: [],
        items: [...stockStore],
        movements: mockMovements,
      };
    }
    const res = await httpClient.get<StockOverview>("/api/pos/stock/overview/", { params: scopeParams(outletId) });
    return res.data;
  },

  getAlerts: async (outletId?: string): Promise<StockAlert[]> => {
    if (!isBackendOutletId(outletId)) {
      return stockStore
        .filter((item) => item.isLow || item.availableStock === 0)
        .map((item) => ({
          id: `alert-${item.id}`,
          title: item.availableStock === 0 ? "Out of stock" : "Low stock alert",
          message: `${item.rawMaterial} is at ${item.availableStock} ${item.unit}.`,
          category: "STOCK",
          link: "/pos/inventory/available-stock",
          stockItemId: item.id,
          severity: item.availableStock === 0 ? "critical" : "warning",
        }));
    }
    try {
      const res = await httpClient.get<{ alerts: StockAlert[] }>("/api/pos/stock/alerts/", { params: scopeParams(outletId) });
      return res.data.alerts || [];
    } catch {
      return [];
    }
  },

  getSettings: async (outletId?: string): Promise<InventorySettings | null> => {
    if (!isBackendOutletId(outletId)) return null;
    const res = await httpClient.get<{ settings: InventorySettings }>("/api/pos/stock/settings/", {
      params: scopeParams(outletId),
    });
    return res.data.settings;
  },

  saveSettings: async (settings: Partial<InventorySettings>, outletId?: string): Promise<InventorySettings | null> => {
    if (!isBackendOutletId(outletId)) return null;
    const res = await httpClient.put<{ settings: InventorySettings }>(
      "/api/pos/stock/settings/",
      settings,
      { params: scopeParams(outletId) },
    );
    return res.data.settings;
  },

  getRecipes: async (outletId?: string): Promise<DishRecipe[]> => {
    try {
      const res = await httpClient.get<{ recipes: DishRecipe[] }>("/api/pos/stock/recipes/", {
        params: scopeParams(outletId),
      });
      return res.data.recipes || [];
    } catch {
      return [];
    }
  },

  saveRecipe: async (data: Partial<DishRecipe>, outletId?: string): Promise<DishRecipe> => {
    const res = await httpClient.post<DishRecipe>("/api/pos/stock/recipes/", data, { params: scopeParams(outletId) });
    return res.data;
  },

  deleteRecipe: async (id: string): Promise<boolean> => {
    await httpClient.delete(`/api/pos/stock/recipes/${id}/`);
    return true;
  },

  getWastage: async (outletId?: string) => {
    try {
      const res = await httpClient.get<{ items: Array<Record<string, unknown>> }>("/api/pos/stock/wastage/", {
        params: scopeParams(outletId),
      });
      return res.data.items || [];
    } catch {
      return [];
    }
  },

  createWastage: async (
    data: {
      stockItemId: string;
      quantity: number;
      unit?: string;
      reason?: string;
      approvedBy?: string;
      date?: string;
      notes?: string;
    },
    outletId?: string,
  ) => {
    if (!isBackendOutletId(outletId)) {
      adjustMockStock(data.stockItemId, -Number(data.quantity || 0), "WASTAGE", data.reason);
      return { id: `wst-${Date.now()}`, ...data };
    }
    const res = await httpClient.post("/api/pos/stock/wastage/", data, { params: scopeParams(outletId) });
    return res.data;
  },

  deleteWastage: async (id: string) => {
    await httpClient.delete(`/api/pos/stock/wastage/${id}/`);
    return true;
  },

  getConsumption: async (outletId?: string) => {
    if (!isBackendOutletId(outletId)) return [];
    try {
      const res = await httpClient.get<{ items: Array<Record<string, unknown>> }>("/api/pos/reports/consumption/", {
        params: scopeParams(outletId),
      });
      return res.data.items || [];
    } catch {
      return [];
    }
  },

  adjustMockStock,

  getUnits: async (outletId?: string) => {
    if (!isBackendOutletId(outletId)) {
      return [
        { id: "U-1", name: "Kilogram", symbol: "kg", type: "Weight", baseUnit: "Gram (g)", ratio: "1 kg = 1000 g" },
        { id: "U-2", name: "Gram", symbol: "g", type: "Weight", baseUnit: "Gram (g)", ratio: "1 g = 1 g" },
        { id: "U-3", name: "Liter", symbol: "L", type: "Volume", baseUnit: "Milliliter (ml)", ratio: "1 L = 1000 ml" },
        { id: "U-4", name: "Milliliter", symbol: "ml", type: "Volume", baseUnit: "Milliliter (ml)", ratio: "1 ml = 1 ml" },
        { id: "U-5", name: "Pieces", symbol: "pcs", type: "Count", baseUnit: "Pieces", ratio: "1 pcs = 1 pcs" },
        { id: "U-6", name: "Portion", symbol: "portion", type: "Serving", baseUnit: "Portion", ratio: "1 portion = 1 portion" },
      ];
    }
    try {
      const res = await httpClient.get<{ units: Array<Record<string, unknown>> }>("/api/pos/stock/units/", {
        params: scopeParams(outletId),
      });
      return res.data.units || [];
    } catch {
      return [];
    }
  },

  saveUnit: async (
    data: { id?: string; name: string; symbol: string; type?: string; baseUnit?: string; ratioToBase?: number },
    outletId?: string,
  ) => {
    const res = await httpClient.post("/api/pos/stock/units/", data, { params: scopeParams(outletId) });
    return res.data;
  },

  deleteUnit: async (id: string) => {
    await httpClient.delete(`/api/pos/stock/units/${id}/`);
    return true;
  },
};
