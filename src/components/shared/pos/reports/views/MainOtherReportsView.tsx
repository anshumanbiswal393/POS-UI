import { useState, useMemo, useEffect } from "react";
import {
  Star,
  Search,
  Utensils,
  Calendar,
  Package,
  Tags,
  Users,
  Percent,
  FileText,
  ArrowLeft,
  Printer,
  Columns,
  ChevronDown,
  TrendingUp,
  CreditCard,
  Receipt,
  Store,
  Clock,
  Coins,
  ShieldAlert,
  PieChart,
  BarChart3,
  LayoutGrid,
  Truck,
  Table2,
  X,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { DataTableHeader, DataTableFooter, type DataTableColumn } from "@/components/common";
import { exportToExcel } from "@/utils/exportUtils";
import { openPrintReportTable } from "@/utils/printReportTable";
import { formatDateIndian } from "@/utils/dateUtils";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import { PosDateRangePicker } from "@/components/common/PosDateRangePicker";
import { useOutletContext } from "@/context/PosOutletContext";
import { isBackendOutletId } from "@/utils/outletId";
import { usePosSalesReport, usePosReportsDashboard } from "@/hooks/queries/usePosReports";
import { isoDate, rangeLastDays, rangeThisMonth } from "@/services/posReportsService";
import { formatINR } from "@/services/posDashboardService";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

export interface ReportCard {
  id: string;
  category: "sales" | "items" | "cashier" | "taxes" | "discounts" | "operations";
  categoryGroup: string;
  title: string;
  description: string;
  icon: any;
  iconColor: string; // e.g. "rose", "sky", "emerald", "amber", "indigo", "violet", "teal"
  isNew?: boolean;
  isFavorite: boolean;
}

// ---------------------------------------------------------
// DATASETS TAILORED FOR EACH POS REPORT TYPE
// ---------------------------------------------------------

const REPORT_COLUMNS: Record<string, DataTableColumn<any>[]> = {
  "REP-01": [
    // All Restaurant Sales Report
    { id: "date", label: "Date", sortable: true, getValue: (r) => r.date },
    { id: "outlet", label: "Outlet Name", sortable: true, filterable: true, getValue: (r) => r.outlet },
    { id: "totalBills", label: "Total Bills", align: "right", sortable: true, getValue: (r) => String(r.totalBills ?? 0) },
    { id: "dineInSales", label: "Dine-In (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.dineInSales ?? 0).toLocaleString()}` },
    { id: "takeawaySales", label: "Takeaway (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.takeawaySales ?? 0).toLocaleString()}` },
    { id: "roomServiceSales", label: "Room Service (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.roomServiceSales ?? 0).toLocaleString()}` },
    { id: "deliverySales", label: "Delivery (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.deliverySales ?? 0).toLocaleString()}` },
    { id: "grossSales", label: "Gross Sales (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.grossSales ?? 0).toLocaleString()}` },
    { id: "discounts", label: "Discounts (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.discounts ?? 0).toLocaleString()}` },
    { id: "taxes", label: "Taxes (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.taxes ?? 0).toLocaleString()}` },
    { id: "netSales", label: "Net Sales (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.netSales ?? 0).toLocaleString()}` },
  ],
  "REP-02": [
    // Outlet-Item Wise Report (Row)
    { id: "itemCode", label: "Item Code", sortable: true, getValue: (r) => r.itemCode },
    { id: "itemName", label: "Item Name", sortable: true, getValue: (r) => r.itemName },
    { id: "category", label: "Category", sortable: true, filterable: true, getValue: (r) => r.category },
    { id: "outlet", label: "Outlet", sortable: true, getValue: (r) => r.outlet },
    { id: "unitPrice", label: "Unit Rate (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.unitPrice ?? 0}` },
    { id: "qtySold", label: "Quantity Sold", align: "right", sortable: true, getValue: (r) => String(r.qtySold ?? 0) },
    { id: "grossRevenue", label: "Gross (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.grossRevenue ?? 0).toLocaleString()}` },
    { id: "discountAmount", label: "Discount (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.discountAmount ?? 0).toLocaleString()}` },
    { id: "netRevenue", label: "Net Revenue (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.netRevenue ?? 0).toLocaleString()}` },
  ],
  "REP-03": [
    // Invoice Report: All Restaurants
    { id: "invoiceNo", label: "Invoice #", sortable: true, getValue: (r) => r.invoiceNo },
    { id: "timestamp", label: "Date & Time", sortable: true, getValue: (r) => r.timestamp },
    { id: "outlet", label: "Outlet", sortable: true, getValue: (r) => r.outlet },
    { id: "orderType", label: "Order Type", sortable: true, filterable: true, getValue: (r) => r.orderType },
    { id: "tableToken", label: "Table / Token", sortable: true, getValue: (r) => r.tableToken },
    { id: "customer", label: "Guest", sortable: true, getValue: (r) => r.customer },
    { id: "paymentMode", label: "Payment Mode", sortable: true, filterable: true, getValue: (r) => r.paymentMode },
    { id: "subTotal", label: "Subtotal (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.subTotal ?? 0}` },
    { id: "tax", label: "Tax (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.tax ?? 0}` },
    { id: "grandTotal", label: "Total Paid (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.grandTotal ?? 0}` },
    { id: "status", label: "Status", sortable: true, filterable: true, getValue: (r) => r.status },
  ],
  "REP-04": [
    // Pax Sales Report: Biller Wise
    { id: "billerName", label: "Biller / Captain Name", sortable: true, getValue: (r) => r.billerName },
    { id: "empId", label: "Staff ID", sortable: true, getValue: (r) => r.empId },
    { id: "outlet", label: "Outlet", sortable: true, getValue: (r) => r.outlet },
    { id: "shift", label: "Shift", sortable: true, filterable: true, getValue: (r) => r.shift },
    { id: "totalPax", label: "Pax", align: "right", sortable: true, getValue: (r) => String(r.totalPax ?? 0) },
    { id: "totalBills", label: "Total Bills", align: "right", sortable: true, getValue: (r) => String(r.totalBills ?? 0) },
    { id: "totalSales", label: "Total Sales (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.totalSales ?? 0).toLocaleString()}` },
    { id: "avgPerPax", label: "Avg Spend / Pax (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.avgPerPax ?? 0}` },
    { id: "avgPerBill", label: "Avg Ticket Size (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.avgPerBill ?? 0}` },
  ],
  "REP-05": [
    // Order Report: Sub-Order Wise
    { id: "subOrderType", label: "Sub-Order Type", sortable: true, getValue: (r) => r.subOrderType },
    { id: "channel", label: "Channel Source", sortable: true, filterable: true, getValue: (r) => r.channel },
    { id: "totalOrders", label: "Total Orders", align: "right", sortable: true, getValue: (r) => String(r.totalOrders ?? 0) },
    { id: "deliveredOrders", label: "Delivered / Completed", align: "right", sortable: true, getValue: (r) => String(r.deliveredOrders ?? 0) },
    { id: "cancelledOrders", label: "Cancelled", align: "right", sortable: true, getValue: (r) => String(r.cancelledOrders ?? 0) },
    { id: "grossAmount", label: "Gross Amount (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.grossAmount ?? r.salesAmount ?? 0).toLocaleString()}` },
    { id: "netSettled", label: "Net Settled (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.netSettled ?? r.salesAmount ?? 0).toLocaleString()}` },
  ],
  "REP-06": [
    // All Restaurant Report: Day Wise
    { id: "date", label: "Date", sortable: true, getValue: (r) => r.date },
    { id: "dayOfWeek", label: "Day", sortable: true, getValue: (r) => r.dayOfWeek },
    { id: "dineInRev", label: "Dine-In (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.dineInRev ?? 0).toLocaleString()}` },
    { id: "takeawayRev", label: "Takeaway (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.takeawayRev ?? 0).toLocaleString()}` },
    { id: "roomServiceRev", label: "Room Service (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.roomServiceRev ?? 0).toLocaleString()}` },
    { id: "totalBills", label: "Total Bills", align: "right", sortable: true, getValue: (r) => String(r.totalBills ?? r.totalOrders ?? 0) },
    { id: "totalNetRev", label: "Total Net Revenue (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.totalNetRev ?? r.netSales ?? 0).toLocaleString()}` },
  ],
  "REP-07": [
    // Discount & Comp Audit Report
    { id: "billNo", label: "Bill / Order No", sortable: true, getValue: (r) => r.billNo || r.invoiceNo },
    { id: "timestamp", label: "Date & Time", sortable: true, getValue: (r) => r.timestamp || r.dateTime },
    { id: "authorizedBy", label: "Authorized By", sortable: true, getValue: (r) => r.authorizedBy || r.biller },
    { id: "reason", label: "Discount Reason", sortable: true, filterable: true, getValue: (r) => r.reason },
    { id: "discountType", label: "Type", sortable: true, getValue: (r) => r.discountType },
    { id: "originalAmount", label: "Bill Amount (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.originalAmount ?? 0}` },
    { id: "discountValue", label: "Discount (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.discountValue ?? r.discountAmount ?? 0}` },
    { id: "finalBill", label: "Final Paid (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.finalBill ?? 0}` },
  ],
  "REP-08": [
    // Category Contribution Analysis
    { id: "categoryName", label: "Category Name", sortable: true, getValue: (r) => r.categoryName },
    { id: "itemCount", label: "Active Items", align: "right", sortable: true, getValue: (r) => String(r.itemCount ?? 0) },
    { id: "qtySold", label: "Total Qty Sold", align: "right", sortable: true, getValue: (r) => String(r.qtySold ?? 0) },
    { id: "totalRevenue", label: "Total Revenue (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.totalRevenue ?? 0).toLocaleString()}` },
    { id: "contributionPct", label: "Revenue Share (%)", align: "right", sortable: true, getValue: (r) => `${r.contributionPct ?? 0}%` },
    { id: "profitMargin", label: "Est. Margin (%)", align: "right", sortable: true, getValue: (r) => `${r.profitMargin ?? 0}%` },
  ],
  "REP-09": [
    // Customer Repeat Order Matrix
    { id: "customerName", label: "Guest Name", sortable: true, getValue: (r) => r.customerName },
    { id: "phone", label: "Mobile No", sortable: true, getValue: (r) => r.phone },
    { id: "segment", label: "Guest Tier", sortable: true, filterable: true, getValue: (r) => r.segment || "Regular" },
    { id: "totalVisits", label: "Total Visits", align: "right", sortable: true, getValue: (r) => String(r.totalVisits ?? 0) },
    { id: "lastVisit", label: "Last Visit", sortable: true, getValue: (r) => r.lastVisit },
    { id: "lifetimeSpend", label: "Lifetime Spend (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.lifetimeSpend ?? r.totalSpend ?? 0).toLocaleString()}` },
    { id: "avgOrderValue", label: "Avg Ticket (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.avgOrderValue ?? r.avgSpendPerVisit ?? 0}` },
  ],
  "REP-10": [
    // Hourly Sales & Peak Time Report
    { id: "timeSlot", label: "Time Window", sortable: true, getValue: (r) => r.timeSlot },
    { id: "ordersCount", label: "Orders Placed", align: "right", sortable: true, getValue: (r) => String(r.ordersCount ?? r.totalOrders ?? 0) },
    { id: "totalCovers", label: "Guest Covers", align: "right", sortable: true, getValue: (r) => String(r.totalCovers ?? r.totalPax ?? 0) },
    { id: "salesAmount", label: "Revenue (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.salesAmount ?? r.grossSales ?? 0).toLocaleString()}` },
    { id: "shareOfDailySales", label: "Share of Daily", align: "right", sortable: true, getValue: (r) => `${r.shareOfDailySales ?? 0}%` },
  ],
  "REP-11": [
    // Payment Mode & Settlement Reconciliation
    { id: "paymentMethod", label: "Payment Mode", sortable: true, getValue: (r) => r.paymentMethod },
    { id: "txnCount", label: "Transactions", align: "right", sortable: true, getValue: (r) => String(r.txnCount ?? 0) },
    { id: "collectedAmount", label: "Collected (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.collectedAmount ?? 0).toLocaleString()}` },
    { id: "processingFee", label: "MDR / Charges (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.processingFee ?? 0).toLocaleString()}` },
    { id: "netBankDeposit", label: "Net Credited (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.netBankDeposit ?? 0).toLocaleString()}` },
  ],
  "REP-12": [
    // GST Summary & Tax Audit
    { id: "taxType", label: "Tax Slab / Category", sortable: true, getValue: (r) => r.taxType },
    { id: "rate", label: "Rate (%)", align: "right", sortable: true, getValue: (r) => `${r.rate ?? 0}%` },
    { id: "taxableAmount", label: "Taxable Value (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.taxableAmount ?? 0).toLocaleString()}` },
    { id: "cgst", label: "CGST (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.cgst ?? 0).toLocaleString()}` },
    { id: "sgst", label: "SGST (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.sgst ?? 0).toLocaleString()}` },
    { id: "totalTax", label: "Total GST (₹)", align: "right", sortable: true, getValue: (r) => `₹${Number(r.totalTax ?? 0).toLocaleString()}` },
  ],
};

// ---------------------------------------------------------
// ALL REPORT CATALOG DEFINITIONS
// ---------------------------------------------------------

const ALL_REPORTS: ReportCard[] = [
  // 1. SALES & REVENUE REPORTS
  {
    id: "REP-01",
    category: "sales",
    categoryGroup: "SALES & REVENUE REPORTS — OVERVIEW",
    title: "All Restaurant Sales Report",
    description: "Total revenue and dining type sales breakdown across all your restaurants and banquet spaces.",
    icon: Utensils,
    iconColor: "rose",
    isFavorite: true,
  },
  {
    id: "REP-06",
    category: "sales",
    categoryGroup: "SALES & REVENUE REPORTS — OVERVIEW",
    title: "Day-Wise Sales Trend",
    description: "Daily revenue, bill counts, and average spend comparisons by day of week.",
    icon: Calendar,
    iconColor: "sky",
    isFavorite: true,
  },
  {
    id: "REP-10",
    category: "sales",
    categoryGroup: "SALES & REVENUE REPORTS — OVERVIEW",
    title: "Hourly Peak Time Analysis",
    description: "Hour-by-hour order traffic, guest covers, and peak lunch/dinner rush revenue metrics.",
    icon: Clock,
    iconColor: "emerald",
    isFavorite: false,
  },
  {
    id: "REP-11",
    category: "sales",
    categoryGroup: "SALES & REVENUE REPORTS — OVERVIEW",
    title: "Payment Method Breakdown",
    description: "Detailed reconciliation of UPI, Credit/Debit Cards, Cash, and Aggregator payout settlements.",
    icon: CreditCard,
    iconColor: "purple",
    isNew: true,
    isFavorite: false,
  },

  // 2. MENU & ITEM PERFORMANCE REPORTS
  {
    id: "REP-02",
    category: "items",
    categoryGroup: "OUTLET & MENU ITEM REPORTS — DISH PERFORMANCE",
    title: "Outlet-Item Wise Sales Report",
    description: "Consolidated sales summary of menu items sold with outlet row bifurcation and revenue.",
    icon: Package,
    iconColor: "rose",
    isFavorite: true,
  },
  {
    id: "REP-08",
    category: "items",
    categoryGroup: "OUTLET & MENU ITEM REPORTS — DISH PERFORMANCE",
    title: "Category Contribution Analysis",
    description: "Revenue share percentage and gross profit margin of appetizers, main course, bar, and desserts.",
    icon: Tags,
    iconColor: "sky",
    isFavorite: false,
  },

  // 3. CASHIER & STAFF REPORTS
  {
    id: "REP-04",
    category: "cashier",
    categoryGroup: "BILLING & CASHIER REPORTS — SHIFTS & COVERS",
    title: "Pax Sales Report: Biller Wise",
    description: "Sales and cover counts managed by each cashier, captain, and biller app operator.",
    icon: Users,
    iconColor: "emerald",
    isFavorite: false,
  },

  // 4. TAX & INVOICE REPORTS
  {
    id: "REP-03",
    category: "taxes",
    categoryGroup: "TAXES & COMPLIANCE REPORTS — INVOICES & GST",
    title: "Invoice Report: All Restaurants",
    description: "Master invoice register with tax totals, payment modes, table numbers, and settlement statuses.",
    icon: Receipt,
    iconColor: "purple",
    isFavorite: true,
  },
  {
    id: "REP-12",
    category: "taxes",
    categoryGroup: "TAXES & COMPLIANCE REPORTS — INVOICES & GST",
    title: "GST Summary & Tax Audit",
    description: "CGST, SGST, IGST, and VAT tax liability reports across food, beverages, and banquet halls.",
    icon: Coins,
    iconColor: "amber",
    isNew: true,
    isFavorite: false,
  },

  // 5. DISCOUNTS & ORDERS REPORTS
  {
    id: "REP-05",
    category: "discounts",
    categoryGroup: "DISCOUNTS & ORDERS REPORTS — CHANNELS & AUDIT",
    title: "Order Report: Sub-Order Wise",
    description: "Bifurcation of orders across AC Dining, Garden, Takeaway, Zomato, Swiggy, and Room Service.",
    icon: Truck,
    iconColor: "teal",
    isFavorite: false,
  },
  {
    id: "REP-07",
    category: "discounts",
    categoryGroup: "DISCOUNTS & ORDERS REPORTS — CHANNELS & AUDIT",
    title: "Discount & Comp Audit Report",
    description: "Summary of discounts provided across dine-in, takeaway, and aggregators with manager approvals.",
    icon: Percent,
    iconColor: "rose",
    isFavorite: false,
  },

  // 6. OPERATIONS & CUSTOMER REPORTS
  {
    id: "REP-09",
    category: "operations",
    categoryGroup: "OPERATIONS & CUSTOMER REPORTS — ENGAGEMENT & LOGS",
    title: "Customer Repeat Order Matrix",
    description: "Identification of VIP repeat guests, average ticket spend, and visit frequencies.",
    icon: Store,
    iconColor: "sky",
    isFavorite: false,
  },
];

const CATEGORY_PILLS = [
  { id: "all", label: "All reports" },
  { id: "sales", label: "Sales & Revenue" },
  { id: "items", label: "Outlet & Items" },
  { id: "cashier", label: "Cashier & Shifts" },
  { id: "taxes", label: "Tax & Invoices" },
  { id: "discounts", label: "Discounts & Orders" },
  { id: "operations", label: "Operations & Audit" },
  { id: "favorites", label: "⭐ Favorites" },
] as const;


const COLOR_STYLES: Record<string, { bg: string; text: string }> = {
  rose: { bg: "bg-[#ffeef0]", text: "text-[#f43f5e]" },
  pink: { bg: "bg-[#ffeef0]", text: "text-[#f43f5e]" },
  sky: { bg: "bg-[#e0f2fe]", text: "text-[#0284c7]" },
  cyan: { bg: "bg-[#e0f2fe]", text: "text-[#0284c7]" },
  emerald: { bg: "bg-[#e6f4ea]", text: "text-[#00875a]" },
  green: { bg: "bg-[#e6f4ea]", text: "text-[#00875a]" },
  purple: { bg: "bg-[#f3e8ff]", text: "text-[#9333ea]" },
  indigo: { bg: "bg-[#e0e7ff]", text: "text-[#4f46e5]" },
  amber: { bg: "bg-[#fff7ed]", text: "text-[#ea580c]" },
  orange: { bg: "bg-[#fff7ed]", text: "text-[#ea580c]" },
  teal: { bg: "bg-[#e6f4ea]", text: "text-[#0d9488]" },
};

export function MainOtherReportsView() {
  const { activeOutlet, outlets } = useOutletContext();
  const live = isBackendOutletId(activeOutlet?.id);
  const [viewMode, setViewMode] = useState<"catalog" | "dashboard">("catalog");
  const [activePill, setActivePill] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<ReportCard | null>(null);
  const [reportList, setReportList] = useState<ReportCard[]>(() => {
    if (typeof window === "undefined") return ALL_REPORTS;
    try {
      const saved = localStorage.getItem("pos_reports_favorites");
      if (!saved) return ALL_REPORTS;
      const favIds = new Set(JSON.parse(saved));
      return ALL_REPORTS.map((r) => ({ ...r, isFavorite: favIds.has(r.id) }));
    } catch {
      return ALL_REPORTS;
    }
  });

  // ---------------------------------------------------------
  // DRILLDOWN REPORT VIEW STATE
  // ---------------------------------------------------------
  const [fromDate, setFromDate] = useState(rangeLastDays(7).from);
  const [toDate, setToDate] = useState(rangeLastDays(7).to);
  const [reportSearch, setReportSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [sortConfig, setSortConfig] = useState<{ colId: string; direction: "asc" | "desc" } | null>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<string>("ALL");

  useEffect(() => {
    const range = rangeLastDays(7);
    setFromDate(range.from);
    setToDate(range.to);
    setSelectedOutlet(activeOutlet?.name || "ALL");
  }, [live, activeOutlet?.id, activeOutlet?.name]);

  const salesQuery = usePosSalesReport({
    kind: selectedReport?.id,
    fromDate,
    toDate,
    enabled: Boolean(selectedReport),
  });
  const dashQuery = usePosReportsDashboard(fromDate, toDate, live && viewMode === "dashboard");

  const favoriteCount = useMemo(() => {
    return reportList.filter((r) => r.isFavorite).length;
  }, [reportList]);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setReportList((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
      try {
        const favIds = next.filter((r) => r.isFavorite).map((r) => r.id);
        localStorage.setItem("pos_reports_favorites", JSON.stringify(favIds));
      } catch {}
      return next;
    });
    toast.success("Favorite status updated");
  };

  // Filtered reports by search and active pill
  const filteredReports = useMemo(() => {
    return reportList.filter((r) => {
      if (activePill === "favorites" && !r.isFavorite) return false;
      if (activePill !== "all" && activePill !== "favorites" && r.category !== activePill) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchDesc = r.description.toLowerCase().includes(q);
        const matchGroup = r.categoryGroup.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchGroup) return false;
      }
      return true;
    });
  }, [reportList, activePill, searchQuery]);

  // Group filtered reports by categoryGroup
  const groupedSections = useMemo(() => {
    const groups: Record<string, ReportCard[]> = {};
    filteredReports.forEach((r) => {
      if (!groups[r.categoryGroup]) {
        groups[r.categoryGroup] = [];
      }
      groups[r.categoryGroup].push(r);
    });
    return groups;
  }, [filteredReports]);

  // ---------------------------------------------------------
  // DRILLDOWN REPORT COMPUTATIONS
  // ---------------------------------------------------------
  const currentReportConfig = useMemo(() => {
    if (!selectedReport) return null;
    const columns = REPORT_COLUMNS[selectedReport.id] || REPORT_COLUMNS["REP-01"];
    return { columns, data: salesQuery.data?.records || [] };
  }, [selectedReport, salesQuery.data]);

  const allColumns = useMemo(() => {
    return currentReportConfig?.columns || [];
  }, [currentReportConfig]);

  const handleOpenReport = (report: ReportCard) => {
    setSelectedReport(report);
    const cols = REPORT_COLUMNS[report.id] || REPORT_COLUMNS["REP-01"];
    const initialVis: Record<string, boolean> = {};
    cols.forEach((c) => {
      if (c.id) initialVis[c.id] = true;
    });
    setVisibleColumns(initialVis);
    setPage(1);
    setSelectedIds([]);
    setReportSearch("");
    setSortConfig(null);
  };

  const activeColumns = useMemo(() => {
    return allColumns.filter((c) => (c.id ? visibleColumns[c.id] !== false : true));
  }, [allColumns, visibleColumns]);

  const reportDataset = useMemo(() => {
    if (!currentReportConfig) return [];
    let rows = currentReportConfig.data;

    if (selectedOutlet !== "ALL") {
      rows = rows.filter((r) => {
        const out = String(r.outlet || r.outletName || r.outlet_name || "");
        return !out || out.toLowerCase().includes(selectedOutlet.toLowerCase()) || selectedOutlet.toLowerCase().includes(out.toLowerCase());
      });
    }

    // Search filtering
    if (reportSearch.trim()) {
      const q = reportSearch.toLowerCase();
      rows = rows.filter((r) =>
        Object.values(r).some((val) => String(val).toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortConfig) {
      const { colId, direction } = sortConfig;
      rows = [...rows].sort((a, b) => {
        const valA = a[colId];
        const valB = b[colId];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (typeof valA === "number" && typeof valB === "number") {
          return direction === "asc" ? valA - valB : valB - valA;
        }
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return direction === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return rows;
  }, [currentReportConfig, selectedOutlet, reportSearch, sortConfig]);

  const paginatedReportData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return reportDataset.slice(start, start + pageSize);
  }, [reportDataset, page, pageSize]);

  const handleExportExcel = () => {
    if (!selectedReport) return;
    const exportRows = reportDataset.map((row) => {
      const formatted: Record<string, any> = {};
      activeColumns.forEach((col) => {
        if (col.id) {
          formatted[col.label] = col.getValue ? col.getValue(row) : row[col.id];
        }
      });
      return formatted;
    });

    exportToExcel(exportRows, `${selectedReport.title}_${fromDate}_to_${toDate}`, {
      title: selectedReport.title,
      dateRange: `${fromDate} to ${toDate}`,
      subtitle: `Outlet: ${selectedOutlet === "ALL" ? "All Outlets" : selectedOutlet}`,
    });
    toast.success(`Exported ${exportRows.length} records to Excel`);
  };

  const handlePrint = () => {
    if (!selectedReport || reportDataset.length === 0) {
      toast.info("No report records to print");
      return;
    }

    const columns = activeColumns.map((col) => ({
      header: col.label.toUpperCase(),
      align: (col.align as any) || "left",
    }));

    const rows = reportDataset.map((row) => {
      return activeColumns.map((col) => {
        const val = col.getValue ? col.getValue(row) : (row as any)[col.id || ""];
        return val === null || val === undefined ? "" : val;
      });
    });

    openPrintReportTable({
      title: (selectedReport.title || "POS REPORT").toUpperCase(),
      hotelName: activeOutlet?.name || "Restaurant",
      subtitle: `Category: ${selectedReport.category || "Reports"} • Outlet: ${selectedOutlet === "ALL" ? "All Outlets" : selectedOutlet} • Total Records: ${reportDataset.length}`,
      dateRange: `${formatDateIndian(fromDate)} to ${formatDateIndian(toDate)}`,
      columns,
      rows,
    });
  };

  const toggleColumnVisibility = (colId: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [colId]: !prev[colId],
    }));
  };

  // ---------------------------------------------------------
  // RENDER: DRILLDOWN TABULAR VIEW
  // ---------------------------------------------------------
  if (selectedReport) {
    return (
      <div className="flex flex-col flex-1 min-h-0 w-full overflow-y-auto bg-slate-50/50 pb-8">
        {/* Top Breadcrumb / Title Bar - Flush with TopBar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 py-2.5 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedReport(null)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-teal-600 transition cursor-pointer"
              title="Back to Catalog"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[20px] sm:text-[22px] font-bold text-slate-900 tracking-tight">
                  {selectedReport.title}
                </h2>
                <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700 border border-teal-200">
                  {selectedReport.id}
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Choose Columns Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                >
                  <Columns className="h-3.5 w-3.5 text-slate-500" />
                  <span>Choose Columns</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3 shadow-lg rounded-xl" align="end">
                <div className="space-y-2">
                  <div className="text-[12px] font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                    Toggle Visible Columns
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pt-1">
                    {allColumns.map((col) => {
                      if (!col.id) return null;
                      const isChecked = visibleColumns[col.id] !== false;
                      return (
                        <label
                          key={col.id}
                          className="flex items-center gap-2 px-1.5 py-1 text-[12px] text-slate-700 hover:bg-slate-50 rounded cursor-pointer select-none"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleColumnVisibility(col.id!)}
                          />
                          <span className="truncate">{col.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <ExportToExcelButton onClick={handleExportExcel} />

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Content Area with matching responsive padding like Reservations List */}
        <div className="responsive-page-x py-4 sm:py-5 space-y-4 flex-1 print:p-0">
        {/* Filter Toolbar: Date Filter + Global Search */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 print:hidden">
          <div className="flex flex-wrap items-end justify-between gap-3">
            {/* Date Range Picker */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-[11.5px] font-semibold text-slate-600">Report Period</label>
                <PosDateRangePicker
                  from={fromDate}
                  to={toDate}
                  onSelect={({ from, to }) => {
                    setFromDate(from);
                    setToDate(to);
                  }}
                  className="h-9"
                />
              </div>

              {/* Outlet Filter Dropdown */}
              <div className="space-y-1">
                <label className="text-[11.5px] font-semibold text-slate-600">Outlet</label>
                <select
                  value={selectedOutlet}
                  onChange={(e) => {
                    setSelectedOutlet(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Outlets</option>
                  {outlets?.map((o) => (
                    <option key={o.id} value={o.name}>{o.name}</option>
                  ))}
                  {activeOutlet && !outlets?.some((o) => o.name === activeOutlet.name) && (
                    <option value={activeOutlet.name}>{activeOutlet.name}</option>
                  )}
                </select>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1 pb-0.5">
                <button
                  type="button"
                  onClick={() => {
                    const today = isoDate(new Date());
                    setFromDate(today);
                    setToDate(today);
                    setPage(1);
                  }}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const range = rangeLastDays(7);
                    setFromDate(range.from);
                    setToDate(range.to);
                    setPage(1);
                  }}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const range = rangeThisMonth();
                    setFromDate(range.from);
                    setToDate(range.to);
                    setPage(1);
                  }}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  This Month
                </button>
              </div>
            </div>

            {/* Global Search Bar */}
            <div className="flex items-center gap-2 w-full sm:w-auto sm:min-w-[280px]">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search within report..."
                  value={reportSearch}
                  onChange={(e) => {
                    setReportSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-[12.5px] text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              {(reportSearch || fromDate !== rangeLastDays(7).from || toDate !== rangeLastDays(7).to) && (
                <button
                  type="button"
                  onClick={() => {
                    setReportSearch("");
                    const range = rangeLastDays(7);
                    setFromDate(range.from);
                    setToDate(range.to);
                    setPage(1);
                    toast.info("Reset report filters");
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Print Header banner */}
        <div className="hidden print:block mb-4 border-b-2 border-slate-900 pb-3 w-full">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-wide uppercase">
                {activeOutlet?.name || "Restaurant Outlet"}
              </h1>
              <h2 className="text-sm font-bold text-slate-800 mt-0.5 uppercase">
                {selectedReport.title}
              </h2>
            </div>
            <div className="text-right text-[11px] text-slate-700 space-y-0.5">
              <div>
                <strong className="text-slate-900">Period:</strong> {fromDate} to {toDate}
              </div>
              <div>
                <strong className="text-slate-900">Outlet:</strong>{" "}
                {selectedOutlet === "ALL" ? "All Outlets" : selectedOutlet}
              </div>
              <div>
                <strong className="text-slate-900">Generated:</strong> {new Date().toLocaleString()}
              </div>
              <div>
                <strong className="text-slate-900">Total Records:</strong> {reportDataset.length}
              </div>
            </div>
          </div>
        </div>

        {/* Tabular Data with DataTableHeader and DataTableFooter */}
        {salesQuery.isFetching ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-20 text-center shadow-xs space-y-3 print:hidden">
            <div className="text-[14.5px] font-bold text-slate-700">Loading report…</div>
            <p className="text-[12.5px] text-slate-400 max-w-sm mx-auto">
              Pulling settled bills for {fromDate} to {toDate}.
            </p>
          </div>
        ) : salesQuery.isError ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-20 text-center shadow-xs space-y-3 print:hidden">
            <div className="text-[14.5px] font-bold text-slate-700">Could not load this report</div>
            <p className="text-[12.5px] text-slate-400 max-w-sm mx-auto">
              Check that the backend is running and Postgres is reachable, then try again.
            </p>
          </div>
        ) : reportDataset.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-20 text-center shadow-xs space-y-3 print:hidden">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
              <Search className="h-8 w-8" />
            </div>
            <div className="text-[14.5px] font-bold text-slate-700">No Matching Report Data</div>
            <p className="text-[12.5px] text-slate-400 max-w-sm mx-auto">
              We couldn't find any records for the selected date range or search keyword.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-300 bg-white shadow-xs overflow-hidden print:border-none print:shadow-none print:rounded-none print:overflow-visible print:w-full print:m-0 print:p-0">
            <div className="overflow-x-auto print:overflow-visible print:w-full print:m-0 print:p-0">
              <table className="w-full text-center text-[13px] border-collapse border border-slate-300 print:w-full print:text-[11px]">
                <DataTableHeader
                  columns={activeColumns}
                  data={reportDataset}
                  sortConfig={sortConfig}
                  onSortChange={setSortConfig}
                  visibleColumns={visibleColumns}
                  onVisibleColumnsChange={setVisibleColumns}
                  themeVariant="primary"
                />

                {/* Screen Paginated Body */}
                <tbody className="divide-y divide-slate-300 border-b border-slate-300 print:hidden">
                  {paginatedReportData.map((row, idx) => (
                    <tr key={String(row.id || row.code || idx)} className="hover:bg-slate-50 transition border-b border-slate-300">
                      {activeColumns.map((col) => (
                        <td
                          key={col.id}
                          className="py-3 px-3.5 align-middle text-center border-r border-b border-slate-300 text-black font-semibold text-[12.5px] whitespace-nowrap"
                        >
                          {col.getValue ? (
                            <span className="text-black font-bold">
                              {col.getValue(row)}
                            </span>
                          ) : (
                            String((row as any)[col.id || ""] || "")
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>

                {/* Print Full Report Body (All records printed without pagination cutting) */}
                <tbody className="hidden print:table-row-group divide-y divide-black">
                  {reportDataset.map((row, rIdx) => (
                    <tr key={String(row.id || rIdx)} className="print:border-b print:border-black">
                      {activeColumns.map((col) => (
                        <td
                          key={col.id}
                          className="py-2 px-3 text-[11px] align-middle text-center print:border print:border-black text-black font-semibold"
                        >
                          {col.getValue ? (
                            col.getValue(row)
                          ) : (
                            String((row as any)[col.id || ""] || "")
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Print Document Footer */}
            <div className="hidden print:flex items-center justify-between text-[10px] text-slate-500 pt-3 border-t border-slate-300 mt-4 w-full">
              <span>Highway Inn Bar &amp; Restaurant &bull; Official Management Report</span>
              <span>Generated on {new Date().toLocaleDateString()}</span>
            </div>

            <DataTableFooter
              className="print:hidden"
              totalRecords={reportDataset.length}
              currentPage={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setPage(1);
              }}
              selectedCount={selectedIds.length}
              onExport={(fmt) => {
                if (fmt === "csv" || fmt === "xlsx") {
                  handleExportExcel();
                } else {
                  toast.success(`Exporting report as ${fmt.toUpperCase()}...`);
                }
              }}
            />
          </div>
        )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // RENDER: REPORTS CATALOG & DASHBOARD (ALIGNED WITH PMS/POS DESIGN)
  // ---------------------------------------------------------
  return (
    <div className="flex flex-col flex-1 min-h-0 w-full overflow-y-auto bg-slate-50/50 pb-8">
      {/* 1. Header Toolbar - Flush with TopBar and Full Width */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 py-3 shrink-0">
        <div>
          <div className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase">
            Reports
          </div>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-900 tracking-tight leading-tight">
            Reports & Graphs
          </h1>
        </div>

        {/* Top-right Search and View Toggle Switcher */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8.5 pl-8.5 pr-8 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 shadow-xs transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-700 font-medium cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("catalog")}
              className={`h-8.5 px-3 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "catalog"
                  ? "bg-teal-700 text-white shadow-xs hover:bg-teal-800"
                  : "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Catalog</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("dashboard")}
              className={`h-8.5 px-3 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "dashboard"
                  ? "bg-teal-700 text-white shadow-xs hover:bg-teal-800"
                  : "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area with matching responsive padding like Reservations List */}
      <div className="responsive-page-x py-4 sm:py-5 space-y-4 flex-1">
        {/* 2. Horizontal Filter Tabs / Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
          {CATEGORY_PILLS.map((pill) => {
            const isActive = activePill === pill.id;
            if (pill.id === "favorites") {
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setActivePill(pill.id)}
                  className={`px-3.5 py-1 rounded-full font-medium transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs"
                  }`}
                >
                  <Star
                    className={`h-3 w-3 ${
                      isActive ? "fill-white text-white" : "fill-amber-500 text-amber-500"
                    }`}
                  />
                  <span>Favorites ({favoriteCount})</span>
                </button>
              );
            }
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setActivePill(pill.id)}
                className={`px-3.5 py-1 rounded-full font-medium transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-teal-700 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

      {/* 3. VIEW MODE: DASHBOARD ANALYTICS PREVIEW */}
      {viewMode === "dashboard" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* KPI Strip */}
          {(() => {
            const kpis = live ? dashQuery.data?.kpis : null;
            const grossDelta = kpis?.grossDeltaPct ?? 12.4;
            return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Gross Sales</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 font-bold">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 text-[22px] font-extrabold text-slate-900">
                {kpis ? formatINR(kpis.grossSales) : "₹3,74,200"}
              </div>
              <div className={`text-[11.5px] font-semibold mt-1 ${grossDelta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {grossDelta >= 0 ? "↑" : "↓"} {Math.abs(grossDelta)}% vs prior period
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Total Bills</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 font-bold">
                  <Receipt className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 text-[22px] font-extrabold text-slate-900">
                {kpis ? kpis.totalBills.toLocaleString("en-IN") : "482"}
              </div>
              <div className="text-[11.5px] text-slate-500 font-semibold mt-1">
                Avg {kpis ? kpis.billsPerDay : 68} bills / day
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Avg Ticket Size</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 font-bold">
                  <Coins className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 text-[22px] font-extrabold text-slate-900">
                {kpis ? formatINR(kpis.avgTicket) : "₹776.35"}
              </div>
              <div className="text-[11.5px] text-emerald-600 font-semibold mt-1">
                {kpis
                  ? `${kpis.avgTicketDelta >= 0 ? "↑" : "↓"} ${formatINR(Math.abs(kpis.avgTicketDelta))} vs prior period`
                  : "↑ ₹42.10 higher per bill"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Dine-In Volume</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 font-bold">
                  <Utensils className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 text-[22px] font-extrabold text-slate-900">
                {kpis ? `${kpis.dineInVolume}%` : "58.2%"}
              </div>
              <div className="text-[11.5px] text-slate-500 font-semibold mt-1">Dine-In & Banquet share</div>
            </div>
          </div>
            );
          })()}

          {/* Quick Analytics Visuals */}
          {(() => {
            const channels = live && dashQuery.data?.channels?.length
              ? dashQuery.data.channels
              : [
                  { label: "Dine-In Restaurant", amount: 182400, pct: 48.7, color: "teal" },
                  { label: "Banquet & Hall Events", amount: 115000, pct: 30.7, color: "sky" },
                  { label: "Online Delivery (Zomato & Swiggy)", amount: 48200, pct: 12.9, color: "purple" },
                  { label: "Direct Counter Takeaway", amount: 28600, pct: 7.7, color: "amber" },
                ];
            const barColor: Record<string, string> = {
              teal: "bg-teal-600",
              sky: "bg-sky-600",
              purple: "bg-purple-600",
              amber: "bg-amber-500",
            };
            const dishes = live && dashQuery.data?.topDishes?.length
              ? dashQuery.data.topDishes
              : [
                  { name: "Murgh Dum Biryani (Handi)", category: "High Margin", qty: 142, revenue: 68160 },
                  { name: "Paneer Butter Masala", category: "Veg Best Seller", qty: 118, revenue: 42480 },
                  { name: "Tandoori Pomfret", category: "Starters", qty: 64, revenue: 41600 },
                  { name: "Butter Garlic Naan", category: "Breads", qty: 410, revenue: 30750 },
                ];
            return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-slate-900">Channel Revenue Distribution</h3>
                <button
                  type="button"
                  onClick={() => handleOpenReport(ALL_REPORTS[0])}
                  className="text-[12px] font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View Sales Report</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-3 pt-1">
                {channels.map((ch) => (
                  <div key={ch.label}>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>{ch.label}</span>
                      <span className="font-bold">
                        {formatINR(ch.amount)} ({ch.pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor[ch.color || "teal"] || "bg-teal-600"}`}
                        style={{ width: `${Math.min(ch.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-slate-900">Top Moving Dishes</h3>
                <button
                  type="button"
                  onClick={() => handleOpenReport(ALL_REPORTS[4])}
                  className="text-[12px] font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View Item Report</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {dishes.length === 0 ? (
                  <div className="py-6 text-[12.5px] text-slate-400">No settled dishes in this period.</div>
                ) : (
                  dishes.map((dish, idx) => (
                    <div key={`${dish.name}-${idx}`} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-50 text-teal-800 font-bold text-[11px]">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-[12.5px] font-bold text-slate-900">{dish.name}</div>
                          <div className="text-[11px] text-slate-500">{dish.qty} sold</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[12.5px] font-bold text-slate-900">{formatINR(dish.revenue)}</div>
                        <div className="text-[11px] text-emerald-600 font-semibold">{dish.category || "Menu"}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
            );
          })()}
        </div>
      )}

      {/* 4. VIEW MODE: STRUCTURED GROUPED REPORT CATALOG (EXACT ALIGNMENT WITH SCREENSHOT) */}
      {viewMode === "catalog" && (
        <div className="space-y-6 pb-16">
          {Object.keys(groupedSections).length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-400 space-y-2 shadow-xs">
              <FileText className="h-10 w-10 text-slate-300 mx-auto" />
              <div className="text-[15px] font-bold text-slate-700">No reports found</div>
              <p className="text-[12.5px] text-slate-400">
                No reports matched "{searchQuery}" in the selected category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActivePill("all");
                }}
                className="mt-2 inline-flex items-center rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 transition cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            Object.entries(groupedSections).map(([groupTitle, cards]) => (
              <div key={groupTitle} className="space-y-3">
                {/* Section Title with horizontal divider line (Exact match with reference screenshot) */}
                <div className="flex items-center gap-3 pt-2">
                  <h2 className="text-[11px] font-bold text-slate-500 tracking-wider uppercase whitespace-nowrap">
                    {groupTitle}
                  </h2>
                  <div className="h-[1px] bg-slate-200/80 flex-1" />
                </div>

                {/* 5-Column Responsive Grid matching Reference Screenshot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-3.5">
                  {cards.map((report) => {
                    const Icon = report.icon;
                    const colorStyle = COLOR_STYLES[report.iconColor] || COLOR_STYLES.teal;

                    return (
                      <div
                        key={report.id}
                        onClick={() => handleOpenReport(report)}
                        className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer flex flex-col justify-between group min-h-[105px]"
                      >
                        {/* Top Row: Left icon container, Right star button & NEW badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorStyle.bg} ${colorStyle.text}`}
                          >
                            <Icon className="w-4 h-4 stroke-[1.8]" />
                          </div>

                          <div className="flex items-center gap-1 -mr-1 -mt-0.5">
                            {report.isNew && (
                              <span className="bg-[#00a86b] text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded-full tracking-wider uppercase leading-none shadow-xs">
                                NEW
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => toggleFavorite(report.id, e)}
                              className="p-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-slate-100 transition-colors cursor-pointer"
                              title={report.isFavorite ? "Remove from favorites" : "Add to favorites"}
                            >
                              <Star
                                className={`w-3.5 h-3.5 transition-colors ${
                                  report.isFavorite
                                    ? "fill-amber-400 text-amber-500 stroke-amber-500"
                                    : "text-slate-400 group-hover:text-slate-600 stroke-[1.6]"
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Middle/Bottom: Title & Description */}
                        <div className="mt-2.5 flex-1">
                          <h3 className="text-[12.5px] font-bold text-slate-900 leading-snug group-hover:text-teal-700 transition-colors">
                            {report.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">
                            {report.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      </div>
    </div>
  );
}
