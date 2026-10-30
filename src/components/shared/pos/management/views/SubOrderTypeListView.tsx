import { useState, useMemo, useEffect } from "react";
import { Plus, ChevronDown, Search, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid";
import { useOutletContext } from "@/context/PosOutletContext";
import { posManagementService } from "@/services/posManagementService";

interface SubOrderTypeItem {
  id: string;
  name: string;
  type: "Default Order Type" | "Area" | "Third Party Integration";
  orderType: string;
  status: "Active" | "Inactive";
  created: string;
}

export function SubOrderTypeListView() {
  const { activeOutlet } = useOutletContext();
  const [searchName, setSearchName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  // Exact data rows matching Screenshot 2
  const [items, setItems] = useState<SubOrderTypeItem[]>([]);

  useEffect(() => {
    if (!activeOutlet?.id) return;
    setLoading(true);
    posManagementService
      .getSubOrderTypes(activeOutlet.id)
      .then((res) => {
        setItems(
          (res || []).map((r) => ({
            id: r.id,
            name: r.name,
            type: (r.type as any) || "Area",
            orderType: r.order_type || "Dine In",
            status: (r.status as any) || "Active",
            created: r.created_at ? new Date(r.created_at).toLocaleDateString() : "Today",
          }))
        );
      })
      .catch((err) => {
        console.warn("[SubOrderTypes] Fallback to default records:", err);
      })
      .finally(() => setLoading(false));
  }, [activeOutlet?.id]);

  const columns: PosDataGridColumn<SubOrderTypeItem>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        sortable: true,
        filterable: true,
        defaultWidth: 180,
        getValue: (r) => r.name,
        cell: ({ row }) => <span className="font-medium text-slate-900">{row.name}</span>,
      },
      {
        id: "type",
        label: "Type",
        sortable: true,
        filterable: true,
        defaultWidth: 200,
        getValue: (r) => r.type,
        cell: ({ row }) => <span className="text-slate-600">{row.type}</span>,
      },
      {
        id: "orderType",
        label: "Order Type",
        sortable: true,
        filterable: true,
        defaultWidth: 170,
        getValue: (r) => r.orderType,
        cell: ({ row }) => <span className="text-slate-600">{row.orderType}</span>,
      },
      {
        id: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        align: "center",
        defaultWidth: 120,
        getValue: (r) => r.status,
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
            {row.status}
          </span>
        ),
      },
      {
        id: "created",
        label: "Created",
        sortable: true,
        defaultWidth: 140,
        getValue: (r) => r.created,
        cell: ({ row }) => <span className="text-slate-500 font-mono text-[12px]">{row.created}</span>,
      },
      {
        id: "actions",
        label: "Actions",
        sortable: false,
        filterable: false,
        align: "right",
        defaultWidth: 110,
        cell: ({ row }) => (
          <div className="inline-flex items-center gap-1.5 text-slate-400">
            <button
              type="button"
              onClick={() => toast.info(`Editing ${row.name}`)}
              className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-teal-600 transition cursor-pointer"
              title="Edit"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setItems((prev) => prev.filter((i) => i.id !== row.id));
                toast.success(`Removed ${row.name}`);
              }}
              className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-red-600 transition cursor-pointer"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchName.toLowerCase()),
    );
  }, [items, searchName]);

  return (
    <div className="space-y-4">
      {/* 1. Header Bar matching Screenshot 2 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Sub Order Type</h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toast.info("Opening Add Sub Order Type dialog")}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Sub Order Type
          </button>

          <button
            type="button"
            onClick={() => toast.info("Sub Order Type Actions")}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Action <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 2. Filter Bar matching Screenshot 2 */}
      <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-end gap-3 max-w-xl">
          <div className="space-y-1 flex-1 min-w-[200px]">
            <label className="text-[11.5px] font-semibold text-slate-600">
              Sub Order Type Name
            </label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => {
                setSearchName(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search name"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info(`Found ${filteredItems.length} matching types`)}
              className="rounded-lg bg-teal-600 px-5 py-1.5 text-[12.5px] font-semibold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchName("");
                setCurrentPage(1);
                toast.info("Showing all order types");
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              Show All
            </button>
          </div>
        </div>
      </div>

      {/* 3. Table with PosDataGrid */}
      <PosDataGrid
        data={filteredItems}
        columns={columns}
        keyField="id"
        selectable
        selectedRowIds={selectedIds}
        onSelectionChange={(ids: any) => setSelectedIds(ids as string[])}
        storageKey="pos-sub-order-types"
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        themeVariant="primary"
        itemName="sub order types"
      />
    </div>
  );
}
