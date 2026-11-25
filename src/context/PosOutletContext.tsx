import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { PosOutlet } from "@/types/posMenu";
import { toast } from "sonner";
import { posOutletsService, type CreateOutletPayload } from "@/services/posOutletsService";
import { deduplicateOutlets, isDummyOutlet, isBackendOutletId } from "@/utils/outletId";
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
export const DEMO_OUTLET_IDS = new Set<string>();

export const DEFAULT_FALLBACK_OUTLET: PosOutlet = {
  id: "",
  name: "No Outlet Selected",
  code: "",
  type: "Primary Outlet",
  outletKind: "PRIMARY",
  cuisine: "Multi-Cuisine & Bar",
  description: "No POS outlet selected",
  address: "",
  contact: "",
  orderTypes: ["Dine-In", "Takeaway", "Room Service"],
  status: "Inactive",
  menuCount: 0,
};

export const INITIAL_OUTLETS: PosOutlet[] = [];

/** Clean out any stale dummy outlet identifiers from browser localStorage */
function cleanBrowserStorage() {
  if (typeof window === "undefined") return;
  try {
    const active = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
    if (active && (KNOWN_DUMMY_IDS.has(active) || active.startsWith("outlet-"))) {
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
  hasOutlets: boolean;
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
  const [outlets, setOutlets] = useState<PosOutlet[]>([]);
  const [isLoadingOutlets, setIsLoadingOutlets] = useState(true);
  const [activeOutletId, setActiveOutletId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (stored && isBackendOutletId(stored) && !KNOWN_DUMMY_IDS.has(stored) && !DEMO_OUTLET_IDS.has(stored)) {
        return stored;
      }
      return "";
    } catch {
      return "";
    }
  });

  const getActivePropertyInfo = useCallback(() => {
    let storedPropId =
      (typeof window !== "undefined"
        ? localStorage.getItem("retrod:active-property-id") ||
          localStorage.getItem("retrod_property_id") ||
          getDomainCookie("retrod_property_id")
        : null) ||
      user?.properties?.[0]?.id ||
      null;

    if (storedPropId && user?.properties && user.properties.length > 0 && !user.properties.some((p) => p.id === storedPropId)) {
      storedPropId = user.properties[0].id;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("retrod:active-property-id", storedPropId);
          localStorage.setItem("retrod_property_id", storedPropId);
        } catch {}
      }
    } else if (!storedPropId && user?.properties && user.properties.length > 0) {
      storedPropId = user.properties[0].id;
      if (typeof window !== "undefined" && storedPropId) {
        try {
          localStorage.setItem("retrod:active-property-id", storedPropId);
          localStorage.setItem("retrod_property_id", storedPropId);
        } catch {}
      }
    }

    const matchedProp = user?.properties?.find((p) => p.id === storedPropId);
    const propName = matchedProp?.name || user?.property || "Main Restaurant";

    return { propId: storedPropId, propName };
  }, [user]);

  const refreshOutlets = useCallback(async () => {
    setIsLoadingOutlets(true);
    try {
      const { propId } = getActivePropertyInfo();
      const tenantSub = user?.tenant_subdomain || undefined;

      // 1. Fetch outlets scoped to active property & tenant from DB
      let remote = await posOutletsService.listOutlets({
        propertyId: propId || undefined,
        tenantId: tenantSub,
      });

      // 2. If property filter had 0 outlets but tenant has outlets under another property, fallback to tenant query
      if (remote.length === 0 && propId && tenantSub) {
        remote = await posOutletsService.listOutlets({
          tenantId: tenantSub,
        });
      }

      // Filter out dummy outlets
      remote = remote.filter((o) => {
        if (!o) return false;
        if (isDummyOutlet(o.name, o.code) || KNOWN_DUMMY_IDS.has(o.id)) return false;
        return true;
      });

      // If real outlets exist, remove any legacy "Strict Minimal" empty outlets
      const hasRealOutlets = remote.some((o) => !o.name.toLowerCase().includes("strict"));
      if (hasRealOutlets) {
        remote = remote.filter((o) => !o.name.toLowerCase().includes("strict"));
      }

      // Truthful DB state: do NOT auto-create outlets or inject client-side fallbacks when DB has 0 outlets
      const finalOutlets = remote.length > 0 ? deduplicateOutlets(remote) : [];

      setOutlets(finalOutlets);
      if (finalOutlets.length === 0) {
        try {
          localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
          localStorage.removeItem("retrod_pos_custom_outlets");
        } catch {}
        setActiveOutletId("");
        return;
      }

      setActiveOutletId((prevId) => {
        // Priority 1: User's explicitly assigned outlet
        const userAssignedId = user?.assigned_outlet_id || user?.outlet_id;
        if (userAssignedId && finalOutlets.some((o) => o.id === userAssignedId)) {
          const matched = finalOutlets.find((o) => o.id === userAssignedId)!;
          try {
            localStorage.setItem(STORAGE_KEY_ACTIVE_ID, userAssignedId);
            if (matched.propertyId) {
              localStorage.setItem("retrod:active-property-id", matched.propertyId);
              localStorage.setItem("retrod_property_id", matched.propertyId);
            }
          } catch {}
          return userAssignedId;
        }

        // Priority 2: Stored previous active outlet IF it actually belongs to finalOutlets
        const storedActive =
          typeof window !== "undefined"
            ? localStorage.getItem(STORAGE_KEY_ACTIVE_ID)
            : null;
        const candidateId = prevId || storedActive;
        if (
          candidateId &&
          isBackendOutletId(candidateId) &&
          finalOutlets.some((o) => o.id === candidateId)
        ) {
          try {
            localStorage.setItem(STORAGE_KEY_ACTIVE_ID, candidateId);
          } catch {}
          return candidateId;
        }

        // Priority 3: Primary physical outlet or first backend outlet
        const primaryOutlet = finalOutlets.find((o) => o.outletKind === "PRIMARY" && isBackendOutletId(o.id));
        const chosen =
          primaryOutlet ||
          finalOutlets.find((o) => isBackendOutletId(o.id) && !o.name.toLowerCase().includes("strict")) ||
          finalOutlets.find((o) => isBackendOutletId(o.id)) ||
          finalOutlets[0];

        const nextId = chosen?.id || "";
        if (nextId && isBackendOutletId(nextId)) {
          try {
            localStorage.setItem(STORAGE_KEY_ACTIVE_ID, nextId);
          } catch {}
        }
        if (chosen?.propertyId && typeof window !== "undefined") {
          try {
            localStorage.setItem("retrod:active-property-id", chosen.propertyId);
            localStorage.setItem("retrod_property_id", chosen.propertyId);
          } catch {}
        }
        return nextId;
      });
    } catch {
      setOutlets([]);
      setActiveOutletId("");
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
      orderTypes: data.orderTypes,
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
        orderTypes: data.orderTypes,
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
        hasOutlets: outlets.length > 0,
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
