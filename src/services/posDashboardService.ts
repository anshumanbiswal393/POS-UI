import httpClient from "@/utils/httpClient";
import { liveGetCurrent, liveGetHistory } from "./posOrderLive";
import { posTablesService } from "./posTablesService";
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

  let backendData: PosDashboardApiResponse | null = null;
  try {
    const response = await httpClient.get<PosDashboardApiResponse>("/api/pos/dashboard/", {
      params: filters,
    });
    if (
      response.data &&
      response.data.success &&
      response.data.stats &&
      Array.isArray(response.data.orderTypes)
    ) {
      backendData = response.data;
    }
  } catch (_err) {
    backendData = null;
  }

  // If backend returned complete operational stats including live orders or tables, use it
  if (
    backendData &&
    ((backendData.stats && (backendData.stats.totalOrders > 0 || backendData.stats.activeTablesCount > 0)) ||
      (backendData.liveOrders && backendData.liveOrders.length > 0))
  ) {
    return mapDtoToDashboardModel(backendData, false);
  }

  // Synthesize / augment real-time data from live endpoints
  try {
    const isLive = isBackendOutletId(outletId);
    const [currentOrders, tables, history] = await Promise.all([
      isLive ? liveGetCurrent(outletId) : Promise.resolve([]),
      posTablesService.getTables(),
      isLive ? liveGetHistory(outletId) : Promise.resolve({ records: [] }),
    ]);

    const activeCurrentOrders = currentOrders || [];
    const outletTables = tables || [];
    const historyRecords = (history as any)?.records || [];

    // If we have any active orders or tables, build live model
    if (activeCurrentOrders.length > 0 || outletTables.length > 0 || historyRecords.length > 0) {
      const liveOrders = activeCurrentOrders.map((co) => ({
        id: co.id,
        orderNumber: co.orderNumber,
        title: co.tableOrRoom || co.source || co.orderNumber,
        orderType: (co.type as any) || "dine_in",
        orderTypeLabel: co.typeLabel || "Dine In",
        status: co.currentStage === "placed" ? ("preparing" as const) : ("ready" as const),
        statusLabel: co.stageLabel || (co.currentStage === "placed" ? "Placed (In Kitchen)" : "Prepared"),
        elapsedMinutes: Math.max(1, co.elapsedMinutes || 0),
        amount: co.amount || 0,
      }));

      const tableItems = outletTables.map((t) => ({
        tableNumber: String(t.tableNumberRaw || t.tableNumber).replace(/^Table\s*#?/i, ""),
        status: t.status === "occupied" ? ("occupied" as const) : t.status === "reserved" ? ("reserved" as const) : ("available" as const),
        guests: t.capacity,
        currentOrderAmount: t.activeOrder?.totalAmount || 0,
      }));

      const activeTablesCount = outletTables.filter((t) => t.status === "occupied").length ||
        activeCurrentOrders.filter((co) => co.type === "dine_in").length;
      const totalTablesCount = outletTables.length || activeTablesCount;

      // Calculate total collections from settled orders
      const settledRecords = historyRecords.filter((h: any) =>
        String(h.status || "").toLowerCase().includes("settle")
      );
      const totalCollections = settledRecords.reduce((sum: number, h: any) => {
        const amt = parseFloat(String(h.grandTotalFormatted || h.amount || "0").replace(/[^0-9.]/g, ""));
        return sum + (isNaN(amt) ? 0 : amt);
      }, 0);

      // Unpaid bills from active orders
      const unpaidBillsAmount = activeCurrentOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
      const unpaidBillsCount = activeCurrentOrders.length;
      const totalOrdersCount = activeCurrentOrders.length + settledRecords.length;

      // Order types breakdown
      const allOrders = [...activeCurrentOrders, ...historyRecords];
      const dineCount = allOrders.filter((o: any) =>
        (o.type || o.orderTypeDisplay || "").toLowerCase().includes("dine")
      ).length;
      const takeawayCount = allOrders.filter((o: any) =>
        (o.type || o.orderTypeDisplay || "").toLowerCase().includes("takeaway") ||
        (o.type || "").toLowerCase().includes("pickup")
      ).length;
      const roomServiceCount = allOrders.filter((o: any) =>
        (o.type || o.orderTypeDisplay || "").toLowerCase().includes("room")
      ).length;
      const totalMix = Math.max(1, dineCount + takeawayCount + roomServiceCount);

      const orderTypes = [
        {
          type: "dine_in" as const,
          label: "Dine-in",
          count: dineCount,
          percentage: Math.round((dineCount / totalMix) * 1000) / 10,
          color: "#0f766e",
        },
        {
          type: "takeaway" as const,
          label: "Takeaway",
          count: takeawayCount,
          percentage: Math.round((takeawayCount / totalMix) * 1000) / 10,
          color: "#0d9488",
        },
        {
          type: "room_service" as const,
          label: "Room service",
          count: roomServiceCount,
          percentage: Math.round((roomServiceCount / totalMix) * 1000) / 10,
          color: "#94a3b8",
        },
      ];

      // Top selling dishes from active orders
      const dishCountMap = new Map<string, { count: number; rev: number; cat: string }>();
      activeCurrentOrders.forEach((co) => {
        (co.items || []).forEach((it: any) => {
          const name = it.name || "Item";
          const curr = dishCountMap.get(name) || { count: 0, rev: 0, cat: it.category || "General" };
          curr.count += (it.quantity || 1);
          curr.rev += ((it.quantity || 1) * (it.price || 0));
          dishCountMap.set(name, curr);
        });
      });

      const topSellingItems = Array.from(dishCountMap.entries()).map(([name, val]) => ({
        id: name,
        name,
        category: val.cat,
        quantitySold: val.count,
        unitLabel: "Plates",
        revenue: val.rev,
      }));

      // Attention alerts
      const attentionAlerts = [];
      if (unpaidBillsCount > 0) {
        attentionAlerts.push({
          id: "unsettled_bills",
          type: "unsettled_bills" as const,
          title: `${unpaidBillsCount} Unsettled Bills`,
          count: unpaidBillsCount,
          actionText: "Review dues",
          actionRoute: "/pos/settlement",
        });
      }

      const synthesizedDto: PosDashboardApiResponse = {
        success: true,
        outletId: outletId || "",
        outletName: "",
        date: "Today",
        currency: "INR",
        stats: {
          totalCollections,
          totalOrders: Math.max(totalOrdersCount, activeCurrentOrders.length),
          activeTablesCount,
          totalTablesCount,
          unpaidBillsAmount,
          unpaidBillsCount,
          roomChargesAmount: 0,
          roomChargesCount: 0,
        },
        salesGraph: [
          { hour: "12 AM", todaySales: 0, yesterdaySales: 0 },
          { hour: "4 AM", todaySales: 0, yesterdaySales: 0 },
          { hour: "8 AM", todaySales: 0, yesterdaySales: 0 },
          { hour: "12 PM", todaySales: 0, yesterdaySales: 0 },
          { hour: "4 PM", todaySales: totalCollections, yesterdaySales: 0 },
          { hour: "8 PM", todaySales: 0, yesterdaySales: 0 },
        ],
        orderTypes,
        liveOrders,
        paymentSummary: {
          cash: { amount: 0, percentage: 0 },
          card: { amount: 0, percentage: 0 },
          upiWallets: { amount: 0, percentage: 0 },
          other: { amount: 0, percentage: 0 },
          total: totalCollections,
        },
        tables: tableItems,
        topSellingItems,
        attentionAlerts,
        operationalMetrics: [
          {
            avgPrepTimeMinutes: 15,
            successfulOrdersCount: settledRecords.length,
            complimentaryOrdersCount: 0,
            cancelledOrdersCount: 0,
            exceptionsCount: 0,
          },
        ],
      };

      return mapDtoToDashboardModel(synthesizedDto, false);
    }
  } catch (err) {
    console.warn("Could not synthesize live dashboard metrics:", err);
  }

  if (backendData) {
    return mapDtoToDashboardModel(backendData, false);
  }

  return getInitialDashboardData(outletId);
}
