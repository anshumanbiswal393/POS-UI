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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { exportToExcel } from "@/utils/exportUtils";
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
    data: [
      { id: "1", code: "RAW-101", name: "Basmati Biryani Rice (Grade A)", category: "Grains & Rice", unit: "kg", openingQty: 180, purchaseQty: 300, transfersQty: -40, wastageQty: 5, consumedQty: 295, avgRate: 92.5, totalCost: 27287.5 },
      { id: "2", code: "RAW-102", name: "Refined Sunflower Oil (15L Tin)", category: "Oils & Ghee", unit: "Tins", openingQty: 12, purchaseQty: 20, transfersQty: -4, wastageQty: 0, consumedQty: 18, avgRate: 1850.0, totalCost: 33300.0 },
      { id: "3", code: "RAW-103", name: "Fresh Malai Paneer", category: "Dairy", unit: "kg", openingQty: 35, purchaseQty: 120, transfersQty: 0, wastageQty: 3, consumedQty: 112, avgRate: 340.0, totalCost: 38080.0 },
      { id: "4", code: "RAW-104", name: "Farm Fresh Chicken Breast", category: "Poultry & Meat", unit: "kg", openingQty: 45, purchaseQty: 240, transfersQty: -20, wastageQty: 6, consumedQty: 215, avgRate: 260.0, totalCost: 55900.0 },
      { id: "5", code: "RAW-105", name: "Amul Pasteurised Butter 500g", category: "Dairy", unit: "Blocks", openingQty: 40, purchaseQty: 90, transfersQty: -10, wastageQty: 1, consumedQty: 84, avgRate: 245.0, totalCost: 20580.0 },
      { id: "6", code: "RAW-106", name: "Red Onions Premium", category: "Vegetables", unit: "kg", openingQty: 150, purchaseQty: 400, transfersQty: 0, wastageQty: 18, consumedQty: 385, avgRate: 38.0, totalCost: 14630.0 },
      { id: "7", code: "RAW-107", name: "Ripe Farm Tomatoes", category: "Vegetables", unit: "kg", openingQty: 80, purchaseQty: 250, transfersQty: 0, wastageQty: 12, consumedQty: 238, avgRate: 42.0, totalCost: 9996.0 },
      { id: "8", code: "RAW-108", name: "Whole Garam Masala Blend", category: "Spices", unit: "kg", openingQty: 15, purchaseQty: 25, transfersQty: -2, wastageQty: 0, consumedQty: 22, avgRate: 640.0, totalCost: 14080.0 },
      { id: "9", code: "RAW-109", name: "Refined Wheat Flour (Maida)", category: "Bakery", unit: "kg", openingQty: 90, purchaseQty: 150, transfersQty: 0, wastageQty: 4, consumedQty: 160, avgRate: 44.0, totalCost: 7040.0 },
      { id: "10", code: "RAW-110", name: "Full Cream Buffalo Milk", category: "Dairy", unit: "Litre", openingQty: 60, purchaseQty: 450, transfersQty: -30, wastageQty: 8, consumedQty: 420, avgRate: 68.0, totalCost: 28560.0 },
    ],
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
    data: [
      { id: "1", code: "RAW-101", name: "Basmati Biryani Rice (Grade A)", category: "Grains & Rice", unit: "kg", openingQty: 180, inwardQty: 300, outwardQty: 340, closingQty: 140, unitRate: 92.5, closingValue: 12950.0, healthStatus: "Optimal" },
      { id: "2", code: "RAW-102", name: "Refined Sunflower Oil (15L Tin)", category: "Oils & Ghee", unit: "Tins", openingQty: 12, inwardQty: 20, outwardQty: 22, closingQty: 10, unitRate: 1850.0, closingValue: 18500.0, healthStatus: "Optimal" },
      { id: "3", code: "RAW-103", name: "Fresh Malai Paneer", category: "Dairy", unit: "kg", openingQty: 35, inwardQty: 120, outwardQty: 115, closingQty: 40, unitRate: 340.0, closingValue: 13600.0, healthStatus: "Optimal" },
      { id: "4", code: "RAW-104", name: "Farm Fresh Chicken Breast", category: "Poultry & Meat", unit: "kg", openingQty: 45, inwardQty: 240, outwardQty: 241, closingQty: 44, unitRate: 260.0, closingValue: 11440.0, healthStatus: "Optimal" },
      { id: "5", code: "RAW-105", name: "Amul Pasteurised Butter 500g", category: "Dairy", unit: "Blocks", openingQty: 40, inwardQty: 90, outwardQty: 94, closingQty: 36, unitRate: 245.0, closingValue: 8820.0, healthStatus: "Optimal" },
      { id: "6", code: "RAW-106", name: "Red Onions Premium", category: "Vegetables", unit: "kg", openingQty: 150, inwardQty: 400, outwardQty: 403, closingQty: 147, unitRate: 38.0, closingValue: 5586.0, healthStatus: "Optimal" },
      { id: "7", code: "RAW-107", name: "Ripe Farm Tomatoes", category: "Vegetables", unit: "kg", openingQty: 80, inwardQty: 250, outwardQty: 250, closingQty: 80, unitRate: 42.0, closingValue: 3360.0, healthStatus: "Optimal" },
      { id: "8", code: "RAW-108", name: "Cashew Nuts Whole W320", category: "Dry Fruits", unit: "kg", openingQty: 25, inwardQty: 40, outwardQty: 53, closingQty: 12, unitRate: 820.0, closingValue: 9840.0, healthStatus: "Reorder Needed" },
      { id: "9", code: "RAW-109", name: "Refined Wheat Flour (Maida)", category: "Bakery", unit: "kg", openingQty: 90, inwardQty: 150, outwardQty: 164, closingQty: 76, unitRate: 44.0, closingValue: 3344.0, healthStatus: "Optimal" },
      { id: "10", code: "RAW-110", name: "Arabica Coffee Beans", category: "Beverages", unit: "kg", openingQty: 8, inwardQty: 15, outwardQty: 18, closingQty: 5, unitRate: 1150.0, closingValue: 5750.0, healthStatus: "Reorder Needed" },
    ],
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
    data: [
      { id: "1", menuCode: "MNU-501", dishName: "Murgh Dum Biryani (Handi)", section: "Main Course", salesPrice: 480.0, costPrice: 134.4, grossMargin: 345.6, costPercent: 28.0, targetPercent: 30.0, marginPercent: 72.0, varianceStatus: "Within Target" },
      { id: "2", menuCode: "MNU-502", dishName: "Paneer Butter Masala", section: "Main Course", salesPrice: 360.0, costPrice: 97.2, grossMargin: 262.8, costPercent: 27.0, targetPercent: 28.0, marginPercent: 73.0, varianceStatus: "Within Target" },
      { id: "3", menuCode: "MNU-503", dishName: "Tandoori Pomfret Fish", section: "Starters & Tandoor", salesPrice: 650.0, costPrice: 227.5, grossMargin: 422.5, costPercent: 35.0, targetPercent: 32.0, marginPercent: 65.0, varianceStatus: "Cost Alert (+3%)" },
      { id: "4", menuCode: "MNU-504", dishName: "Dal Makhani Slow Cooked", section: "Main Course", salesPrice: 290.0, costPrice: 63.8, grossMargin: 226.2, costPercent: 22.0, targetPercent: 25.0, marginPercent: 78.0, varianceStatus: "Within Target" },
      { id: "5", menuCode: "MNU-505", dishName: "Butter Garlic Naan", section: "Tandoori Breads", salesPrice: 75.0, costPrice: 14.25, grossMargin: 60.75, costPercent: 19.0, targetPercent: 22.0, marginPercent: 81.0, varianceStatus: "Within Target" },
      { id: "6", menuCode: "MNU-506", dishName: "Mutton Rogan Josh Kashmiri", section: "Main Course", salesPrice: 580.0, costPrice: 208.8, grossMargin: 371.2, costPercent: 36.0, targetPercent: 34.0, marginPercent: 64.0, varianceStatus: "Cost Alert (+2%)" },
      { id: "7", menuCode: "MNU-507", dishName: "Woodfired Margherita Pizza", section: "Pizzas & Pastas", salesPrice: 420.0, costPrice: 96.6, grossMargin: 323.4, costPercent: 23.0, targetPercent: 26.0, marginPercent: 77.0, varianceStatus: "Within Target" },
      { id: "8", menuCode: "MNU-508", dishName: "Classic Cold Brew Latte", section: "Beverages", salesPrice: 220.0, costPrice: 39.6, grossMargin: 180.4, costPercent: 18.0, targetPercent: 20.0, marginPercent: 82.0, varianceStatus: "Within Target" },
    ],
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
    data: [
      { id: "1", formulaCode: "REC-001", recipeName: "Makhani Gravy Master Base", prepCategory: "Base Sauces", batchYield: "15.0 Litres", ingredientCount: 9, batchCost: 2625.0, portionCost: 35.0, suggestedPrice: 350.0, lastUpdated: "12 Oct 2026" },
      { id: "2", formulaCode: "REC-002", recipeName: "Dum Biryani Yakhni & Masala Base", prepCategory: "Biryani Bases", batchYield: "20.0 kg", ingredientCount: 14, batchCost: 4800.0, portionCost: 60.0, suggestedPrice: 480.0, lastUpdated: "14 Oct 2026" },
      { id: "3", formulaCode: "REC-003", recipeName: "White Korma Cashew Paste", prepCategory: "Gravy Pastes", batchYield: "8.0 kg", ingredientCount: 6, batchCost: 2240.0, portionCost: 56.0, suggestedPrice: 390.0, lastUpdated: "10 Oct 2026" },
      { id: "4", formulaCode: "REC-004", recipeName: "Garlic Infused Herb Butter", prepCategory: "Dairy Prep", batchYield: "5.0 kg", ingredientCount: 4, batchCost: 1450.0, portionCost: 14.5, suggestedPrice: 75.0, lastUpdated: "15 Oct 2026" },
      { id: "5", formulaCode: "REC-005", recipeName: "Artisan Pizza Dough Ferment Batch", prepCategory: "Bakery", batchYield: "40 Portions", ingredientCount: 5, batchCost: 480.0, portionCost: 12.0, suggestedPrice: 420.0, lastUpdated: "16 Oct 2026" },
      { id: "6", formulaCode: "REC-006", recipeName: "Tandoori Master Marinade Red", prepCategory: "Marinades", batchYield: "12.0 kg", ingredientCount: 11, batchCost: 1980.0, portionCost: 33.0, suggestedPrice: 460.0, lastUpdated: "13 Oct 2026" },
    ],
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
    data: [
      { id: "1", grnNo: "GRN-2026-104", poRef: "PO-9820", vendorName: "Metro Cash & Carry", invoiceDate: "17-10-2026", itemCount: 6, receivedBy: "Ramesh Sharma", totalAmount: 34500.0, paymentStatus: "Done", inspectionStatus: "100% Passed" },
      { id: "2", grnNo: "GRN-2026-103", poRef: "PO-9817", vendorName: "Royal Dairy Suppliers", invoiceDate: "17-10-2026", itemCount: 3, receivedBy: "Ramesh Sharma", totalAmount: 18200.0, paymentStatus: "Pending", inspectionStatus: "100% Passed" },
      { id: "3", grnNo: "GRN-2026-102", poRef: "PO-9811", vendorName: "Greenfield Fresh Produce", invoiceDate: "16-10-2026", itemCount: 12, receivedBy: "Sunil Verma", totalAmount: 14850.0, paymentStatus: "Done", inspectionStatus: "Passed (1 Reject)" },
      { id: "4", grnNo: "GRN-2026-101", poRef: "PO-9804", vendorName: "Apex Poultry & Meat", invoiceDate: "15-10-2026", itemCount: 4, receivedBy: "Ramesh Sharma", totalAmount: 26800.0, paymentStatus: "Partial", inspectionStatus: "100% Passed" },
      { id: "5", grnNo: "GRN-2026-100", poRef: "PO-9799", vendorName: "Spice Haven Importers", invoiceDate: "14-10-2026", itemCount: 8, receivedBy: "Sunil Verma", totalAmount: 21400.0, paymentStatus: "Done", inspectionStatus: "100% Passed" },
      { id: "6", grnNo: "GRN-2026-099", poRef: "PO-9790", vendorName: "OceanCatch Marine Wholesale", invoiceDate: "13-10-2026", itemCount: 5, receivedBy: "Ramesh Sharma", totalAmount: 38900.0, paymentStatus: "Done", inspectionStatus: "100% Passed" },
    ],
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
    data: [
      { id: "1", voucherNo: "TR-2026-088", date: "17-10-2026", fromSection: "Central Warehouse", toSection: "Main Kitchen", itemName: "Basmati Biryani Rice (50kg)", qty: 2, unit: "Bags", unitRate: 4500.0, totalValue: 9000.0, authorizedBy: "Head Chef Roy" },
      { id: "2", voucherNo: "TR-2026-087", date: "17-10-2026", fromSection: "Central Warehouse", toSection: "Highway Inn Banquet", itemName: "Sunflower Oil (15L)", qty: 3, unit: "Tins", unitRate: 1850.0, totalValue: 5550.0, authorizedBy: "Banquet Manager" },
      { id: "3", voucherNo: "TR-2026-086", date: "16-10-2026", fromSection: "Main Kitchen", toSection: "Rooftop Lounge Bar", itemName: "Fresh Mint & Lemons Pack", qty: 8, unit: "kg", unitRate: 110.0, totalValue: 880.0, authorizedBy: "Bar Captain" },
      { id: "4", voucherNo: "TR-2026-085", date: "15-10-2026", fromSection: "Central Warehouse", toSection: "Bakery & Desserts", itemName: "Amul Butter Blocks 500g", qty: 15, unit: "Blocks", unitRate: 245.0, totalValue: 3675.0, authorizedBy: "Pastry Chef Alok" },
      { id: "5", voucherNo: "TR-2026-084", date: "14-10-2026", fromSection: "Central Warehouse", toSection: "Main Kitchen", itemName: "Whole Spices Assorted", qty: 5, unit: "kg", unitRate: 640.0, totalValue: 3200.0, authorizedBy: "Head Chef Roy" },
    ],
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
    data: [
      { id: "1", supplierName: "Metro Cash & Carry", tradeCategory: "Groceries & Dry Goods", phone: "+91 98200 12345", invoiceCount: 14, grossSpend: 148500.0, returnsValue: 1200.0, netSpend: 147300.0, paidAmount: 135000.0, balanceDue: 12300.0 },
      { id: "2", supplierName: "Royal Dairy Suppliers", tradeCategory: "Dairy Products", phone: "+91 98211 44556", invoiceCount: 22, grossSpend: 92400.0, returnsValue: 680.0, netSpend: 91720.0, paidAmount: 83520.0, balanceDue: 8200.0 },
      { id: "3", supplierName: "Apex Poultry & Meat", tradeCategory: "Poultry & Meats", phone: "+91 98333 77889", invoiceCount: 18, grossSpend: 124800.0, returnsValue: 2400.0, netSpend: 122400.0, paidAmount: 110000.0, balanceDue: 12400.0 },
      { id: "4", supplierName: "Greenfield Fresh Produce", tradeCategory: "Fruits & Vegetables", phone: "+91 98199 66332", invoiceCount: 28, grossSpend: 68200.0, returnsValue: 1850.0, netSpend: 66350.0, paidAmount: 66350.0, balanceDue: 0.0 },
      { id: "5", supplierName: "OceanCatch Marine Wholesale", tradeCategory: "Seafood & Fish", phone: "+91 98205 99112", invoiceCount: 12, grossSpend: 98600.0, returnsValue: 3100.0, netSpend: 95500.0, paidAmount: 85000.0, balanceDue: 10500.0 },
      { id: "6", supplierName: "Spice Haven Importers", tradeCategory: "Spices & Seasonings", phone: "+91 98222 33110", invoiceCount: 8, grossSpend: 46200.0, returnsValue: 0.0, netSpend: 46200.0, paidAmount: 46200.0, balanceDue: 0.0 },
    ],
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
    data: [
      { id: "1", returnNo: "RET-2026-019", date: "16-10-2026", vendorName: "Greenfield Fresh Produce", invoiceRef: "INV-89110", itemReturned: "English Cucumbers Crates", qty: 15, unit: "kg", creditValue: 750.0, reason: "Overripe / soft consignments rejected at gate", settlement: "Credit Adjusted" },
      { id: "2", returnNo: "RET-2026-018", date: "14-10-2026", vendorName: "Apex Poultry & Meat", invoiceRef: "INV-89024", itemReturned: "Chicken Boneless Cubes", qty: 8, unit: "kg", creditValue: 2400.0, reason: "Sub-par trimming; fat ratio exceeding 15%", settlement: "Credit Adjusted" },
      { id: "3", returnNo: "RET-2026-017", date: "11-10-2026", vendorName: "OceanCatch Marine Wholesale", invoiceRef: "INV-88940", itemReturned: "Tiger Prawns 20/30", qty: 5, unit: "kg", creditValue: 3100.0, reason: "Temperature abuse during transit (7°C reading)", settlement: "Refund Issued" },
      { id: "4", returnNo: "RET-2026-016", date: "08-10-2026", vendorName: "Metro Cash & Carry", invoiceRef: "INV-88712", itemReturned: "Soy Sauce Dark 5L", qty: 2, unit: "Jugs", creditValue: 1200.0, reason: "Seal compromised / cap leakage in carton", settlement: "Credit Adjusted" },
    ],
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
    data: [
      { id: "1", auditDate: "17-10-2026", itemName: "Basmati Biryani Rice", category: "Grains", theoQty: 144, physQty: 140, diffQty: -4, unit: "kg", diffPercent: -2.8, lossValue: 370.0, cause: "Minor moisture loss & preparation spillage" },
      { id: "2", auditDate: "17-10-2026", itemName: "Fresh Malai Paneer", category: "Dairy", theoQty: 42, physQty: 40, diffQty: -2, unit: "kg", diffPercent: -4.8, lossValue: 680.0, cause: "Trimming waste during cube portioning" },
      { id: "3", auditDate: "17-10-2026", itemName: "Chicken Breast Boneless", category: "Poultry", theoQty: 47, physQty: 44, diffQty: -3, unit: "kg", diffPercent: -6.4, lossValue: 780.0, cause: "Thawing drip loss & line over-portioning" },
      { id: "4", auditDate: "16-10-2026", itemName: "Amul Butter Blocks", category: "Dairy", theoQty: 38, physQty: 36, diffQty: -2, unit: "Blocks", diffPercent: -5.3, lossValue: 490.0, cause: "Unrecorded finishing butter for gravies" },
      { id: "5", auditDate: "16-10-2026", itemName: "Arabica Coffee Beans", category: "Beverages", theoQty: 5.5, physQty: 5.0, diffQty: -0.5, unit: "kg", diffPercent: -9.1, lossValue: 575.0, cause: "Grinder purge waste during dial-in calibration" },
    ],
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
    data: [
      { id: "1", date: "17-10-2026", section: "Main Kitchen Store", staffName: "Chef Alok Sharma", role: "Sous Chef", timestamp: "23:45", itemsCounted: 64, varianceCount: 3, lockState: "Locked", approval: "Approved" },
      { id: "2", date: "17-10-2026", section: "Highway Inn Bar", staffName: "Gaurav Sen", role: "Head Bartender", timestamp: "00:15", itemsCounted: 42, varianceCount: 1, lockState: "Locked", approval: "Approved" },
      { id: "3", date: "17-10-2026", section: "Central Dry Storeroom", staffName: "Ramesh Storekeeper", role: "Store Incharge", timestamp: "19:30", itemsCounted: 110, varianceCount: 2, lockState: "Locked", approval: "Approved" },
      { id: "4", date: "17-10-2026", section: "Bakery / Dessert Station", staffName: "Priya Nair", role: "Pastry Lead", timestamp: "23:10", itemsCounted: 28, varianceCount: 0, lockState: "Locked", approval: "Approved" },
      { id: "5", date: "16-10-2026", section: "Main Kitchen Store", staffName: "Chef Alok Sharma", role: "Sous Chef", timestamp: "23:50", itemsCounted: 64, varianceCount: 4, lockState: "Locked", approval: "Approved" },
    ],
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
    data: [
      { id: "1", wasteId: "WST-2026-081", date: "17-10-2026 (Dinner)", itemName: "Cooked Biryani Rice Batch", category: "Cooked Food", qty: 4, unit: "kg", unitRate: 92.5, lossValue: 370.0, reason: "Burned during slow dum bottom layer", reportedBy: "Chef Devendra" },
      { id: "2", wasteId: "WST-2026-080", date: "17-10-2026 (Lunch)", itemName: "Fresh Malai Paneer", category: "Dairy", qty: 2.5, unit: "kg", unitRate: 340.0, lossValue: 850.0, reason: "Sour smell / cold chain drop overnight", reportedBy: "Chef Roy" },
      { id: "3", wasteId: "WST-2026-079", date: "16-10-2026 (Dinner)", itemName: "Tandoori Chicken Skewers", category: "Poultry", qty: 3, unit: "Portions", unitRate: 140.0, lossValue: 420.0, reason: "Customer table cancellation after plating", reportedBy: "Captain Rajiv" },
      { id: "4", wasteId: "WST-2026-078", date: "15-10-2026 (Lunch)", itemName: "Ripe Farm Tomatoes", category: "Vegetables", qty: 8, unit: "kg", unitRate: 42.0, lossValue: 336.0, reason: "Crushed in storage bottom crate", reportedBy: "Store Sunil" },
    ],
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
    data: [
      { id: "1", code: "RAW-101", itemName: "Basmati Biryani Rice Grade A", location: "Central Store", theoretical: 144, physical: 140, variance: -4, unit: "kg", varValue: 370.0, accuracy: 97.2 },
      { id: "2", code: "RAW-102", itemName: "Refined Sunflower Oil 15L", location: "Central Store", theoretical: 10, physical: 10, variance: 0, unit: "Tins", varValue: 0.0, accuracy: 100.0 },
      { id: "3", code: "RAW-103", itemName: "Fresh Malai Paneer", location: "Kitchen Chiller", theoretical: 42, physical: 40, variance: -2, unit: "kg", varValue: 680.0, accuracy: 95.2 },
      { id: "4", code: "RAW-104", itemName: "Chicken Breast Boneless", location: "Deep Freezer", theoretical: 47, physical: 44, variance: -3, unit: "kg", varValue: 780.0, accuracy: 93.6 },
      { id: "5", code: "RAW-105", itemName: "Amul Butter 500g", location: "Dairy Chiller", theoretical: 38, physical: 36, variance: -2, unit: "Blocks", varValue: 490.0, accuracy: 94.7 },
    ],
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
    data: [
      { id: "1", poNumber: "PO-2026-9824", poDate: "16-10-2026", vendorName: "Metro Cash & Carry", expectedDelivery: "18-10-2026", itemCount: 8, totalAmount: 42500.0, pendingDays: 1, priority: "Normal", status: "Acknowledged" },
      { id: "2", poNumber: "PO-2026-9821", poDate: "15-10-2026", vendorName: "Royal Dairy Suppliers", expectedDelivery: "17-10-2026", itemCount: 4, totalAmount: 16800.0, pendingDays: 2, priority: "High", status: "Partially Delivered" },
      { id: "3", poNumber: "PO-2026-9818", poDate: "14-10-2026", vendorName: "OceanCatch Marine Wholesale", expectedDelivery: "16-10-2026", itemCount: 5, totalAmount: 32000.0, pendingDays: 3, priority: "High", status: "Awaiting Dispatch" },
      { id: "4", poNumber: "PO-2026-9815", poDate: "12-10-2026", vendorName: "Spice Haven Importers", expectedDelivery: "15-10-2026", itemCount: 6, totalAmount: 18400.0, pendingDays: 5, priority: "Normal", status: "Overdue" },
    ],
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
    data: [
      { id: "1", poNumber: "PO-2026-9804", vendorName: "Apex Poultry & Meat", orderedDate: "14-10-2026", promisedDate: "15-10-2026", actualDate: "15-10-2026", leadDays: 1, delayDays: 0, fillPercent: 100, grade: "On-Time" },
      { id: "2", poNumber: "PO-2026-9799", vendorName: "Spice Haven Importers", orderedDate: "12-10-2026", promisedDate: "14-10-2026", actualDate: "14-10-2026", leadDays: 2, delayDays: 0, fillPercent: 100, grade: "On-Time" },
      { id: "3", poNumber: "PO-2026-9790", vendorName: "OceanCatch Marine Wholesale", orderedDate: "10-10-2026", promisedDate: "12-10-2026", actualDate: "13-10-2026", leadDays: 3, delayDays: 1, fillPercent: 92, grade: "Minor Delay" },
      { id: "4", poNumber: "PO-2026-9781", vendorName: "Metro Cash & Carry", orderedDate: "08-10-2026", promisedDate: "10-10-2026", actualDate: "10-10-2026", leadDays: 2, delayDays: 0, fillPercent: 98, grade: "On-Time" },
    ],
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
    data: [
      { id: "1", vendorName: "Metro Cash & Carry", ordersCount: 24, avgLeadDays: 1.8, onTimeRate: 95.8, fillRate: 98.2, qualityPass: 99.4, rating: "⭐ 4.9 (Tier 1)" },
      { id: "2", vendorName: "Royal Dairy Suppliers", ordersCount: 30, avgLeadDays: 1.0, onTimeRate: 96.6, fillRate: 97.5, qualityPass: 99.0, rating: "⭐ 4.8 (Tier 1)" },
      { id: "3", vendorName: "Apex Poultry & Meat", ordersCount: 20, avgLeadDays: 1.2, onTimeRate: 92.0, fillRate: 94.8, qualityPass: 96.5, rating: "⭐ 4.6 (Tier 2)" },
      { id: "4", vendorName: "OceanCatch Marine Wholesale", ordersCount: 15, avgLeadDays: 2.4, onTimeRate: 86.6, fillRate: 90.0, qualityPass: 94.0, rating: "⭐ 4.3 (Tier 2)" },
      { id: "5", vendorName: "Greenfield Fresh Produce", ordersCount: 32, avgLeadDays: 1.0, onTimeRate: 93.8, fillRate: 96.0, qualityPass: 97.2, rating: "⭐ 4.7 (Tier 1)" },
    ],
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
    data: [
      { id: "1", dishName: "Murgh Dum Biryani (Handi)", category: "Main Course", salesPrice: 480.0, ingredientCost: 134.4, grossMargin: 345.6, costPercent: 28.0, unitsSold: 420, totalProfit: 145152.0, matrixClass: "Star Item ⭐" },
      { id: "2", dishName: "Paneer Butter Masala", category: "Main Course", salesPrice: 360.0, ingredientCost: 97.2, grossMargin: 262.8, costPercent: 27.0, unitsSold: 310, totalProfit: 81468.0, matrixClass: "Star Item ⭐" },
      { id: "3", dishName: "Tandoori Pomfret Fish", category: "Starters", salesPrice: 650.0, ingredientCost: 227.5, grossMargin: 422.5, costPercent: 35.0, unitsSold: 110, totalProfit: 46475.0, matrixClass: "Puzzle Item" },
      { id: "4", dishName: "Butter Garlic Naan", category: "Breads", salesPrice: 75.0, ingredientCost: 14.25, grossMargin: 60.75, costPercent: 19.0, unitsSold: 980, totalProfit: 59535.0, matrixClass: "Workhorse" },
      { id: "5", dishName: "Dal Makhani Slow Cooked", category: "Main Course", salesPrice: 290.0, ingredientCost: 63.8, grossMargin: 226.2, costPercent: 22.0, unitsSold: 340, totalProfit: 76908.0, matrixClass: "Workhorse" },
    ],
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
    data: [
      { id: "1", materialName: "Red Onions Premium", unit: "kg", baseRate: 28.0, currentRate: 38.0, delta: 10.0, inflationPercent: 35.7, trend: "Surging 📈", impact: "All Gravies & Biryanis" },
      { id: "2", materialName: "Farm Fresh Tomatoes", unit: "kg", baseRate: 36.0, currentRate: 42.0, delta: 6.0, inflationPercent: 16.7, trend: "Moderate 📈", impact: "Makhani & Pasta Sauces" },
      { id: "3", materialName: "Fresh Malai Paneer", unit: "kg", baseRate: 320.0, currentRate: 340.0, delta: 20.0, inflationPercent: 6.2, trend: "Stable ⚖️", impact: "Paneer Dishes" },
      { id: "4", materialName: "Chicken Breast Boneless", unit: "kg", baseRate: 270.0, currentRate: 260.0, delta: -10.0, inflationPercent: -3.7, trend: "Easing 📉", impact: "Poultry Starters & Curries" },
      { id: "5", materialName: "Refined Sunflower Oil 15L", unit: "Tins", baseRate: 1750.0, currentRate: 1850.0, delta: 100.0, inflationPercent: 5.7, trend: "Moderate 📈", impact: "Deep Fry & Sautéing" },
    ],
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
    data: [
      { id: "1", dishName: "Murgh Dum Biryani (Handi)", section: "Main Course", unitsSold: 420, grossSales: 201600.0, foodCostTotal: 56448.0, contributionMargin: 145152.0, sharePercent: 24.5 },
      { id: "2", dishName: "Paneer Butter Masala", section: "Main Course", unitsSold: 310, grossSales: 111600.0, foodCostTotal: 30132.0, contributionMargin: 81468.0, sharePercent: 13.8 },
      { id: "3", dishName: "Dal Makhani Slow Cooked", section: "Main Course", unitsSold: 340, grossSales: 98600.0, foodCostTotal: 21692.0, contributionMargin: 76908.0, sharePercent: 13.0 },
      { id: "4", dishName: "Butter Garlic Naan", section: "Breads", unitsSold: 980, grossSales: 73500.0, foodCostTotal: 13965.0, contributionMargin: 59535.0, sharePercent: 10.1 },
      { id: "5", dishName: "Tandoori Pomfret Fish", section: "Starters", unitsSold: 110, grossSales: 71500.0, foodCostTotal: 25025.0, contributionMargin: 46475.0, sharePercent: 7.9 },
    ],
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
    data: [
      { id: "1", batchNo: "LOT-2026-D44", itemName: "Fresh Malai Paneer", location: "Dairy Chiller #1", rcvDate: "15-10-2026", expDate: "19-10-2026", daysLeft: 2, stockQty: 18, unit: "kg", stockValue: 6120.0, riskStatus: "Critical (< 3 Days)" },
      { id: "2", batchNo: "LOT-2026-M89", itemName: "Buffalo Full Cream Milk", location: "Chiller Walk-in", rcvDate: "16-10-2026", expDate: "18-10-2026", daysLeft: 1, stockQty: 40, unit: "Litre", stockValue: 2720.0, riskStatus: "Expiring Tomorrow" },
      { id: "3", batchNo: "LOT-2026-B12", itemName: "Amul Pasteurised Butter", location: "Dairy Chiller #2", rcvDate: "05-10-2026", expDate: "28-10-2026", daysLeft: 11, stockQty: 24, unit: "Blocks", stockValue: 5880.0, riskStatus: "Normal Range" },
      { id: "4", batchNo: "LOT-2026-P09", itemName: "Farm Fresh Chicken Breast", location: "Freezer Deep -18°C", rcvDate: "14-10-2026", expDate: "21-10-2026", daysLeft: 4, stockQty: 25, unit: "kg", stockValue: 6500.0, riskStatus: "Warning (< 5 Days)" },
    ],
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
    data: [
      { id: "1", code: "RAW-108", itemName: "Cashew Nuts Whole W320", category: "Dry Fruits", currentStock: 4, reorderLevel: 15, deficit: 11, unit: "kg", preferredVendor: "Spice Haven Importers", suggestedPOQty: 25, urgency: "Critical Shortage" },
      { id: "2", code: "RAW-110", itemName: "Arabica Coffee Beans", category: "Beverages", currentStock: 3, reorderLevel: 10, deficit: 7, unit: "kg", preferredVendor: "Metro Cash & Carry", suggestedPOQty: 15, urgency: "Critical Shortage" },
      { id: "3", code: "RAW-118", itemName: "Saffron Spanish Kesar", category: "Spices", currentStock: 10, reorderLevel: 25, deficit: 15, unit: "grams", preferredVendor: "Spice Haven Importers", suggestedPOQty: 50, urgency: "Below Minimum" },
      { id: "4", code: "RAW-122", itemName: "Extra Virgin Olive Oil 5L", category: "Oils & Ghee", currentStock: 2, reorderLevel: 6, deficit: 4, unit: "Cans", preferredVendor: "Metro Cash & Carry", suggestedPOQty: 8, urgency: "Below Minimum" },
    ],
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
    data: [
      { id: "1", lotNo: "LOT-2026-D44", itemName: "Fresh Malai Paneer", vendorName: "Royal Dairy Suppliers", grnRef: "GRN-2026-103", mfgDate: "15-10-2026", expDate: "19-10-2026", initialQty: 60, remainingQty: 18, unit: "kg", compliance: "Verified ✅" },
      { id: "2", lotNo: "LOT-2026-R90", itemName: "Basmati Biryani Rice Grade A", vendorName: "Metro Cash & Carry", grnRef: "GRN-2026-104", mfgDate: "01-09-2026", expDate: "01-09-2027", initialQty: 300, remainingQty: 140, unit: "kg", compliance: "Verified ✅" },
      { id: "3", lotNo: "LOT-2026-O33", itemName: "Sunflower Oil 15L Tin", vendorName: "Metro Cash & Carry", grnRef: "GRN-2026-104", mfgDate: "10-09-2026", expDate: "10-09-2027", initialQty: 20, remainingQty: 10, unit: "Tins", compliance: "Verified ✅" },
      { id: "4", lotNo: "LOT-2026-M89", itemName: "Full Cream Buffalo Milk", vendorName: "Royal Dairy Suppliers", grnRef: "GRN-2026-103", mfgDate: "16-10-2026", expDate: "18-10-2026", initialQty: 120, remainingQty: 40, unit: "Litre", compliance: "Verified ✅" },
    ],
  },
};

// ---------------------------------------------------------------------------
// Main OtherReportsView Component
// ---------------------------------------------------------------------------
export function OtherReportsView() {
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
    return REPORT_DATASETS[selectedReport.id] || REPORT_DATASETS["REP-CONS-01"];
  }, [selectedReport]);

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
    const rows = cfg.data.map((row) =>
      cfg.columns.map((col) => {
        if (col.getValue) return col.getValue(row);
        return (row as any)[col.id || ""] || "";
      })
    );

    exportToExcel({
      filename: `${report.title.replace(/\s+/g, "_")}_${startDate}_to_${endDate}`,
      title: report.title,
      subtitle: `Period: ${formatToDmy(startDate)} to ${formatToDmy(endDate)} | Total Records: ${cfg.data.length}`,
      columns: headers,
      rows,
    });
    toast.success(`Exported ${report.title} to Excel (.xlsx)`);
  };

  // Print Report Handler
  const handlePrint = () => {
    window.print();
    toast.success("Printing report...");
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
              <p className="text-[12px] text-slate-500 mt-0.5">{selectedReport.desc}</p>
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
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden print:border-none print:shadow-none print:rounded-none">
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left text-[13px] border-collapse print:text-[11px]">
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
              <tbody className="divide-y divide-slate-100 print:hidden">
                {paginatedDataset.length === 0 ? (
                  <tr>
                    <td colSpan={activeColumns.length} className="py-14 text-center">
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
                    <tr key={row.id} className="hover:bg-slate-50/70 transition">
                      {activeColumns.map((col) => {
                        const cellVal = col.getValue
                          ? col.getValue(row)
                          : String((row as any)[col.id || ""] || "");

                        const isRight = col.align === "right";
                        const isCenter = col.align === "center";

                        // Check for status badges
                        const isHealth = col.id === "healthStatus" || col.id === "varianceStatus" || col.id === "status" || col.id === "inspectionStatus" || col.id === "paymentStatus" || col.id === "urgency" || col.id === "riskStatus";

                        return (
                          <td
                            key={col.id}
                            className={cn(
                              "px-4 py-3.5 align-middle text-[12.5px] whitespace-nowrap",
                              isRight && "text-right font-mono font-medium text-slate-900",
                              isCenter && "text-center",
                              !isRight && !isCenter && "text-slate-800"
                            )}
                          >
                            {isHealth ? (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border",
                                  String(cellVal).includes("Optimal") || String(cellVal).includes("Done") || String(cellVal).includes("Passed") || String(cellVal).includes("Target") || String(cellVal).includes("On-Time") || String(cellVal).includes("Verified")
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : String(cellVal).includes("Warning") || String(cellVal).includes("Reorder") || String(cellVal).includes("Pending") || String(cellVal).includes("Alert") || String(cellVal).includes("Shortage")
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
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
              <tbody className="hidden print:table-row-group divide-y divide-slate-300">
                {filteredDataset.map((row) => (
                  <tr key={row.id} className="border-b border-slate-300">
                    {activeColumns.map((col) => (
                      <td
                        key={col.id}
                        className={cn(
                          "px-3 py-2 text-[11px] border border-slate-300 align-middle",
                          col.align === "right" && "text-right font-mono",
                          col.align === "center" && "text-center",
                          col.align !== "right" && col.align !== "center" && "text-left"
                        )}
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
        <p className="text-[12.5px] text-slate-500 mt-0.5">
          {activeTab === "bookmarked"
            ? "This section shows all the reports you've bookmarked for easy and frequent access."
            : `Detailed analytical reports and ledgers for ${tabs.find((t) => t.id === activeTab)?.label}.`}
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-1">
        {activeReportsList.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-2xs">
            <Star className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <div className="text-[14px] font-bold text-slate-700">No Bookmarked Reports</div>
            <p className="text-[12px] text-slate-400 mt-1 max-w-sm mx-auto">
              Click the star icon on any report across the other tabs to pin your frequent reports here.
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
                      <Star
                        className={cn(
                          "h-4 w-4 transition-colors",
                          isBookmarked
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300 hover:text-amber-400"
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
