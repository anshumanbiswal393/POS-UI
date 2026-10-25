import { useMemo, useState } from "react";
import {
  useDishRecipes,
  useInventorySettings,
  useSaveDishRecipe,
  useDeleteDishRecipe,
  useSaveInventorySettings,
  useStockItems,
} from "@/hooks/queries/usePosInventory";
import { useOutletContext } from "@/context/PosOutletContext";
import { isBackendOutletId } from "@/utils/outletId";
import type { DishRecipe } from "@/types/posInventory";
import {
  Sparkles,
  Plus,
  ChevronDown,
  FileText,
  Copy,
  Edit2,
  Trash2,
  Files,
  ChevronRight,
} from "lucide-react";
import {
  DataTableHeader,
  DataTableFooter,
  type DataTableColumn,
} from "@/components/common/DataTableHeader";
import { toast } from "sonner";
import {
  CreateRecipeModal,
  type RecipeFormValues,
  type RecipeIngredientInput,
} from "@/components/shared/pos/inventory/modals/CreateRecipeModal";
import { ExploreRecipesModal } from "@/components/shared/pos/inventory/modals/ExploreRecipesModal";

interface RecipeRow {
  id: string;
  name: string;
  category: string;
  menuItem?: string;
  yieldQty?: string;
  yieldUnit?: string;
  prepTimeMinutes?: string;
  notes?: string;
  ingredients?: RecipeIngredientInput[];
}

const DEMO_RECIPES: RecipeRow[] = [];

export function RecipeManagementView() {
  const { activeOutlet } = useOutletContext();
  const isLive = isBackendOutletId(activeOutlet.id);
  const { data: apiRecipes = [] } = useDishRecipes();
  const { data: stockItems = [] } = useStockItems();
  const { data: settings } = useInventorySettings();
  const saveRecipe = useSaveDishRecipe();
  const deleteRecipe = useDeleteDishRecipe();
  const saveSettings = useSaveInventorySettings();
  const [autoConsumption, setAutoConsumption] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState("all");
  const [selectedItem, setSelectedItem] = useState("Select Item");
  const [selectedCategory, setSelectedCategory] = useState("Select Category");
  const [recipeStatus, setRecipeStatus] = useState("Created Recipes");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeRow | null>(null);
  const [createPrefill, setCreatePrefill] = useState<Partial<RecipeFormValues> | null>(null);

  const recipeColumns: DataTableColumn<RecipeRow>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        sortable: true,
        filterable: true,
        defaultWidth: 260,
        getValue: (r) => r.name,
      },
      {
        id: "category",
        label: "Category",
        sortable: true,
        filterable: true,
        defaultWidth: 200,
        getValue: (r) => r.category,
      },
      {
        id: "actions",
        label: "Action",
        sortable: false,
        filterable: false,
        align: "right",
        defaultWidth: 120,
      },
    ],
    [],
  );

  const [localRecipes, setLocalRecipes] = useState<RecipeRow[]>(DEMO_RECIPES);
  const recipes = isLive ? apiRecipes.map(mapRecipe) : localRecipes;
  const autoOn = isLive ? settings?.recipeBasedConsumption === "Yes" : autoConsumption;

  const categoryCards = [
    { id: "all", label: "All categories", count: `${recipes.length} Items` },
    { id: "indian_whisky", label: "Indian Whisky", count: "0 Items" },
    { id: "scotch_whisky", label: "Scotch Whisky", count: "0 Items" },
    { id: "south_indian", label: "South Indian", count: "0 Items" },
    {
      id: "veg_starters",
      label: "Veg Starters",
      count: `${recipes.filter((r) => r.category === "Veg Starters").length} Items`,
    },
  ];

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      if (selectedItem !== "Select Item" && r.name !== selectedItem) return false;
      if (selectedCategory !== "Select Category" && r.category !== selectedCategory) return false;
      if (activeCategoryTab === "veg_starters" && r.category !== "Veg Starters") return false;
      if (
        activeCategoryTab !== "all" &&
        activeCategoryTab !== "veg_starters" &&
        !r.category.toLowerCase().includes(activeCategoryTab.replace(/_/g, " "))
      ) {
        // keep other demo tabs empty unless matching
        if (["indian_whisky", "scotch_whisky", "south_indian"].includes(activeCategoryTab)) {
          return false;
        }
      }
      return true;
    });
  }, [recipes, selectedItem, selectedCategory, activeCategoryTab]);

  const openCreate = () => {
    setEditingRecipe(null);
    setCreatePrefill(null);
    setIsCreateOpen(true);
  };

  const openEdit = (row: RecipeRow) => {
    setEditingRecipe(row);
    setCreatePrefill({
      name: row.name,
      category: row.category,
      menuItem: row.menuItem || row.name,
      yieldQty: row.yieldQty || "1",
      yieldUnit: row.yieldUnit || "portion",
      prepTimeMinutes: row.prepTimeMinutes || "15",
      notes: row.notes || "",
      ingredients: row.ingredients,
    });
    setIsCreateOpen(true);
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
    setEditingRecipe(null);
    setCreatePrefill(null);
  };

  const handleSaveRecipe = (values: RecipeFormValues) => {
    if (isLive) {
      saveRecipe.mutate(
        {
          id: editingRecipe?.id,
          name: values.name,
          category: values.category,
          menuItem: values.menuItem,
          yieldQty: values.yieldQty,
          yieldUnit: values.yieldUnit,
          prepTimeMinutes: values.prepTimeMinutes,
          notes: values.notes,
          ingredients: values.ingredients,
        },
        {
          onSuccess: () => {
            toast.success(`Recipe "${values.name}" ${editingRecipe ? "updated" : "created"}`);
            closeCreate();
          },
          onError: () => toast.error("Could not save recipe"),
        },
      );
      return;
    }
    if (editingRecipe) {
      setLocalRecipes((prev) =>
        prev.map((r) =>
          r.id === editingRecipe.id
            ? {
                ...r,
                name: values.name,
                category: values.category,
                menuItem: values.menuItem,
                yieldQty: values.yieldQty,
                yieldUnit: values.yieldUnit,
                prepTimeMinutes: values.prepTimeMinutes,
                notes: values.notes,
                ingredients: values.ingredients,
              }
            : r,
        ),
      );
      toast.success(`Recipe "${values.name}" updated`);
    } else {
      const exists = recipes.some((r) => r.name.toLowerCase() === values.name.toLowerCase());
      if (exists) {
        toast.error(`Recipe "${values.name}" already exists`);
        return;
      }
      const row: RecipeRow = {
        id: `RCP-${Date.now()}`,
        name: values.name,
        category: values.category,
        menuItem: values.menuItem,
        yieldQty: values.yieldQty,
        yieldUnit: values.yieldUnit,
        prepTimeMinutes: values.prepTimeMinutes,
        notes: values.notes,
        ingredients: values.ingredients,
      };
      setLocalRecipes((prev) => [row, ...prev]);
      toast.success(`Recipe "${values.name}" created`);
    }
    closeCreate();
  };

  const handleAddFromSuggestions = (drafts: RecipeFormValues[]) => {
    let added = 0;
    setLocalRecipes((prev) => {
      const names = new Set(prev.map((r) => r.name.toLowerCase()));
      const next = [...prev];
      for (const d of drafts) {
        if (names.has(d.name.toLowerCase())) continue;
        names.add(d.name.toLowerCase());
        next.unshift({
          id: `RCP-${Date.now()}-${added}`,
          name: d.name,
          category: d.category,
          menuItem: d.menuItem,
          yieldQty: d.yieldQty,
          yieldUnit: d.yieldUnit,
          prepTimeMinutes: d.prepTimeMinutes,
          notes: d.notes,
          ingredients: d.ingredients,
        });
        added += 1;
      }
      return next;
    });
    if (added === 0) {
      toast.info("Selected suggestions are already in your recipe list");
    } else {
      toast.success(`Added ${added} recipe${added === 1 ? "" : "s"} from AI suggestions`);
      setIsExploreOpen(false);
    }
  };

  const handleUseSuggestion = (draft: RecipeFormValues) => {
    setIsExploreOpen(false);
    setEditingRecipe(null);
    setCreatePrefill(draft);
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* 1. AI Suggestion Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-linear-to-r from-blue-50 via-sky-50 to-indigo-50 p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-[13.5px] font-bold text-blue-950">
              Get AI-Powered Recipe Suggestions!
            </h4>
            <p className="text-[12px] text-teal-700/90">
              Based On The Items You've Added To Your Menu, We'll Create Personalized Recipes Just
              For You.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExploreOpen(true)}
          className="rounded-xl border border-teal-300 bg-white px-4 py-2 text-[12.5px] font-bold text-teal-700 shadow-2xs hover:bg-teal-50 transition cursor-pointer"
        >
          Explore Recipes
        </button>
      </div>

      {/* 2. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Recipe Management</h2>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create New
          </button>

          <button
            type="button"
            onClick={() => toast.info("Recipe actions menu")}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            More Actions <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => toast.success("Exporting recipes...")}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-slate-500" />
            Files <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <button
              type="button"
              onClick={() => {
                const next = !autoOn;
                if (isLive) {
                  saveSettings.mutate(
                    { recipeBasedConsumption: next ? "Yes" : "No" },
                    {
                      onSuccess: () =>
                        toast.success(
                          next
                            ? "Auto consumption enabled (raw materials will deduct on settle)"
                            : "Auto consumption disabled",
                        ),
                    },
                  );
                } else {
                  setAutoConsumption(next);
                  toast.success(
                    next
                      ? "Auto consumption enabled (raw materials will deduct on KOT billing)"
                      : "Auto consumption disabled",
                  );
                }
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoOn ? "bg-teal-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  autoOn ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-[12.5px] font-semibold text-slate-700">Auto Consumption</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[150px]">
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-1.5 text-[12.5px] font-medium text-slate-700 focus:border-teal-500 focus:outline-none cursor-pointer"
            >
              <option value="Select Item">Select Item</option>
              {recipes.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative min-w-[150px]">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-1.5 text-[12.5px] font-medium text-slate-700 focus:border-teal-500 focus:outline-none cursor-pointer"
            >
              <option value="Select Category">Select Category</option>
              {[...new Set(recipes.map((r) => r.category))].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative min-w-[160px]">
            <select
              value={recipeStatus}
              onChange={(e) => setRecipeStatus(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-1.5 text-[12.5px] font-medium text-slate-700 focus:border-teal-500 focus:outline-none cursor-pointer"
            >
              <option value="Created Recipes">Created Recipes</option>
              <option value="Missing Recipes">Missing Recipes</option>
              <option value="All Items">All Items</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info("Filter applied")}
              className="rounded-lg border border-teal-500 bg-white px-5 py-1.5 text-[12.5px] font-semibold text-teal-600 hover:bg-teal-50 transition cursor-pointer"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedItem("Select Item");
                setSelectedCategory("Select Category");
                setActiveCategoryTab("all");
                toast.info("Cleared filters");
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* 4. Horizontal Category Filter Cards */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {categoryCards.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveCategoryTab(c.id)}
            className={`flex flex-col items-center justify-center rounded-xl px-5 py-2.5 min-w-[140px] border transition cursor-pointer ${
              activeCategoryTab === c.id
                ? "border-teal-500 bg-white shadow-2xs font-bold text-teal-600"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            <div className="text-[13px] font-semibold">{c.label}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{c.count}</div>
          </button>
        ))}
        <button
          type="button"
          onClick={() => toast.info("More categories")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-700"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* 5. Recipes Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <DataTableHeader
              columns={recipeColumns}
              data={filtered}
              selectable
              themeVariant="primary"
            />
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={recipeColumns.length + 1} className="py-12 text-center text-slate-400">
                    No recipe templates found for the selected category.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" className="rounded border-slate-300 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{item.name}</td>
                    <td className="px-4 py-3 text-slate-600 text-[12.5px]">{item.category}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1 text-slate-400">
                        <button
                          type="button"
                          onClick={() => {
                            const lines =
                              item.ingredients
                                ?.map((i) => `${i.name}: ${i.quantity}${i.unit}`)
                                .join(" · ") || "No ingredients listed";
                            toast.info(`${item.name}`, { description: lines });
                          }}
                          className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                          title="View Ingredients"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                          title="Edit Recipe"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete recipe "${item.name}"?`)) {
                              if (isLive) {
                                deleteRecipe.mutate(item.id, {
                                  onSuccess: () => toast.success(`Deleted "${item.name}"`),
                                });
                              } else {
                                setLocalRecipes((prev) => prev.filter((r) => r.id !== item.id));
                                toast.success(`Deleted "${item.name}"`);
                              }
                            }
                          }}
                          className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-rose-600 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const clone: RecipeRow = {
                              ...item,
                              id: `RCP-${Date.now()}`,
                              name: `${item.name} (Copy)`,
                              ingredients: item.ingredients?.map((ing) => ({
                                ...ing,
                                id: `${ing.id}-c`,
                              })),
                            };
                            setLocalRecipes((prev) => [clone, ...prev]);
                            toast.success(`Recipe for ${item.name} cloned`);
                          }}
                          className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                          title="Duplicate"
                        >
                          <Files className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DataTableFooter
          currentPage={currentPage}
          totalCount={filtered.length}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          onPageChange={setCurrentPage}
          itemName="recipes"
        />
      </div>

      <CreateRecipeModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingRecipe(null);
          setCreatePrefill(null);
        }}
        onSave={handleSaveRecipe}
        initial={createPrefill}
        title={editingRecipe ? `Edit Recipe: ${editingRecipe.name}` : "Create New Recipe"}
        stockItems={stockItems}
      />

      <ExploreRecipesModal
        isOpen={isExploreOpen}
        onClose={() => setIsExploreOpen(false)}
        existingNames={recipes.map((r) => r.name)}
        onUseSuggestion={handleUseSuggestion}
        onAddSelected={handleAddFromSuggestions}
      />
    </div>
  );
}
