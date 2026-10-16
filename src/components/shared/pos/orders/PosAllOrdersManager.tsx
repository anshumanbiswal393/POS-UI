import { useState, useEffect, useMemo } from "react";
import {
  Search,
  ChevronDown,
  Eye,
  Printer,
  Edit,
  RotateCcw,
  Split,
  Calendar,
  X,
  LayoutGrid,
  Table2,
} from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAllOrders } from "@/hooks/queries/usePosOrders";
import type { AllOrderItem } from "@/types/posOrders";
import {
  PosDataGrid,
  ChooseColumnsMenu,
  type PosDataGridColumn,
  type DataTableColumn,
} from "@/components/ui/data-grid";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import { exportToExcel } from "@/utils/exportUtils";
import { toast } from "sonner";

const EXTENDED_MOCK_RECORDS: (AllOrderItem & { tableNo?: string; customerPhone?: string })[] = [
  {
    id: "ord-10519",
    orderNo: "10519",
    orderTypeDisplay: "Dine In (G41) (Garden)",
    tableNo: "G41",
    customerName: "Rahul Mehta",
    customerPhone: "9876543210",
    assignTo: "Sunil (Captain)",
    itemsSummary: "Bp Reserve 180, Budweiser Magnum (650 Ml), Carlsberg Elephant 650 Ml",
    myAmountFormatted: "₹ 2,890.00",
    taxAmountFormatted: "₹ 0.00",
    discountAmountFormatted: "(0.00)",
    grandTotalFormatted: "₹ 2,890.00",
    paymentMode: "Cash",
    status: "Printed",
    createdAt: "31 Aug 2026 22:16:49",
  },
  {
    id: "ord-10518",
    orderNo: "10518",
    orderTypeDisplay: "Dine In (B23) (Bar)",
    tableNo: "B23",
    customerName: "Vikram Malhotra",
    customerPhone: "9811223344",
    assignTo: "Amit",
    itemsSummary: "Butter Chicken (Half), Garlic Naan (2), Tandoori Roti (4), Carlsberg Elephant",
    myAmountFormatted: "₹ 1,850.00",
    taxAmountFormatted: "₹ 92.50",
    discountAmountFormatted: "(0.00)",
    grandTotalFormatted: "₹ 1,942.50",
    paymentMode: "Card",
    status: "Settled",
    createdAt: "31 Aug 2026 21:45:12",
  },
  {
    id: "ord-10517",
    orderNo: "10517",
    orderTypeDisplay: "Zomato #4829",
    customerName: "Pooja Sharma",
    customerPhone: "9899887766",
    assignTo: "Online Desk",
    itemsSummary: "Paneer Butter Masala, Jeera Rice, Dal Makhani",
    myAmountFormatted: "₹ 780.00",
    taxAmountFormatted: "₹ 39.00",
    discountAmountFormatted: "(50.00)",
    grandTotalFormatted: "₹ 769.00",
    paymentMode: "UPI",
    status: "Completed",
    createdAt: "31 Aug 2026 21:12:00",
    isOnlineOrder: true,
  },
  {
    id: "ord-10516",
    orderNo: "10516",
    orderTypeDisplay: "Room 204 (Deluxe)",
    tableNo: "204",
    customerName: "Aman Singhal",
    customerPhone: "9712345678",
    assignTo: "Ramesh",
    itemsSummary: "Club Sandwich, French Fries, Cold Coffee (2)",
    myAmountFormatted: "₹ 640.00",
    taxAmountFormatted: "₹ 32.00",
    discountAmountFormatted: "(0.00)",
    grandTotalFormatted: "₹ 672.00",
    paymentMode: "Due",
    status: "Settled",
    createdAt: "31 Aug 2026 20:30:22",
  },
  {
    id: "ord-10515",
    orderNo: "10515",
    orderTypeDisplay: "Dine In (AC-04)",
    tableNo: "AC-04",
    customerName: "Deepak Grover",
    customerPhone: "9988776655",
    assignTo: "Sunil",
    itemsSummary: "Mutton Rogan Josh, Butter Naan (3), Sweet Lassi (2)",
    myAmountFormatted: "₹ 1,420.00",
    taxAmountFormatted: "₹ 71.00",
    discountAmountFormatted: "(100.00)",
    grandTotalFormatted: "₹ 1,391.00",
    paymentMode: "Split",
    status: "Settled",
    createdAt: "31 Aug 2026 20:05:14",
    isSplitBill: true,
  },
  {
    id: "ord-10514",
    orderNo: "10514",
    orderTypeDisplay: "Takeaway #102",
    customerName: "Sneha Kapoor",
    customerPhone: "9811002233",
    assignTo: "Counter",
    itemsSummary: "Veg Biryani, Raita, Gulab Jamun (2 pcs)",
    myAmountFormatted: "₹ 450.00",
    taxAmountFormatted: "₹ 22.50",
    discountAmountFormatted: "(0.00)",
    grandTotalFormatted: "₹ 472.50",
    paymentMode: "UPI",
    status: "Completed",
    createdAt: "31 Aug 2026 19:40:10",
  },
  {
    id: "ord-10513",
    orderNo: "10513",
    orderTypeDisplay: "Swiggy #9182",
    customerName: "Karan Johar",
    customerPhone: "9811099887",
    assignTo: "Online Desk",
    itemsSummary: "Chicken Tikka Biryani (2), Cold Coffee (2)",
    myAmountFormatted: "₹ 1,120.00",
    taxAmountFormatted: "₹ 56.00",
    discountAmountFormatted: "(0.00)",
    grandTotalFormatted: "₹ 1,176.00",
    paymentMode: "UPI",
    status: "Completed",
    createdAt: "31 Aug 2026 19:15:33",
    isOnlineOrder: true,
  },
  {
    id: "ord-10512",
    orderNo: "10512",
    orderTypeDisplay: "Dine In (G12) (Garden)",
    tableNo: "G12",
    customerName: "Anil Ambani",
    customerPhone: "9900112233",
    assignTo: "Vikas",
    itemsSummary: "Tandoori Chicken (Full), Rumali Roti (6), Kingfisher Ultra (3)",
    myAmountFormatted: "₹ 2,450.00",
    taxAmountFormatted: "₹ 122.50",
    discountAmountFormatted: "(200.00)",
    grandTotalFormatted: "₹ 2,372.50",
    paymentMode: "Card",
    status: "Settled",
    createdAt: "31 Aug 2026 18:50:04",
  },
  {
    id: "ord-10511",
    orderNo: "10511",
    orderTypeDisplay: "Advance Order #09",
    customerName: "Ritu Singhania (Party)",
    customerPhone: "9822334455",
    assignTo: "Manager",
    itemsSummary: "Buffet Booking - 15 Pax (Starter + Main Course + Dessert)",
    myAmountFormatted: "₹ 15,000.00",
    taxAmountFormatted: "₹ 750.00",
    discountAmountFormatted: "(1,000.00)",
    grandTotalFormatted: "₹ 14,750.00",
    paymentMode: "Card",
    status: "Settled",
    createdAt: "31 Aug 2026 17:30:00",
    isAdvanceOrder: true,
  },
  {
    id: "ord-10510",
    orderNo: "10510",
    orderTypeDisplay: "Dine In (AC-01)",
    tableNo: "AC-01",
    customerName: "Mohit Chauhan",
    customerPhone: "9711998877",
    assignTo: "Amit",
    itemsSummary: "Veg Fried Rice, Chilli Paneer Gravy, Spring Rolls",
    myAmountFormatted: "₹ 720.00",
    taxAmountFormatted: "₹ 36.00",
    discountAmountFormatted: "(0.00)",
    grandTotalFormatted: "₹ 756.00",
    paymentMode: "Cash",
    status: "Completed",
    createdAt: "31 Aug 2026 16:10:45",
  },
];

function orderStatusClass(status: AllOrderItem["status"]) {
  if (status === "Printed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Settled") return "bg-teal-50 text-teal-700 border-teal-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export function PosAllOrdersManager() {
  const [activeTab, setActiveTab] = useState<"order" | "advance_order">("order");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [mounted, setMounted] = useState(false);
  // Toggle state: collapsed (Picture 1) vs expanded (Picture 2)
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Filter input form state
  const [startDate, setStartDate] = useState("2026-08-19");
  const [endDate, setEndDate] = useState("2026-09-02");
  const [orderType, setOrderType] = useState("All Order Type");
  const [orderIdInput, setOrderIdInput] = useState("");
  const [customerNameInput, setCustomerNameInput] = useState("");
  const [customerPhoneInput, setCustomerPhoneInput] = useState("");
  const [tableNoInput, setTableNoInput] = useState("");
  const [statusInput, setStatusInput] = useState("All");
  // Applied filter state triggered by "Search" button
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: "2026-08-19",
    endDate: "2026-09-02",
    orderType: "All Order Type",
    orderId: "",
    customerName: "",
    customerPhone: "",
    tableNo: "",
    status: "All",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Selection & Modal states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewingOrder, setViewingOrder] = useState<AllOrderItem | null>(null);
  const [printingOrder, setPrintingOrder] = useState<AllOrderItem | null>(null);

  const { data } = useAllOrders();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = () => {
    setAppliedFilters({
      startDate,
      endDate,
      orderType,
      orderId: orderIdInput.trim(),
      customerName: customerNameInput.trim(),
      customerPhone: customerPhoneInput.trim(),
      tableNo: tableNoInput.trim(),
      status: statusInput,
    });
    setCurrentPage(1);
  };


  const filteredRecords = useMemo(() => {
    return EXTENDED_MOCK_RECORDS.filter((r) => {
      // Tab filter
      if (activeTab === "advance_order" && !r.isAdvanceOrder) return false;
      if (activeTab === "order" && r.isAdvanceOrder) return false;

      // Order Type
      if (appliedFilters.orderType !== "All Order Type") {
        if (appliedFilters.orderType === "Dine In" && !r.orderTypeDisplay.includes("Dine In"))
          return false;
        if (appliedFilters.orderType === "Takeaway" && !r.orderTypeDisplay.includes("Takeaway"))
          return false;
        if (appliedFilters.orderType === "Room Service" && !r.orderTypeDisplay.includes("Room"))
          return false;
        if (
          appliedFilters.orderType === "Online Aggregator" &&
          !r.isOnlineOrder &&
          !r.orderTypeDisplay.includes("Zomato") &&
          !r.orderTypeDisplay.includes("Swiggy")
        )
          return false;
      }

      // Order ID
      if (
        appliedFilters.orderId &&
        !r.orderNo.toLowerCase().includes(appliedFilters.orderId.toLowerCase())
      ) {
        return false;
      }

      // Customer Name
      if (
        appliedFilters.customerName &&
        !r.customerName.toLowerCase().includes(appliedFilters.customerName.toLowerCase())
      ) {
        return false;
      }

      // Customer Phone
      if (
        appliedFilters.customerPhone &&
        !r.customerPhone?.includes(appliedFilters.customerPhone)
      ) {
        return false;
      }

      // Table No
      if (
        appliedFilters.tableNo &&
        !r.tableNo?.toLowerCase().includes(appliedFilters.tableNo.toLowerCase())
      ) {
        return false;
      }

      // Status
      if (appliedFilters.status !== "All" && r.status !== appliedFilters.status) {
        return false;
      }

      return true;
    });
  }, [activeTab, appliedFilters]);

  // Pagination calculation
  const totalRecords = filteredRecords.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + pageSize);

  // Checkboxes
  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(paginatedRecords.map((r) => r.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    else setSelectedIds((prev) => prev.filter((i) => i !== id));
  };

  // Excel Export
  const handleExportExcel = () => {
    const headers = [
      "Order No",
      "Order Type",
      "Customer Name",
      "Assign To",
      "Items Summary",
      "Base Amount",
      "Tax Amount",
      "Grand Total",
      "Payment Mode",
      "Status",
      "Created At",
    ];
    const rows = filteredRecords.map((r) => [
      r.orderNo,
      r.orderTypeDisplay,
      r.customerName,
      r.assignTo,
      r.itemsSummary,
      r.myAmountFormatted,
      r.taxAmountFormatted,
      r.grandTotalFormatted,
      r.paymentMode,
      r.status,
      r.createdAt,
    ]);

    exportToExcel({
      filename: `All_Restaurant_Orders_${new Date().toISOString().slice(0, 10)}`,
      title: "All Restaurant Orders & Billing Register",
      subtitle: `Type: ${appliedFilters.orderType} | Status: ${appliedFilters.status} | ${appliedFilters.startDate} → ${appliedFilters.endDate}`,
      columns: headers,
      rows,
    });
    toast.success(`Exported ${rows.length} order records to Excel`);
  };

  type OrderRowType = AllOrderItem & { tableNo?: string; customerPhone?: string };

  const columns: PosDataGridColumn<OrderRowType>[] = useMemo(
    () => [
      {
        id: "orderNo",
        header: "Order No.",
        accessorKey: "orderNo",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 120,
        defaultWidth: 130,
        cell: ({ row }: { row: OrderRowType }) => (
          <span className="font-bold text-slate-900">{row.orderNo}</span>
        ),
      },
      {
        id: "orderTypeDisplay",
        header: "Order Type",
        accessorKey: "orderTypeDisplay",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 150,
        defaultWidth: 170,
        cell: ({ row }: { row: OrderRowType }) => (
          <span className="font-semibold text-slate-800">{row.orderTypeDisplay}</span>
        ),
      },
      {
        id: "customerName",
        header: "Customer Name",
        accessorKey: "customerName",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 150,
        defaultWidth: 160,
        cell: ({ row }: { row: OrderRowType }) => <span>{row.customerName}</span>,
      },
      {
        id: "assignTo",
        header: "Assign To",
        accessorKey: "assignTo",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 130,
        defaultWidth: 140,
        cell: ({ row }: { row: OrderRowType }) => <span className="text-slate-600">{row.assignTo}</span>,
      },
      {
        id: "itemsSummary",
        header: "Items",
        accessorKey: "itemsSummary",
        minWidth: 200,
        defaultWidth: 220,
        cell: ({ row }: { row: OrderRowType }) => (
          <span className="text-slate-600 font-normal leading-relaxed text-[12px]">
            {row.itemsSummary}
          </span>
        ),
      },
      {
        id: "myAmountFormatted",
        header: "My Amount (₹)",
        accessorKey: "myAmountFormatted",
        align: "right",
        enableSorting: true,
        minWidth: 140,
        defaultWidth: 150,
        cell: ({ row }: { row: OrderRowType }) => (
          <span className="font-medium">{row.myAmountFormatted}</span>
        ),
      },
      {
        id: "taxAmountFormatted",
        header: "Tax (₹)",
        accessorKey: "taxAmountFormatted",
        align: "right",
        enableSorting: true,
        minWidth: 110,
        defaultWidth: 120,
        cell: ({ row }: { row: OrderRowType }) => (
          <span className="text-slate-500">{row.taxAmountFormatted}</span>
        ),
      },
      {
        id: "discountAmountFormatted",
        header: "Discount (₹)",
        accessorKey: "discountAmountFormatted",
        align: "right",
        enableSorting: true,
        minWidth: 130,
        defaultWidth: 140,
        cell: ({ row }: { row: OrderRowType }) => (
          <span className="text-slate-500">{row.discountAmountFormatted}</span>
        ),
      },
      {
        id: "grandTotalFormatted",
        header: "Grand Total (₹)",
        accessorKey: "grandTotalFormatted",
        align: "right",
        enableSorting: true,
        minWidth: 150,
        defaultWidth: 160,
        cell: ({ row }: { row: OrderRowType }) => (
          <span className="font-bold text-slate-900">{row.grandTotalFormatted}</span>
        ),
      },
      {
        id: "paymentMode",
        header: "Payment",
        accessorKey: "paymentMode",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 120,
        defaultWidth: 130,
        cell: ({ row }: { row: OrderRowType }) => <span className="font-medium">{row.paymentMode}</span>,
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 120,
        defaultWidth: 130,
        cell: ({ row }: { row: OrderRowType }) => (
          <span
            className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${orderStatusClass(row.status)}`}
          >
            {row.status}
          </span>
        ),
      },
      {
        id: "createdAt",
        header: "Created",
        accessorKey: "createdAt",
        enableSorting: true,
        cell: ({ row }: { row: OrderRowType }) => (
          <span className="text-slate-500 text-[11.5px] whitespace-nowrap">
            {row.createdAt}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        align: "center",
        cell: ({ row: r }: { row: OrderRowType }) => (
          <div className="flex items-center justify-center gap-1.5 text-slate-500 py-1">
            <button
              type="button"
              onClick={() => setViewingOrder(r)}
              title="View Details"
              className="rounded-lg border border-slate-200 bg-white p-1 hover:text-sky-600 hover:border-sky-300 transition cursor-pointer shadow-2xs"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPrintingOrder(r)}
              title="Print Invoice"
              className="rounded-lg border border-slate-200 bg-white p-1 hover:text-emerald-600 hover:border-emerald-300 transition cursor-pointer shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => alert(`Edit Order #${r.orderNo}`)}
              title="Edit Order"
              className="rounded-lg border border-slate-200 bg-white p-1 hover:text-amber-600 hover:border-amber-300 transition cursor-pointer shadow-2xs"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => alert(`Reorder items from #${r.orderNo}`)}
              title="Reorder"
              className="rounded-lg border border-slate-200 bg-white p-1 hover:text-purple-600 hover:border-purple-300 transition cursor-pointer shadow-2xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const chooseColumnDefs: DataTableColumn[] = useMemo(
    () =>
      columns.map((col, idx) => {
        const id =
          col.id ||
          col.key ||
          (typeof col.accessorKey === "string" ? col.accessorKey : `col-${idx}`);
        const label =
          typeof col.header === "string"
            ? col.header
            : typeof col.label === "string"
              ? col.label
              : id;
        return { id, key: id, label };
      }),
    [columns],
  );

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("retrod:pos-order-history:visible-columns");
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    const initial: Record<string, boolean> = {};
    for (const col of chooseColumnDefs) {
      if (col.id) initial[col.id] = true;
    }
    return initial;
  });

  const handleColumnVisibilityChange = (updated: Record<string, boolean>) => {
    setColumnVisibility(updated);
    try {
      localStorage.setItem("retrod:pos-order-history:visible-columns", JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-2.5 pb-8">
      {/* 1. Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-300 bg-white p-3 shadow-2xs">
        {/* Left: Title, Order tabs, Table/Grid view */}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[16px] font-bold text-slate-900 leading-tight">Order History</h1>
          <div className="flex items-center rounded-lg border border-slate-300 bg-slate-100 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab("order");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-1 text-[12px] font-bold transition cursor-pointer ${
                activeTab === "order"
                  ? "bg-white text-teal-800 shadow-2xs border border-slate-300"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Order
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("advance_order");
                setCurrentPage(1);
              }}
              className={`rounded-md px-3 py-1 text-[12px] font-bold transition cursor-pointer ${
                activeTab === "advance_order"
                  ? "bg-white text-teal-800 shadow-2xs border border-slate-300"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Advance Order
            </button>
          </div>

          <div className="flex items-center rounded-lg border border-slate-300 bg-slate-100 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Table view"
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-bold transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-teal-800 shadow-2xs border border-slate-300"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Table2 className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Grid view"
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-bold transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-teal-800 shadow-2xs border border-slate-300"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Grid</span>
            </button>
          </div>
        </div>

        {/* Right: Grand Total + Export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-[13px] font-bold text-slate-900">
            Grand Total :{" "}
            <span className="text-teal-700">{data?.grandTotalFormatted ?? "₹ 643,388.00"}</span>
          </div>
          <ExportToExcelButton onClick={handleExportExcel} />
        </div>
      </div>

      {/* 2. Structured Filter Card */}
      <div className="rounded-xl border border-slate-300 bg-white p-3 shadow-2xs">
        {!showMoreFilters ? (
          /* PICTURE 1: DEFAULT COMPACT SINGLE-ROW FILTER TOOLBAR */
          <div className="flex flex-wrap items-end gap-3.5">
            {/* Start Date */}
            <div className="min-w-[170px] flex-1">
              <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                Start Date
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 h-10 shadow-2xs hover:border-slate-400 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-[12.5px] font-medium text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* End Date */}
            <div className="min-w-[170px] flex-1">
              <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                End Date
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 h-10 shadow-2xs hover:border-slate-400 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-[12.5px] font-medium text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* All Order Type */}
            <div className="min-w-[150px] flex-1">
              <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                All Order Type
              </label>
              <div className="relative">
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-[12.5px] font-medium text-slate-700 shadow-2xs hover:border-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition cursor-pointer"
                >
                  <option>All Order Type</option>
                  <option>Dine In</option>
                  <option>Takeaway</option>
                  <option>Room Service</option>
                  <option>Online Aggregator</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Order ID */}
            <div className="min-w-[120px] flex-1">
              <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                Order ID
              </label>
              <input
                type="text"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="e.g. 10519"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-[12.5px] text-slate-800 placeholder:text-slate-400 shadow-2xs hover:border-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowMoreFilters(true)}
                className="h-10 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
              >
                More Filters
              </button>

              <button
                type="button"
                onClick={handleSearch}
                className="h-10 whitespace-nowrap rounded-lg border border-sky-600 bg-white px-6 text-[12.5px] font-bold text-sky-600 hover:bg-sky-50 shadow-2xs transition cursor-pointer active:scale-98"
              >
                Search
              </button>
            </div>

            {viewMode === "table" && (
              <div className="ml-auto shrink-0">
                <ChooseColumnsMenu
                  columns={chooseColumnDefs}
                  visibleColumns={columnVisibility}
                  onVisibleColumnsChange={handleColumnVisibilityChange}
                  className="h-10 whitespace-nowrap"
                />
              </div>
            )}
          </div>
        ) : (
          /* PICTURE 2: EXPANDED MULTI-ROW FILTER GRID (MORE FILTERS) */
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
              <div>
                <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                  Start Date
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 h-10 shadow-2xs hover:border-slate-400 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-[12.5px] font-medium text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                  End Date
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 h-10 shadow-2xs hover:border-slate-400 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-[12.5px] font-medium text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                  All Order Type
                </label>
                <div className="relative">
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-[12.5px] font-medium text-slate-700 shadow-2xs hover:border-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition cursor-pointer"
                  >
                    <option>All Order Type</option>
                    <option>Dine In</option>
                    <option>Takeaway</option>
                    <option>Room Service</option>
                    <option>Online Aggregator</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                  Order ID
                </label>
                <input
                  type="text"
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                  placeholder="e.g. 10519"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-[12.5px] text-slate-800 placeholder:text-slate-400 shadow-2xs hover:border-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  placeholder="Customer Name"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-[12.5px] text-slate-800 placeholder:text-slate-400 shadow-2xs hover:border-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition"
                />
              </div>
            </div>

            {/* Row 2 — fields even; actions left; Choose Columns pinned right */}
            <div className="flex flex-wrap items-end gap-3.5 pt-1">
              <div className="min-w-[140px] flex-1">
                <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                  Customer Phone
                </label>
                <input
                  type="text"
                  value={customerPhoneInput}
                  onChange={(e) => setCustomerPhoneInput(e.target.value)}
                  placeholder="Phone No"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-[12.5px] text-slate-800 placeholder:text-slate-400 shadow-2xs hover:border-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition"
                />
              </div>

              <div className="min-w-[140px] flex-1">
                <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                  Table No.
                </label>
                <input
                  type="text"
                  value={tableNoInput}
                  onChange={(e) => setTableNoInput(e.target.value)}
                  placeholder="e.g. G41, B23"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-[12.5px] text-slate-800 placeholder:text-slate-400 shadow-2xs hover:border-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition"
                />
              </div>

              <div className="min-w-[140px] flex-1">
                <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-[12.5px] font-medium text-slate-700 shadow-2xs hover:border-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition cursor-pointer"
                  >
                    <option value="All">All</option>
                    <option value="Printed">Printed</option>
                    <option value="Settled">Settled</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="flex items-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowMoreFilters(false)}
                  className="h-10 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
                >
                  Less Filters
                </button>

                <button
                  type="button"
                  onClick={handleSearch}
                  className="h-10 whitespace-nowrap rounded-lg border border-sky-600 bg-white px-6 text-[12.5px] font-bold text-sky-600 hover:bg-sky-50 shadow-2xs transition cursor-pointer active:scale-98"
                >
                  Search
                </button>
              </div>

              {viewMode === "table" && (
                <div className="ml-auto shrink-0 flex items-end">
                  <ChooseColumnsMenu
                    columns={chooseColumnDefs}
                    visibleColumns={columnVisibility}
                    onVisibleColumnsChange={handleColumnVisibilityChange}
                    className="h-10 whitespace-nowrap"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Table or Grid view */}
      {viewMode === "table" ? (
        <PosDataGrid<AllOrderItem & { tableNo?: string; customerPhone?: string }>
          data={filteredRecords}
          selectedRowIds={selectedIds}
          onSelectionChange={setSelectedIds}
          enableSelection={true}
          enablePagination={true}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          emptyMessage="No matching orders found. Try adjusting your search or filters."
          columns={columns}
          storageKey="pos-order-history"
          themeVariant="primary"
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={handleColumnVisibilityChange}
        />
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-xl border border-slate-300 bg-white px-4 py-12 text-center text-[13px] text-slate-500 shadow-2xs">
          No matching orders found. Try adjusting your search or filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredRecords.map((order) => (
            <article
              key={order.id}
              className="flex flex-col rounded-xl border border-slate-300 bg-white p-3.5 shadow-2xs transition hover:border-slate-400"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-bold text-slate-900">#{order.orderNo}</h3>
                    <span
                      className={`inline-flex shrink-0 rounded-md border px-2 py-0.5 text-[10.5px] font-semibold ${orderStatusClass(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[12px] font-semibold text-slate-700">
                    {order.orderTypeDisplay}
                  </p>
                </div>
                <p className="shrink-0 text-[14px] font-bold text-teal-700">
                  {order.grandTotalFormatted}
                </p>
              </div>

              <div className="mt-2.5 space-y-1 text-[12px]">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Customer</span>
                  <span className="truncate font-medium text-slate-800">{order.customerName}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Assign To</span>
                  <span className="truncate text-slate-700">{order.assignTo}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Payment</span>
                  <span className="font-medium text-slate-800">{order.paymentMode}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Created</span>
                  <span className="text-slate-600">{order.createdAt}</span>
                </div>
              </div>

              <p className="mt-2.5 line-clamp-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2 text-[11.5px] leading-relaxed text-slate-600">
                {order.itemsSummary}
              </p>

              <div className="mt-auto flex items-center justify-end gap-1.5 border-t border-slate-100 pt-2.5 mt-3 text-slate-500">
                <button
                  type="button"
                  onClick={() => setViewingOrder(order)}
                  title="View Details"
                  className="rounded-lg border border-slate-200 bg-white p-1.5 hover:border-sky-300 hover:text-sky-600 transition cursor-pointer shadow-2xs"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingOrder(order)}
                  title="Print Invoice"
                  className="rounded-lg border border-slate-200 bg-white p-1.5 hover:border-emerald-300 hover:text-emerald-600 transition cursor-pointer shadow-2xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => alert(`Edit Order #${order.orderNo}`)}
                  title="Edit Order"
                  className="rounded-lg border border-slate-200 bg-white p-1.5 hover:border-amber-300 hover:text-amber-600 transition cursor-pointer shadow-2xs"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => alert(`Reorder items from #${order.orderNo}`)}
                  title="Reorder"
                  className="rounded-lg border border-slate-200 bg-white p-1.5 hover:border-purple-300 hover:text-purple-600 transition cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* VIEW ORDER DETAILS MODAL */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-[17px] font-bold text-slate-900">
                  Order #{viewingOrder.orderNo}
                </h3>
                <p className="text-[12px] text-slate-500">{viewingOrder.orderTypeDisplay}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingOrder(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-semibold text-slate-800">{viewingOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Served By:</span>
                <span className="font-semibold text-slate-800">{viewingOrder.assignTo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-semibold text-slate-800">{viewingOrder.paymentMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created Timestamp:</span>
                <span className="text-slate-700">{viewingOrder.createdAt}</span>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-slate-500 block mb-1">Ordered Dishes:</span>
                <div className="rounded-lg bg-slate-50 p-3 text-[12.5px] text-slate-700 leading-relaxed border border-slate-200">
                  {viewingOrder.itemsSummary}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>{viewingOrder.myAmountFormatted}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax:</span>
                  <span>{viewingOrder.taxAmountFormatted}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Discount:</span>
                  <span>{viewingOrder.discountAmountFormatted}</span>
                </div>
                <div className="flex justify-between text-[15px] font-bold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Grand Total:</span>
                  <span className="text-teal-700">{viewingOrder.grandTotalFormatted}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const ord = viewingOrder;
                  setViewingOrder(null);
                  setPrintingOrder(ord);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-teal-700 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT INVOICE MODAL */}
      {printingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="text-center border-b border-dashed border-slate-300 pb-4">
              <h2 className="text-[18px] font-bold text-slate-900">HIGHWAY INN RESTAURANT</h2>
              <p className="text-[11px] text-slate-500">GSTIN: 27AABCT3518Q1ZY</p>
              <p className="text-[11px] text-slate-500">Ph: +91 98765 43210</p>
            </div>

            <div className="text-[12px] space-y-1 border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between">
                <span>Invoice: #{printingOrder.orderNo}</span>
                <span>{printingOrder.createdAt.split(" ")[0]}</span>
              </div>
              <div className="flex justify-between">
                <span>Type: {printingOrder.orderTypeDisplay}</span>
                <span>Time: {printingOrder.createdAt.split(" ")[1]}</span>
              </div>
              <div>Customer: {printingOrder.customerName}</div>
            </div>

            <div className="text-[12px] space-y-2 border-b border-dashed border-slate-300 pb-3">
              <div className="font-semibold text-slate-800">Items:</div>
              <div className="text-slate-600 text-[11.5px]">{printingOrder.itemsSummary}</div>
            </div>

            <div className="text-[12.5px] space-y-1 font-medium">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{printingOrder.myAmountFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes:</span>
                <span>{printingOrder.taxAmountFormatted}</span>
              </div>
              <div className="flex justify-between text-[14px] font-bold text-slate-900 pt-2 border-t">
                <span>TOTAL:</span>
                <span>{printingOrder.grandTotalFormatted}</span>
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-3">
              <button
                type="button"
                onClick={() => setPrintingOrder(null)}
                className="flex-1 rounded-lg border border-slate-300 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  setPrintingOrder(null);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 py-2 text-[12.5px] font-semibold text-white hover:bg-sky-700 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PosAllOrdersManager;
