"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames, type DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

interface CalendarRangeContextType {
  selectedRange?: DateRange;
  hoveredDate: Date | null;
  setHoveredDate: (d: Date | null) => void;
  isRangeMode: boolean;
  onDayRangeClick?: (date: Date) => void;
  selectionTarget?: "arrival" | "departure";
  durationUnit?: "days" | "nights";
}

const CalendarRangeContext = React.createContext<CalendarRangeContextType>({
  hoveredDate: null,
  setHoveredDate: () => {},
  isRangeMode: false,
  durationUnit: "days",
});

function toMidnightTime(d?: Date | string | null): number | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  selected,
  onSelect,
  mode,
  selectionTarget,
  durationUnit = "days",
  ...props
}: Omit<React.ComponentProps<typeof DayPicker>, "selected" | "onSelect"> & {
  selected?: any;
  onSelect?: any;
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  selectionTarget?: "arrival" | "departure";
  durationUnit?: "days" | "nights";
}) {
  const defaultClassNames = getDefaultClassNames();
  const [hoveredDate, setHoveredDate] = React.useState<Date | null>(null);

  const isRangeMode = mode === "range";
  const selectedRange = isRangeMode ? (selected as DateRange | undefined) : undefined;

  const handleDayRangeClick = React.useCallback(
    (clickedDate: Date) => {
      if (!onSelect) return;

      const clickedTime = toMidnightTime(clickedDate);
      if (clickedTime == null) return;

      const fromTime = toMidnightTime(selectedRange?.from);
      const toTime = toMidnightTime(selectedRange?.to);

      // If user is specifically targeting departure (e.g. clicked Departure / To Date input):
      if (selectionTarget === "departure" && fromTime != null) {
        if (clickedTime < fromTime) {
          // User clicked an earlier date than arrival -> Update arrival to this earlier date
          const newRange: DateRange = {
            from: clickedDate,
            to: undefined,
          };
          setHoveredDate(null);
          (onSelect as any)(newRange, clickedDate);
        } else {
          // User clicked on or after arrival -> Complete range (Arrival to Departure)
          const newRange: DateRange = {
            from: selectedRange!.from,
            to: clickedDate,
          };
          setHoveredDate(null);
          (onSelect as any)(newRange, clickedDate);
        }
        return;
      }

      // 1. If no arrival date selected OR both arrival & departure are already selected:
      // This is Click 1 (Choose Start Date)
      if (fromTime == null || (fromTime != null && toTime != null)) {
        const newRange: DateRange = {
          from: clickedDate,
          to: undefined,
        };
        setHoveredDate(null);
        (onSelect as any)(newRange, clickedDate);
        return;
      }

      // 2. If arrival date is selected and waiting for departure date:
      // This is Click 2 (Choose End Date)
      if (fromTime != null && toTime == null) {
        if (clickedTime < fromTime) {
          // User clicked an earlier date than arrival -> Update arrival to this earlier date
          const newRange: DateRange = {
            from: clickedDate,
            to: undefined,
          };
          setHoveredDate(null);
          (onSelect as any)(newRange, clickedDate);
        } else {
          // User clicked on or after arrival -> Complete range
          const newRange: DateRange = {
            from: selectedRange!.from,
            to: clickedDate,
          };
          setHoveredDate(null);
          (onSelect as any)(newRange, clickedDate);
        }
      }
    },
    [onSelect, selectedRange, selectionTarget],
  );

  return (
    <CalendarRangeContext.Provider
      value={{
        selectedRange,
        hoveredDate,
        setHoveredDate,
        isRangeMode,
        onDayRangeClick: handleDayRangeClick,
        selectionTarget,
        durationUnit,
      }}
    >
      <div onMouseLeave={() => setHoveredDate(null)}>
        <DayPicker
          mode={mode as any}
          selected={selected as any}
          onSelect={onSelect as any}
          showOutsideDays={showOutsideDays}
          className={cn(
            "bg-background group/calendar p-3 [--cell-size:2.25rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent select-none",
            String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
            String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
            className,
          )}
          captionLayout={captionLayout}
          formatters={{
            formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
            ...formatters,
          }}
          classNames={{
            root: cn("w-fit", defaultClassNames.root),
            months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
            month: cn("flex w-full flex-col gap-3", defaultClassNames.month),
            nav: cn(
              "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 z-10",
              defaultClassNames.nav,
            ),
            button_previous: cn(
              buttonVariants({ variant: buttonVariant }),
              "h-7 w-7 select-none p-0 aria-disabled:opacity-50 hover:bg-surface-2 rounded-md",
              defaultClassNames.button_previous,
            ),
            button_next: cn(
              buttonVariants({ variant: buttonVariant }),
              "h-7 w-7 select-none p-0 aria-disabled:opacity-50 hover:bg-surface-2 rounded-md",
              defaultClassNames.button_next,
            ),
            month_caption: cn(
              "flex h-7 w-full items-center justify-center px-8 text-sm font-semibold text-text-primary",
              defaultClassNames.month_caption,
            ),
            dropdowns: cn(
              "flex h-7 w-full items-center justify-center gap-1.5 text-sm font-medium",
              defaultClassNames.dropdowns,
            ),
            dropdown_root: cn(
              "has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border",
              defaultClassNames.dropdown_root,
            ),
            dropdown: cn("bg-popover absolute inset-0 opacity-0", defaultClassNames.dropdown),
            caption_label: cn(
              "select-none font-semibold text-text-primary text-sm",
              captionLayout === "label"
                ? "text-sm"
                : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
              defaultClassNames.caption_label,
            ),
            weekdays: cn("flex justify-between", defaultClassNames.weekdays),
            weekday: cn(
              "text-text-secondary/70 flex-1 select-none text-[0.75rem] font-medium text-center py-1",
              defaultClassNames.weekday,
            ),
            week: cn("mt-1 flex w-full justify-between", defaultClassNames.week),
            week_number_header: cn("w-(--cell-size) select-none", defaultClassNames.week_number_header),
            week_number: cn(
              "text-muted-foreground select-none text-[0.8rem]",
              defaultClassNames.week_number,
            ),
            day: cn(
              "group/day relative h-8 w-8 sm:h-9 sm:w-9 select-none p-0 text-center flex items-center justify-center",
              defaultClassNames.day,
            ),
            range_start: defaultClassNames.range_start,
            range_middle: defaultClassNames.range_middle,
            range_end: defaultClassNames.range_end,
            today: defaultClassNames.today,
            outside: cn(
              "text-text-disabled opacity-40 aria-selected:text-text-disabled",
              defaultClassNames.outside,
            ),
            disabled: cn("text-text-disabled opacity-40 cursor-not-allowed", defaultClassNames.disabled),
            hidden: cn("invisible", defaultClassNames.hidden),
            ...classNames,
          }}
          components={{
            Root: ({ className, rootRef, ...props }) => {
              return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
            },
            Chevron: ({ className, orientation, ...props }) => {
              if (orientation === "left") {
                return <ChevronLeftIcon className={cn("size-4", className)} {...props} />;
              }

              if (orientation === "right") {
                return <ChevronRightIcon className={cn("size-4", className)} {...props} />;
              }

              return <ChevronDownIcon className={cn("size-4", className)} {...props} />;
            },
            DayButton: CalendarDayButton,
            WeekNumber: ({ children, ...props }) => {
              return (
                <td {...props}>
                  <div className="flex size-(--cell-size) items-center justify-center text-center">
                    {children}
                  </div>
                </td>
              );
            },
            ...components,
          }}
          {...props}
        />
      </div>
    </CalendarRangeContext.Provider>
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const { selectedRange, hoveredDate, setHoveredDate, isRangeMode, onDayRangeClick, selectionTarget, durationUnit } =
    React.useContext(CalendarRangeContext);

  const cellTime = toMidnightTime(day.date)!;
  const fromTime = toMidnightTime(selectedRange?.from);
  const toTime = toMidnightTime(selectedRange?.to);
  const hoverTime = toMidnightTime(hoveredDate);

  // Active range calculation
  let startTime = fromTime;
  let endTime = toTime;

  // When start date is selected and waiting for departure date
  // OR when selectionTarget is "departure" and start date exists
  const isSelectingDeparture =
    (isRangeMode && fromTime != null && toTime == null) ||
    (isRangeMode && selectionTarget === "departure" && fromTime != null);

  if (isSelectingDeparture && hoverTime != null) {
    if (hoverTime >= fromTime) {
      startTime = fromTime;
      endTime = hoverTime;
    } else {
      startTime = hoverTime;
      endTime = fromTime;
    }
  }

  const isStart = startTime != null && cellTime === startTime;
  const isEnd = endTime != null && cellTime === endTime;
  const isBetween = startTime != null && endTime != null && cellTime > startTime && cellTime < endTime;
  const isSingle = isStart && (isEnd || startTime === endTime || endTime == null);

  // Calculate duration in days/nights for tooltip
  let durationCount = 0;
  if (isEnd && startTime != null && endTime != null && endTime > startTime) {
    durationCount = Math.round((endTime - startTime) / (1000 * 60 * 60 * 24));
  }

  const isOutside = !!modifiers.outside;
  const isDisabled = !!modifiers.disabled;
  const isToday = !!modifiers.today;

  const handlePointerOver = () => {
    if (isSelectingDeparture && !isDisabled) {
      setHoveredDate(day.date);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return;
    if (isRangeMode && onDayRangeClick) {
      e.preventDefault();
      e.stopPropagation();
      onDayRangeClick(day.date);
      return;
    }
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <div
      className="relative h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center"
      onMouseEnter={handlePointerOver}
      onMouseMove={handlePointerOver}
      onPointerEnter={handlePointerOver}
    >
      {/* Continuous seamless connector bar */}
      {isRangeMode && startTime != null && endTime != null && endTime > startTime && (
        <>
          {isBetween && (
            <div className="absolute inset-y-1 inset-x-0 bg-primary/15 dark:bg-primary/25 z-0 pointer-events-none transition-colors duration-150" />
          )}
          {isStart && !isSingle && (
            <div className="absolute inset-y-1 right-0 left-1/2 bg-primary/15 dark:bg-primary/25 z-0 pointer-events-none transition-colors duration-150" />
          )}
          {isEnd && !isSingle && (
            <div className="absolute inset-y-1 left-0 right-1/2 bg-primary/15 dark:bg-primary/25 z-0 pointer-events-none transition-colors duration-150" />
          )}
        </>
      )}

      {/* Floating Duration Tooltip over the End Date */}
      {durationCount >= 1 && isEnd && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="relative bg-surface border border-border/90 text-text-primary text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded shadow-md whitespace-nowrap flex items-center gap-1">
            <span>
              {durationCount} {durationUnit === "nights" ? (durationCount === 1 ? "night" : "nights") : (durationCount === 1 ? "day" : "days")}
            </span>
            {/* Tooltip downward pointer arrow */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-surface border-r border-b border-border/90 rotate-45" />
          </div>
        </div>
      )}

      {/* Day Button */}
      <button
        type="button"
        disabled={isDisabled}
        {...props}
        onClick={handleClick}
        onMouseEnter={handlePointerOver}
        onMouseMove={handlePointerOver}
        onPointerEnter={handlePointerOver}
        className={cn(
          "relative z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center text-[12px] sm:text-[13px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer",
          // Selected Start or End Date
          (isStart || isEnd) && [
            "bg-primary text-primary-foreground font-bold shadow-xs rounded-full",
          ],
          // Between Dates in Selected / Hover Range
          isBetween && [
            "rounded-none text-primary dark:text-primary-foreground font-semibold hover:bg-primary/20",
          ],
          // Today (when not selected)
          !isStart && !isEnd && !isBetween && isToday && [
            "rounded-full border border-primary/40 font-bold text-primary",
          ],
          // Regular unselected day
          !isStart && !isEnd && !isBetween && !isToday && [
            "rounded-full hover:bg-surface-2 text-text-primary",
          ],
          // Outside of current month
          isOutside && "text-text-disabled opacity-40",
          // Disabled Date
          isDisabled && "text-text-disabled opacity-35 cursor-not-allowed hover:bg-transparent",
          className,
        )}
      >
        {day.date.getDate()}
      </button>
    </div>
  );
}

export { Calendar, CalendarDayButton, type DateRange };
