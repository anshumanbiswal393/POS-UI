import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useStockAlerts } from "@/hooks/queries/usePosInventory";
import { usePosReservations } from "@/hooks/queries/usePosTables";
import { useOutletContext } from "@/context/PosOutletContext";
import { isBackendOutletId } from "@/utils/outletId";
import { KOT_READY_EVENT, listKotReadyNotices, dismissKotReadyNotice } from "@/lib/posReadyNotifications";
import { isReservationUpcomingWithin30Min, minutesUntilReservation } from "@/services/posTablesService";
import { Ctx } from "@/components/providers/AuthProvider";

export type PosNotificationCategory =
  | "ORDER"
  | "KOT"
  | "PAYMENT"
  | "STOCK"
  | "ONLINE"
  | "RESERVATION"
  | "SYSTEM";

export type PosNotification = {
  id: string;
  title: string;
  message: string;
  category: PosNotificationCategory;
  createdAt: number;
  link?: string;
  isRead: boolean;
};

export type PosNotificationRole = "waiter" | "kitchen" | "admin";

export interface UsePosNotificationsOptions {
  role?: string;
  roleName?: string;
  user?: any;
  now?: Date;
}

const READ_KEY = "retrod.pos.notifications.read.v1";
const DISMISSED_KEY = "retrod.pos.notifications.dismissed.v1";
const TIMESTAMPS_KEY = "retrod.pos.notifications.timestamps.v1";

const SEED: Array<Omit<PosNotification, "isRead">> = [];

function readStoredIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeStoredIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore quota */
  }
}

function readDismissedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeDismissedIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore quota */
  }
}

function readStoredTimestamps(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TIMESTAMPS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeStoredTimestamps(timestamps: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TIMESTAMPS_KEY, JSON.stringify(timestamps));
  } catch {
    /* ignore quota */
  }
}

export function formatNotificationTime(createdAt: number) {
  const diff = Math.max(0, Date.now() - createdAt);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function resolveNotificationRole(role?: string, roleName?: string): PosNotificationRole {
  const r = String(role || "").toLowerCase();
  const rn = String(roleName || "").toLowerCase();

  if (r === "pos_kitchen" || r === "kitchen" || r.includes("kitchen") || rn.includes("kitchen")) {
    return "kitchen";
  }
  if (r === "pos_waiter" || r === "waiter" || r.includes("waiter") || rn.includes("waiter")) {
    return "waiter";
  }
  return "admin";
}

export function filterNotificationsByRole(
  notifications: PosNotification[],
  role?: string,
  roleName?: string,
): PosNotification[] {
  const targetRole = resolveNotificationRole(role, roleName);

  if (targetRole === "waiter") {
    // Waiter access: ready-to-serve orders (KOT, ORDER) & reservations within 30 min (RESERVATION).
    // Excludes stock notifications.
    return notifications.filter(
      (item) => item.category === "KOT" || item.category === "ORDER" || item.category === "RESERVATION",
    );
  }

  if (targetRole === "kitchen") {
    // Kitchen access: stock notifications ONLY. No orders, no reservations.
    return notifications.filter((item) => item.category === "STOCK");
  }

  // Admin access: can see all notifications.
  return notifications;
}

export function sortNotificationsRecentFirst(notifications: PosNotification[]): PosNotification[] {
  return [...notifications].sort((a, b) => b.createdAt - a.createdAt);
}

export function usePosNotifications(options?: UsePosNotificationsOptions) {
  const { data: stockAlerts = [] } = useStockAlerts();
  const { data: reservations = [] } = usePosReservations();
  const { activeOutlet } = useOutletContext();
  const authCtx = useContext(Ctx);

  const effectiveRole = options?.role || authCtx?.user?.role;
  const effectiveRoleName = options?.roleName || authCtx?.user?.role_name;
  const currentRole = resolveNotificationRole(effectiveRole, effectiveRoleName);

  const liveOutlet = isBackendOutletId(activeOutlet?.id);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [timestamps, setTimestamps] = useState<Record<string, number>>({});
  const [hydrated, setHydrated] = useState(false);
  const [readyTick, setReadyTick] = useState(0);

  useEffect(() => {
    setReadIds(readStoredIds());
    setDismissedIds(readDismissedIds());
    setTimestamps(readStoredTimestamps());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStoredIds(readIds);
  }, [hydrated, readIds]);

  useEffect(() => {
    if (!hydrated) return;
    writeDismissedIds(dismissedIds);
  }, [hydrated, dismissedIds]);

  useEffect(() => {
    const onReady = () => setReadyTick((n) => n + 1);
    window.addEventListener(KOT_READY_EVENT, onReady);
    return () => window.removeEventListener(KOT_READY_EVENT, onReady);
  }, []);

  const getOrAssignTimestamp = useCallback(
    (id: string, fallbackTime: number = Date.now()): number => {
      if (timestamps[id]) return timestamps[id];
      const updated = { ...timestamps, [id]: fallbackTime };
      setTimestamps(updated);
      writeStoredTimestamps(updated);
      return fallbackTime;
    },
    [timestamps],
  );

  const notifications = useMemo<PosNotification[]>(() => {
    const now = options?.now || new Date();
    const seed = liveOutlet ? [] : SEED.filter((item) => item.category !== "STOCK");

    const alerts: PosNotification[] = stockAlerts.map((alert) => ({
      id: alert.id,
      title: alert.title,
      message: alert.message,
      category: "STOCK" as const,
      createdAt: getOrAssignTimestamp(alert.id, Date.now()),
      link: alert.link || "/pos/inventory/available-stock",
      isRead: readIds.has(alert.id),
    }));

    const kotReady: PosNotification[] = listKotReadyNotices(activeOutlet?.id).map((note) => ({
      id: note.id,
      title: note.title,
      message: note.message,
      category: "KOT" as const,
      createdAt: note.createdAt,
      link: "/pos/settlement",
      isRead: readIds.has(note.id),
    }));

    // Reservations: show when reservation time is coming within 30 minutes
    const resAlerts: PosNotification[] = (reservations || [])
      .filter((r) => isReservationUpcomingWithin30Min(r, now))
      .map((r) => {
        const diffMins = minutesUntilReservation(r, now);
        const timingText =
          diffMins <= 0
            ? "Due now"
            : `Arriving in ${diffMins} min${diffMins === 1 ? "" : "s"}`;
        const resId = `res-${r.id}`;
        return {
          id: resId,
          title: `Reservation: ${r.customerName || "Guest"}`,
          message: `Table ${r.tableNumber || "TBD"} · ${r.guests || 2} Guests · ${timingText} (${r.reservationTime || "Today"})`,
          category: "RESERVATION" as const,
          createdAt: getOrAssignTimestamp(resId, Date.now()),
          link: "/pos/reservations",
          isRead: readIds.has(resId),
        };
      });

    const all = [
      ...alerts,
      ...kotReady,
      ...resAlerts,
      ...seed.map((item) => ({ ...item, isRead: readIds.has(item.id) })),
    ];

    // Filter dismissed items
    const nonDismissed = all.filter((item) => !dismissedIds.has(item.id));

    // Sort order-wise: most recent at top, older below
    const sorted = sortNotificationsRecentFirst(nonDismissed);

    // Filter role-wise (waiter, kitchen, admin)
    return filterNotificationsByRole(sorted, currentRole);
  }, [
    readIds,
    dismissedIds,
    stockAlerts,
    reservations,
    liveOutlet,
    activeOutlet?.id,
    readyTick,
    currentRole,
    options?.now,
    getOrAssignTimestamp,
  ]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const hasUrgentAlerts = useMemo(
    () =>
      notifications.some(
        (item) => !item.isRead && (item.category === "KOT" || item.category === "RESERVATION"),
      ),
    [notifications],
  );

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const dismissNotification = useCallback((id: string) => {
    dismissKotReadyNotice(id);
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      writeDismissedIds(next);
      return next;
    });
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      writeStoredIds(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((item) => next.add(item.id));
      if (next.size === prev.size) return prev;
      return next;
    });
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    hasUrgentAlerts,
    currentRole,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  };
}
