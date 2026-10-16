import httpClient from "@/utils/httpClient";
import { formatINR } from "./posDashboardService";
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
    totalOrders: 2,
    totalAmount: 1760.0,
    dineIn: { count: 2, amount: 1760.0 },
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
  runningTables: [
    {
      id: "tbl-g41",
      tableNumber: "G41",
      section: "Garden",
      capacity: 4,
      occupancy: 3,
      orderNumber: "ORD-10519",
      amount: 1760.0,
      elapsedMinutes: 24,
      status: "running",
    },
    {
      id: "tbl-b23",
      tableNumber: "B23",
      section: "Bar Lounge",
      capacity: 2,
      occupancy: 2,
      orderNumber: "ORD-10520",
      amount: 1130.0,
      elapsedMinutes: 12,
      status: "running",
    },
    {
      id: "tbl-a12",
      tableNumber: "A12",
      section: "AC Hall",
      capacity: 6,
      occupancy: 4,
      orderNumber: "ORD-10521",
      amount: 2840.0,
      elapsedMinutes: 45,
      status: "billed",
    },
  ],
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

export async function getLiveOrdersSummary(): Promise<LiveOrderSummaryData> {
  if (typeof window === "undefined") return getInitialLiveOrdersData();
  try {
    const res = await httpClient.get<LiveOrderSummaryApiDto>("/api/pos/orders/live");
    if (res.data) return mapLiveOrdersDto(res.data);
    return getInitialLiveOrdersData();
  } catch {
    return getInitialLiveOrdersData();
  }
}

// ==========================================
// 2. ALL ORDERS MOCK & SERVICE
// ==========================================
let allOrdersStore: AllOrdersApiResponse = {
  success: true,
  grandTotal: 643388.0,
  salesTrend: [
    { dateLabel: "18th Aug", amount: 22870 },
    { dateLabel: "19th Aug", amount: 72606 },
    { dateLabel: "20th Aug", amount: 27242 },
    { dateLabel: "21st Aug", amount: 72093 },
    { dateLabel: "22nd Aug", amount: 59975 },
    { dateLabel: "23rd Aug", amount: 37226 },
    { dateLabel: "24th Aug", amount: 20496 },
    { dateLabel: "25th Aug", amount: 28031 },
    { dateLabel: "26th Aug", amount: 51155 },
    { dateLabel: "27th Aug", amount: 61031 },
    { dateLabel: "28th Aug", amount: 71860 },
    { dateLabel: "29th Aug", amount: 54227 },
    { dateLabel: "30th Aug", amount: 52984 },
    { dateLabel: "31st Aug", amount: 28726 },
    { dateLabel: "1st Sep", amount: 18420 },
  ],
  totalCount: 678,
  page: 1,
  pageSize: 10,
  records: [
    {
      id: "ord-10519",
      orderNo: "10519",
      orderType: "dine_in",
      orderTypeDisplay: "Dine In (G41) (Garden)",
      customerName: "Rahul Mehta",
      customerPhone: "9876543210",
      assignTo: "Sunil (Captain)",
      itemsSummary: "Bp Reserve 180, Budweiser Magnum (650 Ml), Carlsberg Elephant 650 Ml",
      myAmount: 2890.0,
      taxAmount: 0.0,
      discountAmount: 0.0,
      grandTotal: 2890.0,
      paymentMode: "Cash",
      status: "Printed",
      createdAt: "31 Aug 2026 22:16:49",
      isOnlineOrder: false,
    },
    {
      id: "ord-10518",
      orderNo: "10518",
      orderType: "dine_in",
      orderTypeDisplay: "Dine In (B23) (Bar)",
      customerName: "Vikram Malhotra",
      customerPhone: "9811223344",
      assignTo: "Amit",
      itemsSummary: "Butter Chicken (Half), Garlic Naan (2), Tandoori Roti (4), Carlsberg Elephant",
      myAmount: 1850.0,
      taxAmount: 92.5,
      discountAmount: 0.0,
      grandTotal: 1942.5,
      paymentMode: "Card",
      status: "Settled",
      createdAt: "31 Aug 2026 21:45:12",
    },
    {
      id: "ord-10517",
      orderNo: "10517",
      orderType: "online",
      orderTypeDisplay: "Zomato #4829",
      customerName: "Pooja Sharma",
      customerPhone: "9899887766",
      assignTo: "Online Desk",
      itemsSummary: "Paneer Butter Masala, Jeera Rice, Dal Makhani",
      myAmount: 780.0,
      taxAmount: 39.0,
      discountAmount: 50.0,
      grandTotal: 769.0,
      paymentMode: "UPI",
      status: "Completed",
      createdAt: "31 Aug 2026 21:12:00",
      isOnlineOrder: true,
    },
    {
      id: "ord-10516",
      orderNo: "10516",
      orderType: "room_service",
      orderTypeDisplay: "Room 204 (Deluxe)",
      customerName: "Aman Singhal",
      customerPhone: "9712345678",
      assignTo: "Ramesh",
      itemsSummary: "Club Sandwich, French Fries, Cold Coffee (2)",
      myAmount: 640.0,
      taxAmount: 32.0,
      discountAmount: 0.0,
      grandTotal: 672.0,
      paymentMode: "Due",
      status: "Settled",
      createdAt: "31 Aug 2026 20:30:22",
    },
    {
      id: "ord-10515",
      orderNo: "10515",
      orderType: "dine_in",
      orderTypeDisplay: "Dine In (AC-04)",
      customerName: "Deepak Grover",
      customerPhone: "9988776655",
      assignTo: "Sunil",
      itemsSummary: "Mutton Rogan Josh, Butter Naan (3), Sweet Lassi (2)",
      myAmount: 1420.0,
      taxAmount: 71.0,
      discountAmount: 100.0,
      grandTotal: 1391.0,
      paymentMode: "Split",
      status: "Settled",
      createdAt: "31 Aug 2026 20:05:14",
      isSplitBill: true,
    },
  ],
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

export async function getAllOrders(filters?: Record<string, any>): Promise<AllOrdersData> {
  if (typeof window === "undefined") return getInitialAllOrdersData();
  try {
    const res = await httpClient.get<AllOrdersApiResponse>("/api/pos/orders/all", {
      params: filters,
    });
    if (res.data && res.data.success) return mapAllOrdersDto(res.data);
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
  totalCount: 5,
  records: [
    {
      id: "on-new-1",
      orderNo: "ZOM-77492",
      platform: "zomato",
      outletName: "Main Restaurant",
      orderType: "Zomato Delivery",
      riderName: "Vikas Yadav",
      riderPhone: "+91 98119 22334",
      customerName: "Sneha Kapur",
      customerPhone: "+91 98711 55667",
      otp: "7749",
      dateTime: "Just now",
      totalAmount: 645.0,
      status: "placed",
      statusDisplay: "New Order (Pending Accept)",
      placedMinutesAgo: 1,
      items: [
        { name: "Kadhai Paneer", quantity: 1, price: 320 },
        { name: "Butter Roti", quantity: 4, price: 160 },
        { name: "Jeera Rice", quantity: 1, price: 165 },
      ],
    },
    {
      id: "on-1",
      orderNo: "ZOM-48291",
      platform: "zomato",
      outletName: "Main Restaurant",
      orderType: "Zomato Delivery",
      riderName: "Suresh Kumar",
      riderPhone: "+91 98765 11223",
      customerName: "Pooja Sharma",
      customerPhone: "+91 98998 87766",
      otp: "4821",
      dateTime: "01 Sep 2026 13:20",
      totalAmount: 769.0,
      status: "in_kitchen",
      statusDisplay: "In Kitchen (Prep)",
      placedMinutesAgo: 8,
      items: [
        { name: "Paneer Butter Masala", quantity: 1, price: 340 },
        { name: "Butter Naan", quantity: 3, price: 180 },
        { name: "Dal Makhani", quantity: 1, price: 249 },
      ],
    },
    {
      id: "on-2",
      orderNo: "SWIG-91823",
      platform: "swiggy",
      outletName: "Main Restaurant",
      orderType: "Swiggy Delivery",
      riderName: "Amit Singh",
      riderPhone: "+91 97112 33445",
      customerName: "Karan Johar",
      customerPhone: "+91 98110 99887",
      otp: "9102",
      dateTime: "01 Sep 2026 13:12",
      totalAmount: 1120.0,
      status: "food_ready",
      statusDisplay: "Food Ready (Waiting Rider)",
      placedMinutesAgo: 16,
      items: [
        { name: "Chicken Tikka Biryani", quantity: 2, price: 780 },
        { name: "Cold Coffee", quantity: 2, price: 340 },
      ],
    },
    {
      id: "on-3",
      orderNo: "ZOM-48288",
      platform: "zomato",
      outletName: "Main Restaurant",
      orderType: "Zomato Delivery",
      customerName: "Rohan Verma",
      customerPhone: "+91 99881 12233",
      otp: "3319",
      dateTime: "01 Sep 2026 12:45",
      totalAmount: 540.0,
      status: "delivered",
      statusDisplay: "Delivered",
      placedMinutesAgo: 45,
      items: [
        { name: "Veg Hakka Noodles", quantity: 1, price: 260 },
        { name: "Chilli Paneer Dry", quantity: 1, price: 280 },
      ],
    },
    {
      id: "on-4",
      orderNo: "WEB-1002",
      platform: "direct_web",
      outletName: "Main Restaurant",
      orderType: "Direct Pickup",
      customerName: "Ananya Roy",
      customerPhone: "+91 98123 45670",
      otp: "1002",
      dateTime: "01 Sep 2026 13:05",
      totalAmount: 890.0,
      status: "out_for_delivery",
      statusDisplay: "Picked Up",
      placedMinutesAgo: 22,
      items: [
        { name: "Margherita Pizza (Large)", quantity: 1, price: 550 },
        { name: "Garlic Breadsticks", quantity: 1, price: 190 },
        { name: "Coke Can", quantity: 2, price: 150 },
      ],
    },
  ],
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
  totalCount: 6,
  records: [
    {
      id: "kot-6",
      kotId: 6,
      orderType: "Dine In(B23)",
      customerName: "--",
      customerPhone: "--",
      itemCount: 1,
      itemsText: "Chicken Biryani × 1",
      items: [{ name: "Chicken Biryani", quantity: 1 }],
      status: "Not Prepared",
      billPrintDate: null,
      completeDuration: null,
      createdAt: "1 Sep 2026 13:18:49",
      createdTimestamp: _seedNow - 3 * 60_000,
      isModified: false,
    },
    {
      id: "kot-5",
      kotId: 5,
      orderType: "Dine In(B23)",
      customerName: "--",
      customerPhone: "--",
      itemCount: 1,
      itemsText: "Carlsberg Elephant 650 Ml × 1",
      items: [{ name: "Carlsberg Elephant 650 Ml", quantity: 1 }],
      status: "Not Prepared",
      billPrintDate: null,
      completeDuration: null,
      createdAt: "1 Sep 2026 13:14:11",
      createdTimestamp: _seedNow - 8 * 60_000,
      isModified: false,
    },
    {
      id: "kot-4",
      kotId: 4,
      orderType: "Dine In(B24)",
      customerName: "--",
      customerPhone: "--",
      itemCount: 2,
      itemsText: "Fried Fish (Rohu) × 1, Kingfisher Strong × 1",
      items: [
        { name: "Fried Fish (Rohu)", quantity: 1 },
        { name: "Kingfisher Strong", quantity: 1 },
      ],
      status: "Not Prepared",
      billPrintDate: null,
      completeDuration: null,
      createdAt: "1 Sep 2026 13:12:21",
      createdTimestamp: _seedNow - 12 * 60_000,
      isModified: false,
    },
    {
      id: "kot-3",
      kotId: 3,
      orderType: "Dine In(B23)",
      customerName: "--",
      customerPhone: "--",
      itemCount: 1,
      itemsText: "Green Salad × 1",
      items: [{ name: "Green Salad", quantity: 1 }],
      status: "Prepared",
      billPrintDate: null,
      completeDuration: "0 hr : 08 min",
      createdAt: "1 Sep 2026 12:59:47",
      createdTimestamp: _seedNow - 18 * 60_000,
      readyTimestamp: _seedNow - 10 * 60_000,
      isModified: false,
    },
    {
      id: "kot-2",
      kotId: 2,
      orderType: "Dine In(B23)",
      customerName: "--",
      customerPhone: "--",
      itemCount: 1,
      itemsText: "Fry Papad × 1",
      items: [{ name: "Fry Papad", quantity: 1 }],
      status: "Prepared",
      billPrintDate: null,
      completeDuration: "0 hr : 10 min",
      createdAt: "1 Sep 2026 12:48:33",
      createdTimestamp: _seedNow - 22 * 60_000,
      readyTimestamp: _seedNow - 12 * 60_000,
      isModified: false,
    },
    {
      id: "kot-1",
      kotId: 1,
      orderType: "Dine In(B23)",
      customerName: "--",
      customerPhone: "--",
      itemCount: 2,
      itemsText: "Carlsberg Elephant 650 Ml × 1, Tandoori Chicken (Half) × 1",
      items: [
        { name: "Carlsberg Elephant 650 Ml", quantity: 1 },
        { name: "Tandoori Chicken (Half)", quantity: 1, notes: "Extra spicy" },
      ],
      status: "Not Prepared",
      billPrintDate: null,
      completeDuration: null,
      createdAt: "1 Sep 2026 12:42:22",
      createdTimestamp: _seedNow - 16 * 60_000,
      isModified: true,
    },
  ],
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

export async function getKotOrders(filters?: Record<string, any>): Promise<KotData> {
  if (typeof window === "undefined") return getInitialKotData();
  try {
    const res = await httpClient.get<KotApiResponse>("/api/pos/kot", { params: filters });
    if (res.data && res.data.success) return mapKotDto(res.data);
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
}

let currentOrdersStore: CurrentOrderRecord[] = [
  {
    id: "live-ord-1",
    orderNumber: "ORD-10521",
    type: "dine_in",
    typeLabel: "Dine In",
    source: "Table T-04 (AC)",
    customerName: "Rahul Sharma",
    customerPhone: "9876500001",
    tableOrRoom: "T-04",
    tableId: "tbl-t-04",
    section: "AC",
    waiterName: "Captain",
    pax: 2,
    itemsSummary: "Paneer Butter Masala, Butter Naan (3), Dal Makhani",
    amount: 1120,
    amountFormatted: formatINR(1120),
    startTime: "16:10",
    createdTimestamp: Date.now() - 28 * 60_000,
    elapsedMinutes: 28,
    estDurationMinutes: 40,
    currentStage: "prepared",
    stageLabel: "Prepared by Chef",
    subtotal: 1000,
    items: [
      { id: "item-pbm", name: "Paneer Butter Masala", quantity: 1, price: 320, code: "#101", category: "Main Course", diet: "veg" },
      { id: "item-naan", name: "Butter Naan", quantity: 3, price: 60, code: "#201", category: "Breads & Rice", diet: "veg" },
      { id: "item-dal", name: "Dal Makhani", quantity: 1, price: 280, code: "#102", category: "Main Course", diet: "veg" },
    ],
  },
  {
    id: "live-ord-2",
    orderNumber: "ORD-10522",
    type: "dine_in",
    typeLabel: "Dine In",
    source: "Table T-12 (Garden)",
    customerName: "Ananya Roy",
    customerPhone: "9876500002",
    tableOrRoom: "T-12",
    tableId: "tbl-t-12",
    section: "Garden",
    waiterName: "Captain",
    pax: 2,
    itemsSummary: "Carlsberg Elephant (2), Crispy Corn, Veg Hakka Noodles",
    amount: 640,
    amountFormatted: formatINR(640),
    startTime: "16:22",
    createdTimestamp: Date.now() - 16 * 60_000,
    elapsedMinutes: 16,
    estDurationMinutes: 35,
    currentStage: "placed",
    stageLabel: "Placed (In Kitchen)",
    subtotal: 580,
    items: [
      { id: "item-carl", name: "Carlsberg Elephant", quantity: 2, price: 180, code: "#401", category: "Bar & Cocktails", diet: "drinks" },
      { id: "item-corn", name: "Crispy Corn", quantity: 1, price: 160, code: "#110", category: "Starters", diet: "veg" },
      { id: "item-hakka", name: "Veg Hakka Noodles", quantity: 1, price: 220, code: "#210", category: "Main Course", diet: "veg" },
    ],
  },
];

export function getCurrentOrdersTimeline(): CurrentOrderRecord[] {
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

export function createDineInOrder(input: CreateDineInOrderInput): {
  orderNumber: string;
  kotId: number;
} {
  const orderNumber = `ORD-${orderCounter++}`;
  const kotId = kotCounter++;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const fullDateTime = `${dateStr} ${now.toLocaleTimeString()}`;

  const itemsSummaryText = [
    ...input.items.map(
      (i) => `${i.name}${i.selectedVariantName ? ` (${i.selectedVariantName})` : ""} × ${i.quantity}`,
    ),
    input.orderNote?.trim() ? `Note: ${input.orderNote.trim()}` : null,
  ]
    .filter(Boolean)
    .join(", ");
  const totalItemCount = input.items.reduce((s, i) => s + i.quantity, 0);
  const tableLabelClean = input.tableNumber.replace("Table #", "").replace("Table ", "");

  // Open checks stay on Current Orders in Preparation until payment
  if (!input.markSettled) {
    liveOrdersStore = {
      ...liveOrdersStore,
      runningOrders: {
        ...liveOrdersStore.runningOrders,
        totalOrders: liveOrdersStore.runningOrders.totalOrders + 1,
        totalAmount: liveOrdersStore.runningOrders.totalAmount + input.grandTotal,
        dineIn: {
          count: liveOrdersStore.runningOrders.dineIn.count + 1,
          amount: liveOrdersStore.runningOrders.dineIn.amount + input.grandTotal,
        },
      },
      pendingOrders: {
        ...liveOrdersStore.pendingOrders,
        totalOrders: liveOrdersStore.pendingOrders.totalOrders + 1,
        totalAmount: liveOrdersStore.pendingOrders.totalAmount + input.grandTotal,
        inPreparation: {
          count: liveOrdersStore.pendingOrders.inPreparation.count + 1,
          amount: liveOrdersStore.pendingOrders.inPreparation.amount + input.grandTotal,
        },
      },
      runningTables: [
        {
          id: input.tableId,
          tableNumber: tableLabelClean,
          section: input.section || "Main Dining",
          capacity: input.pax || 4,
          occupancy: input.pax || 2,
          orderNumber,
          amount: input.grandTotal,
          elapsedMinutes: 1,
          status: "running",
        },
        ...liveOrdersStore.runningTables,
      ],
    };

    currentOrdersStore = [
      {
        id: `live-${orderNumber.toLowerCase()}`,
        orderNumber,
        type: "dine_in",
        typeLabel: "Dine In",
        source: `Table ${tableLabelClean}${input.section ? ` (${input.section})` : ""}`,
        customerName: input.guestName || "Walk-in Guest",
        customerPhone: input.guestPhone || "--",
        tableOrRoom: tableLabelClean,
        tableId: input.tableId,
        section: input.section || "Main Dining",
        waiterName: input.waiterName || "Captain",
        pax: input.pax || 2,
        itemsSummary: itemsSummaryText,
        amount: input.grandTotal,
        amountFormatted: formatINR(input.grandTotal),
        startTime: timeStr,
        createdTimestamp: now.getTime(),
        elapsedMinutes: 1,
        estDurationMinutes: 35,
        currentStage: "placed",
        stageLabel: "Placed (In Kitchen)",
        subtotal: input.subtotal,
        orderNote: input.orderNote,
        items: input.items.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          selectedVariantName: i.selectedVariantName,
          notes: i.notes,
          code: i.code,
          category: i.category,
          diet: i.diet,
        })),
      },
      ...currentOrdersStore,
    ];

    // KOT → Preparing (FCFS)
    const newKotRecord = {
      id: `kot-${kotId}`,
      kotId,
      orderType: `Dine In (${input.tableNumber})`,
      customerName: input.guestName || "--",
      customerPhone: input.guestPhone || "--",
      itemCount: totalItemCount,
      itemsText: itemsSummaryText,
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
      isModified: false,
    };

    kotOrdersStore = {
      ...kotOrdersStore,
      totalCount: kotOrdersStore.totalCount + 1,
      records: [newKotRecord, ...kotOrdersStore.records],
    };
  }

  // Order History row (Printed while open; Settled when paid immediately)
  const newAllOrderRecord = {
    id: `ord-${orderNumber.toLowerCase()}`,
    orderNo: orderNumber.replace("ORD-", ""),
    orderType: "dine_in" as const,
    orderTypeDisplay: `Dine In (${input.tableNumber}) (${input.section || "Main Dining"})`,
    customerName: input.guestName || "Walk-in Guest",
    customerPhone: input.guestPhone || "--",
    assignTo: input.waiterName || "Captain",
    itemsSummary: itemsSummaryText,
    myAmount: input.subtotal,
    taxAmount: Math.round(input.grandTotal - input.subtotal),
    discountAmount: 0.0,
    grandTotal: input.grandTotal,
    paymentMode: (input.paymentMode || "Due") as "Cash" | "Card" | "UPI" | "Room Charge" | "Split" | "Due",
    status: input.markSettled ? ("Settled" as const) : ("Printed" as const),
    createdAt: fullDateTime,
    isOnlineOrder: false,
  };

  allOrdersStore = {
    ...allOrdersStore,
    totalCount: allOrdersStore.totalCount + 1,
    grandTotal: allOrdersStore.grandTotal + input.grandTotal,
    records: [newAllOrderRecord, ...allOrdersStore.records],
  };

  return { orderNumber, kotId };
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

let dueBillsStore: DueBill[] = [
  {
    id: "due-1",
    billNo: "BILL-8901",
    orderType: "Room Service",
    tableOrRoom: "Room 302",
    customerName: "Siddharth Malhotra",
    customerPhone: "9876543210",
    waiterName: "Ramesh",
    itemsSummary: "Club Sandwich, French Fries, Cold Coffee (2)",
    totalAmount: 4850,
    paidAmount: 2000,
    dueAmount: 2850,
    dueDate: "28 Aug 2026",
    daysOverdue: 7,
    status: "Partial",
    agingBucket: "0-15",
  },
  {
    id: "due-2",
    billNo: "BILL-8904",
    orderType: "Dine In (Corporate)",
    tableOrRoom: "Table T-15",
    customerName: "Deloitte India Pvt Ltd",
    customerPhone: "9811223344",
    waiterName: "Kunal S.",
    itemsSummary: "Paneer Tikka, Butter Chicken (2), Dal Makhani (2), Butter Naan (10)",
    totalAmount: 14200,
    paidAmount: 0,
    dueAmount: 14200,
    dueDate: "15 Aug 2026",
    daysOverdue: 20,
    status: "Pending",
    agingBucket: "16-30",
  },
  {
    id: "due-3",
    billNo: "BILL-8910",
    orderType: "Takeaway Credit",
    tableOrRoom: "VIP Counter",
    customerName: "Vikram Singhania",
    customerPhone: "9988776655",
    waiterName: "Billing Desk",
    itemsSummary: "Executive Lunch Combo (4)",
    totalAmount: 3200,
    paidAmount: 0,
    dueAmount: 3200,
    dueDate: "2 Aug 2026",
    daysOverdue: 33,
    status: "Pending",
    agingBucket: "30+",
  },
];

export async function getDueBills(): Promise<DueBill[]> {
  // Pending list only — settled bills live in Order History
  return dueBillsStore.filter((b) => b.status !== "Settled");
}

/**
 * Chef 1-click action: Marks KOT Prepared and generates/routes bill to Due Settlement
 */
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

  // Fully paid → drop from pending payments list
  if (settledBill.status === "Settled") {
    dueBillsStore = dueBillsStore.filter((b) => b.id !== settledBill.id);
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

