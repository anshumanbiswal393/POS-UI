import httpClient from "@/utils/httpClient";

export interface RecipeIngredientDto {
  id: string;
  stockItemId: string;
  stockItemCode: string;
  stockItemName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  lineCost: number;
}

export interface ProductionRecipeDto {
  id: string;
  code: string;
  name: string;
  category: string;
  outputUnit: string;
  expectedYield: number;
  standardCost: number;
  costPerUnit: number;
  shelfLifeDays: number;
  instructions: string;
  rawMaterialsCount: number;
  ingredientsSummary: string;
  outputStockItemId?: string | null;
  outputStockItemName?: string | null;
  isActive: boolean;
  ingredients: RecipeIngredientDto[];
  createdAt?: string;
}

export interface BatchIngredientDto {
  id: string;
  stockItemId: string;
  stockItemCode: string;
  stockItemName: string;
  standardQuantity: number;
  actualQuantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface ProductionBatchDto {
  id: string;
  batchNumber: string;
  recipeId: string;
  recipeName: string;
  recipeCode: string;
  category: string;
  preparationDate: string;
  rawDate?: string;
  yieldQuantity: number;
  yieldUnit: string;
  batchQty: string;
  operator: string;
  status: "COMPLETED" | "IN_PROGRESS" | "DISCARDED";
  totalCost: number;
  unitCost: number;
  notes: string;
  expiryDate?: string;
  isStockDeducted: boolean;
  rawMaterialsDeducted: string;
  ingredients: BatchIngredientDto[];
  createdAt?: string;
}

export interface AvailableRawMaterial {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  unitCost: number;
  quantityOnHand: number;
}

const LOCAL_STORAGE_RECIPES_KEY = "retrod_pos_production_recipes_v2";
const LOCAL_STORAGE_BATCHES_KEY = "retrod_pos_production_batches_v2";

const DEFAULT_RAW_MATERIALS: AvailableRawMaterial[] = [];

const DEFAULT_RECIPES: ProductionRecipeDto[] = [];

const DEFAULT_BATCHES: ProductionBatchDto[] = [];

function getStoredRecipes(): ProductionRecipeDto[] {
  if (typeof window === "undefined") return DEFAULT_RECIPES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RECIPES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error("Failed to read recipes from localStorage", err);
  }
  return DEFAULT_RECIPES;
}

function saveStoredRecipes(recipes: ProductionRecipeDto[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_RECIPES_KEY, JSON.stringify(recipes));
  } catch (err) {
    console.error("Failed to save recipes to localStorage", err);
  }
}

function getStoredBatches(): ProductionBatchDto[] {
  if (typeof window === "undefined") return DEFAULT_BATCHES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BATCHES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error("Failed to read batches from localStorage", err);
  }
  return DEFAULT_BATCHES;
}

function saveStoredBatches(batches: ProductionBatchDto[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_BATCHES_KEY, JSON.stringify(batches));
  } catch (err) {
    console.error("Failed to save batches to localStorage", err);
  }
}

export const posProductionService = {
  getAvailableRawMaterials(): AvailableRawMaterial[] {
    return DEFAULT_RAW_MATERIALS;
  },

  async fetchRecipes(params?: { category?: string; search?: string }): Promise<ProductionRecipeDto[]> {
    try {
      const res = await httpClient.get<{ success: boolean; recipes: ProductionRecipeDto[] }>(
        "/api/pos/stock/production/recipes/",
        { params },
      );
      if (res?.data?.recipes && res.data.recipes.length > 0) {
        saveStoredRecipes(res.data.recipes);
        return res.data.recipes;
      }
    } catch {
      // Fallback to local storage
    }

    let items = getStoredRecipes();
    if (params?.category && params.category !== "All") {
      items = items.filter((r) => r.category.toLowerCase() === params.category!.toLowerCase());
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter((r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
    }
    return items;
  },

  async saveRecipe(payload: {
    id?: string;
    code?: string;
    name: string;
    category: string;
    outputUnit: string;
    expectedYield: number;
    shelfLifeDays?: number;
    instructions?: string;
    ingredients: Array<{
      stockItemId: string;
      stockItemName: string;
      stockItemCode?: string;
      quantity: number;
      unit: string;
      unitCost: number;
    }>;
  }): Promise<ProductionRecipeDto> {
    try {
      const res = await httpClient.post<ProductionRecipeDto>(
        "/api/pos/stock/production/recipes/",
        payload,
      );
      if (res?.data) {
        const stored = getStoredRecipes();
        const updated = [res.data, ...stored.filter((r) => r.id !== res.data.id)];
        saveStoredRecipes(updated);
        return res.data;
      }
    } catch {
      // Fallback
    }

    // Local execution
    const stored = getStoredRecipes();
    const ingredientsWithCost: RecipeIngredientDto[] = payload.ingredients.map((ing, idx) => ({
      id: `ing-${Date.now()}-${idx}`,
      stockItemId: ing.stockItemId,
      stockItemCode: ing.stockItemCode || `RM-${idx}`,
      stockItemName: ing.stockItemName,
      quantity: ing.quantity,
      unit: ing.unit,
      unitCost: ing.unitCost,
      lineCost: Math.round(ing.quantity * ing.unitCost * 100) / 100,
    }));

    const totalCost = ingredientsWithCost.reduce((sum, i) => sum + i.lineCost, 0);
    const expectedYield = payload.expectedYield || 1;
    const costPerUnit = Math.round((totalCost / expectedYield) * 100) / 100;

    const recipe: ProductionRecipeDto = {
      id: payload.id || `PRD-REC-0${stored.length + 1}`,
      code: payload.code || `PRD-REC-0${stored.length + 1}`,
      name: payload.name,
      category: payload.category || "Gravies & Sauces",
      outputUnit: payload.outputUnit || "Liter (L)",
      expectedYield,
      standardCost: totalCost,
      costPerUnit,
      shelfLifeDays: payload.shelfLifeDays || 3,
      instructions: payload.instructions || "",
      rawMaterialsCount: ingredientsWithCost.length,
      ingredientsSummary: ingredientsWithCost.map((i) => `${i.stockItemName} (${i.quantity}${i.unit})`).join(", "),
      isActive: true,
      ingredients: ingredientsWithCost,
      createdAt: new Date().toISOString(),
    };

    const next = payload.id
      ? stored.map((r) => (r.id === payload.id ? recipe : r))
      : [recipe, ...stored];
    saveStoredRecipes(next);
    return recipe;
  },

  async deleteRecipe(id: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/pos/stock/production/recipes/${id}/`);
    } catch {
      // Fallback
    }
    const stored = getStoredRecipes();
    const next = stored.filter((r) => r.id !== id);
    saveStoredRecipes(next);
    return true;
  },

  async fetchBatches(params?: { status?: string; search?: string }): Promise<ProductionBatchDto[]> {
    try {
      const res = await httpClient.get<{ success: boolean; batches: ProductionBatchDto[] }>(
        "/api/pos/stock/production/batches/",
        { params },
      );
      if (res?.data?.batches && res.data.batches.length > 0) {
        saveStoredBatches(res.data.batches);
        return res.data.batches;
      }
    } catch {
      // Fallback to local storage
    }

    let items = getStoredBatches();
    if (params?.status && params.status !== "ALL") {
      items = items.filter((b) => b.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (b) =>
          b.batchNumber.toLowerCase().includes(q) ||
          b.recipeName.toLowerCase().includes(q) ||
          b.operator.toLowerCase().includes(q),
      );
    }
    return items;
  },

  async createBatch(payload: {
    recipeId: string;
    yieldQuantity: number;
    yieldUnit: string;
    operator: string;
    status: "COMPLETED" | "IN_PROGRESS" | "DISCARDED";
    notes?: string;
    ingredients?: Array<{
      stockItemId: string;
      actualQuantity: number;
    }>;
  }): Promise<ProductionBatchDto> {
    try {
      const res = await httpClient.post<ProductionBatchDto>(
        "/api/pos/stock/production/batches/",
        payload,
      );
      if (res?.data) {
        const stored = getStoredBatches();
        const updated = [res.data, ...stored];
        saveStoredBatches(updated);
        return res.data;
      }
    } catch {
      // Fallback
    }

    const recipes = getStoredRecipes();
    const recipe = recipes.find((r) => r.id === payload.recipeId) || recipes[0];
    const stored = getStoredBatches();

    const scale = (payload.yieldQuantity / (recipe.expectedYield || 1)) || 1;
    const consumedMap = new Map((payload.ingredients || []).map((i) => [i.stockItemId, i.actualQuantity]));

    let totalCost = 0;
    const batchIngredients: BatchIngredientDto[] = recipe.ingredients.map((ing, idx) => {
      const stdQty = Math.round(ing.quantity * scale * 1000) / 1000;
      const actQty = consumedMap.has(ing.stockItemId) ? consumedMap.get(ing.stockItemId)! : stdQty;
      const lineCost = Math.round(actQty * ing.unitCost * 100) / 100;
      totalCost += lineCost;
      return {
        id: `b-ing-${Date.now()}-${idx}`,
        stockItemId: ing.stockItemId,
        stockItemCode: ing.stockItemCode,
        stockItemName: ing.stockItemName,
        standardQuantity: stdQty,
        actualQuantity: actQty,
        unit: ing.unit,
        unitCost: ing.unitCost,
        totalCost: lineCost,
      };
    });

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const expDate = new Date(now.getTime() + (recipe.shelfLifeDays || 3) * 86400000);
    const expStr = expDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const batchNumber = `PRD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(stored.length + 1).padStart(3, "0")}`;

    const newBatch: ProductionBatchDto = {
      id: `EXEC-${Date.now()}`,
      batchNumber,
      recipeId: recipe.id,
      recipeName: recipe.name,
      recipeCode: recipe.code,
      category: recipe.category,
      preparationDate: dateStr,
      rawDate: now.toISOString().slice(0, 10),
      yieldQuantity: payload.yieldQuantity,
      yieldUnit: payload.yieldUnit || recipe.outputUnit,
      batchQty: `${payload.yieldQuantity} ${payload.yieldUnit || recipe.outputUnit}`,
      operator: payload.operator || "Chef",
      status: payload.status,
      totalCost,
      unitCost: Math.round((totalCost / payload.yieldQuantity) * 100) / 100,
      notes: payload.notes || "",
      expiryDate: expStr,
      isStockDeducted: payload.status === "COMPLETED",
      rawMaterialsDeducted: batchIngredients.slice(0, 3).map((i) => `${i.stockItemName} (${i.actualQuantity}${i.unit})`).join(", "),
      ingredients: batchIngredients,
      createdAt: now.toISOString(),
    };

    const next = [newBatch, ...stored];
    saveStoredBatches(next);
    return newBatch;
  },

  async updateBatchStatus(id: string, status: "COMPLETED" | "IN_PROGRESS" | "DISCARDED"): Promise<ProductionBatchDto | null> {
    try {
      const res = await httpClient.patch<ProductionBatchDto>(
        `/api/pos/stock/production/batches/${id}/`,
        { status },
      );
      if (res?.data) {
        const stored = getStoredBatches();
        const updated = stored.map((b) => (b.id === id ? res.data : b));
        saveStoredBatches(updated);
        return res.data;
      }
    } catch {
      // Fallback
    }

    const stored = getStoredBatches();
    const found = stored.find((b) => b.id === id);
    if (!found) return null;

    found.status = status;
    if (status === "COMPLETED") {
      found.isStockDeducted = true;
    }
    saveStoredBatches(stored);
    return found;
  },
};
