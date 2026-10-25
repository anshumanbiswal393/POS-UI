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
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
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

const DATASETS: Record<string, { columns: DataTableColumn<any>[]; data: any[] }> = {
  "REP-01": {
    // All Restaurant Sales Report
    columns: [
      { id: "date", label: "Date", sortable: true, getValue: (r) => r.date },
      { id: "outlet", label: "Outlet Name", sortable: true, filterable: true, getValue: (r) => r.outlet },
      { id: "totalBills", label: "Total Bills", align: "right", sortable: true, getValue: (r) => String(r.totalBills) },
      { id: "dineInSales", label: "Dine-In (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.dineInSales.toLocaleString()}` },
      { id: "takeawaySales", label: "Takeaway (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.takeawaySales.toLocaleString()}` },
      { id: "deliverySales", label: "Delivery (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.deliverySales.toLocaleString()}` },
      { id: "grossSales", label: "Gross Sales (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.grossSales.toLocaleString()}` },
      { id: "discounts", label: "Discounts (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.discounts.toLocaleString()}` },
      { id: "taxes", label: "Taxes (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.taxes.toLocaleString()}` },
      { id: "netSales", label: "Net Sales (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.netSales.toLocaleString()}` },
    ],
    data: [
      { id: "1", date: "2026-09-02", outlet: "HIGHWAY INN BAR & RESTAURANT", totalBills: 84, dineInSales: 48200, takeawaySales: 12400, deliverySales: 18900, grossSales: 79500, discounts: 3200, taxes: 3815, netSales: 80115 },
      { id: "2", date: "2026-09-02", outlet: "HIGHWAY INN BANQUET", totalBills: 6, dineInSales: 115000, takeawaySales: 0, deliverySales: 0, grossSales: 115000, discounts: 5000, taxes: 5500, netSales: 115500 },
      { id: "3", date: "2026-09-01", outlet: "HIGHWAY INN BAR & RESTAURANT", totalBills: 92, dineInSales: 54100, takeawaySales: 14200, deliverySales: 21500, grossSales: 89800, discounts: 4100, taxes: 4285, netSales: 89985 },
      { id: "4", date: "2026-09-01", outlet: "HIGHWAY INN BANQUET", totalBills: 4, dineInSales: 85000, takeawaySales: 0, deliverySales: 0, grossSales: 85000, discounts: 3000, taxes: 4100, netSales: 86100 },
      { id: "5", date: "2026-08-31", outlet: "HIGHWAY INN BAR & RESTAURANT", totalBills: 78, dineInSales: 42000, takeawaySales: 10800, deliverySales: 16400, grossSales: 69200, discounts: 2800, taxes: 3320, netSales: 69720 },
      { id: "6", date: "2026-08-30", outlet: "HIGHWAY INN BAR & RESTAURANT", totalBills: 110, dineInSales: 68500, takeawaySales: 18900, deliverySales: 28400, grossSales: 115800, discounts: 5600, taxes: 5510, netSales: 115710 },
      { id: "7", date: "2026-08-29", outlet: "HIGHWAY INN BAR & RESTAURANT", totalBills: 105, dineInSales: 64200, takeawaySales: 17100, deliverySales: 26000, grossSales: 107300, discounts: 4900, taxes: 5120, netSales: 107520 },
    ],
  },
  "REP-02": {
    // Outlet-Item Wise Report (Row)
    columns: [
      { id: "itemCode", label: "Item Code", sortable: true, getValue: (r) => r.itemCode },
      { id: "itemName", label: "Item Name", sortable: true, getValue: (r) => r.itemName },
      { id: "category", label: "Category", sortable: true, filterable: true, getValue: (r) => r.category },
      { id: "outlet", label: "Outlet", sortable: true, getValue: (r) => r.outlet },
      { id: "unitPrice", label: "Unit Rate (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.unitPrice}` },
      { id: "qtySold", label: "Quantity Sold", align: "right", sortable: true, getValue: (r) => String(r.qtySold) },
      { id: "grossRevenue", label: "Gross (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.grossRevenue.toLocaleString()}` },
      { id: "discountAmount", label: "Discount (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.discountAmount.toLocaleString()}` },
      { id: "netRevenue", label: "Net Revenue (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.netRevenue.toLocaleString()}` },
    ],
    data: [
      { id: "1", itemCode: "ITM-101", itemName: "Murgh Dum Biryani (Handi)", category: "Main Course", outlet: "HIGHWAY INN BAR & RESTAURANT", unitPrice: 480, qtySold: 142, grossRevenue: 68160, discountAmount: 3400, netRevenue: 64760 },
      { id: "2", itemCode: "ITM-102", itemName: "Paneer Butter Masala", category: "Main Course", outlet: "HIGHWAY INN BAR & RESTAURANT", unitPrice: 360, qtySold: 118, grossRevenue: 42480, discountAmount: 2100, netRevenue: 40380 },
      { id: "3", itemCode: "ITM-103", itemName: "Tandoori Pomfret", category: "Starters & Tandoor", outlet: "HIGHWAY INN BAR & RESTAURANT", unitPrice: 650, qtySold: 64, grossRevenue: 41600, discountAmount: 1800, netRevenue: 39800 },
      { id: "4", itemCode: "ITM-104", itemName: "Butter Garlic Naan", category: "Breads", outlet: "HIGHWAY INN BAR & RESTAURANT", unitPrice: 75, qtySold: 410, grossRevenue: 30750, discountAmount: 900, netRevenue: 29850 },
      { id: "5", itemCode: "ITM-105", itemName: "Classic Mojito", category: "Bar & Cocktails", outlet: "HIGHWAY INN BAR & RESTAURANT", unitPrice: 280, qtySold: 96, grossRevenue: 26880, discountAmount: 1200, netRevenue: 25680 },
      { id: "6", itemCode: "ITM-106", itemName: "Dal Makhani Royal", category: "Main Course", outlet: "HIGHWAY INN BAR & RESTAURANT", unitPrice: 310, qtySold: 88, grossRevenue: 27280, discountAmount: 1100, netRevenue: 26180 },
      { id: "7", itemCode: "ITM-107", itemName: "Banquet Buffet Spread A", category: "Banquet Catering", outlet: "HIGHWAY INN BANQUET", unitPrice: 1250, qtySold: 160, grossRevenue: 200000, discountAmount: 10000, netRevenue: 190000 },
    ],
  },
  "REP-03": {
    // Invoice Report: All Restaurants
    columns: [
      { id: "invoiceNo", label: "Invoice #", sortable: true, getValue: (r) => r.invoiceNo },
      { id: "timestamp", label: "Date & Time", sortable: true, getValue: (r) => r.timestamp },
      { id: "outlet", label: "Outlet", sortable: true, getValue: (r) => r.outlet },
      { id: "orderType", label: "Order Type", sortable: true, filterable: true, getValue: (r) => r.orderType },
      { id: "tableToken", label: "Table / Token", sortable: true, getValue: (r) => r.tableToken },
      { id: "customer", label: "Customer", sortable: true, getValue: (r) => r.customer },
      { id: "paymentMode", label: "Payment Mode", sortable: true, filterable: true, getValue: (r) => r.paymentMode },
      { id: "subTotal", label: "Subtotal (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.subTotal}` },
      { id: "tax", label: "Tax (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.tax}` },
      { id: "grandTotal", label: "Total Paid (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.grandTotal}` },
      { id: "status", label: "Status", sortable: true, filterable: true, getValue: (r) => r.status },
    ],
    data: [
      { id: "1", invoiceNo: "INV-2026-0901", timestamp: "2026-09-02 21:40", outlet: "HIGHWAY INN", orderType: "Dine-In", tableToken: "Table T-04", customer: "Rahul Sharma", paymentMode: "UPI / GPay", subTotal: 2450, tax: 122.5, grandTotal: 2572.5, status: "Paid" },
      { id: "2", invoiceNo: "INV-2026-0902", timestamp: "2026-09-02 21:15", outlet: "HIGHWAY INN", orderType: "Delivery (Zomato)", tableToken: "ZOM-8921", customer: "Pooja Verma", paymentMode: "Aggregator Online", subTotal: 890, tax: 44.5, grandTotal: 934.5, status: "Settled" },
      { id: "3", invoiceNo: "INV-2026-0903", timestamp: "2026-09-02 20:50", outlet: "HIGHWAY INN", orderType: "Takeaway", tableToken: "Token #14", customer: "Anand Gupta", paymentMode: "Card / Pine Labs", subTotal: 1280, tax: 64.0, grandTotal: 1344.0, status: "Paid" },
      { id: "4", invoiceNo: "INV-2026-0904", timestamp: "2026-09-02 20:20", outlet: "HIGHWAY INN", orderType: "Dine-In", tableToken: "Table T-12", customer: "Siddharth Rao", paymentMode: "Cash", subTotal: 3400, tax: 170.0, grandTotal: 3570.0, status: "Paid" },
      { id: "5", invoiceNo: "INV-2026-0905", timestamp: "2026-09-02 19:45", outlet: "BANQUET HALL", orderType: "Banquet Event", tableToken: "Hall A", customer: "Verma Corporate Reception", paymentMode: "Bank Transfer", subTotal: 48000, tax: 2400.0, grandTotal: 50400.0, status: "Paid" },
      { id: "6", invoiceNo: "INV-2026-0906", timestamp: "2026-09-02 19:10", outlet: "HIGHWAY INN", orderType: "Dine-In", tableToken: "Table T-02", customer: "Deepak Mehta", paymentMode: "UPI / Paytm", subTotal: 1980, tax: 99.0, grandTotal: 2079.0, status: "Paid" },
    ],
  },
  "REP-04": {
    // Pax Sales Report: Biller Wise
    columns: [
      { id: "billerName", label: "Biller / Captain Name", sortable: true, getValue: (r) => r.billerName },
      { id: "empId", label: "Staff ID", sortable: true, getValue: (r) => r.empId },
      { id: "outlet", label: "Outlet", sortable: true, getValue: (r) => r.outlet },
      { id: "shift", label: "Shift", sortable: true, filterable: true, getValue: (r) => r.shift },
      { id: "totalPax", label: "Total Pax / Covers", align: "right", sortable: true, getValue: (r) => String(r.totalPax) },
      { id: "totalBills", label: "Total Bills", align: "right", sortable: true, getValue: (r) => String(r.totalBills) },
      { id: "totalSales", label: "Total Sales (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.totalSales.toLocaleString()}` },
      { id: "avgPerPax", label: "Avg Spend / Pax (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.avgPerPax}` },
      { id: "avgPerBill", label: "Avg Ticket Size (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.avgPerBill}` },
    ],
    data: [
      { id: "1", billerName: "Sunil Verma (Cashier)", empId: "EMP-041", outlet: "HIGHWAY INN", shift: "Evening Shift", totalPax: 148, totalBills: 52, totalSales: 54600, avgPerPax: 368.9, avgPerBill: 1050 },
      { id: "2", billerName: "Ramesh Patel (Captain)", empId: "EMP-048", outlet: "HIGHWAY INN", shift: "Evening Shift", totalPax: 96, totalBills: 31, totalSales: 38200, avgPerPax: 397.9, avgPerBill: 1232 },
      { id: "3", billerName: "Priya Sharma (Manager)", empId: "EMP-012", outlet: "HIGHWAY INN", shift: "Day & Evening", totalPax: 64, totalBills: 18, totalSales: 28900, avgPerPax: 451.5, avgPerBill: 1605 },
      { id: "4", billerName: "Kailash (Counter Staff)", empId: "EMP-055", outlet: "HIGHWAY INN", shift: "Day Shift", totalPax: 82, totalBills: 29, totalSales: 24500, avgPerPax: 298.7, avgPerBill: 844 },
    ],
  },
  "REP-05": {
    // Order Report: Sub-Order Wise
    columns: [
      { id: "subOrderType", label: "Sub-Order Type", sortable: true, getValue: (r) => r.subOrderType },
      { id: "channel", label: "Channel Source", sortable: true, filterable: true, getValue: (r) => r.channel },
      { id: "totalOrders", label: "Total Orders", align: "right", sortable: true, getValue: (r) => String(r.totalOrders) },
      { id: "deliveredOrders", label: "Delivered / Completed", align: "right", sortable: true, getValue: (r) => String(r.deliveredOrders) },
      { id: "cancelledOrders", label: "Cancelled", align: "right", sortable: true, getValue: (r) => String(r.cancelledOrders) },
      { id: "grossAmount", label: "Gross Amount (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.grossAmount.toLocaleString()}` },
      { id: "netSettled", label: "Net Settled (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.netSettled.toLocaleString()}` },
    ],
    data: [
      { id: "1", subOrderType: "Dine-In AC Section", channel: "POS Table Desk", totalOrders: 142, deliveredOrders: 140, cancelledOrders: 2, grossAmount: 98400, netSettled: 96800 },
      { id: "2", subOrderType: "Dine-In Garden Bar", channel: "POS Table Desk", totalOrders: 88, deliveredOrders: 86, cancelledOrders: 2, grossAmount: 64200, netSettled: 63100 },
      { id: "3", subOrderType: "Zomato Delivery", channel: "Aggregator Integration", totalOrders: 74, deliveredOrders: 72, cancelledOrders: 2, grossAmount: 42100, netSettled: 34500 },
      { id: "4", subOrderType: "Swiggy Delivery", channel: "Aggregator Integration", totalOrders: 58, deliveredOrders: 57, cancelledOrders: 1, grossAmount: 32900, netSettled: 26900 },
      { id: "5", subOrderType: "Direct Counter Takeaway", channel: "POS Walk-In", totalOrders: 49, deliveredOrders: 49, cancelledOrders: 0, grossAmount: 21800, netSettled: 21800 },
      { id: "6", subOrderType: "Room Service", channel: "Hotel PMS Interop", totalOrders: 18, deliveredOrders: 18, cancelledOrders: 0, grossAmount: 14200, netSettled: 14200 },
    ],
  },
  "REP-06": {
    // All Restaurant Report: Day Wise
    columns: [
      { id: "date", label: "Date", sortable: true, getValue: (r) => r.date },
      { id: "dayOfWeek", label: "Day", sortable: true, getValue: (r) => r.dayOfWeek },
      { id: "dineInRev", label: "Dine-In (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.dineInRev.toLocaleString()}` },
      { id: "takeawayRev", label: "Takeaway (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.takeawayRev.toLocaleString()}` },
      { id: "deliveryRev", label: "Delivery (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.deliveryRev.toLocaleString()}` },
      { id: "totalBills", label: "Total Bills", align: "right", sortable: true, getValue: (r) => String(r.totalBills) },
      { id: "totalNetRev", label: "Total Net Revenue (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.totalNetRev.toLocaleString()}` },
    ],
    data: [
      { id: "1", date: "2026-09-02", dayOfWeek: "Wednesday", dineInRev: 48200, takeawayRev: 12400, deliveryRev: 18900, totalBills: 84, totalNetRev: 79500 },
      { id: "2", date: "2026-09-01", dayOfWeek: "Tuesday", dineInRev: 54100, takeawayRev: 14200, deliveryRev: 21500, totalBills: 92, totalNetRev: 89800 },
      { id: "3", date: "2026-08-31", dayOfWeek: "Monday", dineInRev: 42000, takeawayRev: 10800, deliveryRev: 16400, totalBills: 78, totalNetRev: 69200 },
      { id: "4", date: "2026-08-30", dayOfWeek: "Sunday", dineInRev: 68500, takeawayRev: 18900, deliveryRev: 28400, totalBills: 110, totalNetRev: 115800 },
      { id: "5", date: "2026-08-29", dayOfWeek: "Saturday", dineInRev: 64200, takeawayRev: 17100, deliveryRev: 26000, totalBills: 105, totalNetRev: 107300 },
      { id: "6", date: "2026-08-28", dayOfWeek: "Friday", dineInRev: 58900, takeawayRev: 15400, deliveryRev: 22800, totalBills: 98, totalNetRev: 97100 },
      { id: "7", date: "2026-08-27", dayOfWeek: "Thursday", dineInRev: 49800, takeawayRev: 11900, deliveryRev: 19100, totalBills: 86, totalNetRev: 80800 },
    ],
  },
  "REP-07": {
    // Discount & Comp Audit Report
    columns: [
      { id: "billNo", label: "Bill / Order No", sortable: true, getValue: (r) => r.billNo },
      { id: "timestamp", label: "Date & Time", sortable: true, getValue: (r) => r.timestamp },
      { id: "authorizedBy", label: "Authorized By", sortable: true, getValue: (r) => r.authorizedBy },
      { id: "reason", label: "Discount Reason", sortable: true, filterable: true, getValue: (r) => r.reason },
      { id: "discountType", label: "Type", sortable: true, getValue: (r) => r.discountType },
      { id: "originalAmount", label: "Bill Amount (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.originalAmount}` },
      { id: "discountValue", label: "Discount (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.discountValue}` },
      { id: "finalBill", label: "Final Paid (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.finalBill}` },
    ],
    data: [
      { id: "1", billNo: "RET-2026-0812", timestamp: "2026-09-02 22:30", authorizedBy: "Priya Sharma (Manager)", reason: "VIP Guest Courtesy", discountType: "Percentage (15%)", originalAmount: 3000, discountValue: 450, finalBill: 2550 },
      { id: "2", billNo: "RET-2026-0814", timestamp: "2026-09-02 21:10", authorizedBy: "Sunil Verma (Cashier)", reason: "Happy Hour Special", discountType: "Flat ₹200", originalAmount: 1850, discountValue: 200, finalBill: 1650 },
      { id: "3", billNo: "RET-2026-0822", timestamp: "2026-09-01 20:15", authorizedBy: "Priya Sharma (Manager)", reason: "Food Quality / Delayed Order", discountType: "Comp Item 100%", originalAmount: 2400, discountValue: 480, finalBill: 1920 },
      { id: "4", billNo: "RET-2026-0830", timestamp: "2026-08-31 19:40", authorizedBy: "Amitabh Verma (Owner)", reason: "Owner Friends & Family", discountType: "Percentage (25%)", originalAmount: 4500, discountValue: 1125, finalBill: 3375 },
    ],
  },
  "REP-08": {
    // Category Contribution Analysis
    columns: [
      { id: "categoryName", label: "Category Name", sortable: true, getValue: (r) => r.categoryName },
      { id: "itemCount", label: "Active Items", align: "right", sortable: true, getValue: (r) => String(r.itemCount) },
      { id: "qtySold", label: "Total Qty Sold", align: "right", sortable: true, getValue: (r) => String(r.qtySold) },
      { id: "totalRevenue", label: "Total Revenue (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.totalRevenue.toLocaleString()}` },
      { id: "contributionPct", label: "Revenue Share (%)", align: "right", sortable: true, getValue: (r) => `${r.contributionPct}%` },
      { id: "profitMargin", label: "Est. Margin (%)", align: "right", sortable: true, getValue: (r) => `${r.profitMargin}%` },
    ],
    data: [
      { id: "1", categoryName: "Main Course (Gravy & Biryani)", itemCount: 34, qtySold: 640, totalRevenue: 182400, contributionPct: 42.5, profitMargin: 68 },
      { id: "2", categoryName: "Bar, Beer & Cocktails", itemCount: 28, qtySold: 390, totalRevenue: 109200, contributionPct: 25.4, profitMargin: 74 },
      { id: "3", categoryName: "Starters, Kebabs & Tandoor", itemCount: 22, qtySold: 310, totalRevenue: 86800, contributionPct: 20.2, profitMargin: 65 },
      { id: "4", categoryName: "Indian Breads & Rotis", itemCount: 10, qtySold: 850, totalRevenue: 34000, contributionPct: 7.9, profitMargin: 82 },
      { id: "5", categoryName: "Desserts & Mocktails", itemCount: 12, qtySold: 115, totalRevenue: 17250, contributionPct: 4.0, profitMargin: 70 },
    ],
  },
  "REP-09": {
    // Customer Repeat Order Matrix
    columns: [
      { id: "customerName", label: "Customer Name", sortable: true, getValue: (r) => r.customerName },
      { id: "phone", label: "Mobile No", sortable: true, getValue: (r) => r.phone },
      { id: "segment", label: "Customer Tier", sortable: true, filterable: true, getValue: (r) => r.segment },
      { id: "totalVisits", label: "Total Visits", align: "right", sortable: true, getValue: (r) => String(r.totalVisits) },
      { id: "lastVisit", label: "Last Visit", sortable: true, getValue: (r) => r.lastVisit },
      { id: "lifetimeSpend", label: "Lifetime Spend (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.lifetimeSpend.toLocaleString()}` },
      { id: "avgOrderValue", label: "Avg Ticket (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.avgOrderValue}` },
    ],
    data: [
      { id: "1", customerName: "Rahul Sharma", phone: "9876543210", segment: "Platinum VIP", totalVisits: 18, lastVisit: "2026-09-02", lifetimeSpend: 42500, avgOrderValue: 2361 },
      { id: "2", customerName: "Pooja Verma", phone: "9812345678", segment: "Gold Regular", totalVisits: 12, lastVisit: "2026-09-02", lifetimeSpend: 24800, avgOrderValue: 2066 },
      { id: "3", customerName: "Vikram Malhotra", phone: "9823456789", segment: "Gold Regular", totalVisits: 9, lastVisit: "2026-08-30", lifetimeSpend: 19400, avgOrderValue: 2155 },
      { id: "4", customerName: "Deepak Mehta", phone: "9834567890", segment: "Silver Returning", totalVisits: 5, lastVisit: "2026-08-28", lifetimeSpend: 9200, avgOrderValue: 1840 },
      { id: "5", customerName: "Ananya Roy", phone: "9845678901", segment: "New Guest", totalVisits: 2, lastVisit: "2026-08-25", lifetimeSpend: 3100, avgOrderValue: 1550 },
    ],
  },
  "REP-10": {
    // Hourly Sales & Peak Time Report
    columns: [
      { id: "timeSlot", label: "Time Window", sortable: true, getValue: (r) => r.timeSlot },
      { id: "ordersCount", label: "Orders Placed", align: "right", sortable: true, getValue: (r) => String(r.ordersCount) },
      { id: "totalCovers", label: "Guest Covers", align: "right", sortable: true, getValue: (r) => String(r.totalCovers) },
      { id: "salesAmount", label: "Revenue (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.salesAmount.toLocaleString()}` },
      { id: "avgSpeed", label: "Avg Prep Time", align: "right", sortable: true, getValue: (r) => r.avgSpeed },
    ],
    data: [
      { id: "1", timeSlot: "12:00 PM - 01:00 PM", ordersCount: 18, totalCovers: 42, salesAmount: 14800, avgSpeed: "14 mins" },
      { id: "2", timeSlot: "01:00 PM - 02:00 PM (Lunch Peak)", ordersCount: 46, totalCovers: 112, salesAmount: 41200, avgSpeed: "19 mins" },
      { id: "3", timeSlot: "02:00 PM - 03:30 PM", ordersCount: 22, totalCovers: 54, salesAmount: 18400, avgSpeed: "12 mins" },
      { id: "4", timeSlot: "07:00 PM - 08:30 PM", ordersCount: 38, totalCovers: 92, salesAmount: 34500, avgSpeed: "16 mins" },
      { id: "5", timeSlot: "08:30 PM - 10:30 PM (Dinner Peak)", ordersCount: 68, totalCovers: 174, salesAmount: 68900, avgSpeed: "22 mins" },
      { id: "6", timeSlot: "10:30 PM - 11:30 PM", ordersCount: 14, totalCovers: 28, salesAmount: 11200, avgSpeed: "11 mins" },
    ],
  },
  "REP-11": {
    // Payment Mode & Settlement Reconciliation
    columns: [
      { id: "paymentMethod", label: "Payment Mode", sortable: true, getValue: (r) => r.paymentMethod },
      { id: "txnCount", label: "Transactions", align: "right", sortable: true, getValue: (r) => String(r.txnCount) },
      { id: "collectedAmount", label: "Collected (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.collectedAmount.toLocaleString()}` },
      { id: "processingFee", label: "MDR / Charges (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.processingFee.toLocaleString()}` },
      { id: "netBankDeposit", label: "Net Credited (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.netBankDeposit.toLocaleString()}` },
    ],
    data: [
      { id: "1", paymentMethod: "UPI (Google Pay / PhonePe / Paytm)", txnCount: 164, collectedAmount: 112400, processingFee: 0, netBankDeposit: 112400 },
      { id: "2", paymentMethod: "Credit / Debit Cards (Pine Labs POS)", txnCount: 78, collectedAmount: 68900, processingFee: 1033.5, netBankDeposit: 67866.5 },
      { id: "3", paymentMethod: "Cash Drawer Collection", txnCount: 54, collectedAmount: 36200, processingFee: 0, netBankDeposit: 36200 },
      { id: "4", paymentMethod: "Zomato Online Settlement", txnCount: 38, collectedAmount: 28400, processingFee: 5112, netBankDeposit: 23288 },
      { id: "5", paymentMethod: "Swiggy Online Settlement", txnCount: 31, collectedAmount: 22100, processingFee: 3978, netBankDeposit: 18122 },
      { id: "6", paymentMethod: "Hotel Room Post (Guest Folio)", txnCount: 12, collectedAmount: 14200, processingFee: 0, netBankDeposit: 14200 },
    ],
  },
  "REP-12": {
    // GST Summary & Tax Audit
    columns: [
      { id: "taxType", label: "Tax Slab / Category", sortable: true, getValue: (r) => r.taxType },
      { id: "rate", label: "Rate (%)", align: "right", sortable: true, getValue: (r) => `${r.rate}%` },
      { id: "taxableAmount", label: "Taxable Value (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.taxableAmount.toLocaleString()}` },
      { id: "cgst", label: "CGST (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.cgst.toLocaleString()}` },
      { id: "sgst", label: "SGST (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.sgst.toLocaleString()}` },
      { id: "totalTax", label: "Total GST (₹)", align: "right", sortable: true, getValue: (r) => `₹${r.totalTax.toLocaleString()}` },
    ],
    data: [
      { id: "1", taxType: "Food & Non-Alcoholic Beverages (AC / Non-AC)", rate: 5, taxableAmount: 215000, cgst: 5375, sgst: 5375, totalTax: 10750 },
      { id: "2", taxType: "Alcohol & Beverages (VAT)", rate: 18, taxableAmount: 78500, cgst: 7065, sgst: 7065, totalTax: 14130 },
      { id: "3", taxType: "Banquet Catering & Hall Rentals", rate: 18, taxableAmount: 95000, cgst: 8550, sgst: 8550, totalTax: 17100 },
      { id: "4", taxType: "Packaged Mineral Water & MRP Goods", rate: 12, taxableAmount: 6400, cgst: 384, sgst: 384, totalTax: 768 },
    ],
  },
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

const MOCK_FROM = "2026-08-27";
const MOCK_TO = "2026-09-02";

export function MainOtherReportsView() {
  const { activeOutlet } = useOutletContext();
  const live = isBackendOutletId(activeOutlet?.id);
  const [viewMode, setViewMode] = useState<"catalog" | "dashboard">("catalog");
  const [activePill, setActivePill] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<ReportCard | null>(null);
  const [reportList, setReportList] = useState<ReportCard[]>(ALL_REPORTS);

  // ---------------------------------------------------------
  // DRILLDOWN REPORT VIEW STATE
  // ---------------------------------------------------------
  const [fromDate, setFromDate] = useState(live ? rangeLastDays(7).from : MOCK_FROM);
  const [toDate, setToDate] = useState(live ? rangeLastDays(7).to : MOCK_TO);
  const [reportSearch, setReportSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [sortConfig, setSortConfig] = useState<{ colId: string; direction: "asc" | "desc" } | null>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<string>("ALL");

  useEffect(() => {
    if (live) {
      const range = rangeLastDays(7);
      setFromDate(range.from);
      setToDate(range.to);
      setSelectedOutlet(activeOutlet?.name || "ALL");
    } else {
      setFromDate(MOCK_FROM);
      setToDate(MOCK_TO);
      setSelectedOutlet("ALL");
    }
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
    setReportList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r))
    );
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
    const base = DATASETS[selectedReport.id] || DATASETS["REP-01"];
    if (live) {
      return { columns: base.columns, data: salesQuery.data?.records || [] };
    }
    return base;
  }, [selectedReport, live, salesQuery.data]);

  const allColumns = useMemo(() => {
    return currentReportConfig?.columns || [];
  }, [currentReportConfig]);

  const handleOpenReport = (report: ReportCard) => {
    setSelectedReport(report);
    const cfg = DATASETS[report.id] || DATASETS["REP-01"];
    const initialVis: Record<string, boolean> = {};
    cfg.columns.forEach((c) => {
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

    if (!live) {
      // Date range filtering (mock rows only — live rows are already scoped)
      if (fromDate || toDate) {
        rows = rows.filter((r) => {
          if (!r.date && !r.timestamp && !r.lastVisit) return true;
          const rowDate = r.date || (r.timestamp ? r.timestamp.slice(0, 10) : r.lastVisit);
          if (fromDate && rowDate < fromDate) return false;
          if (toDate && rowDate > toDate) return false;
          return true;
        });
      }

      if (selectedOutlet !== "ALL") {
        rows = rows.filter((r) => {
          const out = r.outlet || r.outletName || r.outlet_name || "";
          return !out || out.toLowerCase().includes(selectedOutlet.toLowerCase()) || selectedOutlet.toLowerCase().includes(out.toLowerCase());
        });
      }
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
  }, [currentReportConfig, fromDate, toDate, selectedOutlet, reportSearch, sortConfig, live]);

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
    window.print();
    toast.success("Sent report to printer / preview");
  };

  const toggleColumnVisibility = (colId: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [colId]: !prev[colId],
    }));
  };

  // Helper for Pastel Icon Background styling
  const getIconBadgeStyle = (color: string) => {
    switch (color) {
      case "rose":
        return "bg-rose-50 text-rose-600 border border-rose-100";
      case "sky":
        return "bg-sky-50 text-sky-600 border border-sky-100";
      case "emerald":
        return "bg-emerald-50 text-emerald-600 border border-emerald-100";
      case "purple":
        return "bg-purple-50 text-purple-600 border border-purple-100";
      case "amber":
        return "bg-amber-50 text-amber-600 border border-amber-100";
      case "teal":
      default:
        return "bg-teal-50 text-teal-700 border border-teal-100";
    }
  };

  // ---------------------------------------------------------
  // RENDER: DRILLDOWN TABULAR VIEW
  // ---------------------------------------------------------
  if (selectedReport) {
    return (
      <div className="space-y-4 print:p-0">
        {/* Top Breadcrumb / Title Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 print:hidden">
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
                <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
                  {selectedReport.title}
                </h2>
                <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700 border border-teal-200">
                  {selectedReport.id}
                </span>
              </div>
              <p className="text-[12px] text-slate-500 mt-0.5">{selectedReport.description}</p>
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

        {/* Filter Toolbar: Date Filter + Global Search */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 print:hidden">
          <div className="flex flex-wrap items-end justify-between gap-3">
            {/* Date Pickers */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-[11.5px] font-semibold text-slate-600">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11.5px] font-semibold text-slate-600">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
                />
              </div>

              {/* Outlet Filter Dropdown */}
              <div className="space-y-1">
                <label className="text-[11.5px] font-semibold text-slate-600">Outlet</label>
                <select
                  value={live ? activeOutlet?.name || selectedOutlet : selectedOutlet}
                  onChange={(e) => {
                    if (live) return;
                    setSelectedOutlet(e.target.value);
                    setPage(1);
                  }}
                  disabled={live}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer disabled:bg-slate-50"
                >
                  {live ? (
                    <option value={activeOutlet?.name}>{activeOutlet?.name}</option>
                  ) : (
                    <>
                      <option value="ALL">All Outlets</option>
                      <option value="HIGHWAY INN BAR & RESTAURANT">Highway Inn Bar &amp; Restaurant</option>
                      <option value="HIGHWAY INN BANQUET">Highway Inn Banquet</option>
                    </>
                  )}
                </select>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1 pb-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (live) {
                      const today = isoDate(new Date());
                      setFromDate(today);
                      setToDate(today);
                    } else {
                      setFromDate("2026-09-02");
                      setToDate("2026-09-02");
                    }
                    setPage(1);
                  }}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (live) {
                      const range = rangeLastDays(7);
                      setFromDate(range.from);
                      setToDate(range.to);
                    } else {
                      setFromDate(MOCK_FROM);
                      setToDate(MOCK_TO);
                    }
                    setPage(1);
                  }}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (live) {
                      const range = rangeThisMonth();
                      setFromDate(range.from);
                      setToDate(range.to);
                    } else {
                      setFromDate("2026-08-01");
                      setToDate(MOCK_TO);
                    }
                    setPage(1);
                  }}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  This Month
                </button>
              </div>
            </div>

            {/* Global Search Bar */}
            <div className="flex items-center gap-2 min-w-[280px]">
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

              {(reportSearch || fromDate !== (live ? rangeLastDays(7).from : MOCK_FROM) || toDate !== (live ? rangeLastDays(7).to : MOCK_TO)) && (
                <button
                  type="button"
                  onClick={() => {
                    setReportSearch("");
                    if (live) {
                      const range = rangeLastDays(7);
                      setFromDate(range.from);
                      setToDate(range.to);
                    } else {
                      setFromDate(MOCK_FROM);
                      setToDate(MOCK_TO);
                    }
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
                {activeOutlet?.name || "HIGHWAY INN BAR & RESTAURANT"}
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
        {live && salesQuery.isFetching ? (
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
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden print:border-none print:shadow-none print:rounded-none print:overflow-visible print:w-full print:m-0 print:p-0">
            <div className="overflow-x-auto print:overflow-visible print:w-full print:m-0 print:p-0">
              <table className="w-full text-left text-[13px] border-collapse print:w-full print:text-[11px]">
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
                <tbody className="divide-y divide-slate-100 print:hidden">
                  {paginatedReportData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition">
                      {activeColumns.map((col) => (
                        <td
                          key={col.id}
                          className={`py-3 px-3.5 align-middle ${
                            col.align === "center"
                              ? "text-center"
                              : col.align === "right"
                              ? "text-right"
                              : "text-left"
                          }`}
                        >
                          {col.getValue ? (
                            <span
                              className={
                                col.align === "right"
                                  ? "font-mono font-medium text-slate-800"
                                  : "text-slate-800 font-medium"
                              }
                            >
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
                <tbody className="hidden print:table-row-group divide-y divide-slate-300">
                  {reportDataset.map((row, rIdx) => (
                    <tr key={row.id || rIdx} className="print:border-b print:border-slate-300">
                      {activeColumns.map((col) => (
                        <td
                          key={col.id}
                          className={`py-2 px-3 text-[11px] align-middle print:border print:border-slate-300 ${
                            col.align === "center"
                              ? "text-center"
                              : col.align === "right"
                              ? "text-right font-mono font-medium"
                              : "text-left"
                          }`}
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
    );
  }

  // ---------------------------------------------------------
  // RENDER: REPORTS CATALOG & DASHBOARD (ALIGNED WITH PMS/POS DESIGN)
  // ---------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar (Title + Subtitle + Search + View Mode Switcher) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">
            Reports & Graphs
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-0.5">
            Access operational, financial, and restaurant performance reports in one place.
          </p>
        </div>

        {/* Top-right Search and View Toggle Switcher */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[220px] sm:min-w-[260px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-8 py-2 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-none shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center rounded-xl border border-slate-300 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("catalog")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-bold transition cursor-pointer ${
                viewMode === "catalog"
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Catalog</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("dashboard")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-bold transition cursor-pointer ${
                viewMode === "dashboard"
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Horizontal Filter Tabs / Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {CATEGORY_PILLS.map((pill) => {
          const isActive = activePill === pill.id;
          const label =
            pill.id === "favorites" ? `⭐ Favorites (${favoriteCount})` : pill.label;

          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => setActivePill(pill.id)}
              className={`px-4 py-1.5 rounded-full text-[12.5px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-teal-700 text-white shadow-xs"
                  : "bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
              }`}
            >
              {label}
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
        <div className="space-y-8">
          {Object.keys(groupedSections).length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-400 space-y-2">
              <div className="text-[15px] font-bold text-slate-700">No reports found</div>
              <p className="text-[12.5px] text-slate-400">
                No reports matched "{searchQuery}" in the selected category.
              </p>
            </div>
          ) : (
            Object.entries(groupedSections).map(([groupTitle, cards]) => (
              <div key={groupTitle} className="space-y-3">
                {/* Section Category Title matching Screenshot */}
                <h3 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500">
                  {groupTitle}
                </h3>

                {/* 4-Column Responsive Grid of Report Cards matching Screenshot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {cards.map((report) => {
                    const Icon = report.icon;
                    return (
                      <div
                        key={report.id}
                        onClick={() => handleOpenReport(report)}
                        className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-2xs hover:shadow-md hover:border-teal-400 transition-all duration-150 cursor-pointer relative flex flex-col justify-between min-h-[155px] group"
                      >
                        {/* Card Top Row: Pastel Icon Badge + Optional 'NEW' Tag */}
                        <div className="flex items-start justify-between">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold shadow-2xs ${getIconBadgeStyle(
                              report.iconColor
                            )}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>

                          {report.isNew && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-emerald-800">
                              NEW
                            </span>
                          )}
                        </div>

                        {/* Card Middle: Title + Description */}
                        <div className="mt-3 mb-2 flex-1">
                          <h4 className="text-[13.5px] font-bold text-slate-900 group-hover:text-teal-700 transition-colors leading-snug">
                            {report.title}
                          </h4>
                          <p className="text-[11.5px] text-slate-500 leading-relaxed line-clamp-2 mt-1">
                            {report.description}
                          </p>
                        </div>

                        {/* Card Bottom Row: Favorite Star Toggle */}
                        <div className="flex items-center justify-end pt-1">
                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(report.id, e)}
                            className="p-1 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                            title={report.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                          >
                            <Star
                              className={`h-4 w-4 ${
                                report.isFavorite
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300 hover:text-slate-400"
                              }`}
                            />
                          </button>
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
  );
}
