import { useState } from "react";
import { LayoutGrid, Plus, Move, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export function FloorPlanManagementView() {
  const [hasFloorPlan, setHasFloorPlan] = useState(false);

  return (
    <div className="space-y-4">
      {/* 1. Header Bar matching Screenshot 4 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Link
            to="/pos/management/configuration/outlet"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-teal-700 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Outlet Configuration
          </Link>
          <h2 className="text-[18px] font-bold tracking-tight text-slate-900">Floor Plan</h2>
        </div>

        <button
          type="button"
          onClick={() => {
            setHasFloorPlan(true);
            toast.success("Initialized interactive floor plan studio");
          }}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Create Floor Plan
        </button>
      </div>

      {/* 2. Empty State matching Screenshot 4 */}
      {!hasFloorPlan ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-24 text-center shadow-xs space-y-4">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <LayoutGrid className="h-12 w-12" />
          </div>
          <div className="text-[15px] font-bold text-slate-800">No Floor Plan Available</div>
          <p className="text-[12.5px] text-slate-400 max-w-sm mx-auto">
            Design dynamic dining sections, arrange tables, and customize seating capacities
            visually.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-[13px] font-bold text-slate-800">
              <Move className="h-4 w-4 text-teal-600" />
              <span>Interactive Floor Plan Canvas</span>
            </div>
            <div className="text-[12px] text-slate-500">Main Dining • 12 Active Tables</div>
          </div>
          <div className="h-80 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center text-slate-400 text-[13px]">
            Drag & place tables onto the visual floor grid
          </div>
        </div>
      )}
    </div>
  );
}
