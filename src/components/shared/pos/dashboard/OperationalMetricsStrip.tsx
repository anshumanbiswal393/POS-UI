import { Link } from "@tanstack/react-router";
import { Clock, CheckCircle2, Gift, XCircle, AlertTriangle } from "lucide-react";
import type { OperationsSummary } from "@/types/posDashboard";

interface OperationalMetricsStripProps {
  operations: OperationsSummary;
}

export function OperationalMetricsStrip({ operations }: OperationalMetricsStripProps) {
  return (
    <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
      {/* 1. Avg. preparation */}
      <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-2.5 py-2 shadow-2xs">
        <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
          <Clock className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[10.5px] font-bold uppercase tracking-wider text-black">
            Avg. preparation
          </div>
          <div className="text-[15px] font-bold text-black">
            {operations.avgPrepTimeMinutes} min
          </div>
        </div>
      </div>

      {/* 2. Successful */}
      <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-2.5 py-2 shadow-2xs">
        <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[10.5px] font-bold uppercase tracking-wider text-black">
            Successful
          </div>
          <div className="text-[15px] font-bold text-black">{operations.successfulCount}</div>
        </div>
      </div>

      {/* 3. Complimentary */}
      <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-2.5 py-2 shadow-2xs">
        <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-200 text-black">
          <Gift className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[10.5px] font-bold uppercase tracking-wider text-black">
            Complimentary
          </div>
          <div className="text-[15px] font-bold text-black">
            {operations.complimentaryCount}
          </div>
        </div>
      </div>

      {/* 4. Cancelled */}
      <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-2.5 py-2 shadow-2xs">
        <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-200 text-black">
          <XCircle className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[10.5px] font-bold uppercase tracking-wider text-black">
            Cancelled
          </div>
          <div className="text-[15px] font-bold text-black">{operations.cancelledCount}</div>
        </div>
      </div>

      {/* 5. Discounts & NC */}
      <div className="col-span-2 xl:col-span-1 flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-2.5 py-2 shadow-2xs">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-200 text-black">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[10.5px] font-bold uppercase tracking-wider text-black">
              Discounts & NC
            </div>
            <div className="text-[15px] font-bold text-black">{operations.discountsCount}</div>
          </div>
        </div>
        <Link to="/pos/reports" className="shrink-0 whitespace-nowrap text-[11px] font-bold text-primary hover:underline">
          View →
        </Link>
      </div>
    </div>
  );
}
