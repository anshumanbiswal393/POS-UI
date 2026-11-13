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
const DELETED_CATEGORY_STORE_KEY = "retrod_pos_deleted_stock_categories_v1";

const DEFAULT_CATEGORIES: StockCategory[] = [];

function getDeletedCategoryStoreKey(outletId?: string) {
  return outletId ? `${DELETED_CATEGORY_STORE_KEY}_${outletId}` : DELETED_CATEGORY_STORE_KEY;
}

export function getDeletedCategoryNames(outletId?: string): string[] {
  const list = readJson<string[]>(getDeletedCategoryStoreKey(outletId), []);
  return Array.isArray(list) ? list : [];
}

export function extractCategoriesFromStock(
  items: StockItem[],
  customCategories: StockCategory[] = [],
  deletedCategoryNames: string[] = [],
): StockCategory[] {
  const deletedSet = new Set(
    (deletedCategoryNames || []).map((n) => n.trim().toLowerCase()).filter(Boolean),
  );
  const map = new Map<string, StockCategory>();

  // 1. Existing custom/saved categories
  for (const cat of customCategories) {
    if (!cat?.name?.trim()) continue;
    const key = cat.name.trim().toLowerCase();
    if (deletedSet.has(key)) continue;
    map.set(key, {
      id: cat.id || `cat-${key.replace(/\s+/g, "-")}`,
      name: cat.name.trim(),
      subCategories: cat.subCategories ? [...cat.subCategories] : [],
      updatedAt: cat.updatedAt,
    });
  }

  // 2. Discover from actual stock items (raw materials)
  for (const it of items) {
    const rawCat = (it.category || "").trim();
    if (!rawCat) continue;
    const key = rawCat.toLowerCase();
    if (deletedSet.has(key)) continue;
    if (!map.has(key)) {
      map.set(key, {
        id: `cat-${key.replace(/\s+/g, "-")}`,
        name: rawCat,
        subCategories: [],
      });
    }
    const target = map.get(key)!;
    const rawSub = (it.subCategory || it.sub_category || "").trim();
    if (rawSub) {
      const subExists = target.subCategories.some(
        (s) => s.name.trim().toLowerCase() === rawSub.toLowerCase(),
      );
      if (!subExists) {
        target.subCategories.push({
          id: `sub-${target.subCategories.length}-${rawSub.toLowerCase().replace(/\s+/g, "-")}`,
          name: rawSub,
          unit: it.unit || "Kg",
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

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
let categoriesStore: StockCategory[] = readJson<StockCategory[]>(CATEGORY_STORE_KEY, []);
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
  const next = Math.max(0, Number(sku.availableStock ?? sku.quantityOnHand ?? 0) + signedQty);
  const reorder = sku.reorderLevel ?? sku.minThreshold ?? 0;
  stockStore = stockStore.map((item) =>
    item.id === stockItemId
      ? {
          ...item,
          availableStock: next,
          closingStock: next,
          quantityOnHand: next,
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
    const deletedList = getDeletedCategoryNames(outletId);
    const deletedSet = new Set(deletedList.map((x) => x.toLowerCase()));

    if (isBackendOutletId(outletId)) {
      try {
        const res = await httpClient.get<{ success: boolean; categories?: StockCategory[] }>(
          "/api/pos/stock/categories/",
          { params: scopeParams(outletId) },
        );
        if (res.data && Array.isArray(res.data.categories)) {
          const filtered = res.data.categories.filter(
            (c) => !deletedSet.has(c.name.trim().toLowerCase()),
          );
          writeJson(storeKey, filtered);
          return filtered;
        }
      } catch {
        // Fallback to local store
      }
    }
    const cached = readJson<StockCategory[] | null>(storeKey, null);
    if (cached !== null) {
      return extractCategoriesFromStock(stockStore, cached, deletedList);
    }
    if (!outletId) {
      return extractCategoriesFromStock(stockStore, categoriesStore, deletedList);
    }
    const legacy = readJson<StockCategory[]>(CATEGORY_STORE_KEY, []);
    const merged = extractCategoriesFromStock(stockStore, legacy, deletedList);
    writeJson(storeKey, merged);
    return merged;
  },

  upsertCategory: async (
    category: Partial<StockCategory> & { name: string; oldName?: string },
    outletId?: string,
  ): Promise<StockCategory> => {
    const trimmedName = category.name.trim();
    const id = category.id || `cat-${Date.now()}`;
    const subCategories = (category.subCategories || []).map((sub, idx) => ({
      id: sub.id || `sub-${Date.now()}-${idx}`,
      name: sub.name.trim(),
      unit: sub.unit || "Kg",
    }));
    const newCategory: StockCategory = {
      id,
      name: trimmedName,
      subCategories,
      updatedAt: new Date().toISOString(),
    };

    // Remove from deleted tombstones if previously deleted
    const delKey = getDeletedCategoryStoreKey(outletId);
    let delList = readJson<string[]>(delKey, []);
    const catNameLower = trimmedName.toLowerCase();
    if (delList.some((x) => x.toLowerCase() === catNameLower)) {
      delList = delList.filter((x) => x.toLowerCase() !== catNameLower);
      writeJson(delKey, delList);
    }

    if (isBackendOutletId(outletId)) {
      try {
        const res = await httpClient.post<{ success: boolean; category?: StockCategory }>(
          "/api/pos/stock/categories/",
          { ...newCategory, old_name: category.oldName },
          { params: scopeParams(outletId) },
        );
        if (res.data?.category) {
          const saved = res.data.category;
          const storeKey = getCategoryStoreKey(outletId);
          let local = readJson<StockCategory[]>(storeKey, []);
          const idx = local.findIndex(
            (c) => c.name.toLowerCase() === saved.name.toLowerCase() || c.id === saved.id,
          );
          if (idx >= 0) local[idx] = saved;
          else local.unshift(saved);
          writeJson(storeKey, local);
          return saved;
        }
      } catch {
        // Fallback to local store
      }
    }

    const storeKey = getCategoryStoreKey(outletId);
    let localCategories = readJson<StockCategory[] | null>(storeKey, null);
    if (!localCategories) {
      localCategories = outletId ? [] : [...categoriesStore];
    }
    const idx = localCategories.findIndex(
      (c) => c.id === id || c.name.toLowerCase() === newCategory.name.toLowerCase(),
    );
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

  deleteCategory: async (id: string, outletId?: string, categoryName?: string): Promise<boolean> => {
    const storeKey = getCategoryStoreKey(outletId);
    let localCategories = readJson<StockCategory[] | null>(storeKey, null);
    if (!localCategories) {
      localCategories = outletId ? [] : [...categoriesStore];
    }
    const found = localCategories.find((c) => c.id === id);
    const targetName = (
      categoryName ||
      found?.name ||
      id.replace(/^cat-/, "").replace(/-/g, " ")
    ).trim();

    if (isBackendOutletId(outletId)) {
      try {
        await httpClient.delete(`/api/pos/stock/categories/${encodeURIComponent(id)}/`, {
          params: scopeParams(outletId),
        });
      } catch {
        // Fallback to local store
      }
    }

    // Record tombstone so extractCategoriesFromStock and getCategories never re-add it
    if (targetName) {
      const delKey = getDeletedCategoryStoreKey(outletId);
      const delList = readJson<string[]>(delKey, []);
      const targetLower = targetName.toLowerCase();
      if (!delList.map((x) => x.toLowerCase()).includes(targetLower)) {
        delList.push(targetLower);
        writeJson(delKey, delList);
      }
    }

    // Remove from local categories
    localCategories = localCategories.filter(
      (c) => c.id !== id && c.name.toLowerCase() !== targetName.toLowerCase(),
    );
    writeJson(storeKey, localCategories);
    if (!outletId) {
      categoriesStore = localCategories;
      persistMockLedger();
    }

    // Clear deleted category from stockStore items
    stockStore = stockStore.map((it) => {
      if (it.category && it.category.trim().toLowerCase() === targetName.toLowerCase()) {
        return { ...it, category: "", subCategory: "" };
      }
      return it;
    });
    persistMockLedger();

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
    adjustMockStock(data.stockItemId, -Number(data.quantity || 0), "WASTAGE", data.reason);
    if (!isBackendOutletId(outletId)) {
      return { id: `wst-${Date.now()}`, ...data };
    }
    const res = await httpClient.post("/api/pos/stock/wastage/", data, { params: scopeParams(outletId) });
    return res.data;
  },

  deleteWastage: async (id: string, outletId?: string, extra?: { stockItemId?: string; quantity?: number }) => {
    if (extra?.stockItemId && extra.quantity) {
      adjustMockStock(extra.stockItemId, Number(extra.quantity), "REVERSE_WASTAGE", "Wastage deleted");
    }
    if (isBackendOutletId(outletId)) {
      await httpClient.delete(`/api/pos/stock/wastage/${id}/`);
    }
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
