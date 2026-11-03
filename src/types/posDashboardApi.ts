/**
 * Wire DTOs for POS Dashboard API.
 * Standardized contracts for backend endpoints (e.g. GET /api/pos/dashboard).
 */

export interface SalesStatsApiDto {
  totalCollections: number;
  totalOrders: number;
  activeTablesCount: number;
  totalTablesCount: number;
  unpaidBillsAmount: number;
  unpaidBillsCount: number;
  roomChargesAmount: number;
  roomChargesCount: number;
}

export interface HourlySalesPointApiDto {
  hour: string; // e.g. "12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM"
  todaySales: number;
  yesterdaySales: number;
}

export interface OrderTypeDistributionApiDto {
  type: "dine_in" | "takeaway" | "delivery" | "room_service";
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface LiveOrderApiDto {
  id: string;
  orderNumber: string;
  title: string; // e.g. "Table 07", "Room 204", "Delivery #1045"
  orderType: "dine_in" | "takeaway" | "delivery" | "room_service";
  orderTypeLabel: string;
  status: "new" | "preparing" | "ready" | "out_for_delivery" | "delivered";
  statusLabel: string;
  elapsedMinutes: number;
  amount: number;
}

export interface PaymentBreakdownApiDto {
  cash: { amount: number; percentage: number };
  card: { amount: number; percentage: number };
  upiWallets: { amount: number; percentage: number };
  other: { amount: number; percentage: number };
  total: number;
}

export interface TableItemApiDto {
  tableNumber: string; // "01", "02", ... "18"
  status: "available" | "occupied" | "reserved";
  guests?: number;
  currentOrderAmount?: number;
}

export interface TopSellingItemApiDto {
  id: string;
  name: string;
  category: string;
  quantitySold: number;
  unitLabel: string; // "Plates", "Glasses", etc.
  revenue: number;
  imageUrl?: string;
}

export interface AttentionAlertApiDto {
  id: string;
  type: "low_stock" | "delayed_kot" | "unsettled_bills";
  title: string;
  count: number;
  actionText: string;
  actionRoute: string;
}

export interface OperationalMetricsApiDto {
  avgPrepTimeMinutes: number;
  successfulOrdersCount: number;
  complimentaryOrdersCount: number;
  cancelledOrdersCount: number;
  exceptionsCount: number;
}

export interface PosDashboardApiResponse {
  success: boolean;
  outletId: string;
  outletName: string;
  date: string;
  currency: string;
  stats: SalesStatsApiDto;
  salesGraph: HourlySalesPointApiDto[];
  orderTypes: OrderTypeDistributionApiDto[];
  liveOrders: LiveOrderApiDto[];
  paymentSummary: PaymentBreakdownApiDto;
  tables: TableItemApiDto[];
  topSellingItems: TopSellingItemApiDto[];
  attentionAlerts: AttentionAlertApiDto[];
  operationalMetrics: OperationalMetricsApiDto[];
}
