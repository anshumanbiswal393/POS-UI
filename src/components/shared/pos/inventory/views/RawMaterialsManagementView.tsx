import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  useDeleteStockItem,
  usePatchStockItem,
  useStockItems,
  useUpsertStockItem,
  useStockCategories,
  useUpsertStockCategory,
} from "@/hooks/queries/usePosInventory";
import {
  Plus,
  Check,
  Trash2,
  FolderTree,
  AlertTriangle,
  Calendar,
  RotateCcw,
  Package,
  Layers,
  X,
  Search,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { ColorActionEdit, ColorActionDelete } from "@/components/common/ColorActionIcons";
import {
  DataTableHeader,
  DataTableFooter,
  type DataTableColumn,
} from "@/components/common/DataTableHeader";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";
import type { StockItem } from "@/types/posInventory";
import { fuzzyFilter } from "@/utils/fuzzySearch";
import { formatDateIndian, compareDates } from "@/utils/dateUtils";
import { StockDeleteConfirmModal } from "../modals/StockDeleteConfirmModal";

const STANDARD_UNITS = [
  "Kg",
  "Gm",
  "Ltr",
  "Ml",
  "Pcs",
  "Box",
  "Pack",
  "Bottle",
  "Tin",
  "Dozen",
  "Portion",
  "Plate",
];

interface RawMaterialRow {
  id: string;
  code: string;
  name: string;
  category: string;
  subCategory: string;
  unit: string;
  availableStock: number;
  alertQuantity: number;
  pricePerUnit: number;
  isReturnable: boolean;
  expiryDate: string | null;
  isFavorite: boolean;
  isActive: boolean;
}

export function RawMaterialsManagementView() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  const { data: stockItems = [] } = useStockItems();
  const { data: categories = [] } = useStockCategories();

  const upsertItem = useUpsertStockItem();
  const patchItem = usePatchStockItem();
  const removeItem = useDeleteStockItem();
  const upsertCategory = useUpsertStockCategory();

  // Form states
  const [editingItem, setEditingItem] = useState<RawMaterialRow | null>(null);
  const [name, setName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [customSubCategory, setCustomSubCategory] = useState("");
  const [isCustomSubCategory, setIsCustomSubCategory] = useState(false);
  const [unit, setUnit] = useState("Kg");
  const [pricePerUnit, setPricePerUnit] = useState<number | string>("");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState<number | string>("");
  const [alertQuantity, setAlertQuantity] = useState<number | string>(5);
  const [isReturnable, setIsReturnable] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");

  // Inline Quick Category Creation states
  const [newCatName, setNewCatName] = useState("");
  const [newCatSubs, setNewCatSubs] = useState<{ name: string; unit: string }[]>([
    { name: "", unit: "Kg" },
  ]);

  const resetForm = () => {
    setEditingItem(null);
    setName("");
    setSelectedCategory("");
    setSelectedSubCategory("");
    setIsCustomSubCategory(false);
    setCustomSubCategory("");
    setUnit("Kg");
    setPricePerUnit("");
    setSku("");
    setQuantity("");
    setAlertQuantity(5);
    setIsReturnable(false);
    setExpiryDate("");
  };

  const handleStartEdit = (row: RawMaterialRow) => {
    setEditingItem(row);
    setName(row.name);
    setSelectedCategory(row.category);

    const cat = categories.find((c) => c.name === row.category);
    const hasSub = cat?.subCategories?.some((s) => s.name === row.subCategory);
    if (row.subCategory && !hasSub) {
      setIsCustomSubCategory(true);
      setCustomSubCategory(row.subCategory);
      setSelectedSubCategory("");
    } else {
      setIsCustomSubCategory(false);
      setCustomSubCategory("");
      setSelectedSubCategory(row.subCategory || "");
    }

    setUnit(row.unit || "Kg");
    setPricePerUnit(row.pricePerUnit !== undefined && row.pricePerUnit !== 0 ? row.pricePerUnit : "");
    setSku(row.code || "");
    setQuantity(row.availableStock !== undefined ? row.availableStock : "");
    setAlertQuantity(row.alertQuantity !== undefined ? row.alertQuantity : 5);
    setIsReturnable(Boolean(row.isReturnable));
    setExpiryDate(row.expiryDate ? row.expiryDate.split("T")[0] : "");
    setIsCreateOpen(true);
  };

  // When subcategory changes, auto-fetch unit from category setup
  const handleSubCategoryChange = (val: string) => {
    if (val === "__custom__") {
      setIsCustomSubCategory(true);
      setSelectedSubCategory("");
      return;
    }
    setIsCustomSubCategory(false);
    setSelectedSubCategory(val);
    const cat = categories.find((c) => c.name === selectedCategory);
    const sub = cat?.subCategories?.find((s) => s.name === val);
    if (sub?.unit) {
      setUnit(sub.unit);
    }
  };

  // Auto-generate suggested SKU when name changes if user hasn't typed custom SKU and not in edit mode
  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingItem && (!sku || sku.startsWith("RAW-"))) {
      const clean = val.replace(/[^A-Za-z0-9]+/g, "-").toUpperCase().slice(0, 16);
      if (clean) {
        setSku(`RAW-${clean}`);
      }
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter material name");
      return;
    }

    if (!selectedCategory.trim()) {
      toast.error("Please choose a category");
      return;
    }

    const finalCategory = selectedCategory.trim() || "General";
    const finalSubCategory = isCustomSubCategory
      ? customSubCategory.trim()
      : selectedSubCategory.trim();

    const finalSku =
      sku.trim() ||
      `RAW-${name.trim().replace(/[^A-Za-z0-9]+/g, "-").toUpperCase().slice(0, 18)}`;

    const parsedPrice = pricePerUnit !== "" ? Number(pricePerUnit) : 0;
    const parsedAlert = alertQuantity !== "" ? Number(alertQuantity) : 5;
    const parsedQty = quantity !== "" ? Math.max(0, Number(quantity)) : 0;

    const payload: Partial<StockItem> & { code?: string; name?: string; rawMaterial?: string } = {
      ...(editingItem ? { id: editingItem.id } : {}),
      code: finalSku,
      sku: finalSku,
      name: name.trim(),
      rawMaterial: name.trim(),
      category: finalCategory,
      subCategory: finalSubCategory,
      unit: unit || "Kg",
      pricePerUnit: parsedPrice,
      unitCost: parsedPrice,
      alertQuantity: parsedAlert,
      reorderLevel: parsedAlert,
      minThreshold: parsedAlert,
      isReturnable,
      expiryDate: expiryDate ? expiryDate : null,
      itemKind: "RAW",
      availableStock: parsedQty,
      quantityOnHand: parsedQty,
      quantity_on_hand: parsedQty,
      parLevel: parsedAlert * 2,
    };

    upsertItem.mutate(payload, {
      onSuccess: () => {
        setIsCreateOpen(false);
        const actionVerb = editingItem ? "updated" : "created";
        toast.success(`Raw material '${name.trim()}' ${actionVerb} successfully.`);

        // Ensure category and subcategory are saved permanently
        const existingCat = allCategoriesList.find(
          (c) => c.name.toLowerCase() === finalCategory.toLowerCase(),
        );
        const existingSubs = existingCat?.subCategories || [];
        const hasSub =
          finalSubCategory &&
          existingSubs.some(
            (s) => s.name.toLowerCase() === finalSubCategory.toLowerCase(),
          );
        if (!existingCat || (finalSubCategory && !hasSub)) {
          const nextSubs = [...existingSubs];
          if (finalSubCategory && !hasSub) {
            nextSubs.push({
              id: `sub-${Date.now()}`,
              name: finalSubCategory,
              unit: unit || "Kg",
            });
          }
          upsertCategory.mutate({
            id: existingCat?.id,
            name: finalCategory,
            subCategories: nextSubs,
          });
        }

        resetForm();
      },
      onError: () =>
        toast.error(
          editingItem ? "Could not update raw material" : "Could not create raw material",
        ),
    });
  };

  const handleQuickAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error("Please enter category name");
      return;
    }
    const catName = newCatName.trim();
    const validSubs = newCatSubs
      .map((s) => ({
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: s.name.trim(),
        unit: s.unit || "Kg",
      }))
      .filter((s) => s.name.length > 0);

    upsertCategory.mutate(
      {
        name: catName,
        subCategories: validSubs,
      },
      {
        onSuccess: () => {
          setSelectedCategory(catName);
          setIsAddCategoryOpen(false);
          setNewCatName("");
          setNewCatSubs([{ name: "", unit: "Kg" }]);
          toast.success(`Category '${catName}' added.`);
        },
        onError: () => toast.error("Could not create category"),
      },
    );
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const toggleFavorite = (id: string) => {
    const row = items.find((it) => it.id === id);
    patchItem.mutate({ id, data: { isFavorite: !row?.isFavorite } });
  };

  const toggleActive = (id: string) => {
    const row = items.find((it) => it.id === id);
    patchItem.mutate({ id, data: { isActive: !row?.isActive } });
  };

  const handleDelete = (id: string) => {
    removeItem.mutate(id, { onSuccess: () => toast.success("Raw material removed") });
  };

  const items: RawMaterialRow[] = stockItems.map((skuItem) => ({
    id: skuItem.id,
    code: skuItem.sku || skuItem.code || skuItem.id,
    name: skuItem.rawMaterial || skuItem.name || "",
    category: skuItem.category || "General",
    subCategory: skuItem.subCategory || "",
    unit: skuItem.unit || "Kg",
    availableStock: skuItem.availableStock ?? 0,
    alertQuantity: skuItem.alertQuantity ?? skuItem.reorderLevel ?? skuItem.minThreshold ?? 5,
    pricePerUnit: skuItem.pricePerUnit ?? skuItem.unitCost ?? 0,
    isReturnable: Boolean(skuItem.isReturnable),
    expiryDate: skuItem.expiryDate || null,
    isFavorite: Boolean(skuItem.isFavorite),
    isActive: skuItem.isActive !== false,
  }));

  const allCategoriesList = (() => {
    const map = new Map<string, { id?: string; name: string; subCategories?: { id?: string; name: string; unit?: string }[] }>();
    for (const c of categories) {
      if (c.name?.trim()) {
        map.set(c.name.trim().toLowerCase(), {
          id: c.id,
          name: c.name.trim(),
          subCategories: c.subCategories ? [...c.subCategories] : [],
        });
      }
    }
    for (const it of items) {
      const rawCat = (it.category || "").trim();
      if (!rawCat) continue;
      const key = rawCat.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          id: `cat-${key.replace(/\s+/g, "-")}`,
          name: rawCat,
          subCategories: [],
        });
      }
      const target = map.get(key)!;
      const rawSub = (it.subCategory || "").trim();
      if (rawSub && target.subCategories) {
        if (!target.subCategories.some((s) => s.name.toLowerCase() === rawSub.toLowerCase())) {
          target.subCategories.push({
            id: `sub-${target.subCategories.length}`,
            name: rawSub,
            unit: it.unit || "Kg",
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  })();

  const activeCategory = allCategoriesList.find(
    (c) => c.name.toLowerCase() === selectedCategory.toLowerCase(),
  );
  const currentSubCategories = activeCategory?.subCategories || [];

  // Table search, filter, sort & pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ colId: string; direction: "asc" | "desc" } | null>(null);

  const columns: DataTableColumn<RawMaterialRow>[] = [
    { id: "code", label: "CODE", sortable: true },
    { id: "name", label: "MATERIAL NAME", sortable: true },
    { id: "category", label: "CATEGORY & SUBCATEGORY", sortable: true },
    { id: "stock", label: "STOCK / ALERT QTY", sortable: true },
    { id: "pricePerUnit", label: "PRICE / UNIT", sortable: true },
    { id: "isReturnable", label: "RETURNABLE", align: "center", sortable: true },
    { id: "expiryDate", label: "EXPIRY DATE", sortable: true },
    { id: "isActive", label: "STATUS", align: "center", sortable: true },
    { id: "actions", label: "ACTIONS", align: "right" },
  ];

  // Filtering with multi-field fuzzy search
  const filteredItems = (() => {
    let result = items;
    if (categoryFilter !== "All") {
      result = result.filter((item) => item.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      result = fuzzyFilter(result, searchQuery, [
        (item) => item.name,
        (item) => item.code,
        (item) => item.category,
        (item) => item.subCategory,
        (item) => item.unit,
        (item) => String(item.availableStock),
        (item) => String(item.pricePerUnit),
        (item) => item.expiryDate || "",
      ]);
    }
    return result;
  })();

  // Sorting with chronological date support
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sortConfig) return 0;
    const { colId, direction } = sortConfig;
    let aVal: any;
    let bVal: any;
    if (colId === "stock") {
      aVal = a.availableStock;
      bVal = b.availableStock;
    } else {
      aVal = a[colId as keyof RawMaterialRow];
      bVal = b[colId as keyof RawMaterialRow];
    }
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    if (colId === "expiryDate") {
      const cmp = compareDates(aVal, bVal);
      return direction === "asc" ? cmp : -cmp;
    }
    if (typeof aVal === "string") {
      return direction === "asc"
        ? aVal.localeCompare(String(bVal))
        : String(bVal).localeCompare(aVal);
    }
    return direction === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  // Pagination
  const paginatedRows = sortedItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-4">
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            Raw Materials & Ingredients Catalog
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure stock items, categorize ingredients, set alert thresholds, and manage shelf-life.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow-xs transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Raw Material</span>
          </button>
        </div>
      </div>

      {/* 2. Structured Data Table with DataTableHeader & DataTableFooter */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search raw materials by name, SKU, category..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              <option value="All">All Categories ({items.length})</option>
              {allCategoriesList.map((c) => (
                <option key={c.id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Showing {paginatedRows.length} of {filteredItems.length} records
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <DataTableHeader
              columns={columns}
              data={filteredItems}
              sortConfig={sortConfig}
              onSortChange={setSortConfig}
              themeVariant="primary"
            />
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                    <Package className="mx-auto mb-2 h-7 w-7 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">No raw materials found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchQuery || categoryFilter !== "All"
                        ? "Try clearing filters to see items."
                        : "Click 'Add Raw Material' above to get started."}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const isLow = row.availableStock <= row.alertQuantity;
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-mono font-bold text-teal-700 text-xs">
                        {row.code}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 text-xs">
                        {row.name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                            {row.category}
                          </span>
                          {row.subCategory && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200/80">
                              {row.subCategory}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className={`font-bold ${isLow ? "text-rose-600 font-extrabold" : "text-slate-900"}`}>
                            {row.availableStock} {row.unit}
                          </span>
                          <span className="text-slate-400 text-[11px]">/ min {row.alertQuantity}</span>
                          {isLow && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 text-[9.5px] font-extrabold" title="Stock is below alert threshold">
                              <AlertTriangle className="h-2.5 w-2.5" /> Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-xs text-slate-900 font-mono">
                        {row.pricePerUnit ? `₹${Number(row.pricePerUnit).toLocaleString("en-IN")}` : "—"}{" "}
                        <span className="text-[10px] text-slate-500 font-sans">/{row.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.isReturnable ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10.5px] font-bold">
                            <RotateCcw className="h-3 w-3" /> Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 text-[10.5px] font-medium">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.expiryDate ? (() => {
                          const exp = new Date(row.expiryDate);
                          const today = new Date();
                          const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          const isNear = diffDays <= 15 && diffDays >= 0;
                          const isExpired = diffDays < 0;
                          return (
                            <div className="flex flex-col text-xs">
                              <span className="font-semibold text-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-primary" />
                                {formatDateIndian(row.expiryDate)}
                              </span>
                              {isExpired ? (
                                <span className="text-[10px] font-bold text-rose-600">Expired</span>
                              ) : isNear ? (
                                <span className="text-[10px] font-bold text-amber-600">{diffDays} days left</span>
                              ) : null}
                            </div>
                          );
                        })() : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleActive(row.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                            row.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {row.isActive ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            <span>Inactive</span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(row)}
                            className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-300 bg-white hover:border-amber-500 hover:bg-amber-50/60 shadow-2xs transition cursor-pointer"
                            title="Edit Raw Material"
                          >
                            <ColorActionEdit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ id: row.id, name: row.name })}
                            className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-300 bg-white hover:border-rose-500 hover:bg-rose-50/60 shadow-2xs transition cursor-pointer"
                            title="Delete Item"
                          >
                            <ColorActionDelete className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <DataTableFooter
          currentPage={currentPage}
          totalCount={filteredItems.length}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          onPageChange={setCurrentPage}
          itemName="raw materials"
        />
      </div>

      {/* 3. Add / Edit Raw Material Slide-Over Panel */}
      <PosCreatePanel
        open={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetForm();
        }}
        title={editingItem ? "Edit Raw Material" : "Add New Raw Material"}
        description={
          editingItem
            ? `Update specifications, stock balance, alert quantity, and expiry for ${editingItem.code}.`
            : "Configure an ingredient with category, subcategory unit, alert quantity, and return settings."
        }
        icon={Package}
        onSubmit={handleCreateSubmit}
        footer={
          <>
            <PosCreateCancelButton
              onClick={() => {
                setIsCreateOpen(false);
                resetForm();
              }}
            />
            <PosCreateSubmitButton>
              {editingItem ? "Update Material" : "Save Material"}
            </PosCreateSubmitButton>
          </>
        }
      >
        <div className="space-y-3.5">
          {/* Material Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Material Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sona Masoori Rice 25kg, Amul Butter 500g"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Category Dropdown + Quick Add Button */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Category *</label>
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-800 transition cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                Add Category
              </button>
            </div>
            <select
              required
              value={selectedCategory}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedCategory(val);
                setSelectedSubCategory("");
                setIsCustomSubCategory(false);
                setCustomSubCategory("");
              }}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
            >
              <option value="">— Select Category —</option>
              {allCategoriesList.map((c) => (
                <option key={c.id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Dropdown & Custom Option */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Subcategory</label>
              {!isCustomSubCategory ? (
                <button
                  type="button"
                  onClick={() => setIsCustomSubCategory(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-800 transition cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  New Subcategory
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomSubCategory(false);
                    setCustomSubCategory("");
                  }}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  Choose from list
                </button>
              )}
            </div>

            {isCustomSubCategory ? (
              <input
                type="text"
                placeholder="Enter new subcategory name"
                value={customSubCategory}
                onChange={(e) => setCustomSubCategory(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ) : (
              <select
                value={selectedSubCategory}
                onChange={(e) => handleSubCategoryChange(e.target.value)}
                disabled={!selectedCategory}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="">
                  {selectedCategory ? "— Select Subcategory —" : "— Choose Category First —"}
                </option>
                {currentSubCategories.map((s) => (
                  <option key={s.id || s.name} value={s.name}>
                    {s.name} ({s.unit || "Kg"})
                  </option>
                ))}
                {selectedCategory && (
                  <option value="__custom__">+ Enter new subcategory...</option>
                )}
              </select>
            )}
          </div>

          {/* Unit & Price per Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Unit of Measure *{" "}
                <span className="text-[10px] text-teal-700 font-normal">
                  {!isCustomSubCategory && selectedSubCategory ? "(Auto-fetched)" : ""}
                </span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-semibold"
              >
                {STANDARD_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Price per Unit (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 180"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
          </div>

          {/* SKU / Item Code */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">SKU / Item Code</label>
            <input
              type="text"
              placeholder="e.g. RAW-GRO-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>

          {/* Quantity & Alert Quantity Side-by-Side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                {editingItem ? "Stock Quantity" : "Quantity"} {unit ? `(${unit})` : ""}
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                {editingItem ? "Current stock on hand" : "Initial stock count to add"}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Alert Quantity (Min) *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                placeholder="e.g. 5"
                value={alertQuantity}
                onChange={(e) => setAlertQuantity(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
              <p className="text-[10px] text-muted-foreground">Alerts in stock radar if stock reaches this</p>
            </div>
          </div>

          {/* Returnable Item Checkbox */}
          <div className="rounded-lg border border-border bg-surface-2/40 p-2.5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isReturnable}
                onChange={(e) => setIsReturnable(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-foreground">Returnable Item</span>
                <p className="text-[11px] text-muted-foreground">
                  Tick if this raw material can be returned to suppliers for replacement or debit note.
                </p>
              </div>
            </label>
          </div>

          {/* Expiry Date (Optional) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Expiry Date (Optional)</span>
              <span className="text-[10.5px] text-muted-foreground font-normal">Shows alert in overview when near</span>
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            />
          </div>
        </div>
      </PosCreatePanel>

      {/* 4. Quick Add Category Popup Modal */}
      {isAddCategoryOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-300 bg-white p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                  <FolderTree className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Add New Category</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddCategory} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seafood, Bakery, Condiments"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Subcategories & Units
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setNewCatSubs((prev) => [...prev, { name: "", unit: "Kg" }])
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Add More
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {newCatSubs.map((sub, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Subcategory name"
                        value={sub.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewCatSubs((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, name: val } : s)),
                          );
                        }}
                        className="flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                      />
                      <select
                        value={sub.unit}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewCatSubs((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, unit: val } : s)),
                          );
                        }}
                        className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
                      >
                        {STANDARD_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setNewCatSubs((prev) =>
                            prev.length > 1
                              ? prev.filter((_, i) => i !== idx)
                              : [{ name: "", unit: "Kg" }],
                          );
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-700 shadow-xs cursor-pointer"
                >
                  Create & Select
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {/* Delete Confirmation Modal */}
      <StockDeleteConfirmModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Raw Material"
        itemName={deleteTarget?.name}
        description={
          deleteTarget ? (
            <>
              Are you sure you want to permanently delete raw material{" "}
              <span className="font-semibold text-slate-900">"{deleteTarget.name}"</span>?
              This will remove the item from raw materials inventory and stock reports.
            </>
          ) : undefined
        }
        onConfirm={() => {
          if (deleteTarget) {
            handleDelete(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
