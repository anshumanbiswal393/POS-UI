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
 * Maps raw backend DTO into clean UI Model
 */
export function mapDtoToDashboardModel(
  dto: PosDashboardApiResponse,
  isMock: boolean = false,
): PosDashboardData {
  const visibleOrderTypes = (dto.orderTypes || []).filter((ot) => ot.type !== "delivery");
  const totalOrderTypesCount = visibleOrderTypes.reduce((acc, curr) => acc + (curr.count || 0), 0);

  const stats: PosDashboardStats = {
    totalCollections: dto.stats?.totalCollections || 0,
    totalCollectionsFormatted: formatINR(dto.stats?.totalCollections || 0),
    totalOrders: totalOrderTypesCount || dto.stats?.totalOrders || 0,
    activeTablesCount: dto.stats?.activeTablesCount || 0,
    totalTablesCount: dto.stats?.totalTablesCount || 0,
    occupancyPercentage: Math.round(
      ((dto.stats?.activeTablesCount || 0) / (dto.stats?.totalTablesCount || 1)) * 100,
    ),
    unpaidBillsAmount: dto.stats?.unpaidBillsAmount || 0,
    unpaidBillsFormatted: formatINR(dto.stats?.unpaidBillsAmount || 0),
    roomChargesAmount: dto.stats?.roomChargesAmount || 0,
    roomChargesFormatted: formatINR(dto.stats?.roomChargesAmount || 0),
  };

  const salesGraph: HourlySalesPoint[] = (dto.salesGraph || []).map((pt) => ({
    hour: pt.hour,
    todaySales: pt.todaySales || 0,
    yesterdaySales: pt.yesterdaySales || 0,
  }));

  const orderTypes: OrderTypeMixItem[] = visibleOrderTypes.map((ot) => ({
    id: ot.type,
    type: ot.type,
    label: ot.label,
    count: ot.count || 0,
    percentage: totalOrderTypesCount
      ? Math.round(((ot.count || 0) / totalOrderTypesCount) * 1000) / 10
      : (ot.percentage || 0),
    color: ot.color,
  }));

  const liveOrders: LiveOrderItem[] = (dto.liveOrders || []).map((lo) => ({
    id: lo.id,
    title: lo.title,
    orderType: lo.orderTypeLabel,
    status: lo.status === "delivered" ? "ready" : (lo.status as any),
    statusLabel: lo.statusLabel,
    elapsedMinutes: lo.elapsedMinutes,
  }));

  const paymentSummary: PaymentSummaryData = {
    cash: {
      amount: dto.paymentSummary?.cash?.amount || 0,
      formatted: formatINR(dto.paymentSummary?.cash?.amount || 0),
      percentage: dto.paymentSummary?.cash?.percentage || 0,
    },
    card: {
      amount: dto.paymentSummary?.card?.amount || 0,
      formatted: formatINR(dto.paymentSummary?.card?.amount || 0),
      percentage: dto.paymentSummary?.card?.percentage || 0,
    },
    upiWallets: {
      amount: dto.paymentSummary?.upiWallets?.amount || 0,
      formatted: formatINR(dto.paymentSummary?.upiWallets?.amount || 0),
      percentage: dto.paymentSummary?.upiWallets?.percentage || 0,
    },
    other: {
      amount: dto.paymentSummary?.other?.amount || 0,
      formatted: formatINR(dto.paymentSummary?.other?.amount || 0),
      percentage: dto.paymentSummary?.other?.percentage || 0,
    },
    totalFormatted: formatINR(dto.paymentSummary?.total || 0),
    totalAmount: dto.paymentSummary?.total || 0,
  };

  const tables: TableStatusItem[] = (dto.tables || []).map((t) => ({
    tableNumber: t.tableNumber,
    status: t.status,
  }));

  const topSellingItems: TopDishItem[] = (dto.topSellingItems || []).map((item) => ({
    id: item.id,
    name: item.name,
    platesText: `${item.quantitySold || 0} ${item.unitLabel || "Plates"}`,
    revenueFormatted: formatINR(item.revenue || 0),
    imageUrl: item.imageUrl,
  }));

  const attentionAlerts: AttentionItem[] = (dto.attentionAlerts || []).map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    actionText: a.actionText,
    actionRoute: a.actionRoute,
  }));

  const opDto = dto.operationalMetrics?.[0] || {
    avgPrepTimeMinutes: 0,
    successfulOrdersCount: 0,
    complimentaryOrdersCount: 0,
    cancelledOrdersCount: 0,
  };

  const operations: OperationsSummary = {
    avgPrepTimeMinutes: opDto.avgPrepTimeMinutes || 0,
    successfulCount: opDto.successfulOrdersCount || 0,
    complimentaryCount: opDto.complimentaryOrdersCount || 0,
    cancelledCount: opDto.cancelledOrdersCount || 0,
    discountsCount: opDto.complimentaryOrdersCount || 0,
  };

  return {
    outletName: dto.outletName || "",
    dateLabel: dto.date || "Today",
    isMockData: isMock,
    stats,
    salesGraph,
    orderTypes,
    totalOrderTypesCount,
    liveOrders,
    paymentSummary,
    tables,
    topSellingItems,
    attentionAlerts,
    operations,
  };
}

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
