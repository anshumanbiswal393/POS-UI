import httpClient from "@/utils/httpClient";
import { formatINR } from "./posDashboardService";
import { isBackendOutletId } from "@/utils/outletId";
import {
  liveGetLiveSummary,
  liveGetCurrent,
  liveGetHistory,
  liveGetKot,
  liveGetDueBills,
  liveAdvanceOrder,
  liveKotReady,
  liveKotServed,
  liveSettleDue,
  liveSettleOrder,
} from "./posOrderLive";
import type {
  LiveOrderSummaryApiDto,
  AllOrdersApiResponse,
  OnlineOrdersApiResponse,
  KotApiResponse,
  OnlineOrderRecordApiDto,
  AllOrderRecordApiDto,
} from "@/types/posOrdersApi";
import type {
  LiveOrderSummaryData,
  AllOrdersData,
  OnlineOrdersData,
  KotData,
} from "@/types/posOrders";

// ==========================================
// 1. LIVE ORDERS MOCK & SERVICE
// ==========================================
let liveOrdersStore: LiveOrderSummaryApiDto = {
  runningOrders: {
    totalOrders: 0,
    totalAmount: 0.0,
    dineIn: { count: 0, amount: 0.0 },
    pickUp: { count: 0, amount: 0.0 },
    delivery: { count: 0, amount: 0.0 },
  },
  pendingOrders: {
    totalOrders: 0,
    totalAmount: 0.0,
    inPreparation: { count: 0, amount: 0.0 },
    waitingForPickup: { count: 0, amount: 0.0 },
    outForDelivery: { count: 0, amount: 0.0 },
  },
  runningTables: [],
};

export function mapLiveOrdersDto(dto: LiveOrderSummaryApiDto): LiveOrderSummaryData {
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
    runningTables: dto.runningTables.map((t) => ({
      ...t,
      amountFormatted: formatINR(t.amount),
    })),
  };
}

export function getInitialLiveOrdersData(): LiveOrderSummaryData {
  return mapLiveOrdersDto(liveOrdersStore);
}

export async function getLiveOrdersSummary(outletId?: string): Promise<LiveOrderSummaryData> {
  if (isBackendOutletId(outletId)) {
    const live = await liveGetLiveSummary(outletId);
    if (live) return live;
    throw new Error("Could not load live orders from the database");
  }
  return getInitialLiveOrdersData();
}

// ==========================================
// 2. ALL ORDERS MOCK & SERVICE
// ==========================================
let allOrdersStore: AllOrdersApiResponse = {
  success: true,
  grandTotal: 0.0,
  salesTrend: [],
  totalCount: 0,
  page: 1,
  pageSize: 10,
  records: [],
};

export function mapAllOrdersDto(dto: AllOrdersApiResponse): AllOrdersData {
  return {
    grandTotalAmount: dto.grandTotal,
    grandTotalFormatted: formatINR(dto.grandTotal),
    salesTrend: dto.salesTrend.map((st) => ({
      dateLabel: st.dateLabel,
      amount: st.amount,
      formattedAmount: formatINR(st.amount),
    })),
    records: dto.records.map((r) => ({
      ...r,
      myAmountFormatted: formatINR(r.myAmount),
      taxAmountFormatted: formatINR(r.taxAmount),
      discountAmountFormatted: r.discountAmount > 0 ? `(${formatINR(r.discountAmount)})` : "(0.00)",
      grandTotalFormatted: formatINR(r.grandTotal),
    })),
    totalCount: dto.totalCount,
    page: dto.page,
    pageSize: dto.pageSize,
  };
}

export function getInitialAllOrdersData(): AllOrdersData {
  return mapAllOrdersDto(allOrdersStore);
}

export async function getAllOrders(filters?: Record<string, any>, outletId?: string): Promise<AllOrdersData> {
  if (isBackendOutletId(outletId)) {
    return liveGetHistory(outletId, filters);
  }
  if (typeof window === "undefined") return getInitialAllOrdersData();
  try {
    const res = await httpClient.get<AllOrdersApiResponse>("/api/pos/orders/all", {
      params: filters,
    });
    if (res.data && res.data.success && res.data.records) return mapAllOrdersDto(res.data);
    return getInitialAllOrdersData();
  } catch {
    return getInitialAllOrdersData();
  }
}

// ==========================================
// 3. ONLINE ORDERS MOCK & SERVICE
// ==========================================
let onlineOrdersStore: OnlineOrdersApiResponse = {
  success: true,
  totalCount: 0,
  records: [],
};

export function mapOnlineOrdersDto(dto: OnlineOrdersApiResponse): OnlineOrdersData {
  return {
    totalCount: dto.totalCount,
    records: dto.records.map((r) => ({
      id: r.id,
      orderNo: r.orderNo,
      platform: r.platform,
      outletName: r.outletName,
      orderType: r.orderType,
      riderDetails: r.riderName ? `${r.riderName} (${r.riderPhone})` : "Assigning rider...",
      customerName: r.customerName,
      customerPhone: r.customerPhone,
      otp: r.otp,
      dateTime: r.dateTime,
      totalAmountFormatted: formatINR(r.totalAmount),
      status: r.status,
      statusDisplay: r.statusDisplay,
      items: r.items.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        priceFormatted: formatINR(it.price),
      })),
    })),
  };
}

export function getInitialOnlineOrdersData(): OnlineOrdersData {
  return mapOnlineOrdersDto(onlineOrdersStore);
}

export async function getOnlineOrders(filters?: Record<string, any>): Promise<OnlineOrdersData> {
  if (typeof window === "undefined") return getInitialOnlineOrdersData();
  try {
    const res = await httpClient.get<OnlineOrdersApiResponse>("/api/pos/orders/online", {
      params: filters,
    });
    if (res.data && res.data.success) return mapOnlineOrdersDto(res.data);
    return mapOnlineOrdersDto(onlineOrdersStore);
  } catch {
    return mapOnlineOrdersDto(onlineOrdersStore);
  }
}

/**
 * Accept Online Order:
 * Transitions status to "in_kitchen", pushes KOT to Kitchen queue, and tracks in live orders.
 */
export function acceptOnlineOrderToKitchen(orderId: string): { kotId: number; order: OnlineOrderRecordApiDto | null } {
  let targetOrder: OnlineOrderRecordApiDto | null = null;
  onlineOrdersStore = {
    ...onlineOrdersStore,
    records: onlineOrdersStore.records.map((ord) => {
      if (ord.id === orderId) {
        targetOrder = {
          ...ord,
          status: "in_kitchen" as const,
          statusDisplay: "In Kitchen (Prep)",
        };
        return targetOrder;
      }
      return ord;
    }),
  };

  if (!targetOrder) {
    targetOrder = onlineOrdersStore.records.find((o) => o.id === orderId) || null;
  }

  const kotId = kotCounter++;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const fullDateTime = `${dateStr} ${now.toLocaleTimeString()}`;

  const totalItemsCount = targetOrder
    ? (targetOrder as OnlineOrderRecordApiDto).items.reduce(
        (acc: number, it: { quantity: number }) => acc + it.quantity,
        0,
      )
    : 1;
  const itemsText = targetOrder
    ? (targetOrder as OnlineOrderRecordApiDto).items
        .map((it: { name: string; quantity: number }) => `${it.name} × ${it.quantity}`)
        .join(", ")
    : "Dishes";

  // Push new KOT ticket to kitchen (Preparing)
  const newKotRecord = {
    id: `kot-${kotId}`,
    kotId,
    orderType: targetOrder
      ? `${targetOrder.orderType} [${targetOrder.platform.toUpperCase()} #${targetOrder.orderNo}]`
      : `Online Delivery (KOT #${kotId})`,
    customerName: targetOrder?.customerName || "Online Guest",
    customerPhone: targetOrder?.customerPhone || "--",
    itemCount: totalItemsCount,
    itemsText,
    items: targetOrder
      ? (targetOrder as OnlineOrderRecordApiDto).items.map((it) => ({
          name: it.name,
          quantity: it.quantity,
        }))
      : undefined,
    status: "Not Prepared" as const,
    billPrintDate: null,
    completeDuration: null,
    createdAt: fullDateTime,
    createdTimestamp: now.getTime(),
  };

  kotOrdersStore = {
    ...kotOrdersStore,
    totalCount: kotOrdersStore.totalCount + 1,
    records: [newKotRecord, ...kotOrdersStore.records],
  };

  return { kotId, order: targetOrder };
}

/**
 * Cancel Online Order
 */
export function cancelOnlineOrder(orderId: string): { success: boolean; orderId: string } {
  onlineOrdersStore = {
    ...onlineOrdersStore,
    records: onlineOrdersStore.records.map((ord) => {
      if (ord.id === orderId) {
        return {
          ...ord,
          status: "cancelled" as const,
          statusDisplay: "Cancelled / Rejected",
        };
      }
      return ord;
    }),
  };
  return { success: true, orderId };
}

/**
 * Dispatch a new simulated or incoming online order event
 */
export function dispatchNewOnlineOrder(customOrder?: Partial<OnlineOrderRecordApiDto>): OnlineOrderRecordApiDto {
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const platforms: Array<"zomato" | "swiggy" | "direct_web"> = ["zomato", "swiggy", "direct_web"];
  const platform = customOrder?.platform || platforms[Math.floor(Math.random() * platforms.length)];
  const prefix = platform === "zomato" ? "ZOM" : platform === "swiggy" ? "SWIG" : "WEB";
  const orderNo = customOrder?.orderNo || `${prefix}-${randNum}`;

  const newOrder: OnlineOrderRecordApiDto = {
    id: `on-${Date.now()}`,
    orderNo,
    platform,
    outletName: "Main Restaurant",
    orderType: platform === "zomato" ? "Zomato Delivery" : platform === "swiggy" ? "Swiggy Delivery" : "Direct Order",
    riderName: platform !== "direct_web" ? "Delivery Partner Assigned" : undefined,
    riderPhone: platform !== "direct_web" ? "+91 98000 11222" : undefined,
    customerName: customOrder?.customerName || (platform === "zomato" ? "Aditi Roy" : "Vikram Singhania"),
    customerPhone: customOrder?.customerPhone || "+91 98223 99881",
    otp: `${Math.floor(1000 + Math.random() * 9000)}`,
    dateTime: "Just now",
    totalAmount: customOrder?.totalAmount || 840.0,
    status: "placed",
    statusDisplay: "New Order (Pending Accept)",
    placedMinutesAgo: 0,
    items: customOrder?.items || [
      { name: "Butter Chicken", quantity: 1, price: 420 },
      { name: "Garlic Naan", quantity: 3, price: 210 },
      { name: "Gulab Jamun (2 pcs)", quantity: 2, price: 210 },
    ],
  };

  onlineOrdersStore = {
    ...onlineOrdersStore,
    totalCount: onlineOrdersStore.totalCount + 1,
    records: [newOrder, ...onlineOrdersStore.records],
  };

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("retrod_pos_new_online_order", { detail: newOrder }));
  }

  return newOrder;
}

// ==========================================
// 4. KOT (KITCHEN ORDER TICKETS) MOCK & SERVICE
// ==========================================
const _seedNow = Date.now();
let kotOrdersStore: KotApiResponse = {
  success: true,
  totalCount: 0,
  records: [],
};

export function mapKotDto(dto: KotApiResponse): KotData {
  return {
    totalCount: dto.totalCount,
    records: dto.records.map((r, index) => ({
      id: r.id,
      kotId: r.kotId,
      orderType: r.orderType,
      customerName: r.customerName || "--",
      customerPhone: r.customerPhone || "--",
      itemCount: r.itemCount,
      itemsText: r.itemsText,
      items: r.items,
      status: r.status,
      billPrintDate: r.billPrintDate || "--",
      completeDuration: r.completeDuration || "--",
      createdAt: r.createdAt,
      // Prefer real timestamp; fall back so seeded tickets still show live timers
      createdTimestamp: r.createdTimestamp ?? Date.now() - (index + 1) * 3 * 60_000,
      readyTimestamp: r.readyTimestamp,
      isModified: r.isModified,
    })),
  };
}

export function getInitialKotData(): KotData {
  return mapKotDto(kotOrdersStore);
}

export async function getKotOrders(filters?: Record<string, any>, outletId?: string): Promise<KotData> {
  if (isBackendOutletId(outletId)) {
    return liveGetKot(outletId);
  }
  if (typeof window === "undefined") return getInitialKotData();
  try {
    const res = await httpClient.get<KotApiResponse>("/api/pos/kot", { params: filters });
    if (res.data && res.data.success && res.data.records) return mapKotDto(res.data);
    return getInitialKotData();
  } catch {
    return getInitialKotData();
  }
}

// ==========================================
// 5. HELPER: CREATE DINE-IN ORDER & KOT (SYNC TO LIVE ORDERS & KOT)
// ==========================================
let kotCounter = 16;
let orderCounter = 10526;

/** Line items kept so Edit → Billing can reload the check */
export interface CurrentOrderLineItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  selectedVariantName?: string;
  notes?: string;
  code?: string;
  category?: string;
  diet?: "veg" | "non_veg" | "egg" | "drinks";
}

/** Current Orders (Gantt) open-check store — removed on payment → Order History */
export interface CurrentOrderRecord {
  id: string;
  orderNumber: string;
  type: "dine_in" | "pickup" | "delivery" | "takeaway" | "room_service";
  typeLabel: string;
  source: string;
  customerName: string;
  customerPhone?: string;
  tableOrRoom?: string;
  tableId: string;
  section?: string;
  waiterName?: string;
  pax?: number;
  itemsSummary: string;
  amount: number;
  amountFormatted: string;
  startTime: string;
  createdTimestamp: number;
  elapsedMinutes: number;
  estDurationMinutes: number;
  currentStage: "placed" | "prepared" | "settled";
  stageLabel: string;
  items: CurrentOrderLineItem[];
  orderNote?: string;
  subtotal: number;
  isSettled?: boolean;
  held?: boolean;
  heldCart?: unknown;
  roomNumber?: string;
  folioId?: string;
  reservationId?: string;
  roomUnitId?: string;
}

let currentOrdersStore: CurrentOrderRecord[] = [];

export async function getCurrentOrdersTimeline(outletId?: string): Promise<CurrentOrderRecord[]> {
  if (isBackendOutletId(outletId)) {
    return liveGetCurrent(outletId);
  }
  const now = Date.now();
  return currentOrdersStore.map((o) => ({
    ...o,
    elapsedMinutes: Math.max(1, Math.floor((now - o.createdTimestamp) / 60_000)),
    amountFormatted: formatINR(o.amount),
  }));
}

export function getCurrentOrderByNumber(orderNumber: string): CurrentOrderRecord | null {
  const bare = orderNumber.replace(/^ORD-/i, "");
  const found = currentOrdersStore.find(
    (o) => o.orderNumber === orderNumber || o.orderNumber === `ORD-${bare}` || o.orderNumber.endsWith(bare),
  );
  return found ? { ...found, items: found.items.map((i) => ({ ...i })) } : null;
}

export async function advanceCurrentOrderById(orderId: string) {
  if (isBackendOutletId(orderId) || /^[0-9a-f-]{36}$/i.test(orderId)) {
    return liveAdvanceOrder(orderId);
  }
  return advanceCurrentOrderStage(orderId);
}

export function advanceCurrentOrderStage(orderNumber: string): CurrentOrderRecord | null {
  let updated: CurrentOrderRecord | null = null;
  currentOrdersStore = currentOrdersStore.map((o) => {
    if (o.orderNumber !== orderNumber && !o.orderNumber.endsWith(orderNumber.replace(/^ORD-/i, ""))) {
      return o;
    }
    if (o.currentStage === "placed") {
      updated = {
        ...o,
        currentStage: "prepared",
        stageLabel: "Prepared by Chef",
      };
      return updated;
    }
    return o;
  });
  return updated;
}

function removeCurrentOrderFromLive(orderNumber: string, amount: number) {
  const bare = orderNumber.replace(/^ORD-/i, "");
  currentOrdersStore = currentOrdersStore.filter(
    (o) => o.orderNumber !== orderNumber && !o.orderNumber.endsWith(bare),
  );
  liveOrdersStore = {
    ...liveOrdersStore,
    runningOrders: {
      ...liveOrdersStore.runningOrders,
      totalOrders: Math.max(0, liveOrdersStore.runningOrders.totalOrders - 1),
      totalAmount: Math.max(0, liveOrdersStore.runningOrders.totalAmount - amount),
      dineIn: {
        count: Math.max(0, liveOrdersStore.runningOrders.dineIn.count - 1),
        amount: Math.max(0, liveOrdersStore.runningOrders.dineIn.amount - amount),
      },
    },
    pendingOrders: {
      ...liveOrdersStore.pendingOrders,
      totalOrders: Math.max(0, liveOrdersStore.pendingOrders.totalOrders - 1),
      totalAmount: Math.max(0, liveOrdersStore.pendingOrders.totalAmount - amount),
      inPreparation: {
        count: Math.max(0, liveOrdersStore.pendingOrders.inPreparation.count - 1),
        amount: Math.max(0, liveOrdersStore.pendingOrders.inPreparation.amount - amount),
      },
    },
    runningTables: liveOrdersStore.runningTables.filter(
      (t) => t.orderNumber !== orderNumber && !t.orderNumber.endsWith(bare),
    ),
  };
}

export interface CreateDineInOrderInput {
  tableId: string;
  tableNumber: string;
  section?: string;
  waiterName?: string;
  pax?: number;
  guestName?: string;
  guestPhone?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    selectedVariantName?: string;
    notes?: string;
    code?: string;
    category?: string;
    diet?: "veg" | "non_veg" | "egg" | "drinks";
  }>;
  /** Kitchen / check-level special note (from billing) */
  orderNote?: string;
  subtotal: number;
  grandTotal: number;
  /** When set after payment at billing — lands in Order History as Settled */
  paymentMode?: "Cash" | "Card" | "UPI" | "Room Charge" | "Split" | "Due";
  markSettled?: boolean;
}

export function createDineInOrder(_input: CreateDineInOrderInput): never {
  throw new Error("Orders must be saved in the database. Choose a real outlet first.");
}

/** Mark an existing Order History row Settled after billing payment; leave Current Orders */
export function markOrderSettledInHistory(
  orderNumber: string,
  paymentMode: "Cash" | "Card" | "UPI" | "Room Charge" | "Split",
) {
  const bare = orderNumber.replace(/^ORD-/i, "").replace(/^BILL-/i, "");
  const open = getCurrentOrderByNumber(orderNumber);
  allOrdersStore = {
    ...allOrdersStore,
    records: allOrdersStore.records.map((r) => {
      if (r.orderNo === bare || r.orderNo === orderNumber || r.id.includes(bare.toLowerCase())) {
        return {
          ...r,
          status: "Settled" as const,
          paymentMode,
          ...(open
            ? {
                itemsSummary: open.itemsSummary,
                grandTotal: open.amount,
                myAmount: open.subtotal,
              }
            : {}),
        };
      }
      return r;
    }),
  };
  if (open) {
    removeCurrentOrderFromLive(open.orderNumber, open.amount);
  } else {
    removeCurrentOrderFromLive(orderNumber, 0);
  }
}

// ==========================================
// 6. DUE SETTLEMENT BILLS MOCK & SERVICE
// ==========================================
export interface DueBill {
  id: string;
  billNo: string;
  orderId?: string;
  orderNumber?: string;
  orderType: string;
  tableOrRoom: string;
  tableId?: string;
  customerName: string;
  customerPhone: string;
  waiterName?: string;
  itemsSummary?: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string;
  daysOverdue: number;
  status: "Pending" | "Partial" | "Settled";
  settlementMode?: "Cash" | "Card" | "UPI" | "Room Charge" | "Split";
  agingBucket: "0-15" | "16-30" | "30+";
  createdAt?: string;
}

let dueBillsStore: DueBill[] = [];

export async function getDueBills(outletId?: string): Promise<DueBill[]> {
  if (isBackendOutletId(outletId)) {
    return liveGetDueBills(outletId);
  }
  // Sync open current orders into due bills store for mock/local mode
  for (const ord of currentOrdersStore) {
    if (ord.currentStage !== "settled") {
      const billNo = `BILL-${ord.orderNumber.replace(/^ORD-/i, "")}`;
      if (!dueBillsStore.some((b) => b.billNo === billNo || b.id === `due-${ord.id}`)) {
        dueBillsStore.push({
          id: `due-${ord.id}`,
          billNo,
          orderType: ord.type === "room_service" ? "Room Service" : "Dine In",
          tableOrRoom: ord.tableOrRoom ? `Table ${ord.tableOrRoom}` : ord.source,
          tableId: ord.tableId,
          customerName: ord.customerName || "Walk-in Guest",
          customerPhone: ord.customerPhone || "--",
          waiterName: ord.waiterName || "Captain",
          itemsSummary: ord.itemsSummary,
          totalAmount: ord.amount,
          paidAmount: 0,
          dueAmount: ord.amount,
          dueDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
          daysOverdue: 0,
          status: "Pending",
          agingBucket: "0-15",
          createdAt: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        });
      }
    }
  }
  // Pending list only — settled bills live in Order History
  return dueBillsStore.filter((b) => b.status !== "Settled");
}

/**
 * Chef 1-click action: Marks KOT Prepared and generates/routes bill to Due Settlement
 */
export async function markKotReadyLive(ticketId: string) {
  return liveKotReady(ticketId);
}

export async function markKotServedLive(ticketId: string) {
  return liveKotServed(ticketId);
}

export function markKotPrepared(kotId: number): { kot: any; bill: DueBill | null } {
  let targetKot: any = null;

  kotOrdersStore = {
    ...kotOrdersStore,
    records: kotOrdersStore.records.map((r) => {
      if (r.kotId === kotId) {
        const readyAt = Date.now();
        const started = r.createdTimestamp ?? readyAt;
        const elapsedMs = Math.max(0, readyAt - started);
        const elapsedMin = Math.floor(elapsedMs / 60_000);
        const elapsedSec = Math.floor((elapsedMs % 60_000) / 1000);
        targetKot = {
          ...r,
          status: "Prepared" as const,
          readyTimestamp: readyAt,
          completeDuration: `${Math.floor(elapsedMin / 60)} hr : ${elapsedMin % 60} min${elapsedSec ? ` : ${elapsedSec}s` : ""}`,
        };
        return targetKot;
      }
      return r;
    }),
  };

  if (!targetKot) {
    return { kot: null, bill: null };
  }

  // Find corresponding active order in live orders or create bill
  const rawTableStr = targetKot.orderType
    .replace("Dine In (", "")
    .replace("Dine In(", "")
    .replace(")", "")
    .replace("[UPDATED]", "")
    .trim();
  const runningTable = liveOrdersStore.runningTables.find(
    (t) =>
      t.tableNumber === rawTableStr ||
      targetKot.orderType.includes(t.tableNumber) ||
      (targetKot.tableNo && t.tableNumber === targetKot.tableNo)
  );

  const billNo = `BILL-${targetKot.kotId.toString().padStart(4, "0")}`;
  const totalAmt = runningTable ? runningTable.amount : 750.0;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const existingIndex = dueBillsStore.findIndex(
    (b) =>
      b.billNo === billNo ||
      (b.tableOrRoom.toLowerCase().includes(rawTableStr.toLowerCase()) && b.status !== "Settled")
  );

  let newBill: DueBill;

  if (existingIndex > -1) {
    newBill = {
      ...dueBillsStore[existingIndex],
      status: "Pending",
      itemsSummary: targetKot.itemsText || dueBillsStore[existingIndex].itemsSummary,
      totalAmount: totalAmt || dueBillsStore[existingIndex].totalAmount,
      dueAmount: totalAmt || dueBillsStore[existingIndex].dueAmount,
    };
    dueBillsStore[existingIndex] = newBill;
  } else {
    newBill = {
      id: `due-${Date.now()}`,
      billNo,
      orderType: targetKot.orderType.includes("Room") ? "Room Service" : "Dine In",
      tableOrRoom: rawTableStr.startsWith("Table") ? rawTableStr : `Table ${rawTableStr}`,
      tableId: runningTable?.id,
      customerName:
        targetKot.customerName && targetKot.customerName !== "--"
          ? targetKot.customerName
          : "Walk-in Guest",
      customerPhone:
        targetKot.customerPhone && targetKot.customerPhone !== "--"
          ? targetKot.customerPhone
          : "--",
      waiterName: "Captain",
      itemsSummary: targetKot.itemsText,
      totalAmount: totalAmt,
      paidAmount: 0,
      dueAmount: totalAmt,
      dueDate: dateStr,
      daysOverdue: 0,
      status: "Pending",
      agingBucket: "0-15",
      createdAt: dateStr,
    };
    dueBillsStore = [newBill, ...dueBillsStore];
  }

  // Update running table status in live orders
  if (runningTable) {
    liveOrdersStore = {
      ...liveOrdersStore,
      runningTables: liveOrdersStore.runningTables.map((t) =>
        t.id === runningTable.id ? { ...t, status: "billed" } : t
      ),
    };
    advanceCurrentOrderStage(runningTable.orderNumber);
  } else {
    // Match Current Orders by table label when no running-table row
    const match = currentOrdersStore.find(
      (o) =>
        o.tableOrRoom === rawTableStr ||
        o.source.includes(rawTableStr) ||
        targetKot.orderType.includes(o.tableOrRoom || ""),
    );
    if (match) advanceCurrentOrderStage(match.orderNumber);
  }

  return { kot: targetKot, bill: newBill };
}

/**
 * Reception Settlement: Settles bill, archives in Order History, and marks table ready
 */
export async function settleDueBillLive(
  billId: string,
  paymentMode: "Cash" | "Card" | "UPI" | "Room Charge" | "Split",
  paidAmount?: number,
  orderId?: string,
) {
  const mode = paymentMode.toUpperCase().replace(" ", "_");
  if (mode === "ROOM_CHARGE" && orderId && /^[0-9a-f-]{36}$/i.test(orderId)) {
    const settled = await liveSettleOrder(orderId, {
      paymentMode: "ROOM_CHARGE",
      tenderedAmount: paidAmount,
      idempotencyKey: `due-folio-${billId}-${Date.now()}`,
    });
    return {
      settledBill: { status: "Settled", dueAmount: 0, orderId, ...settled },
      archivedOrder: settled,
    };
  }
  if (/^[0-9a-f-]{36}$/i.test(billId) || billId.startsWith("BILL-") || billId.startsWith("due-")) {
    try {
      const raw = await liveSettleDue(billId, mode, paidAmount || 0);
      const settledBill = raw?.settledBill || raw;
      return {
        settledBill,
        archivedOrder: settledBill,
      };
    } catch (e) {
      if (!isBackendOutletId()) {
        return settleDueBill(billId, paymentMode, paidAmount);
      }
      throw e;
    }
  }
  return settleDueBill(billId, paymentMode, paidAmount);
}

export function settleDueBill(
  billId: string,
  paymentMode: "Cash" | "Card" | "UPI" | "Room Charge" | "Split",
  paidAmount?: number
): { settledBill: DueBill; archivedOrder: any } {
  let settledBill!: DueBill;

  dueBillsStore = dueBillsStore.map((b) => {
    if (b.id === billId || b.billNo === billId) {
      // Full settlement of balance due → Order History (remove from pending)
      const payNow = paidAmount !== undefined ? paidAmount : b.dueAmount;
      const newPaid = Math.min(b.totalAmount, b.paidAmount + Math.max(0, payNow));
      const newDue = Math.max(0, b.totalAmount - newPaid);
      settledBill = {
        ...b,
        paidAmount: newPaid,
        dueAmount: newDue,
        status: newDue === 0 ? "Settled" : "Partial",
        settlementMode: paymentMode,
      };
      return settledBill;
    }
    return b;
  });

  if (!settledBill) {
    throw new Error("Bill not found");
  }

  // Fully paid → drop from pending payments list and current orders
  if (settledBill.status === "Settled") {
    dueBillsStore = dueBillsStore.filter((b) => b.id !== settledBill.id);
    const bareNum = settledBill.billNo.replace(/^BILL-/, "");
    currentOrdersStore = currentOrdersStore.filter(
      (o) =>
        o.id !== settledBill.id.replace(/^due-/, "") &&
        o.orderNumber !== `ORD-${bareNum}` &&
        o.orderNumber !== settledBill.billNo
    );
  }

  // Archive or update in All Order History
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const fullDateTime = `${dateStr} ${timeStr}`;

  const existingHistoryIdx = allOrdersStore.records.findIndex(
    (r) =>
      r.orderNo === settledBill.billNo.replace("BILL-", "") ||
      (settledBill.tableOrRoom && r.orderTypeDisplay.includes(settledBill.tableOrRoom))
  );

  const archivedRecord = {
    id: `ord-settled-${settledBill.id}`,
    orderNo: settledBill.billNo.replace("BILL-", ""),
    orderType: settledBill.orderType.toLowerCase().includes("room")
      ? ("room_service" as const)
      : ("dine_in" as const),
    orderTypeDisplay: `${settledBill.orderType} (${settledBill.tableOrRoom})`,
    customerName: settledBill.customerName,
    customerPhone: settledBill.customerPhone,
    assignTo: settledBill.waiterName || "Captain",
    itemsSummary: settledBill.itemsSummary || "Dishes & Beverages",
    myAmount: Math.round(settledBill.totalAmount * 0.95),
    taxAmount: Math.round(settledBill.totalAmount * 0.05),
    discountAmount: 0.0,
    grandTotal: settledBill.totalAmount,
    paymentMode,
    status: "Settled" as const,
    createdAt: fullDateTime,
    isOnlineOrder: false,
  };

  if (existingHistoryIdx > -1) {
    allOrdersStore.records[existingHistoryIdx] = {
      ...allOrdersStore.records[existingHistoryIdx],
      status: "Settled",
      paymentMode,
      grandTotal: settledBill.totalAmount,
    };
  } else {
    allOrdersStore = {
      ...allOrdersStore,
      totalCount: allOrdersStore.totalCount + 1,
      grandTotal: allOrdersStore.grandTotal + settledBill.totalAmount,
      records: [archivedRecord, ...allOrdersStore.records],
    };
  }

  // Remove from live running tables if settled
  liveOrdersStore = {
    ...liveOrdersStore,
    runningTables: liveOrdersStore.runningTables.filter(
      (t) => !settledBill.tableOrRoom.includes(t.tableNumber) && t.id !== settledBill.tableId
    ),
    runningOrders: {
      ...liveOrdersStore.runningOrders,
      totalOrders: Math.max(0, liveOrdersStore.runningOrders.totalOrders - 1),
      totalAmount: Math.max(0, liveOrdersStore.runningOrders.totalAmount - settledBill.totalAmount),
    },
  };

  return { settledBill, archivedOrder: archivedRecord };
}

/**
 * Frontdesk Edit/Update: Adds/deletes items from order and sends an incremental KOT ticket
 */
export function updateDineInOrder(input: {
  tableId: string;
  tableNumber: string;
  waiterName?: string;
  guestName?: string;
  guestPhone?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    selectedVariantName?: string;
    notes?: string;
  }>;
  subtotal: number;
  grandTotal: number;
  modifiedSummaryText: string;
}): { kotId: number } {
  const kotId = kotCounter++;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const fullDateTime = `${dateStr} ${now.toLocaleTimeString()}`;

  const allItemsSummaryText = input.items
    .map((i) => `${i.name}${i.selectedVariantName ? ` (${i.selectedVariantName})` : ""} × ${i.quantity}`)
    .join(", ");
  const totalItemCount = input.items.reduce((s, i) => s + i.quantity, 0);

  // 1. Add Modification KOT ticket to kitchen (Preparing)
  const updateKotRecord = {
    id: `kot-${kotId}`,
    kotId,
    orderType: `Dine In (${input.tableNumber}) [UPDATED]`,
    customerName: input.guestName || "--",
    customerPhone: input.guestPhone || "--",
    itemCount: totalItemCount,
    itemsText: `[MODIFIED]: ${input.modifiedSummaryText || allItemsSummaryText}`,
    items: input.items.map((i) => ({
      name: i.name + (i.selectedVariantName ? ` (${i.selectedVariantName})` : ""),
      quantity: i.quantity,
      notes: i.notes,
    })),
    status: "Not Prepared" as const,
    billPrintDate: null,
    completeDuration: null,
    createdAt: fullDateTime,
    createdTimestamp: now.getTime(),
    isModified: true,
  };

  kotOrdersStore = {
    ...kotOrdersStore,
    totalCount: kotOrdersStore.totalCount + 1,
    records: [updateKotRecord, ...kotOrdersStore.records],
  };

  // 2. Update Live Tables & Live Orders
  liveOrdersStore = {
    ...liveOrdersStore,
    runningTables: liveOrdersStore.runningTables.map((t) => {
      if (t.id === input.tableId || input.tableNumber.includes(t.tableNumber)) {
        return {
          ...t,
          amount: input.grandTotal,
        };
      }
      return t;
    }),
  };

  // 3. Update Current Orders open check (items + amount) and reset to Preparation
  const tableBare = input.tableNumber.replace("Table #", "").replace("Table ", "");
  currentOrdersStore = currentOrdersStore.map((o) => {
    if (o.tableId === input.tableId || o.tableOrRoom === tableBare || input.tableNumber.includes(o.tableOrRoom || "")) {
      return {
        ...o,
        itemsSummary: allItemsSummaryText,
        amount: input.grandTotal,
        amountFormatted: formatINR(input.grandTotal),
        subtotal: input.subtotal,
        customerName: input.guestName || o.customerName,
        customerPhone: input.guestPhone || o.customerPhone,
        waiterName: input.waiterName || o.waiterName,
        currentStage: "placed" as const,
        stageLabel: "Placed (In Kitchen)",
        items: input.items.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          selectedVariantName: i.selectedVariantName,
          notes: i.notes,
        })),
      };
    }
    return o;
  });

  // 4. Sync Order History row amounts/items while still open
  allOrdersStore = {
    ...allOrdersStore,
    records: allOrdersStore.records.map((r) => {
      const matchTable =
        typeof r.orderTypeDisplay === "string" &&
        (r.orderTypeDisplay.includes(tableBare) || r.orderTypeDisplay.includes(input.tableNumber));
      if (matchTable && r.status !== "Settled") {
        return {
          ...r,
          itemsSummary: allItemsSummaryText,
          myAmount: input.subtotal,
          taxAmount: Math.round(input.grandTotal - input.subtotal),
          grandTotal: input.grandTotal,
        };
      }
      return r;
    }),
  };

  // 5. Update in Due Bills if present
  dueBillsStore = dueBillsStore.map((b) => {
    if (b.tableId === input.tableId || b.tableOrRoom.includes(input.tableNumber.replace("Table #", ""))) {
      return {
        ...b,
        itemsSummary: allItemsSummaryText,
        totalAmount: input.grandTotal,
        dueAmount: Math.max(0, input.grandTotal - b.paidAmount),
      };
    }
    return b;
  });

  return { kotId };
}

/** Update open Current Order by order number (Edit in Billing → new KOT for changes) */
export function updateCurrentOrderFromBilling(input: {
  orderNumber: string;
  items: CreateDineInOrderInput["items"];
  subtotal: number;
  grandTotal: number;
  guestName?: string;
  guestPhone?: string;
  waiterName?: string;
  orderNote?: string;
  modifiedSummaryText: string;
}): { kotId: number } | null {
  const open = getCurrentOrderByNumber(input.orderNumber);
  if (!open) return null;
  return updateDineInOrder({
    tableId: open.tableId,
    tableNumber: open.tableOrRoom ? `Table ${open.tableOrRoom}` : open.source,
    waiterName: input.waiterName || open.waiterName,
    guestName: input.guestName || open.customerName,
    guestPhone: input.guestPhone || open.customerPhone,
    items: input.items,
    subtotal: input.subtotal,
    grandTotal: input.grandTotal,
    modifiedSummaryText: input.modifiedSummaryText,
  });
}

