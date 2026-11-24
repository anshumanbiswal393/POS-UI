import { Link } from "@tanstack/react-router";
import { Utensils } from "lucide-react";
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
    <div className="flex h-full min-h-[175px] flex-col rounded-xl border border-slate-400/80 bg-white p-2.5 sm:p-3 shadow-2xs">
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="text-[13.5px] font-bold text-slate-900">Table status</h2>
        <Link
          to="/pos/tables"
          className="text-[11.5px] font-semibold text-primary hover:underline"
        >
          View floor plan →
        </Link>
      </div>

      {tables.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center p-2 text-slate-400">
          <Utensils className="h-5 w-5 stroke-[1.5] mb-1 opacity-40 text-slate-400" />
          <p className="text-[11.5px] font-medium text-slate-600">No tables configured</p>
          <Link
            to="/pos/tables"
            className="text-[10.5px] font-semibold text-primary hover:underline mt-0.5"
          >
            Add tables in Floor Plan →
          </Link>
        </div>
      ) : (
        /* Grid of 18 Tables (responsive columns, compact height) */
        <div className="mt-1.5 grid min-h-0 flex-1 content-start grid-cols-4 sm:grid-cols-6 auto-rows-[28px] sm:auto-rows-[30px] gap-1.5 overflow-hidden">
          {tables.slice(0, 18).map((t) => (
            <div
              key={t.tableNumber}
              className={`flex items-center justify-center rounded-lg border text-[11px] font-semibold transition-all cursor-pointer shadow-xs ${getTableStyle(
                t.status,
              )}`}
              title={`Table ${t.tableNumber} - ${t.status}`}
            >
              {t.tableNumber}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-1 flex shrink-0 items-center justify-center gap-3 border-t border-slate-200 pt-1 text-[10.5px]">
        <div className="flex items-center gap-1 font-medium text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1 font-medium text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-1 font-medium text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          <span>Reserved</span>
        </div>
      </div>
    </div>
  );
}

export default TableStatusCard;
