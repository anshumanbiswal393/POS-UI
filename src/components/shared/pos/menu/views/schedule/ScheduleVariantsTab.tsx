import { useState, useMemo } from "react";
import { Plus, ChevronDown, Edit2, Copy } from "lucide-react";
import { useScheduleVariants, useAddScheduleVariant } from "@/hooks/queries/usePosMenu";
import type { ScheduleVariantItem } from "@/types/posMenu";
import { PosDataGrid, type DataGridColumn } from "@/components/ui/data-grid";
import { toast } from "sonner";
import { ColorActionEdit } from "@/components/common/ColorActionIcons";

export function ScheduleVariantsTab() {
  const { data: variants, isLoading, isFetching } = useScheduleVariants();
  const addMutation = useAddScheduleVariant();

  const [variationNameFilter, setVariationNameFilter] = useState("");
  const [searchByFilter, setSearchByFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newVarName, setNewVarName] = useState("");
  const [newDept, setNewDept] = useState("Quantity");
  const [pageSize, setPageSize] = useState(10);

  const filteredVariants = useMemo(() => {
    return (variants ?? []).filter((v) => {
      if (variationNameFilter && !v.name.toLowerCase().includes(variationNameFilter.toLowerCase())) {
        return false;
      }
      if (searchByFilter !== "All" && v.departmentName !== searchByFilter) {
        return false;
      }
      return true;
    });
  }, [variants, variationNameFilter, searchByFilter]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVarName.trim()) {
      toast.error("Please enter a variant name");
      return;
    }

    addMutation.mutate(
      { name: newVarName.trim(), departmentName: newDept },
      {
        onSuccess: () => {
          toast.success(`Variant "${newVarName}" created`);
          setNewVarName("");
          setIsAdding(false);
        },
      },
    );
  };

  const columns: DataGridColumn<ScheduleVariantItem>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Name",
        accessorKey: "name",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 180,
        cell: ({ row }) => <span className="font-semibold text-slate-900">{row.name}</span>,
      },
      {
        id: "onlineDisplayName",
        header: "Online Display Name",
        accessorKey: "onlineDisplayName",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 160,
        cell: ({ row }) => (
          <span className="text-slate-600 text-[12.5px]">{row.onlineDisplayName ?? "—"}</span>
        ),
      },
      {
        id: "departmentName",
        header: "Department Name",
        accessorKey: "departmentName",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 140,
        cell: ({ row }) => (
          <span className="text-slate-700 font-medium">{row.departmentName}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        enableFiltering: true,
        align: "center",
        minWidth: 100,
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
            {row.status}
          </span>
        ),
      },
      {
        id: "createdAt",
        header: "Created",
        accessorKey: "createdAt",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 120,
        cell: ({ row }) => <span className="text-slate-500 text-[12px]">{row.createdAt}</span>,
      },
      {
        id: "modifiedAt",
        header: "Modified",
        accessorKey: "modifiedAt",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 120,
        cell: ({ row }) => <span className="text-slate-500 text-[12px]">{row.modifiedAt}</span>,
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        minWidth: 90,
        sortable: false,
        filterable: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => toast.info(`Editing variation ${row.name}`)}
              className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-300 bg-white hover:border-amber-500 hover:bg-amber-50/60 shadow-2xs transition cursor-pointer"
              title="Edit Variation"
            >
              <ColorActionEdit className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => toast.success(`Duplicated ${row.name}`)}
              className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-300 bg-white hover:border-teal-500 hover:bg-teal-50/60 shadow-2xs transition cursor-pointer text-slate-500"
              title="Duplicate"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      {/* 1. Header and Actions from Screenshot 3 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-slate-500">Menu</span>
          <span className="text-[13px] text-slate-400">›</span>
          <span className="text-[14px] font-bold text-slate-900">Variation</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Variation
          </button>
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Action <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={() => toast.info("Bulk update variations modal opened")}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Bulk Update
          </button>
        </div>
      </div>

      {/* Quick Add Drawer */}
      {isAdding && (
        <form
          onSubmit={handleAddSubmit}
          className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-teal-900">Add New Variation</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-[12px] text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Variation name..."
              value={newVarName}
              onChange={(e) => setNewVarName(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[13px] focus:outline-hidden focus:border-teal-500"
              autoFocus
            />
            <select
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[13px] focus:outline-hidden focus:border-teal-500 cursor-pointer"
            >
              <option value="Quantity">Quantity</option>
              <option value="Portion">Portion</option>
              <option value="Size">Size</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-teal-700 cursor-pointer shadow-xs"
            >
              Save Variation
            </button>
          </div>
        </form>
      )}

      {/* 2. Filter Bar from Screenshot 3 */}
      <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11.5px] font-medium text-slate-600 mb-1">
              Variation Name
            </label>
            <input
              type="text"
              placeholder="Search variation..."
              value={variationNameFilter}
              onChange={(e) => setVariationNameFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11.5px] font-medium text-slate-600 mb-1">Search By</label>
            <select
              value={searchByFilter}
              onChange={(e) => setSearchByFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-hidden cursor-pointer"
            >
              <option value="All">All Departments</option>
              <option value="Quantity">Quantity</option>
              <option value="Portion">Portion</option>
              <option value="Size">Size</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info(`Found ${filteredVariants.length} variations`)}
              className="flex-1 rounded-lg border border-teal-600 bg-white px-3 py-1.5 text-[12.5px] font-medium text-teal-600 hover:bg-teal-50 transition cursor-pointer"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setVariationNameFilter("");
                setSearchByFilter("All");
                toast.info("Showing all variations");
              }}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Show All
            </button>
          </div>
        </div>

        <div className="text-[11.5px] text-slate-400 mt-2">
          Note : Drag row to change order/rank variations
        </div>
      </div>

      {/* 3. PosDataGrid with DataTableHeader */}
      <PosDataGrid<ScheduleVariantItem>
        data={filteredVariants}
        columns={columns}
        isLoading={isLoading || isFetching}
        enableSelection={true}
        selectedRowIds={selectedIds}
        onSelectionChange={setSelectedIds}
        enablePagination={true}
        pageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage="No variations found matching filters."
      />
    </div>
  );
}
