import { Link } from "@tanstack/react-router";
import { IndianRupee, ShoppingBag, Utensils, ReceiptText, KeyRound } from "lucide-react";
import type { PosDashboardStats } from "@/types/posDashboard";

interface DashboardKpiCardsProps {
  stats: PosDashboardStats;
}

export function DashboardKpiCards({ stats }: DashboardKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
      {/* 1. Total collections */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white p-3 shadow-2xs">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
          <IndianRupee className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total collections
          </div>
          <div className="mt-0.5 text-[18px] font-black text-slate-900 leading-tight">
            {stats.totalCollectionsFormatted}
          </div>
          <div className="text-[10.5px] text-primary font-medium">Paid today</div>
        </div>
      </div>

      {/* 2. Total orders */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white p-3 shadow-2xs">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-300 text-slate-700">
          <ShoppingBag className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total orders
          </div>
          <div className="mt-0.5 text-[18px] font-black text-slate-900 leading-tight">
            {stats.totalOrders}
          </div>
          <div className="text-[10.5px] text-slate-500 font-medium">Today</div>
        </div>
      </div>

      {/* 3. Active tables */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white p-3 shadow-2xs">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-300 text-slate-700">
          <Utensils className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Active tables
          </div>
          <div className="mt-0.5 text-[18px] font-black text-slate-900 leading-tight">
            {stats.activeTablesCount}{" "}
            <span className="text-[12px] font-normal text-slate-400">
              / {stats.totalTablesCount}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${stats.occupancyPercentage}%` }}
              />
            </div>
            <span className="text-[10.5px] text-primary font-medium">
              {stats.occupancyPercentage}% occupied
            </span>
          </div>
        </div>
      </div>

      {/* 4. Unpaid bills */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white p-3 shadow-2xs">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-300 text-slate-700">
          <ReceiptText className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Unpaid bills
          </div>
          <div className="mt-0.5 text-[18px] font-black text-slate-900 leading-tight">
            {stats.unpaidBillsFormatted}
          </div>
          <Link
            to="/pos/settlement"
            className="text-[10.5px] font-bold text-primary hover:underline"
          >
            Review dues →
          </Link>
        </div>
      </div>

      {/* 5. Room charges */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white p-3 shadow-2xs">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
          <KeyRound className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Room charges
          </div>
          <div className="mt-0.5 text-[18px] font-black text-slate-900 leading-tight">
            {stats.roomChargesFormatted}
          </div>
          <div className="text-[10.5px] text-slate-500 font-medium">Guest folios</div>
        </div>
      </div>
    </div>
  );
}
