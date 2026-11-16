import React, { useState, useMemo, useEffect } from "react";
import {
  Bookmark,
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
  iconBg: string;
  icon: React.ElementType;
}

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
    iconBg: "bg-teal-50 text-teal-600",
    icon: RefreshCw,
  },
  // 2. Opening - Closing Report
  {
    id: "REP-OPCL-02",
    tabCategory: "closing_tracking",
    categoryLabel: "Closing Stock",
    title: "Opening - Closing Report",
    desc: "Displays opening and closing balances, avg purchase price, and total stock value for each raw material over the selected period.",
    iconBg: "bg-emerald-50 text-emerald-600",
    icon: BarChart2,
  },
  // 3. Food Costing Report
  {
    id: "REP-FOODCOST-03",
    tabCategory: "cost_profitability",
    categoryLabel: "Profitability",
    title: "Food Costing Report",
    desc: "Cost analysis of each menu item, including raw material cost, sales price, and calculated profit margin percentage.",
    iconBg: "bg-amber-50 text-amber-600",
    icon: TrendingUp,
  },
  // 4. Recipe Costing
  {
    id: "REP-RECIPE-04",
    tabCategory: "cost_profitability",
    categoryLabel: "Recipe Master",
    title: "Recipe Costing",
    desc: "Shows the estimated cost and profit of a menu item before billing, based on recipe ingredients and selected material prices.",
    iconBg: "bg-purple-50 text-purple-600",
    icon: FileText,
  },
  // 5. GRN Summary
  {
    id: "REP-GRN-05",
    tabCategory: "movements",
    categoryLabel: "Purchase Movements",
    title: "Goods Received Note (GRN) Summary",
    desc: "Complete chronological audit trail of all vendor invoices received and accepted at store.",
    iconBg: "bg-teal-50 text-teal-600",
    icon: FileText,
  },
  // 6. Section Transfer Ledger
  {
    id: "REP-XFER-06",
    tabCategory: "movements",
    categoryLabel: "Stock Transfers",
    title: "Inter-Outlet / Section Transfer Ledger",
    desc: "Detailed movement vouchers between kitchen, bar, central warehouse, and banquet pantry.",
    iconBg: "bg-emerald-50 text-emerald-600",
    icon: RefreshCw,
  },
  // 7. Supplier Purchase Summary
  {
    id: "REP-SUPP-07",
    tabCategory: "movements",
    categoryLabel: "Procurement Summary",
    title: "Supplier Purchase Summary",
    desc: "Consolidated procurement summary by supplier showing volume, spend, returns, and payment balances.",
    iconBg: "bg-blue-50 text-blue-600",
    icon: Package,
  },
  // 8. Vendor Return Ledger
  {
    id: "REP-VRET-08",
    tabCategory: "movements",
    categoryLabel: "Vendor Adjustments",
    title: "Vendor Return Ledger",
    desc: "Debit notes and goods return vouchers issued to suppliers for damaged, sub-standard, or rejected materials.",
    iconBg: "bg-rose-50 text-rose-600",
    icon: Truck,
  },
  // 9. Daily Closing Variance Log
  {
    id: "REP-VAR-09",
    tabCategory: "closing_tracking",
    categoryLabel: "Stock Variance",
    title: "Daily Closing Variance Log",
    desc: "Calculates difference between physical counting entries and theoretical closing stock.",
    iconBg: "bg-amber-50 text-amber-600",
    icon: BarChart2,
  },
  // 10. Closing Stock Submission Audit
  {
    id: "REP-CSUB-10",
    tabCategory: "closing_tracking",
    categoryLabel: "Audit & Compliance",
    title: "Closing Stock Submission Audit",
    desc: "Staff compliance log showing exact timestamp and user ID when daily closing stock was locked.",
    iconBg: "bg-teal-50 text-teal-600",
    icon: FileText,
  },
  // 11. Wastage Loss Register
  {
    id: "REP-WASTE-11",
    tabCategory: "closing_tracking",
    categoryLabel: "Wastage Control",
    title: "Wastage & Damage Loss Register",
    desc: "Tracks ingredients spoiled, burnt, expired, or dropped during kitchen preparation shifts.",
    iconBg: "bg-rose-50 text-rose-600",
    icon: AlertTriangle,
  },
  // 12. Physical vs Theoretical Stock
  {
    id: "REP-PHTH-12",
    tabCategory: "closing_tracking",
    categoryLabel: "Stock Reconciliations",
    title: "Physical vs Theoretical Stock",
    desc: "Direct comparison between POS recorded usage and actual physical storeroom balances.",
    iconBg: "bg-indigo-50 text-indigo-600",
    icon: Layers,
  },
  // 13. Pending Purchase Orders Tracking
  {
    id: "REP-PO-13",
    tabCategory: "po_monitoring",
    categoryLabel: "PO Tracking",
    title: "Pending Purchase Orders Tracking",
    desc: "List of open POs issued to vendors awaiting delivery fulfillment or acknowledgment.",
    iconBg: "bg-purple-50 text-purple-600",
    icon: FileText,
  },
  // 14. PO Fulfillment & Delay Analysis
  {
    id: "REP-PODELAY-14",
    tabCategory: "po_monitoring",
    categoryLabel: "Delivery Performance",
    title: "PO Fulfillment & Delay Analysis",
    desc: "Vendor delivery punctuality tracking comparing promised vs actual delivery dates.",
    iconBg: "bg-amber-50 text-amber-600",
    icon: Clock,
  },
  // 15. Vendor Lead Time & Fill Rate
  {
    id: "REP-VFILL-15",
    tabCategory: "po_monitoring",
    categoryLabel: "Vendor Scorecard",
    title: "Vendor Lead Time & Fill Rate",
    desc: "Vendor scorecard evaluating average turnaround time, complete order fulfillment rate, and quality compliance.",
    iconBg: "bg-emerald-50 text-emerald-600",
    icon: Award,
  },
  // 16. Gross Margin & Food Cost Matrix
  {
    id: "REP-MARGIN-16",
    tabCategory: "cost_profitability",
    categoryLabel: "Margin Optimization",
    title: "Gross Margin & Food Cost % Matrix",
    desc: "Identifies top high-margin dishes and dishes where ingredient inflation reduced profitability.",
    iconBg: "bg-emerald-50 text-emerald-600",
    icon: TrendingUp,
  },
  // 17. Ingredient Price Fluctuation Trend
  {
    id: "REP-INFL-17",
    tabCategory: "cost_profitability",
    categoryLabel: "Inflation Trends",
    title: "Ingredient Price Fluctuation Trend",
    desc: "Monitors vendor price shifts across essential commodities compared to baseline contract rates.",
    iconBg: "bg-sky-50 text-sky-600",
    icon: DollarSign,
  },
  // 18. Menu Item Contribution Margin
  {
    id: "REP-CONTR-18",
    tabCategory: "cost_profitability",
    categoryLabel: "Menu Engineering",
    title: "Menu Item Contribution Margin",
    desc: "Evaluates which items generate the bulk of the kitchen's net profit contribution.",
    iconBg: "bg-purple-50 text-purple-600",
    icon: Percent,
  },
  // 19. Stock Expiry & Aging Analysis
  {
    id: "REP-EXP-19",
    tabCategory: "all_other",
    categoryLabel: "Perishables Management",
    title: "Stock Expiry & Aging Analysis",
    desc: "Early warning system tracking perishable items nearing expiration dates in dry store, chiller, and freezer.",
    iconBg: "bg-rose-50 text-rose-600",
    icon: ShieldAlert,
  },
  // 20. Reorder Level Breach Alert Log
  {
    id: "REP-REORDER-20",
    tabCategory: "all_other",
    categoryLabel: "Replenishment Alerts",
    title: "Reorder Level Breach Alert Log",
    desc: "Automated replenishment alerts triggered when stock levels dip below designated buffer thresholds.",
    iconBg: "bg-amber-50 text-amber-600",
    icon: AlertCircle,
  },
  // 21. Batch & Lot Tracking Register
  {
    id: "REP-BATCH-21",
    tabCategory: "all_other",
    categoryLabel: "Traceability & Safety",
    title: "Batch & Lot Tracking Register",
    desc: "End-to-end traceability register linking raw material batches from supplier invoice to kitchen consumption.",
    iconBg: "bg-teal-50 text-teal-600",
    icon: Layers,
  },
];

// Initial default bookmarked report IDs
const DEFAULT_BOOKMARKS = new Set([
  "REP-CONS-01",
  "REP-OPCL-02",
  "REP-FOODCOST-03",
  "REP-RECIPE-04",
]);

// ---------------------------------------------------------------------------
// REPORT DATASETS & TAILORED TABLE SCHEMAS
// ---------------------------------------------------------------------------
export const REPORT_DATASETS: Record<
  string,
  { columns: DataTableColumn<any>[]; data: any[] }
> = {
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
  const [activeTab, setActiveTab] = useState<
    | "bookmarked"
    | "movements"
    | "closing_tracking"
    | "po_monitoring"
    | "cost_profitability"
    | "all_other"
  >("bookmarked");

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(
    () => new Set(DEFAULT_BOOKMARKS)
  );

  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);

  // Tab navigation definitions
  const tabs = [
    { id: "bookmarked", label: "Bookmarked Reports" },
    { id: "movements", label: "Purchase And Transfer Movements" },
    { id: "closing_tracking", label: "Closing Stock Tracking" },
    { id: "po_monitoring", label: "Purchase Order Monitoring" },
    { id: "cost_profitability", label: "Cost & Profitability" },
    { id: "all_other", label: "Other Reports" },
  ] as const;

  // Toggle bookmark star
  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.info("Removed from Bookmarked Reports");
      } else {
        next.add(id);
        toast.success("Added to Bookmarked Reports");
      }
      return next;
    });
  };

  // Get report cards for the active catalog tab
  const activeReportsList = useMemo(() => {
    if (activeTab === "bookmarked") {
      return ALL_INVENTORY_REPORTS.filter((r) => bookmarkedIds.has(r.id));
    }
    return ALL_INVENTORY_REPORTS.filter((r) => r.tabCategory === activeTab);
  }, [activeTab, bookmarkedIds]);

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

  const getReportRows = (reportId: string) => {
    switch (reportId) {
      case "REP-CONS-01":
      case "REP-OPCL-02":
      case "REP-VAL-04":
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
      subtitle: `Category: ${selectedReport.category.toUpperCase()} • Total Records: ${filteredDataset.length}`,
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
      <div className="space-y-4 print:p-0">
        {/* Top Header / Breadcrumbs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 print:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedReport(null)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-teal-600 transition cursor-pointer"
              title="Back to All Reports"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[19px] font-bold text-slate-900 tracking-tight">
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
    );
  }

  // -------------------------------------------------------------------------
  // RENDER: CATALOG CARDS VIEW (Matching user screenshot)
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Top Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-4 py-2.5 text-[13px] font-semibold transition cursor-pointer ${
              activeTab === tab.id
                ? "border-b-2 border-teal-600 text-teal-600 font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Subheader Title & Description */}
      <div className="pt-2">
        <h3 className="text-[14px] font-bold text-slate-900">
          {tabs.find((t) => t.id === activeTab)?.label}
        </h3>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-1">
        {activeReportsList.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-2xs">
            <Bookmark className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <div className="text-[14px] font-bold text-slate-700">No Bookmarked Reports</div>
            <p className="text-[12px] text-slate-400 mt-1 max-w-sm mx-auto">
              Click the bookmark icon on any report across the other tabs to pin your frequent reports here.
            </p>
          </div>
        ) : (
          activeReportsList.map((r) => {
            const Icon = r.icon;
            const isBookmarked = bookmarkedIds.has(r.id);

            return (
              <div
                key={r.id}
                onClick={() => handleOpenReport(r)}
                className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-teal-400 hover:shadow-xs transition cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${r.iconBg} transition-transform group-hover:scale-105`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => toggleBookmark(r.id, e)}
                      className="p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                      title={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
                    >
                      <Bookmark
                        className={cn(
                          "h-4 w-4 transition-colors",
                          isBookmarked
                            ? "fill-teal-600 text-teal-600"
                            : "text-slate-300 hover:text-teal-600"
                        )}
                      />
                    </button>
                  </div>

                  <div>
                    <h4 className="text-[14px] font-bold text-slate-900 leading-snug group-hover:text-teal-700 transition">
                      {r.title}
                    </h4>
                    <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                      {r.desc}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenReport(r);
                    }}
                    className="text-[12px] font-semibold text-teal-600 hover:text-teal-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    View Report <ArrowRight className="h-3 w-3" />
                  </button>

                  <ExportToExcelButton
                    onClick={(e) => {
                      e?.stopPropagation();
                      handleExportCardToExcel(r, e);
                    }}
                    className="h-7 px-2.5 text-[10.5px]"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
export default OtherReportsView;
