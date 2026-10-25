import type {
  RoomServiceOrder,
  HotelRoom,
  RoomServiceKpis,
  RoomFloor,
  RoomServiceOrderStatus,
  RoomOrderItem,
} from "@/types/posRoomService";
import httpClient from "@/utils/httpClient";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { isBackendOutletId } from "@/utils/outletId";

let scopedOutletId: string | undefined;
let scopedPropertyId: string | undefined;
let scopedTenantId: string | undefined;

export function setRoomsOutletScope(scope?: {
  outletId?: string | null;
  propertyId?: string | null;
  tenantId?: string | null;
}) {
  scopedOutletId = scope?.outletId || undefined;
  scopedPropertyId = scope?.propertyId || undefined;
  scopedTenantId = scope?.tenantId || undefined;
}

// Initial mock orders representing various active states
const INITIAL_ORDERS: RoomServiceOrder[] = [
  {
    id: "ord-rs-1",
    orderNumber: "RS-8901",
    roomNumber: "304",
    floor: "Floor 3 (Executive)",
    roomType: "Executive Club",
    guest: {
      name: "Lady Evelyn Vance",
      vipTier: "Platinum",
      checkInDate: "10 Jan 2024",
      checkOutDate: "15 Jan 2024",
      phoneExtension: "304",
    },
    items: [
      {
        id: "item-1",
        name: "Wild Mushroom Risotto with Truffle Oil",
        quantity: 1,
        unitPrice: 28.0,
        specialInstructions: "Extra parmesan on side, no chives",
      },
      {
        id: "item-2",
        name: "Artisan Burrata Salad",
        quantity: 1,
        unitPrice: 18.5,
      },
      {
        id: "item-3",
        name: "San Pellegrino Sparkling (750ml)",
        quantity: 1,
        unitPrice: 9.0,
      },
    ],
    status: "kitchen_prep",
    subtotal: 55.5,
    serviceCharge: 8.32,
    tax: 4.44,
    totalAmount: 68.26,
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    elapsedMinutes: 12,
    estimatedDeliveryTime: "08:15 PM",
    assignedRunner: "Vikram N. (Butler)",
    traySetup: "Full Dining Trolley",
    paymentMethod: "room_folio",
    isUrgent: true,
    notes: "VIP guest celebrating anniversary. Include chef's complimentary macaron sampler.",
  },
  {
    id: "ord-rs-2",
    orderNumber: "RS-8902",
    roomNumber: "208",
    floor: "Floor 2",
    roomType: "Standard Deluxe",
    guest: {
      name: "Arthur Pendelton",
      vipTier: "Silver",
      checkInDate: "11 Jan 2024",
      checkOutDate: "13 Jan 2024",
      phoneExtension: "208",
    },
    items: [
      {
        id: "item-4",
        name: "Club Sandwich with Sweet Potato Fries",
        quantity: 2,
        unitPrice: 19.5,
        modifiers: ["Gluten-free bread", "Mayo on the side"],
      },
      {
        id: "item-5",
        name: "Fresh Orange Juice (Cold Pressed)",
        quantity: 2,
        unitPrice: 7.5,
      },
    ],
    status: "tray_ready",
    subtotal: 54.0,
    serviceCharge: 8.1,
    tax: 4.32,
    totalAmount: 66.42,
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    elapsedMinutes: 20,
    estimatedDeliveryTime: "08:05 PM",
    assignedRunner: "Marcus Chen",
    traySetup: "Single Tray",
    paymentMethod: "room_folio",
    notes: "Thermal cloche covers checked. Deliver before 08:10 PM.",
  },
  {
    id: "ord-rs-3",
    orderNumber: "RS-8903",
    roomNumber: "402",
    floor: "Floor 4 (Suites)",
    roomType: "Presidential Suite",
    guest: {
      name: "Dr. Alexander Wright",
      vipTier: "Platinum",
      checkInDate: "09 Jan 2024",
      checkOutDate: "18 Jan 2024",
      phoneExtension: "402",
    },
    items: [
      {
        id: "item-6",
        name: "Prime Angus Ribeye Steak (Medium Rare)",
        quantity: 1,
        unitPrice: 48.0,
        specialInstructions: "Béarnaise sauce in separate gravy boat",
      },
      {
        id: "item-7",
        name: "Truffle Mashed Potatoes",
        quantity: 1,
        unitPrice: 14.0,
      },
      {
        id: "item-8",
        name: "Château Margaux Red Wine (Half Bottle)",
        quantity: 1,
        unitPrice: 95.0,
      },
    ],
    status: "dispatched",
    subtotal: 157.0,
    serviceCharge: 23.55,
    tax: 12.56,
    totalAmount: 193.11,
    createdAt: new Date(Date.now() - 26 * 60 * 1000).toISOString(),
    elapsedMinutes: 26,
    estimatedDeliveryTime: "07:55 PM",
    assignedRunner: "James Sterling (Head Butler)",
    traySetup: "Full Dining Trolley",
    paymentMethod: "room_folio",
    isUrgent: false,
    notes: "Preset candle and ice bucket on dining trolley.",
  },
  {
    id: "ord-rs-4",
    orderNumber: "RS-8904",
    roomNumber: "114",
    floor: "Floor 1",
    roomType: "Standard Deluxe",
    guest: {
      name: "Sofia Ramirez",
      checkInDate: "11 Jan 2024",
      checkOutDate: "12 Jan 2024",
      phoneExtension: "114",
    },
    items: [
      {
        id: "item-9",
        name: "Classic Margherita Pizza",
        quantity: 1,
        unitPrice: 17.0,
      },
      {
        id: "item-10",
        name: "Iced Lemon Tea",
        quantity: 1,
        unitPrice: 6.0,
      },
    ],
    status: "delivered",
    subtotal: 23.0,
    serviceCharge: 3.45,
    tax: 1.84,
    totalAmount: 28.29,
    createdAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    elapsedMinutes: 48,
    estimatedDeliveryTime: "07:35 PM",
    assignedRunner: "Marcus Chen",
    traySetup: "Single Tray",
    paymentMethod: "card_at_door",
  },
  {
    id: "ord-rs-5",
    orderNumber: "RS-8905",
    roomNumber: "308",
    floor: "Floor 3 (Executive)",
    roomType: "Executive Club",
    guest: {
      name: "Jonathan Higgins",
      vipTier: "Gold",
      checkInDate: "08 Jan 2024",
      checkOutDate: "14 Jan 2024",
      phoneExtension: "308",
    },
    items: [
      {
        id: "item-11",
        name: "Warm Chocolate Lava Cake",
        quantity: 2,
        unitPrice: 12.0,
      },
      {
        id: "item-12",
        name: "Double Espresso",
        quantity: 2,
        unitPrice: 5.5,
      },
    ],
    status: "clearance_needed",
    subtotal: 35.0,
    serviceCharge: 5.25,
    tax: 2.8,
    totalAmount: 43.05,
    createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    elapsedMinutes: 75,
    estimatedDeliveryTime: "07:05 PM",
    assignedRunner: "Vikram N. (Butler)",
    traySetup: "Single Tray",
    paymentMethod: "room_folio",
    notes: "Guest pressed in-room tray clearance buzzer at 07:45 PM.",
  },
];

// Mock rooms across all hotel categories matching the visual room grid from reference image
const INITIAL_ROOMS: HotelRoom[] = [
  // 1. Standard Rooms
  { id: "rm-101", roomNumber: "101", floor: "Floor 1", roomType: "Standard Rooms", isOccupied: false },
  {
    id: "rm-102",
    roomNumber: "102",
    floor: "Floor 1",
    roomType: "Standard Rooms",
    isOccupied: true,
    guest: { name: "Arthur Pendelton", vipTier: "Silver", checkInDate: "11 Jan", checkOutDate: "14 Jan", phoneExtension: "102", pax: 2 },
    activeOrder: INITIAL_ORDERS[1],
  },
  { id: "rm-103", roomNumber: "103", floor: "Floor 1", roomType: "Standard Rooms", isOccupied: false },
  {
    id: "rm-104",
    roomNumber: "104",
    floor: "Floor 1",
    roomType: "Standard Rooms",
    isOccupied: true,
    guest: { name: "Sofia Ramirez", vipTier: "Gold", checkInDate: "10 Jan", checkOutDate: "13 Jan", phoneExtension: "104", pax: 2 },
    activeOrder: INITIAL_ORDERS[3],
  },
  { id: "rm-105", roomNumber: "105", floor: "Floor 1", roomType: "Standard Rooms", isOccupied: false },
  { id: "rm-106", roomNumber: "106", floor: "Floor 1", roomType: "Standard Rooms", isOccupied: false },

  // 2. Deluxe Rooms
  { id: "rm-201", roomNumber: "201", floor: "Floor 2", roomType: "Deluxe Rooms", isOccupied: false },
  {
    id: "rm-202",
    roomNumber: "202",
    floor: "Floor 2",
    roomType: "Deluxe Rooms",
    isOccupied: true,
    guest: { name: "Elena Rostova", vipTier: "Platinum", checkInDate: "09 Jan", checkOutDate: "15 Jan", phoneExtension: "202", pax: 3 },
  },
  {
    id: "rm-203",
    roomNumber: "203",
    floor: "Floor 2",
    roomType: "Deluxe Rooms",
    isOccupied: true,
    guest: { name: "Carlos Mendez", vipTier: "Silver", checkInDate: "10 Jan", checkOutDate: "16 Jan", phoneExtension: "203", pax: 2 },
    activeOrder: INITIAL_ORDERS[0],
  },
  { id: "rm-204", roomNumber: "204", floor: "Floor 2", roomType: "Deluxe Rooms", isOccupied: false },
  { id: "rm-205", roomNumber: "205", floor: "Floor 2", roomType: "Deluxe Rooms", isOccupied: false },

  // 3. Superior Rooms
  { id: "rm-301", roomNumber: "301", floor: "Floor 3", roomType: "Superior Rooms", isOccupied: false },
  { id: "rm-302", roomNumber: "302", floor: "Floor 3", roomType: "Superior Rooms", isOccupied: false },
  { id: "rm-303", roomNumber: "303", floor: "Floor 3", roomType: "Superior Rooms", isOccupied: false },
  {
    id: "rm-304",
    roomNumber: "304",
    floor: "Floor 3",
    roomType: "Superior Rooms",
    isOccupied: true,
    guest: { name: "Lady Evelyn Vance", vipTier: "Platinum", checkInDate: "08 Jan", checkOutDate: "15 Jan", phoneExtension: "304", pax: 4 },
    activeOrder: INITIAL_ORDERS[4],
  },

  // 4. Suite Rooms
  { id: "rm-401", roomNumber: "401", floor: "Floor 4", roomType: "Suite Rooms", isOccupied: false },
  {
    id: "rm-402",
    roomNumber: "402",
    floor: "Floor 4",
    roomType: "Suite Rooms",
    isOccupied: true,
    guest: { name: "Dr. Alexander Wright", vipTier: "Platinum", checkInDate: "09 Jan", checkOutDate: "18 Jan", phoneExtension: "402", pax: 2 },
    activeOrder: INITIAL_ORDERS[2],
  },
  { id: "rm-403", roomNumber: "403", floor: "Floor 4", roomType: "Suite Rooms", isOccupied: false },
];

let ordersStore: RoomServiceOrder[] = [...INITIAL_ORDERS];
let roomsStore: HotelRoom[] = [...INITIAL_ROOMS];

export const posRoomService = {
  getOrders: async (floor?: RoomFloor): Promise<RoomServiceOrder[]> => {
    if (floor && floor !== "All") {
      return ordersStore.filter((o) => o.floor === floor);
    }
    return [...ordersStore];
  },

  getRooms: async (floor?: RoomFloor): Promise<HotelRoom[]> => {
    if (scopedOutletId && isBackendOutletId(scopedOutletId)) {
      if (!scopedPropertyId && !scopedTenantId) return [];
      const res = await httpClient.get(API_ENDPOINTS.ROOM_SERVICE.ROOMS, {
        params: {
          property_id: scopedPropertyId,
          tenant_id: scopedTenantId,
        },
      });
      const rooms = (res.data?.rooms || []) as Array<Record<string, any>>;
      const mapped: HotelRoom[] = rooms.map((r) => ({
        id: String(r.unit_id || r.reservation_id || r.room_number),
        roomNumber: String(r.room_number),
        floor: (r.floor || "Floor 1") as RoomFloor,
        roomType: r.unit_type || "Standard Room",
        isOccupied: true,
        guest: {
          name: r.guest_name || "In-house guest",
          phoneExtension: r.guest_phone || "",
          pax: Number(r.pax || 1),
          checkInDate: r.arrival_date || undefined,
          checkOutDate: r.departure_date || undefined,
        },
        roomUnitId: r.unit_id || undefined,
        reservationId: r.reservation_id || undefined,
        folioId: r.folio_id || undefined,
      }));
      if (floor && floor !== "All") return mapped.filter((r) => r.floor === floor);
      return mapped;
    }
    // Re-link active orders to rooms
    const updated = roomsStore.map((r) => {
      const active = ordersStore.find(
        (o) => o.roomNumber === r.roomNumber && o.status !== "settled",
      );
      return {
        ...r,
        activeOrder: active,
        trayClearancePending: active?.status === "clearance_needed",
      };
    });

    if (floor && floor !== "All") {
      return updated.filter((r) => r.floor === floor);
    }
    return updated;
  },

  getKpis: async (): Promise<RoomServiceKpis> => {
    const active = ordersStore.filter((o) => o.status !== "settled");
    const todayRevenue = ordersStore.reduce((sum, o) => sum + o.totalAmount, 0);
    const kitchenQueueCount = ordersStore.filter((o) => o.status === "kitchen_prep").length;
    const dispatchedCount = ordersStore.filter((o) => o.status === "dispatched").length;
    const pendingClearancesCount = ordersStore.filter(
      (o) => o.status === "clearance_needed",
    ).length;

    return {
      activeOrdersCount: active.length,
      todayRevenue,
      avgDeliveryMinutes: 22,
      pendingClearancesCount,
      kitchenQueueCount,
      dispatchedCount,
    };
  },

  updateOrderStatus: async (
    orderId: string,
    status: RoomServiceOrderStatus,
  ): Promise<RoomServiceOrder> => {
    let targetOrder!: RoomServiceOrder;
    ordersStore = ordersStore.map((o) => {
      if (o.id === orderId) {
        targetOrder = { ...o, status };
        return targetOrder;
      }
      return o;
    });

    return targetOrder;
  },

  assignRunner: async (orderId: string, runnerName: string): Promise<RoomServiceOrder> => {
    let targetOrder!: RoomServiceOrder;
    ordersStore = ordersStore.map((o) => {
      if (o.id === orderId) {
        targetOrder = { ...o, assignedRunner: runnerName, status: "dispatched" };
        return targetOrder;
      }
      return o;
    });

    return targetOrder;
  },

  addOrder: async (
    newOrderData: Omit<RoomServiceOrder, "id" | "createdAt" | "elapsedMinutes">,
  ): Promise<RoomServiceOrder> => {
    const newOrder: RoomServiceOrder = {
      ...newOrderData,
      id: `ord-rs-${Date.now()}`,
      createdAt: new Date().toISOString(),
      elapsedMinutes: 0,
    };

    ordersStore = [newOrder, ...ordersStore];
    return newOrder;
  },

  clearTray: async (orderId: string): Promise<void> => {
    ordersStore = ordersStore.map((o) => {
      if (o.id === orderId) {
        return { ...o, status: "settled" };
      }
      return o;
    });
  },

  addItemsToOrder: async (
    orderId: string,
    newItems: RoomOrderItem[],
  ): Promise<RoomServiceOrder> => {
    let targetOrder!: RoomServiceOrder;
    ordersStore = ordersStore.map((o) => {
      if (o.id === orderId) {
        const mergedItems = [...o.items, ...newItems];
        const newSubtotal = mergedItems.reduce(
          (acc, item) => acc + item.unitPrice * item.quantity,
          0,
        );
        const newServiceCharge = +(newSubtotal * 0.15).toFixed(2);
        const newTax = +(newSubtotal * 0.08).toFixed(2);
        const newTotal = +(newSubtotal + newServiceCharge + newTax).toFixed(2);

        targetOrder = {
          ...o,
          items: mergedItems,
          subtotal: newSubtotal,
          serviceCharge: newServiceCharge,
          tax: newTax,
          totalAmount: newTotal,
          status:
            o.status === "clearance_needed" || o.status === "delivered" ? "kitchen_prep" : o.status,
        };
        return targetOrder;
      }
      return o;
    });

    return targetOrder;
  },
};
