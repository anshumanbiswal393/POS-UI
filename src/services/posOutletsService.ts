import httpClient from "@/utils/httpClient";
import type { PosOutlet } from "@/types/posMenu";
import {
  deduplicateOutlets,
  isBackendOutletId,
  isHighwayDemoOutlet,
  isHighwayInnName,
} from "@/utils/outletId";

export type OutletApiDto = {
  id: string;
  tenant?: string;
  property?: string;
  tenant_name?: string;
  property_name?: string;
  code: string;
  name: string;
  outlet_type?: string;
  cuisine?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean;
  meta_settings?: Record<string, unknown> | null;
  sections_count?: number;
  tables_count?: number;
};

export type CreateOutletPayload = {
  name: string;
  code?: string;
  outlet_type?: "HO" | "KITCHEN" | "PRIMARY" | "VIRTUAL" | string;
  cuisine?: string;
  email?: string;
  phone?: string;
  alias?: string;
  landmark?: string;
  zipCode?: string;
  fax?: string;
  tinNo?: string;
  country?: string;
  state?: string;
  city?: string;
  timezone?: string;
  address?: string;
  area?: string;
  latitude?: string;
  longitude?: string;
  ownerMobile?: string;
  directNumber?: string;
  decisionMaker?: string;
  kitchenCode?: string;
  seatingCapacity?: string;
  additionalInfo?: string;
  formType?: "HO" | "Kitchen";
  /** Parent physical/HO outlet for VIRTUAL / Kitchen brands */
  parentOutletId?: string;
  tenant?: string;
  property?: string;
  is_active?: boolean;
};

const STORAGE_KEY_CUSTOM_OUTLETS = "retrod_pos_custom_outlets";

export function getLocalCustomOutlets(): PosOutlet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_OUTLETS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const deduped = deduplicateOutlets(parsed);
    if (deduped.length !== parsed.length) {
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOM_OUTLETS, JSON.stringify(deduped));
      } catch {
        // ignore
      }
    }
    return deduped;
  } catch {
    return [];
  }
}

export function saveLocalCustomOutlet(outlet: PosOutlet) {
  if (typeof window === "undefined") return;
  try {
    const current = getLocalCustomOutlets();
    const updated = deduplicateOutlets([outlet, ...current], outlet.id);
    localStorage.setItem(STORAGE_KEY_CUSTOM_OUTLETS, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

function mapOutletType(apiType?: string): PosOutlet["type"] {
  const t = (apiType || "").toUpperCase();
  if (t === "VIRTUAL" || t === "KITCHEN") return "Virtual Outlet";
  return "Primary Outlet";
}

export function mapOutletApiToPosOutlet(dto: OutletApiDto): PosOutlet {
  const meta = dto.meta_settings || {};
  const address =
    (typeof meta.address === "string" && meta.address) ||
    [meta.landmark, meta.area, meta.city, meta.state, meta.zip_code].filter(Boolean).join(", ") ||
    dto.property_name ||
    "";
  const parentRaw = meta.parent_outlet_id ?? meta.parentOutletId;
  const parentOutletId =
    typeof parentRaw === "string" && parentRaw.trim() ? String(parentRaw) : null;
  const kind = (dto.outlet_type || "PRIMARY").toUpperCase();
  return {
    id: String(dto.id),
    name: dto.name,
    code: dto.code,
    type: mapOutletType(dto.outlet_type),
    outletKind: kind,
    cuisine: dto.cuisine || (typeof meta.form_type === "string" ? String(meta.form_type) : kind === "HO" ? "Head Office" : kind === "KITCHEN" ? "Central Kitchen" : "Multi-Cuisine"),
    description:
      (typeof meta.additional_info === "string" && meta.additional_info) ||
      `${dto.outlet_type || "OUTLET"} · ${dto.property_name || "Property"}`,
    address,
    contact: dto.phone || (typeof meta.owner_mobile === "string" ? meta.owner_mobile : "") || "",
    orderTypes:
      kind === "KITCHEN" || kind === "VIRTUAL"
        ? ["Online Delivery", "Takeaway"]
        : ["Dine-In", "Takeaway", "Room Service"],
    status: dto.is_active === false ? "Inactive" : "Active",
    menuCount: 0,
    city: typeof meta.city === "string" ? meta.city : "",
    email: dto.email || undefined,
    parentOutletId,
    propertyId: dto.property ? String(dto.property) : null,
    tenantId: dto.tenant ? String(dto.tenant) : null,
  };
}

function unwrapList(data: unknown): OutletApiDto[] {
  if (Array.isArray(data)) return data as OutletApiDto[];
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: OutletApiDto[] }).results;
  }
  return [];
}

export function findLiveHighwayInn(outlets: PosOutlet[]): PosOutlet | undefined {
  // First prefer a real backend UUID persisted outlet
  const backend = outlets.find((o) => isBackendOutletId(o.id) && isHighwayInnName(o.name, o.code));
  if (backend) return backend;
  // Fall back to any Highway Inn outlet (demo or local)
  return outlets.find((o) => isHighwayInnName(o.name, o.code) || isHighwayDemoOutlet(o.id));
}

export const posOutletsService = {
  async listOutlets(params?: { propertyId?: string; tenantId?: string }): Promise<PosOutlet[]> {
    let remote: PosOutlet[] = [];
    try {
      const res = await httpClient.get("/api/pos/outlets/", {
        params: {
          property_id: params?.propertyId,
          tenant_id: params?.tenantId,
          page_size: 200,
        },
      });
      remote = unwrapList(res.data).map(mapOutletApiToPosOutlet);
    } catch {
      // Remote fetch failed or offline
    }

    const local = getLocalCustomOutlets();
    // Combine remote and local, strictly deduplicating so no outlet appears more than once
    return deduplicateOutlets([...remote, ...local]);
  },

  async createOutlet(payload: CreateOutletPayload): Promise<PosOutlet> {
    const body = {
      name: payload.name,
      code: payload.code,
      outlet_type: payload.outlet_type,
      cuisine: payload.cuisine,
      email: payload.email,
      phone: payload.phone || payload.ownerMobile || payload.directNumber,
      alias: payload.alias,
      landmark: payload.landmark,
      zipCode: payload.zipCode,
      fax: payload.fax,
      tinNo: payload.tinNo,
      country: payload.country,
      state: payload.state,
      city: payload.city,
      timezone: payload.timezone,
      address: payload.address,
      area: payload.area,
      latitude: payload.latitude,
      longitude: payload.longitude,
      ownerMobile: payload.ownerMobile,
      directNumber: payload.directNumber,
      decisionMaker: payload.decisionMaker,
      kitchenCode: payload.kitchenCode,
      seatingCapacity: payload.seatingCapacity,
      additionalInfo: payload.additionalInfo,
      formType: payload.formType,
      parentOutletId: payload.parentOutletId,
      tenant: payload.tenant,
      property: payload.property,
      is_active: payload.is_active ?? true,
    };

    const postOnce = () =>
      httpClient.post<OutletApiDto>("/api/pos/outlets/", body, {
        timeout: 90_000,
      });

    try {
      const res = await postOnce();
      const mapped = mapOutletApiToPosOutlet(res.data);
      saveLocalCustomOutlet(mapped);
      return mapped;
    } catch (err: unknown) {
      const message = String((err as { message?: string })?.message || "");
      const isTimeout = message.toLowerCase().includes("timeout");
      if (isTimeout) {
        try {
          const res = await postOnce();
          const mapped = mapOutletApiToPosOutlet(res.data);
          saveLocalCustomOutlet(mapped);
          return mapped;
        } catch {
          // fallback to local creation below
        }
      }

      // Offline / network fallback: persist locally so new HO/Kitchen appears immediately
      const kind = (payload.outlet_type || "PRIMARY").toUpperCase();
      const localCreated: PosOutlet = {
        id: `outlet-local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: payload.name,
        code: payload.code || payload.alias || `OUT-${Date.now().toString().slice(-4)}`,
        type: mapOutletType(payload.outlet_type),
        outletKind: kind,
        cuisine:
          payload.cuisine ||
          (payload.formType === "HO" || kind === "HO"
            ? "Head Office"
            : payload.formType === "Kitchen" || kind === "KITCHEN"
            ? "Central Kitchen"
            : "Multi-Cuisine"),
        description: payload.additionalInfo || `${kind} · Location`,
        address: payload.address || "",
        contact: payload.phone || payload.ownerMobile || payload.directNumber || "",
        orderTypes:
          kind === "KITCHEN" || kind === "VIRTUAL"
            ? ["Online Delivery", "Takeaway"]
            : ["Dine-In", "Takeaway", "Room Service"],
        status: payload.is_active === false ? "Inactive" : "Active",
        menuCount: 0,
        city: payload.city || "",
        email: payload.email || undefined,
        parentOutletId: payload.parentOutletId || null,
      };
      saveLocalCustomOutlet(localCreated);
      return localCreated;
    }
  },

  /** Find or create the live Highway Inn dining floor so tables persist like any other outlet. */
  async ensureHighwayInnOutlet(existing: PosOutlet[]): Promise<PosOutlet | null> {
    const found = findLiveHighwayInn(existing);
    if (found) return found;
    try {
      return await posOutletsService.createOutlet({
        name: "HIGHWAY INN BAR & RESTAURANT",
        code: "HI-MAIN",
        outlet_type: "PRIMARY",
        cuisine: "Multi-Cuisine & Bar",
        phone: "+91 98765 43210",
        address: "National Highway 48, Mumbai - Pune Expressway, Sector 4",
        additionalInfo: "Main flagship dining, bar lounge, banquet, and room service counter.",
        is_active: true,
      });
    } catch {
      const retry = await posOutletsService.listOutlets();
      return findLiveHighwayInn(retry) || null;
    }
  },
};
