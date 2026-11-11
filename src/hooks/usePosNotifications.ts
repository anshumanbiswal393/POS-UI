import { useCallback, useEffect, useMemo, useState } from "react";
import { useStockAlerts } from "@/hooks/queries/usePosInventory";
import { usePosReservations } from "@/hooks/queries/usePosTables";
import { useOutletContext } from "@/context/PosOutletContext";
import { isBackendOutletId } from "@/utils/outletId";
import { KOT_READY_EVENT, listKotReadyNotices, dismissKotReadyNotice } from "@/lib/posReadyNotifications";

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

const READ_KEY = "retrod.pos.notifications.read.v1";
const DISMISSED_KEY = "retrod.pos.notifications.dismissed.v1";

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
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
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
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
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

export function usePosNotifications() {
  const { data: stockAlerts = [] } = useStockAlerts();
  const { data: reservations = [] } = usePosReservations();
  const { activeOutlet } = useOutletContext();
  const liveOutlet = isBackendOutletId(activeOutlet?.id);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [readyTick, setReadyTick] = useState(0);

  useEffect(() => {
    setReadIds(readStoredIds());
    setDismissedIds(readDismissedIds());
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

  const notifications = useMemo<PosNotification[]>(() => {
    const seed = liveOutlet ? [] : SEED.filter((item) => item.category !== "STOCK");
    const alerts: PosNotification[] = stockAlerts.map((alert) => ({
      id: alert.id,
      title: alert.title,
      message: alert.message,
      category: "STOCK",
      createdAt: Date.now(),
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
    const resAlerts: PosNotification[] = (reservations || [])
      .filter((r) => r.status === "reserved")
      .map((r) => ({
        id: `res-${r.id}`,
        title: `Reservation: ${r.customerName || "Guest"}`,
        message: `Table ${r.tableNumber || "TBD"} · ${r.guests || 2} Guests · ${r.reservationTime || "Today"}`,
        category: "RESERVATION" as const,
        createdAt: Date.now(),
        link: "/pos/reservations",
        isRead: readIds.has(`res-${r.id}`),
      }));

    const all = [
      ...alerts,
      ...kotReady,
      ...resAlerts,
      ...seed.map((item) => ({ ...item, isRead: readIds.has(item.id) })),
    ];

    return all
      .filter((item) => !dismissedIds.has(item.id))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [readIds, dismissedIds, stockAlerts, reservations, liveOutlet, activeOutlet?.id, readyTick]);

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
      SEED.forEach((item) => next.add(item.id));
      stockAlerts.forEach((item) => next.add(item.id));
      listKotReadyNotices(activeOutlet?.id).forEach((note) => next.add(note.id));
      (reservations || []).forEach((r) => next.add(`res-${r.id}`));
      if (next.size === prev.size) return prev;
      return next;
    });
  }, [stockAlerts, reservations, activeOutlet?.id, readyTick]);

  return {
    notifications,
    unreadCount,
    hasUrgentAlerts,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  };
}
