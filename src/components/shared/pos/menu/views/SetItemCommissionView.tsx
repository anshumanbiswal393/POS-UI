import { useState, useMemo, useEffect, useCallback } from "react";
import { Edit2, Trash2, Plus, Percent, IndianRupee, Search, Sparkles } from "lucide-react";
import { useItemCommissions, useUpdateItemCommission } from "@/hooks/queries/usePosMenu";
import { SetCommissionModal } from "../modals/SetCommissionModal";
import { AddCommissionModal } from "../modals/AddCommissionModal";
import type { MenuItemCommission } from "@/types/posMenu";
import { PosDataGrid, type DataGridColumn } from "@/components/ui/data-grid";
import { toast } from "sonner";
import { registerAddMenuCommissionHandler } from "@/components/shared/pos/menu/menuCommissionActions";
import { useOutletContext } from "@/context/PosOutletContext";
import { calculateEffectivePrice } from "@/utils/commissionUtils";

export function SetItemCommissionView({ onBack }: { onBack?: () => void } = {}) {
  const { activeOutlet } = useOutletContext();
  const { data: commissions = [], isFetching, isLoading } = useItemCommissions(activeOutlet?.id);
  const updateMutation = useUpdateItemCommission();

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [editingItem, setEditingItem] = useState<MenuItemCommission | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Only display items that have an active commission configured
  const configuredItems = useMemo(() => {
    return commissions.filter(
      (item) =>
        item.commissionType &&
        item.commissionType !== "Not Configured" &&
        item.commissionValue != null &&
        item.commissionValue > 0,
    );
  }, [commissions]);

  // Categories available among configured items
  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(configuredItems.map((c) => c.category).filter(Boolean)))];
  }, [configuredItems]);

  // Filtered list by search and category
  const filteredItems = useMemo(() => {
    return configuredItems.filter((item) => {
      if (categoryFilter !== "All" && item.category !== categoryFilter) return false;
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [configuredItems, categoryFilter, searchQuery]);

  const openEditModal = (item: MenuItemCommission) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const openAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const handleDeleteCommission = (item: MenuItemCommission) => {
    updateMutation.mutate(
      {
        id: item.id,
        commissionType: "Not Configured",
        commissionValue: null,
      },
      {
        onSuccess: () => {
          toast.success(
            `Commission removed for "${item.name}". Reverted to base price ₹${item.price.toFixed(2)}.`,
          );
        },
        onError: () => {
          toast.error(`Failed to remove commission for "${item.name}".`);
        },
      },
    );
  };

  // Header Add Commission button sync
  useEffect(() => {
    registerAddMenuCommissionHandler(openAddModal);
    return () => registerAddMenuCommissionHandler(null);
  }, [openAddModal]);

  const columns: DataGridColumn<MenuItemCommission>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Item Name",
        accessorKey: "name",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 200,
        cell: ({ row }) => (
          <div className="py-1">
            <span className="font-semibold text-slate-900 block text-xs">{row.name}</span>
          </div>
        ),
      },
      {
        id: "category",
        header: "Category",
        accessorKey: "category",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 140,
        cell: ({ row }) => (
          <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {row.category}
          </span>
        ),
      },
      {
        id: "price",
        header: "Original Price",
        accessorKey: "price",
        enableSorting: true,
        enableFiltering: true,
        align: "right",
        minWidth: 130,
        cell: ({ row }) => (
          <span className="font-mono font-medium text-slate-600 text-xs">
            ₹{row.price.toFixed(2)}
          </span>
        ),
      },
      {
        id: "commissionType",
        header: "Commission Type",
        accessorKey: "commissionType",
        enableSorting: true,
        enableFiltering: true,
        align: "center",
        minWidth: 160,
        cell: ({ row }) => {
          const isPercentage = row.commissionType === "Percentage";
          return (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isPercentage
                  ? "bg-teal-50 text-teal-800 border border-teal-200"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
              }`}
            >
              {isPercentage ? (
                <Percent className="h-3 w-3 text-teal-700" />
              ) : (
                <IndianRupee className="h-3 w-3 text-emerald-700" />
              )}
              {isPercentage ? "Percentage" : "Fixed Amount"}
            </span>
          );
        },
      },
      {
        id: "commissionValue",
        header: "Commission Value",
        accessorKey: "commissionValue",
        enableSorting: true,
        enableFiltering: true,
        align: "right",
        minWidth: 140,
        cell: ({ row }) => (
          <span className="font-mono font-bold text-slate-800 text-xs">
            {row.commissionType === "Percentage"
              ? `${row.commissionValue}%`
              : `₹${(row.commissionValue || 0).toFixed(2)}`}
          </span>
        ),
      },
      {
        id: "effectivePrice",
        header: "Final Selling Price",
        align: "right",
        minWidth: 160,
        cell: ({ row }) => {
          const effective = calculateEffectivePrice(
            row.price,
            row.commissionType,
            row.commissionValue,
          );
          const markup = effective - row.price;

          return (
            <div className="py-1 text-right">
              <span className="font-mono text-xs font-extrabold text-teal-700">
                ₹{effective.toFixed(2)}
              </span>
              {markup > 0 && (
                <span className="block text-[10.5px] text-teal-600 font-medium">
                  (+₹{markup.toFixed(2)})
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        minWidth: 110,
        sortable: false,
        filterable: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => openEditModal(row)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-teal-700 transition cursor-pointer"
              title="Edit Commission"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteCommission(row)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
              title="Delete Commission (Revert to Original Price)"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      {/* 1. Clean Top Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[220px] max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search configured items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:border-teal-600 focus:outline-hidden"
            />
          </div>

          {/* Category Dropdown */}
          <div className="min-w-[150px]">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-teal-600 focus:outline-hidden cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All Categories" : c}
                </option>
              ))}
            </select>
          </div>

          {/* Configured Counter Badge */}
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold">
            <Sparkles className="h-3 w-3 text-teal-600" />
            {configuredItems.length} {configuredItems.length === 1 ? "Item" : "Items"} Configured
          </span>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>+ Add Commission</span>
        </button>
      </div>

      {/* 2. Main Commission Table (Only Configured Items) */}
      {configuredItems.length === 0 && !isLoading && !isFetching ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 mb-3 border border-teal-100">
            <Percent className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            No commission rules configured yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mb-4">
            Click &ldquo;+ Add Commission&rdquo; to apply markups to individual dishes, multiple items,
            or whole categories. Final selling prices will automatically reflect in POS billing and printed menus.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Commission</span>
          </button>
        </div>
      ) : (
        <PosDataGrid<MenuItemCommission>
          data={filteredItems}
          columns={columns}
          isLoading={isLoading || isFetching}
          enableSelection={false}
          enablePagination={true}
          pageSize={pageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          emptyMessage="No configured commission items match your search filter."
        />
      )}

      {/* Edit Single Commission Modal */}
      <SetCommissionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={editingItem}
      />

      {/* Add Commission Modal (Supports: Individual Item, Multiple Items, Entire Category) */}
      <AddCommissionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        allItems={commissions}
      />
    </div>
  );
}

export default SetItemCommissionView;
