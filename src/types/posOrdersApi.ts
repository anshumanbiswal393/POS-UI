/**
 * Wire DTOs for Daily Operations (Live Orders, All Orders, Online Orders, KOT)
 */

export interface LiveOrderSummaryApiDto {
  runningOrders: {
    totalOrders: number;
    totalAmount: number;
    dineIn: { count: number; amount: number };
    pickUp: { count: number; amount: number };
    delivery: { count: number; amount: number };
  };
  pendingOrders: {
    totalOrders: number;
    totalAmount: number;
    inPreparation: { count: number; amount: number };
    waitingForPickup: { count: number; amount: number };
    outForDelivery: { count: number; amount: number };
  };
  runningTables: Array<{
    id: string;
    tableNumber: string;
    section: string; // e.g. "Garden", "AC Hall", "Balcony"
    capacity: number;
    occupancy: number;
    orderNumber: string;
    amount: number;
    elapsedMinutes: number;
    status: "running" | "billed" | "vacant";
  }>;
}

export interface AllOrderRecordApiDto {
  id: string;
  orderNo: string;
  orderType: "dine_in" | "takeaway" | "delivery" | "room_service" | "online";
  orderTypeDisplay: string; // e.g. "Dine In (G41) (Garden)"
  customerName: string;
  customerPhone?: string;
  assignTo: string; // Waiter or Captain
  itemsSummary: string;
  myAmount: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  paymentMode: "Cash" | "Card" | "UPI" | "Due" | "Split" | "Room Charge";
  status: "Printed" | "Completed" | "Settled" | "Cancelled" | "Running";
  createdAt: string; // e.g. "31 Aug 2026 22:16:49"
  isOnlineOrder?: boolean;
  isAdvanceOrder?: boolean;
  isSplitBill?: boolean;
}

export interface DailySalesTrendPointApiDto {
  dateLabel: string; // e.g. "18th Aug", "19th Aug", ...
  amount: number;
}

export interface AllOrdersApiResponse {
  success: boolean;
  grandTotal: number;
  salesTrend: DailySalesTrendPointApiDto[];
  records: AllOrderRecordApiDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface OnlineOrderRecordApiDto {
  id: string;
  orderNo: string;
  platform: "zomato" | "swiggy" | "direct_web";
  outletName: string;
  orderType: string;
  riderName?: string;
  riderPhone?: string;
  customerName: string;
  customerPhone: string;
  otp: string;
  dateTime: string;
  totalAmount: number;
  status: "placed" | "accepted" | "in_kitchen" | "food_ready" | "out_for_delivery" | "delivered" | "cancelled";
  statusDisplay: string;
  placedMinutesAgo: number;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export interface OnlineOrdersApiResponse {
  success: boolean;
  records: OnlineOrderRecordApiDto[];
  totalCount: number;
}

export interface KotRecordApiDto {
  id: string;
  kotId: number; // e.g. 6, 5, 4, 3, 2, 1
  orderType: string; // e.g. "Dine In(B23)", "Dine In(B24)"
  customerName: string;
  customerPhone: string;
  itemCount: number;
  itemsText: string;
  items?: Array<{ name: string; quantity: number; notes?: string }>;
  status: "Not Prepared" | "In Kitchen" | "Prepared" | "Served";
  billPrintDate: string | null;
  completeDuration: string | null;
  createdAt: string; // e.g. "1 Sep 2026 13:18:49"
  /** Epoch ms when ticket entered kitchen — used for KDS elapsed timer */
  createdTimestamp?: number;
  /** Epoch ms when marked Ready — freezes the KDS timer */
  readyTimestamp?: number;
  isModified?: boolean;
}

export interface KotApiResponse {
  success: boolean;
  records: KotRecordApiDto[];
  totalCount: number;
}
