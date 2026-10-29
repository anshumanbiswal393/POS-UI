export type RoomServiceOrderStatus =
  | "kitchen_prep"
  | "tray_ready"
  | "dispatched"
  | "delivered"
  | "clearance_needed"
  | "settled";

export type RoomType = "Standard Room" | "Executive Room" | "Deluxe Room" | "Royal Deluxe" | string;

export type RoomFloor =
  | "All"
  | "Floor 1"
  | "Floor 2"
  | "Floor 3"
  | "Floor 4"
  | "Floor 3 (Executive)"
  | "Floor 4 (Suites)";

export interface RoomGuest {
  name: string;
  vipTier?: "Silver" | "Gold" | "Platinum";
  checkInDate?: string;
  checkOutDate?: string;
  phoneExtension?: string;
  /** In-house party size (adults + children) for room service billing */
  pax?: number;
}

export interface RoomOrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  modifiers?: string[];
  specialInstructions?: string;
}

export interface RoomServiceOrder {
  id: string;
  orderNumber: string; // e.g. "RS-4081"
  roomNumber: string; // e.g. "304"
  floor: RoomFloor;
  roomType: RoomType;
  guest: RoomGuest;
  items: RoomOrderItem[];
  status: RoomServiceOrderStatus;
  subtotal: number;
  serviceCharge: number;
  tax: number;
  totalAmount: number;
  createdAt: string; // ISO string
  elapsedMinutes: number;
  estimatedDeliveryTime?: string; // e.g. "08:15 PM"
  assignedRunner?: string; // e.g. "Rahul S. (Butler)"
  traySetup: "Single Tray" | "Full Dining Trolley" | "Wine & Ice Service";
  paymentMethod: "room_folio" | "card_at_door" | "cash_on_delivery" | "complimentary";
  isUrgent?: boolean;
  notes?: string;
}

export interface RoomFolioOrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface RoomFolioOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  itemsSummary: string;
  items: RoomFolioOrderItem[];
  createdAt: string;
  paymentMode: string;
  status: string;
}

export interface HotelRoom {
  id: string;
  roomNumber: string;
  floor: RoomFloor;
  roomType: RoomType;
  isOccupied: boolean;
  guest?: RoomGuest;
  activeOrder?: RoomServiceOrder;
  trayClearancePending?: boolean;
  roomUnitId?: string;
  reservationId?: string;
  folioId?: string;
  folioOrders?: RoomFolioOrder[];
  posChargeTotal?: number;
}

export interface RoomServiceKpis {
  activeOrdersCount: number;
  todayRevenue: number;
  avgDeliveryMinutes: number;
  pendingClearancesCount: number;
  kitchenQueueCount: number;
  dispatchedCount: number;
}
