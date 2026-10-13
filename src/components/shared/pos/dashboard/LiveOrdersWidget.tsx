import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import type { LiveOrderItem } from "@/types/posDashboard";

const VISIBLE_ORDER_ROWS = 3;

interface LiveOrdersWidgetProps {
  orders: LiveOrderItem[];
}

export function LiveOrdersWidget({ orders }: LiveOrdersWidgetProps) {
  const visibleOrders = orders.slice(0, VISIBLE_ORDER_ROWS);
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-300 bg-white p-3 shadow-2xs">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 pb-1.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <h2 className="text-[13.5px] font-bold text-slate-900">Current Orders</h2>
          <span className="rounded-full bg-primary/10 px-2 py-0.2 text-[10.5px] font-bold text-primary border border-primary/20">
            {orders.length} Active
          </span>
        </div>
        <Link
          to="/pos/orders"
          className="text-[11.5px] font-bold text-primary hover:underline"
        >
          View
        </Link>
      </div>

      {/* Three rows only — View opens the full current-orders screen */}
      <div className="my-1.5 flex min-h-0 flex-1 flex-col justify-center gap-1.5">
        {visibleOrders.map((ord) => (
          <div
            key={ord.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 hover:bg-slate-100 hover:border-slate-300 transition"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-md bg-white border border-slate-300 text-[10px] font-extrabold text-slate-800 shadow-2xs">
                {ord.title.replace(/[^0-9]/g, "")
                  ? `#${ord.title.replace(/[^0-9]/g, "")}`
                  : ord.title.slice(0, 3)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold text-slate-900 truncate">{ord.title}</span>
                  <span className="rounded px-1 py-0.2 text-[9px] font-semibold bg-white border border-slate-300 text-slate-600 shrink-0">
                    {ord.orderType}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10.5px] text-slate-500">
                  <Clock className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                  <span>{ord.elapsedMinutes}m elapsed</span>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10.5px] font-bold text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {ord.statusLabel}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Link */}
      <div className="shrink-0 border-t border-slate-200 pt-1.5 text-center">
        <Link
          to="/pos/orders"
          className="text-[11.5px] font-bold text-primary hover:underline"
        >
          Open current orders →
        </Link>
      </div>
    </div>
  );
}
