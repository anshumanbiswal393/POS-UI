import { useState } from "react";
import {
  useDeleteStockItem,
  usePatchStockItem,
  useStockItems,
  useUpsertStockItem,
} from "@/hooks/queries/usePosInventory";
import {
  Plus,
  ArrowRight,
  Star,
  Check,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid } from "@/components/ui/data-grid";
import type { DataGridColumn } from "@/components/ui/data-grid/types";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";

interface RawMaterialRow {
  id: string;
  code: string;
  name: string;
  category: string;
  isFavorite: boolean;
  isActive: boolean;
}

export function RawMaterialsManagementView() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: stockItems = [] } = useStockItems();
  const upsert = useUpsertStockItem();
  const patch = usePatchStockItem();
  const remove = useDeleteStockItem();

  const items: RawMaterialRow[] = stockItems.map((sku) => ({
    id: sku.id,
    code: sku.code || sku.id,
    name: sku.rawMaterial,
    category: sku.category || "Groceries",
    isFavorite: Boolean(sku.isFavorite),
    isActive: sku.isActive !== false,
  }));

  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Groceries");

  const toggleFavorite = (id: string) => {
    const row = items.find((it) => it.id === id);
    patch.mutate({ id, data: { isFavorite: !row?.isFavorite } });
  };

  const toggleActive = (id: string) => {
    const row = items.find((it) => it.id === id);
    patch.mutate({ id, data: { isActive: !row?.isActive } });
  };

  const handleDelete = (id: string) => {
    remove.mutate(id, { onSuccess: () => toast.success("Raw material removed") });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const name = newItemName.trim();
    const code = name.replace(/[^A-Za-z0-9]+/g, "-").toUpperCase().slice(0, 24);
    upsert.mutate(
      {
        code,
        name,
        rawMaterial: name,
        category: newItemCategory,
        unit: "Kg",
        itemKind: "RAW",
        availableStock: 0,
        reorderLevel: 5,
        parLevel: 10,
      },
      {
        onSuccess: () => {
          setNewItemName("");
          setNewItemCategory("Groceries");
          setIsCreateOpen(false);
          toast.success(`Raw material '${name}' created.`);
        },
        onError: () => toast.error("Could not create raw material"),
      },
    );
  };

  const columns: DataGridColumn<RawMaterialRow>[] = [
    {
      id: "code",
      header: "Code",
      sortable: true,
      filterable: true,
      width: 120,
      render: (val: any) => <span className="font-mono font-bold text-primary">{val}</span>,
    },
    {
      id: "name",
      header: "Material Name",
      sortable: true,
      filterable: true,
      width: 260,
      render: (val: any) => <span className="font-semibold text-foreground">{val}</span>,
    },
    {
      id: "category",
      header: "Category",
      sortable: true,
      filterable: true,
      width: 170,
      render: (val: any) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-surface-2 text-foreground">
          {val}
        </span>
      ),
    },
    {
      id: "isFavorite",
      header: "Favourite",
      sortable: true,
      align: "center",
      width: 130,
      render: (_: any, row: RawMaterialRow) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(row.id);
          }}
          className={`p-1.5 rounded-md transition cursor-pointer ${
            row.isFavorite
              ? "text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/40"
              : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
          }`}
          title={row.isFavorite ? "Remove from favourites" : "Mark as favourite"}
        >
          <Star className={`h-4 w-4 ${row.isFavorite ? "fill-amber-400 text-amber-500" : ""}`} />
        </button>
      ),
    },
    {
      id: "isActive",
      header: "Status",
      sortable: true,
      filterable: true,
      align: "center",
      width: 130,
      render: (_: any, row: RawMaterialRow) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleActive(row.id);
          }}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
            row.isActive
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "bg-slate-100 text-muted-foreground dark:bg-surface-2"
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
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      width: 100,
      render: (_: any, row: RawMaterialRow) => (
        <div className="flex items-center justify-end gap-1 text-muted-foreground">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
            className="p-1 hover:text-red-500 hover:bg-surface-2 rounded transition cursor-pointer"
            title="Delete Item"
          >
            <Trash2 className="h-4 w-4" />
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
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            Raw Materials & Ingredients Catalog
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure stock items, raw food materials, spices, and base ingredient items.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 shadow-xs transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Raw Material</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Data Grid */}
      <PosDataGrid
        data={items}
        columns={columns}
        keyField="id"
        title="Raw Material Items"
        subtitle="Manage ingredient catalog and category linkages"
        showToolbar
        selectable
        storageKey="pos-raw-materials-management"
        themeVariant="primary"
        pageSize={10}
      />

      <PosCreatePanel
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Raw Material"
        description="Add an ingredient to the kitchen catalog."
        icon={Plus}
        onSubmit={handleCreateSubmit}
        footer={
          <>
            <PosCreateCancelButton onClick={() => setIsCreateOpen(false)} />
            <PosCreateSubmitButton>Save Material</PosCreateSubmitButton>
          </>
        }
      >
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Material Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Sona Masoori Rice 25kg"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Category</label>
          <select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="Appetizers">Appetizers</option>
            <option value="Main Course">Main Course</option>
            <option value="Dairy">Dairy</option>
            <option value="Groceries">Groceries</option>
            <option value="Meat">Meat</option>
            <option value="Beverages">Beverages</option>
          </select>
        </div>
      </PosCreatePanel>
    </div>
  );
}
