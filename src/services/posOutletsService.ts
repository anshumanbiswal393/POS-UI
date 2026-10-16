import httpClient from "@/utils/httpClient";
import type { PosOutlet } from "@/types/posMenu";

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

function mapOutletType(apiType?: string): PosOutlet["type"] {
  const t = (apiType || "").toUpperCase();
  if (t === "PRIMARY" || t === "HO" || t === "BAR" || t === "BANQUET" || t === "CAFE") {
    return "Primary Outlet";
  }
  return "Virtual Outlet";
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
  return {
    id: String(dto.id),
    name: dto.name,
    code: dto.code,
    type: mapOutletType(dto.outlet_type),
    cuisine: dto.cuisine || (typeof meta.form_type === "string" ? String(meta.form_type) : "Multi-Cuisine"),
    description:
      (typeof meta.additional_info === "string" && meta.additional_info) ||
      `${dto.outlet_type || "OUTLET"} · ${dto.property_name || "Property"}`,
    address,
    contact: dto.phone || (typeof meta.owner_mobile === "string" ? meta.owner_mobile : "") || "",
    orderTypes:
      (dto.outlet_type || "").toUpperCase() === "KITCHEN" ||
      (dto.outlet_type || "").toUpperCase() === "VIRTUAL"
        ? ["Online Delivery", "Takeaway"]
        : ["Dine-In", "Takeaway", "Room Service"],
    status: dto.is_active === false ? "Inactive" : "Active",
    menuCount: 0,
    parentOutletId,
  };
}

function unwrapList(data: unknown): OutletApiDto[] {
  if (Array.isArray(data)) return data as OutletApiDto[];
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: OutletApiDto[] }).results;
  }
  return [];
}

export const posOutletsService = {
  async listOutlets(params?: { propertyId?: string; tenantId?: string }): Promise<PosOutlet[]> {
    const res = await httpClient.get("/api/pos/outlets/", {
      params: {
        property_id: params?.propertyId,
        tenant_id: params?.tenantId,
        page_size: 200,
      },
    });
    return unwrapList(res.data).map(mapOutletApiToPosOutlet);
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
      return mapOutletApiToPosOutlet(res.data);
    } catch (err: unknown) {
      const message = String((err as { message?: string })?.message || "");
      const isTimeout = message.toLowerCase().includes("timeout");
      if (!isTimeout) throw err;
      // One retry after remote DB stall
      const res = await postOnce();
      return mapOutletApiToPosOutlet(res.data);
    }
  },
};
