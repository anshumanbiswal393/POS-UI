
function mapBackendReservation(r: any): ReservationItem {
  const tableNumbers = Array.isArray(r.table_numbers) ? r.table_numbers : [];
  const tableIds = Array.isArray(r.table_ids) ? r.table_ids : [];
  const primaryTableId = tableIds[0] || "";
  const primaryTableNumber = tableNumbers[0] || "Table";

  let status: "reserved" | "seated" | "completed" | "cancelled" = "reserved";
  const st = String(r.status || "").toUpperCase();
  if (st === "SEATED") status = "seated";
  else if (st === "COMPLETED") status = "completed";
  else if (st === "CANCELLED" || st === "NO_SHOW") status = "cancelled";

  return {
    id: r.id,
    tableId: primaryTableId,
    tableNumber: primaryTableNumber,
    mergedTableIds: tableIds.length > 1 ? tableIds : undefined,
    mergedTableNumbers: tableNumbers.length > 1 ? tableNumbers : undefined,
    isMerged: tableIds.length > 1,
    customerName: r.guest_name || "Guest",
    customerPhone: r.guest_phone || "",
    customerEmail: r.guest_email || undefined,
    guests: r.pax || 2,
    reservationDate: r.reservation_date || "",
    reservationTime: r.start_time || "",
    endTime: r.end_time || undefined,
    status,
    notes: r.notes || r.special_requests || undefined,
    isVip: Boolean(r.is_vip),
    createdAt: r.created_at || new Date().toISOString(),
  };
}

import type {
  RestaurantTable,
  ReservationItem,
  TableManagementStats,
  DiningArea,
} from "@/types/posTables";
import { isBackendOutletId } from "@/utils/outletId";
import httpClient from "@/utils/httpClient";
import { liveGetCurrent } from "./posOrderLive";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { liveCreateOrder, livePatchOrder } from "@/services/posOrderLive";
import { mergeHighwayDemoAreas, mergeHighwayDemoTables } from "@/lib/highwayInnDemo";

function unwrapRows<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}

function mapApiTable(dto: Record<string, any>, areaName?: string): RestaurantTable {
  const raw = parseInt(String(dto.table_number || "").replace(/\D/g, ""), 10) || 0;
  const statusMap: Record<string, RestaurantTable["status"]> = {
    VACANT: "vacant",
    RESERVED: "reserved",
    OCCUPIED: "occupied",
    BILLED: "occupied",
    DIRTY: "occupied",
  };
  const shapeMap: Record<string, RestaurantTable["shape"]> = {
    SQUARE: "square",
    ROUND: "circle",
    CIRCLE: "circle",
    RECTANGLE: "rectangle",
  };
  const label = String(dto.table_number || raw);
  return {
    id: String(dto.id),
    tableNumber: label.toLowerCase().startsWith("table") ? label : `Table #${label}`,
    tableNumberRaw: raw,
    capacity: Number(dto.capacity || 2),
    currentGuests: dto.status === "OCCUPIED" || dto.status === "BILLED" ? Number(dto.capacity || 0) : 0,
    shape: shapeMap[String(dto.shape || "").toUpperCase()] || "square",
    area: dto.section_name || areaName || "",
    status: statusMap[String(dto.status || "VACANT").toUpperCase()] || "vacant",
    activeOrder: dto.active_order
      ? {
          orderId: String(dto.active_order.orderId || dto.active_order_id),
          orderNumber: dto.active_order.orderNumber || "",
          serverName: dto.active_order.serverName || dto.active_waiter_name || "Captain",
          seatedAt: dto.active_order.seatedAt || "",
          elapsedMinutes: Number(dto.active_order.elapsedMinutes || 0),
          itemsCount: Number(dto.active_order.itemsCount || 0),
          subtotal: Number(dto.active_order.subtotal || 0),
          totalAmount: Number(dto.active_order.totalAmount || 0),
          status: dto.active_order.status || "in_prep",
          guestName: dto.active_order.guestName,
          guestPhone: dto.active_order.guestPhone,
        }
      : dto.active_order_id
      ? {
          orderId: String(dto.active_order_id),
          orderNumber: "",
          serverName: dto.active_waiter_name || "Captain",
          seatedAt: "",
          elapsedMinutes: 0,
          itemsCount: 0,
          subtotal: 0,
          totalAmount: 0,
          status: "in_prep",
        }
      : undefined,
  };
}

// Initial mock reservations matching the provided design
const INITIAL_RESERVATIONS: ReservationItem[] = [];

// Initial tables mirroring the visual floor layout in screenshot
const INITIAL_TABLES: RestaurantTable[] = [];

// Legacy mock store (non-UUID demo ids only). Real DB outlets start empty per outlet.
type TableBucket = {
  areas: string[];
  tables: RestaurantTable[];
  reservations: ReservationItem[];
};

const legacyBucket: TableBucket = {
  areas: [],
  tables: [...INITIAL_TABLES],
  reservations: [],
};
const outletBuckets = new Map<string, TableBucket>();
let scopedOutletId: string | undefined;
let scopedHighwayDemo = false;

export function cleanOutletId(id?: string | null): string | undefined {
  if (!id) return undefined;
  const clean = id.replace(/^outlet-/, "");
  if (isBackendOutletId(clean)) return clean;
  if (isBackendOutletId(id)) return id;
  return undefined;
}

/** Scope table/reservation mutations to the active outlet (empty for new UUID outlets). */
export function setTablesOutletScope(outletId?: string | null, highwayDemo?: boolean) {
  scopedOutletId = outletId || undefined;
  if (typeof highwayDemo === "boolean") scopedHighwayDemo = highwayDemo;
}

function isLiveFloor() {
  const cid = cleanOutletId(scopedOutletId);
  return Boolean(cid && isBackendOutletId(cid));
}

function store(): TableBucket {
  if (isLiveFloor()) {
    let b = outletBuckets.get(scopedOutletId as string);
    if (!b) {
      b = { areas: [], tables: [], reservations: [] };
      outletBuckets.set(scopedOutletId as string, b);
    }
    return b;
  }
  return legacyBucket;
}

async function patchTableStatus(
  tableId: string,
  status: "VACANT" | "OCCUPIED" | "RESERVED" | "BILLED" | "DIRTY",
  extra?: Record<string, unknown>,
) {
  await httpClient.patch(API_ENDPOINTS.TABLES.STATUS(tableId), {
    status,
    ...extra,
  });
}

export const posTablesService = {
  getAreas: async (): Promise<string[]> => {
    const cid = cleanOutletId(scopedOutletId);
    if (cid) {
      try {
        const res = await httpClient.get(API_ENDPOINTS.TABLES.AREAS, {
          params: { outlet_id: cid, outletId: cid, page_size: 200 },
        });
        const names = unwrapRows<any>(res.data)
          .map((s) => String(s.name || "").trim())
          .filter(Boolean);
        return Array.from(new Set(names));
      } catch (err) {
        console.error("Failed to fetch areas from DB", err);
      }
    }
    const local = [...store().areas];
    return Array.from(new Set(local));
  },

  addArea: async (areaName: string): Promise<string[]> => {
    const trimmed = areaName.trim();
    if (!trimmed) return posTablesService.getAreas();
    const cid = cleanOutletId(scopedOutletId);
    if (cid) {
      try {
        await httpClient.post(API_ENDPOINTS.TABLES.AREAS, {
          outlet: cid,
          name: trimmed,
          is_active: true,
        });
      } catch (err) {
        console.warn("Section creation returned error or already exists", err);
      }
      return posTablesService.getAreas();
    }
    if (!store().areas.includes(trimmed)) {
      store().areas = [...store().areas, trimmed];
    }
    return [...store().areas];
  },

  updateArea: async (oldName: string, newName: string): Promise<string[]> => {
    const trimmed = newName.trim();
    if (!trimmed || oldName.trim().toLowerCase() === trimmed.toLowerCase()) {
      return posTablesService.getAreas();
    }

    const cid = cleanOutletId(scopedOutletId);
    if (cid) {
      try {
        const res = await httpClient.get(API_ENDPOINTS.TABLES.AREAS, {
          params: { outlet_id: cid, outletId: cid, page_size: 200 },
        });
        const sections = unwrapRows<any>(res.data);
        const section = sections.find(
          (s) => String(s.name).trim().toLowerCase() === oldName.trim().toLowerCase(),
        );
        if (section?.id) {
          await httpClient.patch(`${API_ENDPOINTS.TABLES.AREAS}${section.id}/`, {
            name: trimmed,
          });
        }
      } catch (err) {
        console.error("Failed to update area in DB", err);
      }
      return posTablesService.getAreas();
    }

    const idx = store().areas.findIndex((a) => a.toLowerCase() === oldName.toLowerCase());
    if (idx !== -1) {
      store().areas[idx] = trimmed;
      store().tables.forEach((t) => {
        if (t.area.toLowerCase() === oldName.toLowerCase()) {
          t.area = trimmed;
        }
      });
    }
    return [...store().areas];
  },

  deleteArea: async (areaName: string): Promise<string[]> => {
    const trimmed = areaName.trim();
    const cid = cleanOutletId(scopedOutletId);
    if (cid) {
      try {
        const res = await httpClient.get(API_ENDPOINTS.TABLES.AREAS, {
          params: { outlet_id: cid, outletId: cid, page_size: 200 },
        });
        const sections = unwrapRows<any>(res.data);
        const section = sections.find(
          (s) => String(s.name).trim().toLowerCase() === trimmed.toLowerCase(),
        );
        if (section?.id) {
          await httpClient.delete(`${API_ENDPOINTS.TABLES.AREAS}${section.id}/`);
        }
      } catch (err) {
        console.error("Failed to delete area in DB", err);
      }
      return posTablesService.getAreas();
    }

    store().areas = store().areas.filter((a) => a.toLowerCase() !== trimmed.toLowerCase());
    return [...store().areas];
  },

  addTable: async (input: {
    tableNumber: string;
    capacity: number;
    area: string;
    shape?: "rectangle" | "square" | "circle";
  }): Promise<RestaurantTable> => {
    const cid = cleanOutletId(scopedOutletId);
    if (cid) {
      const sectionsRes = await httpClient.get(API_ENDPOINTS.TABLES.AREAS, {
        params: { outlet_id: cid, outletId: cid, page_size: 200 },
      });
      const sections = unwrapRows<any>(sectionsRes.data);
      let section = sections.find(
        (s) => String(s.name).trim().toLowerCase() === (input.area || "").trim().toLowerCase(),
      );
      if (!section) {
        try {
          const created = await httpClient.post(API_ENDPOINTS.TABLES.AREAS, {
            outlet: cid,
            name: input.area || "Dining Area",
            is_active: true,
          });
          section = created.data;
        } catch {
          const retryRes = await httpClient.get(API_ENDPOINTS.TABLES.AREAS, {
            params: { outlet_id: cid, outletId: cid, page_size: 200 },
          });
          const rows = unwrapRows<any>(retryRes.data);
          section =
            rows.find(
              (s) => String(s.name).trim().toLowerCase() === (input.area || "").trim().toLowerCase(),
            ) || rows[0];
        }
      }
      if (!section?.id) {
        throw new Error("Unable to create or locate dining section.");
      }
      const shapeApi =
        input.shape === "circle" ? "ROUND" : input.shape === "rectangle" ? "RECTANGLE" : "SQUARE";
      const cleanNum = input.tableNumber.replace(/^Table\s*#?/i, "").trim() || input.tableNumber;
      const res = await httpClient.post(API_ENDPOINTS.TABLES.LIST, {
        section: section.id,
        table_number: cleanNum,
        capacity: input.capacity,
        shape: shapeApi,
        status: "VACANT",
        is_active: true,
      });
      return mapApiTable(res.data, input.area);
    }
    const rawNum = parseInt(input.tableNumber.replace(/\D/g, ""), 10) || store().tables.length + 1;
    const defaultShape = input.capacity >= 6 ? "rectangle" : "square";

    const newTable: RestaurantTable = {
      id: `tbl-${Date.now()}`,
      tableNumber: input.tableNumber.startsWith("Table #")
        ? input.tableNumber
        : input.tableNumber.startsWith("#")
          ? `Table ${input.tableNumber}`
          : `Table #${input.tableNumber}`,
      tableNumberRaw: rawNum,
      capacity: input.capacity,
      currentGuests: 0,
      shape: input.shape || defaultShape,
      area: input.area || "Dining Area",
      status: "vacant",
    };

    store().tables = [...store().tables, newTable];
    return newTable;
  },

  deleteTable: async (tableId: string): Promise<boolean> => {
    const cid = cleanOutletId(scopedOutletId);
    if (cid && isBackendOutletId(tableId)) {
      await httpClient.delete(`${API_ENDPOINTS.TABLES.LIST}${tableId}/`);
      return true;
    }
    store().tables = store().tables.filter((t) => t.id !== tableId);
    return true;
  },

  getTables: async (area?: DiningArea): Promise<RestaurantTable[]> => {
    const cid = cleanOutletId(scopedOutletId);
    if (cid) {
      let mapped: RestaurantTable[] = [];
      try {
        const res = await httpClient.get(API_ENDPOINTS.TABLES.LIST, {
          params: { outlet_id: cid, outletId: cid, page_size: 500 },
        });
        mapped = unwrapRows<any>(res.data).map((row) => mapApiTable(row, area));
      } catch (err) {
        console.error("Failed to fetch tables from DB", err);
        mapped = [];
      }
      mapped = mapped.filter((t) => Boolean(t.area && t.area.trim()));

      // Hydrate active orders on occupied tables if order details/amount are missing
      const needsHydration = mapped.some(
        (t) => t.status === "occupied" && (!t.activeOrder || !t.activeOrder.totalAmount)
      );
      if (needsHydration) {
        try {
          const currentOrders = await liveGetCurrent(cid);
          if (currentOrders && currentOrders.length > 0) {
            mapped = mapped.map((tbl) => {
              if (tbl.status !== "occupied") return tbl;
              const matched = currentOrders.find((co) => {
                if (co.tableId && co.tableId === tbl.id) return true;
                const tblClean = tbl.tableNumber.toLowerCase().replace(/[^0-9a-z]/g, "");
                const orderSrcClean = (co.tableOrRoom || co.source || "").toLowerCase().replace(/[^0-9a-z]/g, "");
                return tblClean && orderSrcClean && (tblClean.includes(orderSrcClean) || orderSrcClean.includes(tblClean));
              });
              if (matched) {
                return {
                  ...tbl,
                  activeOrder: {
                    orderId: matched.id,
                    orderNumber: matched.orderNumber,
                    serverName: matched.waiterName || tbl.activeOrder?.serverName || "Captain",
                    seatedAt: matched.startTime || "",
                    elapsedMinutes: Math.max(1, matched.elapsedMinutes || 0),
                    itemsCount: matched.items?.length || 0,
                    subtotal: matched.subtotal || matched.amount,
                    totalAmount: matched.amount,
                    status: matched.currentStage === "placed" ? "in_prep" : "served",
                    guestName: matched.customerName,
                    guestPhone: matched.customerPhone,
                  },
                };
              }
              return tbl;
            });
          }
        } catch (e) {
          console.warn("Could not hydrate table active order details from liveGetCurrent:", e);
        }
      }

      if (area && area.trim()) {
        const target = area.trim().toLowerCase();
        return mapped.filter((t) => (t.area || "").trim().toLowerCase() === target);
      }
      return mapped;
    }
    // Re-link reservations in case status changed
    const current = store().tables.map((tbl) => {
      const activeRes = store().reservations.find(
        (r) => r.tableId === tbl.id && (r.status === "reserved" || r.status === "seated"),
      );
      return {
        ...tbl,
        activeReservation: activeRes,
      };
    });

    const forOutlet = scopedHighwayDemo ? mergeHighwayDemoTables(current) : current;
    if (area) {
      return forOutlet.filter((t) => t.area === area);
    }
    return forOutlet;
  },

  getReservations: async (): Promise<ReservationItem[]> => {
    if (isLiveFloor()) {
      try {
        const res = await httpClient.get(API_ENDPOINTS.TABLES.RESERVATIONS, {
          params: { outlet_id: scopedOutletId, page_size: 100 },
        });
        const rows = unwrapRows<any>(res.data);
        if (rows.length > 0) {
          return rows.map(mapBackendReservation);
        }
      } catch (err) {
        console.warn("Could not fetch live table reservations, falling back to local:", err);
      }
      const tables = await posTablesService.getTables();
      const liveReservations: ReservationItem[] = [];
      tables.forEach((t) => {
        if (t.status === "reserved" && t.activeReservation) {
          liveReservations.push(t.activeReservation);
        }
      });
      const liveIds = new Set(liveReservations.map((r) => r.id));
      const extra = store().reservations.filter((r) => !liveIds.has(r.id));
      return [...liveReservations, ...extra];
    }
    return [...store().reservations];
  },

  getStats: async (area?: DiningArea): Promise<TableManagementStats> => {
    const list = isLiveFloor()
      ? await posTablesService.getTables(area)
      : area
        ? store().tables.filter((t) => t.area === area)
        : store().tables;
    const totalTables = list.length;
    const availableCount = list.filter((t) => t.status === "vacant").length;
    const reservedCount = list.filter((t) => t.status === "reserved").length;
    const occupiedCount = list.filter((t) => t.status === "occupied").length;
    const totalCapacity = list.reduce((acc, t) => acc + t.capacity, 0);
    const seatedGuests = list.reduce((acc, t) => acc + (t.currentGuests || 0), 0);

    return {
      totalTables,
      availableCount,
      reservedCount,
      occupiedCount,
      totalCapacity,
      seatedGuests,
    };
  },

  addReservation: async (
    data: Omit<ReservationItem, "id" | "createdAt" | "status">,
  ): Promise<ReservationItem> => {
    if (isLiveFloor()) {
      const mergedIds =
        data.mergedTableIds && data.mergedTableIds.length > 0
          ? Array.from(new Set([data.tableId, ...data.mergedTableIds]))
          : [data.tableId];

      try {
        const payload = {
          outlet: scopedOutletId,
          guest_name: data.customerName,
          guest_phone: data.customerPhone || "N/A",
          guest_email: data.customerEmail || undefined,
          pax: data.guests,
          reservation_date: data.reservationDate.includes("Today") || !data.reservationDate ? new Date().toISOString().split("T")[0] : data.reservationDate,
          start_time: data.reservationTime.length === 5 ? `${data.reservationTime}:00` : data.reservationTime,
          table_ids: mergedIds.filter(isBackendOutletId),
          notes: data.notes || undefined,
          is_vip: Boolean(data.isVip),
        };
        const res = await httpClient.post(API_ENDPOINTS.TABLES.RESERVATIONS, payload);
        const saved = mapBackendReservation(res.data);

        // Also update table statuses on floor
        for (const id of mergedIds) {
          if (isBackendOutletId(id)) {
            await patchTableStatus(id, "RESERVED", {
              notes: data.notes || `Reserved for ${data.customerName}`,
              active_waiter_name: data.customerName,
            });
          }
        }
        return saved;
      } catch (err) {
        console.warn("Backend reservation creation failed, applying floor status:", err);
        for (const id of mergedIds) {
          if (isBackendOutletId(id)) {
            await patchTableStatus(id, "RESERVED", {
              notes: data.notes || `Reserved for ${data.customerName}`,
              active_waiter_name: data.customerName,
            });
          }
        }
        return {
          ...data,
          tableId: mergedIds[0],
          id: mergedIds[0],
          status: "reserved",
          createdAt: new Date().toISOString(),
        };
      }
    }
    const mergedIds =
      data.mergedTableIds && data.mergedTableIds.length > 0
        ? Array.from(new Set([data.tableId, ...data.mergedTableIds]))
        : [data.tableId];
    const mergedNumbers = mergedIds.map(
      (id) => store().tables.find((t) => t.id === id)?.tableNumber || id,
    );
    const isMerged = mergedIds.length > 1;

    const newReservation: ReservationItem = {
      ...data,
      tableId: mergedIds[0],
      tableNumber: mergedNumbers[0],
      mergedTableIds: isMerged ? mergedIds : undefined,
      mergedTableNumbers: isMerged ? mergedNumbers : undefined,
      isMerged,
      id: `res-${Date.now()}`,
      status: "reserved",
      createdAt: new Date().toISOString(),
    };

    store().reservations = [newReservation, ...store().reservations];

    // Book every linked table under the same guest reservation
    store().tables = store().tables.map((tbl) => {
      if (mergedIds.includes(tbl.id)) {
        return {
          ...tbl,
          status: "reserved" as const,
          currentGuests: data.guests,
          activeReservation: newReservation,
        };
      }
      return tbl;
    });

    return newReservation;
  },

  seatGuests: async (tableId: string, reservationId?: string): Promise<RestaurantTable> => {
    if (isLiveFloor()) {
      if (reservationId && isBackendOutletId(reservationId)) {
        try {
          await httpClient.post(API_ENDPOINTS.TABLES.SEAT_RESERVATION(reservationId));
        } catch (e) {
          console.warn("Could not post seat to backend reservation:", e);
        }
      }
      await patchTableStatus(tableId, "OCCUPIED");
      const tables = await posTablesService.getTables();
      const found = tables.find((t) => t.id === tableId);
      if (!found) throw new Error("Table not found");
      return found;
    }
    let reservation: ReservationItem | undefined;

    if (reservationId) {
      store().reservations = store().reservations.map((r) => {
        if (r.id === reservationId) {
          reservation = { ...r, status: "seated" };
          return reservation;
        }
        return r;
      });
    }

    const linkedIds =
      reservation?.mergedTableIds && reservation.mergedTableIds.length > 0
        ? reservation.mergedTableIds
        : [tableId];

    const activeOrder = {
      orderId: `ord-${Date.now()}`,
      orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      serverName: "Captain Jack",
      seatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      elapsedMinutes: 1,
      itemsCount: 0,
      subtotal: 0,
      totalAmount: 0,
      status: "in_prep" as const,
      guestName: reservation?.customerName,
      guestPhone: reservation?.customerPhone,
    };

    let updatedTable!: RestaurantTable;
    store().tables = store().tables.map((tbl) => {
      if (linkedIds.includes(tbl.id)) {
        const next = {
          ...tbl,
          status: "occupied" as const,
          currentGuests: reservation ? reservation.guests : tbl.capacity,
          activeReservation: reservation,
          activeOrder,
        };
        if (tbl.id === tableId || tbl.id === linkedIds[0]) updatedTable = next;
        return next;
      }
      return tbl;
    });

    return updatedTable;
  },

  cancelReservation: async (reservationId: string): Promise<void> => {
    if (isLiveFloor() && isBackendOutletId(reservationId)) {
      try {
        await httpClient.post(API_ENDPOINTS.TABLES.CANCEL_RESERVATION(reservationId));
      } catch (e) {
        console.warn("Could not cancel reservation on backend:", e);
      }
    }
    let linkedTableIds: string[] = [];

    store().reservations = store().reservations.map((r) => {
      if (r.id === reservationId) {
        linkedTableIds =
          r.mergedTableIds && r.mergedTableIds.length > 0
            ? r.mergedTableIds
            : r.tableId
              ? [r.tableId]
              : [];
        return { ...r, status: "cancelled" };
      }
      return r;
    });

    if (linkedTableIds.length > 0) {
      store().tables = store().tables.map((tbl) => {
        if (linkedTableIds.includes(tbl.id)) {
          return {
            ...tbl,
            status: "vacant",
            currentGuests: 0,
            activeReservation: undefined,
          };
        }
        return tbl;
      });
    }
  },

  vacateTable: async (tableId: string): Promise<RestaurantTable> => {
    if (isLiveFloor()) {
      await patchTableStatus(tableId, "VACANT");
      const tables = await posTablesService.getTables();
      const found = tables.find((t) => t.id === tableId);
      if (!found) throw new Error("Table not found");
      return found;
    }
    let updatedTable!: RestaurantTable;

    store().tables = store().tables.map((tbl) => {
      if (tbl.id === tableId) {
        updatedTable = {
          ...tbl,
          status: "vacant",
          currentGuests: 0,
          activeReservation: undefined,
          activeOrder: undefined,
        };
        return updatedTable;
      }
      return tbl;
    });

    // Mark any active reservation for this table as completed
    store().reservations = store().reservations.map((r) => {
      if (r.tableId === tableId && (r.status === "reserved" || r.status === "seated")) {
        return { ...r, status: "completed" };
      }
      return r;
    });

    return updatedTable;
  },

  createTableOrder: async (input: {
    tableId: string;
    waiterName?: string;
    pax: number;
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
  }): Promise<{ table: RestaurantTable; orderNumber: string; kotId: number }> => {
    const cid = cleanOutletId(scopedOutletId);
    if (cid) {
      const tables = await posTablesService.getTables();
      const targetTable = tables.find((t) => t.id === input.tableId);
      const created = await liveCreateOrder({
        outletId: cid,
        orderType: "dine_in",
        tableId: input.tableId,
        tableNumber: targetTable?.tableNumber,
        section: targetTable?.area,
        waiterName: input.waiterName,
        pax: input.pax,
        guestName: input.guestName,
        guestPhone: input.guestPhone,
        subtotal: input.subtotal,
        grandTotal: input.grandTotal,
        sendKot: true,
        items: input.items,
      });
      const refreshed = (await posTablesService.getTables()).find((t) => t.id === input.tableId);
      return {
        table: refreshed || targetTable || tables[0],
        orderNumber: String(created?.orderNumber || created?.order_number || ""),
        kotId: Number(created?.kotId || created?.kot_id || 0),
      };
    }
    throw new Error("Choose a saved outlet so this table order can be stored in the database.");
  },

  updateTableOrder: async (input: {
    tableId: string;
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
  }): Promise<{ table: RestaurantTable; kotId: number }> => {
    const cid = cleanOutletId(scopedOutletId);
    if (cid) {
      const tables = await posTablesService.getTables();
      const targetTable = tables.find((t) => t.id === input.tableId);
      const orderId = targetTable?.activeOrder?.orderId;
      if (!orderId || !isBackendOutletId(orderId)) {
        throw new Error("This table has no live order to update. Place the order again.");
      }
      const patched = await livePatchOrder(orderId, {
        outletId: cid,
        items: input.items,
        subtotal: input.subtotal,
        grandTotal: input.grandTotal,
        sendKot: true,
        orderNote: input.modifiedSummaryText,
      });
      const refreshed = (await posTablesService.getTables()).find((t) => t.id === input.tableId);
      return {
        table: refreshed || targetTable || tables[0],
        kotId: Number(patched?.kotId || patched?.kot_id || 0),
      };
    }
    throw new Error("Choose a saved outlet so this table order can be stored in the database.");
  },
};

