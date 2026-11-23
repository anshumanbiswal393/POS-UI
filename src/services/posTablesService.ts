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
    let list: ReservationItem[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];

    // Strip previously-persisted legacy dummy seed reservations so only real data renders
    const beforeLen = list.length;
    list = list.filter((r) => r && r.id !== "res-seed-01" && r.id !== "res-seed-02");
    let modified = list.length !== beforeLen;

    // Sanitize any reservation that had the hardcoded 25 from the previous bug
    list = list.map((r) => {
      if (r.depositAmount === 25 && (!r.notes || !r.notes.includes("deposit"))) {
        modified = true;
        return {
          ...r,
          depositAmount: 0,
          paymentStatus: "unpaid",
        };
      }
      return r;
    });
    if (modified && typeof window !== "undefined") {
      localStorage.setItem(`retrod_pos_reservations_${effective}`, JSON.stringify(list));
    }
    return list;
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

  const primaryTableNumber =
    tableNumbers.length > 1
      ? tableNumbers.join(" + ")
      : (tableNumbers[0] || "Table");

  let status: "reserved" | "seated" | "completed" | "cancelled" | "no_show" = "reserved";

  const st = String(r.status || "").toUpperCase();

  if (st === "SEATED") status = "seated";

  else if (st === "COMPLETED") status = "completed";

  else if (st === "NO_SHOW") status = "no_show";

  else if (st === "CANCELLED") status = "cancelled";

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

    paymentStatus: r.payment_status || r.paymentStatus || (Number(r.deposit_amount ?? r.depositAmount ?? 0) > 0 ? "deposit_paid" : "unpaid"),

    depositAmount: Number(r.deposit_amount ?? r.depositAmount ?? 0),

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

import { savePosCustomer } from "@/services/posCustomerStore";

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

export function resolveEffectiveOutlet(outletIdOverride?: string): string | undefined {
  const raw =
    outletIdOverride ||
    scopedOutletId ||
    (typeof window !== "undefined"
      ? localStorage.getItem("retrod_pos_active_outlet_id")
      : null);
  return cleanOutletId(raw);
}

/** Scope table/reservation mutations to the active outlet (empty for new UUID outlets). */
export function setTablesOutletScope(outletId?: string | null, highwayDemo?: boolean) {
  scopedOutletId = outletId || undefined;
  if (typeof highwayDemo === "boolean") scopedHighwayDemo = highwayDemo;
}

function isLiveFloor(outletIdOverride?: string) {
  const cid = resolveEffectiveOutlet(outletIdOverride);
  return Boolean(cid && isBackendOutletId(cid));
}

function store(): TableBucket {
  if (isLiveFloor()) {
    const key = resolveEffectiveOutlet() || (scopedOutletId as string) || "live";
    let b = outletBuckets.get(key);
    if (!b) {
      b = { areas: [], tables: [], reservations: [] };
      outletBuckets.set(key, b);
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

export function getStoredAreas(outletId?: string): string[] {
  if (typeof window === "undefined") return [];
  const key = `retrod_pos_areas_${cleanOutletId(outletId) || "default"}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredAreas(outletId: string | undefined, areas: string[]) {
  if (typeof window === "undefined") return;
  const key = `retrod_pos_areas_${cleanOutletId(outletId) || "default"}`;
  try {
    localStorage.setItem(key, JSON.stringify(areas));
  } catch {}
}

export function getStoredTables(outletId?: string): RestaurantTable[] {
  if (typeof window === "undefined") return [];
  const key = `retrod_pos_tables_${cleanOutletId(outletId) || "default"}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredTables(outletId: string | undefined, tables: RestaurantTable[]) {
  if (typeof window === "undefined") return;
  const key = `retrod_pos_tables_${cleanOutletId(outletId) || "default"}`;
  try {
    localStorage.setItem(key, JSON.stringify(tables));
  } catch {}
}

export const posTablesService = {

  getAreas: async (outletIdOverride?: string): Promise<string[]> => {
    const cid = resolveEffectiveOutlet(outletIdOverride);

    let names: string[] = [];

    if (cid) {
      try {
        const res = await httpClient.get(API_ENDPOINTS.TABLES.AREAS, {
          params: { outlet_id: cid, outletId: cid, page_size: 200 },
        });
        names = unwrapRows<any>(res.data)
          .map((s) => String(s.name || "").trim())
          .filter(Boolean);
        names = Array.from(new Set(names));

        // When connected to backend DB, the database sections are authoritative
        saveStoredAreas(cid, names);
        store().areas = names;
        return names;
      } catch (err) {
        console.warn("Failed to fetch areas from DB, using local sync", err);
      }
    }

    const local = getStoredAreas(cid);
    const inMem = store().areas;
    const combined = Array.from(new Set([...names, ...local, ...inMem])).filter(Boolean);
    if (combined.length > 0) {
      saveStoredAreas(cid, combined);
      store().areas = combined;
    }
    return combined;
  },

  addArea: async (areaName: string, outletIdOverride?: string): Promise<string[]> => {
    const trimmed = areaName.trim();
    if (!trimmed) return posTablesService.getAreas(outletIdOverride);

    const cid = resolveEffectiveOutlet(outletIdOverride);

    if (cid) {
      try {
        await httpClient.post(API_ENDPOINTS.TABLES.AREAS, {
          outlet: cid,
          name: trimmed,
          is_active: true,
        });
      } catch (err) {
        console.warn("Section creation on backend returned error or already exists", err);
      }
    } else {
      const currentLocal = getStoredAreas(cid);
      if (!currentLocal.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
        const nextAreas = [...currentLocal, trimmed];
        saveStoredAreas(cid, nextAreas);
        store().areas = nextAreas;
      }
    }

    return posTablesService.getAreas(outletIdOverride);
  },

  updateArea: async (oldName: string, newName: string, outletIdOverride?: string): Promise<string[]> => {
    const trimmed = newName.trim();
    if (!trimmed || oldName.trim().toLowerCase() === trimmed.toLowerCase()) {
      return posTablesService.getAreas(outletIdOverride);
    }

    const cid = resolveEffectiveOutlet(outletIdOverride);

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
        console.warn("Failed to update area on backend:", err);
      }
    }

    // Update local cache
    const currentLocal = getStoredAreas(cid);
    const updatedLocal = currentLocal.map((a) =>
      a.toLowerCase() === oldName.toLowerCase() ? trimmed : a,
    );
    saveStoredAreas(cid, updatedLocal);
    store().areas = updatedLocal;

    // Update in-memory tables & stored tables
    store().tables.forEach((t) => {
      if ((t.area || "").toLowerCase() === oldName.toLowerCase()) {
        t.area = trimmed;
      }
    });
    const currentStoredTables = getStoredTables(cid);
    saveStoredTables(
      cid,
      currentStoredTables.map((t) =>
        (t.area || "").toLowerCase() === oldName.toLowerCase() ? { ...t, area: trimmed } : t,
      ),
    );

    return posTablesService.getAreas(outletIdOverride);
  },

  deleteArea: async (areaName: string, outletIdOverride?: string): Promise<string[]> => {
    const trimmed = areaName.trim();
    const cid = resolveEffectiveOutlet(outletIdOverride);

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
        console.warn("Failed to delete area on backend:", err);
      }
    }

    // Remove locally
    const currentLocal = getStoredAreas(cid);
    const filteredLocal = currentLocal.filter((a) => a.toLowerCase() !== trimmed.toLowerCase());
    saveStoredAreas(cid, filteredLocal);
    store().areas = filteredLocal;

    // Remove tables belonging to this area locally
    store().tables = store().tables.filter((t) => (t.area || "").toLowerCase() !== trimmed.toLowerCase());
    const currentStoredTables = getStoredTables(cid);
    saveStoredTables(
      cid,
      currentStoredTables.filter((t) => (t.area || "").toLowerCase() !== trimmed.toLowerCase()),
    );

    return posTablesService.getAreas(outletIdOverride);
  },

  addTable: async (
    input: {
      tableNumber: string;
      capacity: number;
      area: string;
      shape?: "rectangle" | "square" | "circle";
    },
    outletIdOverride?: string,
  ): Promise<RestaurantTable> => {
    const cid = resolveEffectiveOutlet(outletIdOverride);

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
            name: input.area?.trim() || "Dining Area",
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

      if (section?.id) {
        const shapeApi =
          input.shape === "circle" ? "ROUND" : input.shape === "rectangle" ? "RECTANGLE" : "SQUARE";
        const cleanNum = input.tableNumber.replace(/^Table\s*#?/i, "").trim() || input.tableNumber;
        try {
          const res = await httpClient.post(API_ENDPOINTS.TABLES.LIST, {
            section: section.id,
            table_number: cleanNum,
            capacity: Number(input.capacity) || 4,
            shape: shapeApi,
            status: "VACANT",
            is_active: true,
          });
          const apiMapped = mapApiTable(res.data, input.area || section.name);
          const currentStored = getStoredTables(cid);
          saveStoredTables(cid, [...currentStored.filter((t) => t.id !== apiMapped.id), apiMapped]);
          store().tables = [...store().tables.filter((t) => t.id !== apiMapped.id), apiMapped];
          return apiMapped;
        } catch (apiErr) {
          console.error("Backend table creation returned error:", apiErr);
          throw apiErr;
        }
      }
    }

    const rawNum = parseInt(input.tableNumber.replace(/\D/g, ""), 10) || store().tables.length + 1;
    const defaultShape = input.capacity >= 6 ? "rectangle" : "square";
    const formattedNum = input.tableNumber.startsWith("Table #")
      ? input.tableNumber
      : input.tableNumber.startsWith("#")
        ? `Table ${input.tableNumber}`
        : `Table #${input.tableNumber}`;

    const newTable: RestaurantTable = {
      id: `tbl-${Date.now()}`,
      tableNumber: formattedNum,
      tableNumberRaw: rawNum,
      capacity: input.capacity,
      currentGuests: 0,
      shape: input.shape || defaultShape,
      area: input.area || "Dining Area",
      status: "vacant",
    };

    store().tables = [...store().tables, newTable];
    const currentStored = getStoredTables(cid);
    saveStoredTables(cid, [...currentStored.filter((t) => t.id !== newTable.id), newTable]);

    // Ensure the area is saved locally
    if (input.area) {
      const currentAreas = getStoredAreas(cid);
      if (!currentAreas.some((a) => a.toLowerCase() === input.area.toLowerCase())) {
        const updatedAreas = [...currentAreas, input.area];
        saveStoredAreas(cid, updatedAreas);
        store().areas = updatedAreas;
      }
    }

    return newTable;
  },

  updateTable: async (
    tableId: string,
    data: Partial<RestaurantTable>,
    outletIdOverride?: string,
  ): Promise<RestaurantTable | null> => {
    const cid = resolveEffectiveOutlet(outletIdOverride);

    if (cid && isBackendOutletId(tableId)) {
      try {
        let sectionId: string | undefined;
        if (data.area) {
          const sectionsRes = await httpClient.get(API_ENDPOINTS.TABLES.AREAS, {
            params: { outlet_id: cid, outletId: cid, page_size: 200 },
          });
          const sections = unwrapRows<any>(sectionsRes.data);
          const found = sections.find(
            (s) =>
              String(s.name).trim().toLowerCase() === (data.area || "").trim().toLowerCase(),
          );
          if (found) sectionId = found.id;
        }

        const payload: Record<string, unknown> = {};
        if (data.tableNumber) {
          payload.table_number =
            data.tableNumber.replace(/^Table\s*#?/i, "").trim() || data.tableNumber;
        }
        if (data.capacity) payload.capacity = Number(data.capacity);
        if (data.shape) {
          payload.shape =
            data.shape === "circle"
              ? "ROUND"
              : data.shape === "rectangle"
                ? "RECTANGLE"
                : "SQUARE";
        }
        if (sectionId) payload.section = sectionId;

        const res = await httpClient.patch(`${API_ENDPOINTS.TABLES.LIST}${tableId}/`, payload);
        const updated = mapApiTable(res.data, data.area);
        const stored = getStoredTables(cid).map((t) =>
          t.id === tableId ? { ...t, ...updated } : t,
        );
        saveStoredTables(cid, stored);
        store().tables = store().tables.map((t) => (t.id === tableId ? { ...t, ...updated } : t));
        return updated;
      } catch (err) {
        console.error("Backend updateTable failed:", err);
        throw err;
      }
    }

    const stored = getStoredTables(cid);
    const updatedList = stored.map((t) => (t.id === tableId ? { ...t, ...data } : t));
    saveStoredTables(cid, updatedList);

    store().tables = store().tables.map((t) => (t.id === tableId ? { ...t, ...data } : t));
    return store().tables.find((t) => t.id === tableId) || null;
  },

  deleteTable: async (tableId: string, outletIdOverride?: string): Promise<boolean> => {
    const cid = resolveEffectiveOutlet(outletIdOverride);

    if (cid && isBackendOutletId(tableId)) {
      try {
        await httpClient.delete(`${API_ENDPOINTS.TABLES.LIST}${tableId}/`);
      } catch (err) {
        console.error("Backend deleteTable error:", err);
        throw err;
      }
    }

    // Update locally
    store().tables = store().tables.filter((t) => t.id !== tableId);
    const stored = getStoredTables(cid);
    saveStoredTables(
      cid,
      stored.filter((t) => t.id !== tableId),
    );

    return true;
  },

  getTables: async (
    areaOrOutletId?: DiningArea | string,
    outletIdOverride?: string,
  ): Promise<RestaurantTable[]> => {
    let area: DiningArea | undefined;
    let effectiveOutletOverride = outletIdOverride;

    if (areaOrOutletId) {
      if (isBackendOutletId(areaOrOutletId) || areaOrOutletId.startsWith("outlet-")) {
        effectiveOutletOverride = effectiveOutletOverride || areaOrOutletId;
      } else {
        area = areaOrOutletId as DiningArea;
      }
    }

    const cid = resolveEffectiveOutlet(effectiveOutletOverride);
    if (cid) {
      let mapped: RestaurantTable[] = [];
      try {
        const res = await httpClient.get(API_ENDPOINTS.TABLES.LIST, {
          params: { outlet_id: cid, outletId: cid, page_size: 500 },
        });
        mapped = unwrapRows<any>(res.data).map((row) => mapApiTable(row, area));
      } catch (err) {
        console.error("Failed to fetch tables from DB", err);
        mapped = getStoredTables(cid);
      }
      // Guarantee each table has an area label
      mapped = mapped.map((t) => ({
        ...t,
        area: t.area && t.area.trim() ? t.area : "Dining Area",
      }));

      // Cache authoritative DB tables
      saveStoredTables(cid, mapped);
      store().tables = mapped;

      // Real tables only from DB - zero hardcoded mock fallbacks

      // Hydrate active orders on tables from currentOrders so ALL constituent merged tables show as OCCUPIED
      try {
        const currentOrders = await liveGetCurrent(cid);
        if (currentOrders && currentOrders.length > 0) {
          mapped = mapped.map((tbl) => {
            const tblClean = tbl.tableNumber.toLowerCase().replace(/[^0-9a-z]/g, "");
            const tblNumOnly = tbl.tableNumber.replace(/\D/g, "");

            const matched = currentOrders.find((co: any) => {
              if (co.tableId && co.tableId === tbl.id) return true;
              const orderSrc = String(co.tableOrRoom || co.source || co.tableNumber || "").toLowerCase();
              const orderSrcClean = orderSrc.replace(/[^0-9a-z]/g, "");
              if (tblClean && orderSrcClean && (orderSrcClean.includes(tblClean) || tblClean.includes(orderSrcClean))) {
                return true;
              }
              // If order has merged tables (e.g. contains "+")
              if (orderSrc.includes("+")) {
                const parts: string[] = orderSrc.split("+").map((p: string) => p.trim());
                for (const p of parts) {
                  const pClean = p.replace(/[^0-9a-z]/g, "");
                  const pNumOnly = p.replace(/\D/g, "");
                  if (pClean === tblClean) return true;
                  if (tblNumOnly && pNumOnly && tblNumOnly === pNumOnly) return true;
                }
              }
              return false;
            });

            if (matched) {
              return {
                ...tbl,
                status: "occupied",
                activeOrder: {
                  orderId: matched.id,
                  orderNumber: matched.orderNumber,
                  serverName: matched.waiterName || tbl.activeOrder?.serverName || "Captain",
                  seatedAt: matched.startTime || "",
                  elapsedMinutes: Math.max(1, matched.elapsedMinutes || 0),
                  itemsCount: matched.items?.length || 0,
                  subtotal: Number(matched.subtotal ?? matched.amount ?? 0),
                  totalAmount: Number(matched.totalAmount ?? matched.grandTotal ?? matched.amount ?? 0),
                  grandTotal: Number(matched.grandTotal ?? matched.totalAmount ?? matched.amount ?? 0),
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

      // Dynamic table reservation state based on actual reservation timing
      const allReservations = getStoredReservations(cid);
      const now = new Date();

      mapped = mapped.map((tbl) => {
        // Find matching reservation for this table (seated, reserved, or completed today)
        const matchedRes = allReservations.find(
          (r) => {
            const matchesId =
              r.tableId === tbl.id ||
              r.mergedTableIds?.includes(tbl.id);
            if (matchesId) return (r.status === "seated" || r.status === "reserved" || (tbl.status === "occupied" && r.status === "completed"));

            const matchesTableNumber =
              r.tableNumber === tbl.tableNumber ||
              r.mergedTableNumbers?.includes(tbl.tableNumber) ||
              (r.tableNumber && r.tableNumber.includes("+") &&
                r.tableNumber.split("+").some((p) => {
                  const s = p.trim();
                  return s === tbl.tableNumber || s.replace(/\D/g, "") === String(tbl.tableNumberRaw);
                })) ||
              (r.tableNumber && String(tbl.tableNumberRaw) === r.tableNumber.replace(/\D/g, ""));
            return matchesTableNumber && (r.status === "seated" || r.status === "reserved" || (tbl.status === "occupied" && r.status === "completed"));
          }
        );

        // If reservation is currently seated (or table is marked occupied with an order),
        // ensure this table reflects OCCUPIED status with guest details
        if (
          tbl.status === "occupied" ||
          tbl.activeOrder?.orderId ||
          (matchedRes && matchedRes.status === "seated")
        ) {
          if (matchedRes && matchedRes.status !== "completed" && matchedRes.status !== "cancelled" && matchedRes.status !== "no_show") {
            const guestName = tbl.activeOrder?.guestName || matchedRes.customerName;
            const guestPhone = tbl.activeOrder?.guestPhone || matchedRes.customerPhone;
            return {
              ...tbl,
              status: "occupied" as const,
              activeReservation: matchedRes,
              currentGuests: tbl.currentGuests || matchedRes.guests || tbl.capacity,
              activeOrder: tbl.activeOrder
                ? {
                    ...tbl.activeOrder,
                    guestName,
                    guestPhone,
                  }
                : {
                    orderId: `ord-${tbl.id}`,
                    orderNumber: `ORD-${tbl.tableNumberRaw || 1}`,
                    serverName: "Captain Jack",
                    seatedAt: matchedRes.reservationTime || "12:00 PM",
                    elapsedMinutes: 1,
                    itemsCount: 0,
                    subtotal: 0,
                    totalAmount: 0,
                    status: "in_prep" as const,
                    guestName: matchedRes.customerName,
                    guestPhone: matchedRes.customerPhone,
                  },
            };
          }
          return tbl;
        }

        // Find active reservation for this table whose scheduled time has arrived
        const activeRes =
          matchedRes && matchedRes.status === "reserved" && isReservationActiveNow(matchedRes, now)
            ? matchedRes
            : allReservations.find(
                (r) =>
                  r.status === "reserved" &&
                  (r.tableId === tbl.id ||
                    r.mergedTableIds?.includes(tbl.id) ||
                    r.tableNumber === tbl.tableNumber ||
                    r.mergedTableNumbers?.includes(tbl.tableNumber) ||
                    (r.tableNumber && r.tableNumber.includes("+") &&
                      r.tableNumber.split("+").some((p) => {
                        const s = p.trim();
                        return s === tbl.tableNumber || s.replace(/\D/g, "") === String(tbl.tableNumberRaw);
                      })) ||
                    (r.tableNumber && String(tbl.tableNumberRaw) === r.tableNumber.replace(/\D/g, ""))) &&
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

  getReservations: async (outletIdOverride?: string): Promise<ReservationItem[]> => {
    const effectiveOutlet = resolveEffectiveOutlet(outletIdOverride);
    const localStored = getStoredReservations(effectiveOutlet);

    let backendRows: ReservationItem[] = [];
    if (isLiveFloor(outletIdOverride)) {
      try {
        const res = await httpClient.get(API_ENDPOINTS.TABLES.RESERVATIONS, {
          params: { outlet_id: effectiveOutlet, page_size: 200 },
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
          depositAmount: r.depositAmount || existing.depositAmount || 0,
          paymentStatus: r.paymentStatus || existing.paymentStatus || (r.depositAmount || existing.depositAmount ? "deposit_paid" : "unpaid"),
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

  getStats: async (area?: DiningArea, outletIdOverride?: string): Promise<TableManagementStats> => {
    const list = isLiveFloor(outletIdOverride)
      ? await posTablesService.getTables(area, outletIdOverride)
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
    const mergedNumbers =
      data.mergedTableNumbers && data.mergedTableNumbers.length === mergedIds.length
        ? data.mergedTableNumbers
        : mergedIds.map((id) => tables.find((t) => t.id === id)?.tableNumber || id);
    const isMerged = mergedIds.length > 1;

    const isoDate = toIsoDate(data.reservationDate);
    const time24 = to24HourTime(data.reservationTime);
    const displayTime = toDisplayTime(data.reservationTime);
    const displayEndTime = data.endTime ? toDisplayTime(data.endTime) : undefined;

    const newReservation: ReservationItem = {
      ...data,
      id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tableId: mergedIds[0],
      tableNumber: data.tableNumber || mergedNumbers.join(" + "),
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
          deposit_amount: data.depositAmount || 0,
          payment_status: data.paymentStatus || (data.depositAmount ? "deposit_paid" : "unpaid"),
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

    try {
      savePosCustomer(
        {
          name: data.customerName,
          phone: data.customerPhone,
          email: data.customerEmail,
          tier: data.isVip ? "Gold" : "Silver",
        },
        effectiveOutlet,
      );
    } catch {
      // ignore
    }

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
      // Also patch any merged tables if known from stored reservations
      const preStored = getStoredReservations(effectiveOutlet);
      const targetRes = preStored.find(
        (r) =>
          r.id === reservationId ||
          r.tableId === tableId ||
          r.mergedTableIds?.includes(tableId)
      );
      if (targetRes?.mergedTableIds) {
        for (const tid of targetRes.mergedTableIds) {
          if (tid !== tableId) {
            patchTableStatus(tid, "OCCUPIED").catch(() => {});
          }
        }
      }
    }

    // Mark reservation status as "seated" (maintained in reservation list)
    let seatedReservation: ReservationItem | undefined;
    const stored = getStoredReservations(effectiveOutlet);
    const updatedStored = stored.map((r) => {
      const isTarget = reservationId
        ? r.id === reservationId
        : (r.tableId === tableId || r.mergedTableIds?.includes(tableId)) && (r.status === "reserved" || r.status === "seated");
      if (isTarget) {
        seatedReservation = { ...r, status: "seated" as const };
        return seatedReservation;
      }
      return r;
    });
    saveStoredReservations(effectiveOutlet, updatedStored);

    store().reservations = store().reservations.map((r) => {
      const isTarget = reservationId
        ? r.id === reservationId
        : (r.tableId === tableId || r.mergedTableIds?.includes(tableId)) && (r.status === "reserved" || r.status === "seated");
      if (isTarget) {
        return { ...r, status: "seated" as const };
      }
      return r;
    });

    if (seatedReservation?.customerName) {
      try {
        savePosCustomer(
          {
            name: seatedReservation.customerName,
            phone: seatedReservation.customerPhone || "",
            email: seatedReservation.customerEmail,
            tier: seatedReservation.isVip ? "Gold" : "Silver",
          },
          effectiveOutlet,
        );
      } catch {
        // ignore
      }
    }

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
      for (const tid of linkedIds) {
        if (tid !== tableId) {
          patchTableStatus(tid, "OCCUPIED").catch(() => {});
        }
      }
      const tables = await posTablesService.getTables();
      const found = tables.find((t) => t.id === tableId);
      if (found) return found;
    }

    return (
      updatedTable || {
        id: tableId,
        tableNumber: seatedReservation?.tableNumber || `Table #${tableId}`,
        tableNumberRaw: parseInt(tableId.replace(/\D/g, "") || "1", 10),
        capacity: seatedReservation?.guests || 4,
        shape: "square",
        area: "Main",
        status: "occupied",
        activeReservation: seatedReservation,
        activeOrder,
        currentGuests: seatedReservation?.guests || 4,
      }
    );
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
    const sourceTable = tables.find(
      (t) => t.id === oldTableId || (res.tableNumber && t.tableNumber === res.tableNumber),
    );

    const isSeated =
      res.status === "seated" || (sourceTable && sourceTable.status === "occupied");
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

    let updatedSource: RestaurantTable | undefined;
    let updatedTarget: RestaurantTable | undefined;

    if (isSeated) {
      // 1. Moving a seated reservation (and any active dine-in order) from old table to new table
      const orderToMove = sourceTable?.activeOrder;

      if (sourceTable) {
        updatedSource = {
          ...sourceTable,
          status: "vacant",
          activeOrder: undefined,
          activeReservation: undefined,
          currentGuests: 0,
        };
        if (isLiveFloor() && isBackendOutletId(sourceTable.id)) {
          await patchTableStatus(sourceTable.id, "VACANT", {
            active_order_id: null,
            active_waiter_name: "",
            notes: "",
          }).catch(() => {});
        }
      }

      updatedTarget = {
        ...targetTable,
        status: "occupied",
        activeReservation: updatedRes,
        activeOrder: orderToMove
          ? {
              ...orderToMove,
              tableNumber: targetTable.tableNumber,
            }
          : undefined,
        currentGuests: res.guests || sourceTable?.currentGuests || targetTable.capacity || 2,
      };

      if (isLiveFloor() && isBackendOutletId(targetTable.id)) {
        await patchTableStatus(targetTable.id, "OCCUPIED", {
          active_order_id:
            orderToMove?.orderId && isBackendOutletId(orderToMove.orderId)
              ? orderToMove.orderId
              : undefined,
          active_waiter_name:
            updatedRes.customerName || orderToMove?.serverName || "Captain",
          notes: updatedRes.notes || `Seated: ${updatedRes.customerName}`,
        }).catch(() => {});
      }
    } else if (isTimeActive || sourceTable?.status === "reserved") {
      // 2. Moving an active upcoming reservation holding the table
      if (sourceTable) {
        updatedSource = {
          ...sourceTable,
          status: "vacant",
          activeReservation: undefined,
          currentGuests: 0,
        };
        if (isLiveFloor() && isBackendOutletId(sourceTable.id)) {
          await patchTableStatus(sourceTable.id, "VACANT", {
            active_waiter_name: "",
            notes: "",
          }).catch(() => {});
        }
      }

      updatedTarget = {
        ...targetTable,
        status: "reserved",
        activeReservation: updatedRes,
      };

      if (isLiveFloor() && isBackendOutletId(targetTable.id)) {
        await patchTableStatus(targetTable.id, "RESERVED", {
          notes: updatedRes.notes || `Reserved for ${updatedRes.customerName}`,
          active_waiter_name: updatedRes.customerName,
        }).catch(() => {});
      }
    }

    // Persist table updates to local storage and in-memory store
    if (updatedSource || updatedTarget) {
      const storedTables = getStoredTables(effectiveOutlet);
      const updatedStoredTables = storedTables.map((t) => {
        if (updatedSource && t.id === updatedSource.id) return updatedSource;
        if (updatedTarget && t.id === updatedTarget.id) return updatedTarget;
        return t;
      });
      saveStoredTables(effectiveOutlet, updatedStoredTables);

      store().tables = store().tables.map((t) => {
        if (updatedSource && t.id === updatedSource.id) return updatedSource;
        if (updatedTarget && t.id === updatedTarget.id) return updatedTarget;
        return t;
      });
    }

    // Update localStorage & store
    const stored = getStoredReservations(effectiveOutlet);
    const updatedStored = stored.map((r) => (r.id === reservationId ? updatedRes : r));
    saveStoredReservations(effectiveOutlet, updatedStored);
    store().reservations = store().reservations.map((r) => (r.id === reservationId ? updatedRes : r));

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("pos:table-updated"));
      window.dispatchEvent(new CustomEvent("retrod_pos_tables_changed"));
      window.dispatchEvent(new CustomEvent("pos:reservation-updated"));
      window.dispatchEvent(new CustomEvent("pos:order-updated"));
      window.dispatchEvent(new CustomEvent("pos:kot-updated"));
    }

    return updatedRes;
  },

  switchOccupiedTable: async (
    fromTableId: string,
    toTableId: string,
  ): Promise<{ sourceTable: RestaurantTable; targetTable: RestaurantTable }> => {
    const effectiveOutlet =
      scopedOutletId ||
      (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null) ||
      undefined;

    const tables = await posTablesService.getTables();
    const sourceTable = tables.find((t) => t.id === fromTableId);
    if (!sourceTable) throw new Error("Source table not found");

    const targetTable = tables.find((t) => t.id === toTableId);
    if (!targetTable) throw new Error("Target table not found");

    if (targetTable.id === sourceTable.id) {
      throw new Error("Target table must be different from current table");
    }

    if (targetTable.status === "occupied") {
      throw new Error(`Target table ${targetTable.tableNumber} is already occupied. Choose an available table.`);
    }

    const orderToMove = sourceTable.activeOrder;
    const resToMove = sourceTable.activeReservation;

    // Call backend table transfer endpoint if both tables have valid UUID IDs
    if (isBackendOutletId(sourceTable.id) && isBackendOutletId(targetTable.id)) {
      try {
        await httpClient.post("/api/pos/tables/transfer/", {
          source_table_id: sourceTable.id,
          destination_table_id: targetTable.id,
          reason: `Switched table from ${sourceTable.tableNumber} to ${targetTable.tableNumber}`,
        });
      } catch (err) {
        console.warn("Table transfer API call fallback:", err);
      }
    }

    // If order exists, also patch the order table and table number directly
    if (orderToMove?.orderId && isBackendOutletId(orderToMove.orderId)) {
      try {
        await livePatchOrder(orderToMove.orderId, {
          tableId: targetTable.id,
          tableNumber: targetTable.tableNumber,
          meta: {
            table_label: targetTable.tableNumber,
            tableLabel: targetTable.tableNumber,
            full_table_number: targetTable.tableNumber,
          },
        } as any);
      } catch (err) {
        console.warn("Could not patch order table ID on switch:", err);
      }
    }

    // Patch backend table statuses if live backend is connected
    if (isBackendOutletId(sourceTable.id)) {
      await patchTableStatus(sourceTable.id, "VACANT", {
        active_order_id: null,
        active_waiter_name: "",
        notes: "",
      }).catch(() => {});
    }

    if (isBackendOutletId(targetTable.id)) {
      await patchTableStatus(targetTable.id, "OCCUPIED", {
        active_order_id:
          orderToMove?.orderId && isBackendOutletId(orderToMove.orderId) ? orderToMove.orderId : undefined,
        active_waiter_name: orderToMove?.serverName || resToMove?.customerName || "Captain",
        notes: `Dine-in moved from ${sourceTable.tableNumber}`,
      }).catch(() => {});
    }

    // If there is an active reservation linked, move reservation table too
    if (resToMove) {
      await posTablesService.switchReservationTable(resToMove.id, targetTable.id).catch(() => {});
    }

    // Update in-memory / local tables store
    const updatedSource: RestaurantTable = {
      ...sourceTable,
      status: "vacant",
      activeOrder: undefined,
      activeReservation: undefined,
      currentGuests: 0,
    };

    const updatedTarget: RestaurantTable = {
      ...targetTable,
      status: "occupied",
      activeOrder: orderToMove,
      activeReservation: resToMove
        ? {
            ...resToMove,
            tableId: targetTable.id,
            tableNumber: targetTable.tableNumber,
          }
        : undefined,
      currentGuests: sourceTable.currentGuests || targetTable.capacity,
    };

    // Update local storage
    const stored = getStoredTables(effectiveOutlet);
    const updatedStored = stored.map((t) => {
      if (t.id === fromTableId) return updatedSource;
      if (t.id === toTableId) return updatedTarget;
      return t;
    });
    saveStoredTables(effectiveOutlet, updatedStored);

    store().tables = store().tables.map((t) => {
      if (t.id === fromTableId) return updatedSource;
      if (t.id === toTableId) return updatedTarget;
      return t;
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("pos:table-updated"));
      window.dispatchEvent(new CustomEvent("retrod_pos_tables_changed"));
      window.dispatchEvent(new CustomEvent("pos:reservation-updated"));
      window.dispatchEvent(new CustomEvent("pos:order-updated"));
      window.dispatchEvent(new CustomEvent("pos:kot-updated"));
    }

    return { sourceTable: updatedSource, targetTable: updatedTarget };
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
    const completedIds = new Set<string>();
    const updatedStored = stored.map((r) => {
      if (
        (r.tableId === tableId || r.mergedTableIds?.includes(tableId)) &&
        (r.status === "reserved" || r.status === "seated")
      ) {
        completedIds.add(r.id);
        return { ...r, status: "completed" as const };
      }
      return r;
    });
    saveStoredReservations(effectiveOutlet, updatedStored);

    store().reservations = store().reservations.map((r) => {
      if (
        (r.tableId === tableId || r.mergedTableIds?.includes(tableId)) &&
        (r.status === "reserved" || r.status === "seated")
      ) {
        completedIds.add(r.id);
        return { ...r, status: "completed" as const };
      }
      return r;
    });

    if (isLiveFloor()) {
      for (const rid of completedIds) {
        if (isBackendOutletId(rid)) {
          httpClient
            .patch(`${API_ENDPOINTS.TABLES.RESERVATIONS}${rid}/`, { status: "COMPLETED" })
            .catch(() => {});
        }
      }
      await patchTableStatus(tableId, "VACANT");
      const tables = await posTablesService.getTables();
      const found = tables.find((t) => t.id === tableId);
      if (!found) throw new Error("Table not found");
      return found;
    }

    let updatedTable: RestaurantTable | undefined;

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

    if (!updatedTable) {
      const stored = getStoredTables(effectiveOutlet);
      const found = stored.find((t) => t.id === tableId);
      if (found) {
        updatedTable = {
          ...found,
          status: "vacant",
          currentGuests: 0,
          activeReservation: undefined,
          activeOrder: undefined,
        };
        const newStored = stored.map((t) => (t.id === tableId ? updatedTable! : t));
        saveStoredTables(effectiveOutlet, newStored);
      } else {
        updatedTable = {
          id: tableId,
          tableNumber: `Table #${tableId}`,
          tableNumberRaw: parseInt(tableId.replace(/\D/g, ""), 10) || 1,
          capacity: 4,
          currentGuests: 0,
          shape: "square",
          area: "Dining Area",
          status: "vacant",
        };
      }
    }

    // Mark any active reservation for this table as completed

    store().reservations = store().reservations.map((r) => {

      if (r.tableId === tableId && (r.status === "reserved" || r.status === "seated")) {

        return { ...r, status: "completed" };

      }

      return r;

    });

    return updatedTable!;

  },

  completeReservation: async (params: {
    reservationId?: string;
    tableId?: string;
    tableNumber?: string;
    customerName?: string;
  }): Promise<ReservationItem[]> => {
    const effectiveOutlet =
      scopedOutletId ||
      (typeof window !== "undefined" ? localStorage.getItem("retrod_pos_active_outlet_id") : null) ||
      undefined;

    const { reservationId, tableId, tableNumber, customerName } = params;
    const normDigits = (v?: string) => (v || "").replace(/\D+/g, "");
    const targetDigits = normDigits(tableNumber);
    const targetLower = (tableNumber || "").trim().toLowerCase();
    const guestLower = (customerName || "").trim().toLowerCase();

    const matchesTable = (r: ReservationItem) => {
      if (guestLower && (r.customerName || "").trim().toLowerCase() === guestLower) {
        return true;
      }
      if (tableId && (r.tableId === tableId || r.mergedTableIds?.includes(tableId))) {
        return true;
      }
      if (targetLower) {
        const resTableLower = (r.tableNumber || "").trim().toLowerCase();
        if (resTableLower && resTableLower === targetLower) return true;
        if (
          r.mergedTableNumbers?.some((n) => n.trim().toLowerCase() === targetLower)
        ) {
          return true;
        }
      }
      if (targetDigits) {
        if (normDigits(r.tableNumber) === targetDigits) return true;
        if (
          r.mergedTableNumbers?.some((n) => normDigits(n) === targetDigits)
        ) {
          return true;
        }
      }
      return false;
    };

    const shouldComplete = (r: ReservationItem) => {
      if (r.status === "completed" || r.status === "cancelled" || r.status === "no_show") return false;
      if (reservationId && r.id === reservationId) return true;
      if (guestLower && (r.customerName || "").trim().toLowerCase() === guestLower) return true;
      if (matchesTable(r)) {
        return r.status === "seated" || (r.status === "reserved" && isReservationActiveNow(r));
      }
      return false;
    };

    const completedMap = new Map<string, ReservationItem>();

    const stored = getStoredReservations(effectiveOutlet);
    const updatedStored = stored.map((r) => {
      if (shouldComplete(r)) {
        const next: ReservationItem = { ...r, status: "completed" };
        completedMap.set(r.id, next);
        return next;
      }
      return r;
    });

    store().reservations = store().reservations.map((r) => {
      if (shouldComplete(r)) {
        const next: ReservationItem = { ...r, status: "completed" };
        completedMap.set(r.id, next);
        return next;
      }
      return r;
    });

    // If a reservation existed in store() but not yet in stored, ensure it's persisted too
    const storedIds = new Set(updatedStored.map((r) => r.id));
    for (const r of completedMap.values()) {
      if (!storedIds.has(r.id)) {
        updatedStored.push(r);
      }
    }
    saveStoredReservations(effectiveOutlet, updatedStored);

    if (completedMap.size > 0) {
      const completedTableIds = new Set<string>();
      for (const r of completedMap.values()) {
        if (r.tableId) completedTableIds.add(r.tableId);
        if (r.mergedTableIds) {
          for (const tid of r.mergedTableIds) completedTableIds.add(tid);
        }
      }

      store().tables = store().tables.map((tbl) => {
        const matchesReservation = tbl.activeReservation && completedMap.has(tbl.activeReservation.id);
        const matchesTableId = completedTableIds.has(tbl.id);
        if (matchesReservation || matchesTableId) {
          return {
            ...tbl,
            status: "vacant" as const,
            currentGuests: 0,
            activeReservation: undefined,
          };
        }
        return tbl;
      });

      if (isLiveFloor()) {
        for (const rid of completedMap.keys()) {
          if (isBackendOutletId(rid)) {
            await httpClient
              .patch(`${API_ENDPOINTS.TABLES.RESERVATIONS}${rid}/`, { status: "COMPLETED" })
              .catch(() => {});
          }
        }
        for (const tid of completedTableIds) {
          if (isBackendOutletId(tid)) {
            patchTableStatus(tid, "VACANT").catch(() => {});
          }
        }
      }
    }

    return Array.from(completedMap.values());
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

      const allRes = await posTablesService.getReservations();
      const activeRes =
        targetTable?.activeReservation ||
        allRes.find(
          (r) =>
            (r.status === "seated" || r.status === "reserved") &&
            (r.tableId === input.tableId ||
              (r.customerPhone &&
                input.guestPhone &&
                r.customerPhone.replace(/\D/g, "") === input.guestPhone.replace(/\D/g, ""))),
        );
      const resDeposit = activeRes?.depositAmount || 0;

      const created = await liveCreateOrder({

        outletId: cid,

        orderType: "dine_in",

        tableId: input.tableId,

        tableNumber: targetTable?.tableNumber,

        section: targetTable?.area,

        reservationId: activeRes?.id,

        waiterName: input.waiterName,

        pax: input.pax,

        guestName: input.guestName,

        guestPhone: input.guestPhone,

        subtotal: input.subtotal,

        grandTotal: input.grandTotal,

        sendKot: true,

        items: input.items,

        meta: resDeposit > 0 ? { deposit_amount: resDeposit, reservation_deposit: resDeposit } : undefined,

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
