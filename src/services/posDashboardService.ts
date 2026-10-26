import httpClient from "@/utils/httpClient";
import type { PosDashboardApiResponse } from "@/types/posDashboardApi";
import type {
  PosDashboardData,
  DashboardFilterParams,
  PosDashboardStats,
  PaymentSummaryData,
  HourlySalesPoint,
  OrderTypeMixItem,
  LiveOrderItem,
  TableStatusItem,
  TopDishItem,
  AttentionItem,
  OperationsSummary,
} from "@/types/posDashboard";
import { isBackendOutletId } from "@/utils/outletId";

/**
 * Format currency in Indian Rupees style (e.g. ₹1,84,260)
 */
export function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

/**
 * Mock data matching the specification screenshot
 */
const EMPTY_DASHBOARD_API_RESPONSE: PosDashboardApiResponse = {
  success: true,
  outletId: "",
  outletName: "",
  date: "Today",
  currency: "INR",
  stats: {
    totalCollections: 0,
    totalOrders: 0,
    activeTablesCount: 0,
    totalTablesCount: 0,
    unpaidBillsAmount: 0,
    unpaidBillsCount: 0,
    roomChargesAmount: 0,
    roomChargesCount: 0,
  },
  salesGraph: [
    { hour: "12 AM", todaySales: 0, yesterdaySales: 0 },
    { hour: "4 AM", todaySales: 0, yesterdaySales: 0 },
    { hour: "8 AM", todaySales: 0, yesterdaySales: 0 },
    { hour: "12 PM", todaySales: 0, yesterdaySales: 0 },
    { hour: "4 PM", todaySales: 0, yesterdaySales: 0 },
    { hour: "8 PM", todaySales: 0, yesterdaySales: 0 },
    { hour: "12 AM", todaySales: 0, yesterdaySales: 0 },
  ],
  orderTypes: [
    { type: "dine_in", label: "Dine-in", count: 0, percentage: 0, color: "#0f766e" },
    { type: "takeaway", label: "Takeaway", count: 0, percentage: 0, color: "#0d9488" },
    { type: "room_service", label: "Room service", count: 0, percentage: 0, color: "#94a3b8" },
  ],
  liveOrders: [],
  paymentSummary: {
    cash: { amount: 0, percentage: 0 },
    card: { amount: 0, percentage: 0 },
    upiWallets: { amount: 0, percentage: 0 },
    other: { amount: 0, percentage: 0 },
    total: 0,
  },
  tables: [],
  topSellingItems: [],
  attentionAlerts: [],
  operationalMetrics: [
    {
      avgPrepTimeMinutes: 0,
      successfulOrdersCount: 0,
      complimentaryOrdersCount: 0,
      cancelledOrdersCount: 0,
      exceptionsCount: 0,
    },
  ],
};

/**
 * Returns synchronous initial dashboard data for SSR and instant initial render
 */
export function getInitialDashboardData(_outletId?: string): PosDashboardData {
  return mapDtoToDashboardModel(EMPTY_DASHBOARD_API_RESPONSE, false);
}

/**
 * Service to fetch POS Dashboard data from backend or fallback to local realistic store
 */
export async function getPosDashboardData(
  filters?: DashboardFilterParams,
): Promise<PosDashboardData> {
  const outletId = filters?.outletId;
  if (typeof window === "undefined") {
    return getInitialDashboardData(outletId);
  }

  try {
    const response = await httpClient.get<PosDashboardApiResponse>("/api/pos/dashboard", {
      params: filters,
    });
    // Stub / incomplete payloads must not surface Highway demo numbers for real outlets
    if (
      response.data &&
      response.data.success &&
      response.data.stats &&
      Array.isArray(response.data.orderTypes)
    ) {
      return mapDtoToDashboardModel(response.data, false);
    }
    return getInitialDashboardData(outletId);
  } catch (_err) {
    return getInitialDashboardData(outletId);
  }
}
