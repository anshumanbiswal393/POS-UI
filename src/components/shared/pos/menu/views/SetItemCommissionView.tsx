import { useState, useMemo, useEffect, useCallback } from "react";
import { Edit2, Trash2, Plus, Sparkles, Filter, Percent, IndianRupee } from "lucide-react";
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

  const [activeTab, setActiveTab] = useState<"item" | "addon">("item");
  const [viewFilter, setViewFilter] = useState<"configured" | "all" | "unconfigured">("configured");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [itemQuery, setItemQuery] = useState("");
  const [commissionTypeFilter, setCommissionTypeFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [editingItem, setEditingItem] = useState<MenuItemCommission | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Categories from all menu items
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(commissions.map((c) => c.category)))],
    [commissions],
  );

  // Unconfigured items (items without commission)
  const unconfiguredItems = useMemo(() => {
    return commissions.filter(
      (item) => !item.commissionType || item.commissionType === "Not Configured" || item.commissionValue == null || item.commissionValue <= 0,
    );
  }, [commissions]);

  // Configured items (items with active commission)
  const configuredItems = useMemo(() => {
    return commissions.filter(
      (item) => item.commissionType && item.commissionType !== "Not Configured" && item.commissionValue != null && item.commissionValue > 0,
    );
  }, [commissions]);

  // Filtered commissions for table display
  const filteredCommissions = useMemo(() => {
    return commissions.filter((item) => {
      // 1. Status Filter: Configured vs Unconfigured vs All
      const hasComm = item.commissionType && item.commissionType !== "Not Configured" && item.commissionValue != null && item.commissionValue > 0;
      if (viewFilter === "configured" && !hasComm) return false;
      if (viewFilter === "unconfigured" && hasComm) return false;

      // 2. Category filter
      if (categoryFilter !== "All" && item.category !== categoryFilter) return false;

      // 3. Search query
      if (itemQuery && !item.name.toLowerCase().includes(itemQuery.toLowerCase())) return false;

      // 4. Commission type filter
      if (commissionTypeFilter !== "All" && item.commissionType !== commissionTypeFilter) {
        return false;
      }

      return true;
    });
  }, [commissions, viewFilter, categoryFilter, itemQuery, commissionTypeFilter]);

  const openEditModal = (item: MenuItemCommission) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const openAddModal = useCallback(() => {
    if (unconfiguredItems.length === 0) {
      toast.info("All menu items already have commissions configured! You can edit any existing item's commission from the table.");
      return;
    }
    setIsAddModalOpen(true);
  }, [unconfiguredItems.length]);

  const handleClearCommission = (item: MenuItemCommission) => {
    updateMutation.mutate(
      {
        id: item.id,
        commissionType: "Not Configured",
        commissionValue: null,
      },
      {
        onSuccess: () => {
          toast.success(`Commission removed for "${item.name}"`);
        },
        onError: () => {
          toast.error("Failed to remove commission");
        },
      },
    );
  };

  // Header Add button lives in PosMenuHeader
  useEffect(() => {
    registerAddMenuCommissionHandler(openAddModal);
    return () => registerAddMenuCommissionHandler(null);
  }, [openAddModal]);

  const columns: DataGridColumn<MenuItemCommission>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Item",
        accessorKey: "name",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 220,
        cell: ({ row }) => (
          <div className="py-1">
            <span className="font-bold text-slate-900 block">{row.name}</span>
            <span className="text-[11px] text-slate-500">{row.category}</span>
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
        header: "Base Price",
        accessorKey: "price",
        enableSorting: true,
        enableFiltering: true,
        align: "right",
        minWidth: 120,
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-slate-700">₹{row.price.toFixed(2)}</span>
        ),
      },
      {
        id: "commissionType",
        header: "Commission Type",
        accessorKey: "commissionType",
        enableSorting: true,
        enableFiltering: true,
        align: "center",
        minWidth: 150,
        cell: ({ row }) => {
          const isConfigured = row.commissionType !== "Not Configured" && row.commissionValue != null && row.commissionValue > 0;
          return (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isConfigured
                  ? "bg-teal-50 text-teal-800 border border-teal-200"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {isConfigured && row.commissionType === "Percentage" && <Percent className="h-3 w-3" />}
              {isConfigured && row.commissionType === "Fixed Amount" && <IndianRupee className="h-3 w-3" />}
              {row.commissionType}
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
          <span className="font-mono font-bold text-slate-800">
            {row.commissionValue != null && row.commissionType !== "Not Configured" && row.commissionValue > 0
              ? row.commissionType === "Percentage"
                ? `${row.commissionValue}%`
                : `₹${row.commissionValue.toFixed(2)}`
              : "—"}
          </span>
        ),
      },
      {
        id: "effectivePrice",
        header: "Selling Price",
        align: "right",
        minWidth: 140,
        cell: ({ row }) => {
          const effective = calculateEffectivePrice(row.price, row.commissionType, row.commissionValue);
          const hasMarkup = effective > row.price;

          return (
            <div className="py-1 text-right">
              <span
                className={`font-mono text-[13.5px] font-extrabold ${
                  hasMarkup ? "text-teal-700" : "text-slate-900"
                }`}
              >
                ₹{effective.toFixed(2)}
              </span>
              {hasMarkup && (
                <span className="block text-[10px] text-teal-600 font-medium">
                  (+₹{(effective - row.price).toFixed(2)})
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
        cell: ({ row }) => {
          const hasCommission = row.commissionType !== "Not Configured" && row.commissionValue != null && row.commissionValue > 0;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => openEditModal(row)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-teal-700 transition cursor-pointer"
                title="Edit Commission"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              {hasCommission && (
                <button
                  type="button"
                  onClick={() => handleClearCommission(row)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                  title="Remove Commission (Revert to base price)"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      {/* 1. Sub Tabs: Item Commission & Addon Item Commission */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex">
          <button
            type="button"
            onClick={() => setActiveTab("item")}
            className={`border-b-2 px-6 py-2.5 text-[13px] font-bold transition cursor-pointer ${
              activeTab === "item"
                ? "border-teal-600 text-teal-700 font-bold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Item Commission ({configuredItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("addon")}
            className={`border-b-2 px-6 py-2.5 text-[13px] font-bold transition cursor-pointer ${
              activeTab === "addon"
                ? "border-teal-600 text-teal-700 font-bold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Addon Item Commission (0)
          </button>
        </div>

        {/* Quick Add Button */}
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-[12px] font-bold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer mb-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Item Commission</span>
        </button>
      </div>

      {/* 2. Filter Bar with Configured vs All Switcher */}
      <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          {/* Status View Filter */}
          <div>
            <label className="block text-[11.5px] font-semibold text-slate-600 mb-1">
              Commission Status
            </label>
            <select
              value={viewFilter}
              onChange={(e) => setViewFilter(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12.5px] font-bold text-slate-800 focus:border-teal-500 focus:outline-hidden cursor-pointer"
            >
              <option value="configured">Configured Items ({configuredItems.length})</option>
              <option value="all">All Menu Items ({commissions.length})</option>
              <option value="unconfigured">Unconfigured Items ({unconfiguredItems.length})</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11.5px] font-medium text-slate-600 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-hidden cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[11.5px] font-medium text-slate-600 mb-1">Item</label>
            <input
              type="text"
              placeholder="Search by item..."
              value={itemQuery}
              onChange={(e) => setItemQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Commission Type Filter */}
          <div>
            <label className="block text-[11.5px] font-medium text-slate-600 mb-1">
              Commission Type
            </label>
            <select
              value={commissionTypeFilter}
              onChange={(e) => setCommissionTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-hidden cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Percentage">Percentage (%)</option>
              <option value="Fixed Amount">Fixed Amount (₹)</option>
              <option value="Not Configured">Not Configured</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info(`Filtered: ${filteredCommissions.length} items shown`)}
              className="flex-1 rounded-lg bg-teal-600 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-teal-700 transition cursor-pointer shadow-xs"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setViewFilter("all");
                setCategoryFilter("All");
                setItemQuery("");
                setCommissionTypeFilter("All");
                toast.info("Showing all menu items");
              }}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Show All
            </button>
          </div>
        </div>
      </div>

      {/* 3. PosDataGrid with complete DataTableHeader */}
      <PosDataGrid<MenuItemCommission>
        data={filteredCommissions}
        columns={columns}
        isLoading={isLoading || isFetching}
        enableSelection={true}
        selectedRowIds={selectedIds}
        onSelectionChange={setSelectedIds}
        enablePagination={true}
        pageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage={
          viewFilter === "configured"
            ? "No menu items have commissions added yet. Click '+ Add Menu Commission' to add commission rules to your dishes."
            : "No menu items found for the selected filter."
        }
      />

      {/* Edit Single Commission Modal */}
      <SetCommissionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={editingItem}
      />

      {/* Add Commission to Remaining Items Modal */}
      <AddCommissionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        unconfiguredItems={unconfiguredItems}
      />
    </div>
  );
}
export default SetItemCommissionView;
