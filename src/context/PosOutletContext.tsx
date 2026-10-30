import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { PosOutlet } from "@/types/posMenu";
import { toast } from "sonner";
import { posOutletsService, type CreateOutletPayload } from "@/services/posOutletsService";
import { deduplicateOutlets, isDummyOutlet } from "@/utils/outletId";
import { useAuth } from "@/hooks/useAuth";
import { getDomainCookie } from "@/utils/cookieAuth";

const STORAGE_KEY_ACTIVE_ID = "retrod_pos_active_outlet_id";

export const KNOWN_DUMMY_IDS = new Set([
  "84390446-1aa7-4964-9f9f-12822243c92d", // test
  "bcd3fd81-de8b-4831-8a33-197751ded7be", // Browser Fix HO
  "8f06e784-f77e-4e96-b7fa-f451a5e78a58", // Curl Test HO
  "7b64c429-6f0e-453b-bfca-af605fe5a50f", // Outlet List UI HO
  "f3589a9b-2619-4bff-b254-7545749a4c10", // Seaside Grand Cafe
  "e1f34cfe-7a87-42fc-8f99-a9223aa288aa", // Skyline Rooftop Bar & Grill
]);

/** Legacy hardcoded demo outlets from tenant test which must not leak to other properties */
export const DEMO_OUTLET_IDS = new Set([
  "0514a00f-5640-4ea4-81a4-32548d190625", // HIGHWAY INN
  "46e3dc56-fa87-47c2-9f04-66531440fd9b", // Grand Pavilion
  "2f4d03f1-193a-464d-a978-f900dfeea0c3", // Bite Square
]);

export const DEFAULT_FALLBACK_OUTLET: PosOutlet = {
  id: "outlet-default",
  name: "Main Outlet",
  code: "MAIN-01",
  type: "Primary Outlet",
  outletKind: "PRIMARY",
  cuisine: "Multi-Cuisine & Bar",
  description: "Primary dining and POS outlet",
  address: "",
  contact: "",
  orderTypes: ["Dine-In", "Takeaway", "Room Service"],
  status: "Active",
  menuCount: 0,
};

export const INITIAL_OUTLETS: PosOutlet[] = [DEFAULT_FALLBACK_OUTLET];

/** Clean out any stale dummy outlet identifiers from browser localStorage */
function cleanBrowserStorage() {
  if (typeof window === "undefined") return;
  try {
    const active = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
    if (active && (KNOWN_DUMMY_IDS.has(active) || DEMO_OUTLET_IDS.has(active))) {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
    }
    const customKey = "retrod_pos_custom_outlets";
    const raw = localStorage.getItem(customKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (o) =>
            !isDummyOutlet(o?.name, o?.code) &&
            !KNOWN_DUMMY_IDS.has(o?.id) &&
            !DEMO_OUTLET_IDS.has(o?.id),
        );
        localStorage.setItem(customKey, JSON.stringify(cleaned));
      }
    }
  } catch {
    // ignore
  }
}
cleanBrowserStorage();

function mergeOutletLists(prev: PosOutlet[], incoming: PosOutlet[], activeId?: string): PosOutlet[] {
  const cleanIncoming = incoming.filter(
    (o) => !isDummyOutlet(o.name, o.code) && !KNOWN_DUMMY_IDS.has(o.id),
  );

  let combined: PosOutlet[];
  if (cleanIncoming.length > 0) {
    const localDrafts = prev.filter(
      (p) =>
        p.id.startsWith("outlet-local-") &&
        !cleanIncoming.some(
          (inc) =>
            inc.id === p.id ||
            (inc.code && inc.code === p.code) ||
            inc.name.toLowerCase() === p.name.toLowerCase(),
        ),
    );
    combined = [...cleanIncoming, ...localDrafts];
  } else {
    combined = prev.filter(
      (p) => !isDummyOutlet(p.name, p.code) && !KNOWN_DUMMY_IDS.has(p.id),
    );
  }

  const deduped = deduplicateOutlets(combined, activeId).filter(
    (o) => !isDummyOutlet(o.name, o.code) && !KNOWN_DUMMY_IDS.has(o.id),
  );

  deduped.sort((a, b) => {
    if (a.outletKind === "PRIMARY" && b.outletKind !== "PRIMARY") return -1;
    if (a.outletKind !== "PRIMARY" && b.outletKind === "PRIMARY") return 1;
    return a.name.localeCompare(b.name);
  });

  return deduped;
}

type PosOutletContextType = {
  activeOutlet: PosOutlet;
  outlets: PosOutlet[];
  isLoadingOutlets: boolean;
  refreshOutlets: () => Promise<void>;
  setActiveOutlet: (outletId: string) => void;
  createVirtualOutlet: (
    data: Omit<PosOutlet, "id" | "type" | "menuCount"> & { menuCount?: number },
  ) => Promise<PosOutlet>;
  createOutletFromForm: (payload: CreateOutletPayload) => Promise<PosOutlet>;
  updateOutlet: (id: string, data: Partial<PosOutlet>) => void;
  toggleOutletStatus: (id: string) => void;
  deleteVirtualOutlet: (id: string) => void;
};

const PosOutletContext = createContext<PosOutletContextType | undefined>(undefined);

export function PosOutletProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [outlets, setOutlets] = useState<PosOutlet[]>([DEFAULT_FALLBACK_OUTLET]);
  const [isLoadingOutlets, setIsLoadingOutlets] = useState(false);
  const [activeOutletId, setActiveOutletId] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_FALLBACK_OUTLET.id;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (stored && !KNOWN_DUMMY_IDS.has(stored) && !DEMO_OUTLET_IDS.has(stored)) {
        return stored;
      }
      return DEFAULT_FALLBACK_OUTLET.id;
    } catch {
      return DEFAULT_FALLBACK_OUTLET.id;
    }
  });

  const getActivePropertyInfo = useCallback(() => {
    const storedPropId =
      (typeof window !== "undefined"
        ? localStorage.getItem("retrod:active-property-id") ||
          localStorage.getItem("retrod_property_id") ||
          getDomainCookie("retrod_property_id")
        : null) ||
      user?.properties?.[0]?.id ||
      null;

    const matchedProp = user?.properties?.find((p) => p.id === storedPropId);
    const propName = matchedProp?.name || user?.property || "Main Property";

    return { propId: storedPropId, propName };
  }, [user]);

  const refreshOutlets = useCallback(async () => {
    setIsLoadingOutlets(true);
    try {
      const { propId, propName } = getActivePropertyInfo();

      let remote = await posOutletsService.listOutlets({
        propertyId: propId || undefined,
        tenantId: user?.tenant_subdomain || undefined,
      });

      // Filter out dummy outlets and demo outlets from other properties
      remote = remote.filter((o) => {
        if (!o) return false;
        if (isDummyOutlet(o.name, o.code) || KNOWN_DUMMY_IDS.has(o.id)) return false;
        if (propId && propId !== "1c2e5dd3-1df0-4567-9524-c4e42987751a" && DEMO_OUTLET_IDS.has(o.id)) return false;
        if (propId && o.propertyId && o.propertyId !== propId) return false;
        return true;
      });

      let finalOutlets: PosOutlet[];

      if (remote.length > 0) {
        finalOutlets = deduplicateOutlets(remote);
      } else {
        // Fallback dynamically scoped to current property
        const propCode =
          (propName.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || "MAIN") + "-01";
        const dynamicDefault: PosOutlet = {
          id: propId ? `outlet-${propId}` : "outlet-default",
          name: `${propName} Restaurant`,
          code: propCode,
          type: "Primary Outlet",
          outletKind: "PRIMARY",
          cuisine: "Multi-Cuisine & Bar",
          description: `Main dining outlet for ${propName}`,
          address: "",
          contact: user?.phone || "",
          orderTypes: ["Dine-In", "Takeaway", "Room Service"],
          status: "Active",
          menuCount: 0,
          propertyId: propId || null,
          tenantId: user?.tenant_subdomain || null,
        };
        finalOutlets = [dynamicDefault];
      }

      setOutlets(finalOutlets);
      setActiveOutletId((prevId) => {
        if (prevId && finalOutlets.some((o) => o.id === prevId)) {
          return prevId;
        }
        return finalOutlets[0].id;
      });
    } catch {
      const { propId, propName } = getActivePropertyInfo();
      const dynamicDefault: PosOutlet = {
        id: propId ? `outlet-${propId}` : "outlet-default",
        name: `${propName} Restaurant`,
        code: "MAIN-01",
        type: "Primary Outlet",
        outletKind: "PRIMARY",
        cuisine: "Multi-Cuisine & Bar",
        description: `Main dining outlet for ${propName}`,
        address: "",
        contact: "",
        orderTypes: ["Dine-In", "Takeaway", "Room Service"],
        status: "Active",
        menuCount: 0,
        propertyId: propId || null,
      };
      setOutlets([dynamicDefault]);
      setActiveOutletId(dynamicDefault.id);
    } finally {
      setIsLoadingOutlets(false);
    }
  }, [user, getActivePropertyInfo]);

  useEffect(() => {
    void refreshOutlets();
  }, [refreshOutlets]);

  useEffect(() => {
    const handlePropertyChange = () => {
      void refreshOutlets();
    };
    window.addEventListener("retrod:property:change", handlePropertyChange);
    window.addEventListener("storage", handlePropertyChange);
    return () => {
      window.removeEventListener("retrod:property:change", handlePropertyChange);
      window.removeEventListener("storage", handlePropertyChange);
    };
  }, [refreshOutlets]);

  useEffect(() => {
    if (!activeOutletId) return;
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeOutletId);
    } catch {
      // ignore
    }
  }, [activeOutletId]);

  const activeOutlet =
    outlets.find((o) => o.id === activeOutletId) ||
    outlets[0] ||
    DEFAULT_FALLBACK_OUTLET;

  const handleSetActiveOutlet = (outletId: string) => {
    const target = outlets.find((o) => o.id === outletId);
    if (!target) return;
    setActiveOutletId(outletId);
    toast.info("Switched outlet context to " + target.name);
  };

  const createOutletFromForm = async (payload: CreateOutletPayload) => {
    const { propId } = getActivePropertyInfo();
    const created = await posOutletsService.createOutlet({
      ...payload,
      property: payload.property || propId || undefined,
      tenant: payload.tenant || user?.tenant_subdomain || undefined,
    });
    setOutlets((prev) => deduplicateOutlets([created, ...prev], created.id));
    setActiveOutletId(created.id);
    const role =
      payload.formType === "HO" || payload.outlet_type === "HO"
        ? "Head Office"
        : payload.formType === "Kitchen" || payload.outlet_type === "KITCHEN"
        ? "Central Kitchen"
        : "Outlet";
    toast.success(role + ' "' + created.name + '" created and selected');
    return created;
  };

  const createVirtualOutlet = async (
    data: Omit<PosOutlet, "id" | "type" | "menuCount"> & { menuCount?: number },
  ) => {
    const parentId =
      data.parentOutletId ||
      (activeOutlet.type === "Primary Outlet"
        ? activeOutlet.id
        : activeOutlet.parentOutletId || activeOutlet.id);

    return createOutletFromForm({
      name: data.name,
      code: data.code,
      outlet_type: "VIRTUAL",
      cuisine: data.cuisine,
      phone: data.contact,
      address: data.address,
      additionalInfo: data.description,
      formType: "Kitchen",
      parentOutletId: parentId,
      is_active: data.status !== "Inactive",
    });
  };

  const updateOutlet = async (id: string, data: Partial<PosOutlet>) => {
    setOutlets((prev) => prev.map((o) => (o.id === id ? { ...o, ...data } : o)));
    try {
      await posOutletsService.updateOutlet(id, {
        name: data.name,
        code: data.code,
        cuisine: data.cuisine,
        email: data.email,
        phone: data.contact,
        address: data.address,
        status: data.status,
      });
    } catch {
      // ignore
    }
    toast.success("Outlet details updated");
  };

  const toggleOutletStatus = (id: string) => {
    setOutlets((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const next = o.status === "Active" ? "Inactive" : "Active";
          toast.info(o.name + " is now " + next);
          return { ...o, status: next };
        }
        return o;
      }),
    );
  };

  const deleteVirtualOutlet = (id: string) => {
    const target = outlets.find((o) => o.id === id);
    if (!target || target.type === "Primary Outlet") {
      toast.error("Primary outlet cannot be deleted");
      return;
    }
    setOutlets((prev) => prev.filter((o) => o.id !== id));
    if (activeOutletId === id) {
      setActiveOutletId(outlets.find((o) => o.id !== id)?.id || DEFAULT_FALLBACK_OUTLET.id);
    }
    toast.success('Virtual outlet "' + target.name + '" removed');
  };

  return (
    <PosOutletContext.Provider
      value={{
        activeOutlet,
        outlets,
        isLoadingOutlets,
        refreshOutlets,
        setActiveOutlet: handleSetActiveOutlet,
        createVirtualOutlet,
        createOutletFromForm,
        updateOutlet,
        toggleOutletStatus,
        deleteVirtualOutlet,
      }}
    >
      {children}
    </PosOutletContext.Provider>
  );
}

export function useOutletContext() {
  const ctx = useContext(PosOutletContext);
  if (!ctx) {
    throw new Error("useOutletContext must be used within a PosOutletProvider");
  }
  return ctx;
}
