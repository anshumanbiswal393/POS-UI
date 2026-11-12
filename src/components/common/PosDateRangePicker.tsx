import * as React from "react";
import { format, parseISO, subDays, startOfMonth, endOfMonth, isValid } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown, X, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, type DateRange } from "@/components/ui/calendar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface PosDateRangePickerProps {
  /** Start date in YYYY-MM-DD format */
  from?: string;
  /** End date in YYYY-MM-DD format */
  to?: string;
  /** Callback fired when a range is committed */
  onSelect?: (range: { from: string; to: string }) => void;
  /** Direct start date updater */
  onFromChange?: (from: string) => void;
  /** Direct end date updater */
  onToChange?: (to: string) => void;
  /** Label shown above or beside */
  label?: string;
  /** Custom trigger button placeholder */
  placeholder?: string;
  /** Popover content alignment */
  align?: "start" | "center" | "end";
  /** Show fast preset options (Today, Last 7 Days, This Month etc.) */
  showPresets?: boolean;
  /** Allow clearing the selection */
  showClear?: boolean;
  /** Extra trigger class names */
  className?: string;
  /** Trigger button size */
  size?: "sm" | "default" | "lg";
  /** Disable the picker */
  disabled?: boolean;
  /** Number of visible calendar months */
  numberOfMonths?: 1 | 2;
}

function parseDateSafe(val?: string): Date | undefined {
  if (!val) return undefined;
  try {
    const d = parseISO(val);
    return isValid(d) ? d : undefined;
  } catch {
    return undefined;
  }
}

function formatDateSafe(d?: Date): string {
  if (!d || !isValid(d)) return "";
  return format(d, "yyyy-MM-dd");
}

export function PosDateRangePicker({
  from = "",
  to = "",
  onSelect,
  onFromChange,
  onToChange,
  label,
  placeholder = "Select date range",
  align = "start",
  showPresets = true,
  showClear = false,
  className,
  size = "default",
  disabled = false,
  numberOfMonths = 2,
}: PosDateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const effectiveMonths = isMobile ? 1 : numberOfMonths;

  // Sync internal DateRange with props
  const dateRange: DateRange | undefined = React.useMemo(() => {
    const fromDate = parseDateSafe(from);
    const toDate = parseDateSafe(to);
    if (!fromDate && !toDate) return undefined;
    return {
      from: fromDate,
      to: toDate || fromDate,
    };
  }, [from, to]);

  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(dateRange);

  // Update tempRange when dateRange changes externally or popover opens
  React.useEffect(() => {
    if (open) {
      setTempRange(dateRange);
    }
  }, [open, dateRange]);

  const commitRange = (range?: DateRange) => {
    if (!range?.from) {
      if (showClear) {
        onFromChange?.("");
        onToChange?.("");
        onSelect?.({ from: "", to: "" });
      }
      return;
    }
    const fromStr = formatDateSafe(range.from);
    const toStr = range.to ? formatDateSafe(range.to) : fromStr;

    onFromChange?.(fromStr);
    onToChange?.(toStr);
    onSelect?.({ from: fromStr, to: toStr });
  };

  const handleCalendarSelect = (newRange: DateRange | undefined) => {
    setTempRange(newRange);
    if (newRange?.from && newRange?.to) {
      // Both dates selected -> commit and close
      commitRange(newRange);
      setOpen(false);
    } else if (newRange?.from && !newRange.to) {
      // First click: keep popover open waiting for toDate
      onFromChange?.(formatDateSafe(newRange.from));
    }
  };

  const applyPreset = (presetRange: { from: Date; to: Date }) => {
    const newRange: DateRange = { from: presetRange.from, to: presetRange.to };
    setTempRange(newRange);
    commitRange(newRange);
    setOpen(false);
  };

  // Quick preset shortcuts
  const today = new Date();
  const presets = [
    {
      label: "Today",
      range: () => ({ from: today, to: today }),
    },
    {
      label: "Yesterday",
      range: () => {
        const y = subDays(today, 1);
        return { from: y, to: y };
      },
    },
    {
      label: "Last 7 Days",
      range: () => ({ from: subDays(today, 6), to: today }),
    },
    {
      label: "Last 30 Days",
      range: () => ({ from: subDays(today, 29), to: today }),
    },
    {
      label: "This Month",
      range: () => ({ from: startOfMonth(today), to: endOfMonth(today) }),
    },
  ];

  // Formatted trigger label
  const displayText = React.useMemo(() => {
    const fromDate = parseDateSafe(from);
    const toDate = parseDateSafe(to);

    if (fromDate && toDate) {
      const sameDay = format(fromDate, "yyyy-MM-dd") === format(toDate, "yyyy-MM-dd");
      if (sameDay) {
        return format(fromDate, "MMM dd, yyyy");
      }
      // If same year, compact into "Nov 04 – Nov 07, 2026"
      if (fromDate.getFullYear() === toDate.getFullYear()) {
        return `${format(fromDate, "MMM dd")} – ${format(toDate, "MMM dd, yyyy")}`;
      }
      // Across different years: "Nov 04, 2026 – Jan 02, 2027"
      return `${format(fromDate, "MMM dd, yyyy")} – ${format(toDate, "MMM dd, yyyy")}`;
    }
    if (fromDate) {
      return format(fromDate, "MMM dd, yyyy");
    }
    return placeholder;
  }, [from, to, placeholder]);

  const hasSelection = Boolean(from || to);

  // Compute days count
  const daysDiff = React.useMemo(() => {
    const f = parseDateSafe(from);
    const t = parseDateSafe(to);
    if (!f || !t) return null;
    const diff = Math.round((t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  }, [from, to]);

  const isTodayActive = React.useMemo(() => {
    const todayStr = formatDateSafe(new Date());
    return from === todayStr && to === todayStr;
  }, [from, to]);

  return (
    <div className={cn("inline-flex flex-col gap-1", className?.includes("w-full") && "w-full")}>
      {label ? (
        <span className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </span>
      ) : null}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild className={className?.includes("w-full") ? "w-full" : undefined}>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 shadow-2xs hover:bg-slate-50/80 hover:border-slate-400 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed",
              size === "sm" ? "px-2.5 py-1 text-xs h-8" : "px-3 py-2 text-[12.5px] h-10",
              hasSelection && "border-teal-500/50 bg-teal-50/20 text-slate-900 font-semibold",
              className,
            )}
          >
            <CalendarIcon
              className={cn(
                "shrink-0",
                size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
                hasSelection ? "text-teal-600" : "text-slate-400",
              )}
            />

            <span className="truncate whitespace-nowrap text-[12.5px] font-medium text-slate-800">
              {displayText}
            </span>

            <div className="ml-auto flex items-center gap-1.5 shrink-0">
              {daysDiff && daysDiff > 1 ? (
                <span className="rounded-md bg-teal-100/90 px-1.5 py-0.5 text-[10px] font-bold text-teal-800 leading-none">
                  {daysDiff} Days
                </span>
              ) : isTodayActive ? (
                <span className="rounded-md bg-emerald-100/90 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 leading-none">
                  Today
                </span>
              ) : null}

              {showClear && hasSelection ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    commitRange(undefined);
                  }}
                  className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </span>
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              )}
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align={align}
          className="w-auto max-w-[calc(100vw-1rem)] max-h-[85dvh] overflow-y-auto p-0 border border-slate-200 bg-white shadow-2xl rounded-2xl z-50 text-slate-900"
        >
          <div className="flex flex-col md:flex-row">
            {/* Presets Column */}
            {showPresets ? (
              <div className="border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/60 p-3 min-w-[140px] flex md:flex-col gap-1 justify-between flex-wrap">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 hidden md:block">
                  Quick Ranges
                </div>
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset.range())}
                    className="rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
                {showClear && hasSelection ? (
                  <button
                    type="button"
                    onClick={() => {
                      commitRange(undefined);
                      setOpen(false);
                    }}
                    className="rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer mt-auto border-t border-slate-200/60 pt-2"
                  >
                    Clear Filter
                  </button>
                ) : null}
              </div>
            ) : null}

            {/* Calendar Sliding Range Area */}
            <div className="p-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2 px-1 text-xs">
                <span className="font-semibold text-slate-700">
                  {tempRange?.from && tempRange?.to
                    ? `${format(tempRange.from, "MMM dd, yyyy")} – ${format(tempRange.to, "MMM dd, yyyy")}`
                    : tempRange?.from
                      ? `Select End Date (from ${format(tempRange.from, "MMM dd, yyyy")})`
                      : "Click Start Date, then slide to End Date"}
                </span>
                <span className="text-[11px] text-teal-600 font-bold">
                  {tempRange?.from && tempRange?.to
                    ? `${Math.round((tempRange.to.getTime() - tempRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1} Days Selected`
                    : "Slide to select"}
                </span>
              </div>

              <Calendar
                mode="range"
                numberOfMonths={effectiveMonths}
                selected={tempRange}
                onSelect={handleCalendarSelect}
                className="rounded-xl"
              />

              {/* Bottom Quick Controls */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-2 px-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!tempRange?.from}
                  onClick={() => {
                    commitRange(tempRange);
                    setOpen(false);
                  }}
                  className="rounded-lg bg-teal-600 px-3.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer disabled:opacity-40"
                >
                  Apply Range
                </button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default PosDateRangePicker;

