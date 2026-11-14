import { useState, useEffect, useMemo, useRef } from "react";
import { usePosDate, getTodayIso } from "@/hooks/usePosDate";
import { formatINR } from "@/services/posDashboardService";
import {
  Search,
  ChevronDown,
  Split,
  Calendar,
  X,
  LayoutGrid,
  Table2,
} from "lucide-react";
import { ColorActionPrint, ColorActionEdit, ColorActionView } from "@/components/common/ColorActionIcons";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAllOrders } from "@/hooks/queries/usePosOrders";
import type { AllOrderItem } from "@/types/posOrders";
import { useOutletContext } from "@/context/PosOutletContext";
import { isBackendOutletId } from "@/utils/outletId";
import {
  PosDataGrid,
  ChooseColumnsMenu,
  type PosDataGridColumn,
  type DataTableColumn,
} from "@/components/ui/data-grid";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import { exportToExcel } from "@/utils/exportUtils";
import { PosDateRangePicker } from "@/components/common/PosDateRangePicker";
import { toast } from "sonner";
import { openPrintReportTable } from "@/utils/printReportTable";
import { allOrderItemToInvoicePayload, printPosInvoice } from "@/utils/printReceipt";
import { InvoiceTemplate } from "../billing/InvoiceTemplate";
import { fuzzyMatch } from "@/utils/fuzzySearch";
import { formatDateIndian } from "@/utils/dateUtils";


function getOrderDateIso(r: any): string {
  if (typeof r?.createdTimestamp === "number" && r.createdTimestamp > 0) {
    const d = new Date(r.createdTimestamp);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }
  const candidate = r?.createdAt || r?.settledAt || r?.placedAt || "";
  if (!candidate || typeof candidate !== "string") return "";

  const isoMatch = candidate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const dmyMatch = candidate.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(candidate);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return "";
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function orderStatusClass(status: string) {
  const key = (status || "").toLowerCase();
  if (key === "settled" || key === "completed") {
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  }
  if (key === "cancelled") {
    return "bg-rose-50 text-rose-800 border-rose-200";
  }
  if (key === "printed" || key === "running") {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }
  return "bg-surface text-foreground border-border";
}

export function PosAllOrdersManager() {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [mounted, setMounted] = useState(false);
  // Toggle state: collapsed (Picture 1) vs expanded (Picture 2)
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const { selectedDateStr } = usePosDate();
  const initialDate = selectedDateStr || getTodayIso();

  // Filter input form state
  const [startDate, setStartDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialDate);
  const [orderType, setOrderType] = useState("All Order Type");
  const [orderIdInput, setOrderIdInput] = useState("");
  const [customerNameInput, setCustomerNameInput] = useState("");
  const [customerPhoneInput, setCustomerPhoneInput] = useState("");
  const [tableNoInput, setTableNoInput] = useState("");
  const [statusInput, setStatusInput] = useState("All");
  // Applied filter state triggered by date picker or "Search" button
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: initialDate,
    endDate: initialDate,
    orderType: "All Order Type",
    orderId: "",
    customerName: "",
    customerPhone: "",
    tableNo: "",
    status: "All",
  });

  const lastGlobalDateRef = useRef(selectedDateStr);
  useEffect(() => {
    if (selectedDateStr && selectedDateStr !== lastGlobalDateRef.current) {
      lastGlobalDateRef.current = selectedDateStr;
      setStartDate(selectedDateStr);
      setEndDate(selectedDateStr);
      setAppliedFilters((prev) => ({
        ...prev,
        startDate: selectedDateStr,
        endDate: selectedDateStr,
      }));
      setCurrentPage(1);
    }
  }, [selectedDateStr]);

  const handleDateRangeChange = ({ from, to }: { from: string; to: string }) => {
    setStartDate(from);
    setEndDate(to);
    setAppliedFilters((prev) => ({
      ...prev,
      startDate: from,
      endDate: to,
    }));
    setCurrentPage(1);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Selection & Modal states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewingOrder, setViewingOrder] = useState<AllOrderItem | null>(null);
  const [printingOrder, setPrintingOrder] = useState<AllOrderItem | null>(null);

  const queryFilters = useMemo(
    () => ({
      startDate: appliedFilters.startDate,
      endDate: appliedFilters.endDate,
      start_date: appliedFilters.startDate,
      end_date: appliedFilters.endDate,
      status: appliedFilters.status !== "All" ? appliedFilters.status : undefined,
    }),
    [appliedFilters.startDate, appliedFilters.endDate, appliedFilters.status]
  );
  const { data } = useAllOrders(queryFilters);
  const { activeOutlet } = useOutletContext();
  const liveOutlet = isBackendOutletId(activeOutlet?.id);

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


  const sourceRecords = useMemo(() => {
    return (data?.records || []) as (AllOrderItem & { tableNo?: string; customerPhone?: string })[];
  }, [data?.records]);

  const filteredRecords = useMemo(() => {
    return sourceRecords.filter((r) => {
      // Date range filter
      const orderDate = getOrderDateIso(r);
      if (appliedFilters.startDate && orderDate) {
        if (orderDate < appliedFilters.startDate) return false;
      }
      if (appliedFilters.endDate && orderDate) {
        if (orderDate > appliedFilters.endDate) return false;
      }
      if ((appliedFilters.startDate || appliedFilters.endDate) && !orderDate) {
        return false;
      }

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

      // Order ID & Global Multi-Field Fuzzy Search across guest, table, item, phone, amount
      if (appliedFilters.orderId) {
        const matches = fuzzyMatch(appliedFilters.orderId, [
          r.orderNo,
          r.customerName,
          r.customerPhone || "",
          r.tableNo || "",
          r.itemsSummary,
          r.assignTo,
          r.paymentMode,
          r.status,
          r.orderTypeDisplay,
          r.grandTotalFormatted,
          r.createdAt,
        ]);
        if (!matches) return false;
      }

      // Customer Name Fuzzy Search
      if (appliedFilters.customerName) {
        const matches = fuzzyMatch(appliedFilters.customerName, [r.customerName, r.customerPhone || ""]);
        if (!matches) return false;
      }

      // Customer Phone Search
      if (appliedFilters.customerPhone) {
        const matches = fuzzyMatch(appliedFilters.customerPhone, [r.customerPhone || "", r.customerName]);
        if (!matches) return false;
      }

      // Table No Search
      if (appliedFilters.tableNo) {
        const matches = fuzzyMatch(appliedFilters.tableNo, [r.tableNo || "", r.orderTypeDisplay]);
        if (!matches) return false;
      }

      // Status
      if (appliedFilters.status !== "All" && r.status !== appliedFilters.status) {
        return false;
      }

      return true;
    });
  }, [appliedFilters, sourceRecords]);

  const filteredGrandTotal = useMemo(() => {
    if (!filteredRecords.length) return formatINR(0);
    const sum = filteredRecords.reduce((acc, r) => {
      const rawNum =
        typeof (r as any).grandTotal === "number"
          ? (r as any).grandTotal
          : Number(String(r.grandTotalFormatted || "0").replace(/[^0-9.-]+/g, "")) || 0;
      return acc + rawNum;
    }, 0);
    return formatINR(sum);
  }, [filteredRecords]);

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
      "Guest Name",
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

  const handlePrintReport = () => {
    if (filteredRecords.length === 0) {
      toast.info("No orders to print");
      return;
    }

    const reportCols = [
      { header: "ORDER NO", align: "left" as const },
      { header: "ORDER TYPE", align: "left" as const },
      { header: "GUEST NAME", align: "left" as const },
      { header: "ASSIGN TO", align: "left" as const },
      { header: "ITEMS SUMMARY", align: "left" as const },
      { header: "BASE (₹)", align: "right" as const },
      { header: "TAX (₹)", align: "right" as const },
      { header: "TOTAL (₹)", align: "right" as const },
      { header: "PAYMENT MODE", align: "center" as const },
      { header: "STATUS", align: "center" as const },
      { header: "DATE & TIME", align: "center" as const },
    ];

    const reportRows = filteredRecords.map((r) => [
      r.orderNo,
      r.orderTypeDisplay || r.orderType,
      r.customerName || "Walk-in Guest",
      r.assignTo || "—",
      r.itemsSummary || "—",
      Number(r.myAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      Number(r.taxAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      Number(r.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      r.paymentMode || "CASH",
      (r.status || "COMPLETED").toUpperCase(),
      r.createdAt ? formatDateIndian(r.createdAt) : "—",
    ]);

    const totalGrand = filteredRecords.reduce((s, r) => s + Number(r.grandTotal || 0), 0);

    openPrintReportTable({
      title: "ORDER HISTORY MASTER REPORT",
      subtitle: `Type: ${appliedFilters.orderType || "All"} • Status: ${appliedFilters.status || "All"} • Total Orders: ${filteredRecords.length}`,
      dateRange: `${formatDateIndian(appliedFilters.startDate)} to ${formatDateIndian(appliedFilters.endDate)}`,
      columns: reportCols,
      rows: reportRows,
      summaryTotals: [
        "TOTAL",
        `${filteredRecords.length} Orders`,
        "",
        "",
        "",
        "",
        "",
        totalGrand.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
        "",
        "",
        "",
      ],
    });
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
          <span className="font-bold text-foreground">{row.orderNo}</span>
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
          <span className="font-semibold text-foreground">{row.orderTypeDisplay}</span>
        ),
      },
      {
        id: "customerName",
        header: "Guest Name",
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
        cell: ({ row }: { row: OrderRowType }) => <span className="text-foreground/80">{row.assignTo}</span>,
      },
      {
        id: "itemsSummary",
        header: "Items",
        accessorKey: "itemsSummary",
        minWidth: 200,
        defaultWidth: 220,
        cell: ({ row }: { row: OrderRowType }) => (
          <span className="text-foreground/80 font-normal leading-relaxed text-[12px]">
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
          <span className="font-medium text-foreground">{row.myAmountFormatted}</span>
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
          <span className="text-foreground/70">{row.taxAmountFormatted}</span>
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
          <span className="text-foreground/70">{row.discountAmountFormatted}</span>
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
          <span className="font-bold text-foreground">{row.grandTotalFormatted}</span>
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
        cell: ({ row }: { row: OrderRowType }) => <span className="font-medium text-foreground">{row.paymentMode}</span>,
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
          <span className="text-foreground text-[11.5px] whitespace-nowrap">
            {formatDateIndian(row.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        align: "center",
        cell: ({ row: r }: { row: OrderRowType }) => (
          <div className="flex items-center justify-center gap-1.5 py-1">
            <button
              type="button"
              onClick={() => setViewingOrder(r)}
              title="View Details"
              className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-300 bg-white hover:border-sky-500 hover:bg-sky-50/60 transition cursor-pointer shadow-2xs"
            >
              <ColorActionView className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPrintingOrder(r)}
              title="Print Invoice"
              className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-300 bg-white hover:border-emerald-500 hover:bg-emerald-50/60 transition cursor-pointer shadow-2xs"
            >
              <ColorActionPrint className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => alert(`Edit Order #${r.orderNo}`)}
              title="Edit Order"
              className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-300 bg-white hover:border-amber-500 hover:bg-amber-50/60 transition cursor-pointer shadow-2xs"
            >
              <ColorActionEdit className="h-4 w-4" />
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
    <div className="flex flex-col flex-1 min-h-0 w-full overflow-hidden bg-slate-50/50">
      {/* 1. Top Header Row - Flush with TopBar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200 shrink-0">

        {/* Left: Title, Table/Grid view */}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-[20px] sm:text-[22px] font-bold text-slate-900 tracking-tight leading-tight">Order History</h1>

          {/* Table / Grid view switcher with theme-based selected background */}
          <div className="flex items-center rounded-lg border border-slate-300 bg-slate-100 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Table view"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-bold transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Table2 className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Grid view"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-bold transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"
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
            <span className="text-teal-700">
              {filteredGrandTotal}
            </span>
          </div>
          <ExportToExcelButton onClick={handleExportExcel} />
          <button
            type="button"
            onClick={handlePrintReport}
            disabled={filteredRecords.length === 0}
            className="flex items-center gap-1.5 h-8.5 px-3 rounded-lg border border-slate-300 bg-white text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs disabled:opacity-50"
            title="Print Orders Master Report"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span>Print</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="responsive-page-x py-4 sm:py-5 space-y-4">
          {/* 2. Structured Filter Card */}
      <div className="rounded-xl border border-slate-300 bg-white p-3 shadow-2xs">
        {!showMoreFilters ? (
          /* PICTURE 1: DEFAULT COMPACT SINGLE-ROW FILTER TOOLBAR */
          <div className="flex flex-wrap items-end gap-3.5">
            {/* Order Date Range */}
            <div className="w-full sm:w-auto sm:min-w-[285px] flex-1">
              <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                Order Date Range
              </label>
              <PosDateRangePicker
                from={startDate}
                to={endDate}
                onSelect={handleDateRangeChange}
                className="w-full h-10"
              />
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

            {/* Smart Multi-Field Search */}
            <div className="min-w-[150px] flex-1">
              <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                Search Orders
              </label>
              <input
                type="text"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="Order ID, Guest, Phone, Item, Table..."
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
              <div className="sm:col-span-2">
                <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                  Order Date Range
                </label>
                <PosDateRangePicker
                  from={startDate}
                  to={endDate}
                  onSelect={handleDateRangeChange}
                  className="w-full h-10"
                />
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
                  Guest Name
                </label>
                <input
                  type="text"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  placeholder="Guest Name"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-[12.5px] text-slate-800 placeholder:text-slate-400 shadow-2xs hover:border-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition"
                />
              </div>
            </div>

            {/* Row 2 — fields even; actions left; Choose Columns pinned right */}
            <div className="flex flex-wrap items-end gap-3.5 pt-1">
              <div className="min-w-[140px] flex-1">
                <label className="block text-[11.5px] font-semibold text-slate-700 mb-1">
                  Guest Phone
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
                  <span className="text-slate-500">Guest</span>
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

              <div className="mt-auto flex items-center justify-end gap-1.5 border-t border-slate-100 pt-2.5 mt-3">
                <button
                  type="button"
                  onClick={() => setViewingOrder(order)}
                  title="View Details"
                  className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-300 bg-white hover:border-sky-500 hover:bg-sky-50/60 transition cursor-pointer shadow-2xs"
                >
                  <ColorActionView className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingOrder(order)}
                  title="Print Invoice"
                  className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-300 bg-white hover:border-emerald-500 hover:bg-emerald-50/60 transition cursor-pointer shadow-2xs"
                >
                  <ColorActionPrint className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => alert(`Edit Order #${order.orderNo}`)}
                  title="Edit Order"
                  className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-300 bg-white hover:border-amber-500 hover:bg-amber-50/60 transition cursor-pointer shadow-2xs"
                >
                  <ColorActionEdit className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
        </div>
      </div>

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
                <span className="text-slate-500">Guest Name:</span>
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

      {/* PRINT INVOICE MODAL — Unified PMS Tax Invoice Format */}
      {printingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 animate-in fade-in backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 bg-emerald-50 text-emerald-950 shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-emerald-700" />
                <div>
                  <h3 className="text-sm font-bold">Tax Invoice #{printingOrder.orderNo}</h3>
                  <p className="text-[11px] text-emerald-700">Official PMS format invoice preview</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPrintingOrder(null)}
                className="h-7 w-7 rounded-full bg-white border border-emerald-200 hover:bg-emerald-100 flex items-center justify-center text-emerald-800 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto bg-slate-100/80 flex justify-center flex-1">
              <div className="w-full max-w-[760px] bg-white rounded-md shadow-md p-2">
                <InvoiceTemplate invoice={allOrderItemToInvoicePayload(printingOrder, activeOutlet)} />
              </div>
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setPrintingOrder(null)}
                className="flex-1 rounded-xl border border-slate-300 py-2.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  const payload = allOrderItemToInvoicePayload(printingOrder, activeOutlet);
                  printPosInvoice(payload);
                  toast.success(`Printing Tax Invoice #${printingOrder.orderNo}`);
                  setPrintingOrder(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-teal-700 py-2.5 text-[12.5px] font-bold text-white hover:bg-teal-800 cursor-pointer shadow-xs"
              >
                <Printer className="h-4 w-4" />
                <span>Print Tax Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PosAllOrdersManager;
