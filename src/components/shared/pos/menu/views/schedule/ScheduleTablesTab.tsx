import { useState, useMemo } from "react";
import {
  Plus,
  Percent,
  ChevronDown,
  Edit2,
  Copy,
  QrCode,
} from "lucide-react";
import {
  useScheduleTables,
  useToggleScheduleTable,
  useAddScheduleTable,
} from "@/hooks/queries/usePosMenu";
import type { ScheduleTableItem } from "@/types/posMenu";
import { PosDataGrid, type DataGridColumn } from "@/components/ui/data-grid";
import { toast } from "sonner";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";

export function ScheduleTablesTab() {
  const { data: tables, isLoading, isFetching } = useScheduleTables();
  const toggleMutation = useToggleScheduleTable();
  const addMutation = useAddScheduleTable();

  const [activeSubTab, setActiveSubTab] = useState<"Tables" | "Areas">("Tables");
  const [tableNoFilter, setTableNoFilter] = useState("");
  const [selectedArea, setSelectedArea] = useState("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(10);

  // New Table Modal
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [newTableNo, setNewTableNo] = useState("");
  const [newAreaName, setNewAreaName] = useState("Garden");
  const [newCapacity, setNewCapacity] = useState("4");

  const areas = useMemo(
    () => ["All", ...Array.from(new Set(tables?.map((t) => t.areaName) ?? []))],
    [tables],
  );

  const filteredTables = useMemo(() => {
    return (tables ?? []).filter((t) => {
      if (tableNoFilter && !t.tableNo.toLowerCase().includes(tableNoFilter.toLowerCase())) {
        return false;
      }
      if (selectedArea !== "All" && t.areaName !== selectedArea) {
        return false;
      }
      return true;
    });
  }, [tables, tableNoFilter, selectedArea]);

  const handleToggle = (id: string, tableNo: string, current: boolean) => {
    toggleMutation.mutate(id, {
      onSuccess: () => {
        toast.success(`Table ${tableNo} is now ${!current ? "Enabled" : "Disabled"}`);
      },
    });
  };

  const handleAddTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNo.trim()) {
      toast.error("Please enter a table number/code");
      return;
    }

    addMutation.mutate(
      {
        tableNo: newTableNo.trim(),
        areaName: newAreaName,
        noOfPersons: parseInt(newCapacity) || 4,
      },
      {
        onSuccess: () => {
          toast.success(`Table ${newTableNo} added to ${newAreaName}`);
          setNewTableNo("");
          setIsAddTableOpen(false);
        },
      },
    );
  };

  const columns: DataGridColumn<ScheduleTableItem>[] = useMemo(
    () => [
      {
        id: "tableNo",
        header: "Table No",
        accessorKey: "tableNo",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 120,
        cell: ({ row }) => <span className="font-bold text-slate-900">{row.tableNo}</span>,
      },
      {
        id: "noOfPersons",
        header: "No. Of Persons",
        accessorKey: "noOfPersons",
        enableSorting: true,
        enableFiltering: true,
        align: "center",
        minWidth: 120,
        cell: ({ row }) => <span className="text-slate-600">{row.noOfPersons ?? 4}</span>,
      },
      {
        id: "extraInfo",
        header: "Extra Information",
        accessorKey: "extraInfo",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 150,
        cell: ({ row }) => (
          <span className="text-slate-400 text-[12px]">{row.extraInfo ?? "—"}</span>
        ),
      },
      {
        id: "areaName",
        header: "Area Name",
        accessorKey: "areaName",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 140,
        cell: ({ row }) => (
          <span className="font-medium text-slate-700">{row.areaName}</span>
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
          <button
            type="button"
            onClick={() => handleToggle(row.id, row.tableNo, row.status)}
            className={`relative inline-flex h-5 w-10 items-center rounded-full transition cursor-pointer ${
              row.status ? "bg-teal-600" : "bg-slate-300"
            }`}
            title="Toggle table active"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                row.status ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        ),
      },
      {
        id: "discountPct",
        header: "Discount (%)",
        accessorKey: "discountPct",
        enableSorting: true,
        enableFiltering: true,
        align: "right",
        minWidth: 110,
        cell: ({ row }) => (
          <span className="text-slate-600 font-mono">
            {row.discountPct ? `${row.discountPct}%` : "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Action",
        align: "right",
        minWidth: 120,
        sortable: false,
        filterable: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5 text-slate-400">
            <button
              type="button"
              onClick={() => toast.success(`Duplicated table ${row.tableNo}`)}
              className="p-1 hover:text-teal-600 hover:bg-slate-100 rounded transition cursor-pointer"
              title="Duplicate Table"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => toast.info(`Editing table ${row.tableNo}`)}
              className="p-1 hover:text-teal-600 hover:bg-slate-100 rounded transition cursor-pointer"
              title="Edit Table"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => toast.info(`QR Code downloaded for ${row.tableNo}`)}
              className="p-1 hover:text-teal-600 hover:bg-slate-100 rounded transition cursor-pointer"
              title="QR Code"
            >
              <QrCode className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      {/* 1. Header and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-slate-500">Menu</span>
          <span className="text-[13px] text-slate-400">›</span>
          <span className="text-[14px] font-bold text-slate-900">Table Configuration</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddTableOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Table
          </button>
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Action <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={() => toast.info("Area management drawer opened")}
            className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Manage Area
          </button>
          <button
            type="button"
            onClick={() => toast.info("Set Table Discount rules dialog opened")}
            className="flex items-center gap-1 rounded-lg bg-teal-50 border border-teal-200 px-3 py-1.5 text-[12.5px] font-semibold text-teal-700 hover:bg-teal-100 transition cursor-pointer"
          >
            <Percent className="h-3.5 w-3.5" />
            Set Table Discount
          </button>
        </div>
      </div>

      {/* 2. Sub Tabs: Tables & Areas */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveSubTab("Tables")}
          className={`border-b-2 px-6 py-2.5 text-[13px] font-bold transition cursor-pointer ${
            activeSubTab === "Tables"
              ? "border-teal-600 text-teal-700 font-bold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Tables
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("Areas")}
          className={`border-b-2 px-6 py-2.5 text-[13px] font-bold transition cursor-pointer ${
            activeSubTab === "Areas"
              ? "border-teal-600 text-teal-700 font-bold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          Areas
        </button>
      </div>

      {/* 3. Filter Bar */}
      <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11.5px] font-medium text-slate-600 mb-1">
              Table Number
            </label>
            <input
              type="text"
              placeholder="Search table no..."
              value={tableNoFilter}
              onChange={(e) => setTableNoFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11.5px] font-medium text-slate-600 mb-1">
              Select Area
            </label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-hidden cursor-pointer"
            >
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info(`Filtered: ${filteredTables.length} tables found`)}
              className="flex-1 rounded-lg bg-teal-600 px-4 py-1.5 text-[12.5px] font-medium text-white hover:bg-teal-700 transition cursor-pointer shadow-xs"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setTableNoFilter("");
                setSelectedArea("All");
                toast.info("Showing all tables");
              }}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Show All
            </button>
          </div>
        </div>
      </div>

      {/* 4. PosDataGrid with DataTableHeader */}
      <PosDataGrid<ScheduleTableItem>
        data={filteredTables}
        columns={columns}
        isLoading={isLoading || isFetching}
        enableSelection={true}
        selectedRowIds={selectedIds}
        onSelectionChange={setSelectedIds}
        enablePagination={true}
        pageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage="No tables found matching filters."
      />

      <PosCreatePanel
        open={isAddTableOpen}
        onClose={() => setIsAddTableOpen(false)}
        title="Add New Table"
        description="Create a dining table for this outlet."
        icon={Plus}
        onSubmit={handleAddTableSubmit}
        footer={
          <>
            <PosCreateCancelButton onClick={() => setIsAddTableOpen(false)} />
            <PosCreateSubmitButton>Save Table</PosCreateSubmitButton>
          </>
        }
      >
        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
            Table Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. T-12, A-04"
            value={newTableNo}
            onChange={(e) => setNewTableNo(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-[13.5px] focus:outline-hidden focus:border-teal-500"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Area</label>
          <select
            value={newAreaName}
            onChange={(e) => setNewAreaName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13.5px] focus:outline-hidden focus:border-teal-500 cursor-pointer"
          >
            <option value="Garden">Garden</option>
            <option value="AC Main Hall">AC Main Hall</option>
            <option value="Rooftop Lounge">Rooftop Lounge</option>
            <option value="Family Section">Family Section</option>
          </select>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
            Capacity (No. of Persons)
          </label>
          <input
            type="number"
            placeholder="4"
            value={newCapacity}
            onChange={(e) => setNewCapacity(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-[13.5px] focus:outline-hidden focus:border-teal-500"
          />
        </div>
      </PosCreatePanel>
    </div>
  );
}
