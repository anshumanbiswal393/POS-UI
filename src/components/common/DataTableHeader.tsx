import React, { useState, useMemo, useEffect } from "react";
import {
  Filter,
  ArrowUp,
  ArrowDown,
  Pin,
  Check,
  Maximize2,
  Columns,
  LayoutGrid,
  SplitSquareVertical,
  Search,
  RotateCcw,
  MoreVertical,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { exportToExcel } from "@/utils/exportUtils";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface DataTableColumn<T = any> {
  id?: string;
  key?: string;
  label: string;
  defaultWidth?: string | number;
  minWidth?: number;
  maxWidth?: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  filterable?: boolean;
  getValue?: (row: T) => string;
  getSortValue?: (row: T) => string | number;
}

export type ThemeVariant = "primary" | "dark" | "slate" | "surface";

export interface DataTableHeaderProps<T = any> {
  columns: DataTableColumn<T>[];
  data?: T[];
  distinctValues?: Record<string, string[]>;
  visibleColumns?: Record<string, boolean>;
  onVisibleColumnsChange?: (cols: Record<string, boolean>) => void;
  sortConfig?: { colId: string; direction: "asc" | "desc" } | null;
  onSortChange?: (config: { colId: string; direction: "asc" | "desc" } | null) => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string) => void;
  columnFilters?: Record<string, string[]>;
  onColumnFilterChange?: (filters: Record<string, string[]>) => void;
  columnPins?: Record<string, "left" | "right" | "none">;
  onPinChange?: (pins: Record<string, "left" | "right" | "none">) => void;
  autosizedColumns?: Record<string, boolean>;
  onAutosizeChange?: (autosized: Record<string, boolean>) => void;
  columnOrder?: string[];
  onColumnOrderChange?: (newOrder: string[]) => void;
  columnWidths?: Record<string, number>;
  onColumnWidthsChange?: (widths: Record<string, number>) => void;
  onColumnWidthChange?: (widths: Record<string, number>) => void;
  onResize?: (colId: string, width: number) => void;
  enableColumnReorder?: boolean;
  enableColumnResize?: boolean;
  resizable?: boolean;
  groupByCol?: string | null;
  onGroupByChange?: (colId: string | null) => void;
  onOpenColumnPicker?: () => void;
  selectable?: boolean;
  isAllSelected?: boolean;
  isSomeSelected?: boolean;
  onToggleSelectAll?: () => void;
  themeVariant?: ThemeVariant;
  className?: string;
  stickyHeader?: boolean;
  stickyOffsetClass?: string;
}

export function DataTableHeader<T = any>({
  columns: rawColumns = [],
  data = [],
  distinctValues: externalDistinctValues,
  visibleColumns = {},
  sortConfig,
  onSortChange,
  sortKey,
  sortDirection,
  onSort,
  columnFilters = {},
  onColumnFilterChange,
  columnPins = {},
  onPinChange,
  autosizedColumns = {},
  onAutosizeChange,
  columnOrder,
  onColumnOrderChange,
  columnWidths,
  onColumnWidthsChange,
  onColumnWidthChange,
  onResize,
  enableColumnReorder = true,
  enableColumnResize = true,
  resizable,
  groupByCol,
  onGroupByChange,
  selectable = false,
  isAllSelected = false,
  isSomeSelected = false,
  onToggleSelectAll,
  themeVariant = "primary",
  className,
}: DataTableHeaderProps<T>) {
  // Normalize columns so every column has an id
  const columns = useMemo(() => {
    return (rawColumns || []).map((col) => ({
      ...col,
      id: col.id || (col as any).key || "",
    }));
  }, [rawColumns]);

  // Compute active sort configuration safely
  const activeSortConfig = useMemo(() => {
    if (sortConfig !== undefined && sortConfig !== null) return sortConfig;
    if (sortKey) {
      return { colId: sortKey, direction: sortDirection || "asc" };
    }
    return null;
  }, [sortConfig, sortKey, sortDirection]);

  const isResizeEnabled = resizable !== undefined ? resizable : enableColumnResize;
  const notifyWidthsChange = onColumnWidthsChange || onColumnWidthChange;
  const [openFilterCol, setOpenFilterCol] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState<Record<string, string>>({});

  // Column Filters State
  const [localColumnFilters, setLocalColumnFilters] = useState<Record<string, string[]>>({});
  const activeFilters = useMemo(() => {
    return { ...localColumnFilters, ...columnFilters };
  }, [localColumnFilters, columnFilters]);

  // Column Width Resizing State
  const [localColumnWidths, setLocalColumnWidths] = useState<Record<string, number>>({});
  const activeWidths = useMemo(() => {
    if (columnWidths && Object.keys(columnWidths).length > 0) {
      return { ...localColumnWidths, ...columnWidths };
    }
    return localColumnWidths;
  }, [columnWidths, localColumnWidths]);

  const [resizingColId, setResizingColId] = useState<string | null>(null);

  const updateWidth = (colId: string, width: number) => {
    setLocalColumnWidths((prev) => {
      const next = { ...prev, ...activeWidths, [colId]: width };
      notifyWidthsChange?.(next);
      onResize?.(colId, width);
      return next;
    });
  };

  // Column Reordering (Drag & Drop) State
  const [localColumnOrder, setLocalColumnOrder] = useState<string[]>([]);
  const activeOrder = columnOrder && columnOrder.length > 0 ? columnOrder : localColumnOrder;
  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<"before" | "after" | null>(null);

  // Compute ordered columns based on activeOrder
  const orderedColumns = useMemo(() => {
    if (!activeOrder || activeOrder.length === 0) return columns;
    const map = new Map(columns.map((c) => [c.id, c]));
    const result: DataTableColumn<T>[] = [];
    activeOrder.forEach((id) => {
      const col = map.get(id);
      if (col) {
        result.push(col);
        map.delete(id);
      }
    });
    map.forEach((col) => result.push(col));
    return result;
  }, [columns, activeOrder]);

  // Compute distinct values for each filterable column if not provided externally
  const computedDistinctValues = useMemo(() => {
    if (externalDistinctValues) return externalDistinctValues;
    const map: Record<string, string[]> = {};
    columns.forEach((col) => {
      if (!col.id || col.id === "actions" || col.filterable === false) return;
      const set = new Set<string>();
      data.forEach((row: any) => {
        let val = "";
        if (col.getValue) {
          val = col.getValue(row);
        } else if (col.id && row && row[col.id] !== undefined && row[col.id] !== null) {
          val = String(row[col.id]);
        } else if ((col as any).key && row && row[(col as any).key] !== undefined && row[(col as any).key] !== null) {
          val = String(row[(col as any).key]);
        }
        if (val && String(val).trim()) set.add(String(val).trim());
      });
      map[col.id] = Array.from(set).sort((a, b) => a.localeCompare(b));
    });
    return map;
  }, [columns, data, externalDistinctValues]);

  // Check if a column has an active filter
  const isColFiltered = (colId: string) => {
    const list = activeFilters[colId];
    if (!list || list.length === 0) return false;
    const distinct = computedDistinctValues[colId] || [];
    return distinct.length > 0 && list.length < distinct.length;
  };

  // Get filtered items inside the popover based on search text
  const getPopoverValues = (colId: string) => {
    const values = computedDistinctValues[colId] || [];
    const search = (filterSearch[colId] || "").toLowerCase().trim();
    if (!search) return values;
    return values.filter((v) => v.toLowerCase().includes(search));
  };

  const isValueSelected = (colId: string, val: string) => {
    const current = activeFilters[colId];
    if (!current) return true;
    return current.includes(val);
  };

  const toggleValue = (colId: string, val: string, checked: boolean) => {
    const distinct = computedDistinctValues[colId] || [];
    const current = activeFilters[colId] ?? [...distinct];
    let updated: string[];
    if (checked) {
      updated = current.includes(val) ? current : [...current, val];
    } else {
      updated = current.filter((v) => v !== val);
    }
    const nextFilters = {
      ...activeFilters,
      [colId]: updated,
    };
    setLocalColumnFilters(nextFilters);
    onColumnFilterChange?.(nextFilters);
  };

  const toggleSelectAllForCol = (colId: string, checked: boolean) => {
    const distinct = computedDistinctValues[colId] || [];
    const nextFilters = {
      ...activeFilters,
      [colId]: checked ? [...distinct] : [],
    };
    setLocalColumnFilters(nextFilters);
    onColumnFilterChange?.(nextFilters);
  };

  const clearFilterForCol = (colId: string) => {
    const next = { ...activeFilters };
    delete next[colId];
    setLocalColumnFilters(next);
    onColumnFilterChange?.(next);
    setFilterSearch((prev) => {
      const copy = { ...prev };
      delete copy[colId];
      return copy;
    });
  };

  const isAllSelectedForCol = (colId: string) => {
    const distinct = computedDistinctValues[colId] || [];
    const current = activeFilters[colId];
    if (!current) return true;
    return distinct.length > 0 && distinct.every((d) => current.includes(d));
  };

  const handleToggleSort = (colId: string) => {
    if (onSort) {
      onSort(colId);
      return;
    }
    if (!onSortChange) return;
    if (activeSortConfig?.colId !== colId) {
      onSortChange({ colId, direction: "asc" });
    } else if (activeSortConfig?.direction === "asc") {
      onSortChange({ colId, direction: "desc" });
    } else {
      onSortChange(null);
    }
  };

  const handlePin = (colId: string, position: "left" | "right" | "none") => {
    const nextPins = { ...columnPins };
    if (position === "none") {
      delete nextPins[colId];
    } else {
      nextPins[colId] = position;
    }
    onPinChange?.(nextPins);

    // Reorder columns: pinned left columns at beginning, unpinned in middle, pinned right at end
    const currentOrder = [...(activeOrder && activeOrder.length > 0 ? activeOrder : columns.map((c) => c.id || ""))];

    let pinnedLeft = currentOrder.filter((id) => nextPins[id] === "left");
    if (position === "left") {
      pinnedLeft = [colId, ...pinnedLeft.filter((id) => id !== colId)];
    }

    let pinnedRight = currentOrder.filter((id) => nextPins[id] === "right");
    if (position === "right") {
      pinnedRight = [...pinnedRight.filter((id) => id !== colId), colId];
    }

    let unpinned = currentOrder.filter(
      (id) => nextPins[id] !== "left" && nextPins[id] !== "right"
    );

    if (position === "none") {
      const otherUnpinned = unpinned.filter((id) => id !== colId);
      const colOrigIdx = columns.findIndex((c) => c.id === colId);
      const insertBeforeIdx = otherUnpinned.findIndex((id) => {
        const otherOrigIdx = columns.findIndex((c) => c.id === id);
        return otherOrigIdx > colOrigIdx;
      });

      if (insertBeforeIdx !== -1) {
        otherUnpinned.splice(insertBeforeIdx, 0, colId);
      } else {
        otherUnpinned.push(colId);
      }
      unpinned = otherUnpinned;
    }

    const newOrder = [
      ...pinnedLeft,
      ...unpinned,
      ...pinnedRight,
    ];

    setLocalColumnOrder(newOrder);
    onColumnOrderChange?.(newOrder);
  };

  const handleAutosizeColumn = (colId: string) => {
    onAutosizeChange?.({
      ...autosizedColumns,
      [colId]: !autosizedColumns[colId],
    });
  };

  const handleAutosizeAll = () => {
    const all: Record<string, boolean> = {};
    columns.forEach((c) => {
      if (c.id) all[c.id] = true;
    });
    onAutosizeChange?.(all);
  };

  // Theme variant styling classes aligned with POS design system
  const getThemeClasses = () => {
    switch (themeVariant) {
      case "primary":
        return {
          row: "bg-primary text-primary-foreground border-b-2 border-primary-pressed shadow-xs",
          th: "bg-primary text-primary-foreground",
          border: "border-r border-primary-foreground/20",
          text: "text-primary-foreground font-extrabold text-[11.5px] uppercase tracking-wider whitespace-nowrap",
          iconBtn:
            "text-primary-foreground/75 hover:text-primary-foreground hover:bg-white/15",
          activeFilterBtn: "bg-white text-primary font-bold shadow-xs",
          checkbox:
            "border-primary-foreground/80 data-[state=checked]:bg-white data-[state=checked]:text-primary",
        };
      case "dark":
      case "slate":
        return {
          row: "bg-slate-900 text-white dark:bg-slate-950 dark:text-slate-100 border-b-2 border-slate-800 shadow-xs",
          th: "bg-slate-900 text-white dark:bg-slate-950 dark:text-slate-100",
          border: "border-r border-slate-700/70 dark:border-border/80",
          text: "text-white font-extrabold text-[11.5px] uppercase tracking-wider whitespace-nowrap",
          iconBtn: "text-slate-400 hover:text-white hover:bg-slate-800/80",
          activeFilterBtn:
            "bg-primary text-primary-foreground font-bold shadow-xs",
          checkbox: "border-slate-500 data-[state=checked]:bg-primary",
        };
      case "surface":
      default:
        return {
          row: "bg-slate-50/95 dark:bg-surface-2 text-slate-800 dark:text-foreground border-b-2 border-slate-200 dark:border-border",
          th: "bg-slate-50/95 dark:bg-surface-2 text-slate-800 dark:text-foreground",
          border: "border-r border-slate-200 dark:border-border/80",
          text: "text-slate-800 dark:text-foreground font-extrabold text-[11px] uppercase tracking-wider whitespace-nowrap",
          iconBtn:
            "text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-surface-3",
          activeFilterBtn:
            "text-primary bg-primary/10 font-bold border border-primary/30",
          checkbox: "border-primary",
        };
    }
  };

  // Column Resize Handlers
  const handleResizeStart = (e: React.MouseEvent, colId: string, currentWidth?: number) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const thElement = (e.currentTarget.parentElement as HTMLElement);
    const startWidth = currentWidth || thElement?.getBoundingClientRect().width || 130;

    setResizingColId(colId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(65, Math.round(startWidth + deltaX));
      updateWidth(colId, newWidth);
    };

    const onMouseUp = () => {
      setResizingColId(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Column Reorder (Drag & Drop) Handlers
  const handleDragStart = (e: React.DragEvent, colId: string) => {
    if (!enableColumnReorder || colId === "actions" || resizingColId) {
      e.preventDefault();
      return;
    }
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("[data-no-drag]")) {
      e.preventDefault();
      return;
    }
    setDraggedColId(colId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", colId);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    if (!enableColumnReorder || !draggedColId || draggedColId === colId || colId === "actions") return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const position = e.clientX < midX ? "before" : "after";
    setDragOverColId(colId);
    setDropIndicator(position);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX >= rect.right ||
      e.clientY < rect.top ||
      e.clientY >= rect.bottom
    ) {
      setDragOverColId(null);
      setDropIndicator(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    if (!enableColumnReorder || !draggedColId || draggedColId === targetColId || targetColId === "actions") {
      setDraggedColId(null);
      setDragOverColId(null);
      setDropIndicator(null);
      return;
    }

    const currentOrder = orderedColumns.map((c) => c.id || "");
    const fromIndex = currentOrder.indexOf(draggedColId);

    if (fromIndex !== -1) {
      const updated = [...currentOrder];
      updated.splice(fromIndex, 1);
      const targetIndex = updated.indexOf(targetColId);
      if (targetIndex !== -1) {
        const insertAt = dropIndicator === "after" ? targetIndex + 1 : targetIndex;
        updated.splice(insertAt, 0, draggedColId);
        setLocalColumnOrder(updated);
        onColumnOrderChange?.(updated);
      }
    }

    setDraggedColId(null);
    setDragOverColId(null);
    setDropIndicator(null);
  };

  const handleDragEnd = () => {
    setDraggedColId(null);
    setDragOverColId(null);
    setDropIndicator(null);
  };

  // Global listener to ensure drag states never get stuck
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setDraggedColId(null);
      setDragOverColId(null);
      setDropIndicator(null);
    };
    window.addEventListener("dragend", handleGlobalDragEnd);
    window.addEventListener("drop", handleGlobalDragEnd);
    return () => {
      window.removeEventListener("dragend", handleGlobalDragEnd);
      window.removeEventListener("drop", handleGlobalDragEnd);
    };
  }, []);

  const theme = getThemeClasses();
  const visibleCols = orderedColumns.filter((col) => visibleColumns[col.id || ""] !== false);

  /** Default width so header label + filter/menu icons fit on one line */
  const estimateHeaderWidth = (c: DataTableColumn<any>): number => {
    const label = typeof c.label === "string" ? c.label : "";
    // ~8.2px/char for uppercase tracking-wider + padding + filter/menu (~56px)
    const fromLabel = Math.ceil(label.length * 8.2) + 56;
    const min = typeof c.minWidth === "number" ? c.minWidth : 100;
    return Math.max(min, fromLabel);
  };

  // Helper to extract numeric width
  const getColNumericWidth = (c: DataTableColumn<any>): number => {
    const id = c.id || "";
    if (id === "actions") return 85;
    if (id && activeWidths[id]) return activeWidths[id];
    if (typeof c.defaultWidth === "number") {
      return Math.max(c.defaultWidth, typeof c.minWidth === "number" ? c.minWidth : 0);
    }
    if (typeof c.defaultWidth === "string") {
      if (c.defaultWidth.includes("w-12")) return 48;
      const match = c.defaultWidth.match(/(\d+)px/);
      if (match) {
        const parsed = parseInt(match[1], 10);
        return Math.max(parsed, typeof c.minWidth === "number" ? c.minWidth : 0);
      }
    }
    return estimateHeaderWidth(c);
  };

  // Helper to compute horizontal pinned style for headers - preserves strict lockstep alignment with table data cells
  const getHeaderPinnedStyle = (colId: string) => {
    const pin = columnPins[colId];
    if (!pin || pin === "none") {
      return { style: {}, className: "" };
    }

    if (pin === "left") {
      let offset = selectable ? 48 : 0;
      for (const c of visibleCols) {
        if (c.id === colId) break;
        if (c.id && columnPins[c.id] === "left") {
          offset += getColNumericWidth(c);
        }
      }
      const pinnedLeftCols = visibleCols.filter((c) => c.id && columnPins[c.id] === "left");
      const isLastPinnedLeft = pinnedLeftCols[pinnedLeftCols.length - 1]?.id === colId;

      return {
        style: {
          left: `${offset}px`,
          boxShadow: isLastPinnedLeft
            ? "inset -1px 0 0 rgba(255,255,255,0.2), 3px 0 8px -2px rgba(0,0,0,0.25)"
            : "inset -1px 0 0 rgba(255,255,255,0.2)",
        },
        className: cn(
          "sticky z-10",
          theme.th
        ),
      };
    }

    if (pin === "right") {
      let offset = 0;
      for (let i = visibleCols.length - 1; i >= 0; i--) {
        const c = visibleCols[i];
        if (c.id === colId) break;
        if (c.id && columnPins[c.id] === "right") {
          offset += getColNumericWidth(c);
        }
      }
      const pinnedRightCols = visibleCols.filter((c) => c.id && columnPins[c.id] === "right");
      const isFirstPinnedRight = pinnedRightCols[0]?.id === colId;

      return {
        style: {
          right: `${offset}px`,
          boxShadow: isFirstPinnedRight
            ? "inset 1px 0 0 rgba(255,255,255,0.2), -3px 0 8px -2px rgba(0,0,0,0.25)"
            : "inset 1px 0 0 rgba(255,255,255,0.2)",
        },
        className: cn(
          "sticky z-10",
          theme.th
        ),
      };
    }

    return { style: {}, className: "" };
  };

  return (
    <thead className="select-none font-sans">
      <tr className={cn(theme.row, "select-none font-sans", className)}>
        {/* Selection Checkbox Header */}
        {selectable && (
          <th
            style={{
              left: 0,
              width: "48px",
              minWidth: "48px",
              maxWidth: "48px",
            }}
            className={cn(
              "sticky left-0 z-10 w-12 px-3 py-3 text-center border-r select-none",
              theme.th,
              theme.border
            )}
          >
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = Boolean(isSomeSelected && !isAllSelected);
                }}
                onChange={() => onToggleSelectAll?.()}
                className="rounded border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer accent-white"
                aria-label="Select all"
              />
            </div>
          </th>
        )}

        {/* Dynamic Column Headers */}
        {visibleCols.map((col, index) => {
          const colId = col.id || "";
          const isFiltered = isColFiltered(colId);
          const isSorted = activeSortConfig?.colId === colId;
          const isLast = index === visibleCols.length - 1;
          const isDragging = draggedColId === colId;
          const isTarget = dragOverColId === colId;
          const pinned = getHeaderPinnedStyle(colId);
          const isPinned = columnPins[colId] === "left" || columnPins[colId] === "right";
          const colWidth = getColNumericWidth(col);
          const defaultMinWidth = estimateHeaderWidth(col);

          return (
            <th
              key={colId}
              draggable={enableColumnReorder && colId !== "actions"}
              onDragStart={(e) => handleDragStart(e, colId)}
              onDragOver={(e) => handleDragOver(e, colId)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, colId)}
              onDragEnd={handleDragEnd}
              style={{
                width: isPinned || activeWidths[colId] ? `${colWidth}px` : undefined,
                // Keep header label on one line by default; user resize still overrides via activeWidths
                minWidth: `${activeWidths[colId] || isPinned ? colWidth : defaultMinWidth}px`,
                ...pinned.style,
              }}
              className={cn(
                "px-3.5 py-3 transition-colors font-sans select-none whitespace-nowrap",
                !isPinned ? "relative" : "",
                theme.th,
                !isLast && theme.border,
                col.align === "center"
                  ? "text-center"
                  : col.align === "right"
                    ? "text-right"
                    : "text-left",
                pinned.className,
                autosizedColumns[colId]
                  ? "w-auto whitespace-nowrap"
                  : !activeWidths[colId] && col.defaultWidth,
                isDragging && "brightness-90 bg-primary-pressed shadow-inner ring-1 ring-white/30",
                isTarget && dropIndicator === "before" && "border-l-4 border-amber-400",
                isTarget && dropIndicator === "after" && "border-r-4 border-amber-400"
              )}
            >
              {colId === "actions" ? (
                <span className="text-right block pr-2 font-extrabold text-[11px] uppercase tracking-wider whitespace-nowrap">
                  {col.label}
                </span>
              ) : (
                <div className="flex items-center justify-between gap-1.5 font-sans whitespace-nowrap">
                  {/* Column Title + Sort Trigger */}
                  <div
                    onClick={() => col.sortable && handleToggleSort(colId)}
                    className={cn(
                      "flex items-center gap-1 transition-colors select-none whitespace-nowrap shrink-0",
                      col.sortable ? "cursor-pointer hover:opacity-80" : "",
                      enableColumnReorder && colId !== "actions" && "cursor-grab active:cursor-grabbing"
                    )}
                    title={
                      enableColumnReorder && colId !== "actions"
                        ? `Drag to reorder · Click to sort by ${col.label}`
                        : col.sortable
                          ? `Click to sort by ${col.label}`
                          : undefined
                    }
                  >
                    <span className={theme.text}>{col.label}</span>
                    {columnPins[colId] && columnPins[colId] !== "none" && (
                      <span className="print:hidden" title={`Pinned ${columnPins[colId]}`}>
                        <Pin className="h-3 w-3 text-amber-300 dark:text-amber-400 fill-amber-300/40 shrink-0 rotate-45" />
                      </span>
                    )}
                    {isSorted && (
                      activeSortConfig?.direction === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5 shrink-0 animate-in fade-in print:hidden" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 shrink-0 animate-in fade-in print:hidden" />
                      )
                    )}
                  </div>

                  {/* Header Action Icons: Filter Popover + 3-Dots Menu */}
                  <div className="flex items-center gap-0.5 shrink-0 print:hidden">
                    {/* 1. Filter Dropdown */}
                    {colId !== "actions" && col.filterable !== false && (
                      <Popover
                        open={openFilterCol === colId}
                        onOpenChange={(open) =>
                          setOpenFilterCol(open ? colId : null)
                        }
                      >
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "p-1 rounded-md transition cursor-pointer",
                              isFiltered ? theme.activeFilterBtn : theme.iconBtn
                            )}
                            title={`Filter ${col.label}`}
                          >
                            <Filter className="h-3 w-3" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          className="w-64 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-foreground shadow-2xl z-50 font-sans"
                        >
                          {/* Search Input Box */}
                          <div className="relative mb-2">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search..."
                              value={filterSearch[colId] || ""}
                              onChange={(e) =>
                                setFilterSearch((prev) => ({
                                  ...prev,
                                  [colId]: e.target.value,
                                }))
                              }
                              className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary font-sans"
                            />
                          </div>

                          {/* Select All Checkbox */}
                          <div className="flex items-center justify-between px-1 py-1.5 text-xs border-b border-slate-100 dark:border-slate-800 mb-1">
                            <div
                              onClick={(e) => {
                                e.preventDefault();
                                toggleSelectAllForCol(colId, !isAllSelectedForCol(colId));
                              }}
                              className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-200 select-none flex-1"
                            >
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={isAllSelectedForCol(colId)}
                                  onCheckedChange={(checked) =>
                                    toggleSelectAllForCol(colId, !!checked)
                                  }
                                />
                              </div>
                              <span>(Select All)</span>
                            </div>
                            {isFiltered && (
                              <button
                                type="button"
                                onClick={() => clearFilterForCol(colId)}
                                className="text-[10.5px] font-bold text-primary hover:underline cursor-pointer ml-2 shrink-0"
                              >
                                Reset
                              </button>
                            )}
                          </div>

                          {/* Checkbox List with Scrollbar */}
                          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1 font-sans">
                            {getPopoverValues(colId).map((val) => {
                              const checked = isValueSelected(colId, val);
                              return (
                                <div
                                  key={val}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    toggleValue(colId, val, !checked);
                                  }}
                                  className="flex items-center gap-2 px-1 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer text-xs text-slate-800 dark:text-slate-200 select-none truncate"
                                >
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(c) =>
                                        toggleValue(colId, val, !c)
                                      }
                                    />
                                  </div>
                                  <span className="truncate" title={val}>
                                    {val}
                                  </span>
                                </div>
                              );
                            })}
                            {getPopoverValues(colId).length === 0 && (
                              <div className="p-3 text-center text-xs text-slate-400">
                                No matching values
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}

                    {/* 2. 3-Dots Menu Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "p-1 rounded-md transition cursor-pointer",
                            theme.iconBtn
                          )}
                          title={`${col.label} options`}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-56 p-1.5 rounded-xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 z-50 font-sans"
                      >
                        {col.sortable && (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                onSortChange?.({
                                  colId,
                                  direction: "asc",
                                })
                              }
                              className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer"
                            >
                              <ArrowUp className="h-3.5 w-3.5 text-slate-500" />
                              <span>Sort Ascending</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                onSortChange?.({
                                  colId,
                                  direction: "desc",
                                })
                              }
                              className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer"
                            >
                              <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
                              <span>Sort Descending</span>
                            </DropdownMenuItem>
                            {isSorted && (
                              <DropdownMenuItem
                                onClick={() => onSortChange?.(null)}
                                className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 cursor-pointer"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Clear Sort</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                          </>
                        )}

                        {/* Pin Column Submenu */}
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="flex items-center justify-between px-2.5 py-2 text-xs font-medium cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Pin className="h-3.5 w-3.5 text-slate-500" />
                              <span>Pin Column</span>
                            </div>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-36 p-1 rounded-xl shadow-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <DropdownMenuItem
                              onClick={() => handlePin(colId, "left")}
                              className="flex items-center justify-between px-2.5 py-1.5 text-xs cursor-pointer"
                            >
                              <span>Pin Left</span>
                              {columnPins[colId] === "left" && (
                                <Check className="h-3 w-3 text-primary" />
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handlePin(colId, "right")}
                              className="flex items-center justify-between px-2.5 py-1.5 text-xs cursor-pointer"
                            >
                              <span>Pin Right</span>
                              {columnPins[colId] === "right" && (
                                <Check className="h-3 w-3 text-primary" />
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handlePin(colId, "none")}
                              className="flex items-center justify-between px-2.5 py-1.5 text-xs cursor-pointer"
                            >
                              <span>No Pin</span>
                              {(!columnPins[colId] ||
                                columnPins[colId] === "none") && (
                                  <Check className="h-3 w-3 text-primary" />
                                )}
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator />

                        {/* Autosize Column */}
                        <DropdownMenuItem
                          onClick={() => handleAutosizeColumn(colId)}
                          className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer"
                        >
                          <Maximize2 className="h-3.5 w-3.5 text-slate-500" />
                          <span>Autosize This Column</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={handleAutosizeAll}
                          className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer"
                        >
                          <Columns className="h-3.5 w-3.5 text-slate-500" />
                          <span>Autosize All Columns</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* Group by Column */}
                        {col.filterable && onGroupByChange && (
                          <DropdownMenuItem
                            onClick={() =>
                              onGroupByChange(
                                groupByCol === colId ? null : colId
                              )
                            }
                            className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer"
                          >
                            <SplitSquareVertical className="h-3.5 w-3.5 text-slate-500" />
                            <span>
                              {groupByCol === colId
                                ? `Ungroup ${col.label}`
                                : `Group by ${col.label}`}
                            </span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}

              {/* Column Resize Handle */}
              {isResizeEnabled && colId !== "actions" && (
                <div
                  onMouseDown={(e) => handleResizeStart(e, colId, activeWidths[colId])}
                  onDoubleClick={() => handleAutosizeColumn(colId)}
                  className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize select-none hover:bg-white/30 dark:hover:bg-white/20 transition-colors z-20 group flex items-center justify-center"
                  title="Drag to resize column (Double-click to autosize)"
                >
                  <div className="w-[1.5px] h-3/5 bg-transparent group-hover:bg-white/80 rounded-full" />
                </div>
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

/**
 * Reusable Dialog for choosing which columns to display
 */
export interface ChooseColumnsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  columns: DataTableColumn[];
  visibleColumns: Record<string, boolean>;
  onVisibleColumnsChange: (visible: Record<string, boolean>) => void;
}

export function ChooseColumnsDialog({
  open,
  onOpenChange,
  trigger,
  columns,
  visibleColumns,
  onVisibleColumnsChange,
}: ChooseColumnsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const handleOpenChange = onOpenChange || setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md p-5 rounded-2xl font-sans">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary" />
            <span>Choose Columns</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Select which columns to display in this table.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {columns.map((col) => {
            const colId = col.id || col.key || "";
            const isActions = colId === "actions";
            const isChecked = isActions ? true : visibleColumns[colId] !== false;
            return (
              <label
                key={colId}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg transition border border-transparent",
                  isActions
                    ? "opacity-60 cursor-not-allowed bg-slate-50/50 dark:bg-surface-2/30"
                    : "hover:bg-slate-50 dark:hover:bg-surface-2 cursor-pointer hover:border-slate-200 dark:hover:border-border"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    checked={isChecked}
                    disabled={isActions}
                    onCheckedChange={(checked) => {
                      if (isActions || !colId) return;
                      onVisibleColumnsChange({
                        ...visibleColumns,
                        [colId]: !!checked,
                      });
                    }}
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-foreground">
                    {col.label}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {isActions ? "Fixed" : "Column"}
                </span>
              </label>
            );
          })}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-border">
          <button
            type="button"
            onClick={() => {
              const all: Record<string, boolean> = {};
              columns.forEach((c) => {
                const id = c.id || c.key || "";
                if (id) all[id] = true;
              });
              onVisibleColumnsChange(all);
            }}
            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            Show All Columns
          </button>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition cursor-pointer"
          >
            Done
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface DataTableFilterBarProps {
  count?: number;
  onReset?: () => void;
  onClearAll?: () => void;
  filters?: Record<string, string[]>;
  columns?: DataTableColumn[];
  onRemoveFilter?: (colId: string) => void;
}

/**
 * Reusable Active Column Filter Bar
 */
export function DataTableFilterBar({
  count,
  onReset,
  onClearAll,
  filters,
  columns = [],
  onRemoveFilter,
}: DataTableFilterBarProps) {
  const handleReset = onReset || onClearAll;
  const activeFilterEntries = filters
    ? Object.entries(filters).filter(([_, vals]) => vals && vals.length > 0)
    : [];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-primary/10 dark:bg-primary/20 border border-primary/25 dark:border-primary/40 rounded-xl text-xs font-sans">
      <div className="flex items-center gap-2 text-primary font-semibold flex-wrap">
        <Filter className="h-3.5 w-3.5 shrink-0" />
        <span>
          Active column filter applied.
          {count !== undefined ? ` Showing ${count} filtered result(s).` : ""}
        </span>

        {activeFilterEntries.length > 0 && onRemoveFilter && (
          <div className="flex items-center gap-1.5 flex-wrap ml-1">
            {activeFilterEntries.map(([colId, vals]) => {
              const col = columns.find((c) => (c.id || c.key) === colId);
              const label = col?.label || colId;
              return (
                <span
                  key={colId}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-[11px] font-bold text-primary border border-primary/30 shadow-2xs"
                >
                  <span>
                    {label}: {vals.join(", ")}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveFilter(colId)}
                    className="hover:text-red-500 font-bold ml-0.5 cursor-pointer"
                    title={`Remove ${label} filter`}
                  >
                    ✕
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
      {handleReset && (
        <button
          type="button"
          onClick={handleReset}
          className="text-[11px] font-bold text-primary hover:underline cursor-pointer ml-auto"
        >
          Reset All Filters
        </button>
      )}
    </div>
  );
}

/**
 * Reusable Row Selection Bar
 */
export function DataTableSelectionBar({
  selectedCount,
  onExport,
  onPrint,
  onClear,
  onClearSelection,
  actions,
  totalCount,
}: {
  selectedCount: number;
  onExport?: () => void;
  onPrint?: () => void;
  onClear?: () => void;
  onClearSelection?: () => void;
  actions?: React.ReactNode;
  totalCount?: number;
}) {
  if (selectedCount === 0) return null;
  const handleClear = onClear || onClearSelection;

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-primary/10 dark:bg-primary/20 border-2 border-primary/30 dark:border-primary/40 rounded-xl text-xs font-sans gap-2 flex-wrap">
      <div className="flex items-center gap-2 font-bold text-primary">
        <Check className="h-4 w-4 shrink-0" />
        <span>
          {selectedCount} item(s) selected {totalCount ? `of ${totalCount}` : ""}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {actions}
        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-foreground font-bold hover:bg-surface-2 transition cursor-pointer shadow-2xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Selected</span>
          </button>
        )}
        {onExport && <ExportToExcelButton onClick={onExport} title="Export selected rows to Excel" />}
        {handleClear && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-1.5 rounded-lg border border-primary/40 text-primary font-semibold hover:bg-primary/15 transition cursor-pointer"
          >
            Clear Selection
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Reusable Popover Menu for choosing which columns to display (placed on toolbar on the left side of search bar)
 */
export interface ChooseColumnsMenuProps {
  columns: DataTableColumn[];
  visibleColumns: Record<string, boolean>;
  onVisibleColumnsChange: (visible: Record<string, boolean>) => void;
  columnOrder?: string[];
  onColumnOrderChange?: (order: string[]) => void;
  storageKey?: string;
  className?: string;
  buttonLabel?: string;
}

export function ChooseColumnsMenu({
  columns,
  visibleColumns,
  onVisibleColumnsChange,
  className,
  buttonLabel = "Choose Columns",
}: ChooseColumnsMenuProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCols = useMemo(() => {
    if (!search.trim()) return columns;
    return columns.filter((c) =>
      c.label.toLowerCase().includes(search.toLowerCase().trim())
    );
  }, [columns, search]);

  const visibleCount = columns.filter((c) => visibleColumns[c.id || c.key || ""] !== false).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-9 px-3.5 rounded-lg border transition flex items-center gap-2 text-[13px] font-semibold cursor-pointer shadow-2xs shrink-0 select-none",
            open
              ? "border-primary bg-primary/5 text-primary"
              : "border-slate-300 dark:border-border bg-white dark:bg-surface text-slate-800 dark:text-foreground hover:bg-slate-50 dark:hover:bg-surface-2",
            className
          )}
          title="Choose Columns"
        >
          <LayoutGrid className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
          <span>{buttonLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-64 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-foreground shadow-2xl z-50 font-sans"
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-slate-900 dark:text-foreground">
              Choose Columns
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {visibleCount} of {columns.length} visible
          </span>
        </div>

        {columns.length > 5 && (
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Find column..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
        )}

        <div className="max-h-60 overflow-y-auto space-y-1 pr-1 font-sans">
          {filteredCols.map((col) => {
            const colId = col.id || col.key || "";
            const isActions = colId === "actions";
            const isChecked = isActions ? true : visibleColumns[colId] !== false;
            return (
              <label
                key={colId}
                className={cn(
                  "flex items-center justify-between p-1.5 rounded-lg transition select-none text-xs",
                  isActions
                    ? "opacity-60 cursor-not-allowed bg-slate-50/50 dark:bg-slate-800/30"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <Checkbox
                    checked={isChecked}
                    disabled={isActions}
                    onCheckedChange={(checked) => {
                      if (isActions || !colId) return;
                      onVisibleColumnsChange({
                        ...visibleColumns,
                        [colId]: !!checked,
                      });
                    }}
                  />
                  <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                    {col.label}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold shrink-0 ml-1">
                  {isActions ? "Fixed" : ""}
                </span>
              </label>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              const all: Record<string, boolean> = {};
              columns.forEach((c) => {
                const id = c.id || c.key || "";
                if (id) all[id] = true;
              });
              onVisibleColumnsChange(all);
            }}
            className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
          >
            Show All
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-3 py-1 rounded-lg bg-primary text-primary-foreground font-bold text-[11px] hover:opacity-90 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export interface DataTableFooterProps {
  currentPage: number;
  totalPages?: number;
  totalCount?: number;
  totalRecords?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  onPageChange: (page: number) => void;
  itemName?: string;
  className?: string;
  disabled?: boolean;
  storageKey?: string;
  selectedCount?: number;
  onClearSelection?: () => void;
  themeVariant?: ThemeVariant | "subtle";
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  onExport?: (format: string) => void;
  onPrint?: () => void;
}

export function DataTableFooter({
  currentPage,
  totalPages,
  totalCount,
  totalRecords,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
  onPageChange,
  itemName = "records",
  className,
  disabled = false,
  storageKey,
  selectedCount,
  onClearSelection,
  themeVariant = "subtle",
  leftContent,
  rightContent,
  onExport,
  onPrint,
}: DataTableFooterProps) {
  const count = totalCount !== undefined ? totalCount : totalRecords !== undefined ? totalRecords : 0;
  const effectiveTotalPages =
    typeof totalPages === "number" && !isNaN(totalPages)
      ? totalPages
      : Math.max(1, Math.ceil((count || 0) / Math.max(1, pageSize)));

  const handlePageSizeChange = (newSize: number) => {
    try {
      if (storageKey) {
        localStorage.setItem(`retrod:${storageKey}:page-size`, String(newSize));
      }
      localStorage.setItem("retrod:table:page-size", String(newSize));
    } catch { }
    onPageSizeChange?.(newSize);
  };

  const pageNumbers = useMemo(() => {
    if (effectiveTotalPages <= 7) {
      return Array.from({ length: effectiveTotalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", effectiveTotalPages];
    }
    if (currentPage >= effectiveTotalPages - 3) {
      return [1, "...", effectiveTotalPages - 4, effectiveTotalPages - 3, effectiveTotalPages - 2, effectiveTotalPages - 1, effectiveTotalPages];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", effectiveTotalPages];
  }, [currentPage, effectiveTotalPages]);

  const startItem = count === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, count);

  const getContainerStyle = () => {
    switch (themeVariant) {
      case "primary":
        return "border-t border-border bg-surface-2/40 text-text-primary";
      case "dark":
      case "slate":
        return "border-t border-slate-800 bg-slate-950 text-slate-200";
      case "surface":
        return "border-t border-border bg-surface-2 text-muted-foreground";
      case "subtle":
      default:
        return "border-t border-border/80 bg-surface/90 text-muted-foreground";
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 text-xs select-none font-sans transition-colors print:hidden",
        getContainerStyle(),
        className
      )}
    >
      <div className="flex items-center gap-3 flex-wrap">
        {selectedCount !== undefined && selectedCount > 0 ? (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary font-bold text-[11.5px] animate-in fade-in-50">
            <span>{selectedCount} selected</span>
            {onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                className="text-muted-foreground hover:text-primary transition-colors underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        ) : null}

        <span className="font-medium text-muted-foreground text-[12px]">
          {count === 0 ? (
            "No records"
          ) : count <= pageSize ? (
            <>
              Showing <strong className="text-foreground font-semibold">{count}</strong> of{" "}
              <strong className="text-foreground font-semibold">{count}</strong> {itemName}
            </>
          ) : (
            <>
              Showing <strong className="text-foreground font-semibold">{startItem}</strong> to{" "}
              <strong className="text-foreground font-semibold">{endItem}</strong> of{" "}
              <strong className="text-foreground font-semibold">{count}</strong> {itemName}
            </>
          )}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-border/80">
            <span className="text-muted-foreground text-[11.5px]">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              disabled={disabled}
              className="h-7 px-2 py-0.5 rounded-lg border border-border bg-surface text-[11.5px] font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition shadow-2xs"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {leftContent}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-2 transition text-[11.5px] font-medium cursor-pointer shadow-2xs"
            title="Print"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </button>
        )}
        {rightContent}

        {count > 0 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={disabled || currentPage <= 1}
              className="h-7 w-7 rounded-md border border-border bg-surface flex items-center justify-center text-xs font-semibold text-muted-foreground hover:bg-surface-2 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shadow-2xs select-none"
              title="Previous page"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {pageNumbers.map((page, idx) =>
              typeof page === "number" ? (
                <button
                  type="button"
                  key={page}
                  onClick={() => onPageChange(page)}
                  disabled={disabled}
                  className={cn(
                    "h-7 min-w-[28px] px-2 rounded-md font-bold text-xs flex items-center justify-center transition cursor-pointer shadow-2xs select-none",
                    currentPage === page
                      ? "bg-primary text-primary-foreground font-extrabold shadow-xs"
                      : "border border-border bg-surface text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                  )}
                >
                  {page}
                </button>
              ) : (
                <span
                  key={`ellipsis-${idx}`}
                  className="h-7 w-5 flex items-center justify-center text-xs text-muted-foreground select-none"
                >
                  ...
                </span>
              )
            )}

            <button
              type="button"
              onClick={() => onPageChange(Math.min(effectiveTotalPages, currentPage + 1))}
              disabled={disabled || currentPage >= effectiveTotalPages}
              className="h-7 w-7 rounded-md border border-border bg-surface flex items-center justify-center text-xs font-semibold text-muted-foreground hover:bg-surface-2 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shadow-2xs select-none"
              title="Next page"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const TablePagination = DataTableFooter;
export type TablePaginationProps = DataTableFooterProps;

export interface DataTableHeadingProps {
  title?: string;
  subtitle?: string;
  description?: string;
  columns?: DataTableColumn<any>[];
  visibleColumns?: Record<string, boolean>;
  onVisibleColumnsChange?: (cols: Record<string, boolean>) => void;
  className?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export function DataTableHeading({
  title,
  subtitle,
  description,
  columns = [],
  visibleColumns = {},
  onVisibleColumnsChange,
  className,
  children,
  actions,
}: DataTableHeadingProps) {
  const toggleColumnVisibility = (colId: string) => {
    if (!onVisibleColumnsChange) return;
    onVisibleColumnsChange({
      ...visibleColumns,
      [colId]: visibleColumns[colId] === false ? true : false,
    });
  };

  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 pb-3", className)}>
      <div>
        {title && (
          <h2 className="text-[20px] font-bold text-[#881337] dark:text-primary tracking-tight">
            {title}
          </h2>
        )}
        {subtitle && (
          <div className="text-xs font-semibold text-text-secondary mt-0.5">
            {subtitle}
          </div>
        )}
        {description && (
          <div className="text-[11.5px] text-text-secondary mt-0.5">
            {description}
          </div>
        )}
        {children}
      </div>

      <div className="flex items-center gap-2">
        {actions}

        {columns.length > 0 && onVisibleColumnsChange && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-2 transition cursor-pointer shadow-2xs"
              >
                <Columns className="w-3.5 h-3.5 text-primary" />
                <span>Choose Columns</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3 shadow-lg rounded-xl" align="end">
              <div className="space-y-2">
                <div className="text-xs font-bold text-text-primary border-b border-border pb-1.5">
                  Toggle Table Columns
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1.5 pt-1">
                  {columns.map((col) => {
                    const colId = col.id || col.key;
                    if (!colId) return null;
                    const isChecked = visibleColumns[colId] !== false;
                    return (
                      <label
                        key={colId}
                        className="flex items-center gap-2 px-1.5 py-1 text-xs text-text-primary hover:bg-surface-2 rounded cursor-pointer select-none"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleColumnVisibility(colId)}
                        />
                        <span className="truncate">{col.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}

export interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount?: number;
  totalItems?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  onPageChange: (page: number) => void;
  itemName?: string;
  className?: string;
  disabled?: boolean;
  storageKey?: string;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalCount,
  totalItems,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
  onPageChange,
  itemName = "items",
  className,
  disabled = false,
  storageKey,
}: DataTablePaginationProps) {
  const effectiveTotal = typeof totalCount === "number" ? totalCount : typeof totalItems === "number" ? totalItems : 0;

  const handlePageSizeChange = (newSize: number) => {
    try {
      if (storageKey) {
        localStorage.setItem(`retrod:${storageKey}:page-size`, String(newSize));
      }
      localStorage.setItem("retrod:table:page-size", String(newSize));
    } catch { }
    onPageSizeChange?.(newSize);
  };

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  }, [currentPage, totalPages]);

  const startItem = effectiveTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, effectiveTotal);

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-slate-600 dark:text-muted-foreground select-none font-sans",
        className
      )}
    >
      <div className="flex items-center gap-3 text-[12px] font-medium flex-wrap">
        <span>
          {effectiveTotal <= pageSize
            ? `Showing ${effectiveTotal} of ${effectiveTotal} ${itemName}`
            : `Showing ${startItem} to ${endItem} of ${effectiveTotal} ${itemName}`}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-border">
            <span className="text-slate-500 dark:text-slate-400 text-[11.5px]">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              disabled={disabled}
              className="h-7 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-slate-900 text-[11.5px] font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition shadow-2xs"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={disabled || currentPage <= 1}
          className="h-7 w-7 rounded-md border border-slate-200 dark:border-border flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer select-none"
          title="Previous page"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pageNumbers.map((page, idx) =>
          typeof page === "number" ? (
            <button
              type="button"
              key={page}
              onClick={() => onPageChange(page)}
              disabled={disabled}
              className={cn(
                "h-7 min-w-[28px] px-2 rounded-md font-bold text-xs flex items-center justify-center transition cursor-pointer select-none",
                currentPage === page
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "border border-slate-200 dark:border-border text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {page}
            </button>
          ) : (
            <span
              key={`ellipsis-${idx}`}
              className="h-7 w-5 flex items-center justify-center text-xs text-slate-400 select-none"
            >
              ...
            </span>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={disabled || currentPage >= totalPages}
          className="h-7 w-7 rounded-md border border-slate-200 dark:border-border flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer select-none"
          title="Next page"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export interface DataTableToolbarFilterOption {
  label: string;
  value: string;
}

export interface DataTableToolbarFilter {
  id: string;
  label?: string;
  value: string;
  options: DataTableToolbarFilterOption[];
  onChange: (val: string) => void;
}

export interface DataTableToolbarProps<T = any> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: DataTableToolbarFilter[] | React.ReactNode;
  columns?: DataTableColumn<T>[];
  visibleColumns?: Record<string, boolean>;
  onVisibleColumnsChange?: (visible: Record<string, boolean>) => void;
  columnOrder?: string[];
  onColumnOrderChange?: (order: string[]) => void;
  storageKey?: string;
  onExport?: () => void;
  onExportExcel?: () => void;
  onExportCsv?: () => void;
  exportLabel?: string;
  onPrint?: () => void;
  printLabel?: string;
  totalCount?: number;
  filteredCount?: number;
  actions?: React.ReactNode;
  className?: string;
}

export function DataTableToolbar<T = any>({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  columns = [],
  visibleColumns = {},
  onVisibleColumnsChange,
  columnOrder,
  onColumnOrderChange,
  storageKey,
  onExport,
  onExportExcel,
  onExportCsv,
  exportLabel: _exportLabel = "Export to Excel",
  onPrint,
  printLabel = "Print",
  totalCount,
  filteredCount,
  actions,
  className,
}: DataTableToolbarProps<T>) {
  const exportHandler = onExportExcel || onExportCsv || onExport;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-3.5 bg-surface border border-border rounded-xl shadow-xs font-sans",
        className
      )}
    >
      {(title || subtitle || (totalCount !== undefined && totalCount > 0)) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
          <div>
            {title && (
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
                {totalCount !== undefined && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                    {filteredCount !== undefined && filteredCount !== totalCount
                      ? `${filteredCount} / ${totalCount} records`
                      : `${totalCount} records`}
                  </span>
                )}
              </div>
            )}
            {subtitle && (
              <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[240px]">
          {onSearchChange !== undefined && (
            <div className="relative min-w-[200px] max-w-sm flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-8 w-full pl-8 pr-7 rounded-md border border-border bg-surface-2/60 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:outline-none"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Structured Array Filters */}
          {Array.isArray(filters) &&
            filters.map((f) => (
              <select
                key={f.id}
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                className="h-8 rounded-md border border-border bg-surface-2/60 px-2.5 text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
              >
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))}

          {/* Custom Node Filters */}
          {!Array.isArray(filters) && filters}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {actions}

          {columns.length > 0 && onVisibleColumnsChange && (
            <ChooseColumnsMenu
              columns={columns}
              visibleColumns={visibleColumns}
              onVisibleColumnsChange={onVisibleColumnsChange}
              columnOrder={columnOrder}
              onColumnOrderChange={onColumnOrderChange}
              storageKey={storageKey}
            />
          )}

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border bg-surface hover:bg-surface-2 text-xs font-semibold text-foreground transition-colors cursor-pointer shadow-xs"
              title="Print table data"
            >
              <Printer className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{printLabel}</span>
            </button>
          )}

          {exportHandler && <ExportToExcelButton onClick={exportHandler} />}
        </div>
      </div>
    </div>
  );
}

/**
 * Universal Export table data rows to Excel
 * Supports all signatures:
 * - exportTableToExcel(data, "filename")
 * - exportTableToExcel("filename", columns, data)
 * - exportTableToExcel("filename", data)
 */
export function exportTableToExcel(arg1: any, arg2?: any, arg3?: any) {
  let filename = "Export";
  let rowsData: Record<string, any>[] = [];
  let customCols: DataTableColumn<any>[] | any[] | undefined = undefined;

  if (Array.isArray(arg1)) {
    // Signature: exportTableToExcel(data, filename)
    rowsData = arg1;
    if (typeof arg2 === "string") filename = arg2;
  } else if (typeof arg1 === "string") {
    filename = arg1.replace(/\.csv$/i, "").replace(/\.xlsx$/i, "");
    if (Array.isArray(arg3)) {
      // Signature: exportTableToExcel(filename, columns, data)
      rowsData = arg3;
      if (Array.isArray(arg2)) {
        customCols = arg2;
      }
    } else if (Array.isArray(arg2)) {
      // Signature: exportTableToExcel(filename, data)
      rowsData = arg2;
    }
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const title = filename.replace(/[_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  // Check if we have DataTableColumn / DataGridColumn definitions
  if (customCols && Array.isArray(customCols) && customCols.length > 0 && typeof customCols[0] === "object") {
    const colDefs = customCols;
    const validCols = colDefs.filter((c: any) => {
      const colId = (c.id || c.key || c.accessorKey || "") as string;
      return colId !== "actions" && colId !== "select" && colId !== "checkbox";
    });

    const columns = validCols.map((c: any) => {
      if (typeof c.header === "string") return c.header;
      if (typeof c.label === "string") return c.label;
      if (c.header?.props?.children && typeof c.header.props.children === "string") return c.header.props.children;
      return String(c.id || c.key || c.accessorKey || "Column");
    });

    const rows = rowsData.length > 0
      ? rowsData.map((row) =>
          validCols.map((c: any) => {
            if (c.getValue) {
              const v = c.getValue(row);
              return v !== undefined && v !== null ? v : "";
            }
            if (c.accessorKey && row[c.accessorKey] !== undefined) {
              return row[c.accessorKey];
            }
            const k = (c.id || c.key || "") as string;
            return row[k] !== undefined && row[k] !== null ? row[k] : "";
          })
        )
      : [columns.map(() => "No records to export")];

    exportToExcel({
      filename: `${filename}_${todayStr}`,
      sheetName: title.substring(0, 31),
      title: `${title} — ${todayStr}`,
      columns,
      rows,
    });
  } else if (customCols && Array.isArray(customCols) && typeof customCols[0] === "string") {
    const strCols = customCols as string[];
    const rows = rowsData.length > 0
      ? rowsData.map((row) => strCols.map((col) => row[col] ?? ""))
      : [strCols.map(() => "No records to export")];

    exportToExcel({
      filename: `${filename}_${todayStr}`,
      sheetName: title.substring(0, 31),
      title: `${title} — ${todayStr}`,
      columns: strCols,
      rows,
    });
  } else if (rowsData && rowsData.length > 0) {
    exportToExcel(rowsData, `${filename}_${todayStr}`, {
      sheetName: title.substring(0, 31),
      title: `${title} — ${todayStr}`,
    });
  } else {
    exportToExcel({
      filename: `${filename}_${todayStr}`,
      sheetName: title.substring(0, 31),
      title: `${title} — ${todayStr}`,
      columns: ["Data"],
      rows: [["No records to export"]],
    });
  }
}

/** Backward compatibility alias */
export const exportTableToCsv = exportTableToExcel;

/**
 * Reusable helper for calculating exact sticky left / right pin positioning on table body <td> cells
 */
export interface TableCellPinOptions {
  colId: string;
  columnPins?: Record<string, "left" | "right" | "none">;
  orderedColumns: (DataTableColumn<any> | { id?: string; key?: string; defaultWidth?: string | number })[];
  columnWidths?: Record<string, number>;
  selectable?: boolean;
  isSelected?: boolean;
  isEven?: boolean;
  bgClass?: string;
  selectedBgClass?: string;
}

export function getTableBodyCellPinnedStyle({
  colId,
  columnPins = {},
  orderedColumns = [],
  columnWidths = {},
  selectable = false,
  isSelected = false,
  isEven = false,
  bgClass,
  selectedBgClass,
}: TableCellPinOptions): { style: React.CSSProperties; className: string } {
  const pin = columnPins[colId];
  if (!pin || pin === "none") {
    return { style: {}, className: "" };
  }

  const getWidth = (c: any): number => {
    const id = c.id || c.key || "";
    if (id === "actions") return 85;
    if (columnWidths[id]) return columnWidths[id];
    if (typeof c.defaultWidth === "number") return c.defaultWidth;
    if (typeof c.defaultWidth === "string") {
      if (c.defaultWidth.includes("w-12")) return 48;
      const match = c.defaultWidth.match(/(\d+)px/);
      if (match) return parseInt(match[1], 10);
    }
    return 140;
  };

  const visibleCols = orderedColumns;
  const colWidth = getWidth({ id: colId });

  // Solid background class for sticky cells so underlying scrolling rows don't show through
  const effectiveBg = isSelected
    ? (selectedBgClass || "bg-primary/15 dark:bg-primary/25")
    : bgClass
      ? bgClass
      : isEven
        ? "bg-surface-2/60 group-hover:bg-surface-2"
        : "bg-surface group-hover:bg-surface-2/40";

  if (pin === "left") {
    let offset = selectable ? 48 : 0;
    for (const c of visibleCols) {
      const id = (c as any).id || (c as any).key || "";
      if (id === colId) break;
      if (columnPins[id] === "left") {
        offset += getWidth(c);
      }
    }
    const pinnedLeftCols = visibleCols.filter((c) => {
      const id = (c as any).id || (c as any).key || "";
      return columnPins[id] === "left";
    });
    const lastColId = (pinnedLeftCols[pinnedLeftCols.length - 1] as any)?.id || (pinnedLeftCols[pinnedLeftCols.length - 1] as any)?.key;
    const isLastPinnedLeft = lastColId === colId;

    return {
      style: {
        left: `${offset}px`,
        width: `${colWidth}px`,
        minWidth: `${colWidth}px`,
        boxShadow: isLastPinnedLeft
          ? "inset -1px 0 0 rgba(226, 232, 240, 0.8), 3px 0 8px -2px rgba(0,0,0,0.12)"
          : "inset -1px 0 0 rgba(226, 232, 240, 0.8)",
      },
      className: cn(
        "sticky z-10",
        effectiveBg
      ),
    };
  }

  if (pin === "right") {
    let offset = 0;
    for (let i = visibleCols.length - 1; i >= 0; i--) {
      const c = visibleCols[i];
      const id = (c as any).id || (c as any).key || "";
      if (id === colId) break;
      if (columnPins[id] === "right") {
        offset += getWidth(c);
      }
    }
    const pinnedRightCols = visibleCols.filter((c) => {
      const id = (c as any).id || (c as any).key || "";
      return columnPins[id] === "right";
    });
    const firstColId = (pinnedRightCols[0] as any)?.id || (pinnedRightCols[0] as any)?.key;
    const isFirstPinnedRight = firstColId === colId;

    return {
      style: {
        right: `${offset}px`,
        width: `${colWidth}px`,
        minWidth: `${colWidth}px`,
        boxShadow: isFirstPinnedRight
          ? "inset 1px 0 0 rgba(226, 232, 240, 0.8), -3px 0 8px -2px rgba(0,0,0,0.12)"
          : "inset 1px 0 0 rgba(226, 232, 240, 0.8)",
      },
      className: cn(
        "sticky z-10",
        effectiveBg
      ),
    };
  }

  return { style: {}, className: "" };
}

/**
 * Reusable Hook for managing Table Column Preferences and persistent Page Size
 */
export function useTableColumnPreferences<T = any>(
  storageKey: string,
  defaultColumns: DataTableColumn<T>[],
  defaultPageSize: number = 10
) {
  const [pageSize, setPageSizeState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`retrod:${storageKey}:page-size`);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
      const globalSaved = localStorage.getItem("retrod:table:page-size");
      if (globalSaved) {
        const parsed = parseInt(globalSaved, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch { }
    return defaultPageSize;
  });

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    try {
      localStorage.setItem(`retrod:${storageKey}:page-size`, String(size));
      localStorage.setItem("retrod:table:page-size", String(size));
    } catch { }
  };

  const [columnPins, setColumnPins] = useState<Record<string, "left" | "right" | "none">>(() => {
    try {
      const saved = localStorage.getItem(`retrod:${storageKey}:column-pins`);
      if (saved) {
        const parsed = JSON.parse(saved);
        delete parsed.actions;
        return parsed;
      }
    } catch { }
    return {};
  });

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(`retrod:${storageKey}:column-widths`);
      if (saved) return JSON.parse(saved);
    } catch { }
    const initial: Record<string, number> = {};
    defaultColumns.forEach((c) => {
      const id = c.id || c.key || "";
      if (id === "actions") initial[id] = 90;
      else if (typeof c.defaultWidth === "number") initial[id] = c.defaultWidth;
      else if (typeof c.defaultWidth === "string") {
        const match = c.defaultWidth.match(/(\d+)px/);
        initial[id] = match ? parseInt(match[1], 10) : 140;
      } else initial[id] = 140;
    });
    return initial;
  });

  const [autosizedColumns, setAutosizedColumns] = useState<Record<string, boolean>>({});

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`retrod:${storageKey}:column-order`);
      if (saved) return JSON.parse(saved);
    } catch { }
    return defaultColumns.map((c) => c.id || c.key || "").filter(Boolean);
  });

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`retrod:${storageKey}:visible-columns`);
      if (saved) return JSON.parse(saved);
    } catch { }
    const initial: Record<string, boolean> = {};
    defaultColumns.forEach((c) => {
      const id = c.id || c.key || "";
      if (id) initial[id] = true;
    });
    return initial;
  });

  const handleVisibleColumnsChange = (updated: Record<string, boolean>) => {
    setVisibleColumns(updated);
    try {
      localStorage.setItem(`retrod:${storageKey}:visible-columns`, JSON.stringify(updated));
    } catch { }
  };

  const handleColumnOrderChange = (newOrder: string[]) => {
    setColumnOrder(newOrder);
    try {
      localStorage.setItem(`retrod:${storageKey}:column-order`, JSON.stringify(newOrder));
    } catch { }
  };

  const handleColumnWidthsChange = (updated: Record<string, number>) => {
    setColumnWidths(updated);
    try {
      localStorage.setItem(`retrod:${storageKey}:column-widths`, JSON.stringify(updated));
    } catch { }
  };

  const handleColumnPinsChange = (updated: Record<string, "left" | "right" | "none">) => {
    setColumnPins(updated);
    try {
      localStorage.setItem(`retrod:${storageKey}:column-pins`, JSON.stringify(updated));
    } catch { }
  };

  const orderedColumns = useMemo(() => {
    const colMap = new Map(defaultColumns.map((c) => [c.id || c.key || "", c]));
    const result: DataTableColumn<T>[] = [];

    columnOrder.forEach((id) => {
      const col = colMap.get(id);
      if (col && visibleColumns[id] !== false) {
        result.push(col);
      }
    });

    defaultColumns.forEach((col) => {
      const id = col.id || col.key || "";
      if (!columnOrder.includes(id) && visibleColumns[id] !== false) {
        result.push(col);
      }
    });

    return result;
  }, [defaultColumns, columnOrder, visibleColumns]);

  // Column Filters state
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});

  // Row selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isAllSelected = (items: any[]) =>
    items && items.length > 0 && items.every((i) => selectedIds.has(String(i.id)));

  const isSomeSelected = (items: any[]) =>
    items && items.length > 0 && items.some((i) => selectedIds.has(String(i.id))) && !isAllSelected(items);

  const toggleSelectAll = (items: any[]) => {
    if (!items || items.length === 0) return;
    if (isAllSelected(items)) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => String(i.id))));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyColumnFilters = (dataList: T[], customDistinctValues?: Record<string, string[]>): T[] => {
    if (!dataList || dataList.length === 0) return [];

    // Compute distinct values if not provided
    const distinctMap: Record<string, Set<string>> = {};
    defaultColumns.forEach((col) => {
      const colId = col.id || (col as any).key || "";
      if (colId) distinctMap[colId] = new Set();
    });
    dataList.forEach((item: any) => {
      defaultColumns.forEach((col) => {
        const colId = col.id || (col as any).key || "";
        if (!colId) return;
        let val = "";
        if (col.getValue) {
          val = col.getValue(item);
        } else if (item && item[colId] !== undefined && item[colId] !== null) {
          val = String(item[colId]);
        } else if ((col as any).key && item && item[(col as any).key] !== undefined && item[(col as any).key] !== null) {
          val = String(item[(col as any).key]);
        }
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          distinctMap[colId].add(String(val).trim());
        }
      });
    });

    const activeFilterKeys = Object.keys(columnFilters).filter((colId) => {
      const allowed = columnFilters[colId];
      if (!allowed || allowed.length === 0) return false; // 0 checked -> show all
      const distinctSet = distinctMap[colId];
      const distinctCount = customDistinctValues?.[colId]?.length ?? (distinctSet ? distinctSet.size : 0);
      if (distinctCount > 0 && allowed.length >= distinctCount) {
        // all checked -> show all
        return false;
      }
      return true;
    });

    if (activeFilterKeys.length === 0) return dataList;

    return dataList.filter((item: any) => {
      for (const colId of activeFilterKeys) {
        const allowed = columnFilters[colId];
        const colDef = defaultColumns.find((c) => (c.id || c.key) === colId);
        let val = "";
        if (colDef?.getValue) {
          val = colDef.getValue(item);
        } else if (item && item[colId] !== undefined && item[colId] !== null) {
          val = String(item[colId]);
        } else if ((colDef as any)?.key && item && item[(colDef as any).key] !== undefined && item[(colDef as any).key] !== null) {
          val = String(item[(colDef as any).key]);
        }
        const strVal = val !== undefined && val !== null ? String(val).trim() : "";
        if (!allowed.includes(strVal)) {
          return false;
        }
      }
      return true;
    });
  };

  const getCellPinnedStyle = (
    colId: string,
    options?: {
      isSelected?: boolean;
      isEven?: boolean;
      selectable?: boolean;
      bgClass?: string;
      selectedBgClass?: string;
    }
  ) => {
    return getTableBodyCellPinnedStyle({
      colId,
      columnPins,
      orderedColumns,
      columnWidths,
      selectable: options?.selectable ?? false,
      isSelected: options?.isSelected ?? false,
      isEven: options?.isEven ?? false,
      bgClass: options?.bgClass,
      selectedBgClass: options?.selectedBgClass,
    });
  };

  return {
    pageSize,
    setPageSize,
    visibleColumns,
    setVisibleColumns: handleVisibleColumnsChange,
    columnOrder,
    setColumnOrder: handleColumnOrderChange,
    columnPins,
    setColumnPins: handleColumnPinsChange,
    columnWidths,
    setColumnWidths: handleColumnWidthsChange,
    autosizedColumns,
    setAutosizedColumns,
    orderedColumns,
    getCellPinnedStyle,
    columnFilters,
    setColumnFilters,
    applyColumnFilters,
    selectedIds,
    setSelectedIds,
    isAllSelected,
    isSomeSelected,
    toggleSelectAll,
    toggleSelectRow,
    handleVisibleColumnsChange,
    handleColumnOrderChange,
    handleColumnPinsChange,
    handleColumnWidthsChange,
  };
}

export default DataTableHeader;
