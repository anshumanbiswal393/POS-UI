import { Link } from "@tanstack/react-router";
import { Clock, CheckCircle2, Gift, XCircle, AlertTriangle } from "lucide-react";
import type { OperationsSummary } from "@/types/posDashboard";

interface OperationalMetricsStripProps {
  operations: OperationsSummary;
}

export function OperationalMetricsStrip({ operations }: OperationalMetricsStripProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
      {/* 1. Avg. preparation */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white p-3 shadow-2xs">
        <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
          <Clock className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Avg. preparation
          </div>
          <div className="text-[15px] font-bold text-slate-900">
            {operations.avgPrepTimeMinutes} min
          </div>
        </div>
      </div>

      {/* 2. Successful */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white p-3 shadow-2xs">
        <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Successful
          </div>
          <div className="text-[15px] font-bold text-slate-900">{operations.successfulCount}</div>
        </div>
      </div>

      {/* 3. Complimentary */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white p-3 shadow-2xs">
        <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-300 text-slate-700">
          <Gift className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Complimentary
          </div>
          <div className="text-[15px] font-bold text-slate-900">
            {operations.complimentaryCount}
          </div>
        </div>
      </div>

      {/* 4. Cancelled */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white p-3 shadow-2xs">
        <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-300 text-slate-700">
          <XCircle className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Cancelled
          </div>
          <div className="text-[15px] font-bold text-slate-900">{operations.cancelledCount}</div>
        </div>
      </div>

      {/* 5. Discounts & NC */}
      <div className="col-span-2 sm:col-span-1 flex items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-300 text-slate-700">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Discounts & NC
            </div>
            <div className="text-[15px] font-bold text-slate-900">{operations.discountsCount}</div>
          </div>
        </div>
        <Link to="/pos/reports" className="text-[11px] font-bold text-primary hover:underline">
          View →
        </Link>
      </div>
    </div>
  );
}
