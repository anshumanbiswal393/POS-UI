export type TableStatus = "vacant" | "reserved" | "occupied" | "blocked";

export type TableShape = "rectangle" | "square" | "circle";

export type DiningArea = string;

export interface AddTableInput {
  tableNumber: string;
  capacity: number;
  area: string;
  shape?: TableShape;
}

export interface ReservationItem {
  id: string;
  /** Primary / lead table for this booking */
  tableId: string;
  tableNumber: string;
  /** When party size needs more than one table, all linked table ids */
  mergedTableIds?: string[];
  mergedTableNumbers?: string[];
  isMerged?: boolean;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  guests: number;
  reservationDate: string; // e.g. "2024-01-11" or "Today"
  reservationTime: string; // e.g. "07:30 PM"
  endTime?: string; // e.g. "09:30 PM"
  status: "reserved" | "seated" | "completed" | "cancelled";
  paymentStatus?: "unpaid" | "deposit_paid" | "paid";
  depositAmount?: number;
  notes?: string;
  isVip?: boolean;
  createdAt: string;
}

export interface ActiveOrderSummary {
  orderId: string;
  orderNumber: string;
  serverName: string;
  seatedAt: string; // e.g. "12:45 PM"
  elapsedMinutes: number;
  itemsCount: number;
  subtotal: number;
  totalAmount: number;
  status: "in_prep" | "served" | "billing";
  guestName?: string;
  guestPhone?: string;
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    selectedVariantName?: string;
    notes?: string;
  }>;
}

export interface RestaurantTable {
  id: string;
  tableNumber: string; // e.g. "Table #1"
  tableNumberRaw: number; // e.g. 1
  capacity: number;
  currentGuests?: number;
  shape: TableShape;
  area: DiningArea;
  status: TableStatus;
  activeReservation?: ReservationItem;
  activeOrder?: ActiveOrderSummary;
  position?: { x: number; y: number };
}

export interface TableManagementStats {
  totalTables: number;
  availableCount: number;
  reservedCount: number;
  occupiedCount: number;
  totalCapacity: number;
  seatedGuests: number;
}
