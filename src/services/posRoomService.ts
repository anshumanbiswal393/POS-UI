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
const INITIAL_ORDERS: RoomServiceOrder[] = [];

// Mock rooms across all hotel categories matching the visual room grid from reference image
const INITIAL_ROOMS: HotelRoom[] = [
  // 1. Standard Rooms
  { id: "rm-101", roomNumber: "101", floor: "Floor 1", roomType: "Standard Rooms", isOccupied: false },
  { id: "rm-102", roomNumber: "102", floor: "Floor 1", roomType: "Standard Rooms", isOccupied: false },
  { id: "rm-103", roomNumber: "103", floor: "Floor 1", roomType: "Standard Rooms", isOccupied: false },
  { id: "rm-104", roomNumber: "104", floor: "Floor 1", roomType: "Standard Rooms", isOccupied: false },
  { id: "rm-105", roomNumber: "105", floor: "Floor 1", roomType: "Standard Rooms", isOccupied: false },
  { id: "rm-106", roomNumber: "106", floor: "Floor 1", roomType: "Standard Rooms", isOccupied: false },

  // 2. Deluxe Rooms
  { id: "rm-201", roomNumber: "201", floor: "Floor 2", roomType: "Deluxe Rooms", isOccupied: false },
  { id: "rm-202", roomNumber: "202", floor: "Floor 2", roomType: "Deluxe Rooms", isOccupied: false },
  { id: "rm-203", roomNumber: "203", floor: "Floor 2", roomType: "Deluxe Rooms", isOccupied: false },
  { id: "rm-204", roomNumber: "204", floor: "Floor 2", roomType: "Deluxe Rooms", isOccupied: false },
  { id: "rm-205", roomNumber: "205", floor: "Floor 2", roomType: "Deluxe Rooms", isOccupied: false },

  // 3. Superior Rooms
  { id: "rm-301", roomNumber: "301", floor: "Floor 3", roomType: "Superior Rooms", isOccupied: false },
  { id: "rm-302", roomNumber: "302", floor: "Floor 3", roomType: "Superior Rooms", isOccupied: false },
  { id: "rm-303", roomNumber: "303", floor: "Floor 3", roomType: "Superior Rooms", isOccupied: false },
  { id: "rm-304", roomNumber: "304", floor: "Floor 3", roomType: "Superior Rooms", isOccupied: false },

  // 4. Suite Rooms
  { id: "rm-401", roomNumber: "401", floor: "Floor 4", roomType: "Suite Rooms", isOccupied: false },
  { id: "rm-402", roomNumber: "402", floor: "Floor 4", roomType: "Suite Rooms", isOccupied: false },
  { id: "rm-403", roomNumber: "403", floor: "Floor 4", roomType: "Suite Rooms", isOccupied: false },
];

let ordersStore: RoomServiceOrder[] = [];
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
