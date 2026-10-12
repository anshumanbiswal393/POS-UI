import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Calendar, ChevronDown, Plus } from "lucide-react";

interface DashboardHeaderProps {
  dateLabel: string;
  isMockData: boolean;
  onDateChange?: (range: "today" | "yesterday" | "this_week" | "this_month") => void;
}

export function DashboardHeader({ dateLabel, isMockData, onDateChange }: DashboardHeaderProps) {
  const [selectedRange, setSelectedRange] = useState(dateLabel);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const ranges = [
    { label: "Today, 17 Aug 2026", value: "today" as const },
    { label: "Yesterday", value: "yesterday" as const },
    { label: "This Week", value: "this_week" as const },
    { label: "This Month", value: "this_month" as const },
  ];

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-300 pb-2.5">
      {/* Title & Eyebrow */}
      <div>
        <h1 className="font-display text-[18px] font-bold tracking-tight text-slate-900 leading-tight">
          Dashboard
        </h1>
        <p className="text-[11.5px] text-slate-500">Your restaurant at a glance</p>
      </div>

      {/* Right Actions: Date Picker, New Order Button, Live Badge */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Date Filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{selectedRange}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {showDatePicker && (
            <div className="absolute right-0 mt-1.5 w-52 rounded-lg border border-slate-200 bg-white p-1 shadow-lg z-30 animate-in fade-in zoom-in-95">
              {ranges.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => {
                    setSelectedRange(r.label);
                    setShowDatePicker(false);
                    onDateChange?.(r.value);
                  }}
                  className={`flex w-full items-center rounded-md px-3 py-2 text-left text-[12.5px] transition cursor-pointer ${
                    selectedRange === r.label
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Primary CTA: + New Order */}
        <Link
          to="/pos/billing"
          className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-medium text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-98 transition cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>New Order</span>
        </Link>

        {/* Live / Mock Data Status Dot */}
        <div className="flex items-center gap-1.5 pl-1 text-[11px] font-medium text-slate-500">
          <span
            className={`h-2 w-2 rounded-full ${
              isMockData ? "bg-emerald-500" : "bg-primary animate-pulse"
            }`}
          />
          <span>{isMockData ? "Sample data" : "Live data"}</span>
        </div>
      </div>
    </div>
  );
}
