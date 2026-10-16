import { useState, useMemo } from "react";
import { ChevronDown, Search, Truck, MapPin, CheckCircle2, Clock, Eye, Phone } from "lucide-react";
import { toast } from "sonner";
import {
  DataTableHeader,
  DataTableFooter,
  type DataTableColumn,
} from "@/components/common";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";

interface DeliveryOrder {
  id: string;
  orderNo: string;
  provider: string;
  customerName: string;
  customerPhone: string;
  address: string;
  riderName: string;
  riderPhone: string;
  amount: number;
  status: "Assigned" | "Out for Delivery" | "Delivered" | "Cancelled";
  time: string;
}

export function DeliveryManagementView() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [provider, setProvider] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ colId: string; direction: "asc" | "desc" } | null>(null);

  const [orders, setOrders] = useState<DeliveryOrder[]>([
    {
      id: "del-1",
      orderNo: "ORD-9481",
      provider: "Swiggy",
      customerName: "Siddharth Dash",
      customerPhone: "+91 98451 22910",
      address: "Flat 402, Royal Residency, Angul",
      riderName: "Rakesh Nayak",
      riderPhone: "+91 82491 55102",
      amount: 680,
      status: "Out for Delivery",
      time: "12 mins ago",
    },
    {
      id: "del-2",
      orderNo: "ORD-9479",
      provider: "Zomato",
      customerName: "Priyanka Mishra",
      customerPhone: "+91 70081 99241",
      address: "Plot 12, Jagannath Vihar, Angul",
      riderName: "Debasis Sahoo",
      riderPhone: "+91 94371 88410",
      amount: 1250,
      status: "Delivered",
      time: "28 mins ago",
    },
    {
      id: "del-3",
      orderNo: "ORD-9475",
      provider: "Direct Fleet",
      customerName: "Alok Patnaik",
      customerPhone: "+91 99370 12845",
      address: "Near Nalco Township Gate 2, Angul",
      riderName: "Sunil Behera",
      riderPhone: "+91 80931 44710",
      amount: 890,
      status: "Delivered",
      time: "45 mins ago",
    },
    {
      id: "del-4",
      orderNo: "ORD-9470",
      provider: "Shadowfax",
      customerName: "Kishore Jena",
      customerPhone: "+91 97781 33620",
      address: "Mishra Colony, Karadagadia, Angul",
      riderName: "Bikash Barik",
      riderPhone: "+91 91240 77319",
      amount: 430,
      status: "Assigned",
      time: "5 mins ago",
    },
  ]);

  const days = ["27th Aug", "28th Aug", "29th Aug", "30th Aug", "31st Aug", "1st Sep", "2nd Sep"];

  const columns: DataTableColumn<DeliveryOrder>[] = useMemo(
    () => [
      {
        id: "orderNo",
        label: "Order #",
        sortable: true,
        filterable: true,
        defaultWidth: 120,
        getValue: (r) => r.orderNo,
      },
      {
        id: "provider",
        label: "Provider",
        sortable: true,
        filterable: true,
        defaultWidth: 140,
        getValue: (r) => r.provider,
      },
      {
        id: "customer",
        label: "Customer & Address",
        sortable: true,
        filterable: true,
        defaultWidth: 240,
        getValue: (r) => `${r.customerName} ${r.address}`,
      },
      {
        id: "rider",
        label: "Delivery Rider",
        sortable: true,
        filterable: true,
        defaultWidth: 180,
        getValue: (r) => `${r.riderName} ${r.riderPhone}`,
      },
      {
        id: "amount",
        label: "Amount (₹)",
        sortable: true,
        filterable: true,
        align: "right",
        defaultWidth: 130,
        getValue: (r) => `₹${r.amount.toLocaleString("en-IN")}`,
      },
      {
        id: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        align: "center",
        defaultWidth: 140,
        getValue: (r) => r.status,
      },
      {
        id: "actions",
        label: "Actions",
        sortable: false,
        filterable: false,
        align: "right",
        defaultWidth: 100,
      },
    ],
    [],
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (provider !== "All" && o.provider.toLowerCase() !== provider.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = o.orderNo.toLowerCase().includes(q);
        const matchCust = o.customerName.toLowerCase().includes(q);
        const matchRider = o.riderName.toLowerCase().includes(q);
        if (!matchNo && !matchCust && !matchRider) return false;
      }
      return true;
    });
  }, [orders, provider, searchQuery]);

  const sortedOrders = useMemo(() => {
    if (!sortConfig) return filteredOrders;
    return [...filteredOrders].sort((a, b) => {
      const field = sortConfig.colId as keyof DeliveryOrder;
      const aVal = a[field];
      const bVal = b[field];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredOrders, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedOrders = sortedOrders.slice((validPage - 1) * pageSize, validPage * pageSize);

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedOrders.map((o) => o.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-4">
      {/* 1. Top Header Bar matching Screenshot 4 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Delivery Management</h2>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-semibold text-slate-700 border border-slate-200">
            • Credit Remaining: <span className="font-mono font-bold text-slate-900">₹ 0</span>
          </div>

          <div className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-semibold text-slate-700 border border-slate-200">
            • Credit Purchase Till Now:{" "}
            <span className="font-mono font-bold text-slate-900">₹ 0</span>
          </div>

          <ExportToExcelButton
            onClick={() => toast.success("Exporting Delivery orders to Excel...")}
          />
        </div>
      </div>

      {/* 2. Filter Bar matching Screenshot 4 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-[11.5px] font-semibold text-slate-600">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11.5px] font-semibold text-slate-600">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
            />
          </div>

          <div className="space-y-1 min-w-[150px]">
            <label className="text-[11.5px] font-semibold text-slate-600">Select Provider</label>
            <div className="relative">
              <select
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
              >
                <option value="All">All Providers</option>
                <option value="Swiggy">Swiggy</option>
                <option value="Zomato">Zomato</option>
                <option value="Direct Fleet">Direct Fleet</option>
                <option value="Shadowfax">Shadowfax</option>
                <option value="Dunzo">Dunzo</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1 min-w-[200px]">
            <label className="text-[11.5px] font-semibold text-slate-600">Search</label>
            <input
              type="text"
              placeholder="Search Order #, Customer, Rider..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info(`Found ${filteredOrders.length} delivery records`)}
              className="rounded-lg bg-teal-600 px-5 py-1.5 text-[12.5px] font-semibold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setProvider("All");
                setSearchQuery("");
                setCurrentPage(1);
                toast.info("Showing all delivery orders");
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              Show All
            </button>
          </div>
        </div>
      </div>

      {/* 3. Charts Row matching Screenshot 4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Donut Chart: Last 7 Days Orders */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <h4 className="text-[14px] font-bold text-slate-900">Last 7 Days Orders</h4>
          <div className="flex items-center justify-center gap-8 py-4">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute font-bold text-slate-800 text-[22px]">4</div>
            </div>

            <div className="space-y-2 text-[12.5px]">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                <span className="text-slate-600">No. of Orders</span>
                <span className="font-mono font-bold text-slate-800 ml-auto">4</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                <span className="text-slate-600">No. of Third Party Orders</span>
                <span className="font-mono font-bold text-slate-800 ml-auto">3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Chart: Last 7 Days - Delivered Orders */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <h4 className="text-[14px] font-bold text-slate-900">Last 7 Days - Delivered Orders</h4>
          <div className="h-28 flex items-end justify-between border-b border-slate-200 px-2 pb-2">
            {days.map((day) => (
              <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
                <div className="h-8 w-full bg-teal-100 dark:bg-teal-900/40 rounded-t-md flex items-center justify-center text-[10px] font-bold text-teal-700" />
                <span className="text-[10px] text-slate-400 whitespace-nowrap">{day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Structured Data Table with DataTableHeader & DataTableFooter */}
      <div className="rounded-2xl border border-slate-300 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <DataTableHeader
              columns={columns}
              data={sortedOrders}
              selectable
              isAllSelected={selectedIds.length === sortedOrders.length && sortedOrders.length > 0}
              isSomeSelected={selectedIds.length > 0 && selectedIds.length < sortedOrders.length}
              onToggleSelectAll={toggleSelectAll}
              sortConfig={sortConfig}
              onSortChange={setSortConfig}
              themeVariant="primary"
            />
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 text-center text-slate-400">
                    No matching delivery orders found.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition">
                    <td className="w-12 px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(o.id)}
                        onChange={() => toggleSelect(o.id)}
                        className="rounded border-slate-300 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{o.orderNo}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {o.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{o.customerName}</div>
                      <div className="text-[11.5px] text-slate-500">{o.address}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{o.riderName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{o.riderPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      ₹{o.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          o.status === "Delivered"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : o.status === "Out for Delivery"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-sky-50 text-sky-700 border border-sky-200"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => toast.info(`Viewing details for ${o.orderNo}`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 transition cursor-pointer"
                        title="Track Order"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DataTableFooter
          currentPage={validPage}
          totalCount={sortedOrders.length}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          onPageChange={setCurrentPage}
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          itemName="orders"
        />
      </div>
    </div>
  );
}
