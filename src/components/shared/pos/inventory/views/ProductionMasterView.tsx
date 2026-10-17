import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  ChevronDown,
  FileText,
  Filter,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
  Clock,
  ChefHat,
  UtensilsCrossed,
  DollarSign,
  Trash2,
  Edit2,
  Eye,
  Sparkles,
  Download,
  AlertCircle,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel } from "@/utils/exportUtils";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import {
  DataTableHeader,
  DataTableFooter,
  ChooseColumnsMenu,
  type DataTableColumn,
} from "@/components/common/DataTableHeader";
import { useNavigate } from "@tanstack/react-router";
import {
  posProductionService,
  type ProductionRecipeDto,
  type AvailableRawMaterial,
} from "@/services/posProductionService";

export function ProductionMasterView() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<ProductionRecipeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Table sorting, column filtering, column visibility & pagination
  const [sortConfig, setSortConfig] = useState<{ colId: string; direction: "asc" | "desc" } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    code: true,
    name: true,
    category: true,
    expectedYield: true,
    ingredientsSummary: true,
    standardCost: true,
    costPerUnit: true,
    shelfLifeDays: true,
    actions: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<ProductionRecipeDto | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<ProductionRecipeDto | null>(null);

  // Available raw materials for ingredient picker
  const [rawMaterialsList, setRawMaterialsList] = useState<AvailableRawMaterial[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "Gravies & Sauces",
    outputUnit: "Liter (L)",
    expectedYield: "25",
    shelfLifeDays: "3",
    instructions: "",
    ingredients: [
      { stockItemId: "rm-1", stockItemName: "Fresh Tomatoes (Grade A)", quantity: "15", unit: "kg", unitCost: "40" },
      { stockItemId: "rm-2", stockItemName: "Dairy Butter Block", quantity: "3", unit: "kg", unitCost: "280" },
    ],
  });

  const categories = [
    "All",
    "Gravies & Sauces",
    "Bakery & Dough",
    "Meat Marinations",
    "Dessert Bases",
    "Beverage Bases",
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await posProductionService.fetchRecipes();
      setRecipes(data);
      setRawMaterialsList(posProductionService.getAvailableRawMaterials());
    } catch (err) {
      toast.error("Failed to load production recipes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const recipeColumns = useMemo<DataTableColumn<ProductionRecipeDto>[]>(
    () => [
      {
        id: "code",
        label: "Recipe Code",
        sortable: true,
        filterable: true,
        defaultWidth: 150,
        getValue: (r) => r.code,
      },
      {
        id: "name",
        label: "Preparation Item",
        sortable: true,
        filterable: true,
        defaultWidth: 220,
        getValue: (r) => r.name,
      },
      {
        id: "category",
        label: "Category",
        sortable: true,
        filterable: true,
        defaultWidth: 160,
        getValue: (r) => r.category,
      },
      {
        id: "expectedYield",
        label: "Expected Batch Yield",
        sortable: true,
        align: "right",
        defaultWidth: 160,
        getValue: (r) => `${r.expectedYield} ${r.outputUnit}`,
        getSortValue: (r) => r.expectedYield,
      },
      {
        id: "ingredientsSummary",
        label: "Key Raw Materials (BOM)",
        sortable: false,
        filterable: true,
        defaultWidth: 260,
        getValue: (r) => r.ingredientsSummary,
      },
      {
        id: "standardCost",
        label: "Standard Cost (₹)",
        sortable: true,
        align: "right",
        defaultWidth: 140,
        getValue: (r) => `₹ ${r.standardCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        getSortValue: (r) => r.standardCost,
      },
      {
        id: "costPerUnit",
        label: "Cost / Unit (₹)",
        sortable: true,
        align: "right",
        defaultWidth: 130,
        getValue: (r) => `₹ ${r.costPerUnit.toFixed(2)}`,
        getSortValue: (r) => r.costPerUnit,
      },
      {
        id: "shelfLifeDays",
        label: "Shelf Life",
        sortable: true,
        align: "center",
        defaultWidth: 120,
        getValue: (r) => `${r.shelfLifeDays} days`,
        getSortValue: (r) => r.shelfLifeDays,
      },
      {
        id: "actions",
        label: "Actions",
        align: "right",
        defaultWidth: 160,
      },
    ],
    [],
  );

  const filteredRecords = useMemo(() => {
    return recipes.filter((r) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = (
          r.name.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.ingredientsSummary.toLowerCase().includes(q)
        );
        if (!matches) return false;
      }

      // Filter by column popover filters (e.g. Category)
      for (const [colId, allowedValues] of Object.entries(columnFilters)) {
        if (!allowedValues) continue;
        const col = recipeColumns.find((c) => c.id === colId);
        let cellVal = "";
        if (col?.getValue) {
          cellVal = col.getValue(r);
        } else if ((r as any)[colId] !== undefined && (r as any)[colId] !== null) {
          cellVal = String((r as any)[colId]);
        }
        if (!allowedValues.includes(cellVal.trim())) {
          return false;
        }
      }

      return true;
    });
  }, [recipes, searchQuery, columnFilters, recipeColumns]);

  const activeVisibleColumnCount = useMemo(() => {
    return recipeColumns.filter((c) => visibleColumns[c.id || ""] !== false).length;
  }, [recipeColumns, visibleColumns]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, columnFilters]);

  const sortedRecords = useMemo(() => {
    if (!sortConfig) return filteredRecords;
    return [...filteredRecords].sort((a, b) => {
      let aVal: any = a[sortConfig.colId as keyof ProductionRecipeDto];
      let bVal: any = b[sortConfig.colId as keyof ProductionRecipeDto];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal || "").toString().toLowerCase();
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = recipes.length;
    const gravies = recipes.filter((r) => r.category.includes("Gravies")).length;
    const bakery = recipes.filter((r) => r.category.includes("Bakery")).length;
    const avgCost = total > 0 ? Math.round(recipes.reduce((acc, r) => acc + r.standardCost, 0) / total) : 0;
    return { total, gravies, bakery, avgCost };
  }, [recipes]);

  const handleOpenCreate = () => {
    setEditingRecipe(null);
    setFormData({
      name: "",
      code: `PRD-REC-0${recipes.length + 1}`,
      category: "Gravies & Sauces",
      outputUnit: "Liter (L)",
      expectedYield: "25",
      shelfLifeDays: "3",
      instructions: "",
      ingredients: [
        { stockItemId: "rm-1", stockItemName: "Fresh Tomatoes (Grade A)", quantity: "15", unit: "kg", unitCost: "40" },
        { stockItemId: "rm-2", stockItemName: "Dairy Butter Block", quantity: "3", unit: "kg", unitCost: "280" },
      ],
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (recipe: ProductionRecipeDto) => {
    setEditingRecipe(recipe);
    setFormData({
      name: recipe.name,
      code: recipe.code,
      category: recipe.category,
      outputUnit: recipe.outputUnit,
      expectedYield: String(recipe.expectedYield),
      shelfLifeDays: String(recipe.shelfLifeDays || 3),
      instructions: recipe.instructions || "",
      ingredients: recipe.ingredients.map((ing) => ({
        stockItemId: ing.stockItemId,
        stockItemName: ing.stockItemName,
        quantity: String(ing.quantity),
        unit: ing.unit,
        unitCost: String(ing.unitCost),
      })),
    });
    setIsCreateOpen(true);
  };

  const handleAddIngredientRow = () => {
    const firstRm = rawMaterialsList[0] || {
      id: `rm-${Date.now()}`,
      name: "Raw Material",
      unit: "kg",
      unitCost: 50,
    };
    setFormData((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          stockItemId: firstRm.id,
          stockItemName: firstRm.name,
          quantity: "1",
          unit: firstRm.unit,
          unitCost: String(firstRm.unitCost),
        },
      ],
    }));
  };

  const handleRemoveIngredientRow = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx),
    }));
  };

  const handleIngredientChange = (idx: number, field: string, value: string) => {
    setFormData((prev) => {
      const copy = [...prev.ingredients];
      if (field === "stockItemId") {
        const found = rawMaterialsList.find((r) => r.id === value);
        copy[idx] = {
          ...copy[idx],
          stockItemId: value,
          stockItemName: found ? found.name : copy[idx].stockItemName,
          unit: found ? found.unit : copy[idx].unit,
          unitCost: found ? String(found.unitCost) : copy[idx].unitCost,
        };
      } else {
        copy[idx] = { ...copy[idx], [field]: value };
      }
      return { ...prev, ingredients: copy };
    });
  };

  // Live total calculation for the modal
  const formCalculations = useMemo(() => {
    let total = 0;
    formData.ingredients.forEach((ing) => {
      const q = parseFloat(ing.quantity) || 0;
      const c = parseFloat(ing.unitCost) || 0;
      total += q * c;
    });
    const yieldQty = parseFloat(formData.expectedYield) || 1;
    const costPerUnit = yieldQty > 0 ? total / yieldQty : 0;
    return { total: Math.round(total * 100) / 100, costPerUnit: Math.round(costPerUnit * 100) / 100 };
  }, [formData.ingredients, formData.expectedYield]);

  const handleSubmitRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter a recipe name.");
      return;
    }
    const yieldNum = parseFloat(formData.expectedYield);
    if (!yieldNum || yieldNum <= 0) {
      toast.error("Please provide a valid expected yield.");
      return;
    }
    if (formData.ingredients.length === 0) {
      toast.error("Please add at least one ingredient to the BOM.");
      return;
    }

    try {
      const payload = {
        id: editingRecipe?.id,
        code: formData.code.trim() || undefined,
        name: formData.name.trim(),
        category: formData.category,
        outputUnit: formData.outputUnit,
        expectedYield: yieldNum,
        shelfLifeDays: parseInt(formData.shelfLifeDays, 10) || 3,
        instructions: formData.instructions.trim(),
        ingredients: formData.ingredients.map((ing) => ({
          stockItemId: ing.stockItemId,
          stockItemName: ing.stockItemName,
          quantity: parseFloat(ing.quantity) || 0,
          unit: ing.unit,
          unitCost: parseFloat(ing.unitCost) || 0,
        })),
      };

      const saved = await posProductionService.saveRecipe(payload);
      if (editingRecipe) {
        setRecipes((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
        toast.success(`Recipe '${saved.name}' updated successfully.`);
      } else {
        setRecipes((prev) => [saved, ...prev]);
        toast.success(`Recipe '${saved.name}' created successfully.`);
      }
      setIsCreateOpen(false);
    } catch {
      toast.error("Failed to save recipe");
    }
  };

  const handleDeleteRecipe = async (recipe: ProductionRecipeDto) => {
    if (!window.confirm(`Are you sure you want to delete recipe '${recipe.name}'?`)) return;
    try {
      await posProductionService.deleteRecipe(recipe.id);
      setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
      toast.success(`Recipe '${recipe.name}' removed.`);
    } catch {
      toast.error("Failed to delete recipe.");
    }
  };

  const handleExportExcel = () => {
    const headers = ["Recipe ID", "Name", "Category", "Yield", "Output Unit", "Cost (₹)", "Cost/Unit (₹)", "Shelf Life", "Ingredients"];
    const rows = filteredRecords.map((r) => [
      r.code,
      r.name,
      r.category,
      r.expectedYield,
      r.outputUnit,
      r.standardCost,
      r.costPerUnit,
      `${r.shelfLifeDays} Days`,
      r.ingredientsSummary,
    ]);

    exportToExcel({
      filename: `Production_Recipes_${new Date().toISOString().slice(0, 10)}`,
      title: "Preparation Setup — Standard Recipe Formulas (BOM)",
      subtitle: `Total Recipes: ${filteredRecords.length}`,
      columns: headers,
      rows,
    });
    toast.success("Recipes exported to Excel (.xlsx)");
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & Primary Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Preparation Setup</h2>
            <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700">
              BOM Recipes
            </span>
          </div>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Define standard recipes and raw material formulas for batch kitchen preparations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <ExportToExcelButton
            onClick={handleExportExcel}
            className="h-9 px-4 rounded-xl text-[12.5px]"
          />

          <button
            type="button"
            onClick={() => navigate({ to: "/pos/inventory/production/execution" })}
            className="flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/70 px-3.5 py-2 text-[12.5px] font-semibold text-teal-800 shadow-2xs hover:bg-teal-100/70 transition cursor-pointer"
          >
            <ChefHat className="h-4 w-4 text-teal-700" />
            Prepare Items
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm hover:bg-teal-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Recipe
          </button>
        </div>
      </div>

      {/* 2. Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500">Total Setup Recipes</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.total}</span>
            <span className="text-[11.5px] text-teal-600 font-medium">Standard BOMs</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500">Base Gravies & Sauces</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <UtensilsCrossed className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.gravies}</span>
            <span className="text-[11.5px] text-amber-600 font-medium">Curry & Gravy Bases</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500">Bakery & Doughs</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.bakery}</span>
            <span className="text-[11.5px] text-blue-600 font-medium">Dough & Breads</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500">Avg Standard Cost</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">₹ {metrics.avgCost.toLocaleString()}</span>
            <span className="text-[11.5px] text-slate-500 font-normal">Per Full Batch</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Choose Columns Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search recipes by name, code, or ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2 text-[13px] text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ChooseColumnsMenu
              columns={recipeColumns}
              visibleColumns={visibleColumns}
              onVisibleColumnsChange={setVisibleColumns}
              className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12.5px] font-medium text-slate-700 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* 4. Recipes Table with DataTableHeader & DataTableFooter */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <DataTableHeader
              columns={recipeColumns}
              data={sortedRecords}
              visibleColumns={visibleColumns}
              onVisibleColumnsChange={setVisibleColumns}
              sortConfig={sortConfig}
              onSortChange={setSortConfig}
              columnFilters={columnFilters}
              onColumnFilterChange={setColumnFilters}
              themeVariant="primary"
            />
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={activeVisibleColumnCount} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-slate-400">
                      <Layers className="h-10 w-10 text-slate-300 mb-2 stroke-[1.5]" />
                      <p className="text-[14px] font-semibold text-slate-700">No preparation recipes found</p>
                      <p className="text-[12px] text-slate-400 mt-0.5">
                        {searchQuery || Object.keys(columnFilters).length > 0
                          ? "Try refining your search terms or column filters."
                          : "Create your first food preparation recipe formula."}
                      </p>
                      {!searchQuery && Object.keys(columnFilters).length === 0 && (
                        <button
                          type="button"
                          onClick={handleOpenCreate}
                          className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-1.5 text-[12px] font-medium text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          New Recipe
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    {visibleColumns.code !== false && (
                      <td className="px-4 py-3.5 font-mono text-[12px] font-bold text-teal-700 whitespace-nowrap">
                        {r.code}
                      </td>
                    )}
                    {visibleColumns.name !== false && (
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        {r.name}
                      </td>
                    )}
                    {visibleColumns.category !== false && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-0.5 text-[11.5px] font-medium text-slate-700">
                          {r.category}
                        </span>
                      </td>
                    )}
                    {visibleColumns.expectedYield !== false && (
                      <td className="px-4 py-3.5 text-right font-medium text-slate-800 whitespace-nowrap">
                        {r.expectedYield} {r.outputUnit}
                      </td>
                    )}
                    {visibleColumns.ingredientsSummary !== false && (
                      <td className="px-4 py-3.5 text-slate-600 text-[12px] max-w-xs truncate" title={r.ingredientsSummary}>
                        {r.ingredientsSummary}
                      </td>
                    )}
                    {visibleColumns.standardCost !== false && (
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                        ₹ {r.standardCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    )}
                    {visibleColumns.costPerUnit !== false && (
                      <td className="px-4 py-3.5 text-right font-mono text-[12.5px] text-slate-600 whitespace-nowrap">
                        ₹ {r.costPerUnit.toFixed(2)}
                      </td>
                    )}
                    {visibleColumns.shelfLifeDays !== false && (
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          <Clock className="h-3 w-3" />
                          {r.shelfLifeDays} days
                        </span>
                      </td>
                    )}
                    {visibleColumns.actions !== false && (
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingRecipe(r)}
                            title="View Recipe Details"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(r)}
                            title="Edit Recipe"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate({ to: "/pos/inventory/production/execution" })}
                            title="Prepare New Batch with this Recipe"
                            className="flex items-center gap-1 rounded-lg bg-teal-50 px-2 py-1 text-[11.5px] font-bold text-teal-700 hover:bg-teal-100 transition cursor-pointer"
                          >
                            <ChefHat className="h-3.5 w-3.5" />
                            Prepare
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRecipe(r)}
                            title="Delete Recipe"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Pagination */}
        <DataTableFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={sortedRecords.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          itemName="recipes"
        />
      </div>

      {/* 5. Create / Edit Recipe Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900">
                  {editingRecipe ? "Edit Preparation Recipe" : "Create New Preparation Recipe"}
                </h3>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Define the output formula and bill of materials (raw materials) for this item.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitRecipe} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Section 1: Basic Recipe Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[12px] font-semibold text-slate-700">
                    Recipe / Prepared Item Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Makhani Gravy Base, Pizza Dough Balls"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[13px] text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-700">Recipe Code</label>
                  <input
                    type="text"
                    placeholder="PRD-REC-01"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[13px] font-mono text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
                  >
                    {categories.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-700">
                    Expected Yield <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      required
                      min="0.1"
                      placeholder="25"
                      value={formData.expectedYield}
                      onChange={(e) => setFormData({ ...formData, expectedYield: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
                    />
                    <select
                      value={formData.outputUnit}
                      onChange={(e) => setFormData({ ...formData, outputUnit: e.target.value })}
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[12px] text-slate-800 focus:border-teal-500 focus:outline-none"
                    >
                      <option value="Liter (L)">Liter (L)</option>
                      <option value="Kilogram (kg)">Kilogram (kg)</option>
                      <option value="Pieces (pcs)">Pieces (pcs)</option>
                      <option value="Portions">Portions</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-700">Shelf Life (Days)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="3"
                    value={formData.shelfLifeDays}
                    onChange={(e) => setFormData({ ...formData, shelfLifeDays: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Section 2: Bill of Materials (BOM) Dynamic Ingredient List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[13.5px] font-bold text-slate-900">
                      Raw Materials / Ingredients Required (BOM)
                    </h4>
                    <p className="text-[11.5px] text-slate-500">
                      Specify the ingredients consumed for producing {formData.expectedYield || "1"} {formData.outputUnit}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 text-teal-600" />
                    Add Ingredient
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-[12.5px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11.5px]">
                      <tr>
                        <th className="px-3.5 py-2.5">Raw Material (Stock Item)</th>
                        <th className="px-3 py-2.5 w-28 text-right">Quantity</th>
                        <th className="px-3 py-2.5 w-24">Unit</th>
                        <th className="px-3 py-2.5 w-28 text-right">Unit Cost (₹)</th>
                        <th className="px-3 py-2.5 w-28 text-right">Subtotal</th>
                        <th className="px-2 py-2.5 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {formData.ingredients.map((ing, idx) => {
                        const lineTotal = (parseFloat(ing.quantity) || 0) * (parseFloat(ing.unitCost) || 0);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2">
                              <select
                                value={ing.stockItemId}
                                onChange={(e) => handleIngredientChange(idx, "stockItemId", e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-none"
                              >
                                {rawMaterialsList.map((rm) => (
                                  <option key={rm.id} value={rm.id}>
                                    {rm.name} ({rm.unit}) — ₹{rm.unitCost}/{rm.unit}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                step="any"
                                min="0.001"
                                value={ing.quantity}
                                onChange={(e) => handleIngredientChange(idx, "quantity", e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-right text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={ing.unit}
                                onChange={(e) => handleIngredientChange(idx, "unit", e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={ing.unitCost}
                                onChange={(e) => handleIngredientChange(idx, "unitCost", e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-right text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-2 text-right font-mono font-medium text-slate-900">
                              ₹ {lineTotal.toFixed(2)}
                            </td>
                            <td className="p-2 text-center">
                              {formData.ingredients.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveIngredientRow(idx)}
                                  className="text-slate-400 hover:text-rose-600 transition p-1"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Real-time Calculation Summary Card */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-teal-200 bg-teal-50/60 p-3.5">
                  <div className="space-y-0.5">
                    <span className="text-[12px] font-semibold text-teal-900">
                      Calculated Recipe Costing
                    </span>
                    <p className="text-[11.5px] text-teal-700">
                      Standard batch size: {formData.expectedYield || 1} {formData.outputUnit}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-[11px] text-teal-800 uppercase tracking-wide">Total Batch Cost</span>
                      <p className="text-[17px] font-bold font-mono text-teal-950">
                        ₹ {formCalculations.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="h-8 w-px bg-teal-200" />
                    <div>
                      <span className="text-[11px] text-teal-800 uppercase tracking-wide">Unit Prepared Cost</span>
                      <p className="text-[17px] font-bold font-mono text-teal-950">
                        ₹ {formCalculations.costPerUnit.toFixed(2)} / {formData.outputUnit.split(" ")[0]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Chef Instructions */}
              <div className="space-y-1 pt-1">
                <label className="text-[12px] font-semibold text-slate-700">Preparation Instructions & Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Cooking time, temperature, seasoning adjustments, quality benchmarks..."
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[13px] text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 px-5 py-2 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
                >
                  {editingRecipe ? "Update Recipe Formula" : "Save Recipe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. View Recipe Details Modal */}
      {viewingRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800 font-bold text-sm">
                  <ChefHat className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900">{viewingRecipe.name}</h3>
                  <p className="text-[12px] font-mono text-teal-700">{viewingRecipe.code} · {viewingRecipe.category}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingRecipe(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Stats overview */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">Batch Yield</span>
                  <p className="text-[15px] font-bold text-slate-900 mt-0.5">
                    {viewingRecipe.expectedYield} {viewingRecipe.outputUnit}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">Batch Standard Cost</span>
                  <p className="text-[15px] font-bold font-mono text-slate-900 mt-0.5">
                    ₹ {viewingRecipe.standardCost.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">Cost / Unit</span>
                  <p className="text-[15px] font-bold font-mono text-teal-700 mt-0.5">
                    ₹ {viewingRecipe.costPerUnit.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Ingredients BOM table */}
              <div className="space-y-2">
                <h4 className="text-[13px] font-bold text-slate-800">Bill of Materials (Raw Materials Consumed)</h4>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-[12.5px]">
                    <thead className="bg-slate-50 text-slate-600 text-[11.5px] font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-2">Ingredient</th>
                        <th className="px-3 py-2 text-right">Quantity</th>
                        <th className="px-3 py-2 text-right">Unit Rate</th>
                        <th className="px-3.5 py-2 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingRecipe.ingredients.map((ing) => (
                        <tr key={ing.id} className="hover:bg-slate-50/50">
                          <td className="px-3.5 py-2 font-medium text-slate-800">{ing.stockItemName}</td>
                          <td className="px-3 py-2 text-right font-medium text-slate-700">{ing.quantity} {ing.unit}</td>
                          <td className="px-3 py-2 text-right text-slate-500">₹ {ing.unitCost}</td>
                          <td className="px-3.5 py-2 text-right font-mono font-semibold text-slate-900">
                            ₹ {ing.lineCost.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {viewingRecipe.instructions && (
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-slate-800">Preparation Instructions</h4>
                  <p className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-[12.5px] text-slate-700 leading-relaxed">
                    {viewingRecipe.instructions}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 bg-slate-50/50">
              <span className="text-[11.5px] text-slate-400">Shelf life: {viewingRecipe.shelfLifeDays} days at standard cold storage</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingRecipe(null)}
                  className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewingRecipe(null);
                    navigate({ to: "/pos/inventory/production/execution" });
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow-2xs hover:bg-teal-700"
                >
                  <ChefHat className="h-3.5 w-3.5" />
                  Prepare Batch Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
