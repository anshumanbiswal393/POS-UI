import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "retrod:selected-pos-date";
const EVENT_NAME = "retrod:pos-date-changed";

export function getTodayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatPosDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export function usePosDate() {
  const realTodayStr = getTodayIso();

  const getInitialDate = (): string => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlDate = urlParams.get("date");
      if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) {
        return urlDate;
      }
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && /^\d{4}-\d{2}-\d{2}$/.test(stored)) {
        return stored;
      }
    }
    return realTodayStr;
  };

  const [selectedDateStr, setSelectedDateStr] = useState<string>(getInitialDate);

  const updateDate = useCallback(
    (newDateStr: string) => {
      if (!newDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(newDateStr)) return;
      setSelectedDateStr(newDateStr);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, newDateStr);
        window.dispatchEvent(
          new CustomEvent(EVENT_NAME, { detail: { date: newDateStr } })
        );

        // Update URL query param without full reload
        const url = new URL(window.location.href);
        if (newDateStr === realTodayStr) {
          url.searchParams.delete("date");
        } else {
          url.searchParams.set("date", newDateStr);
        }
        window.history.replaceState({}, "", url.toString());
      }
    },
    [realTodayStr]
  );

  const resetToToday = useCallback(() => {
    updateDate(realTodayStr);
  }, [realTodayStr, updateDate]);

  useEffect(() => {
    const handleCustomEvent = (e: any) => {
      const d = e?.detail?.date;
      if (d && d !== selectedDateStr) {
        setSelectedDateStr(d);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue && e.newValue !== selectedDateStr) {
        setSelectedDateStr(e.newValue);
      }
    };

    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlDate = urlParams.get("date");
      if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) {
        setSelectedDateStr(urlDate);
      } else {
        setSelectedDateStr(realTodayStr);
      }
    };

    window.addEventListener(EVENT_NAME, handleCustomEvent);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener(EVENT_NAME, handleCustomEvent);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [selectedDateStr, realTodayStr]);

  const isToday = selectedDateStr === realTodayStr;
  const formattedDate = formatPosDisplayDate(selectedDateStr);

  return {
    selectedDateStr,
    setSelectedDate: updateDate,
    resetToToday,
    isToday,
    realTodayStr,
    formattedDate,
  };
}
