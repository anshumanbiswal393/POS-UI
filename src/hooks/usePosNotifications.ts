import { useCallback, useEffect, useMemo, useState } from "react";

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

const SEED: Array<Omit<PosNotification, "isRead">> = [
  {
    id: "pos-n1",
    title: "New dine-in order",
    message: "Table B23 · 2 items · ₹1,240 placed at the main counter.",
    category: "ORDER",
    createdAt: Date.now() - 2 * 60 * 1000,
    link: "/pos/orders",
  },
  {
    id: "pos-n2",
    title: "Kitchen order ready",
    message: "KOT #1 — Tandoori Chicken (Half) is ready for pickup.",
    category: "KOT",
    createdAt: Date.now() - 8 * 60 * 1000,
    link: "/pos/kot",
  },
  {
    id: "pos-n3",
    title: "Pending settlement",
    message: "Table B24 has an unpaid bill of ₹520 waiting at billing.",
    category: "PAYMENT",
    createdAt: Date.now() - 18 * 60 * 1000,
    link: "/pos/settlement",
  },
  {
    id: "pos-n4",
    title: "Low stock alert",
    message: "Carlsberg Elephant 650 ml is below the reorder level.",
    category: "STOCK",
    createdAt: Date.now() - 42 * 60 * 1000,
    link: "/pos/inventory/available-stock",
  },
  {
    id: "pos-n5",
    title: "Pickup order confirmed",
    message: "Online pickup #RET-9040 is confirmed and waiting in kitchen.",
    category: "ONLINE",
    createdAt: Date.now() - 3 * 60 * 60 * 1000,
    link: "/pos/orders",
  },
  {
    id: "pos-n6",
    title: "Day-end reminder",
    message: "Close the shift and print the day-end summary before logout.",
    category: "SYSTEM",
    createdAt: Date.now() - 6 * 60 * 60 * 1000,
    link: "/pos/reports/day-end",
  },
];

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
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setReadIds(readStoredIds());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStoredIds(readIds);
  }, [hydrated, readIds]);

  const notifications = useMemo<PosNotification[]>(
    () =>
      SEED.map((item) => ({
        ...item,
        isRead: readIds.has(item.id),
      })).sort((a, b) => b.createdAt - a.createdAt),
    [readIds],
  );

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
      if (next.size === prev.size) return prev;
      return next;
    });
  }, []);

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
