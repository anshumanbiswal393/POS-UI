import { useCallback, useEffect, useMemo, useState } from "react";
import { useStockAlerts } from "@/hooks/queries/usePosInventory";
import { useOutletContext } from "@/context/PosOutletContext";
import { isBackendOutletId } from "@/utils/outletId";
import { KOT_READY_EVENT, listKotReadyNotices } from "@/lib/posReadyNotifications";

export type PosNotificationCategory =
  | "ORDER"
  | "KOT"
  | "PAYMENT"
  | "STOCK"
  | "ONLINE"
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
  const { activeOutlet } = useOutletContext();
  const liveOutlet = isBackendOutletId(activeOutlet?.id);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [readyTick, setReadyTick] = useState(0);

  useEffect(() => {
    setReadIds(readStoredIds());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStoredIds(readIds);
  }, [hydrated, readIds]);

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
    return [...alerts, ...kotReady, ...seed.map((item) => ({ ...item, isRead: readIds.has(item.id) }))].sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  }, [readIds, stockAlerts, liveOutlet, activeOutlet?.id, readyTick]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
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

  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      SEED.forEach((item) => next.add(item.id));
      stockAlerts.forEach((item) => next.add(item.id));
      listKotReadyNotices(activeOutlet?.id).forEach((note) => next.add(note.id));
      if (next.size === prev.size) return prev;
      return next;
    });
  }, [stockAlerts, activeOutlet?.id, readyTick]);

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
