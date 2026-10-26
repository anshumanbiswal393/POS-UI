import { useState, useMemo, useEffect } from "react";
import { Plus, ChevronDown, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid/PosDataGrid";
import { useOutletContext } from "@/context/PosOutletContext";
import { posManagementService } from "@/services/posManagementService";

interface AreaDeliveryCharge {
  id: string;
  areaName: string;
  city: string;
  pincode: string;
  deliveryCharge: number;
  minOrder: number;
  estimatedTime: string;
  status: "Active" | "Inactive";
}

export function AreaDeliveryChargesListView() {
  const { activeOutlet } = useOutletContext();
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchArea, setSearchArea] = useState("");
  const [loading, setLoading] = useState(false);

  const [records, setRecords] = useState<AreaDeliveryCharge[]>([
    {
      id: "1",
      areaName: "Karadagadia Main Chowk",
      city: "Angul",
      pincode: "759132",
      deliveryCharge: 25,
      minOrder: 150,
      estimatedTime: "20-30 mins",
      status: "Active",
    },
    {
      id: "2",
      areaName: "Nalco Township Sector 1-4",
      city: "Angul",
      pincode: "759145",
      deliveryCharge: 40,
      minOrder: 250,
      estimatedTime: "30-40 mins",
      status: "Active",
    },
    {
      id: "3",
      areaName: "Jagannath Vihar Colony",
      city: "Angul",
      pincode: "759122",
      deliveryCharge: 30,
      minOrder: 200,
      estimatedTime: "25-35 mins",
      status: "Active",
    },
    {
      id: "4",
      areaName: "Gandhi Marg Commercial Hub",
      city: "Angul",
      pincode: "759122",
      deliveryCharge: 20,
      minOrder: 150,
      estimatedTime: "15-25 mins",
      status: "Active",
    },
    {
      id: "5",
      areaName: "Bantala Industrial Extension",
      city: "Angul",
      pincode: "759128",
      deliveryCharge: 60,
      minOrder: 400,
      estimatedTime: "40-50 mins",
      status: "Inactive",
    },
  ]);

  useEffect(() => {
    if (!activeOutlet?.id) return;
    setLoading(true);
    posManagementService
      .getAreaDeliveryCharges(activeOutlet.id)
      .then((data) => {
        if (data && data.length > 0) {
          setRecords(
            data.map((item: any) => ({
              id: String(item.id),
              areaName: item.area_name || item.areaName,
              city: item.city || "Angul",
              pincode: item.pincode || "",
              deliveryCharge: Number(item.delivery_charge ?? item.deliveryCharge ?? 0),
              minOrder: Number(item.min_order_amount ?? item.minOrder ?? 0),
              estimatedTime: item.estimated_delivery_time || item.estimatedTime || "25-35 mins",
              status: item.is_active ? "Active" : "Inactive",
            }))
          );
        }
      })
      .catch((err) => {
        console.warn("Could not fetch area delivery charges:", err);
      })
      .finally(() => setLoading(false));
  }, [activeOutlet?.id]);

  const columns: PosDataGridColumn<AreaDeliveryCharge>[] = useMemo(
    () => [
      {
        id: "areaName",
        header: "Area / Locality Name",
        accessorKey: "areaName",
        sortable: true,
        filterable: true,
        defaultWidth: 220,
        render: (_, r) => (
          <div>
            <div className="font-semibold text-slate-900">{r.areaName}</div>
            <div className="text-[11.5px] text-slate-500">{r.city}</div>
          </div>
        ),
      },
      {
        id: "pincode",
        header: "Pincode",
        accessorKey: "pincode",
        sortable: true,
        filterable: true,
        defaultWidth: 120,
        render: (_, r) => <span className="font-mono text-slate-700 font-medium">{r.pincode}</span>,
      },
      {
        id: "deliveryCharge",
        header: "Delivery Fee (₹)",
        accessorKey: "deliveryCharge",
        sortable: true,
        filterable: true,
        align: "right",
        defaultWidth: 140,
        render: (_, r) => <span className="font-mono font-bold text-slate-900">₹{r.deliveryCharge}</span>,
      },
      {
        id: "minOrder",
        header: "Min Order (₹)",
        accessorKey: "minOrder",
        sortable: true,
        filterable: true,
        align: "right",
        defaultWidth: 140,
        render: (_, r) => <span className="font-mono text-slate-600">₹{r.minOrder}</span>,
      },
      {
        id: "estimatedTime",
        header: "Est. Time",
        accessorKey: "estimatedTime",
        sortable: true,
        defaultWidth: 140,
        render: (_, r) => <span className="text-slate-600">{r.estimatedTime}</span>,
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        sortable: true,
        filterable: true,
        align: "center",
        defaultWidth: 120,
        render: (_, r) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
              r.status === "Active"
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : "bg-slate-100 text-slate-500 border border-slate-200"
            }`}
          >
            {r.status}
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
        render: (_, r) => (
          <div className="inline-flex items-center gap-1.5 text-slate-400">
            <button
              type="button"
              onClick={() => toast.info(`Editing ${r.areaName}`)}
              className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-teal-600 transition cursor-pointer"
              title="Edit"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setRecords((prev) => prev.filter((item) => item.id !== r.id));
                toast.success(`Removed ${r.areaName}`);
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

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== "All" && r.status !== statusFilter) return false;
      if (searchArea.trim()) {
        const q = searchArea.toLowerCase();
        const matchName = r.areaName.toLowerCase().includes(q);
        const matchPin = r.pincode.includes(q);
        if (!matchName && !matchPin) return false;
      }
      return true;
    });
  }, [records, statusFilter, searchArea]);

  return (
    <div className="space-y-4">
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
          Area/Locality Wise Delivery Charges
        </h2>

        <button
          type="button"
          onClick={() => toast.info("Configure Area/Locality Delivery Fee")}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Area/Locality Wise Delivery Charges
        </button>
      </div>

      {/* 2. Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1 min-w-[180px]">
            <label className="text-[11.5px] font-semibold text-slate-600">Select Status</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1 min-w-[200px]">
            <label className="text-[11.5px] font-semibold text-slate-600">Search Locality / Pincode</label>
            <input
              type="text"
              placeholder="Search area name or pin..."
              value={searchArea}
              onChange={(e) => setSearchArea(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info(`Filtered ${filteredRecords.length} delivery charge areas`)}
              className="rounded-lg bg-teal-600 px-5 py-1.5 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("All");
                setSearchArea("");
                toast.info("Showing all delivery charges");
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              Show All
            </button>
          </div>
        </div>
      </div>

      {/* 3. PosDataGrid */}
      <PosDataGrid
        data={filteredRecords}
        columns={columns}
        storageKey="pos-area-delivery-charges"
        selectable
        itemName="localities"
        themeVariant="primary"
      />
    </div>
  );
}
