import { posMenuService } from "./posMenuService";
import { posInventoryService } from "./posInventoryService";

export type DailyPreparationIngredient = {
  rawMaterialId: string;
  rawMaterialName: string;
  quantity: number;
  unit: string;
};

export type DailyPreparationRecord = {
  id: string;
  outletId: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. 11:30 AM
  menuItemId: string;
  menuItemName: string;
  menuItemCode: string;
  category?: string;
  diet?: string;
  plates: number; // Plates prepared in this batch
  ingredients: DailyPreparationIngredient[];
  notes?: string;
  preparedBy?: string;
  createdAt: string;
};

const DAILY_PREP_STORE_KEY = (outletId?: string) =>
  `retrod_pos_daily_prep:${outletId || "default"}`;

function getStoredPreps(outletId?: string): DailyPreparationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DAILY_PREP_STORE_KEY(outletId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredPreps(outletId: string | undefined, preps: DailyPreparationRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DAILY_PREP_STORE_KEY(outletId), JSON.stringify(preps));
  } catch {
    // ignore
  }
}

export const posDailyPrepService = {
  getDailyPreps: async (outletId?: string): Promise<DailyPreparationRecord[]> => {
    return getStoredPreps(outletId);
  },

  createDailyPrep: async (
    data: {
      outletId?: string;
      date: string;
      menuItemId: string;
      menuItemName: string;
      menuItemCode: string;
      category?: string;
      diet?: string;
      plates: number;
      ingredients: DailyPreparationIngredient[];
      notes?: string;
      preparedBy?: string;
    },
    outletId?: string,
  ): Promise<DailyPreparationRecord> => {
    const effectiveOutletId = outletId || data.outletId || "default";
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newRecord: DailyPreparationRecord = {
      id: `dp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      outletId: effectiveOutletId,
      date: data.date || now.toISOString().slice(0, 10),
      time: timeStr,
      menuItemId: data.menuItemId,
      menuItemName: data.menuItemName,
      menuItemCode: data.menuItemCode,
      category: data.category,
      diet: data.diet,
      plates: Number(data.plates) || 0,
      ingredients: data.ingredients || [],
      notes: data.notes?.trim() || undefined,
      preparedBy: data.preparedBy?.trim() || undefined,
      createdAt: now.toISOString(),
    };

    // 1. Increment available plates in POS billing catalog
    if (newRecord.plates > 0) {
      posMenuService.updateItemPlates(
        effectiveOutletId,
        newRecord.menuItemId,
        newRecord.plates,
        true, // isDelta = true (adds to today's available stock)
      );
    }

    // 2. Deduct consumed raw materials from inventory stock
    for (const ing of newRecord.ingredients) {
      if (ing.rawMaterialId && ing.quantity > 0) {
        try {
          await posInventoryService.adjustStock(
            ing.rawMaterialId,
            -Math.abs(ing.quantity),
            "DAILY_PREP",
            `Daily Prep: ${newRecord.menuItemName} (${newRecord.plates} plates) on ${newRecord.date}`,
            effectiveOutletId,
          );
        } catch {
          // ignore individual adjustment failure
        }
      }
    }

    // 3. Save record to persistent daily prep log
    const existing = getStoredPreps(effectiveOutletId);
    const updated = [newRecord, ...existing];
    saveStoredPreps(effectiveOutletId, updated);

    return newRecord;
  },

  deleteDailyPrep: async (
    id: string,
    rollbackStock = true,
    outletId?: string,
  ): Promise<boolean> => {
    const existing = getStoredPreps(outletId);
    const target = existing.find((p) => p.id === id);
    if (!target) return false;

    if (rollbackStock) {
      // 1. Rollback plates
      if (target.plates > 0) {
        posMenuService.updateItemPlates(
          outletId || target.outletId,
          target.menuItemId,
          -target.plates,
          true,
        );
      }

      // 2. Rollback raw materials
      for (const ing of target.ingredients) {
        if (ing.rawMaterialId && ing.quantity > 0) {
          try {
            await posInventoryService.adjustStock(
              ing.rawMaterialId,
              Math.abs(ing.quantity),
              "DAILY_PREP_ROLLBACK",
              `Cancelled Prep: ${target.menuItemName} (${target.plates} plates)`,
              outletId || target.outletId,
            );
          } catch {
            // ignore
          }
        }
      }
    }

    const filtered = existing.filter((p) => p.id !== id);
    saveStoredPreps(outletId, filtered);
    return true;
  },
};
