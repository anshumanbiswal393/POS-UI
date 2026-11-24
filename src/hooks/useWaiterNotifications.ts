import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOutletContext } from "@/context/PosOutletContext";
import {
  posWaiterNotificationService,
  type WaiterReadyNotice,
  type WaiterServedRecord,
  WAITER_SERVED_EVENT,
} from "@/services/posWaiterNotificationService";
import { KOT_READY_EVENT } from "@/lib/posReadyNotifications";
import { toast } from "sonner";

export function useWaiterNotifications() {
  const { user } = useAuth();
  const { activeOutlet } = useOutletContext();

  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [activeNotices, setActiveNotices] = useState<WaiterReadyNotice[]>([]);
  const [history, setHistory] = useState<WaiterServedRecord[]>([]);
  const [isServing, setIsServing] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [search, setSearch] = useState("");

  const refreshActive = useCallback(() => {
    const list = posWaiterNotificationService.getActiveReadyNotices(activeOutlet?.id);
    setActiveNotices(list);
  }, [activeOutlet?.id]);

  const refreshHistory = useCallback(() => {
    const hist = posWaiterNotificationService.getServedHistory({
      startDate,
      endDate,
      search,
      outletId: activeOutlet?.id,
    });
    setHistory(hist);
  }, [startDate, endDate, search, activeOutlet?.id]);

  useEffect(() => {
    refreshActive();
    refreshHistory();

    const handleEvent = () => {
      refreshActive();
      refreshHistory();
    };

    if (typeof window !== "undefined") {
      window.addEventListener(KOT_READY_EVENT, handleEvent);
      window.addEventListener(WAITER_SERVED_EVENT, handleEvent);
      return () => {
        window.removeEventListener(KOT_READY_EVENT, handleEvent);
        window.removeEventListener(WAITER_SERVED_EVENT, handleEvent);
      };
    }
  }, [refreshActive, refreshHistory]);

  const stewardName = useMemo(() => {
    return user?.name || (user as any)?.username || "Floor Waiter";
  }, [user]);

  const markServed = useCallback(
    async (noticeId: string) => {
      setIsServing(noticeId);
      try {
        const record = await posWaiterNotificationService.markServed(
          noticeId,
          stewardName,
          activeOutlet?.id,
        );
        toast.success(`${record.orderNumber} served!`, {
          description: `${record.tableNumber} marked as served by ${stewardName}.`,
        });
        refreshActive();
        refreshHistory();
      } catch (err: any) {
        toast.error("Failed to mark order as served: " + (err?.message || "Unknown error"));
      } finally {
        setIsServing(null);
      }
    },
    [stewardName, activeOutlet?.id, refreshActive, refreshHistory],
  );

  return {
    activeTab,
    setActiveTab,
    activeNotices,
    history,
    unreadCount: activeNotices.length,
    markServed,
    isServing,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    search,
    setSearch,
    refreshActive,
    refreshHistory,
    stewardName,
  };
}
