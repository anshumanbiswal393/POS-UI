import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ColorActionEdit, ColorActionDelete } from "@/components/common/ColorActionIcons";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid/PosDataGrid";

interface DistanceTier {
  id: string;
  fromKm: number;
  toKm: number;
  charge: number;
  minOrder: number;
  status: "Active" | "Inactive";
}

export function DeliveryDistanceView() {
  const [distanceTiers, setDistanceTiers] = useState<DistanceTier[]>([
    { id: "1", fromKm: 0, toKm: 3, charge: 0, minOrder: 150, status: "Active" },
    { id: "2", fromKm: 3, toKm: 7, charge: 35, minOrder: 250, status: "Active" },
    { id: "3", fromKm: 7, toKm: 12, charge: 60, minOrder: 400, status: "Active" },
    { id: "4", fromKm: 12, toKm: 18, charge: 95, minOrder: 600, status: "Active" },
  ]);

  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const columns: PosDataGridColumn<DistanceTier>[] = useMemo(
    () => [
      {
        id: "range",
        header: "Distance Range",
        sortable: true,
        filterable: true,
        defaultWidth: 180,
        render: (_, row) => <span className="font-medium text-slate-800">{row.fromKm} km - {row.toKm} km</span>,
      },
      {
        id: "charge",
        header: "Delivery Charge (₹)",
        accessorKey: "charge",
        sortable: true,
        filterable: true,
        align: "right",
        defaultWidth: 170,
        render: (_, row) => <span className="font-mono font-bold text-slate-900">₹{row.charge}</span>,
      },
      {
        id: "minOrder",
        header: "Min Order Amount (₹)",
        accessorKey: "minOrder",
        sortable: true,
        filterable: true,
        align: "right",
        defaultWidth: 180,
        render: (_, row) => <span className="font-mono text-slate-600">₹{row.minOrder}</span>,
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        sortable: true,
        filterable: true,
        align: "center",
        defaultWidth: 120,
        render: (_, row) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
            {row.status}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        sortable: false,
        filterable: false,
        align: "right",
        defaultWidth: 110,
        render: (_, row) => (
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => toast.info(`Editing tier ${row.fromKm}-${row.toKm} km`)}
              className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-300 bg-white hover:border-amber-500 hover:bg-amber-50/60 shadow-2xs transition cursor-pointer"
              title="Edit"
            >
              <ColorActionEdit className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setDistanceTiers((prev) => prev.filter((i) => i.id !== row.id));
                toast.success(`Removed tier`);
              }}
              className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-300 bg-white hover:border-rose-500 hover:bg-rose-50/60 shadow-2xs transition cursor-pointer"
              title="Delete"
            >
              <ColorActionDelete className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Delivery Distance</h2>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            Configure delivery radius tiers and progressive delivery fee calculations based on store
            GPS coordinates.
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.info("Add distance tier modal")}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Distance Tier
        </button>
      </div>

      <PosDataGrid
        data={distanceTiers}
        columns={columns}
        keyField="id"
        selectable
        selectedRowIds={selectedIds}
        onSelectionChange={(ids: any) => setSelectedIds(ids as string[])}
        storageKey="pos-delivery-distance-tiers"
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        themeVariant="primary"
        itemName="distance tiers"
      />
    </div>
  );
}
