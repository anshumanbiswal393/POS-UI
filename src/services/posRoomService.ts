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
import { getStoredPropertyId, getStoredSubdomain } from "@/utils/cookieAuth";

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
    // 1. Resolve active property and tenant
    let resolvedPropId = scopedPropertyId;
    if (!resolvedPropId && typeof window !== "undefined") {
      resolvedPropId =
        getStoredPropertyId() ||
        localStorage.getItem("retrod:active-property-id") ||
        localStorage.getItem("retrod_property_id") ||
        (scopedOutletId?.startsWith("outlet-") ? scopedOutletId.replace(/^outlet-/, "") : undefined) ||
        undefined;
    }

    let resolvedTenant = scopedTenantId;
    if (!resolvedTenant && typeof window !== "undefined") {
      resolvedTenant =
        getStoredSubdomain() ||
        localStorage.getItem("retrod:active-subdomain") ||
        localStorage.getItem("retrod_tenant_subdomain") ||
        undefined;
    }

    // 2. Query occupied rooms from POS integration endpoint
    let occupiedList: Array<Record<string, any>> = [];
    if (resolvedPropId || resolvedTenant) {
      try {
        const res = await httpClient.get(API_ENDPOINTS.ROOM_SERVICE.ROOMS, {
          params: {
            ...(resolvedPropId ? { property_id: resolvedPropId } : {}),
            ...(resolvedTenant ? { tenant_id: resolvedTenant } : {}),
          },
        });
        occupiedList = (res.data?.rooms || []) as Array<Record<string, any>>;
      } catch (e) {
        console.warn("Failed to fetch occupied rooms:", e);
      }
    }

    // 3. Query inventory units to populate vacant doors alongside occupied doors
    let unitsList: Array<Record<string, any>> = [];
    const typesMap = new Map<string, string>();

    if (resolvedPropId || resolvedTenant) {
      try {
        const [unitsRes, typesRes] = await Promise.all([
          httpClient.get("/api/inventory/units/", {
            params: {
              ...(resolvedPropId ? { property_id: resolvedPropId } : {}),
              limit: 1000,
            },
          }),
          httpClient.get("/api/inventory/types/", {
            params: {
              ...(resolvedPropId ? { property_id: resolvedPropId } : {}),
              limit: 500,
            },
          }).catch(() => ({ data: [] })),
        ]);

        const rawUnits =
          unitsRes.data?.results || (Array.isArray(unitsRes.data) ? unitsRes.data : []);
        unitsList = rawUnits.filter((u: any) => {
          if (!u) return false;
          if (
            resolvedPropId &&
            u.property &&
            u.property !== resolvedPropId &&
            u.property_id !== resolvedPropId
          ) {
            return false;
          }
          return true;
        });

        const rawTypes =
          typesRes.data?.results || (Array.isArray(typesRes.data) ? typesRes.data : []);
        for (const t of rawTypes) {
          if (t && t.id && t.name) {
            typesMap.set(String(t.id), String(t.name));
          }
        }
      } catch (e) {
        // Fall back to occupied rooms if inventory endpoint is not accessible
      }
    }

    const occByRoomNum = new Map<string, Record<string, any>>();
    const occByUnitId = new Map<string, Record<string, any>>();
    for (const occ of occupiedList) {
      if (occ.room_number) occByRoomNum.set(String(occ.room_number).trim().toLowerCase(), occ);
      if (occ.unit_id) occByUnitId.set(String(occ.unit_id), occ);
    }

    let mapped: HotelRoom[] = [];
    if (unitsList.length > 0) {
      const seenUnitIds = new Set<string>();
      mapped = unitsList.map((unit) => {
        seenUnitIds.add(String(unit.id));
        const occ =
          occByUnitId.get(String(unit.id)) ||
          occByRoomNum.get(String(unit.name || "").trim().toLowerCase());

        const typeName =
          occ?.unit_type ||
          (unit.inventory_unit_type && typesMap.get(String(unit.inventory_unit_type))) ||
          unit.unit_type_name ||
          "Standard Room";

        if (occ) {
          return {
            id: String(occ.unit_id || occ.reservation_id || unit.id),
            roomNumber: String(occ.room_number || unit.name),
            floor: (occ.floor || unit.floor_name || "Floor 1") as RoomFloor,
            roomType: typeName,
            isOccupied: true,
            guest: {
              name: occ.guest_name || "In-house guest",
              phoneExtension: occ.guest_phone || "",
              pax: Number(occ.pax || 1),
              checkInDate: occ.arrival_date || undefined,
              checkOutDate: occ.departure_date || undefined,
            },
            roomUnitId: String(occ.unit_id || unit.id),
            reservationId: occ.reservation_id || undefined,
            folioId: occ.folio_id || undefined,
            folioOrders: (occ.pos_orders || occ.posOrders || []).map((o: Record<string, any>) => ({
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
            posChargeTotal: Number(occ.pos_charge_total ?? occ.posChargeTotal ?? 0),
          };
        }

        return {
          id: String(unit.id),
          roomNumber: String(unit.name),
          floor: (unit.floor_name || "Floor 1") as RoomFloor,
          roomType: typeName,
          isOccupied: false,
          guest: undefined,
          roomUnitId: String(unit.id),
          posChargeTotal: 0,
          folioOrders: [],
        };
      });

      for (const occ of occupiedList) {
        if (
          !seenUnitIds.has(String(occ.unit_id)) &&
          !mapped.some((m) => m.roomNumber === String(occ.room_number))
        ) {
          mapped.push({
            id: String(occ.unit_id || occ.reservation_id || occ.room_number),
            roomNumber: String(occ.room_number),
            floor: (occ.floor || "Floor 1") as RoomFloor,
            roomType: occ.unit_type || "Standard Room",
            isOccupied: true,
            guest: {
              name: occ.guest_name || "In-house guest",
              phoneExtension: occ.guest_phone || "",
              pax: Number(occ.pax || 1),
              checkInDate: occ.arrival_date || undefined,
              checkOutDate: occ.departure_date || undefined,
            },
            roomUnitId: occ.unit_id || undefined,
            reservationId: occ.reservation_id || undefined,
            folioId: occ.folio_id || undefined,
            folioOrders: (occ.pos_orders || occ.posOrders || []).map((o: Record<string, any>) => ({
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
            posChargeTotal: Number(occ.pos_charge_total ?? occ.posChargeTotal ?? 0),
          });
        }
      }
    } else if (occupiedList.length > 0) {
      mapped = occupiedList.map((occ) => ({
        id: String(occ.unit_id || occ.reservation_id || occ.room_number),
        roomNumber: String(occ.room_number),
        floor: (occ.floor || "Floor 1") as RoomFloor,
        roomType: occ.unit_type || "Standard Room",
        isOccupied: true,
        guest: {
          name: occ.guest_name || "In-house guest",
          phoneExtension: occ.guest_phone || "",
          pax: Number(occ.pax || 1),
          checkInDate: occ.arrival_date || undefined,
          checkOutDate: occ.departure_date || undefined,
        },
        roomUnitId: occ.unit_id || undefined,
        reservationId: occ.reservation_id || undefined,
        folioId: occ.folio_id || undefined,
        folioOrders: (occ.pos_orders || occ.posOrders || []).map((o: Record<string, any>) => ({
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
        posChargeTotal: Number(occ.pos_charge_total ?? occ.posChargeTotal ?? 0),
      }));
    }

    if (mapped.length > 0) {
      mapped.sort((a, b) =>
        a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true, sensitivity: "base" }),
      );
      const roomsForOutlet = scopedHighwayDemo ? mergeHighwayDemoRooms(mapped) : mapped;
      const withLocalFolio = attachLocalFolioOrders(roomsForOutlet);
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
