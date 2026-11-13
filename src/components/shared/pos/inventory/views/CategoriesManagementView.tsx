import { useState, useMemo } from "react";
import {
  useStockCategories,
  useStockItems,
  useUpsertStockCategory,
  useDeleteStockCategory,
} from "@/hooks/queries/usePosInventory";
import {
  Plus,
  Trash2,
  FolderTree,
  Edit2,
  Layers,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid } from "@/components/ui/data-grid";
import type { DataGridColumn } from "@/components/ui/data-grid/types";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";
import type { StockCategory, StockSubCategory } from "@/types/posInventory";
import { extractCategoriesFromStock } from "@/services/posInventoryService";

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

interface SubCategoryDraft {
  id?: string;
  name: string;
  unit: string;
}

export function CategoriesManagementView() {
  const { data: rawCategories = [], isLoading } = useStockCategories();
  const { data: stockItems = [] } = useStockItems();

  const categories = useMemo(() => {
    return extractCategoriesFromStock(stockItems, rawCategories);
  }, [stockItems, rawCategories]);

  const upsertCategory = useUpsertStockCategory();
  const deleteCategory = useDeleteStockCategory();

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StockCategory | null>(null);

  const [categoryName, setCategoryName] = useState("");
  const [subCategories, setSubCategories] = useState<SubCategoryDraft[]>([
    { name: "", unit: "Kg" },
  ]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setCategoryName("");
    setSubCategories([{ name: "", unit: "Kg" }]);
    setIsPanelOpen(true);
  };

  const openEditModal = (cat: StockCategory) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setSubCategories(
      cat.subCategories && cat.subCategories.length > 0
        ? cat.subCategories.map((s) => ({ id: s.id, name: s.name, unit: s.unit || "Kg" }))
        : [{ name: "", unit: "Kg" }],
    );
    setIsPanelOpen(true);
  };

  const addSubCategoryRow = () => {
    setSubCategories((prev) => [...prev, { name: "", unit: "Kg" }]);
  };

  const updateSubCategoryRow = (index: number, field: "name" | "unit", value: string) => {
    setSubCategories((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const removeSubCategoryRow = (index: number) => {
    setSubCategories((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.length > 0 ? filtered : [{ name: "", unit: "Kg" }];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      toast.error("Please enter a category name");
      return;
    }

    const validSubCategories = subCategories
      .map((s) => ({
        id: s.id || `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: s.name.trim(),
        unit: s.unit || "Kg",
      }))
      .filter((s) => s.name.length > 0);

    upsertCategory.mutate(
      {
        id: editingCategory?.id,
        name: trimmedName,
        subCategories: validSubCategories,
      },
      {
        onSuccess: () => {
          setIsPanelOpen(false);
          toast.success(
            editingCategory
              ? `Category '${trimmedName}' updated.`
              : `Category '${trimmedName}' created.`,
          );
        },
        onError: () => {
          toast.error("Failed to save category");
        },
      },
    );
  };

  const handleDelete = (id: string, name: string) => {
    deleteCategory.mutate(id, {
      onSuccess: () => toast.success(`Category '${name}' deleted`),
      onError: () => toast.error("Could not delete category"),
    });
  };

  const columns: DataGridColumn<StockCategory>[] = [
    {
      id: "name",
      header: "Category Name",
      sortable: true,
      filterable: true,
      width: 220,
      render: (val: any) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-200/80">
            <FolderTree className="h-3.5 w-3.5" />
          </div>
          <span className="font-bold text-foreground text-xs">{val}</span>
        </div>
      ),
    },
    {
      id: "subCategories",
      header: "Subcategories & Units",
      sortable: false,
      width: 480,
      render: (_: any, row: StockCategory) => {
        const subs = row.subCategories || [];
        if (subs.length === 0) {
          return <span className="text-muted-foreground text-xs italic">No subcategories</span>;
        }
        return (
          <div className="flex flex-wrap items-center gap-1.5 py-1">
            {subs.map((s) => (
              <span
                key={s.id || s.name}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-border dark:bg-surface-2 dark:text-foreground"
              >
                <span>{s.name}</span>
                <span className="rounded bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 px-1 py-0.2 text-[9.5px] font-extrabold">
                  {s.unit}
                </span>
              </span>
            ))}
          </div>
        );
      },
    },
    {
      id: "count",
      header: "Total Subs",
      sortable: true,
      align: "center",
      width: 120,
      render: (_: any, row: StockCategory) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-surface-2 dark:text-foreground">
          <Layers className="h-3 w-3 text-slate-500" />
          {row.subCategories?.length || 0}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      width: 100,
      render: (_: any, row: StockCategory) => (
        <div className="flex items-center justify-end gap-1 text-muted-foreground">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(row);
            }}
            className="p-1 hover:text-primary hover:bg-surface-2 rounded transition cursor-pointer"
            title="Edit Category & Subcategories"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id, row.name);
            }}
            className="p-1 hover:text-red-500 hover:bg-surface-2 rounded transition cursor-pointer"
            title="Delete Category"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-bold text-foreground tracking-tight">
            Stock Categories & Subcategories
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Maintain raw material categories, define subcategories, and assign measurement units.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow-xs transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Data Grid */}
      <PosDataGrid
        data={categories}
        columns={columns}
        keyField="id"
        title="Stock Category Catalog"
        subtitle="Hierarchy of raw material groups and associated units"
        showToolbar
        storageKey="pos-stock-categories-management"
        themeVariant="primary"
        pageSize={10}
      />

      {/* 3. Add / Edit Category Panel */}
      <PosCreatePanel
        open={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title={editingCategory ? "Edit Category & Subcategories" : "Add New Stock Category"}
        description={
          editingCategory
            ? "Update category name or manage its subcategories and measurement units."
            : "Enter category name and add one or more subcategories with their units."
        }
        icon={FolderTree}
        onSubmit={handleSubmit}
        footer={
          <>
            <PosCreateCancelButton onClick={() => setIsPanelOpen(false)} />
            <PosCreateSubmitButton>
              {editingCategory ? "Save Changes" : "Save Category"}
            </PosCreateSubmitButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Category Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Dairy, Groceries, Meat & Poultry"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Subcategories & Measurement Units
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Enter subcategory names and set their measurement unit.
                </p>
              </div>
              <button
                type="button"
                onClick={addSubCategoryRow}
                className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-100 transition cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                Add Subcategory
              </button>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {subCategories.map((sub, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg border border-border bg-surface-2/40 p-2"
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder={`Subcategory name (e.g. Cow Milk)`}
                      value={sub.name}
                      onChange={(e) => updateSubCategoryRow(idx, "name", e.target.value)}
                      className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="w-28 shrink-0">
                    <select
                      value={sub.unit}
                      onChange={(e) => updateSubCategoryRow(idx, "unit", e.target.value)}
                      className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      {STANDARD_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSubCategoryRow(idx)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-red-500 transition cursor-pointer"
                    title="Remove subcategory"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PosCreatePanel>
    </div>
  );
}

