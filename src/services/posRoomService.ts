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
import { mergeHighwayDemoRooms } from "@/lib/highwayInnDemo";
import { liveCreateOrder, liveGetCurrent, livePatchOrder } from "@/services/posOrderLive";

let scopedOutletId: string | undefined;
let scopedPropertyId: string | undefined;
let scopedTenantId: string | undefined;
let scopedHighwayDemo = false;

export function setRoomsOutletScope(scope?: {
  outletId?: string | null;
  propertyId?: string | null;
  tenantId?: string | null;
  highwayDemo?: boolean;
}) {
  scopedOutletId = scope?.outletId || undefined;
  scopedPropertyId = scope?.propertyId || undefined;
  scopedTenantId = scope?.tenantId || undefined;
  if (typeof scope?.highwayDemo === "boolean") scopedHighwayDemo = scope.highwayDemo;
}

// Initial mock orders representing various active states
const INITIAL_ORDERS: RoomServiceOrder[] = [];

// Mock rooms across all hotel categories matching the visual room grid from reference image
const INITIAL_ROOMS: HotelRoom[] = [];

let ordersStore: RoomServiceOrder[] = [];
let roomsStore: HotelRoom[] = [...INITIAL_ROOMS];

function attachLocalFolioOrders(rooms: HotelRoom[]): HotelRoom[] {
  return rooms.map((r) => {
    const roomOrders = ordersStore.filter((o) => o.roomNumber === r.roomNumber);
    if (!roomOrders.length) return r;
    const folioOrders = [
      ...(r.folioOrders || []),
      ...roomOrders
        .filter((o) => !(r.folioOrders || []).some((f) => f.orderNumber === o.orderNumber))
        .map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          totalAmount: o.totalAmount,
          itemsSummary: o.items.map((i) => `${i.name} × ${i.quantity}`).join(", "),
          items: o.items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          createdAt: o.createdAt,
          paymentMode: "Add to Room Folio",
          status: o.status,
        })),
    ];
    return {
      ...r,
      folioOrders,
      posChargeTotal: folioOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    };
  });
}

export const posRoomService = {
  getOrders: async (floor?: RoomFloor): Promise<RoomServiceOrder[]> => {
    if (scopedOutletId && isBackendOutletId(scopedOutletId)) {
      const current = await liveGetCurrent(scopedOutletId);
      const mapped: RoomServiceOrder[] = current
        .filter((o) => o.type === "room_service" && !o.held)
        .map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          roomNumber: String(o.roomNumber || o.tableOrRoom || "").replace(/^Room\s+/i, ""),
          floor: "Floor 1",
          roomType: "Standard Room",
          guest: {
            name: o.customerName,
            phoneExtension: o.customerPhone,
            pax: o.pax,
          },
          items: (o.items || []).map((i) => ({
            id: String(i.id),
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.price,
            specialInstructions: i.notes,
          })),
          status: o.isSettled ? "settled" : "kitchen_prep",
          subtotal: o.subtotal,
          serviceCharge: 0,
          tax: Math.max(0, o.amount - o.subtotal),
          totalAmount: o.amount,
          createdAt: new Date(o.createdTimestamp || Date.now()).toISOString(),
          elapsedMinutes: o.elapsedMinutes,
          assignedRunner: o.waiterName,
          traySetup: "Single Tray",
          paymentMethod: "room_folio",
          notes: o.orderNote,
        }));
      if (floor && floor !== "All") return mapped.filter((o) => o.floor === floor);
      return mapped;
    }
    if (floor && floor !== "All") {
      return ordersStore.filter((o) => o.floor === floor);
    }
    return [...ordersStore];
  },

  getRooms: async (floor?: RoomFloor): Promise<HotelRoom[]> => {
    if (scopedOutletId && isBackendOutletId(scopedOutletId)) {
      if (!scopedPropertyId && !scopedTenantId) {
        return scopedHighwayDemo ? mergeHighwayDemoRooms([]) : [];
      }
      let mapped: HotelRoom[] = [];
      try {
        const res = await httpClient.get(API_ENDPOINTS.ROOM_SERVICE.ROOMS, {
          params: {
            property_id: scopedPropertyId,
            tenant_id: scopedTenantId,
          },
        });
        const rooms = (res.data?.rooms || []) as Array<Record<string, any>>;
        mapped = rooms.map((r) => ({
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
        folioOrders: (r.pos_orders || r.posOrders || []).map((o: Record<string, any>) => ({
          id: String(o.id),
          orderNumber: String(o.orderNumber || o.order_number || ""),
          totalAmount: Number(o.totalAmount ?? o.total_amount ?? 0),
          itemsSummary: String(o.itemsSummary || o.items_summary || ""),
          items: (o.items || []).map((it: Record<string, any>) => ({
            name: String(it.name || ""),
            quantity: Number(it.quantity || 1),
            unitPrice: Number(it.unitPrice ?? it.unit_price ?? 0),
          })),
          createdAt: String(o.createdAt || o.created_at || ""),
          paymentMode: String(o.paymentMode || o.payment_mode || "Add to Room Folio"),
          status: String(o.status || ""),
        })),
        posChargeTotal: Number(r.pos_charge_total ?? r.posChargeTotal ?? 0),
      }));
      } catch {
        mapped = [];
      }
      const roomsForOutlet = scopedHighwayDemo ? mergeHighwayDemoRooms(mapped) : mapped;
      const withLocalFolio = scopedHighwayDemo
        ? attachLocalFolioOrders(roomsForOutlet)
        : roomsForOutlet;
      if (floor && floor !== "All") return withLocalFolio.filter((r) => r.floor === floor);
      return withLocalFolio;
    }
    if (scopedHighwayDemo) {
      const withOrders = attachLocalFolioOrders(mergeHighwayDemoRooms([]));
      if (floor && floor !== "All") return withOrders.filter((r) => r.floor === floor);
      return withOrders;
    }
    // Re-link active orders to rooms
    const updated = roomsStore.map((r) => {
      const roomOrders = ordersStore.filter((o) => o.roomNumber === r.roomNumber);
      const active = roomOrders.find((o) => o.status !== "settled");
      const folioOrders = roomOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        totalAmount: o.totalAmount,
        itemsSummary: o.items
          .map((i) => `${i.name} × ${i.quantity}`)
          .join(", "),
        items: o.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        createdAt: o.createdAt,
        paymentMode: "Add to Room Folio",
        status: o.status,
      }));
      return {
        ...r,
        activeOrder: active,
        trayClearancePending: active?.status === "clearance_needed",
        folioOrders,
        posChargeTotal: folioOrders.reduce((sum, o) => sum + o.totalAmount, 0),
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
    if (scopedOutletId && isBackendOutletId(scopedOutletId)) {
      const rooms = await posRoomService.getRooms();
      const room = rooms.find((r) => r.roomNumber === newOrderData.roomNumber);
      const created = await liveCreateOrder({
        outletId: scopedOutletId,
        orderType: "room_service",
        roomNumber: newOrderData.roomNumber,
        roomUnitId: room?.roomUnitId,
        reservationId: room?.reservationId,
        folioId: room?.folioId,
        guestName: newOrderData.guest?.name,
        guestPhone: newOrderData.guest?.phoneExtension,
        waiterName: newOrderData.assignedRunner,
        pax: newOrderData.guest?.pax || 1,
        orderNote: newOrderData.notes,
        subtotal: newOrderData.subtotal,
        taxAmount: newOrderData.tax,
        serviceCharge: newOrderData.serviceCharge,
        grandTotal: newOrderData.totalAmount,
        sendKot: true,
        items: newOrderData.items.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.unitPrice,
          notes: i.specialInstructions,
        })),
      });
      return {
        ...newOrderData,
        id: String(created.id),
        orderNumber: String(created.orderNumber || newOrderData.orderNumber),
        createdAt: new Date().toISOString(),
        elapsedMinutes: 0,
      };
    }
    throw new Error("Choose a saved outlet so this room order can be stored in the database.");
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
    if (scopedOutletId && isBackendOutletId(scopedOutletId) && isBackendOutletId(orderId)) {
      const current = (await liveGetCurrent(scopedOutletId)).find((o) => o.id === orderId);
      const merged = [
        ...(current?.items || []).map((i) => ({
          id: String(i.id),
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          notes: i.notes,
        })),
        ...newItems.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.unitPrice,
          notes: i.specialInstructions,
        })),
      ];
      await livePatchOrder(orderId, {
        outletId: scopedOutletId,
        items: merged,
        sendKot: true,
        held: false,
      });
      const orders = await posRoomService.getOrders();
      const found = orders.find((o) => o.id === orderId);
      if (!found) throw new Error("Could not update room order");
      return found;
    }
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
