import type {
  RestaurantTable,
  ReservationItem,
  TableManagementStats,
  DiningArea,
} from "@/types/posTables";
import { createDineInOrder, updateDineInOrder } from "./posOrdersService";
import { isBackendOutletId } from "@/utils/outletId";
import httpClient from "@/utils/httpClient";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { liveCreateOrder, livePatchOrder } from "@/services/posOrderLive";

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
    area: dto.section_name || areaName || "Main Dining",
    status: statusMap[String(dto.status || "VACANT").toUpperCase()] || "vacant",
    activeOrder: dto.active_order_id
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
const INITIAL_TABLES: RestaurantTable[] = [
  // Row 1: Table #1 (6 seats, Reserved), Table #2 (2 seats, On Dine), Table #3 (2 seats, Reserved)
  {
    id: "tbl-1",
    tableNumber: "Table #1",
    tableNumberRaw: 1,
    capacity: 6,
    currentGuests: 0,
    shape: "rectangle",
    area: "Main Dining",
    status: "vacant"
  },
  {
    id: "tbl-2",
    tableNumber: "Table #2",
    tableNumberRaw: 2,
    capacity: 2,
    currentGuests: 0,
    shape: "square",
    area: "Main Dining",
    status: "vacant",
  },
  {
    id: "tbl-3",
    tableNumber: "Table #3",
    tableNumberRaw: 3,
    capacity: 2,
    currentGuests: 0,
    shape: "square",
    area: "Main Dining",
    status: "vacant"
  },

  // Row 2: Table #4 (2 seats, On Dine), Table #5 (6 seats, Vacant - NO TAG), Table #6 (7 seats, Reserved)
  {
    id: "tbl-4",
    tableNumber: "Table #4",
    tableNumberRaw: 4,
    capacity: 2,
    currentGuests: 0,
    shape: "square",
    area: "Main Dining",
    status: "vacant",
  },
  {
    id: "tbl-5",
    tableNumber: "Table #5",
    tableNumberRaw: 5,
    capacity: 6,
    currentGuests: 0,
    shape: "rectangle",
    area: "Main Dining",
    status: "vacant", // VACANT -> NO TAG as requested!
  },
  {
    id: "tbl-6",
    tableNumber: "Table #6",
    tableNumberRaw: 6,
    capacity: 7,
    currentGuests: 0,
    shape: "rectangle",
    area: "Main Dining",
    status: "vacant"
  },

  // Row 3: Table #7 (10 seats, Reserved), Table #8 (2 seats, On Dine), Table #9 (4 seats, On Dine)
  {
    id: "tbl-7",
    tableNumber: "Table #7",
    tableNumberRaw: 7,
    capacity: 10,
    currentGuests: 0,
    shape: "rectangle",
    area: "Main Dining",
    status: "vacant"
  },
  {
    id: "tbl-8",
    tableNumber: "Table #8",
    tableNumberRaw: 8,
    capacity: 2,
    currentGuests: 0,
    shape: "square",
    area: "Main Dining",
    status: "vacant",
  },
  {
    id: "tbl-9",
    tableNumber: "Table #9",
    tableNumberRaw: 9,
    capacity: 4,
    currentGuests: 0,
    shape: "square",
    area: "Main Dining",
    status: "vacant",
  },

  // Row 4: Table #10 (2 seats, On Dine), Table #11 (2 seats, Reserved), Table #12 (8 seats, Reserved)
  {
    id: "tbl-10",
    tableNumber: "Table #10",
    tableNumberRaw: 10,
    capacity: 2,
    currentGuests: 0,
    shape: "square",
    area: "Main Dining",
    status: "vacant",
  },
  {
    id: "tbl-11",
    tableNumber: "Table #11",
    tableNumberRaw: 11,
    capacity: 2,
    currentGuests: 0,
    shape: "square",
    area: "Main Dining",
    status: "vacant"
  },
  {
    id: "tbl-12",
    tableNumber: "Table #12",
    tableNumberRaw: 12,
    capacity: 8,
    currentGuests: 0,
    shape: "rectangle",
    area: "Main Dining",
    status: "vacant"
  },

  // Terrace Area Tables
  {
    id: "tbl-t1",
    tableNumber: "Table #T1",
    tableNumberRaw: 101,
    capacity: 4,
    currentGuests: 0,
    shape: "square",
    area: "Terrace",
    status: "vacant",
  },
  {
    id: "tbl-t2",
    tableNumber: "Table #T2",
    tableNumberRaw: 102,
    capacity: 4,
    currentGuests: 0,
    shape: "square",
    area: "Terrace",
    status: "vacant",
  },
  {
    id: "tbl-t3",
    tableNumber: "Table #T3",
    tableNumberRaw: 103,
    capacity: 6,
    currentGuests: 0,
    shape: "rectangle",
    area: "Terrace",
    status: "vacant",
  },
  {
    id: "tbl-t4",
    tableNumber: "Table #T4",
    tableNumberRaw: 104,
    capacity: 2,
    currentGuests: 0,
    shape: "square",
    area: "Terrace",
    status: "vacant",
  },

  // Outdoor Area Tables
  {
    id: "tbl-o1",
    tableNumber: "Table #O1",
    tableNumberRaw: 201,
    capacity: 4,
    currentGuests: 0,
    shape: "square",
    area: "Outdoor",
    status: "vacant",
  },
  {
    id: "tbl-o2",
    tableNumber: "Table #O2",
    tableNumberRaw: 202,
    capacity: 6,
    currentGuests: 0,
    shape: "rectangle",
    area: "Outdoor",
    status: "vacant",
  },
  {
    id: "tbl-o3",
    tableNumber: "Table #O3",
    tableNumberRaw: 203,
    capacity: 4,
    currentGuests: 0,
    shape: "square",
    area: "Outdoor",
    status: "vacant",
  },
];

// Legacy mock store (non-UUID demo ids only). Real DB outlets start empty per outlet.
type TableBucket = {
  areas: string[];
  tables: RestaurantTable[];
  reservations: ReservationItem[];
};

const legacyBucket: TableBucket = {
  areas: ["Main Dining", "Terrace", "Outdoor"],
  tables: [...INITIAL_TABLES],
  reservations: [],
};
const outletBuckets = new Map<string, TableBucket>();
let scopedOutletId: string | undefined;

/** Scope table/reservation mutations to the active outlet (empty for new UUID outlets). */
export function setTablesOutletScope(outletId?: string | null) {
  scopedOutletId = outletId || undefined;
}

function isLiveFloor() {
  return Boolean(scopedOutletId && isBackendOutletId(scopedOutletId));
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
    if (isLiveFloor()) {
      const res = await httpClient.get(API_ENDPOINTS.TABLES.AREAS, {
        params: { outlet_id: scopedOutletId, outletId: scopedOutletId, page_size: 200 },
      });
      return unwrapRows<any>(res.data).map((s) => String(s.name));
    }
    return [...store().areas];
  },

  addArea: async (areaName: string): Promise<string[]> => {
    const trimmed = areaName.trim();
    if (isLiveFloor()) {
      await httpClient.post(API_ENDPOINTS.TABLES.AREAS, {
        outlet: scopedOutletId,
        name: trimmed,
        is_active: true,
      });
      return posTablesService.getAreas();
    }
    if (trimmed && !store().areas.includes(trimmed)) {
      store().areas = [...store().areas, trimmed];
    }
    return [...store().areas];
  },

  addTable: async (input: {
    tableNumber: string;
    capacity: number;
    area: string;
    shape?: "rectangle" | "square" | "circle";
  }): Promise<RestaurantTable> => {
    if (isLiveFloor()) {
      const sectionsRes = await httpClient.get(API_ENDPOINTS.TABLES.AREAS, {
        params: { outlet_id: scopedOutletId, outletId: scopedOutletId, page_size: 200 },
      });
      const sections = unwrapRows<any>(sectionsRes.data);
      let section = sections.find(
        (s) => String(s.name).toLowerCase() === (input.area || "").trim().toLowerCase(),
      );
      if (!section) {
        try {
          const created = await httpClient.post(API_ENDPOINTS.TABLES.AREAS, {
            outlet: scopedOutletId,
            name: input.area || "Main Dining",
            is_active: true,
          });
          section = created.data;
        } catch {
          const retryRes = await httpClient.get(API_ENDPOINTS.TABLES.AREAS, {
            params: { outlet_id: scopedOutletId, outletId: scopedOutletId, page_size: 200 },
          });
          const rows = unwrapRows<any>(retryRes.data);
          section =
            rows.find(
              (s) => String(s.name).toLowerCase() === (input.area || "").trim().toLowerCase(),
            ) || rows[0];
        }
      }
      if (!section?.id) {
        throw new Error("Unable to create or locate dining section.");
      }
      const shapeApi =
        input.shape === "circle" ? "ROUND" : input.shape === "rectangle" ? "RECTANGLE" : "SQUARE";
      const res = await httpClient.post(API_ENDPOINTS.TABLES.LIST, {
        section: section.id,
        table_number: input.tableNumber.replace(/^Table\s*#?/i, "").trim() || input.tableNumber,
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
      area: input.area || "Main Dining",
      status: "vacant",
    };

    store().tables = [...store().tables, newTable];
    return newTable;
  },

  getTables: async (area?: DiningArea): Promise<RestaurantTable[]> => {
    if (isLiveFloor()) {
      const res = await httpClient.get(API_ENDPOINTS.TABLES.LIST, {
        params: { outlet_id: scopedOutletId, outletId: scopedOutletId, page_size: 500 },
      });
      const mapped = unwrapRows<any>(res.data).map((row) => mapApiTable(row, area));
      if (area) return mapped.filter((t) => t.area === area);
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

    if (area) {
      return current.filter((t) => t.area === area);
    }
    return current;
  },

  getReservations: async (): Promise<ReservationItem[]> => {
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
    if (isLiveFloor() && scopedOutletId) {
      const tables = await posTablesService.getTables();
      const targetTable = tables.find((t) => t.id === input.tableId);
      const created = await liveCreateOrder({
        outletId: scopedOutletId,
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
    let targetTable = store().tables.find((t) => t.id === input.tableId);
    const tableNumber = targetTable?.tableNumber || `Table #${input.tableId}`;
    const section = targetTable?.area || "Main Dining";

    // 1. Sync to POS Live Orders & KOT ledger
    const { orderNumber, kotId } = createDineInOrder({
      tableId: input.tableId,
      tableNumber,
      section,
      waiterName: input.waiterName || "Captain",
      pax: input.pax,
      guestName: input.guestName,
      guestPhone: input.guestPhone,
      items: input.items,
      subtotal: input.subtotal,
      grandTotal: input.grandTotal,
    });

    // 2. Update Table Store state
    let updatedTable!: RestaurantTable;
    store().tables = store().tables.map((tbl) => {
      if (tbl.id === input.tableId) {
        updatedTable = {
          ...tbl,
          status: "occupied",
          currentGuests: input.pax,
          activeOrder: {
            orderId: `ord-${Date.now()}`,
            orderNumber,
            serverName: input.waiterName || "Captain",
            seatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            elapsedMinutes: 1,
            itemsCount: input.items.reduce((s, i) => s + i.quantity, 0),
            subtotal: input.subtotal,
            totalAmount: input.grandTotal,
            status: "in_prep",
            guestName: input.guestName,
            guestPhone: input.guestPhone,
            items: input.items,
          },
        };
        return updatedTable;
      }
      return tbl;
    });

    return { table: updatedTable, orderNumber, kotId };
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
    if (isLiveFloor() && scopedOutletId) {
      const tables = await posTablesService.getTables();
      const targetTable = tables.find((t) => t.id === input.tableId);
      const orderId = targetTable?.activeOrder?.orderId;
      if (!orderId || !isBackendOutletId(orderId)) {
        throw new Error("This table has no live order to update. Place the order again.");
      }
      const patched = await livePatchOrder(orderId, {
        outletId: scopedOutletId,
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
    let targetTable = store().tables.find((t) => t.id === input.tableId);
    const tableNumber = targetTable?.tableNumber || `Table #${input.tableId}`;

    const { kotId } = updateDineInOrder({
      tableId: input.tableId,
      tableNumber,
      waiterName: targetTable?.activeOrder?.serverName || "Captain",
      guestName: targetTable?.activeOrder?.guestName,
      guestPhone: targetTable?.activeOrder?.guestPhone,
      items: input.items,
      subtotal: input.subtotal,
      grandTotal: input.grandTotal,
      modifiedSummaryText: input.modifiedSummaryText,
    });

    let updatedTable!: RestaurantTable;
    store().tables = store().tables.map((tbl) => {
      if (tbl.id === input.tableId && tbl.activeOrder) {
        updatedTable = {
          ...tbl,
          activeOrder: {
            ...tbl.activeOrder,
            itemsCount: input.items.reduce((s, i) => s + i.quantity, 0),
            subtotal: input.subtotal,
            totalAmount: input.grandTotal,
            items: input.items,
          },
        };
        return updatedTable;
      }
      return tbl;
    });

    return { table: updatedTable || targetTable, kotId };
  },
};

