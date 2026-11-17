import React, { useState, useMemo, useEffect } from "react";
import {
  Star,
  FileText,
  ArrowRight,
  ArrowLeft,
  Eye,
  TrendingUp,
  BarChart2,
  RefreshCw,
  Printer,
  Search,
  Calendar,
  CalendarDays,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldAlert,
  Package,
  Layers,
  Truck,
  DollarSign,
  Percent,
  Award,
  AlertTriangle,
  Check,
  LayoutGrid,
  BarChart3,
  Utensils,
  Boxes,
  Receipt,
  Coins,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { exportToExcel } from "@/utils/exportUtils";
import { openPrintReportTable } from "@/utils/printReportTable";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import {
  DataTableHeader,
  DataTableFooter,
  ChooseColumnsMenu,
  type DataTableColumn,
} from "@/components/common";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Calendar as PmsCalendar,
  type DateRange,
} from "@/components/ui/calendar";
import { useOutletContext } from "@/context/PosOutletContext";
import {
  useStockItems,
  useStockPurchases,
  usePurchaseOrders,
  useWastageEntries,
  useDishRecipes,
  useVendors,
} from "@/hooks/queries/usePosInventory";

// ---------------------------------------------------------------------------
// Date Utilities (PMS dd-MM-yyyy Display Standard)
// ---------------------------------------------------------------------------
const formatToYmd = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseYmd = (str?: string): Date | undefined => {
  if (!str) return undefined;
  const parts = str.split("-");
  if (parts.length !== 3) return undefined;
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
};

const formatToDmy = (str?: string): string => {
  if (!str) return "dd-mm-yyyy";
  const parts = str.split("-");
  if (parts.length !== 3) return "dd-mm-yyyy";
  return `${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}-${parts[0]}`;
};

// ---------------------------------------------------------------------------
// Report Metadata Interfaces
// ---------------------------------------------------------------------------
export interface ReportDefinition {
  id: string;
  tabCategory:
    | "movements"
    | "closing_tracking"
    | "po_monitoring"
    | "cost_profitability"
    | "all_other";
  categoryLabel: string;
  title: string;
  desc: string;
  iconColor: "teal" | "emerald" | "amber" | "purple" | "sky" | "indigo" | "rose";
  icon: React.ElementType;
  isFavorite?: boolean;
  isNew?: boolean;
}

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

const CATEGORY_PILLS = [
  { id: "all", label: "All reports" },
  { id: "movements", label: "Movements & Transfers" },
  { id: "closing_tracking", label: "Closing & Variance" },
  { id: "po_monitoring", label: "Purchase Orders" },
  { id: "cost_profitability", label: "Cost & Profitability" },
  { id: "all_other", label: "Other Store Reports" },
  { id: "favorites", label: "Favorites" },
] as const;

const SECTION_ORDER = [
  { key: "movements", title: "PURCHASE & TRANSFER MOVEMENTS" },
  { key: "closing_tracking", title: "CLOSING STOCK & VARIANCE TRACKING" },
  { key: "po_monitoring", title: "PURCHASE ORDER MONITORING" },
  { key: "cost_profitability", title: "COST & PROFITABILITY ANALYSIS" },
  { key: "all_other", title: "STORE AUDIT & OTHER REPORTS" },
];

const formatINR = (val: number): string =>
  `₹${val.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// ---------------------------------------------------------------------------
// Complete Catalog of Inventory & Store Analytical Reports
// ---------------------------------------------------------------------------
export const ALL_INVENTORY_REPORTS: ReportDefinition[] = [
  // 1. Consumption Summary
  {
    id: "REP-CONS-01",
    tabCategory: "cost_profitability",
    categoryLabel: "Cost & Consumption",
    title: "Consumption Summary",
    desc: "Displays raw material consumption details, including usage from bills, wastage, transfers, and capturing all types of movements.",
    iconColor: "teal",
    icon: RefreshCw,
    isFavorite: true,
  },
  // 2. Opening - Closing Report
  {
    id: "REP-OPCL-02",
    tabCategory: "closing_tracking",
    categoryLabel: "Closing Stock",
    title: "Opening - Closing Report",
    desc: "Displays opening and closing balances, avg purchase price, and total stock value for each raw material over the selected period.",
    iconColor: "emerald",
    icon: BarChart2,
    isFavorite: true,
  },
  // 3. Food Costing Report
  {
    id: "REP-FOODCOST-03",
    tabCategory: "cost_profitability",
    categoryLabel: "Profitability",
    title: "Food Costing Report",
    desc: "Cost analysis of each menu item, including raw material cost, sales price, and calculated profit margin percentage.",
    iconColor: "amber",
    icon: TrendingUp,
    isFavorite: true,
  },
  // 4. Recipe Costing
  {
    id: "REP-RECIPE-04",
    tabCategory: "cost_profitability",
    categoryLabel: "Recipe Master",
    title: "Recipe Costing",
    desc: "Shows the estimated cost and profit of a menu item before billing, based on recipe ingredients and selected material prices.",
    iconColor: "purple",
    icon: FileText,
    isNew: true,
    isFavorite: true,
  },
  // 5. GRN Summary
  {
    id: "REP-GRN-05",
    tabCategory: "movements",
    categoryLabel: "Purchase Movements",
    title: "Goods Received Note (GRN) Summary",
    desc: "Complete chronological audit trail of all vendor invoices received and accepted at store.",
    iconColor: "sky",
    icon: FileText,
  },
  // 6. Section Transfer Ledger
  {
    id: "REP-XFER-06",
    tabCategory: "movements",
    categoryLabel: "Stock Transfers",
    title: "Inter-Outlet / Section Transfer Ledger",
    desc: "Detailed movement vouchers between kitchen, bar, central warehouse, and banquet pantry.",
    iconColor: "emerald",
    icon: RefreshCw,
  },
  // 7. Supplier Purchase Summary
  {
    id: "REP-SUPP-07",
    tabCategory: "movements",
    categoryLabel: "Procurement Summary",
    title: "Supplier Purchase Summary",
    desc: "Consolidated procurement summary by supplier showing volume, spend, returns, and payment balances.",
    iconColor: "indigo",
    icon: Package,
  },
  // 8. Vendor Return Ledger
  {
    id: "REP-VRET-08",
    tabCategory: "movements",
    categoryLabel: "Vendor Adjustments",
    title: "Vendor Return Ledger",
    desc: "Debit notes and goods return vouchers issued to suppliers for damaged, sub-standard, or rejected materials.",
    iconColor: "rose",
    icon: Truck,
  },
  // 9. Daily Closing Variance Log
  {
    id: "REP-VAR-09",
    tabCategory: "closing_tracking",
    categoryLabel: "Stock Variance",
    title: "Daily Closing Variance Log",
    desc: "Calculates difference between physical counting entries and theoretical closing stock.",
    iconColor: "amber",
    icon: BarChart2,
  },
  // 10. Closing Stock Submission Audit
  {
    id: "REP-CSUB-10",
    tabCategory: "closing_tracking",
    categoryLabel: "Audit & Compliance",
    title: "Closing Stock Submission Audit",
    desc: "Staff compliance log showing exact timestamp and user ID when daily closing stock was locked.",
    iconColor: "teal",
    icon: FileText,
  },
  // 11. Wastage Loss Register
  {
    id: "REP-WASTE-11",
    tabCategory: "closing_tracking",
    categoryLabel: "Wastage Control",
    title: "Wastage & Damage Loss Register",
    desc: "Tracks ingredients spoiled, burnt, expired, or dropped during kitchen preparation shifts.",
    iconColor: "rose",
    icon: AlertTriangle,
  },
  // 12. Physical vs Theoretical Stock
  {
    id: "REP-PHTH-12",
    tabCategory: "closing_tracking",
    categoryLabel: "Stock Reconciliations",
    title: "Physical vs Theoretical Stock",
    desc: "Direct comparison between POS recorded usage and actual physical storeroom balances.",
    iconColor: "purple",
    icon: Layers,
  },
  // 13. Pending Purchase Orders Tracking
  {
    id: "REP-PO-13",
    tabCategory: "po_monitoring",
    categoryLabel: "PO Tracking",
    title: "Pending Purchase Orders Tracking",
    desc: "List of open POs issued to vendors awaiting delivery fulfillment or acknowledgment.",
    iconColor: "sky",
    icon: FileText,
    isNew: true,
  },
  // 14. PO Fulfillment & Delay Analysis
  {
    id: "REP-PODELAY-14",
    tabCategory: "po_monitoring",
    categoryLabel: "Delivery Performance",
    title: "PO Fulfillment & Delay Analysis",
    desc: "Vendor delivery punctuality tracking comparing promised vs actual delivery dates.",
    iconColor: "amber",
    icon: Clock,
  },
  // 15. Vendor Lead Time & Fill Rate
  {
    id: "REP-VFILL-15",
    tabCategory: "po_monitoring",
    categoryLabel: "Vendor Scorecard",
    title: "Vendor Lead Time & Fill Rate",
    desc: "Vendor scorecard evaluating average turnaround time, complete order fulfillment rate, and quality compliance.",
    iconColor: "emerald",
    icon: Award,
  },
  // 16. Gross Margin & Food Cost Matrix
  {
    id: "REP-MARGIN-16",
    tabCategory: "cost_profitability",
    categoryLabel: "Margin Optimization",
    title: "Gross Margin & Food Cost % Matrix",
    desc: "Identifies top high-margin dishes and dishes where ingredient inflation reduced profitability.",
    iconColor: "teal",
    icon: TrendingUp,
    isNew: true,
  },
  // 17. Ingredient Price Fluctuation Trend
  {
    id: "REP-INFL-17",
    tabCategory: "cost_profitability",
    categoryLabel: "Inflation Trends",
    title: "Ingredient Price Fluctuation Trend",
    desc: "Monitors vendor price shifts across essential commodities compared to baseline contract rates.",
    iconColor: "sky",
    icon: DollarSign,
  },
  // 18. Menu Item Contribution Margin
  {
    id: "REP-CONTR-18",
    tabCategory: "cost_profitability",
    categoryLabel: "Menu Engineering",
    title: "Menu Item Contribution Margin",
    desc: "Evaluates which items generate the bulk of the kitchen's net profit contribution.",
    iconColor: "purple",
    icon: Percent,
  },
  // 19. Stock Expiry & Aging Analysis
  {
    id: "REP-EXP-19",
    tabCategory: "all_other",
    categoryLabel: "Perishables Management",
    title: "Stock Expiry & Aging Analysis",
    desc: "Early warning system tracking perishable items nearing expiration dates in dry store, chiller, and freezer.",
    iconColor: "rose",
    icon: ShieldAlert,
    isNew: true,
  },
  // 20. Reorder Level Breach Alert Log
  {
    id: "REP-REORDER-20",
    tabCategory: "all_other",
    categoryLabel: "Replenishment Alerts",
    title: "Reorder Level Breach Alert Log",
    desc: "Automated replenishment alerts triggered when stock levels dip below designated buffer thresholds.",
    iconColor: "amber",
    icon: AlertCircle,
  },
  // 21. Batch & Lot Tracking Register
  {
    id: "REP-BATCH-21",
    tabCategory: "all_other",
    categoryLabel: "Traceability & Safety",
    title: "Batch & Lot Tracking Register",
    desc: "End-to-end traceability register linking raw material batches from supplier invoice to kitchen consumption.",
    iconColor: "teal",
    icon: Layers,
  },
  // 22. Daily Stock Summary Report
  {
    id: "REP-STK-00",
    tabCategory: "closing_tracking",
    categoryLabel: "Stock Valuation",
    title: "Daily Stock Summary Report",
    desc: "Detailed breakdown of opening, inward purchases, consumption, and closing valuation across raw materials.",
    iconColor: "emerald",
    icon: BarChart2,
    isNew: true,
  },
  // 23. Order-wise Consumption
  {
    id: "REP-ORD-00",
    tabCategory: "cost_profitability",
    categoryLabel: "Consumption Audit",
    title: "Order-wise Raw Material Consumption",
    desc: "Audit log of bill settlements and recipe ingredient deductions for each customer order.",
    iconColor: "teal",
    icon: Utensils,
  },
];

// ---------------------------------------------------------------------------
// REPORT DATASETS & TAILORED TABLE SCHEMAS
// ---------------------------------------------------------------------------
export const REPORT_DATASETS: Record<
  string,
  { columns: DataTableColumn<any>[]; data: any[] }
> = {
  // 0A. Daily Stock Summary Report
  "REP-STK-00": {
    columns: [
      { id: "name", label: "Raw Material", sortable: true, filterable: true, defaultWidth: 220, getValue: (r) => r.name },
      { id: "category", label: "Category", sortable: true, filterable: true, defaultWidth: 140, getValue: (r) => r.category },
      { id: "opening", label: "Opening (A)", align: "right", sortable: true, defaultWidth: 110, getValue: (r) => String(r.opening) },
      { id: "purchase", label: "Purchase (B)", align: "right", sortable: true, defaultWidth: 110, getValue: (r) => String(r.purchase) },
      { id: "consumed", label: "Consumption", align: "right", sortable: true, defaultWidth: 120, getValue: (r) => String(r.consumed) },
      { id: "wastage", label: "Wastage", align: "right", sortable: true, defaultWidth: 100, getValue: (r) => String(r.wastage) },
      { id: "transfer", label: "Transfers", align: "right", sortable: true, defaultWidth: 100, getValue: (r) => String(r.transfer) },
      { id: "closingStock", label: "Closing Stock", align: "right", sortable: true, defaultWidth: 120, getValue: (r) => String(r.closingStock) },
      { id: "valuation", label: "Valuation (₹)", align: "right", sortable: true, defaultWidth: 140, getValue: (r) => `₹ ${Number(r.valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
    ],
    data: [],
  },

  // 0B. Order-wise Consumption
  "REP-ORD-00": {
    columns: [
      { id: "orderNumber", label: "Order Ref", sortable: true, filterable: true, defaultWidth: 120, getValue: (r) => r.orderNumber },
      { id: "time", label: "Time", defaultWidth: 110, getValue: (r) => r.time },
      { id: "table", label: "Table / Counter", sortable: true, filterable: true, defaultWidth: 150, getValue: (r) => r.table },
      { id: "item", label: "Billed Dish", sortable: true, filterable: true, defaultWidth: 200, getValue: (r) => r.item },
      { id: "recipeItems", label: "Deducted Ingredients", defaultWidth: 240, getValue: (r) => r.recipeItems },
      { id: "balanceAfter", label: "Remaining Stock", align: "right", defaultWidth: 140, getValue: (r) => r.balanceAfter },
      { id: "status", label: "Status", align: "center", defaultWidth: 110, getValue: (r) => r.status },
    ],
    data: [],
  },
  // 1. Consumption Summary
  "REP-CONS-01": {
    columns: [
      { id: "code", label: "Item Code", sortable: true, defaultWidth: 120, getValue: (r) => r.code },
      { id: "name", label: "Raw Material", sortable: true, filterable: true, defaultWidth: 220, getValue: (r) => r.name },
      { id: "category", label: "Category", sortable: true, filterable: true, defaultWidth: 150, getValue: (r) => r.category },
      { id: "unit", label: "Unit", defaultWidth: 90, align: "center", getValue: (r) => r.unit },
      { id: "openingQty", label: "Opening Qty", align: "right", sortable: true, defaultWidth: 120, getValue: (r) => String(r.openingQty) },
      { id: "purchaseQty", label: "Purchases", align: "right", sortable: true, defaultWidth: 110, getValue: (r) => String(r.purchaseQty) },
      { id: "transfersQty", label: "Transfers", align: "right", sortable: true, defaultWidth: 110, getValue: (r) => String(r.transfersQty) },
      { id: "wastageQty", label: "Wastage", align: "right", sortable: true, defaultWidth: 100, getValue: (r) => String(r.wastageQty) },
      { id: "consumedQty", label: "Total Consumed", align: "right", sortable: true, defaultWidth: 130, getValue: (r) => String(r.consumedQty) },
      { id: "avgRate", label: "Avg Rate (₹)", align: "right", sortable: true, defaultWidth: 120, getValue: (r) => `₹ ${r.avgRate.toFixed(2)}` },
      { id: "totalCost", label: "Total Cost (₹)", align: "right", sortable: true, defaultWidth: 140, getValue: (r) => `₹ ${r.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
    ],
    data: [],
  },

  // 2. Opening - Closing Report
  "REP-OPCL-02": {
    columns: [
      { id: "code", label: "Item Code", sortable: true, defaultWidth: 110, getValue: (r) => r.code },
      { id: "name", label: "Raw Material", sortable: true, filterable: true, defaultWidth: 220, getValue: (r) => r.name },
      { id: "category", label: "Category", sortable: true, defaultWidth: 140, getValue: (r) => r.category },
      { id: "unit", label: "Unit", align: "center", defaultWidth: 80, getValue: (r) => r.unit },
      { id: "openingQty", label: "Opening", align: "right", sortable: true, defaultWidth: 100, getValue: (r) => String(r.openingQty) },
      { id: "inwardQty", label: "Inward (+)", align: "right", sortable: true, defaultWidth: 110, getValue: (r) => String(r.inwardQty) },
      { id: "outwardQty", label: "Outward (-)", align: "right", sortable: true, defaultWidth: 110, getValue: (r) => String(r.outwardQty) },
      { id: "closingQty", label: "Closing Stock", align: "right", sortable: true, defaultWidth: 120, getValue: (r) => String(r.closingQty) },
      { id: "unitRate", label: "Valuation Rate (₹)", align: "right", sortable: true, defaultWidth: 140, getValue: (r) => `₹ ${r.unitRate.toFixed(2)}` },
      { id: "closingValue", label: "Total Value (₹)", align: "right", sortable: true, defaultWidth: 140, getValue: (r) => `₹ ${r.closingValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
      { id: "healthStatus", label: "Stock Health", align: "center", filterable: true, defaultWidth: 130, getValue: (r) => r.healthStatus },
    ],
    data: [],
  },

  // 3. Food Costing Report
  "REP-FOODCOST-03": {
    columns: [
      { id: "menuCode", label: "Menu Code", sortable: true, defaultWidth: 110, getValue: (r) => r.menuCode },
      { id: "dishName", label: "Menu Dish Name", sortable: true, filterable: true, defaultWidth: 230, getValue: (r) => r.dishName },
      { id: "section", label: "Menu Section", sortable: true, filterable: true, defaultWidth: 140, getValue: (r) => r.section },
      { id: "salesPrice", label: "Selling Price (₹)", align: "right", sortable: true, defaultWidth: 130, getValue: (r) => `₹ ${r.salesPrice.toFixed(2)}` },
      { id: "costPrice", label: "Recipe Cost (₹)", align: "right", sortable: true, defaultWidth: 130, getValue: (r) => `₹ ${r.costPrice.toFixed(2)}` },
      { id: "grossMargin", label: "Gross Profit (₹)", align: "right", sortable: true, defaultWidth: 130, getValue: (r) => `₹ ${r.grossMargin.toFixed(2)}` },
      { id: "costPercent", label: "Food Cost %", align: "right", sortable: true, defaultWidth: 120, getValue: (r) => `${r.costPercent.toFixed(1)}%` },
      { id: "targetPercent", label: "Target %", align: "right", defaultWidth: 100, getValue: (r) => `${r.targetPercent.toFixed(1)}%` },
      { id: "marginPercent", label: "Profit Margin %", align: "right", sortable: true, defaultWidth: 130, getValue: (r) => `${r.marginPercent.toFixed(1)}%` },
      { id: "varianceStatus", label: "Variance Status", align: "center", filterable: true, defaultWidth: 140, getValue: (r) => r.varianceStatus },
    ],
    data: [],
  },

  // 4. Recipe Costing
  "REP-RECIPE-04": {
    columns: [
      { id: "formulaCode", label: "Formula ID", sortable: true, defaultWidth: 120, getValue: (r) => r.formulaCode },
      { id: "recipeName", label: "Preparation Recipe", sortable: true, filterable: true, defaultWidth: 240, getValue: (r) => r.recipeName },
      { id: "prepCategory", label: "Category", sortable: true, defaultWidth: 150, getValue: (r) => r.prepCategory },
      { id: "batchYield", label: "Batch Yield", defaultWidth: 130, getValue: (r) => r.batchYield },
      { id: "ingredientCount", label: "Ingredients", align: "center", defaultWidth: 110, getValue: (r) => `${r.ingredientCount} SKUs` },
      { id: "batchCost", label: "Total Batch Cost (₹)", align: "right", sortable: true, defaultWidth: 160, getValue: (r) => `₹ ${r.batchCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
      { id: "portionCost", label: "Cost Per Portion (₹)", align: "right", sortable: true, defaultWidth: 160, getValue: (r) => `₹ ${r.portionCost.toFixed(2)}` },
      { id: "suggestedPrice", label: "Recommended Menu Price (₹)", align: "right", sortable: true, defaultWidth: 180, getValue: (r) => `₹ ${r.suggestedPrice.toFixed(2)}` },
      { id: "lastUpdated", label: "Costing Revised", defaultWidth: 130, getValue: (r) => r.lastUpdated },
    ],
    data: [],
  },

  // 5. Goods Received Note (GRN) Summary
  "REP-GRN-05": {
    columns: [
      { id: "grnNo", label: "GRN Number", sortable: true, defaultWidth: 150, getValue: (r) => r.grnNo },
      { id: "poRef", label: "PO Reference", sortable: true, defaultWidth: 140, getValue: (r) => r.poRef },
      { id: "vendorName", label: "Vendor / Supplier", sortable: true, filterable: true, defaultWidth: 210, getValue: (r) => r.vendorName },
      { id: "invoiceDate", label: "Bill Date", sortable: true, defaultWidth: 120, getValue: (r) => r.invoiceDate },
      { id: "itemCount", label: "SKUs Received", align: "center", defaultWidth: 120, getValue: (r) => `${r.itemCount} SKUs` },
      { id: "receivedBy", label: "Storekeeper", defaultWidth: 140, getValue: (r) => r.receivedBy },
      { id: "totalAmount", label: "Total Bill (₹)", align: "right", sortable: true, defaultWidth: 140, getValue: (r) => `₹ ${r.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
      { id: "paymentStatus", label: "Bill Status", align: "center", filterable: true, defaultWidth: 130, getValue: (r) => r.paymentStatus },
      { id: "inspectionStatus", label: "Quality Audit", align: "center", filterable: true, defaultWidth: 140, getValue: (r) => r.inspectionStatus },
    ],
    data: [],
  },

  // 6. Inter-Outlet / Section Transfer Ledger
  "REP-XFER-06": {
    columns: [
      { id: "voucherNo", label: "Voucher No", sortable: true, defaultWidth: 140, getValue: (r) => r.voucherNo },
      { id: "date", label: "Transfer Date", sortable: true, defaultWidth: 120, getValue: (r) => r.date },
      { id: "fromSection", label: "Source Location", filterable: true, defaultWidth: 160, getValue: (r) => r.fromSection },
      { id: "toSection", label: "Destination", filterable: true, defaultWidth: 160, getValue: (r) => r.toSection },
      { id: "itemName", label: "Transferred Material", sortable: true, defaultWidth: 200, getValue: (r) => r.itemName },
      { id: "qty", label: "Quantity", align: "right", defaultWidth: 100, getValue: (r) => `${r.qty} ${r.unit}` },
      { id: "unitRate", label: "Rate (₹)", align: "right", defaultWidth: 110, getValue: (r) => `₹ ${r.unitRate.toFixed(2)}` },
      { id: "totalValue", label: "Transfer Value (₹)", align: "right", sortable: true, defaultWidth: 150, getValue: (r) => `₹ ${r.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
      { id: "authorizedBy", label: "Authorized By", defaultWidth: 140, getValue: (r) => r.authorizedBy },
    ],
    data: [],
  },

  // 7. Supplier Purchase Summary
  "REP-SUPP-07": {
    columns: [
      { id: "supplierName", label: "Supplier / Vendor", sortable: true, filterable: true, defaultWidth: 220, getValue: (r) => r.supplierName },
      { id: "tradeCategory", label: "Trade Category", filterable: true, defaultWidth: 160, getValue: (r) => r.tradeCategory },
      { id: "phone", label: "Contact Phone", defaultWidth: 140, getValue: (r) => r.phone },
      { id: "invoiceCount", label: "Invoices", align: "center", sortable: true, defaultWidth: 100, getValue: (r) => String(r.invoiceCount) },
      { id: "grossSpend", label: "Gross Spend (₹)", align: "right", sortable: true, defaultWidth: 140, getValue: (r) => `₹ ${r.grossSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
      { id: "returnsValue", label: "Returns (₹)", align: "right", defaultWidth: 120, getValue: (r) => `₹ ${r.returnsValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
      { id: "netSpend", label: "Net Purchases (₹)", align: "right", sortable: true, defaultWidth: 150, getValue: (r) => `₹ ${r.netSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
      { id: "paidAmount", label: "Paid (₹)", align: "right", sortable: true, defaultWidth: 130, getValue: (r) => `₹ ${r.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
      { id: "balanceDue", label: "Outstanding (₹)", align: "right", sortable: true, defaultWidth: 140, getValue: (r) => `₹ ${r.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
    ],
    data: [],
  },

  // 8. Vendor Return Ledger
  "REP-VRET-08": {
    columns: [
      { id: "returnNo", label: "Return Voucher", sortable: true, defaultWidth: 150, getValue: (r) => r.returnNo },
      { id: "date", label: "Return Date", sortable: true, defaultWidth: 120, getValue: (r) => r.date },
      { id: "vendorName", label: "Vendor", sortable: true, filterable: true, defaultWidth: 200, getValue: (r) => r.vendorName },
      { id: "invoiceRef", label: "Invoice Ref", defaultWidth: 140, getValue: (r) => r.invoiceRef },
      { id: "itemReturned", label: "Material Returned", sortable: true, defaultWidth: 200, getValue: (r) => r.itemReturned },
      { id: "qty", label: "Returned Qty", align: "right", defaultWidth: 120, getValue: (r) => `${r.qty} ${r.unit}` },
      { id: "creditValue", label: "Debit Note (₹)", align: "right", sortable: true, defaultWidth: 140, getValue: (r) => `₹ ${r.creditValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
      { id: "reason", label: "Discrepancy Cause", defaultWidth: 220, getValue: (r) => r.reason },
      { id: "settlement", label: "Credit Settlement", align: "center", filterable: true, defaultWidth: 140, getValue: (r) => r.settlement },
    ],
    data: [],
  },

  // 9. Daily Closing Variance Log
  "REP-VAR-09": {
    columns: [
      { id: "auditDate", label: "Audit Date", sortable: true, defaultWidth: 120, getValue: (r) => r.auditDate },
      { id: "itemName", label: "Material Audited", sortable: true, filterable: true, defaultWidth: 220, getValue: (r) => r.itemName },
      { id: "category", label: "Category", filterable: true, defaultWidth: 140, getValue: (r) => r.category },
      { id: "theoQty", label: "Theoretical", align: "right", defaultWidth: 110, getValue: (r) => `${r.theoQty} ${r.unit}` },
      { id: "physQty", label: "Physical Count", align: "right", defaultWidth: 120, getValue: (r) => `${r.physQty} ${r.unit}` },
      { id: "diffQty", label: "Variance", align: "right", sortable: true, defaultWidth: 110, getValue: (r) => `${r.diffQty > 0 ? `+${r.diffQty}` : r.diffQty} ${r.unit}` },
      { id: "diffPercent", label: "Variance %", align: "right", sortable: true, defaultWidth: 110, getValue: (r) => `${r.diffPercent.toFixed(1)}%` },
      { id: "lossValue", label: "Financial Loss (₹)", align: "right", sortable: true, defaultWidth: 150, getValue: (r) => `₹ ${r.lossValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
      { id: "cause", label: "Explanation Note", defaultWidth: 220, getValue: (r) => r.cause },
    ],
    data: [],
  },

  // 10. Closing Stock Submission Audit
  "REP-CSUB-10": {
    columns: [
      { id: "date", label: "Submission Date", sortable: true, defaultWidth: 130, getValue: (r) => r.date },
      { id: "section", label: "Section / Outlet", filterable: true, defaultWidth: 180, getValue: (r) => r.section },
      { id: "staffName", label: "Counted By", sortable: true, defaultWidth: 160, getValue: (r) => r.staffName },
      { id: "role", label: "Staff Role", defaultWidth: 130, getValue: (r) => r.role },
      { id: "timestamp", label: "Lock Time", defaultWidth: 120, getValue: (r) => r.timestamp },
      { id: "itemsCounted", label: "Items Audited", align: "center", defaultWidth: 130, getValue: (r) => `${r.itemsCounted} items` },
      { id: "varianceCount", label: "Discrepancies", align: "center", defaultWidth: 120, getValue: (r) => `${r.varianceCount} flagged` },
      { id: "lockState", label: "Lock State", align: "center", filterable: true, defaultWidth: 120, getValue: (r) => r.lockState },
      { id: "approval", label: "Supervisor Review", align: "center", filterable: true, defaultWidth: 140, getValue: (r) => r.approval },
    ],
    data: [],
  },

  // 11. Wastage & Damage Loss Register
  "REP-WASTE-11": {
    columns: [
      { id: "wasteId", label: "Wastage ID", sortable: true, defaultWidth: 130, getValue: (r) => r.wasteId },
      { id: "date", label: "Date & Shift", sortable: true, defaultWidth: 140, getValue: (r) => r.date },
      { id: "itemName", label: "Material Name", sortable: true, filterable: true, defaultWidth: 210, getValue: (r) => r.itemName },
      { id: "category", label: "Category", filterable: true, defaultWidth: 140, getValue: (r) => r.category },
      { id: "qty", label: "Quantity", align: "right", defaultWidth: 110, getValue: (r) => `${r.qty} ${r.unit}` },
      { id: "unitRate", label: "Rate (₹)", align: "right", defaultWidth: 110, getValue: (r) => `₹ ${r.unitRate.toFixed(2)}` },
      { id: "lossValue", label: "Loss Amount (₹)", align: "right", sortable: true, defaultWidth: 140, getValue: (r) => `₹ ${r.lossValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
      { id: "reason", label: "Wastage Cause", defaultWidth: 200, getValue: (r) => r.reason },
      { id: "reportedBy", label: "Reported By", defaultWidth: 140, getValue: (r) => r.reportedBy },
    ],
    data: [],
  },

  // 12. Physical vs Theoretical Stock
  "REP-PHTH-12": {
    columns: [
      { id: "code", label: "Item Code", sortable: true, defaultWidth: 110, getValue: (r) => r.code },
      { id: "itemName", label: "Stock Item", sortable: true, filterable: true, defaultWidth: 220, getValue: (r) => r.itemName },
      { id: "location", label: "Storeroom", filterable: true, defaultWidth: 160, getValue: (r) => r.location },
      { id: "theoretical", label: "System Expected", align: "right", defaultWidth: 130, getValue: (r) => `${r.theoretical} ${r.unit}` },
      { id: "physical", label: "Physical Count", align: "right", defaultWidth: 130, getValue: (r) => `${r.physical} ${r.unit}` },
      { id: "variance", label: "Discrepancy", align: "right", sortable: true, defaultWidth: 120, getValue: (r) => `${r.variance > 0 ? `+${r.variance}` : r.variance} ${r.unit}` },
      { id: "varValue", label: "Discrepancy (₹)", align: "right", sortable: true, defaultWidth: 140, getValue: (r) => `₹ ${r.varValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
      { id: "accuracy", label: "Accuracy %", align: "right", sortable: true, defaultWidth: 120, getValue: (r) => `${r.accuracy.toFixed(1)}%` },
    ],
    data: [],
  },

  // 13. Pending Purchase Orders Tracking
  "REP-PO-13": {
    columns: [
      { id: "poNumber", label: "PO Number", sortable: true, defaultWidth: 140, getValue: (r) => r.poNumber },
      { id: "poDate", label: "PO Date", sortable: true, defaultWidth: 120, getValue: (r) => r.poDate },
      { id: "vendorName", label: "Vendor", sortable: true, filterable: true, defaultWidth: 210, getValue: (r) => r.vendorName },
      { id: "expectedDelivery", label: "Expected Date", sortable: true, defaultWidth: 130, getValue: (r) => r.expectedDelivery },
      { id: "itemCount", label: "SKU Lines", align: "center", defaultWidth: 100, getValue: (r) => `${r.itemCount} SKUs` },
      { id: "totalAmount", label: "PO Value (₹)", align: "right", sortable: true, defaultWidth: 140, getValue: (r) => `₹ ${r.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
      { id: "pendingDays", label: "Pending Days", align: "center", sortable: true, defaultWidth: 120, getValue: (r) => `${r.pendingDays} days` },
      { id: "priority", label: "Priority", align: "center", filterable: true, defaultWidth: 110, getValue: (r) => r.priority },
      { id: "status", label: "PO Status", align: "center", filterable: true, defaultWidth: 140, getValue: (r) => r.status },
    ],
    data: [],
  },

  // 14. PO Fulfillment & Delay Analysis
  "REP-PODELAY-14": {
    columns: [
      { id: "poNumber", label: "PO Number", sortable: true, defaultWidth: 140, getValue: (r) => r.poNumber },
      { id: "vendorName", label: "Vendor", sortable: true, filterable: true, defaultWidth: 210, getValue: (r) => r.vendorName },
      { id: "orderedDate", label: "Order Date", defaultWidth: 120, getValue: (r) => r.orderedDate },
      { id: "promisedDate", label: "Promised Date", defaultWidth: 130, getValue: (r) => r.promisedDate },
      { id: "actualDate", label: "Actual Received", defaultWidth: 130, getValue: (r) => r.actualDate },
      { id: "leadDays", label: "Lead Days", align: "center", defaultWidth: 100, getValue: (r) => `${r.leadDays} d` },
      { id: "delayDays", label: "Delay (Days)", align: "center", sortable: true, defaultWidth: 120, getValue: (r) => `${r.delayDays > 0 ? `+${r.delayDays} d` : "On-Time"}` },
      { id: "fillPercent", label: "Fill Rate %", align: "right", sortable: true, defaultWidth: 110, getValue: (r) => `${r.fillPercent}%` },
      { id: "grade", label: "Performance", align: "center", filterable: true, defaultWidth: 130, getValue: (r) => r.grade },
    ],
    data: [],
  },

  // 15. Vendor Lead Time & Fill Rate
  "REP-VFILL-15": {
    columns: [
      { id: "vendorName", label: "Vendor / Supplier", sortable: true, filterable: true, defaultWidth: 220, getValue: (r) => r.vendorName },
      { id: "ordersCount", label: "Orders Handled", align: "center", sortable: true, defaultWidth: 130, getValue: (r) => String(r.ordersCount) },
      { id: "avgLeadDays", label: "Avg Turnaround", align: "center", sortable: true, defaultWidth: 130, getValue: (r) => `${r.avgLeadDays.toFixed(1)} days` },
      { id: "onTimeRate", label: "On-Time Delivery %", align: "right", sortable: true, defaultWidth: 150, getValue: (r) => `${r.onTimeRate.toFixed(1)}%` },
      { id: "fillRate", label: "Complete Fill Rate %", align: "right", sortable: true, defaultWidth: 160, getValue: (r) => `${r.fillRate.toFixed(1)}%` },
      { id: "qualityPass", label: "Quality Pass Rate %", align: "right", sortable: true, defaultWidth: 160, getValue: (r) => `${r.qualityPass.toFixed(1)}%` },
      { id: "rating", label: "Supplier Rating", align: "center", filterable: true, defaultWidth: 140, getValue: (r) => r.rating },
    ],
    data: [],
  },

  // 16. Gross Margin & Food Cost Matrix
  "REP-MARGIN-16": {
    columns: [
      { id: "dishName", label: "Menu Item", sortable: true, filterable: true, defaultWidth: 230, getValue: (r) => r.dishName },
      { id: "category", label: "Menu Category", filterable: true, defaultWidth: 140, getValue: (r) => r.category },
      { id: "salesPrice", label: "Selling Rate (₹)", align: "right", sortable: true, defaultWidth: 130, getValue: (r) => `₹ ${r.salesPrice.toFixed(2)}` },
      { id: "ingredientCost", label: "Raw Cost (₹)", align: "right", sortable: true, defaultWidth: 120, getValue: (r) => `₹ ${r.ingredientCost.toFixed(2)}` },
      { id: "grossMargin", label: "Margin (₹)", align: "right", sortable: true, defaultWidth: 120, getValue: (r) => `₹ ${r.grossMargin.toFixed(2)}` },
      { id: "costPercent", label: "Food Cost %", align: "right", sortable: true, defaultWidth: 120, getValue: (r) => `${r.costPercent.toFixed(1)}%` },
      { id: "unitsSold", label: "Monthly Sales", align: "right", sortable: true, defaultWidth: 120, getValue: (r) => `${r.unitsSold} orders` },
      { id: "totalProfit", label: "Total Gross Profit (₹)", align: "right", sortable: true, defaultWidth: 160, getValue: (r) => `₹ ${r.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
      { id: "matrixClass", label: "Menu Matrix Class", align: "center", filterable: true, defaultWidth: 150, getValue: (r) => r.matrixClass },
    ],
    data: [],
  },

  // 17. Ingredient Price Fluctuation Trend
  "REP-INFL-17": {
    columns: [
      { id: "materialName", label: "Raw Material", sortable: true, filterable: true, defaultWidth: 220, getValue: (r) => r.materialName },
      { id: "unit", label: "Unit", align: "center", defaultWidth: 90, getValue: (r) => r.unit },
      { id: "baseRate", label: "Contract Base (₹)", align: "right", defaultWidth: 140, getValue: (r) => `₹ ${r.baseRate.toFixed(2)}` },
      { id: "currentRate", label: "Current Rate (₹)", align: "right", sortable: true, defaultWidth: 140, getValue: (r) => `₹ ${r.currentRate.toFixed(2)}` },
      { id: "delta", label: "Price Shift (₹)", align: "right", sortable: true, defaultWidth: 130, getValue: (r) => `${r.delta > 0 ? `+₹ ${r.delta.toFixed(2)}` : `-₹ ${Math.abs(r.delta).toFixed(2)}`}` },
      { id: "inflationPercent", label: "Inflation %", align: "right", sortable: true, defaultWidth: 120, getValue: (r) => `${r.inflationPercent > 0 ? `+${r.inflationPercent.toFixed(1)}%` : `${r.inflationPercent.toFixed(1)}%`}` },
      { id: "trend", label: "Market Trend", align: "center", filterable: true, defaultWidth: 130, getValue: (r) => r.trend },
      { id: "impact", label: "Dishes Impacted", defaultWidth: 200, getValue: (r) => r.impact },
    ],
    data: [],
  },

  // 18. Menu Item Contribution Margin
  "REP-CONTR-18": {
    columns: [
      { id: "dishName", label: "Menu Item", sortable: true, filterable: true, defaultWidth: 230, getValue: (r) => r.dishName },
      { id: "section", label: "Section", filterable: true, defaultWidth: 140, getValue: (r) => r.section },
      { id: "unitsSold", label: "Sold Units", align: "right", sortable: true, defaultWidth: 110, getValue: (r) => String(r.unitsSold) },
      { id: "grossSales", label: "Gross Sales (₹)", align: "right", sortable: true, defaultWidth: 140, getValue: (r) => `₹ ${r.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
      { id: "foodCostTotal", label: "Ingredient Cost (₹)", align: "right", defaultWidth: 150, getValue: (r) => `₹ ${r.foodCostTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
      { id: "contributionMargin", label: "Net Contribution (₹)", align: "right", sortable: true, defaultWidth: 160, getValue: (r) => `₹ ${r.contributionMargin.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
      { id: "sharePercent", label: "% Share of Profit", align: "right", sortable: true, defaultWidth: 140, getValue: (r) => `${r.sharePercent.toFixed(1)}%` },
    ],
    data: [],
  },

  // 19. Stock Expiry & Aging Analysis
  "REP-EXP-19": {
    columns: [
      { id: "batchNo", label: "Batch Lot No", sortable: true, defaultWidth: 140, getValue: (r) => r.batchNo },
      { id: "itemName", label: "Raw Material", sortable: true, filterable: true, defaultWidth: 220, getValue: (r) => r.itemName },
      { id: "location", label: "Storage Area", filterable: true, defaultWidth: 150, getValue: (r) => r.location },
      { id: "rcvDate", label: "Received Date", defaultWidth: 120, getValue: (r) => r.rcvDate },
      { id: "expDate", label: "Expiry Date", sortable: true, defaultWidth: 120, getValue: (r) => r.expDate },
      { id: "daysLeft", label: "Days to Expiry", align: "center", sortable: true, defaultWidth: 130, getValue: (r) => `${r.daysLeft} days` },
      { id: "stockQty", label: "In-Stock Qty", align: "right", defaultWidth: 120, getValue: (r) => `${r.stockQty} ${r.unit}` },
      { id: "stockValue", label: "At-Risk Value (₹)", align: "right", sortable: true, defaultWidth: 150, getValue: (r) => `₹ ${r.stockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
      { id: "riskStatus", label: "Action Status", align: "center", filterable: true, defaultWidth: 140, getValue: (r) => r.riskStatus },
    ],
    data: [],
  },

  // 20. Reorder Level Breach Alert Log
  "REP-REORDER-20": {
    columns: [
      { id: "code", label: "SKU Code", sortable: true, defaultWidth: 110, getValue: (r) => r.code },
      { id: "itemName", label: "Raw Material", sortable: true, filterable: true, defaultWidth: 220, getValue: (r) => r.itemName },
      { id: "category", label: "Category", filterable: true, defaultWidth: 140, getValue: (r) => r.category },
      { id: "currentStock", label: "Current Balance", align: "right", sortable: true, defaultWidth: 130, getValue: (r) => `${r.currentStock} ${r.unit}` },
      { id: "reorderLevel", label: "Buffer Threshold", align: "right", defaultWidth: 130, getValue: (r) => `${r.reorderLevel} ${r.unit}` },
      { id: "deficit", label: "Stock Deficit", align: "right", sortable: true, defaultWidth: 120, getValue: (r) => `-${r.deficit} ${r.unit}` },
      { id: "preferredVendor", label: "Preferred Supplier", defaultWidth: 200, getValue: (r) => r.preferredVendor },
      { id: "suggestedPOQty", label: "Suggested Reorder", align: "right", defaultWidth: 150, getValue: (r) => `${r.suggestedPOQty} ${r.unit}` },
      { id: "urgency", label: "Urgency Level", align: "center", filterable: true, defaultWidth: 140, getValue: (r) => r.urgency },
    ],
    data: [],
  },

  // 21. Batch & Lot Tracking Register
  "REP-BATCH-21": {
    columns: [
      { id: "lotNo", label: "Batch Lot No", sortable: true, defaultWidth: 140, getValue: (r) => r.lotNo },
      { id: "itemName", label: "Material Name", sortable: true, filterable: true, defaultWidth: 220, getValue: (r) => r.itemName },
      { id: "vendorName", label: "Vendor", sortable: true, defaultWidth: 200, getValue: (r) => r.vendorName },
      { id: "grnRef", label: "GRN Reference", defaultWidth: 140, getValue: (r) => r.grnRef },
      { id: "mfgDate", label: "Mfg Date", defaultWidth: 120, getValue: (r) => r.mfgDate },
      { id: "expDate", label: "Expiry Date", sortable: true, defaultWidth: 120, getValue: (r) => r.expDate },
      { id: "initialQty", label: "Initial Lot", align: "right", defaultWidth: 110, getValue: (r) => `${r.initialQty} ${r.unit}` },
      { id: "remainingQty", label: "Remaining", align: "right", sortable: true, defaultWidth: 110, getValue: (r) => `${r.remainingQty} ${r.unit}` },
      { id: "compliance", label: "FSSAI Compliance", align: "center", filterable: true, defaultWidth: 140, getValue: (r) => r.compliance },
    ],
    data: [],
  },
};

// ---------------------------------------------------------------------------
// Main OtherReportsView Component
// ---------------------------------------------------------------------------
export function OtherReportsView() {
  const { activeOutlet } = useOutletContext();
  const [activePill, setActivePill] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"catalog" | "dashboard">("catalog");
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);

  const [reportList, setReportList] = useState<ReportDefinition[]>(() => {
    if (typeof window === "undefined") return ALL_INVENTORY_REPORTS;
    try {
      const saved = localStorage.getItem("pos_stock_reports_favorites");
      if (!saved) {
        return ALL_INVENTORY_REPORTS;
      }
      const favIds = new Set(JSON.parse(saved));
      return ALL_INVENTORY_REPORTS.map((r) => ({ ...r, isFavorite: favIds.has(r.id) }));
    } catch {
      return ALL_INVENTORY_REPORTS;
    }
  });

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setReportList((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
      try {
        const favIds = next.filter((r) => r.isFavorite).map((r) => r.id);
        localStorage.setItem("pos_stock_reports_favorites", JSON.stringify(favIds));
      } catch {}
      return next;
    });
    toast.success("Favorite status updated");
  };

  const favoriteCount = useMemo(() => reportList.filter((r) => r.isFavorite).length, [reportList]);

  const groupedSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let filtered = reportList;

    if (activePill === "favorites") {
      filtered = filtered.filter((r) => r.isFavorite);
    } else if (activePill !== "all") {
      filtered = filtered.filter((r) => r.tabCategory === activePill);
    }

    if (query) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.desc.toLowerCase().includes(query) ||
          r.id.toLowerCase().includes(query) ||
          r.categoryLabel.toLowerCase().includes(query)
      );
    }

    const groups: Record<string, ReportDefinition[]> = {};

    SECTION_ORDER.forEach(({ key, title }) => {
      const sectionCards = filtered.filter((r) => r.tabCategory === key);
      if (sectionCards.length > 0) {
        groups[title] = sectionCards;
      }
    });

    return groups;
  }, [reportList, activePill, searchQuery]);

  // -------------------------------------------------------------------------
  // DRILLDOWN REPORT VIEW STATE (When a report is opened)
  // -------------------------------------------------------------------------
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(todayStr);

  const [dateRangePopoverOpen, setDateRangePopoverOpen] = useState(false);
  const [activeDateField, setActiveDateField] = useState<"from" | "to">("from");
  const [tempRange, setTempRange] = useState<DateRange | undefined>(() => ({
    from: parseYmd(startDate),
    to: parseYmd(endDate),
  }));

  useEffect(() => {
    setTempRange({
      from: parseYmd(startDate),
      to: parseYmd(endDate),
    });
  }, [startDate, endDate]);

  const handleOpenDateRange = (target: "from" | "to") => {
    setActiveDateField(target);
    setTempRange({
      from: parseYmd(startDate) || new Date(),
      to: parseYmd(endDate) || new Date(),
    });
    setDateRangePopoverOpen(true);
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setTempRange(range);
    if (!range?.from) return;

    if (range.to) {
      const fromYmd = formatToYmd(range.from);
      const toYmd = formatToYmd(range.to);
      setStartDate(fromYmd);
      setEndDate(toYmd);
      setTimeout(() => {
        setDateRangePopoverOpen(false);
      }, 250);
    }
  };

  const [reportSearch, setReportSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [sortConfig, setSortConfig] = useState<{ colId: string; direction: "asc" | "desc" } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});

  const { data: stockItems = [] } = useStockItems();
  const { data: purchases = [] } = useStockPurchases();
  const { data: purchaseOrders = [] } = usePurchaseOrders();
  const { data: wastageList = [] } = useWastageEntries();
  const { data: recipes = [] } = useDishRecipes();
  const { data: vendors = [] } = useVendors();

  // Dashboard Metrics Computed from Live/Mock Inventory Queries
  const dashboardStats = useMemo(() => {
    let totalStockValuation = 0;
    let lowStockCount = 0;
    const totalItems = stockItems.length;

    stockItems.forEach((item: any) => {
      const stock = Number(item.currentStock || item.openingStock || 0);
      const price = Number(item.unitPrice || item.purchasePrice || 0);
      totalStockValuation += stock * price;
      if (stock <= Number(item.minStock || 5)) {
        lowStockCount++;
      }
    });

    const openPos = purchaseOrders.filter(
      (po: any) => po.status !== "Completed" && po.status !== "Received"
    );
    const openPosTotal = openPos.reduce(
      (acc: number, po: any) => acc + Number(po.totalAmount || po.grandTotal || 0),
      0
    );

    const sortedByValuation = [...stockItems]
      .map((item: any) => ({
        name: item.name || "Item",
        category: item.category || "General",
        qty: item.currentStock ?? 0,
        unit: item.unit || "unit",
        rate: Number(item.unitPrice || item.purchasePrice || 0),
        val: (item.currentStock ?? 0) * Number(item.unitPrice || item.purchasePrice || 0),
      }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 5);

    return {
      totalStockValuation: totalStockValuation || 248950,
      totalItems: totalItems || 36,
      lowStockCount: lowStockCount || 4,
      openPosCount: openPos.length || 3,
      openPosTotal: openPosTotal || 34500,
      sortedByValuation:
        sortedByValuation.length > 0
          ? sortedByValuation
          : [
              { name: "Basmati Rice Supreme", category: "Dry Grocery", qty: 45, unit: "kg", rate: 120, val: 5400 },
              { name: "Cooking Butter Fresh", category: "Dairy", qty: 22, unit: "kg", rate: 480, val: 10560 },
              { name: "Chicken Breast Boneless", category: "Poultry", qty: 38, unit: "kg", rate: 260, val: 9880 },
              { name: "Paneer Cottage Cheese", category: "Dairy", qty: 18, unit: "kg", rate: 360, val: 6480 },
              { name: "Cooking Refined Oil", category: "Oils", qty: 50, unit: "L", rate: 140, val: 7000 },
            ],
    };
  }, [stockItems, purchaseOrders]);

  const getReportRows = (reportId: string) => {
    switch (reportId) {
      case "REP-CONS-01":
      case "REP-OPCL-02":
      case "REP-VAL-04":
      case "REP-STK-00":
      case "REP-STOCKAGE-10":
      case "REP-OPEN-CLOS-TRACK-01":
      case "REP-CLOS-ACC-02":
      case "REP-DISCREP-03":
      case "REP-DAYEND-04":
      case "REP-FIFO-01":
        return stockItems.map((item, idx) => ({
          id: item.id || String(idx + 1),
          code: item.code || item.itemCode || `SKU-${(item.id || String(idx + 1)).slice(0, 6)}`,
          name: item.name || "Item",
          category: item.category || "General",
          unit: item.unit || "unit",
          openingQty: item.openingStock ?? item.currentStock ?? 0,
          purchaseQty: 0,
          transfersQty: 0,
          wastageQty: 0,
          consumedQty: 0,
          closingQty: item.currentStock ?? 0,
          inwardQty: 0,
          outwardQty: 0,
          unitRate: Number(item.unitPrice || item.purchasePrice || 0),
          closingValue: (item.currentStock ?? 0) * Number(item.unitPrice || item.purchasePrice || 0),
          avgRate: Number(item.unitPrice || item.purchasePrice || 0),
          totalCost: (item.currentStock ?? 0) * Number(item.unitPrice || item.purchasePrice || 0),
          healthStatus: (item.currentStock ?? 0) <= (item.minStock ?? 5) ? "Reorder Needed" : "Optimal",
          currentStock: item.currentStock ?? 0,
          reorderLevel: item.minStock ?? 0,
          valuation: (item.currentStock ?? 0) * Number(item.unitPrice || item.purchasePrice || 0),
        }));
      case "REP-FOODCOST-03":
      case "REP-RECIPE-09":
        return recipes.map((r, idx) => ({
          id: r.id || String(idx + 1),
          menuCode: `REC-${(r.id || String(idx + 1)).slice(0, 6)}`,
          dishName: r.dishName || r.name || "Recipe",
          section: r.category || "Main",
          salesPrice: Number(r.sellingPrice || 0),
          costPrice: Number(r.costPrice || r.totalCost || 0),
          grossMargin: Number(r.sellingPrice || 0) - Number(r.costPrice || r.totalCost || 0),
          costPercent: r.sellingPrice ? ((Number(r.costPrice || 0) / Number(r.sellingPrice)) * 100) : 0,
          targetPercent: 30,
          marginPercent: r.sellingPrice ? (((Number(r.sellingPrice) - Number(r.costPrice || 0)) / Number(r.sellingPrice)) * 100) : 0,
          varianceStatus: "Active",
          recipeName: r.dishName || r.name || "Recipe",
          ingredientsCount: r.ingredients?.length || 0,
          portionSize: "1 Portion",
          totalBatchCost: Number(r.costPrice || r.totalCost || 0),
          costPerPortion: Number(r.costPrice || r.totalCost || 0),
        }));
      case "REP-PO-05":
      case "REP-PO-STATUS-01":
      case "REP-PO-VAL-03":
      case "REP-PO-PARTIAL-04":
      case "REP-VENDOR-DELAY-02":
        return purchaseOrders.map((po, idx) => ({
          id: po.id || String(idx + 1),
          poNumber: po.poNumber || po.orderNumber || `PO-${idx + 1}`,
          vendor: po.vendorName || po.vendor || "Vendor",
          vendorName: po.vendorName || po.vendor || "Vendor",
          orderDate: po.date || po.orderDate || "-",
          deliveryDate: po.expectedDeliveryDate || "-",
          itemsCount: po.items?.length || 1,
          totalAmount: Number(po.totalAmount || po.grandTotal || 0),
          status: po.status || "Pending",
        }));
      case "REP-WASTE-06":
        return wastageList.map((w: any, idx) => ({
          id: w.id || String(idx + 1),
          date: w.date || "-",
          itemCode: w.itemCode || "-",
          itemName: w.itemName || w.name || "Item",
          quantity: w.quantity || 0,
          unit: w.unit || "unit",
          costLoss: Number(w.costLoss || w.totalCost || 0),
          reason: w.reason || "Waste",
          recordedBy: w.approvedBy || w.recordedBy || "-",
        }));
      case "REP-VEND-08":
        return vendors.map((v, idx) => ({
          id: v.id || String(idx + 1),
          vendorName: v.name,
          contactPerson: v.contactPerson || "-",
          phone: v.phone || "-",
          totalOrders: purchases.filter((p) => p.vendorId === v.id || p.vendorName === v.name).length,
          totalPurchased: purchases
            .filter((p) => p.vendorId === v.id || p.vendorName === v.name)
            .reduce((sum, p) => sum + Number(p.totalAmount || p.grandTotal || 0), 0),
          outstandingDue: Number(v.outstandingBalance || 0),
          rating: "Active",
        }));
      case "REP-ORD-00":
        return [
          {
            id: "ORD-101",
            orderNumber: "ORD-101",
            time: "12:45 PM",
            table: "Table 4",
            item: "Paneer Butter Masala",
            recipeItems: "Paneer (200g), Butter (50g), Tomato (150g)",
            balanceAfter: "4.8 kg",
            status: "Settled",
          },
          {
            id: "ORD-102",
            orderNumber: "ORD-102",
            time: "01:15 PM",
            table: "Table 7",
            item: "Chicken Dum Biryani",
            recipeItems: "Chicken (300g), Basmati Rice (250g), Spices (30g)",
            balanceAfter: "8.2 kg",
            status: "Settled",
          },
          {
            id: "ORD-103",
            orderNumber: "ORD-103",
            time: "01:30 PM",
            table: "Room 204",
            item: "Dal Makhani & Naan",
            recipeItems: "Black Lentil (150g), Cream (40g), Butter (30g)",
            balanceAfter: "6.1 kg",
            status: "Settled",
          },
        ];
      default:
        return [];
    }
  };

  const reportData = useMemo(() => {
    if (!selectedReport) return [];
    return getReportRows(selectedReport.id);
  }, [selectedReport, stockItems, recipes, purchaseOrders, wastageList, vendors, purchases]);

  // When a report is clicked to open
  const handleOpenReport = (report: ReportDefinition) => {
    setSelectedReport(report);
    const cfg = REPORT_DATASETS[report.id] || REPORT_DATASETS["REP-CONS-01"];
    const initialVis: Record<string, boolean> = {};
    cfg.columns.forEach((c) => {
      if (c.id) initialVis[c.id] = true;
    });
    setVisibleColumns(initialVis);
    setPage(1);
    setReportSearch("");
    setSortConfig(null);
    setColumnFilters({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Get columns and data configuration for current report
  const currentDatasetConfig = useMemo(() => {
    if (!selectedReport) return null;
    const base = REPORT_DATASETS[selectedReport.id] || REPORT_DATASETS["REP-CONS-01"];
    return {
      columns: base?.columns || [],
      data: reportData,
    };
  }, [selectedReport, reportData]);

  const allColumns = useMemo(() => {
    return currentDatasetConfig?.columns || [];
  }, [currentDatasetConfig]);

  const activeColumns = useMemo(() => {
    return allColumns.filter((c) => (c.id ? visibleColumns[c.id] !== false : true));
  }, [allColumns, visibleColumns]);

  // Filtered & Sorted dataset
  const filteredDataset = useMemo(() => {
    if (!currentDatasetConfig) return [];
    let rows = currentDatasetConfig.data;

    // Search query filter
    if (reportSearch.trim()) {
      const q = reportSearch.toLowerCase().trim();
      rows = rows.filter((r) => {
        return Object.values(r).some((val) =>
          String(val).toLowerCase().includes(q)
        );
      });
    }

    // Column Filters
    for (const [colId, allowedValues] of Object.entries(columnFilters)) {
      if (!allowedValues || allowedValues.length === 0) continue;
      const col = allColumns.find((c) => c.id === colId);
      rows = rows.filter((r) => {
        let cellVal = "";
        if (col?.getValue) {
          cellVal = col.getValue(r);
        } else if ((r as any)[colId] !== undefined && (r as any)[colId] !== null) {
          cellVal = String((r as any)[colId]);
        }
        return allowedValues.includes(cellVal.trim());
      });
    }

    // Sort Config
    if (sortConfig) {
      rows = [...rows].sort((a, b) => {
        const col = allColumns.find((c) => c.id === sortConfig.colId);
        let valA: any = "";
        let valB: any = "";
        if (col?.getValue) {
          valA = col.getValue(a);
          valB = col.getValue(b);
        } else {
          valA = (a as any)[sortConfig.colId];
          valB = (b as any)[sortConfig.colId];
        }

        // Clean currency & numbers for sorting
        if (typeof valA === "string" && (valA.startsWith("₹") || valA.endsWith("%"))) {
          const numA = parseFloat(valA.replace(/[₹,%\s]/g, ""));
          const numB = parseFloat(String(valB).replace(/[₹,%\s]/g, ""));
          if (!isNaN(numA) && !isNaN(numB)) {
            return sortConfig.direction === "asc" ? numA - numB : numB - numA;
          }
        }

        if (typeof valA === "number" && typeof valB === "number") {
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
        }

        const strA = String(valA || "").toLowerCase();
        const strB = String(valB || "").toLowerCase();
        return sortConfig.direction === "asc"
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
    }

    return rows;
  }, [currentDatasetConfig, reportSearch, columnFilters, sortConfig, allColumns]);

  // Paginated dataset
  const totalPages = Math.max(1, Math.ceil(filteredDataset.length / pageSize));
  const paginatedDataset = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredDataset.slice(start, start + pageSize);
  }, [filteredDataset, page, pageSize]);

  // Export current open drilldown report to Excel
  const handleExportReportToExcel = () => {
    if (!selectedReport || !currentDatasetConfig) return;

    const headers = activeColumns.map((c) => c.label);
    const rows = filteredDataset.map((row) =>
      activeColumns.map((col) => {
        if (col.getValue) return col.getValue(row);
        return (row as any)[col.id || ""] || "";
      })
    );

    exportToExcel({
      filename: `${selectedReport.title.replace(/\s+/g, "_")}_${startDate}_to_${endDate}`,
      title: selectedReport.title,
      subtitle: `Period: ${formatToDmy(startDate)} to ${formatToDmy(endDate)} | Total Records: ${filteredDataset.length}`,
      columns: headers,
      rows,
    });
    toast.success(`Exported ${selectedReport.title} to Excel (.xlsx)`);
  };

  // Direct export from card in catalog
  const handleExportCardToExcel = (report: ReportDefinition, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const cfg = REPORT_DATASETS[report.id] || REPORT_DATASETS["REP-CONS-01"];
    const headers = cfg.columns.map((c) => c.label);
    const cardRows = getReportRows(report.id);
    const rows = cardRows.map((row) =>
      cfg.columns.map((col) => {
        if (col.getValue) return col.getValue(row);
        return (row as any)[col.id || ""] || "";
      })
    );

    exportToExcel({
      filename: `${report.title.replace(/\s+/g, "_")}_${startDate}_to_${endDate}`,
      title: report.title,
      subtitle: `Period: ${formatToDmy(startDate)} to ${formatToDmy(endDate)} | Total Records: ${cardRows.length}`,
      columns: headers,
      rows,
    });
    toast.success(`Exported ${report.title} to Excel (.xlsx)`);
  };

  // Print Report Handler
  const handlePrint = () => {
    if (!selectedReport) return;
    const cfg = currentReportConfig;
    const columns = cfg.columns.map((c) => ({
      header: c.label.toUpperCase(),
      align: (c.align as any) || "left",
    }));

    const rows = filteredDataset.map((row) =>
      cfg.columns.map((col) => {
        if (col.getValue) return col.getValue(row);
        return (row as any)[col.id || ""] || "";
      })
    );

    openPrintReportTable({
      title: selectedReport.title.toUpperCase(),
      hotelName: activeOutlet?.name || "Restaurant Outlet",
      subtitle: `Category: ${selectedReport.tabCategory.toUpperCase()} • Total Records: ${filteredDataset.length}`,
      dateRange: `${formatToDmy(startDate)} to ${formatToDmy(endDate)}`,
      columns,
      rows,
    });
  };

  // -------------------------------------------------------------------------
  // RENDER: DRILLDOWN TABULAR REPORT VIEW
  // -------------------------------------------------------------------------
  if (selectedReport) {
    return (
      <div className="flex flex-col flex-1 min-h-0 w-full overflow-y-auto bg-slate-50/50 pb-8">
        <div className="responsive-page-x py-4 sm:py-5 space-y-4 flex-1">
          {/* Top Header / Breadcrumbs Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white p-3.5 sm:p-4 rounded-xl shadow-xs print:hidden">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 hover:text-teal-700 transition cursor-pointer text-xs font-semibold"
                title="Back to All Stock Reports"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>All Stock Reports</span>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[17px] sm:text-[19px] font-bold text-slate-900 tracking-tight">
                    {selectedReport.title}
                  </h2>
                  <span className="rounded-md bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-700 border border-teal-200">
                    {selectedReport.id}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {selectedReport.categoryLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Toolbar: Choose Columns, Export to Excel, Print */}
            <div className="flex flex-wrap items-center gap-2.5">
              <ChooseColumnsMenu
                columns={allColumns}
                visibleColumns={visibleColumns}
                onVisibleColumnsChange={setVisibleColumns}
                className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12.5px] font-medium text-slate-700 shadow-2xs"
              />

              <ExportToExcelButton
                onClick={handleExportReportToExcel}
                className="h-9 px-3.5 rounded-xl text-[12.5px]"
              />

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
              >
                <Printer className="h-4 w-4 text-slate-500" />
                <span>Print</span>
              </button>
            </div>
          </div>

        {/* Filter Toolbar: PMS Date Range Picker + Search + Presets */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search within report records..."
                value={reportSearch}
                onChange={(e) => {
                  setReportSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2 text-[13px] text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              />
              {reportSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setReportSearch("");
                    setPage(1);
                  }}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* PMS From & To Date Trigger Buttons with Sliding Range Popover */}
            <Popover open={dateRangePopoverOpen} onOpenChange={setDateRangePopoverOpen}>
              <PopoverAnchor asChild>
                <div className="flex flex-wrap items-center gap-3">
                  {/* From Date */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-semibold text-slate-500">From Date:</span>
                    <button
                      type="button"
                      onClick={() => handleOpenDateRange("from")}
                      className={cn(
                        "flex items-center justify-between text-left font-sans font-medium cursor-pointer bg-white border rounded-xl px-3 py-1.5 min-w-[135px] text-[12.5px] text-slate-800 shadow-2xs transition",
                        dateRangePopoverOpen && activeDateField === "from"
                          ? "border-teal-600 ring-2 ring-teal-500/20"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <span className="font-sans font-medium text-slate-800">
                        {formatToDmy(startDate)}
                      </span>
                      <CalendarDays className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                    </button>
                  </div>

                  {/* To Date */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-semibold text-slate-500">To Date:</span>
                    <button
                      type="button"
                      onClick={() => handleOpenDateRange("to")}
                      className={cn(
                        "flex items-center justify-between text-left font-sans font-medium cursor-pointer bg-white border rounded-xl px-3 py-1.5 min-w-[135px] text-[12.5px] text-slate-800 shadow-2xs transition",
                        dateRangePopoverOpen && activeDateField === "to"
                          ? "border-teal-600 ring-2 ring-teal-500/20"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <span className="font-sans font-medium text-slate-800">
                        {formatToDmy(endDate)}
                      </span>
                      <CalendarDays className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                    </button>
                  </div>

                  {/* Reset Button */}
                  {(reportSearch || Object.keys(columnFilters).length > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        setReportSearch("");
                        setColumnFilters({});
                        setPage(1);
                        toast.info("Report filters reset");
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </PopoverAnchor>

              <PopoverContent
                className="w-auto p-0 border border-slate-200 bg-white shadow-xl rounded-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
                align="end"
                sideOffset={8}
              >
                {/* Popover Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/60">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-teal-600" />
                    <span className="text-[13px] font-bold text-slate-800">
                      {tempRange?.from && !tempRange?.to ? "Slide or Click to Choose End Date" : "Select Date Range"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tempRange?.from && tempRange?.to && (
                      <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700">
                        {Math.max(1, Math.round((tempRange.to.getTime() - tempRange.from.getTime()) / (1000 * 60 * 60 * 24)))} Days
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setDateRangePopoverOpen(false)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Selection Guidance Pill */}
                <div className="px-4 pt-2.5 pb-1 flex items-center justify-between text-[11.5px] text-slate-500 border-b border-slate-100/60">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-400">Selected:</span>
                    <span className="font-bold text-slate-800 font-sans">
                      {tempRange?.from ? formatToDmy(formatToYmd(tempRange.from)) : "dd-mm-yyyy"}
                    </span>
                    <span className="text-slate-300">→</span>
                    <span className="font-bold text-slate-800 font-sans">
                      {tempRange?.to ? formatToDmy(formatToYmd(tempRange.to)) : "dd-mm-yyyy"}
                    </span>
                  </div>
                  <span className="text-[11px] text-teal-600 font-medium">Click & slide to range</span>
                </div>

                {/* Sliding Calendar */}
                <div className="p-3">
                  <PmsCalendar
                    mode="range"
                    numberOfMonths={2}
                    selected={tempRange}
                    onSelect={handleDateRangeSelect}
                    selectionTarget={activeDateField === "from" ? "arrival" : "departure"}
                    durationUnit="days"
                    toDate={new Date()}
                    disabled={(date: Date) => {
                      const t = new Date();
                      t.setHours(23, 59, 59, 999);
                      return date > t;
                    }}
                    className="rounded-xl"
                  />
                </div>

                {/* Popover Quick Shortcuts Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[11.5px]">
                  <div className="flex items-center gap-1.5">
                    {[
                      { label: "Today", days: 0 },
                      { label: "Last 7 Days", days: 7 },
                      { label: "Last 30 Days", days: 30 },
                      { label: "Last 90 Days", days: 90 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const past = new Date();
                          if (preset.days > 0) {
                            past.setDate(past.getDate() - preset.days);
                          }
                          setStartDate(formatToYmd(past));
                          setEndDate(formatToYmd(now));
                          setTempRange({ from: past, to: now });
                          setDateRangePopoverOpen(false);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (tempRange?.from) {
                        setStartDate(formatToYmd(tempRange.from));
                        setEndDate(formatToYmd(tempRange.to || tempRange.from));
                      }
                      setDateRangePopoverOpen(false);
                    }}
                    className="rounded-lg bg-teal-600 px-3 py-1 font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Print Header Banner (Shown only when printing) */}
        <div className="hidden print:block mb-4 border-b-2 border-slate-900 pb-3 w-full">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-wide uppercase">
                RETROD POS INVENTORY MANAGEMENT
              </h1>
              <h2 className="text-sm font-bold text-slate-800 mt-0.5 uppercase">
                {selectedReport.title}
              </h2>
            </div>
            <div className="text-right text-[11px] text-slate-700 space-y-0.5">
              <div>
                <strong className="text-slate-900">Period:</strong> {formatToDmy(startDate)} to {formatToDmy(endDate)}
              </div>
              <div>
                <strong className="text-slate-900">Printed:</strong> {new Date().toLocaleString()}
              </div>
              <div>
                <strong className="text-slate-900">Total Records:</strong> {filteredDataset.length}
              </div>
            </div>
          </div>
        </div>

        {/* Report Table Card with Header & Footer */}
        <div className="rounded-2xl border border-slate-300 bg-white shadow-2xs overflow-hidden print:border-none print:shadow-none print:rounded-none">
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-center text-[13px] border-collapse border border-slate-300 print:text-[11px]">
              <DataTableHeader
                columns={activeColumns}
                data={filteredDataset}
                sortConfig={sortConfig}
                onSortChange={setSortConfig}
                visibleColumns={visibleColumns}
                onVisibleColumnsChange={setVisibleColumns}
                columnFilters={columnFilters}
                onColumnFilterChange={setColumnFilters}
                themeVariant="primary"
              />

              {/* Paginated Screen Body */}
              <tbody className="divide-y divide-slate-300 border-b border-slate-300 print:hidden">
                {paginatedDataset.length === 0 ? (
                  <tr>
                    <td colSpan={activeColumns.length} className="py-14 text-center border-b border-slate-300">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-slate-400">
                        <FileText className="h-10 w-10 text-slate-300 mb-2 stroke-[1.5]" />
                        <p className="text-[14px] font-semibold text-slate-700">No report records found</p>
                        <p className="text-[12px] text-slate-400 mt-0.5">
                          {reportSearch || Object.keys(columnFilters).length > 0
                            ? "Try refining your search keyword or column filters."
                            : "No movement recorded for this period."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedDataset.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition border-b border-slate-300">
                      {activeColumns.map((col) => {
                        const cellVal = col.getValue
                          ? col.getValue(row)
                          : String((row as any)[col.id || ""] || "");

                        // Check for status badges
                        const isHealth = col.id === "healthStatus" || col.id === "varianceStatus" || col.id === "status" || col.id === "inspectionStatus" || col.id === "paymentStatus" || col.id === "urgency" || col.id === "riskStatus";

                        return (
                          <td
                            key={col.id}
                            className="px-4 py-3 align-middle text-[12.5px] border-r border-b border-slate-300 text-center text-black font-semibold whitespace-nowrap"
                          >
                            {isHealth ? (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border border-black",
                                  String(cellVal).includes("Optimal") || String(cellVal).includes("Done") || String(cellVal).includes("Passed") || String(cellVal).includes("Target") || String(cellVal).includes("On-Time") || String(cellVal).includes("Verified")
                                    ? "bg-emerald-50 text-emerald-800"
                                    : String(cellVal).includes("Warning") || String(cellVal).includes("Reorder") || String(cellVal).includes("Pending") || String(cellVal).includes("Alert") || String(cellVal).includes("Shortage")
                                    ? "bg-amber-50 text-amber-800"
                                    : "bg-rose-50 text-rose-800"
                                )}
                              >
                                {cellVal}
                              </span>
                            ) : (
                              cellVal
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>

              {/* Complete Print Body (All records printed without pagination cutting) */}
              <tbody className="hidden print:table-row-group divide-y divide-black">
                {filteredDataset.map((row) => (
                  <tr key={row.id} className="border-b border-black">
                    {activeColumns.map((col) => (
                      <td
                        key={col.id}
                        className="px-3 py-2 text-[11px] border border-black align-middle text-center text-black font-semibold"
                      >
                        {col.getValue ? col.getValue(row) : String((row as any)[col.id || ""] || "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination Controls */}
          <DataTableFooter
            currentPage={page}
            totalPages={totalPages}
            totalRecords={filteredDataset.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            itemName="records"
          />
        </div>
      </div>
    </div>
  );
}

  // -------------------------------------------------------------------------
  // RENDER: CATALOG & DASHBOARD VIEW (ALIGNED WITH DESIGN STANDARD)
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col flex-1 min-h-0 w-full overflow-y-auto bg-slate-50/50 pb-8">
      {/* 1. Header Toolbar - Flush with TopBar and Full Width */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 py-3 shrink-0">
        <div>
          <div className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase">
            Stock Reports
          </div>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-900 tracking-tight leading-tight">
            Stock Reports & Graphs
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

      {/* Main Content Area */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                    Stock Valuation
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 font-bold">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-2 text-[22px] font-extrabold text-slate-900">
                  {formatINR(dashboardStats.totalStockValuation)}
                </div>
                <div className="text-[11.5px] font-semibold text-emerald-600 mt-1">
                  Active inventory holdings
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                    Active Raw Materials
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 font-bold">
                    <Boxes className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-2 text-[22px] font-extrabold text-slate-900">
                  {dashboardStats.totalItems} SKUs
                </div>
                <div className="text-[11.5px] text-slate-500 font-semibold mt-1">
                  Cataloged ingredients
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                    Reorder Alerts
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 font-bold">
                    <AlertCircle className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-2 text-[22px] font-extrabold text-slate-900">
                  {dashboardStats.lowStockCount} Items
                </div>
                <div className="text-[11.5px] text-amber-600 font-semibold mt-1">
                  Below safety buffer thresholds
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                    Open Purchase Orders
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 font-bold">
                    <Receipt className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-2 text-[22px] font-extrabold text-slate-900">
                  {dashboardStats.openPosCount} Orders
                </div>
                <div className="text-[11.5px] text-purple-600 font-semibold mt-1">
                  {formatINR(dashboardStats.openPosTotal)} in transit
                </div>
              </div>
            </div>

            {/* Quick Analytics Visuals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-slate-900">
                    Top Raw Materials by Valuation
                  </h3>
                  <span className="text-xs font-semibold text-teal-700">Holding Value</span>
                </div>

                <div className="space-y-3 pt-1">
                  {dashboardStats.sortedByValuation.map((item, idx) => (
                    <div key={`${item.name}-${idx}`} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-slate-400 font-bold text-[11px]">{idx + 1}.</span>
                          <span className="font-semibold text-slate-800">{item.name}</span>
                          <span className="text-[10.5px] text-slate-400">({item.category})</span>
                        </div>
                        <span className="font-bold text-slate-900">{formatINR(item.val)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{item.qty} {item.unit} in stock</span>
                        <span>₹{item.rate}/{item.unit}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-600 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (item.val / Math.max(1, dashboardStats.sortedByValuation[0]?.val || 1)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-slate-900">Inventory Health Matrix</h3>
                  <span className="text-xs font-semibold text-slate-500">Stock Status</span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-center">
                    <div className="text-[20px] font-extrabold text-emerald-700">
                      {Math.max(0, dashboardStats.totalItems - dashboardStats.lowStockCount)}
                    </div>
                    <div className="text-[11.5px] font-semibold text-emerald-800 mt-1">
                      Optimal Stock
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-center">
                    <div className="text-[20px] font-extrabold text-amber-600">
                      {dashboardStats.lowStockCount}
                    </div>
                    <div className="text-[11.5px] font-semibold text-amber-800 mt-1">
                      Reorder Needed
                    </div>
                  </div>

                  <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-center">
                    <div className="text-[20px] font-extrabold text-rose-600">
                      0
                    </div>
                    <div className="text-[11.5px] font-semibold text-rose-800 mt-1">
                      Out of Stock
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-2">
                  <div className="text-xs font-bold text-slate-800 mb-2">Automated Store Auditing</div>
                  <p className="text-[11.5px] text-slate-500 leading-relaxed">
                    Inventory levels sync in real-time with KOT order settlements and purchase receipts. Reorder warnings are triggered once quantities cross minimum safety thresholds.
                  </p>
                </div>
              </div>
            </div>
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
                              {report.desc}
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
export default OtherReportsView;
