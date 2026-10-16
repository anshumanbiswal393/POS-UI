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
const MOCK_DASHBOARD_API_RESPONSE: PosDashboardApiResponse = {
  success: true,
  outletId: "main-restaurant",
  outletName: "Main Restaurant",
  date: "Today, 17 Aug 2026",
  currency: "INR",
  stats: {
    totalCollections: 184260,
    totalOrders: 120,
    activeTablesCount: 18,
    totalTablesCount: 32,
    unpaidBillsAmount: 12400,
    unpaidBillsCount: 4,
    roomChargesAmount: 18600,
    roomChargesCount: 6,
  },
  salesGraph: [
    { hour: "12 AM", todaySales: 0, yesterdaySales: 500 },
    { hour: "4 AM", todaySales: 800, yesterdaySales: 400 },
    { hour: "8 AM", todaySales: 4200, yesterdaySales: 2800 },
    { hour: "12 PM", todaySales: 11400, yesterdaySales: 8200 },
    { hour: "4 PM", todaySales: 12800, yesterdaySales: 10500 },
    { hour: "8 PM", todaySales: 19800, yesterdaySales: 14600 },
    { hour: "12 AM", todaySales: 18426, yesterdaySales: 13200 },
  ],
  orderTypes: [
    { type: "dine_in", label: "Dine-in", count: 72, percentage: 60, color: "#0f766e" },
    { type: "takeaway", label: "Takeaway", count: 28, percentage: 23.3, color: "#0d9488" },
    { type: "room_service", label: "Room service", count: 20, percentage: 16.7, color: "#94a3b8" },
  ],
  liveOrders: [
    {
      id: "ord-1",
      orderNumber: "ORD-0721",
      title: "Table 07",
      orderType: "dine_in",
      orderTypeLabel: "Dine-in",
      status: "preparing",
      statusLabel: "Preparing",
      elapsedMinutes: 12,
      amount: 1450,
    },
    {
      id: "ord-2",
      orderNumber: "ORD-0722",
      title: "Room 204",
      orderType: "room_service",
      orderTypeLabel: "Room service",
      status: "ready",
      statusLabel: "Ready",
      elapsedMinutes: 8,
      amount: 980,
    },
    {
      id: "ord-3",
      orderNumber: "ORD-0723",
      title: "Table 12",
      orderType: "dine_in",
      orderTypeLabel: "Dine-in",
      status: "new",
      statusLabel: "New",
      elapsedMinutes: 2,
      amount: 2150,
    },
    {
      id: "ord-4",
      orderNumber: "ORD-0724",
      title: "Delivery #1045",
      orderType: "delivery",
      orderTypeLabel: "Home Delivery",
      status: "out_for_delivery",
      statusLabel: "Out for delivery",
      elapsedMinutes: 20,
      amount: 720,
    },
  ],
  paymentSummary: {
    cash: { amount: 48920, percentage: 26.5 },
    card: { amount: 62110, percentage: 33.7 },
    upiWallets: { amount: 61230, percentage: 33.2 },
    other: { amount: 12000, percentage: 6.5 },
    total: 184260,
  },
  tables: [
    { tableNumber: "01", status: "available" },
    { tableNumber: "02", status: "occupied" },
    { tableNumber: "03", status: "available" },
    { tableNumber: "04", status: "reserved" },
    { tableNumber: "05", status: "available" },
    { tableNumber: "06", status: "occupied" },
    { tableNumber: "07", status: "occupied" },
    { tableNumber: "08", status: "reserved" },
    { tableNumber: "09", status: "available" },
    { tableNumber: "10", status: "available" },
    { tableNumber: "11", status: "available" },
    { tableNumber: "12", status: "occupied" },
    { tableNumber: "13", status: "available" },
    { tableNumber: "14", status: "available" },
    { tableNumber: "15", status: "reserved" },
    { tableNumber: "16", status: "occupied" },
    { tableNumber: "17", status: "available" },
    { tableNumber: "18", status: "available" },
  ],
  topSellingItems: [
    {
      id: "item-1",
      name: "Butter Chicken",
      category: "Main Course",
      quantitySold: 32,
      unitLabel: "Plates",
      revenue: 12480,
    },
    {
      id: "item-2",
      name: "Garlic Naan",
      category: "Breads",
      quantitySold: 68,
      unitLabel: "Plates",
      revenue: 8160,
    },
    {
      id: "item-3",
      name: "Cold Coffee",
      category: "Beverages",
      quantitySold: 45,
      unitLabel: "Glasses",
      revenue: 6750,
    },
  ],
  attentionAlerts: [
    {
      id: "alert-1",
      type: "low_stock",
      title: "3 low-stock items",
      count: 3,
      actionText: "Manage stock →",
      actionRoute: "/pos/inventory",
    },
    {
      id: "alert-2",
      type: "delayed_kot",
      title: "2 delayed KOTs",
      count: 2,
      actionText: "View kitchen →",
      actionRoute: "/pos/kot",
    },
    {
      id: "alert-3",
      type: "unsettled_bills",
      title: "4 unsettled bills",
      count: 4,
      actionText: "Review dues →",
      actionRoute: "/pos/settlement",
    },
  ],
  operationalMetrics: [
    {
      avgPrepTimeMinutes: 18,
      successfulOrdersCount: 142,
      complimentaryOrdersCount: 8,
      cancelledOrdersCount: 11,
      exceptionsCount: 3,
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
  const visibleOrderTypes = dto.orderTypes.filter((ot) => ot.type !== "delivery");
  const totalOrderTypesCount = visibleOrderTypes.reduce((acc, curr) => acc + curr.count, 0);

  const stats: PosDashboardStats = {
    totalCollections: dto.stats.totalCollections,
    totalCollectionsFormatted: formatINR(dto.stats.totalCollections),
    totalOrders: totalOrderTypesCount,
    activeTablesCount: dto.stats.activeTablesCount,
    totalTablesCount: dto.stats.totalTablesCount,
    occupancyPercentage: Math.round(
      (dto.stats.activeTablesCount / (dto.stats.totalTablesCount || 1)) * 100,
    ),
    unpaidBillsAmount: dto.stats.unpaidBillsAmount,
    unpaidBillsFormatted: formatINR(dto.stats.unpaidBillsAmount),
    roomChargesAmount: dto.stats.roomChargesAmount,
    roomChargesFormatted: formatINR(dto.stats.roomChargesAmount),
  };

  const salesGraph: HourlySalesPoint[] = dto.salesGraph.map((pt) => ({
    hour: pt.hour,
    todaySales: pt.todaySales,
    yesterdaySales: pt.yesterdaySales,
  }));

  const orderTypes: OrderTypeMixItem[] = visibleOrderTypes.map((ot) => ({
    id: ot.type,
    type: ot.type,
    label: ot.label,
    count: ot.count,
    percentage: totalOrderTypesCount
      ? Math.round((ot.count / totalOrderTypesCount) * 1000) / 10
      : 0,
    color: ot.color,
  }));

  const liveOrders: LiveOrderItem[] = dto.liveOrders.map((lo) => ({
    id: lo.id,
    title: lo.title,
    orderType: lo.orderTypeLabel,
    status: lo.status === "delivered" ? "ready" : (lo.status as any),
    statusLabel: lo.statusLabel,
    elapsedMinutes: lo.elapsedMinutes,
  }));

  const paymentSummary: PaymentSummaryData = {
    cash: {
      amount: dto.paymentSummary.cash.amount,
      formatted: formatINR(dto.paymentSummary.cash.amount),
      percentage: dto.paymentSummary.cash.percentage,
    },
    card: {
      amount: dto.paymentSummary.card.amount,
      formatted: formatINR(dto.paymentSummary.card.amount),
      percentage: dto.paymentSummary.card.percentage,
    },
    upiWallets: {
      amount: dto.paymentSummary.upiWallets.amount,
      formatted: formatINR(dto.paymentSummary.upiWallets.amount),
      percentage: dto.paymentSummary.upiWallets.percentage,
    },
    other: {
      amount: dto.paymentSummary.other.amount,
      formatted: formatINR(dto.paymentSummary.other.amount),
      percentage: dto.paymentSummary.other.percentage,
    },
    totalFormatted: formatINR(dto.paymentSummary.total),
    totalAmount: dto.paymentSummary.total,
  };

  const tables: TableStatusItem[] = dto.tables.map((t) => ({
    tableNumber: t.tableNumber,
    status: t.status,
  }));

  const topSellingItems: TopDishItem[] = dto.topSellingItems.map((item) => ({
    id: item.id,
    name: item.name,
    platesText: `${item.quantitySold} ${item.unitLabel}`,
    revenueFormatted: formatINR(item.revenue),
    imageUrl: item.imageUrl,
  }));

  const attentionAlerts: AttentionItem[] = dto.attentionAlerts.map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    actionText: a.actionText,
    actionRoute: a.actionRoute,
  }));

  const opDto = dto.operationalMetrics[0] || {
    avgPrepTimeMinutes: 0,
    successfulOrdersCount: 0,
    complimentaryOrdersCount: 0,
    cancelledOrdersCount: 0,
  };

  const operations: OperationsSummary = {
    avgPrepTimeMinutes: opDto.avgPrepTimeMinutes,
    successfulCount: opDto.successfulOrdersCount,
    complimentaryCount: opDto.complimentaryOrdersCount,
    cancelledCount: opDto.cancelledOrdersCount,
    discountsCount: opDto.complimentaryOrdersCount,
  };

  return {
    outletName: dto.outletName,
    dateLabel: dto.date,
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

/** Empty dashboard for new HO/Kitchen outlets (no demo numbers). */
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
export function getInitialDashboardData(outletId?: string): PosDashboardData {
  if (isBackendOutletId(outletId)) {
    return mapDtoToDashboardModel(EMPTY_DASHBOARD_API_RESPONSE, false);
  }
  return mapDtoToDashboardModel(MOCK_DASHBOARD_API_RESPONSE, true);
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
