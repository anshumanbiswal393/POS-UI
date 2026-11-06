export function toIsoDate(str?: string): string {
  if (!str || str.toLowerCase().includes("today")) {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function to24HourTime(str?: string): string {
  if (!str) return "19:00:00";
  const trimmed = str.trim();
  const m24 = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
  if (m24) {
    return `${m24[1].padStart(2, "0")}:${m24[2]}:${m24[3] || "00"}`;
  }
  const m12 = trimmed.match(/^([0-1]?\d):([0-5]\d)\s*(AM|PM)$/i);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const m = m12[2];
    const mer = m12[3].toUpperCase();
    if (mer === "PM" && h < 12) h += 12;
    if (mer === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${m}:00`;
  }
  return "19:00:00";
}

export function toDisplayTime(str?: string): string {
  if (!str) return "";
  const trimmed = str.trim();
  const m12 = trimmed.match(/^([0-1]?\d):([0-5]\d)\s*(AM|PM)$/i);
  if (m12) return trimmed;
  const m24 = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)/);
  if (m24) {
    let h = parseInt(m24[1], 10);
    const m = m24[2];
    const mer = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${String(h).padStart(2, "0")}:${m} ${mer}`;
  }
  return trimmed;
}

export function parseReservationDateTime(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr || !timeStr) return null;
  const iso = toIsoDate(dateStr);
  const t24 = to24HourTime(timeStr);
  const [yyyy, mm, dd] = iso.split("-").map(Number);
  const [hh, min, ss] = t24.split(":").map(Number);
  if (isNaN(yyyy) || isNaN(mm) || isNaN(dd) || isNaN(hh) || isNaN(min)) return null;
  const d = new Date(yyyy, mm - 1, dd, hh, min, ss || 0);
  return isNaN(d.getTime()) ? null : d;
}

export function isReservationActiveNow(res: ReservationItem, now: Date = new Date()): boolean {
  if (res.status !== "reserved") return false;
  const start = parseReservationDateTime(res.reservationDate, res.reservationTime);
  if (!start) return false;
  let end: Date;
  if (res.endTime) {
    end = parseReservationDateTime(res.reservationDate, res.endTime) || new Date(start.getTime() + 2 * 60 * 60 * 1000);
  } else {
    end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  }
  return now.getTime() >= start.getTime() && now.getTime() <= end.getTime();
}

export function minutesUntilReservation(res: ReservationItem, now: Date = new Date()): number {
  const start = parseReservationDateTime(res.reservationDate, res.reservationTime);
  if (!start) return 9999;
  return Math.round((start.getTime() - now.getTime()) / (60 * 1000));
}

export function isReservationUpcomingWithin30Min(res: ReservationItem, now: Date = new Date()): boolean {
  if (res.status !== "reserved") return false;
  const mins = minutesUntilReservation(res, now);
  return mins >= 0 && mins <= 30;
}

function getStoredReservations(outletId?: string): ReservationItem[] {
  const effective =
    outletId ||
    scopedOutletId ||
    (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null) ||
    "default";
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(`retrod_pos_reservations_${effective}`) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredReservations(outletId: string | undefined, list: ReservationItem[]): void {
  const effective =
    outletId ||
    scopedOutletId ||
    (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null) ||
    "default";
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(`retrod_pos_reservations_${effective}`, JSON.stringify(list));
    }
  } catch (e) {
    console.warn("Failed to save reservations to localStorage:", e);
  }
}

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

export const DEFAULT_FALLBACK_TABLES: RestaurantTable[] = [];

// Initial tables start completely empty - real database outlets only
const INITIAL_TABLES: RestaurantTable[] = [];

// Legacy mock store (non-UUID demo ids only). Real DB outlets start empty per outlet.

type TableBucket = {

  areas: string[];

  tables: RestaurantTable[];

  reservations: ReservationItem[];

};

const legacyBucket: TableBucket = {

  areas: [],

  tables: [],

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

  const effectiveId = scopedOutletId || (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null);
    const cid = cleanOutletId(effectiveId);

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

    const effectiveId = scopedOutletId || (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null);
    const cid = cleanOutletId(effectiveId);

    let names: string[] = [];

    if (cid) {

      try {

        const res = await httpClient.get(API_ENDPOINTS.TABLES.AREAS, {

          params: { outlet_id: cid, outletId: cid, page_size: 200 },

        });

        names = unwrapRows<any>(res.data)

          .map((s) => String(s.name || "").trim())

          .filter(Boolean);

      } catch (err) {

        console.error("Failed to fetch areas from DB", err);

      }

    }

    if (names.length === 0) {

      const local = [...store().areas];

      names = local.length > 0 ? local : ["Outdoor", "Indoor", "Terrace"];

    }

    return Array.from(new Set(names));

  },

  addArea: async (areaName: string): Promise<string[]> => {

    const trimmed = areaName.trim();

    if (!trimmed) return posTablesService.getAreas();

    const effectiveId = scopedOutletId || (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null);
    const cid = cleanOutletId(effectiveId);

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

    const effectiveId = scopedOutletId || (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null);
    const cid = cleanOutletId(effectiveId);

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

    const effectiveId = scopedOutletId || (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null);
    const cid = cleanOutletId(effectiveId);

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

    const effectiveId = scopedOutletId || (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null);
    const cid = cleanOutletId(effectiveId);

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

    const effectiveId = scopedOutletId || (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null);
    const cid = cleanOutletId(effectiveId);

    if (cid && isBackendOutletId(tableId)) {

      await httpClient.delete(`${API_ENDPOINTS.TABLES.LIST}${tableId}/`);

      return true;

    }

    store().tables = store().tables.filter((t) => t.id !== tableId);

    return true;

  },

  getTables: async (area?: DiningArea, outletIdOverride?: string): Promise<RestaurantTable[]> => {
    const effectiveId =
      outletIdOverride ||
      scopedOutletId ||
      (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null);
    const cid = cleanOutletId(effectiveId);
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
      // Guarantee each table has an area label
      mapped = mapped.map((t) => ({
        ...t,
        area: t.area && t.area.trim() ? t.area : "Dining Area",
      }));

      // Real tables only from DB - zero hardcoded mock fallbacks

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

      // Dynamic table reservation state based on actual reservation timing
      const allReservations = getStoredReservations(cid);
      const now = new Date();

      mapped = mapped.map((tbl) => {
        // Occupied tables with active dining orders always stay occupied
        if (tbl.status === "occupied" || tbl.activeOrder?.orderId) {
          return tbl;
        }

        // Find active reservation for this table whose scheduled time has arrived
        const activeRes = allReservations.find(
          (r) =>
            r.status === "reserved" &&
            (r.tableId === tbl.id ||
              r.mergedTableIds?.includes(tbl.id) ||
              r.tableNumber === tbl.tableNumber) &&
            isReservationActiveNow(r, now),
        );

        if (activeRes) {
          return {
            ...tbl,
            status: "reserved" as const,
            activeReservation: activeRes,
          };
        }

        // If the table was marked RESERVED in backend DB previously, but the reservation
        // time has not arrived yet (or is past/completed), display table as VACANT ("Available")
        if (tbl.status === "reserved") {
          // Asynchronously self-heal backend status back to VACANT
          if (isBackendOutletId(tbl.id)) {
            patchTableStatus(tbl.id, "VACANT").catch(() => {});
          }
          return {
            ...tbl,
            status: "vacant" as const,
            activeReservation: undefined,
          };
        }

        return tbl;
      });

      if (area && area.trim() && area !== "All Zones" && area !== "All Areas") {
        const target = area.trim().toLowerCase();
        return mapped.filter((t) => (t.area || "").trim().toLowerCase() === target);
      }
      return mapped;
    }

    return store().tables;
  },

  getReservations: async (): Promise<ReservationItem[]> => {
    const effectiveOutlet =
      scopedOutletId ||
      (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null) ||
      undefined;
    const localStored = getStoredReservations(effectiveOutlet);

    let backendRows: ReservationItem[] = [];
    if (isLiveFloor()) {
      try {
        const res = await httpClient.get(API_ENDPOINTS.TABLES.RESERVATIONS, {
          params: { outlet_id: scopedOutletId, page_size: 200 },
        });
        const rows = unwrapRows<any>(res.data);
        if (rows.length > 0) {
          backendRows = rows.map(mapBackendReservation);
        }
      } catch (err) {
        console.warn("Could not fetch live table reservations, falling back to local:", err);
      }
    }

    // Merge backend and local reservations by ID
    const map = new Map<string, ReservationItem>();
    localStored.forEach((r) => map.set(r.id, r));
    store().reservations.forEach((r) => {
      const existing = map.get(r.id);
      if (!existing || existing.status === "reserved" || r.status === "completed") {
        map.set(r.id, { ...existing, ...r });
      }
    });

    backendRows.forEach((r) => {
      const existing = map.get(r.id);
      if (existing) {
        map.set(r.id, {
          ...r,
          status: existing.status === "completed" ? "completed" : r.status,
          reservationDate: toIsoDate(r.reservationDate),
          reservationTime: toDisplayTime(r.reservationTime),
        });
      } else {
        map.set(r.id, {
          ...r,
          reservationDate: toIsoDate(r.reservationDate),
          reservationTime: toDisplayTime(r.reservationTime),
        });
      }
    });

    const result = Array.from(map.values()).sort((a, b) => {
      const dateA = a.reservationDate || "";
      const dateB = b.reservationDate || "";
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (b.reservationTime || "").localeCompare(a.reservationTime || "");
    });

    saveStoredReservations(effectiveOutlet, result);
    store().reservations = result;

    return result;
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
    const effectiveOutlet =
      scopedOutletId ||
      (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null) ||
      undefined;

    const mergedIds =
      data.mergedTableIds && data.mergedTableIds.length > 0
        ? Array.from(new Set([data.tableId, ...data.mergedTableIds]))
        : [data.tableId];

    const tables = store().tables.length > 0 ? store().tables : await posTablesService.getTables();
    const mergedNumbers = mergedIds.map(
      (id) => tables.find((t) => t.id === id)?.tableNumber || id,
    );
    const isMerged = mergedIds.length > 1;

    const isoDate = toIsoDate(data.reservationDate);
    const time24 = to24HourTime(data.reservationTime);
    const displayTime = toDisplayTime(data.reservationTime);
    const displayEndTime = data.endTime ? toDisplayTime(data.endTime) : undefined;

    const newReservation: ReservationItem = {
      ...data,
      id: `res-${Date.now()}`,
      tableId: mergedIds[0],
      tableNumber: mergedNumbers.join(" + ") || data.tableNumber,
      mergedTableIds: isMerged ? mergedIds : undefined,
      mergedTableNumbers: isMerged ? mergedNumbers : undefined,
      isMerged,
      reservationDate: isoDate,
      reservationTime: displayTime,
      endTime: displayEndTime,
      status: "reserved",
      createdAt: new Date().toISOString(),
    };

    const isCurrentActive = isReservationActiveNow(newReservation);

    if (isLiveFloor()) {
      try {
        const payload = {
          outlet: scopedOutletId,
          guest_name: data.customerName,
          guest_phone: data.customerPhone || "N/A",
          guest_email: data.customerEmail || undefined,
          pax: data.guests,
          reservation_date: isoDate,
          start_time: time24,
          table_ids: mergedIds.filter(isBackendOutletId),
          notes: data.notes || undefined,
          is_vip: Boolean(data.isVip),
        };

        const res = await httpClient.post(API_ENDPOINTS.TABLES.RESERVATIONS, payload);
        const saved = mapBackendReservation(res.data);
        newReservation.id = saved.id;
        newReservation.tableNumber = saved.tableNumber || newReservation.tableNumber;
      } catch (err) {
        console.warn("Backend reservation creation failed or offline, saving locally:", err);
      }

      // ONLY mark table as RESERVED if the scheduled reservation time has arrived!
      // Do not mark reserved before the reservation time.
      if (isCurrentActive) {
        for (const id of mergedIds) {
          if (isBackendOutletId(id)) {
            await patchTableStatus(id, "RESERVED", {
              notes: data.notes || `Reserved for ${data.customerName}`,
              active_waiter_name: data.customerName,
            }).catch(() => {});
          }
        }
      }
    }

    // Persist to localStorage and in-memory store
    const stored = getStoredReservations(effectiveOutlet);
    const updatedStored = [newReservation, ...stored.filter((r) => r.id !== newReservation.id)];
    saveStoredReservations(effectiveOutlet, updatedStored);
    store().reservations = [newReservation, ...store().reservations.filter((r) => r.id !== newReservation.id)];

    // Only mark table reserved on the floor if reservation is currently active
    if (isCurrentActive) {
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
    }

    return newReservation;
  },

  seatGuests: async (tableId: string, reservationId?: string): Promise<RestaurantTable> => {
    const effectiveOutlet =
      scopedOutletId ||
      (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null) ||
      undefined;

    if (isLiveFloor()) {
      if (reservationId && isBackendOutletId(reservationId)) {
        try {
          await httpClient.post(API_ENDPOINTS.TABLES.SEAT_RESERVATION(reservationId));
        } catch (e) {
          console.warn("Could not post seat to backend reservation:", e);
        }
      }
      await patchTableStatus(tableId, "OCCUPIED").catch(() => {});
    }

    // Mark reservation status as "completed" (maintained in reservation list)
    let seatedReservation: ReservationItem | undefined;
    const stored = getStoredReservations(effectiveOutlet);
    const updatedStored = stored.map((r) => {
      const isTarget = reservationId
        ? r.id === reservationId
        : (r.tableId === tableId || r.mergedTableIds?.includes(tableId)) && r.status === "reserved";
      if (isTarget) {
        seatedReservation = { ...r, status: "completed" as const };
        return seatedReservation;
      }
      return r;
    });
    saveStoredReservations(effectiveOutlet, updatedStored);

    store().reservations = store().reservations.map((r) => {
      const isTarget = reservationId
        ? r.id === reservationId
        : (r.tableId === tableId || r.mergedTableIds?.includes(tableId)) && r.status === "reserved";
      if (isTarget) {
        return { ...r, status: "completed" as const };
      }
      return r;
    });

    const linkedIds =
      seatedReservation?.mergedTableIds && seatedReservation.mergedTableIds.length > 0
        ? seatedReservation.mergedTableIds
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
      guestName: seatedReservation?.customerName,
      guestPhone: seatedReservation?.customerPhone,
    };

    let updatedTable!: RestaurantTable;
    store().tables = store().tables.map((tbl) => {
      if (linkedIds.includes(tbl.id)) {
        const next: RestaurantTable = {
          ...tbl,
          status: "occupied" as const,
          currentGuests: seatedReservation ? seatedReservation.guests : tbl.capacity,
          activeReservation: seatedReservation,
          activeOrder,
        };
        if (tbl.id === tableId || tbl.id === linkedIds[0]) updatedTable = next;
        return next;
      }
      return tbl;
    });

    if (isLiveFloor()) {
      const tables = await posTablesService.getTables();
      const found = tables.find((t) => t.id === tableId);
      if (found) return found;
    }

    return updatedTable || {
      id: tableId,
      tableNumber: `Table #${tableId}`,
      tableNumberRaw: 1,
      capacity: 4,
      shape: "square",
      area: "Main",
      status: "occupied",
    };
  },

  switchReservationTable: async (
    reservationId: string,
    newTableId: string,
  ): Promise<ReservationItem> => {
    const effectiveOutlet =
      scopedOutletId ||
      (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null) ||
      undefined;

    const allReservations = await posTablesService.getReservations();
    const res = allReservations.find((r) => r.id === reservationId);
    if (!res) throw new Error("Reservation not found");

    const tables = await posTablesService.getTables();
    const targetTable = tables.find((t) => t.id === newTableId);
    if (!targetTable) throw new Error("Target table not found");

    const oldTableId = res.tableId;
    const isTimeActive = isReservationActiveNow(res);

    const updatedRes: ReservationItem = {
      ...res,
      tableId: targetTable.id,
      tableNumber: targetTable.tableNumber,
      mergedTableIds: undefined,
      mergedTableNumbers: undefined,
      isMerged: false,
    };

    // Update backend reservation if live
    if (isLiveFloor() && isBackendOutletId(reservationId)) {
      try {
        await httpClient.patch(`${API_ENDPOINTS.TABLES.RESERVATIONS}${reservationId}/`, {
          table_ids: [targetTable.id],
        });
      } catch (e) {
        console.warn("Could not patch reservation table on backend:", e);
      }
    }

    // If reservation is currently active, switch table statuses
    if (isTimeActive) {
      if (isBackendOutletId(oldTableId)) {
        await patchTableStatus(oldTableId, "VACANT").catch(() => {});
      }
      if (isBackendOutletId(targetTable.id)) {
        await patchTableStatus(targetTable.id, "RESERVED", {
          notes: updatedRes.notes || `Reserved for ${updatedRes.customerName}`,
          active_waiter_name: updatedRes.customerName,
        }).catch(() => {});
      }
    }

    // Update localStorage & store
    const stored = getStoredReservations(effectiveOutlet);
    const updatedStored = stored.map((r) => (r.id === reservationId ? updatedRes : r));
    saveStoredReservations(effectiveOutlet, updatedStored);
    store().reservations = store().reservations.map((r) => (r.id === reservationId ? updatedRes : r));

    return updatedRes;
  },

  cancelReservation: async (reservationId: string): Promise<void> => {
    const effectiveOutlet =
      scopedOutletId ||
      (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null) ||
      undefined;

    if (isLiveFloor() && isBackendOutletId(reservationId)) {
      try {
        await httpClient.post(API_ENDPOINTS.TABLES.CANCEL_RESERVATION(reservationId));
      } catch (e) {
        console.warn("Could not cancel reservation on backend:", e);
      }
    }

    let linkedTableIds: string[] = [];
    const stored = getStoredReservations(effectiveOutlet);
    const updatedStored = stored.map((r) => {
      if (r.id === reservationId) {
        linkedTableIds =
          r.mergedTableIds && r.mergedTableIds.length > 0
            ? r.mergedTableIds
            : r.tableId
              ? [r.tableId]
              : [];
        return { ...r, status: "cancelled" as const };
      }
      return r;
    });
    saveStoredReservations(effectiveOutlet, updatedStored);

    store().reservations = store().reservations.map((r) => {
      if (r.id === reservationId) {
        return { ...r, status: "cancelled" as const };
      }
      return r;
    });

    if (linkedTableIds.length > 0) {
      for (const tid of linkedTableIds) {
        if (isLiveFloor() && isBackendOutletId(tid)) {
          patchTableStatus(tid, "VACANT").catch(() => {});
        }
      }
      store().tables = store().tables.map((tbl) => {
        if (linkedTableIds.includes(tbl.id)) {
          return {
            ...tbl,
            status: "vacant" as const,
            currentGuests: 0,
            activeReservation: undefined,
          };
        }
        return tbl;
      });
    }
  },

  vacateTable: async (tableId: string): Promise<RestaurantTable> => {
    const effectiveOutlet =
      scopedOutletId ||
      (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null) ||
      undefined;

    // Mark any active reservation for this table as completed in storage
    const stored = getStoredReservations(effectiveOutlet);
    const updatedStored = stored.map((r) => {
      if (
        (r.tableId === tableId || r.mergedTableIds?.includes(tableId)) &&
        (r.status === "reserved" || r.status === "seated")
      ) {
        return { ...r, status: "completed" as const };
      }
      return r;
    });
    saveStoredReservations(effectiveOutlet, updatedStored);

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

    const effectiveId = scopedOutletId || (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null);
    const cid = cleanOutletId(effectiveId);

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

    const effectiveId = scopedOutletId || (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null);
    const cid = cleanOutletId(effectiveId);

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
