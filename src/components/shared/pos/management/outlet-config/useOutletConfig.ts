import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useOutletContext } from "@/context/PosOutletContext";
import {
  loadOutletConfig,
  saveDraft as cacheDraft,
  saveOutletConfig,
  syncOutletConfigFromBackend,
  type OutletConfigState,
  type OutletSetupStepId,
} from "./outletConfigStore";

const pendingDraftTimers = new Map<string, number>();

function draftTimerKey(outletId: string, stepId: OutletSetupStepId) {
  return `${outletId}:${stepId}`;
}

function cancelDraftTimer(outletId: string, stepId?: OutletSetupStepId) {
  if (stepId) {
    const key = draftTimerKey(outletId, stepId);
    const timer = pendingDraftTimers.get(key);
    if (timer) window.clearTimeout(timer);
    pendingDraftTimers.delete(key);
    return;
  }
  for (const [key, timer] of pendingDraftTimers) {
    if (key.startsWith(`${outletId}:`)) {
      window.clearTimeout(timer);
      pendingDraftTimers.delete(key);
    }
  }
}

export function useOutletConfig() {
  const { outlets, activeOutlet, setActiveOutlet, updateOutlet } = useOutletContext();

  const queryOutletId = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("outletId") || undefined;
    } catch {
      return undefined;
    }
  }, []);

  const currentOutlet = useMemo(() => {
    if (queryOutletId) {
      const match = outlets.find((o) => o.id === queryOutletId);
      if (match) return match;
    }
    return activeOutlet;
  }, [queryOutletId, outlets, activeOutlet]);

  const targetId = currentOutlet.id;
  const [config, setConfig] = useState<OutletConfigState>(() => loadOutletConfig(targetId));
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setConfig(loadOutletConfig(targetId));
    setHydrating(true);
    void syncOutletConfigFromBackend(targetId)
      .then((remote) => {
        if (!cancelled) setConfig(remote);
      })
      .finally(() => {
        if (!cancelled) setHydrating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [targetId]);

  const persist = useCallback(
    async (next: OutletConfigState, message = "Configuration saved", stepId?: OutletSetupStepId) => {
      cancelDraftTimer(targetId, stepId);
      const current = loadOutletConfig(targetId);
      const withStatus: OutletConfigState = {
        ...current,
        ...next,
        stepStatus: {
          ...current.stepStatus,
          ...next.stepStatus,
          ...(stepId ? { [stepId]: "completed" as const } : {}),
        },
        draftDirty: {
          ...(current.draftDirty || {}),
          ...(next.draftDirty || {}),
          ...(stepId ? { [stepId]: false } : {}),
        },
      };
      setConfig(withStatus);
      try {
        await saveOutletConfig(targetId, withStatus, stepId);
        if (stepId === "details" && withStatus.details) {
          updateOutlet(targetId, {
            name: withStatus.details.outletName || currentOutlet.name,
            code: withStatus.details.alias || currentOutlet.code,
            cuisine: withStatus.details.cuisine || currentOutlet.cuisine,
            email: withStatus.details.email || currentOutlet.email,
            address: withStatus.details.address || currentOutlet.address,
            city: withStatus.details.city || currentOutlet.city,
          });
        }
        toast.success(message);
        return true;
      } catch {
        toast.error("Saved on this device. Backend sync failed — retry when the server is available.");
        return false;
      }
    },
    [targetId, currentOutlet, updateOutlet],
  );

  const saveDraft = useCallback(
    (next: OutletConfigState, stepId: OutletSetupStepId) => {
      const current = loadOutletConfig(targetId);
      const stored = cacheDraft(targetId, { ...current, ...next }, stepId);
      setConfig(stored);
    },
    [targetId],
  );

  return {
    outletId: targetId,
    outlet: currentOutlet,
    outlets,
    setActiveOutlet,
    config,
    setConfig,
    persist,
    saveDraft,
    hydrating,
  };
}

/** After the first paint, any form change is a local draft (In Progress). Save still writes the backend. */
export function useDraftOnChange<T>(
  stepId: OutletSetupStepId,
  form: T,
  apply: (config: OutletConfigState, form: T) => OutletConfigState,
  saveDraft: (next: OutletConfigState, stepId: OutletSetupStepId) => void,
  outletId: string,
) {
  const first = useRef(true);
  const applyRef = useRef(apply);
  applyRef.current = apply;
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (timer.current) window.clearTimeout(timer.current);
    const key = draftTimerKey(outletId, stepId);
    const existing = pendingDraftTimers.get(key);
    if (existing) window.clearTimeout(existing);
    timer.current = window.setTimeout(() => {
      pendingDraftTimers.delete(key);
      const current = loadOutletConfig(outletId);
      saveDraft(applyRef.current(current, form), stepId);
    }, 250);
    pendingDraftTimers.set(key, timer.current);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [form, outletId, saveDraft, stepId]);
}
