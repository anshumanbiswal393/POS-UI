import { useState, useMemo, useEffect, useCallback } from "react";
import { Edit2 } from "lucide-react";
import { useItemCommissions } from "@/hooks/queries/usePosMenu";
import { SetCommissionModal } from "../modals/SetCommissionModal";
import type { MenuItemCommission } from "@/types/posMenu";
import { PosDataGrid, type DataGridColumn } from "@/components/ui/data-grid";
import { toast } from "sonner";
import { registerAddMenuCommissionHandler } from "@/components/shared/pos/menu/menuCommissionActions";

export function SetItemCommissionView({ onBack }: { onBack?: () => void } = {}) {
  const { data: commissions, isFetching, isLoading } = useItemCommissions();

  const [activeTab, setActiveTab] = useState<"item" | "addon">("item");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [itemQuery, setItemQuery] = useState("");
  const [commissionTypeFilter, setCommissionTypeFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(10);

  // Edit modal state
  const [editingItem, setEditingItem] = useState<MenuItemCommission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(commissions?.map((c) => c.category) ?? []))],
    [commissions],
  );

  // Filtering
  const filteredCommissions = useMemo(() => {
    return (commissions ?? []).filter((item) => {
      if (categoryFilter !== "All" && item.category !== categoryFilter) return false;
      if (itemQuery && !item.name.toLowerCase().includes(itemQuery.toLowerCase())) return false;
      if (commissionTypeFilter !== "All" && item.commissionType !== commissionTypeFilter)
        return false;
      return true;
    });
  }, [commissions, categoryFilter, itemQuery, commissionTypeFilter]);

  const openEditModal = (item: MenuItemCommission) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleBulkAdd = useCallback(() => {
    if (selectedIds.length === 0) {
      if (filteredCommissions.length > 0) {
        openEditModal(filteredCommissions[0]);
      } else {
        toast.error("No items available to configure");
      }
    } else {
      const first = filteredCommissions.find((i) => i.id === selectedIds[0]);
      if (first) openEditModal(first);
    }
  }, [selectedIds, filteredCommissions]);

  // Header Add button lives in PosMenuHeader (replaces Sync POS on this page)
  useEffect(() => {
    registerAddMenuCommissionHandler(handleBulkAdd);
    return () => registerAddMenuCommissionHandler(null);
  }, [handleBulkAdd]);

  const columns: DataGridColumn<MenuItemCommission>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Item",
        accessorKey: "name",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 200,
        cell: ({ row }) => <span className="font-semibold text-slate-800">{row.name}</span>,
      },
      {
        id: "category",
        header: "Category",
        accessorKey: "category",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 140,
        cell: ({ row }) => <span className="text-slate-600">{row.category}</span>,
      },
      {
        id: "price",
        header: "Item Price",
        accessorKey: "price",
        enableSorting: true,
        enableFiltering: true,
        align: "right",
        minWidth: 120,
        cell: ({ row }) => (
          <span className="font-mono font-bold text-slate-800">₹{row.price}</span>
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
        cell: ({ row }) => (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
              row.commissionType === "Not Configured"
                ? "bg-slate-100 text-slate-500"
                : "bg-teal-50 text-teal-700 font-semibold"
            }`}
          >
            {row.commissionType}
          </span>
        ),
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
          <span className="font-mono font-semibold text-slate-800">
            {row.commissionValue != null
              ? row.commissionType === "Percentage"
                ? `${row.commissionValue}%`
                : `₹${row.commissionValue}`
              : "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        minWidth: 90,
        sortable: false,
        filterable: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => openEditModal(row)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition cursor-pointer"
              title="Edit Commission"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      {/* Sub Tabs: Item Commission & Addon Item Commission */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("item")}
          className={`border-b-2 px-6 py-2.5 text-[13px] font-bold transition cursor-pointer ${
            activeTab === "item"
              ? "border-teal-600 text-teal-700 font-bold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Item Commission
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
          Addon Item Commission
        </button>
      </div>

      {/* 3. Filter Bar */}
      <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
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

          <div>
            <label className="block text-[11.5px] font-medium text-slate-600 mb-1">Item</label>
            <input
              type="text"
              placeholder="Search by item..."
              value={itemQuery}
              onChange={(e) => setItemQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-hidden"
            >
            </input>
          </div>

          <div>
            <label className="block text-[11.5px] font-medium text-slate-600 mb-1">
              Commission Type
            </label>
            <select
              value={commissionTypeFilter}
              onChange={(e) => setCommissionTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-hidden cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Not Configured">Not Configured</option>
              <option value="Percentage">Percentage (%)</option>
              <option value="Fixed Amount">Fixed Amount (₹)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info(`Filtered: ${filteredCommissions.length} items found`)}
              className="flex-1 rounded-lg bg-teal-600 px-4 py-1.5 text-[12.5px] font-medium text-white hover:bg-teal-700 transition cursor-pointer shadow-xs"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setCategoryFilter("All");
                setItemQuery("");
                setCommissionTypeFilter("All");
                toast.info("Showing all commissions");
              }}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Show All
            </button>
          </div>
        </div>
      </div>

      {/* 4. PosDataGrid with complete DataTableHeader */}
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
        emptyMessage="No commission rules found for selected filter."
      />

      {/* Commission Edit Modal */}
      <SetCommissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={editingItem}
      />
    </div>
  );
}
