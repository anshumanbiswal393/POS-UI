import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { PosOutlet } from "@/types/posMenu";
import { toast } from "sonner";
import {
  findLiveHighwayInn,
  posOutletsService,
  type CreateOutletPayload,
} from "@/services/posOutletsService";
import { firstLiveDiningOutlet, isDiningOutlet } from "@/utils/outletKind";
import { isHighwayDemoOutlet } from "@/utils/outletId";

const STORAGE_KEY_ACTIVE_ID = "retrod_pos_active_outlet_id";

/** Demo flagship outlet — keep dummy POS data; never wipe when creating other outlets. */
export const INITIAL_OUTLETS: PosOutlet[] = [
  {
    id: "outlet-primary",
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
    menuCount: 660,
  },
];

/**
 * Upsert by id. Keep the dummy Highway seed only when no live Highway Inn UUID exists.
 */
function mergeOutletLists(prev: PosOutlet[], incoming: PosOutlet[]): PosOutlet[] {
  const liveHighway = findLiveHighwayInn(incoming) || findLiveHighwayInn(prev);
  const byId = new Map<string, PosOutlet>();
  if (!liveHighway) {
    for (const o of INITIAL_OUTLETS) byId.set(o.id, o);
  }
  for (const o of prev) {
    if (liveHighway && isHighwayDemoOutlet(o.id)) continue;
    byId.set(o.id, o);
  }
  for (const o of incoming) {
    if (isHighwayDemoOutlet(o.id)) continue;
    byId.set(o.id, { ...byId.get(o.id), ...o });
  }

  const primary = [...byId.values()].filter((o) => o.type === "Primary Outlet");
  const virtual = [...byId.values()].filter((o) => o.type === "Virtual Outlet");
  primary.sort((a, b) => {
    if (findLiveHighwayInn([a]) || isHighwayDemoOutlet(a.id)) return -1;
    if (findLiveHighwayInn([b]) || isHighwayDemoOutlet(b.id)) return 1;
    return a.name.localeCompare(b.name);
  });
  return [...primary, ...virtual];
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
  const [isLoadingOutlets, setIsLoadingOutlets] = useState(true);
  const [activeOutletId, setActiveOutletId] = useState<string>(() => {
    if (typeof window === "undefined") return "outlet-primary";
    try {
      return localStorage.getItem(STORAGE_KEY_ACTIVE_ID) || "outlet-primary";
    } catch {
      return "outlet-primary";
    }
  });

  const refreshOutlets = useCallback(async () => {
    setIsLoadingOutlets(true);
    try {
      let remote = await posOutletsService.listOutlets();
      const highway = await posOutletsService.ensureHighwayInnOutlet(remote);
      if (highway && !remote.some((o) => o.id === highway.id)) {
        remote = [highway, ...remote];
      }
      setOutlets((prev) => {
        const merged = mergeOutletLists(prev, remote);
        setActiveOutletId((prevId) => {
          const liveHighway = findLiveHighwayInn(merged);
          const current = merged.find((o) => o.id === prevId);
          if (isHighwayDemoOutlet(prevId) && liveHighway) return liveHighway.id;
          if (current && isDiningOutlet(current)) return prevId;
          if (liveHighway) return liveHighway.id;
          return firstLiveDiningOutlet(merged)?.id || "outlet-primary";
        });
        return merged;
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
    outlets.find((o) => o.id === activeOutletId && isDiningOutlet(o)) ||
    findLiveHighwayInn(outlets) ||
    firstLiveDiningOutlet(outlets) ||
    outlets.find((o) => o.id === "outlet-primary") ||
    outlets.find(isDiningOutlet) ||
    INITIAL_OUTLETS[0];

  const handleSetActiveOutlet = (outletId: string) => {
    const target = outlets.find((o) => o.id === outletId);
    if (!target) return;
    if (!isDiningOutlet(target)) {
      toast.info("Head Offices and kitchens stay on Outlet List — they are not Take Order floors");
      return;
    }
    setActiveOutletId(outletId);
    toast.info(`Switched outlet context to ${target.name}`);
  };

  const createOutletFromForm = async (payload: CreateOutletPayload) => {
    const created = await posOutletsService.createOutlet(payload);
    // Append new outlet; Highway and all previous outlets stay
    setOutlets((prev) => mergeOutletLists(prev, [created]));
    if (isDiningOutlet(created)) {
      setActiveOutletId(created.id);
      toast.success(`Outlet "${created.name}" created — starts blank (separate from Highway Inn)`);
    }
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
      parentOutletId: parentId || undefined,
      is_active: data.status !== "Inactive",
    });
  };

  const updateOutlet = (id: string, data: Partial<PosOutlet>) => {
    if (id === "outlet-primary") {
      // Allow local edits to Highway display fields only in UI state
      setOutlets((prev) => prev.map((o) => (o.id === id ? { ...o, ...data } : o)));
      toast.success("Outlet details updated");
      return;
    }
    setOutlets((prev) => prev.map((o) => (o.id === id ? { ...o, ...data } : o)));
    toast.success("Outlet details updated");
  };

  const toggleOutletStatus = (id: string) => {
    setOutlets((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const next = o.status === "Active" ? "Inactive" : "Active";
          toast.info(`${o.name} is now ${next}`);
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
      setActiveOutletId(findLiveHighwayInn(outlets)?.id || "outlet-primary");
    }
    toast.success(`Virtual outlet "${target.name}" removed`);
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
