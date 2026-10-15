/**
 * UI View Models for Daily Operations (Live Orders, All Orders, Online Orders, KOT)
 */

export interface LiveOrderSummaryData {
  runningOrders: {
    totalOrders: number;
    totalAmountFormatted: string;
    totalAmount: number;
    dineIn: { count: number; amountFormatted: string };
    pickUp: { count: number; amountFormatted: string };
    delivery: { count: number; amountFormatted: string };
  };
  pendingOrders: {
    totalOrders: number;
    totalAmountFormatted: string;
    totalAmount: number;
    inPreparation: { count: number; amountFormatted: string };
    waitingForPickup: { count: number; amountFormatted: string };
    outForDelivery: { count: number; amountFormatted: string };
  };
  runningTables: Array<{
    id: string;
    tableNumber: string;
    section: string;
    capacity: number;
    occupancy: number;
    orderNumber: string;
    amountFormatted: string;
    elapsedMinutes: number;
    status: "running" | "billed" | "vacant";
  }>;
}

export interface AllOrderItem {
  id: string;
  orderNo: string;
  orderTypeDisplay: string;
  customerName: string;
  assignTo: string;
  itemsSummary: string;
  myAmountFormatted: string;
  taxAmountFormatted: string;
  discountAmountFormatted: string;
  grandTotalFormatted: string;
  paymentMode: string;
  status: "Printed" | "Completed" | "Settled" | "Cancelled" | "Running";
  createdAt: string;
  isOnlineOrder?: boolean;
  isAdvanceOrder?: boolean;
  isSplitBill?: boolean;
}

export interface DailySalesTrendPoint {
  dateLabel: string;
  amount: number;
  formattedAmount: string;
}

export interface AllOrdersData {
  grandTotalFormatted: string;
  grandTotalAmount: number;
  salesTrend: DailySalesTrendPoint[];
  records: AllOrderItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface OnlineOrderItem {
  id: string;
  orderNo: string;
  platform: "zomato" | "swiggy" | "direct_web";
  outletName: string;
  orderType: string;
  riderDetails: string;
  customerName: string;
  customerPhone: string;
  otp: string;
  dateTime: string;
  totalAmountFormatted: string;
  status: "placed" | "accepted" | "in_kitchen" | "food_ready" | "out_for_delivery" | "delivered" | "cancelled";
  statusDisplay: string;
  items: Array<{ name: string; quantity: number; priceFormatted: string }>;
  itemsText?: string;
  itemCount?: number;
}

export interface OnlineOrdersData {
  records: OnlineOrderItem[];
  totalCount: number;
}

export interface KotItem {
  id: string;
  kotId: number;
  orderType: string;
  customerName: string;
  customerPhone: string;
  itemCount: number;
  itemsText: string;
  items?: Array<{ name: string; quantity: number; notes?: string }>;
  status: "Not Prepared" | "In Kitchen" | "Prepared" | "Served";
  billPrintDate: string;
  completeDuration: string;
  createdAt: string;
  createdTimestamp?: number;
  /** Epoch ms when marked Ready — freezes the KDS timer */
  readyTimestamp?: number;
  isModified?: boolean;
}

export interface KotData {
  records: KotItem[];
  totalCount: number;
}
