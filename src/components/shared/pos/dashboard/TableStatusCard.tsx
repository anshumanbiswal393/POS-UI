import { Link } from "@tanstack/react-router";
import type { TableStatusItem } from "@/types/posDashboard";

interface TableStatusCardProps {
  tables: TableStatusItem[];
}

export function TableStatusCard({ tables }: TableStatusCardProps) {
  const getTableStyle = (status: TableStatusItem["status"]) => {
    switch (status) {
      case "available":
        return "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80";
      case "occupied":
        return "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100/80";
      case "reserved":
        return "bg-slate-100/70 text-slate-600 border-slate-200 hover:bg-slate-200/70";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-300 bg-white p-3 shadow-2xs">
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="text-[14px] font-bold text-slate-900">Table status</h2>
        <Link
          to="/pos/tables"
          className="text-[12px] font-semibold text-primary hover:underline"
        >
          View floor plan →
        </Link>
      </div>

      {/* Grid of 18 Tables (6 columns x 3 rows) */}
      <div className="mt-2 grid min-h-0 flex-1 grid-cols-6 grid-rows-3 gap-1.5">
        {tables.slice(0, 18).map((t) => (
          <div
            key={t.tableNumber}
            className={`flex min-h-0 items-center justify-center rounded-lg border text-[12px] font-semibold transition-all cursor-pointer shadow-xs ${getTableStyle(
              t.status,
            )}`}
            title={`Table ${t.tableNumber} - ${t.status}`}
          >
            {t.tableNumber}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-2 flex shrink-0 items-center justify-center gap-4 border-t border-slate-100 pt-2 text-[11px]">
        <div className="flex items-center gap-1.5 font-medium text-slate-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-slate-600">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-slate-600">
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          <span>Reserved</span>
        </div>
      </div>
    </div>
  );
}
