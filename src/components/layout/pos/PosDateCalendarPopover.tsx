import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePosDate } from "@/hooks/usePosDate";

export function PosDateCalendarPopover() {
  const {
    selectedDateStr,
    setSelectedDate,
    resetToToday,
    isToday,
    realTodayStr,
    formattedDate,
  } = usePosDate();

  const [open, setOpen] = useState(false);

  // Month & year for browsing inside the popover
  const [viewDate, setViewDate] = useState(() => {
    const [y, m, d] = selectedDateStr.split("-").map(Number);
    return new Date(y, m - 1, d || 1);
  });

  // Keep viewDate in sync when popover opens
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      const [y, m, d] = selectedDateStr.split("-").map(Number);
      setViewDate(new Date(y, m - 1, d || 1));
    }
  };

  const handlePrevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const year = viewDate.getFullYear();
    const month = String(viewDate.getMonth() + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    const newDateStr = `${year}-${month}-${dStr}`;
    setSelectedDate(newDateStr);
    setOpen(false);
  };

  const handleQuickSelect = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const newDateStr = `${y}-${m}-${day}`;
    setSelectedDate(newDateStr);
    setViewDate(new Date(y, d.getMonth(), d.getDate()));
    setOpen(false);
  };

  // Calendar calculations
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleDateString("en-US", { month: "long" });

  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Adjusted for Monday start (0=Mon, 6=Sun)
  const startOffset = (firstDayOfWeek + 6) % 7;

  // Selected date breakdown
  const [selY, selM, selD] = selectedDateStr.split("-").map(Number);
  const [todayY, todayM, todayD] = realTodayStr.split("-").map(Number);

  // Check which quick preset is active
  const isYesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return selectedDateStr === `${y}-${m}-${day}`;
  })();

  const isTomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return selectedDateStr === `${y}-${m}-${day}`;
  })();

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`hidden md:flex h-9 items-center gap-2 rounded-xl border px-3 text-[12.5px] font-medium transition cursor-pointer select-none shadow-2xs ${
            !isToday
              ? "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 font-bold"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
          }`}
          title="Click to select operational date for POS dashboard & operations"
        >
          <CalendarIcon
            className={`h-4 w-4 shrink-0 ${
              !isToday ? "text-emerald-700" : "text-teal-600"
            }`}
          />
          <span className="truncate max-w-[200px]">
            {isToday ? `Today · ${formattedDate}` : formattedDate}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5 shrink-0" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-[320px] p-3.5 rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl z-50 animate-in fade-in zoom-in-95"
      >
        {/* Header & Quick Options */}
        <div className="space-y-3 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold text-slate-900 uppercase tracking-wider">
              SELECT DASHBOARD DATE
            </span>
            {!isToday && (
              <button
                type="button"
                onClick={() => {
                  resetToToday();
                  setOpen(false);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset to Today
              </button>
            )}
          </div>

          {/* Quick Select Buttons: Yesterday | Today | Tomorrow */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickSelect(-1)}
              className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition text-center cursor-pointer ${
                isYesterday
                  ? "bg-[#064E3B] text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect(0)}
              className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition text-center cursor-pointer ${
                isToday
                  ? "bg-[#064E3B] text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect(1)}
              className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition text-center cursor-pointer ${
                isTomorrow
                  ? "bg-[#064E3B] text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Tomorrow
            </button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between pt-3 pb-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-900">
            {monthName} {year}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday Labels (Mo - Su) */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-500 mb-1">
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
          <span>Su</span>
        </div>

        {/* Day Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Leading empty slots */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-8 w-8" />
          ))}

          {/* Days of current month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const isSelected =
              selY === year && selM === month + 1 && selD === dayNum;
            const isCurrentToday =
              todayY === year && todayM === month + 1 && todayD === dayNum;

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => handleSelectDay(dayNum)}
                className={`h-8 w-8 rounded-lg text-xs font-semibold flex items-center justify-center transition cursor-pointer relative ${
                  isSelected
                    ? "bg-[#064E3B] text-white font-bold shadow-xs"
                    : isCurrentToday
                      ? "border border-teal-600 text-teal-700 font-bold hover:bg-teal-50"
                      : "hover:bg-slate-100 text-slate-700 font-medium"
                }`}
              >
                {dayNum}
                {isCurrentToday && !isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-teal-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Direct Custom Date Input */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
          <label className="text-[11.5px] font-semibold text-slate-600 shrink-0">
            Custom Date:
          </label>
          <input
            type="date"
            value={selectedDateStr}
            onChange={(e) => {
              if (e.target.value) {
                setSelectedDate(e.target.value);
                const [y, m, d] = e.target.value.split("-").map(Number);
                setViewDate(new Date(y, m - 1, d || 1));
                setOpen(false);
              }
            }}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 w-full cursor-pointer"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default PosDateCalendarPopover;

