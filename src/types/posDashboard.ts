/**
 * UI Domain models for POS Dashboard.
 * Clean, component-ready domain models decoupled from raw backend wire formats.
 */

export interface PosDashboardStats {
  totalCollections: number;
  totalCollectionsFormatted: string;
  totalOrders: number;
  activeTablesCount: number;
  totalTablesCount: number;
  occupancyPercentage: number;
  unpaidBillsAmount: number;
  unpaidBillsFormatted: string;
  roomChargesAmount: number;
  roomChargesFormatted: string;
}

export interface HourlySalesPoint {
  hour: string;
  todaySales: number;
  yesterdaySales: number;
}

export interface OrderTypeMixItem {
  id: string;
  type: "dine_in" | "takeaway" | "delivery" | "room_service";
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface LiveOrderItem {
  id: string;
  title: string;
  orderType: string;
  status: "new" | "preparing" | "ready" | "out_for_delivery";
  statusLabel: string;
  elapsedMinutes: number;
}

export interface PaymentSummaryData {
  cash: { amount: number; formatted: string; percentage: number };
  card: { amount: number; formatted: string; percentage: number };
  upiWallets: { amount: number; formatted: string; percentage: number };
  other: { amount: number; formatted: string; percentage: number };
  totalFormatted: string;
  totalAmount: number;
}

export interface TableStatusItem {
  tableNumber: string;
  status: "available" | "occupied" | "reserved";
}

export interface TopDishItem {
  id: string;
  name: string;
  platesText: string;
  revenueFormatted: string;
  imageUrl?: string;
}

export interface AttentionItem {
  id: string;
  type: "low_stock" | "delayed_kot" | "unsettled_bills";
  title: string;
  actionText: string;
  actionRoute: string;
}

export interface OperationsSummary {
  avgPrepTimeMinutes: number;
  successfulCount: number;
  complimentaryCount: number;
  cancelledCount: number;
  discountsCount?: number;
}

export interface PosDashboardData {
  outletName: string;
  dateLabel: string;
  isMockData: boolean;
  stats: PosDashboardStats;
  salesGraph: HourlySalesPoint[];
  orderTypes: OrderTypeMixItem[];
  totalOrderTypesCount: number;
  liveOrders: LiveOrderItem[];
  paymentSummary: PaymentSummaryData;
  tables: TableStatusItem[];
  topSellingItems: TopDishItem[];
  attentionAlerts: AttentionItem[];
  operations: OperationsSummary;
}

export interface DashboardFilterParams {
  dateRange?: "today" | "yesterday" | "this_week" | "this_month";
  outletId?: string;
}
