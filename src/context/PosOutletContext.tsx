import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { PosOutlet } from "@/types/posMenu";
import { toast } from "sonner";
import {
  findLiveHighwayInn,
  posOutletsService,
  type CreateOutletPayload,
} from "@/services/posOutletsService";
import { firstLiveDiningOutlet } from "@/utils/outletKind";
import {
  deduplicateOutlets,
  isDummyOutlet,
  isHighwayDemoOutlet,
  isHighwayInnName,
} from "@/utils/outletId";

const STORAGE_KEY_ACTIVE_ID = "retrod_pos_active_outlet_id";

export const KNOWN_DUMMY_IDS = new Set([
  "84390446-1aa7-4964-9f9f-12822243c92d", // test
  "bcd3fd81-de8b-4831-8a33-197751ded7be", // Browser Fix HO
  "8f06e784-f77e-4e96-b7fa-f451a5e78a58", // Curl Test HO
  "7b64c429-6f0e-453b-bfca-af605fe5a50f", // Outlet List UI HO
  "f3589a9b-2619-4bff-b254-7545749a4c10", // Seaside Grand Cafe
  "e1f34cfe-7a87-42fc-8f99-a9223aa288aa", // Skyline Rooftop Bar & Grill
]);

/** The 3 canonical production outlets */
export const INITIAL_OUTLETS: PosOutlet[] = [
  {
    id: "0514a00f-5640-4ea4-81a4-32548d190625",
    name: "HIGHWAY INN BAR & RESTAURANT",
    code: "HI-MAIN",
    type: "Primary Outlet",
    outletKind: "PRIMARY",
    cuisine: "Multi-Cuisine & Bar",
    description: "Main flagship dining, bar lounge, banquet, and room service counter.",
    address: "National Highway 48, Mumbai - Pune Expressway, Sector 4",
    contact: "+91 98765 43210",
    orderTypes: ["Dine-In", "Takeaway", "Room Service", "Aggregators"],
    status: "Active",
    menuCount: 0,
    propertyId: "1c2e5dd3-1df0-4567-9524-c4e42987751a",
    tenantId: "24a3d4ee-7b9a-4771-b8da-0b131619d77a",
  },
  {
    id: "46e3dc56-fa87-47c2-9f04-66531440fd9b",
    name: "The Grand Pavilion Restaurant",
    code: "OUT-MAIN-01",
    type: "Primary Outlet",
    outletKind: "PRIMARY",
    cuisine: "Continental & North Indian",
    description: "Continental & North Indian · Property",
    address: "",
    contact: "+91-9876543210",
    email: "pavilion@retrod.com",
    orderTypes: ["Dine-In", "Takeaway", "Room Service"],
    status: "Active",
    menuCount: 0,
    propertyId: "1c2e5dd3-1df0-4567-9524-c4e42987751a",
    tenantId: "24a3d4ee-7b9a-4771-b8da-0b131619d77a",
  },
  {
    id: "2f4d03f1-193a-464d-a978-f900dfeea0c3",
    name: "Bite Square",
    code: "BS-18",
    type: "Primary Outlet",
    outletKind: "HO",
    cuisine: "Head Office",
    description: "HO · Location",
    address: "Nayapalli",
    city: "Khorda",
    contact: "9828989876",
    email: "bitesquare@gmail.com",
    orderTypes: ["Dine-In", "Takeaway", "Room Service"],
    status: "Active",
    menuCount: 0,
    propertyId: "1c2e5dd3-1df0-4567-9524-c4e42987751a",
    tenantId: "24a3d4ee-7b9a-4771-b8da-0b131619d77a",
  },
];

/** Clean out any stale dummy outlet identifiers from browser localStorage */
function cleanBrowserStorage() {
  if (typeof window === "undefined") return;
  try {
    const active = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
    if (active && KNOWN_DUMMY_IDS.has(active)) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, INITIAL_OUTLETS[0].id);
    }
    const customKey = "retrod_pos_custom_outlets";
    const raw = localStorage.getItem(customKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (o) => !isDummyOutlet(o?.name, o?.code) && !KNOWN_DUMMY_IDS.has(o?.id),
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
  // Discard any dummy outlets from incoming
  const cleanIncoming = incoming.filter(
    (o) => !isDummyOutlet(o.name, o.code) && !KNOWN_DUMMY_IDS.has(o.id),
  );

  let combined: PosOutlet[];
  if (cleanIncoming.length > 0) {
    // Incoming from backend is authoritative. Only retain unsaved offline local drafts.
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

  // Deduplicate strictly
  const deduped = deduplicateOutlets(combined, activeId).filter(
    (o) => !isDummyOutlet(o.name, o.code) && !KNOWN_DUMMY_IDS.has(o.id),
  );

  // Ensure the 3 canonical outlets always exist
  for (const init of INITIAL_OUTLETS) {
    if (
      !deduped.some(
        (o) =>
          o.id === init.id ||
          (o.code && o.code === init.code) ||
          o.name.toLowerCase() === init.name.toLowerCase(),
      )
    ) {
      deduped.push(init);
    }
  }

  // Highway Inn at the top, then sorted alphabetically by name
  deduped.sort((a, b) => {
    const aH = isHighwayInnName(a.name, a.code) || isHighwayDemoOutlet(a.id);
    const bH = isHighwayInnName(b.name, b.code) || isHighwayDemoOutlet(b.id);
    if (aH && !bH) return -1;
    if (!aH && bH) return 1;
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
  const [outlets, setOutlets] = useState<PosOutlet[]>(INITIAL_OUTLETS);
  const [isLoadingOutlets, setIsLoadingOutlets] = useState(false);
  const [activeOutletId, setActiveOutletId] = useState<string>(() => {
    if (typeof window === "undefined") return INITIAL_OUTLETS[0].id;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (stored && !KNOWN_DUMMY_IDS.has(stored)) {
        return stored;
      }
      return INITIAL_OUTLETS[0].id;
    } catch {
      return INITIAL_OUTLETS[0].id;
    }
  });

  const refreshOutlets = useCallback(async () => {
    try {
      let remote = await posOutletsService.listOutlets();
      remote = remote.filter(
        (o) => !isDummyOutlet(o.name, o.code) && !KNOWN_DUMMY_IDS.has(o.id),
      );
      const highway = await posOutletsService.ensureHighwayInnOutlet(remote);
      if (highway && !remote.some((o) => o.id === highway.id)) {
        remote = [highway, ...remote];
      }
      setOutlets((prev) => {
        const merged = mergeOutletLists(prev, remote);
        return merged;
      });
      setActiveOutletId((prevId) => {
        if (prevId && !KNOWN_DUMMY_IDS.has(prevId)) {
          return prevId;
        }
        return INITIAL_OUTLETS[0].id;
      });
    } catch {
      setOutlets((prev) => mergeOutletLists(prev, []));
    } finally {
      setIsLoadingOutlets(false);
    }
  }, []);

  useEffect(() => {
    void refreshOutlets();
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
    findLiveHighwayInn(outlets) ||
    firstLiveDiningOutlet(outlets) ||
    outlets[0] ||
    INITIAL_OUTLETS[0];

  const handleSetActiveOutlet = (outletId: string) => {
    const target = outlets.find((o) => o.id === outletId);
    if (!target) return;
    setActiveOutletId(outletId);
    toast.info("Switched outlet context to " + target.name);
  };

  const createOutletFromForm = async (payload: CreateOutletPayload) => {
    const created = await posOutletsService.createOutlet(payload);
    setOutlets((prev) => mergeOutletLists(prev, [created], created.id));
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
    if (!target || target.type === "Primary Outlet" || id === "outlet-primary") {
      toast.error("Primary outlet cannot be deleted");
      return;
    }
    setOutlets((prev) => prev.filter((o) => o.id !== id));
    if (activeOutletId === id) {
      setActiveOutletId(findLiveHighwayInn(outlets)?.id || INITIAL_OUTLETS[0].id);
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
