import { Link } from "@tanstack/react-router";
import { Clock, CheckCircle2, Gift, XCircle, AlertTriangle } from "lucide-react";
import type { OperationsSummary } from "@/types/posDashboard";

interface OperationalMetricsStripProps {
  operations: OperationsSummary;
}

export function OperationalMetricsStrip({ operations }: OperationalMetricsStripProps) {
  return (
    <div className="grid shrink-0 grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-5">
      {/* 1. Avg. preparation */}
      <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 shadow-2xs">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
          <Clock className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-700">
            Avg. preparation
          </div>
          <div className="text-[13.5px] sm:text-[14px] font-bold text-slate-900 leading-none">
            {operations.avgPrepTimeMinutes} min
          </div>
        </div>
      </div>

      {/* 2. Successful */}
      <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 shadow-2xs">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
          <CheckCircle2 className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-700">
            Successful
          </div>
          <div className="text-[13.5px] sm:text-[14px] font-bold text-slate-900 leading-none">
            {operations.successfulCount}
          </div>
        </div>
      </div>

      {/* 3. Complimentary */}
      <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 shadow-2xs">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
          <Gift className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-700">
            Complimentary
          </div>
          <div className="text-[13.5px] sm:text-[14px] font-bold text-slate-900 leading-none">
            {operations.complimentaryCount}
          </div>
        </div>
      </div>

      {/* 4. Cancelled */}
      <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 shadow-2xs">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
          <XCircle className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-700">
            Cancelled
          </div>
          <div className="text-[13.5px] sm:text-[14px] font-bold text-slate-900 leading-none">
            {operations.cancelledCount}
          </div>
        </div>
      </div>

      {/* 5. Discounts & NC */}
      <div className="col-span-2 xl:col-span-1 flex min-w-0 items-center justify-between gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 shadow-2xs">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-700">
              Discounts & NC
            </div>
            <div className="text-[13.5px] sm:text-[14px] font-bold text-slate-900 leading-none">
              {operations.discountsCount}
            </div>
          </div>
        </div>
        <Link to="/pos/reports" className="shrink-0 whitespace-nowrap text-[10.5px] font-bold text-primary hover:underline">
          View →
        </Link>
      </div>
    </div>
  );
}

export default OperationalMetricsStrip;
