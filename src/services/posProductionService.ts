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

const LOCAL_STORAGE_RECIPES_KEY = "retrod_pos_production_recipes";
const LOCAL_STORAGE_BATCHES_KEY = "retrod_pos_production_batches";

const DEFAULT_RAW_MATERIALS: AvailableRawMaterial[] = [
  { id: "rm-1", code: "RM-TOMATO", name: "Fresh Tomatoes (Grade A)", category: "Vegetables", unit: "kg", unitCost: 40, quantityOnHand: 120.0 },
  { id: "rm-2", code: "RM-BUTTER", name: "Dairy Butter Block", category: "Dairy", unit: "kg", unitCost: 280, quantityOnHand: 45.0 },
  { id: "rm-3", code: "RM-CREAM", name: "Fresh Cooking Cream 25%", category: "Dairy", unit: "L", unitCost: 160, quantityOnHand: 35.0 },
  { id: "rm-4", code: "RM-CASHEW", name: "Whole Cashew Nuts (W320)", category: "Dry Fruits", unit: "kg", unitCost: 650, quantityOnHand: 18.5 },
  { id: "rm-5", code: "RM-SPICES", name: "Makhani Garam Masala Blend", category: "Spices", unit: "kg", unitCost: 420, quantityOnHand: 12.0 },
  { id: "rm-6", code: "RM-FLOUR", name: "Refined Wheat Flour (Maida 00)", category: "Flour & Bakery", unit: "kg", unitCost: 38, quantityOnHand: 150.0 },
  { id: "rm-7", code: "RM-YEAST", name: "Active Dry Instant Yeast", category: "Flour & Bakery", unit: "kg", unitCost: 400, quantityOnHand: 4.5 },
  { id: "rm-8", code: "RM-OLIVEOIL", name: "Extra Virgin Olive Oil", category: "Oils", unit: "L", unitCost: 480, quantityOnHand: 22.0 },
  { id: "rm-9", code: "RM-SALT", name: "Iodized Salt Pure Grade", category: "Groceries", unit: "kg", unitCost: 25, quantityOnHand: 80.0 },
  { id: "rm-10", code: "RM-CHICKEN", name: "Fresh Chicken Breast (Boneless)", category: "Meat & Poultry", unit: "kg", unitCost: 240, quantityOnHand: 38.0 },
  { id: "rm-11", code: "RM-YOGURT", name: "Natural Hung Curd", category: "Dairy", unit: "kg", unitCost: 90, quantityOnHand: 25.0 },
  { id: "rm-12", code: "RM-MUSTARD", name: "Cold-Pressed Mustard Oil", category: "Oils", unit: "L", unitCost: 150, quantityOnHand: 15.0 },
  { id: "rm-13", code: "RM-TMASALA", name: "Tandoori Special Rub", category: "Spices", unit: "kg", unitCost: 350, quantityOnHand: 8.0 },
  { id: "rm-14", code: "RM-ONION", name: "Nashik Red Onions", category: "Vegetables", unit: "kg", unitCost: 35, quantityOnHand: 140.0 },
  { id: "rm-15", code: "RM-REFOIL", name: "Refined Sunflower Oil", category: "Oils", unit: "L", unitCost: 130, quantityOnHand: 60.0 },
  { id: "rm-16", code: "RM-GGPASTE", name: "Fresh Ginger Garlic Paste", category: "Prepared Pastes", unit: "kg", unitCost: 180, quantityOnHand: 14.0 },
];

const DEFAULT_RECIPES: ProductionRecipeDto[] = [
  {
    id: "PRD-REC-01",
    code: "PRD-REC-01",
    name: "Makhani Gravy Base",
    category: "Gravies & Sauces",
    outputUnit: "Liter (L)",
    expectedYield: 25,
    standardCost: 1850,
    costPerUnit: 74.0,
    shelfLifeDays: 3,
    instructions: "Slow simmer tomatoes with butter and cashew paste. Blend fine, strain, finish with fresh cream and kasoori methi.",
    rawMaterialsCount: 5,
    ingredientsSummary: "Fresh Tomatoes (15kg), Dairy Butter (3kg), Fresh Cream (2L), Cashew Nuts (1kg), Spices (500g)",
    isActive: true,
    ingredients: [
      { id: "ing-1", stockItemId: "rm-1", stockItemCode: "RM-TOMATO", stockItemName: "Fresh Tomatoes (Grade A)", quantity: 15, unit: "kg", unitCost: 40, lineCost: 600 },
      { id: "ing-2", stockItemId: "rm-2", stockItemCode: "RM-BUTTER", stockItemName: "Dairy Butter Block", quantity: 3, unit: "kg", unitCost: 280, lineCost: 840 },
      { id: "ing-3", stockItemId: "rm-3", stockItemCode: "RM-CREAM", stockItemName: "Fresh Cooking Cream 25%", quantity: 2, unit: "L", unitCost: 160, lineCost: 320 },
      { id: "ing-4", stockItemId: "rm-4", stockItemCode: "RM-CASHEW", stockItemName: "Whole Cashew Nuts (W320)", quantity: 1, unit: "kg", unitCost: 80, lineCost: 80 },
      { id: "ing-5", stockItemId: "rm-5", stockItemCode: "RM-SPICES", stockItemName: "Makhani Garam Masala Blend", quantity: 0.5, unit: "kg", unitCost: 20, lineCost: 10 },
    ],
  },
  {
    id: "PRD-REC-02",
    code: "PRD-REC-02",
    name: "Pizza Dough Balls (250g)",
    category: "Bakery & Dough",
    outputUnit: "Pieces (pcs)",
    expectedYield: 40,
    standardCost: 520,
    costPerUnit: 13.0,
    shelfLifeDays: 2,
    instructions: "Hydrate active dry yeast in lukewarm water. Knead with high-protein 00 flour and olive oil. Proof at 4°C for 24h.",
    rawMaterialsCount: 4,
    ingredientsSummary: "Refined Wheat Flour (10kg), Active Dry Yeast (100g), Olive Oil (500ml), Salt (150g)",
    isActive: true,
    ingredients: [
      { id: "ing-6", stockItemId: "rm-6", stockItemCode: "RM-FLOUR", stockItemName: "Refined Wheat Flour (Maida 00)", quantity: 10, unit: "kg", unitCost: 38, lineCost: 380 },
      { id: "ing-7", stockItemId: "rm-7", stockItemCode: "RM-YEAST", stockItemName: "Active Dry Instant Yeast", quantity: 0.1, unit: "kg", unitCost: 400, lineCost: 40 },
      { id: "ing-8", stockItemId: "rm-8", stockItemCode: "RM-OLIVEOIL", stockItemName: "Extra Virgin Olive Oil", quantity: 0.5, unit: "L", unitCost: 160, lineCost: 80 },
      { id: "ing-9", stockItemId: "rm-9", stockItemCode: "RM-SALT", stockItemName: "Iodized Salt Pure Grade", quantity: 0.15, unit: "kg", unitCost: 133, lineCost: 20 },
    ],
  },
  {
    id: "PRD-REC-03",
    code: "PRD-REC-03",
    name: "Tandoori Chicken Marination",
    category: "Meat Marinations",
    outputUnit: "Kilogram (kg)",
    expectedYield: 15,
    standardCost: 3100,
    costPerUnit: 206.67,
    shelfLifeDays: 4,
    instructions: "First marination with lemon and salt for 30m. Second marination with hung curd, kashmiri chilli paste, mustard oil and garam masala.",
    rawMaterialsCount: 4,
    ingredientsSummary: "Fresh Chicken (15kg), Hung Curd (2.5kg), Mustard Oil (500ml), Tandoori Rub (400g)",
    isActive: true,
    ingredients: [
      { id: "ing-10", stockItemId: "rm-10", stockItemCode: "RM-CHICKEN", stockItemName: "Fresh Chicken Breast (Boneless)", quantity: 15, unit: "kg", unitCost: 170, lineCost: 2550 },
      { id: "ing-11", stockItemId: "rm-11", stockItemCode: "RM-YOGURT", stockItemName: "Natural Hung Curd", quantity: 2.5, unit: "kg", unitCost: 90, lineCost: 225 },
      { id: "ing-12", stockItemId: "rm-12", stockItemCode: "RM-MUSTARD", stockItemName: "Cold-Pressed Mustard Oil", quantity: 0.5, unit: "L", unitCost: 150, lineCost: 75 },
      { id: "ing-13", stockItemId: "rm-13", stockItemCode: "RM-TMASALA", stockItemName: "Tandoori Special Rub", quantity: 0.4, unit: "kg", unitCost: 625, lineCost: 250 },
    ],
  },
  {
    id: "PRD-REC-04",
    code: "PRD-REC-04",
    name: "Brown Onion Gravy Base (Bhuna)",
    category: "Gravies & Sauces",
    outputUnit: "Liter (L)",
    expectedYield: 20,
    standardCost: 1420,
    costPerUnit: 71.0,
    shelfLifeDays: 3,
    instructions: "Caramelize sliced red onions slowly until golden brown. Cook down with ginger-garlic paste and coriander-cumin powder.",
    rawMaterialsCount: 4,
    ingredientsSummary: "Nashik Red Onions (16kg), Sunflower Oil (3L), Ginger Garlic Paste (1.5kg), Salt & Spices (300g)",
    isActive: true,
    ingredients: [
      { id: "ing-14", stockItemId: "rm-14", stockItemCode: "RM-ONION", stockItemName: "Nashik Red Onions", quantity: 16, unit: "kg", unitCost: 35, lineCost: 560 },
      { id: "ing-15", stockItemId: "rm-15", stockItemCode: "RM-REFOIL", stockItemName: "Refined Sunflower Oil", quantity: 3, unit: "L", unitCost: 130, lineCost: 390 },
      { id: "ing-16", stockItemId: "rm-16", stockItemCode: "RM-GGPASTE", stockItemName: "Fresh Ginger Garlic Paste", quantity: 1.5, unit: "kg", unitCost: 180, lineCost: 270 },
      { id: "ing-17", stockItemId: "rm-17", stockItemCode: "RM-SALT", stockItemName: "Iodized Salt Pure Grade", quantity: 0.3, unit: "kg", unitCost: 666, lineCost: 200 },
    ],
  },
];

const DEFAULT_BATCHES: ProductionBatchDto[] = [
  {
    id: "EXEC-881",
    batchNumber: "PRD-20261017-001",
    recipeId: "PRD-REC-01",
    recipeName: "Makhani Gravy Base",
    recipeCode: "PRD-REC-01",
    category: "Gravies & Sauces",
    preparationDate: "17 Oct 2026",
    rawDate: "2026-10-17",
    yieldQuantity: 25.0,
    yieldUnit: "Liter (L)",
    batchQty: "25 L",
    operator: "Chef Vikram",
    status: "COMPLETED",
    totalCost: 1850.0,
    unitCost: 74.0,
    notes: "Batch passed color and aroma test. Smooth velvety texture.",
    expiryDate: "20 Oct 2026",
    isStockDeducted: true,
    rawMaterialsDeducted: "Fresh Tomatoes (15kg), Dairy Butter (3kg), Fresh Cream (2L)",
    ingredients: [
      { id: "b-ing-1", stockItemId: "rm-1", stockItemCode: "RM-TOMATO", stockItemName: "Fresh Tomatoes (Grade A)", standardQuantity: 15, actualQuantity: 15, unit: "kg", unitCost: 40, totalCost: 600 },
      { id: "b-ing-2", stockItemId: "rm-2", stockItemCode: "RM-BUTTER", stockItemName: "Dairy Butter Block", standardQuantity: 3, actualQuantity: 3, unit: "kg", unitCost: 280, totalCost: 840 },
      { id: "b-ing-3", stockItemId: "rm-3", stockItemCode: "RM-CREAM", stockItemName: "Fresh Cooking Cream 25%", standardQuantity: 2, actualQuantity: 2, unit: "L", unitCost: 160, totalCost: 320 },
      { id: "b-ing-4", stockItemId: "rm-4", stockItemCode: "RM-CASHEW", stockItemName: "Whole Cashew Nuts (W320)", standardQuantity: 1, actualQuantity: 1, unit: "kg", unitCost: 80, totalCost: 80 },
      { id: "b-ing-5", stockItemId: "rm-5", stockItemCode: "RM-SPICES", stockItemName: "Makhani Garam Masala Blend", standardQuantity: 0.5, actualQuantity: 0.5, unit: "kg", unitCost: 20, totalCost: 10 },
    ],
  },
  {
    id: "EXEC-880",
    batchNumber: "PRD-20261017-002",
    recipeId: "PRD-REC-02",
    recipeName: "Pizza Dough Balls (250g)",
    recipeCode: "PRD-REC-02",
    category: "Bakery & Dough",
    preparationDate: "17 Oct 2026",
    rawDate: "2026-10-17",
    yieldQuantity: 40.0,
    yieldUnit: "Pieces (pcs)",
    batchQty: "40 pcs",
    operator: "Sunita M.",
    status: "IN_PROGRESS",
    totalCost: 520.0,
    unitCost: 13.0,
    notes: "Proofing in climate-controlled walk-in cooler. Ready by 4 PM.",
    expiryDate: "19 Oct 2026",
    isStockDeducted: false,
    rawMaterialsDeducted: "Refined Wheat Flour (10kg), Active Dry Yeast (100g)",
    ingredients: [
      { id: "b-ing-6", stockItemId: "rm-6", stockItemCode: "RM-FLOUR", stockItemName: "Refined Wheat Flour (Maida 00)", standardQuantity: 10, actualQuantity: 10, unit: "kg", unitCost: 38, totalCost: 380 },
      { id: "b-ing-7", stockItemId: "rm-7", stockItemCode: "RM-YEAST", stockItemName: "Active Dry Instant Yeast", standardQuantity: 0.1, actualQuantity: 0.1, unit: "kg", unitCost: 400, totalCost: 40 },
      { id: "b-ing-8", stockItemId: "rm-8", stockItemCode: "RM-OLIVEOIL", stockItemName: "Extra Virgin Olive Oil", standardQuantity: 0.5, actualQuantity: 0.5, unit: "L", unitCost: 160, totalCost: 80 },
      { id: "b-ing-9", stockItemId: "rm-9", stockItemCode: "RM-SALT", stockItemName: "Iodized Salt Pure Grade", standardQuantity: 0.15, actualQuantity: 0.15, unit: "kg", unitCost: 133, totalCost: 20 },
    ],
  },
  {
    id: "EXEC-879",
    batchNumber: "PRD-20261016-003",
    recipeId: "PRD-REC-03",
    recipeName: "Tandoori Chicken Marination",
    recipeCode: "PRD-REC-03",
    category: "Meat Marinations",
    preparationDate: "16 Oct 2026",
    rawDate: "2026-10-16",
    yieldQuantity: 15.0,
    yieldUnit: "Kilogram (kg)",
    batchQty: "15 kg",
    operator: "Chef Vikram",
    status: "COMPLETED",
    totalCost: 3100.0,
    unitCost: 206.67,
    notes: "Deep marinade penetration. Ready for tandoor service.",
    expiryDate: "20 Oct 2026",
    isStockDeducted: true,
    rawMaterialsDeducted: "Fresh Chicken (15kg), Hung Curd (2.5kg), Mustard Oil (500ml)",
    ingredients: [
      { id: "b-ing-10", stockItemId: "rm-10", stockItemCode: "RM-CHICKEN", stockItemName: "Fresh Chicken Breast (Boneless)", standardQuantity: 15, actualQuantity: 15, unit: "kg", unitCost: 170, totalCost: 2550 },
      { id: "b-ing-11", stockItemId: "rm-11", stockItemCode: "RM-YOGURT", stockItemName: "Natural Hung Curd", standardQuantity: 2.5, actualQuantity: 2.5, unit: "kg", unitCost: 90, totalCost: 225 },
      { id: "b-ing-12", stockItemId: "rm-12", stockItemCode: "RM-MUSTARD", stockItemName: "Cold-Pressed Mustard Oil", standardQuantity: 0.5, actualQuantity: 0.5, unit: "L", unitCost: 150, totalCost: 75 },
      { id: "b-ing-13", stockItemId: "rm-13", stockItemCode: "RM-TMASALA", stockItemName: "Tandoori Special Rub", standardQuantity: 0.4, actualQuantity: 0.4, unit: "kg", unitCost: 625, totalCost: 250 },
    ],
  },
];

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
