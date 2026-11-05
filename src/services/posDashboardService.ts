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
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

/**
 * Empty dashboard fallback for initialization
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
    totalOrders: dto.stats?.totalOrders ?? totalOrderTypesCount ?? 0,
    activeTablesCount: dto.stats?.activeTablesCount || 0,
    totalTablesCount: dto.stats?.totalTablesCount || 0,
    occupancyPercentage: Math.round(
      ((dto.stats?.activeTablesCount || 0) / Math.max(1, dto.stats?.totalTablesCount || 1)) * 100,
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
 * Returns synchronous initial dashboard data for SSR and initial states
 */
export function getInitialDashboardData(_outletId?: string): PosDashboardData {
  return mapDtoToDashboardModel(EMPTY_DASHBOARD_API_RESPONSE, false);
}

/**
 * Service to fetch POS Dashboard data from backend or fallback to live order/table store
 * Optimized with concurrent parallel fetching and strict timeouts to prevent dashboard lag.
 */
export async function getPosDashboardData(
  filters?: DashboardFilterParams,
): Promise<PosDashboardData> {
  const effectiveOutletId =
    filters?.outletId ||
    (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null) ||
    "";
  if (typeof window === "undefined") {
    return getInitialDashboardData(effectiveOutletId);
  }

  const isLive = isBackendOutletId(effectiveOutletId);
  const targetDate = filters?.startDate || filters?.dateRange || "today";

  // Execute queries in parallel with a fast 2500ms timeout for the monolithic dashboard endpoint
  const dashboardPromise = isLive
    ? httpClient
        .get<PosDashboardApiResponse>("/api/pos/dashboard/", {
          params: { ...filters, outletId: effectiveOutletId },
          timeout: 2500,
        })
        .then((res) => (res.data?.success ? res.data : null))
        .catch(() => null)
    : Promise.resolve(null);

  const currentOrdersPromise = isLive
    ? liveGetCurrent(effectiveOutletId).catch(() => [])
    : Promise.resolve([]);

  const tablesPromise = posTablesService
    .getTables(undefined, effectiveOutletId)
    .catch(() => []);

  const historyPromise = isLive
    ? liveGetHistory(effectiveOutletId, {
        start_date: targetDate !== "today" ? targetDate : undefined,
        end_date: targetDate !== "today" ? targetDate : undefined,
      }).catch(() => ({ records: [], orders: [] } as any))
    : Promise.resolve({ records: [], orders: [] } as any);

  // Concurrently fetch all data sources
  const [backendData, currentOrders, tables, history] = await Promise.all([
    dashboardPromise,
    currentOrdersPromise,
    tablesPromise,
    historyPromise,
  ]);

  // If backend returned complete operational stats including valid live orders or tables, use it
  if (
    backendData &&
    backendData.stats &&
    ((backendData.stats.totalOrders > 0 || backendData.stats.activeTablesCount > 0) ||
      (backendData.liveOrders && backendData.liveOrders.length > 0))
  ) {
    return mapDtoToDashboardModel(backendData, false);
  }

  // Synthesize / augment real-time data from live endpoints
  try {
    const rawCurrentOrders = currentOrders || [];
    const outletTables = tables || [];
    const historyRecords = (history as any)?.records || (history as any)?.orders || [];

    // Filter active orders (in kitchen or placed, not settled)
    const activeCurrentOrders = rawCurrentOrders.filter(
      (co: any) => !co.isSettled && String(co.currentStage || "").toLowerCase() !== "settled",
    );

    // Filter settled orders from history
    const settledRecords = historyRecords.filter((h: any) => {
      const st = String(h.status || "").toUpperCase();
      return st === "SETTLED" || st.includes("SETTLE");
    });

    // Filter cancelled orders from history
    const cancelledRecords = historyRecords.filter((h: any) => {
      const st = String(h.status || "").toUpperCase();
      return st === "CANCELLED" || st.includes("CANCEL");
    });

    // Date filtering: ensure today's collections match today's date
    const isOrderOnTargetDate = (item: any): boolean => {
      if (!targetDate || targetDate === "today") {
        const dateRaw = item.settledAt || item.placedAt || item.createdAt;
        if (!dateRaw) return true;
        try {
          const d = new Date(dateRaw);
          if (isNaN(d.getTime())) return true;
          const now = new Date();
          return (
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate()
          );
        } catch {
          return true;
        }
      }
      const dateRaw = String(item.settledAt || item.placedAt || item.createdAt || "");
      return dateRaw.includes(targetDate);
    };

    const dateFilteredSettled = settledRecords.filter(isOrderOnTargetDate);
    const operationalSettled = dateFilteredSettled.length > 0 ? dateFilteredSettled : settledRecords;

    // Total collections strictly from settled orders
    const totalCollections = operationalSettled.reduce((sum: number, h: any) => {
      const amt =
        Number(h.grandTotal ?? h.amount ?? 0) ||
        parseFloat(String(h.grandTotalFormatted || h.amount || "0").replace(/[^0-9.]/g, "")) ||
        0;
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    // Accurate payment summary breakdown
    let cashSum = 0;
    let cardSum = 0;
    let upiSum = 0;
    let otherSum = 0;

    operationalSettled.forEach((h: any) => {
      const amt =
        Number(h.grandTotal ?? h.amount ?? 0) ||
        parseFloat(String(h.grandTotalFormatted || h.amount || "0").replace(/[^0-9.]/g, "")) ||
        0;
      if (isNaN(amt) || amt <= 0) return;

      const mode = String(h.paymentMode || h.payment_mode || h.paymentMethod || "").trim().toLowerCase();

      if (mode.includes("cash")) {
        cashSum += amt;
      } else if (
        mode.includes("card") ||
        mode.includes("credit") ||
        mode.includes("debit") ||
        mode.includes("pos")
      ) {
        cardSum += amt;
      } else if (
        mode.includes("upi") ||
        mode.includes("wallet") ||
        mode.includes("gpay") ||
        mode.includes("phonepe") ||
        mode.includes("paytm") ||
        mode.includes("online") ||
        mode.includes("qr")
      ) {
        upiSum += amt;
      } else {
        otherSum += amt;
      }
    });

    // Guard: If totalCollections > 0 but modes didn't match any specific bucket, allocate properly
    const allocatedSum = cashSum + cardSum + upiSum + otherSum;
    if (totalCollections > 0 && allocatedSum < totalCollections) {
      const unallocated = totalCollections - allocatedSum;
      if (allocatedSum === 0) {
        cashSum = totalCollections; // Standard POS default to Cash tender
      } else {
        otherSum += unallocated;
      }
    }

    const cashPct = totalCollections > 0 ? Math.round((cashSum / totalCollections) * 1000) / 10 : 0;
    const cardPct = totalCollections > 0 ? Math.round((cardSum / totalCollections) * 1000) / 10 : 0;
    const upiPct = totalCollections > 0 ? Math.round((upiSum / totalCollections) * 1000) / 10 : 0;
    const otherPct =
      totalCollections > 0
        ? Math.max(0, Math.round((100 - (cashPct + cardPct + upiPct)) * 10) / 10)
        : 0;

    const paymentSummary: PaymentSummaryData = {
      cash: { amount: cashSum, formatted: formatINR(cashSum), percentage: cashPct },
      card: { amount: cardSum, formatted: formatINR(cardSum), percentage: cardPct },
      upiWallets: { amount: upiSum, formatted: formatINR(upiSum), percentage: upiPct },
      other: { amount: otherSum, formatted: formatINR(otherSum), percentage: otherPct },
      totalAmount: totalCollections,
      totalFormatted: formatINR(totalCollections),
    };

    // Unpaid bills from active orders
    const unpaidBillsAmount = activeCurrentOrders.reduce((sum: number, o: any) => {
      const amt =
        Number(o.amount ?? o.grandTotal ?? 0) ||
        parseFloat(String(o.amountFormatted || "0").replace(/[^0-9.]/g, "")) ||
        0;
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);
    const unpaidBillsCount = activeCurrentOrders.length;

    // Total orders count = active orders + settled orders for today
    const totalOrdersCount = activeCurrentOrders.length + operationalSettled.length;

    // Order types distribution (including active and settled)
    const allOrdersForMix = [...activeCurrentOrders, ...operationalSettled];
    let dineCount = 0;
    let takeawayCount = 0;
    let roomServiceCount = 0;

    allOrdersForMix.forEach((o: any) => {
      const typeStr = String(
        o.type || o.orderType || o.order_type || o.orderTypeDisplay || o.source || "",
      ).toLowerCase();
      if (typeStr.includes("takeaway") || typeStr.includes("pickup") || typeStr.includes("parcel")) {
        takeawayCount++;
      } else if (typeStr.includes("room")) {
        roomServiceCount++;
      } else {
        dineCount++;
      }
    });

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

    // Live orders list for widget
    const liveOrders = activeCurrentOrders.map((co: any) => ({
      id: co.id,
      orderNumber: co.orderNumber,
      title: co.tableOrRoom || co.source || co.orderNumber,
      orderType: (co.type as any) || "dine_in",
      orderTypeLabel: co.typeLabel || "Dine In",
      status: co.currentStage === "placed" ? ("preparing" as const) : ("ready" as const),
      statusLabel:
        co.stageLabel || (co.currentStage === "placed" ? "Placed (In Kitchen)" : "Prepared"),
      elapsedMinutes: Math.max(1, Number(co.elapsedMinutes || 0)),
      amount: Number(co.amount || 0),
    }));

    // Dynamic Average Preparation Time calculation
    const prepDurations: number[] = [];

    activeCurrentOrders.forEach((o: any) => {
      const elapsed = Number(o.elapsedMinutes || 0);
      if (elapsed > 0) {
        prepDurations.push(elapsed);
      } else if (o.createdTimestamp) {
        const diff = Math.max(1, Math.round((Date.now() - o.createdTimestamp) / 60000));
        prepDurations.push(diff);
      }
    });

    operationalSettled.forEach((h: any) => {
      if (h.preparedAt && h.placedAt) {
        const diff = Math.round(
          (new Date(h.preparedAt).getTime() - new Date(h.placedAt).getTime()) / 60000,
        );
        if (diff > 0 && diff < 1440) prepDurations.push(diff);
      } else if (h.settledAt && h.placedAt) {
        const diff = Math.round(
          (new Date(h.settledAt).getTime() - new Date(h.placedAt).getTime()) / 60000,
        );
        if (diff > 0 && diff < 1440) prepDurations.push(diff);
      } else if (h.elapsedMinutes && Number(h.elapsedMinutes) > 0) {
        prepDurations.push(Number(h.elapsedMinutes));
      }
    });

    const avgPrepTimeMinutes =
      prepDurations.length > 0
        ? Math.round(prepDurations.reduce((sum, d) => sum + d, 0) / prepDurations.length)
        : 0;

    // Top selling items aggregated from active and settled orders
    const dishCountMap = new Map<string, { count: number; rev: number; cat: string }>();

    const recordDishItem = (it: any) => {
      const name = it.name || it.item_name || it.dishName || "Item";
      const curr = dishCountMap.get(name) || {
        count: 0,
        rev: 0,
        cat: it.category || it.category_name || "General",
      };
      const qty = Number(it.quantity || it.qty || 1);
      const price = Number(it.price || it.rate || (it.line_total ? it.line_total / qty : 0) || 0);
      curr.count += qty;
      curr.rev += it.line_total ? Number(it.line_total) : qty * price;
      dishCountMap.set(name, curr);
    };

    activeCurrentOrders.forEach((co: any) => {
      (co.items || []).forEach(recordDishItem);
    });

    operationalSettled.forEach((rec: any) => {
      if (Array.isArray(rec.items) && rec.items.length > 0) {
        rec.items.forEach(recordDishItem);
      } else if (rec.itemsSummary) {
        const parts = String(rec.itemsSummary).split(",");
        parts.forEach((p) => {
          const match = p.trim().match(/^(.+?)\s*(?:\(.*?\))?\s*x\s*(\d+)/i);
          if (match) {
            const dishName = match[1].trim();
            const qty = parseInt(match[2], 10) || 1;
            const curr = dishCountMap.get(dishName) || {
              count: 0,
              rev: 0,
              cat: "General",
            };
            curr.count += qty;
            dishCountMap.set(dishName, curr);
          }
        });
      }
    });

    const topSellingItems = Array.from(dishCountMap.entries())
      .map(([name, val]) => ({
        id: name,
        name,
        category: val.cat,
        quantitySold: val.count,
        unitLabel: "Plates",
        revenue: val.rev,
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    // Tables status and occupancy synchronized with live orders
    const tableItems = outletTables.map((t: any) => {
      let status: "occupied" | "reserved" | "available" =
        t.status === "occupied"
          ? "occupied"
          : t.status === "reserved"
            ? "reserved"
            : "available";

      if (status === "available") {
        const hasOrder = activeCurrentOrders.some((co: any) => {
          if (co.tableId && String(co.tableId) === String(t.id)) return true;
          const tNum = String(t.tableNumberRaw || t.tableNumber).replace(/\D/g, "");
          const coNum = String(co.tableOrRoom || co.tableNumber || "").replace(/\D/g, "");
          return tNum && coNum && tNum === coNum;
        });
        if (hasOrder) status = "occupied";
      }

      return {
        tableNumber: String(t.tableNumberRaw || t.tableNumber).replace(/^Table\s*#?/i, ""),
        status,
        guests: t.capacity,
        currentOrderAmount: t.activeOrder?.totalAmount || 0,
      };
    });

    const occupiedTablesCount = tableItems.filter((t) => t.status === "occupied").length;
    const activeTablesCount =
      occupiedTablesCount || activeCurrentOrders.filter((co: any) => co.type === "dine_in").length;
    const totalTablesCount = outletTables.length;

    // Attention alerts
    const attentionAlerts: AttentionItem[] = [];
    if (unpaidBillsCount > 0) {
      attentionAlerts.push({
        id: "unsettled_bills",
        type: "unsettled_bills",
        title: `${unpaidBillsCount} Unsettled Bills`,
        actionText: "Review dues",
        actionRoute: "/pos/settlement",
      });
    }

    const delayedOrders = liveOrders.filter((lo: any) => (lo.elapsedMinutes || 0) >= 30);
    if (delayedOrders.length > 0) {
      attentionAlerts.push({
        id: "delayed_kot",
        type: "delayed_kot",
        title: `${delayedOrders.length} Delayed Orders (>30m)`,
        actionText: "View Kitchen",
        actionRoute: "/pos/orders",
      });
    }

    const synthesizedDto: PosDashboardApiResponse = {
      success: true,
      outletId: effectiveOutletId || "",
      outletName: "",
      date: targetDate === "today" ? "Today" : targetDate,
      currency: "INR",
      stats: {
        totalCollections,
        totalOrders: Math.max(totalOrdersCount, totalMix),
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
        cash: { amount: paymentSummary.cash.amount, percentage: paymentSummary.cash.percentage },
        card: { amount: paymentSummary.card.amount, percentage: paymentSummary.card.percentage },
        upiWallets: {
          amount: paymentSummary.upiWallets.amount,
          percentage: paymentSummary.upiWallets.percentage,
        },
        other: {
          amount: paymentSummary.other.amount,
          percentage: paymentSummary.other.percentage,
        },
        total: totalCollections,
      },
      tables: tableItems,
      topSellingItems,
      attentionAlerts: attentionAlerts.map((a, i) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        count: i + 1,
        actionText: a.actionText,
        actionRoute: a.actionRoute,
      })),
      operationalMetrics: [
        {
          avgPrepTimeMinutes,
          successfulOrdersCount: operationalSettled.length,
          complimentaryOrdersCount: 0,
          cancelledOrdersCount: cancelledRecords.length,
          exceptionsCount: 0,
        },
      ],
    };

    return mapDtoToDashboardModel(synthesizedDto, false);
  } catch (err) {
    console.warn("Could not synthesize live dashboard metrics:", err);
  }

  if (backendData) {
    return mapDtoToDashboardModel(backendData, false);
  }

  return getInitialDashboardData(outletId);
}
