import httpClient from "@/utils/httpClient";
import { isBackendOutletId } from "@/utils/outletId";
import type {
  StockPurchaseRecord,
  PurchaseOrderRecord,
  PurchaseReturnRecord,
  InventoryVendor,
  StockItem,
  StockCategory,
  StockSubCategory,
  StockOverview,
  StockAlert,
  DishRecipe,
  InventorySettings,
} from "@/types/posInventory";

const initialVendors: InventoryVendor[] = [];

const STOCK_STORE_KEY = "retrod_pos_stock_items_v1";
const MOVEMENT_STORE_KEY = "retrod_pos_stock_movements_v1";
const CATEGORY_STORE_KEY = "retrod_pos_stock_categories_v1";

const DEFAULT_CATEGORIES: StockCategory[] = [
  {
    id: "cat-dairy",
    name: "Dairy",
    subCategories: [
      { id: "sub-milk", name: "Cow Milk", unit: "Ltr" },
      { id: "sub-cheese", name: "Cheese", unit: "Kg" },
      { id: "sub-butter", name: "Butter", unit: "Kg" },
      { id: "sub-paneer", name: "Paneer", unit: "Kg" },
    ],
  },
  {
    id: "cat-groceries",
    name: "Groceries",
    subCategories: [
      { id: "sub-rice", name: "Rice", unit: "Kg" },
      { id: "sub-flour", name: "Flour / Atta", unit: "Kg" },
      { id: "sub-oil", name: "Cooking Oil", unit: "Ltr" },
      { id: "sub-spices", name: "Whole Spices", unit: "Gm" },
    ],
  },
  {
    id: "cat-meat",
    name: "Meat & Poultry",
    subCategories: [
      { id: "sub-chicken", name: "Chicken", unit: "Kg" },
      { id: "sub-mutton", name: "Mutton", unit: "Kg" },
      { id: "sub-fish", name: "Fish / Seafood", unit: "Kg" },
    ],
  },
  {
    id: "cat-beverages",
    name: "Beverages",
    subCategories: [
      { id: "sub-syrup", name: "Drink Syrup", unit: "Bottle" },
      { id: "sub-coffee", name: "Coffee Beans", unit: "Kg" },
      { id: "sub-tea", name: "Tea Leaves", unit: "Kg" },
    ],
  },
];

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
let categoriesStore: StockCategory[] = readJson<StockCategory[]>(CATEGORY_STORE_KEY, DEFAULT_CATEGORIES);
let mockMovements: StockOverview["movements"] = readJson<StockOverview["movements"]>(
  MOVEMENT_STORE_KEY,
  [],
);

function persistMockLedger() {
  writeJson(STOCK_STORE_KEY, stockStore);
  writeJson(MOVEMENT_STORE_KEY, mockMovements);
  writeJson(CATEGORY_STORE_KEY, categoriesStore);
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
  const alertQty = raw.alertQuantity ?? raw.reorderLevel ?? raw.minThreshold ?? 0;
  const unitCost = raw.unitCost ?? raw.pricePerUnit ?? 0;
  return {
    ...raw,
    rawMaterial: name,
    name,
    category: raw.category || "",
    subCategory: raw.subCategory || (raw as any).sub_category || "",
    unit: raw.unit || "Kg",
    availableStock: qty,
    closingStock: raw.closingStock ?? qty,
    quantityOnHand: qty,
    parLevel: raw.parLevel ?? 0,
    reorderLevel: alertQty,
    minThreshold: alertQty,
    alertQuantity: alertQty,
    unitCost,
    pricePerUnit: unitCost,
    sku: raw.sku || raw.code || raw.id,
    isReturnable: Boolean(raw.isReturnable ?? (raw as any).is_returnable),
    expiryDate: raw.expiryDate ?? (raw as any).expiry_date ?? null,
    itemKind: raw.itemKind || "RAW",
    isLow: alertQty > 0 ? qty <= alertQty : qty === 0,
  };
}

function getCategoryStoreKey(outletId?: string) {
  return outletId ? `${CATEGORY_STORE_KEY}_${outletId}` : CATEGORY_STORE_KEY;
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
      for (const line of data.items || []) {
        if (!line.stockItemId) continue;
        await posInventoryService.adjustStock(
          line.stockItemId,
          Number(line.quantity) || 0,
          "PURCHASE_IN",
          data.invoiceNo || "PUR",
          outletId,
          { unitCost: line.unitPrice },
        );
      }
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

  getCategories: async (outletId?: string): Promise<StockCategory[]> => {
    const storeKey = getCategoryStoreKey(outletId);
    if (isBackendOutletId(outletId)) {
      try {
        const res = await httpClient.get<{ success: boolean; categories?: StockCategory[] }>(
          "/api/pos/stock/categories/",
          { params: scopeParams(outletId) },
        );
        if (res.data && Array.isArray(res.data.categories)) {
          writeJson(storeKey, res.data.categories);
          return res.data.categories;
        }
      } catch {
        // Fallback to local store
      }
    }
    const cached = readJson<StockCategory[] | null>(storeKey, null);
    if (cached !== null) {
      return cached;
    }
    if (!outletId) {
      return [...categoriesStore];
    }
    const legacy = readJson<StockCategory[]>(CATEGORY_STORE_KEY, DEFAULT_CATEGORIES);
    writeJson(storeKey, legacy);
    return legacy;
  },

  upsertCategory: async (
    category: Partial<StockCategory> & { name: string },
    outletId?: string,
  ): Promise<StockCategory> => {
    const id = category.id || `cat-${Date.now()}`;
    const subCategories = (category.subCategories || []).map((sub, idx) => ({
      id: sub.id || `sub-${Date.now()}-${idx}`,
      name: sub.name.trim(),
      unit: sub.unit || "Kg",
    }));
    const newCategory: StockCategory = {
      id,
      name: category.name.trim(),
      subCategories,
      updatedAt: new Date().toISOString(),
    };

    if (isBackendOutletId(outletId)) {
      try {
        await httpClient.post("/api/pos/stock/categories/", newCategory, {
          params: scopeParams(outletId),
        });
      } catch {
        // Fallback to local store
      }
    }

    const storeKey = getCategoryStoreKey(outletId);
    let localCategories = readJson<StockCategory[] | null>(storeKey, null);
    if (!localCategories) {
      localCategories = outletId ? [] : [...categoriesStore];
    }
    const idx = localCategories.findIndex((c) => c.id === id);
    if (idx >= 0) {
      localCategories[idx] = newCategory;
    } else {
      localCategories.unshift(newCategory);
    }
    writeJson(storeKey, localCategories);
    if (!outletId) {
      categoriesStore = localCategories;
      persistMockLedger();
    }
    return newCategory;
  },

  deleteCategory: async (id: string, outletId?: string): Promise<boolean> => {
    if (isBackendOutletId(outletId)) {
      try {
        await httpClient.delete(`/api/pos/stock/categories/${id}/`, {
          params: scopeParams(outletId),
        });
      } catch {
        // Fallback to local store
      }
    }
    const storeKey = getCategoryStoreKey(outletId);
    let localCategories = readJson<StockCategory[] | null>(storeKey, null);
    if (!localCategories) {
      localCategories = outletId ? [] : [...categoriesStore];
    }
    localCategories = localCategories.filter((c) => c.id !== id);
    writeJson(storeKey, localCategories);
    if (!outletId) {
      categoriesStore = localCategories;
      persistMockLedger();
    }
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
    const alertQty = data.alertQuantity ?? data.reorderLevel ?? data.minThreshold ?? 0;
    const unitPrice = data.pricePerUnit ?? data.unitCost ?? 0;
    const skuCode = data.sku || data.code;

    if (isBackendOutletId(outletId)) {
      if (data.id) {
        const res = await httpClient.patch<StockItem>(
          `/api/pos/stock/items/${data.id}/`,
          {
            code: skuCode,
            name: data.name || data.rawMaterial,
            rawMaterial: data.rawMaterial || data.name,
            category: data.category,
            subCategory: data.subCategory,
            unit: data.unit,
            availableStock: data.availableStock,
            parLevel: data.parLevel,
            reorderLevel: alertQty,
            alertQuantity: alertQty,
            unitCost: unitPrice,
            pricePerUnit: unitPrice,
            itemKind: data.itemKind || "RAW",
            isFavorite: data.isFavorite,
            isReturnable: data.isReturnable,
            expiryDate: data.expiryDate,
          },
          { params: scopeParams(outletId) },
        );
        return mapStock(res.data);
      }
      const res = await httpClient.post<StockItem>(
        "/api/pos/stock/items/",
        {
          code: skuCode,
          name: data.name || data.rawMaterial,
          rawMaterial: data.rawMaterial || data.name,
          category: data.category,
          subCategory: data.subCategory,
          unit: data.unit,
          availableStock: data.availableStock,
          parLevel: data.parLevel,
          reorderLevel: alertQty,
          alertQuantity: alertQty,
          unitCost: unitPrice,
          pricePerUnit: unitPrice,
          itemKind: data.itemKind || "RAW",
          isFavorite: data.isFavorite,
          isReturnable: data.isReturnable,
          expiryDate: data.expiryDate,
        },
        { params: scopeParams(outletId) },
      );
      return mapStock(res.data);
    }
    const qty = data.availableStock ?? 0;
    const existing = data.id ? stockStore.find((s) => s.id === data.id) : null;
    const created: StockItem = {
      ...(existing || {}),
      ...data,
      id: data.id || `st-${Date.now()}`,
      code: skuCode,
      sku: skuCode,
      rawMaterial: data.rawMaterial || data.name || "",
      name: data.name || data.rawMaterial || "",
      category: data.category || "",
      subCategory: data.subCategory || "",
      unit: data.unit || "Kg",
      availableStock: qty,
      closingStock: qty,
      reorderLevel: alertQty,
      minThreshold: alertQty,
      alertQuantity: alertQty,
      parLevel: data.parLevel,
      unitCost: unitPrice,
      pricePerUnit: unitPrice,
      isReturnable: Boolean(data.isReturnable),
      expiryDate: data.expiryDate || null,
      itemKind: data.itemKind || "RAW",
      isFavorite: data.isFavorite !== undefined ? data.isFavorite : existing?.isFavorite,
      isActive: data.isActive !== undefined ? data.isActive : (existing?.isActive !== false),
      isLow: alertQty > 0 ? qty <= alertQty : qty === 0,
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

  adjustStock: async (
    stockItemId: string,
    deltaQty: number,
    type = "ADJUST",
    notes = "",
    outletId?: string,
    extra?: { unitCost?: number },
  ) => {
    adjustMockStock(stockItemId, deltaQty, type, notes, extra);
    if (isBackendOutletId(outletId)) {
      try {
        await httpClient.post(`/api/pos/stock/items/${stockItemId}/adjust/`, {
          quantity: deltaQty,
          movementType: type,
          notes,
        });
      } catch {
        try {
          const res = await httpClient.get<any>(`/api/pos/stock/items/${stockItemId}/`, {
            params: scopeParams(outletId),
          });
          const currentStock = Number(res?.data?.availableStock ?? res?.data?.quantityOnHand ?? 0);
          const nextStock = Math.max(0, currentStock + deltaQty);
          await httpClient.patch(
            `/api/pos/stock/items/${stockItemId}/`,
            { availableStock: nextStock, quantityOnHand: nextStock },
            { params: scopeParams(outletId) },
          );
        } catch {
          // ignore
        }
      }
    }
  },

  saveClosingStock: async (
    entries: { id: string; newStock: number; notes?: string }[],
    outletId?: string,
    businessDate?: string,
  ): Promise<boolean> => {
    if (isBackendOutletId(outletId)) {
      try {
        await httpClient.post(
          "/api/pos/stock/closing/",
          { date: businessDate, entries },
          { params: scopeParams(outletId) },
        );
      } catch (err: any) {
        console.warn("Backend closing stock post failed, falling back to local update:", err);
      }
    }
    entries.forEach((e) => {
      stockStore = stockStore.map((item) => {
        if (item.id === e.id) {
          return {
            ...item,
            closingStock: e.newStock,
            availableStock: e.newStock,
            quantityOnHand: e.newStock,
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
    if (isBackendOutletId(outletId)) {
      try {
        const res = await httpClient.get<StockOverview>("/api/pos/stock/overview/", {
          params: scopeParams(outletId),
        });
        if (res.data) return res.data;
      } catch {
        // Fallback to computing from outlet's stock items
      }
    }
    const items = await posInventoryService.getStockItems(outletId);
    const valuation = items.reduce(
      (sum, item) => sum + Number(item.availableStock || 0) * Number(item.unitCost || 0),
      0,
    );
    const lowStock = items.filter((item) => item.isLow || item.availableStock === 0);
    return {
      success: true,
      skuActive: items.length,
      valuation,
      lowStockCount: lowStock.length,
      atParCount: 0,
      critical: items.filter((item) => item.availableStock === 0).length,
      wastageTodayQty: mockMovements
        .filter((mov) => mov.type === "WASTAGE")
        .reduce((sum, mov) => sum + mov.quantity, 0),
      lowStock,
      atPar: [],
      items: [...items],
      movements: mockMovements,
    };
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

  getMovements: async (
    outletId?: string,
    params?: { type?: string; movementType?: string; from?: string; to?: string; limit?: number },
  ) => {
    if (!isBackendOutletId(outletId)) return [];
    try {
      const res = await httpClient.get<{ success: boolean; movements: Array<Record<string, unknown>> }>(
        "/api/pos/stock/movements/",
        {
          params: { ...scopeParams(outletId), ...params },
        },
      );
      return res.data.movements || [];
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
