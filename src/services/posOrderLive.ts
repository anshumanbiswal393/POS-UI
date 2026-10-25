import httpClient from "@/utils/httpClient";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { isBackendOutletId } from "@/utils/outletId";
import { formatINR } from "@/services/posDashboardService";
import type {
  LiveOrderSummaryApiDto,
  AllOrdersApiResponse,
  KotApiResponse,
  KotRecordApiDto,
  AllOrderRecordApiDto,
} from "@/types/posOrdersApi";
import type { LiveOrderSummaryData, AllOrdersData, KotData, KotItem } from "@/types/posOrders";

export function orderScope(outletId?: string | null) {
  if (!isBackendOutletId(outletId)) return null;
  return { outlet_id: outletId, outletId };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function asUuid(value?: string | null) {
  return value && UUID_RE.test(value) ? value : undefined;
}

function omitEmpty<T extends Record<string, unknown>>(obj: T): T {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null || value === "") continue;
    next[key] = value;
  }
  return next as T;
}

export type LiveOrderPayload = {
  outletId: string;
  orderType?: string;
  tableId?: string;
  tableNumber?: string;
  section?: string;
  roomNumber?: string;
  roomUnitId?: string;
  reservationId?: string;
  folioId?: string;
  guestName?: string;
  guestPhone?: string;
  waiterName?: string;
  pax?: number;
  orderNote?: string;
  subtotal?: number;
  taxAmount?: number;
  serviceCharge?: number;
  discountAmount?: number;
  grandTotal?: number;
  sendKot?: boolean;
  items: Array<{
    id?: string;
    menuItemId?: string;
    name: string;
    quantity: number;
    price: number;
    selectedVariantName?: string;
    notes?: string;
    code?: string;
    category?: string;
    diet?: string;
    taxRate?: number;
  }>;
};

function kotStatusUi(raw?: string): KotItem["status"] {
  const key = (raw || "").toUpperCase();
  if (key === "READY" || raw === "Prepared") return "Prepared";
  if (key === "SERVED" || raw === "Served") return "Served";
  if (key === "PREPARING" || raw === "In Kitchen") return "In Kitchen";
  if (key === "PENDING" || raw === "Not Prepared") return "Not Prepared";
  if (raw === "In Kitchen" || raw === "Prepared" || raw === "Served" || raw === "Not Prepared") {
    return raw;
  }
  return "In Kitchen";
}

export function mapLiveKotRecord(r: KotRecordApiDto & Record<string, any>): KotItem {
  const status = kotStatusUi(r.statusLabel || r.status);
  return {
    id: String(r.id),
    kotId: Number(r.kotId || 0),
    orderId: r.orderId,
    orderNumber: r.orderNumber,
    orderType: r.orderType,
    customerName: r.customerName || "--",
    customerPhone: r.customerPhone || "--",
    itemCount: Number(r.itemCount || r.items?.length || 0),
    itemsText: r.itemsText || "",
    items: (r.items || []).map((i: any) => ({
      name: i.name,
      quantity: Number(i.quantity || 1),
      notes: i.notes || undefined,
    })),
    status,
    billPrintDate: r.billPrintDate || "",
    completeDuration: r.completeDuration || "",
    createdAt: r.createdAt || "",
    createdTimestamp: r.createdTimestamp || Date.now(),
    readyTimestamp: r.readyTimestamp,
    isModified: Boolean(r.isModified),
  };
}

export function mapSerializedOrderToCurrent(o: Record<string, any>) {
  const typeRaw = String(o.type || o.orderType || "dine_in").toLowerCase();
  const type =
    typeRaw === "takeaway"
      ? "takeaway"
      : typeRaw === "room_service"
        ? "room_service"
        : typeRaw === "delivery"
          ? "delivery"
          : "dine_in";
  const stageRaw = String(o.currentStage || o.status || "placed").toLowerCase();
  const currentStage =
    stageRaw === "prepared" || stageRaw === "settled" ? (stageRaw as "prepared" | "settled") : "placed";
  return {
    id: String(o.id),
    orderNumber: o.orderNumber || o.order_number || "",
    type,
    typeLabel: o.typeLabel || o.source || "Dine In",
    source: o.source || "",
    customerName: o.customerName || "Walk-in Guest",
    customerPhone: o.customerPhone || "--",
    tableOrRoom: o.tableOrRoom || o.tableNumber || o.roomNumber || "",
    tableId: o.tableId || "",
    section: o.section || "",
    waiterName: o.waiterName || "Captain",
    pax: o.pax || 1,
    itemsSummary: o.itemsSummary || "",
    amount: Number(o.grandTotal ?? o.amount ?? 0),
    amountFormatted: formatINR(Number(o.grandTotal ?? o.amount ?? 0)),
    startTime: o.startTime || "",
    createdTimestamp: Number(o.createdTimestamp || Date.now()),
    elapsedMinutes: Number(o.elapsedMinutes || 1),
    estDurationMinutes: Number(o.estDurationMinutes || 35),
    currentStage,
    stageLabel: o.stageLabel || "",
    orderNote: o.orderNote || "",
    subtotal: Number(o.subtotal || 0),
    items: ((o.items || []) as Array<Record<string, any>>).map((i) => ({
      id: i.menuItemId || i.id,
      name: i.name,
      quantity: Number(i.quantity || 1),
      price: Number(i.price || 0),
      selectedVariantName: i.selectedVariantName,
      notes: i.notes,
      code: i.code,
      category: i.category,
      diet: i.diet,
    })),
  };
}

export async function liveGetLiveSummary(outletId?: string): Promise<LiveOrderSummaryData | null> {
  const params = orderScope(outletId);
  if (!params) return null;
  const res = await httpClient.get<LiveOrderSummaryApiDto>(API_ENDPOINTS.ORDERS.LIVE, { params });
  const dto = res.data;
  if (!dto?.runningOrders) {
    return {
      runningOrders: {
        totalOrders: 0,
        totalAmount: 0,
        totalAmountFormatted: formatINR(0),
        dineIn: { count: 0, amountFormatted: formatINR(0) },
        pickUp: { count: 0, amountFormatted: formatINR(0) },
        delivery: { count: 0, amountFormatted: formatINR(0) },
      },
      pendingOrders: {
        totalOrders: 0,
        totalAmount: 0,
        totalAmountFormatted: formatINR(0),
        inPreparation: { count: 0, amountFormatted: formatINR(0) },
        waitingForPickup: { count: 0, amountFormatted: formatINR(0) },
        outForDelivery: { count: 0, amountFormatted: formatINR(0) },
      },
      runningTables: [],
    };
  }
  return {
    runningOrders: {
      totalOrders: dto.runningOrders.totalOrders,
      totalAmount: dto.runningOrders.totalAmount,
      totalAmountFormatted: formatINR(dto.runningOrders.totalAmount),
      dineIn: {
        count: dto.runningOrders.dineIn.count,
        amountFormatted: formatINR(dto.runningOrders.dineIn.amount),
      },
      pickUp: {
        count: dto.runningOrders.pickUp.count,
        amountFormatted: formatINR(dto.runningOrders.pickUp.amount),
      },
      delivery: {
        count: dto.runningOrders.delivery.count,
        amountFormatted: formatINR(dto.runningOrders.delivery.amount),
      },
    },
    pendingOrders: {
      totalOrders: dto.pendingOrders.totalOrders,
      totalAmount: dto.pendingOrders.totalAmount,
      totalAmountFormatted: formatINR(dto.pendingOrders.totalAmount),
      inPreparation: {
        count: dto.pendingOrders.inPreparation.count,
        amountFormatted: formatINR(dto.pendingOrders.inPreparation.amount),
      },
      waitingForPickup: {
        count: dto.pendingOrders.waitingForPickup.count,
        amountFormatted: formatINR(dto.pendingOrders.waitingForPickup.amount),
      },
      outForDelivery: {
        count: dto.pendingOrders.outForDelivery.count,
        amountFormatted: formatINR(dto.pendingOrders.outForDelivery.amount),
      },
    },
    runningTables: (dto.runningTables || []).map((t) => ({
      ...t,
      amountFormatted: formatINR(t.amount),
    })),
  };
}

export async function liveGetCurrent(outletId?: string) {
  const params = orderScope(outletId);
  if (!params) return [];
  const res = await httpClient.get(API_ENDPOINTS.ORDERS.CURRENT, { params });
  const rows = Array.isArray(res.data) ? res.data : res.data?.currentOrders || [];
  return rows.map(mapSerializedOrderToCurrent);
}

export async function liveGetOrder(orderId: string) {
  const res = await httpClient.get(API_ENDPOINTS.ORDERS.BY_ID(orderId));
  return res.data ? mapSerializedOrderToCurrent(res.data) : null;
}

export async function liveGetHistory(outletId?: string, filters?: Record<string, any>): Promise<AllOrdersData> {
  const params = { ...(orderScope(outletId) || {}), ...(filters || {}) };
  const res = await httpClient.get<AllOrdersApiResponse & { orders?: AllOrderRecordApiDto[] }>(
    API_ENDPOINTS.ORDERS.ALL,
    { params },
  );
  const data = res.data || ({} as any);
  const records = (data.records || data.orders || []).map((r: any) => ({
    id: String(r.id),
    orderNo: String(r.orderNo || (r.orderNumber || "").replace("ORD-", "")),
    orderTypeDisplay: r.orderTypeDisplay || r.source || r.typeLabel || "",
    customerName: r.customerName || "Walk-in Guest",
    assignTo: r.assignTo || r.waiterName || "Captain",
    itemsSummary: r.itemsSummary || "",
    myAmountFormatted: formatINR(Number(r.myAmount ?? r.subtotal ?? 0)),
    taxAmountFormatted: formatINR(Number(r.taxAmount ?? 0)),
    discountAmountFormatted: formatINR(Number(r.discountAmount ?? 0)),
    grandTotalFormatted: formatINR(Number(r.grandTotal ?? r.amount ?? 0)),
    paymentMode: r.paymentMode || "Cash",
    status: r.status || "Settled",
    createdAt: r.createdAt || r.placedAt || "",
    isOnlineOrder: Boolean(r.isOnlineOrder),
    isAdvanceOrder: Boolean(r.isAdvanceOrder),
    isSplitBill: Boolean(r.isSplitBill),
    tableNo: r.tableNo || r.tableNumber || r.tableOrRoom || "",
    customerPhone: r.customerPhone || "",
  }));
  const grand = Number(data.grandTotal || 0);
  return {
    grandTotalFormatted: formatINR(grand),
    grandTotalAmount: grand,
    salesTrend: (data.salesTrend || []).map((p: any) => ({
      dateLabel: p.dateLabel,
      amount: p.amount,
      formattedAmount: formatINR(p.amount),
    })),
    records,
    totalCount: Number(data.totalCount ?? data.count ?? records.length),
    page: Number(data.page || 1),
    pageSize: Number(data.pageSize || records.length || 10),
  };
}

export async function liveGetKot(outletId?: string): Promise<KotData> {
  const params = orderScope(outletId);
  if (!params) return { records: [], totalCount: 0 };
  const res = await httpClient.get<KotApiResponse & { kots?: KotRecordApiDto[] }>(API_ENDPOINTS.ORDERS.KOT, {
    params,
  });
  const rows = (res.data?.records || res.data?.kots || []) as any[];
  const records = rows.map(mapLiveKotRecord);
  return { records, totalCount: Number(res.data?.totalCount ?? res.data?.count ?? records.length) };
}

function toOrderWriteBody(payload: Partial<LiveOrderPayload>) {
  const body = omitEmpty({
    ...payload,
    outletId: payload.outletId,
    outlet_id: payload.outletId,
    tableId: asUuid(payload.tableId),
    table_id: asUuid(payload.tableId),
    roomUnitId: asUuid(payload.roomUnitId),
    room_unit_id: asUuid(payload.roomUnitId),
    reservationId: asUuid(payload.reservationId),
    reservation_id: asUuid(payload.reservationId),
    folioId: asUuid(payload.folioId),
    folio_id: asUuid(payload.folioId),
    sendKot: payload.sendKot,
    send_kot: payload.sendKot,
    items: undefined,
  });
  if (payload.items) {
    body.items = payload.items.map((item) =>
      omitEmpty({
        ...item,
        id: item.id,
        menuItemId: asUuid(item.menuItemId || item.id),
      }),
    );
  }
  if (payload.sendKot !== undefined) {
    body.sendKot = payload.sendKot;
    body.send_kot = payload.sendKot;
  }
  return body;
}

export async function liveCreateOrder(payload: LiveOrderPayload) {
  const res = await httpClient.post(API_ENDPOINTS.ORDERS.LIST, toOrderWriteBody(payload));
  return res.data;
}

export async function livePatchOrder(orderId: string, payload: Partial<LiveOrderPayload> & { items?: LiveOrderPayload["items"] }) {
  const res = await httpClient.patch(API_ENDPOINTS.ORDERS.BY_ID(orderId), toOrderWriteBody(payload));
  return res.data;
}

export async function liveGetBillingMenu(outletId: string) {
  const res = await httpClient.get(API_ENDPOINTS.BILLING.MENU, {
    params: { outletId, outlet_id: outletId },
  });
  return (res.data?.items || []) as any[];
}

export async function liveSettleOrder(
  orderId: string,
  body: {
    paymentMode: string;
    tenderedAmount?: number;
    folioId?: string;
    reservationId?: string;
    idempotencyKey?: string;
    payments?: Array<{ mode: string; amount: number; reference?: string }>;
  },
) {
  const res = await httpClient.post(API_ENDPOINTS.ORDERS.SETTLE(orderId), body);
  return res.data;
}

export async function liveAdvanceOrder(orderId: string) {
  const res = await httpClient.post(API_ENDPOINTS.ORDERS.ADVANCE(orderId), {});
  return res.data;
}

export async function liveKotReady(ticketId: string) {
  const res = await httpClient.post(API_ENDPOINTS.ORDERS.KOT_READY(ticketId), {});
  return res.data;
}

export async function liveKotServed(ticketId: string) {
  const res = await httpClient.post(API_ENDPOINTS.ORDERS.KOT_SERVED(ticketId), {});
  return res.data;
}

export async function liveGetDueBills(outletId?: string) {
  const params = orderScope(outletId);
  if (!params) return [];
  const res = await httpClient.get(API_ENDPOINTS.ORDERS.DUE_SETTLEMENT, { params });
  return ((res.data?.bills || []) as any[]).map((b) => ({
    ...b,
    agingBucket: b.agingBucket || (b.daysOverdue > 30 ? "30+" : b.daysOverdue > 15 ? "16-30" : "0-15"),
    status: b.status || "Pending",
  }));
}

export async function liveSettleDue(billId: string, paymentMode: string, paidAmount: number) {
  const res = await httpClient.post(API_ENDPOINTS.ORDERS.DUE_SETTLE(billId), {
    paymentMode,
    paidAmount,
  });
  return res.data;
}
