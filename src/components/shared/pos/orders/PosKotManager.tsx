import { useState, useMemo, useEffect } from "react";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Flame,
  Printer,
  User,
  FileSpreadsheet,
} from "lucide-react";
import { useKotOrders, useMarkKotPreparedMutation } from "@/hooks/queries/usePosOrders";
import { exportToExcel } from "@/utils/exportUtils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type KdsStage = "Preparing" | "Ready";

type KdsTicket = {
  id: string;
  kotId: number;
  orderType: string;
  customerName: string;
  itemsText: string;
  items?: Array<{ name: string; quantity: number; notes?: string }>;
  itemCount: number;
  status: string;
  createdAt: string;
  createdTimestamp: number;
  /** Set when Ready — elapsed timer freezes at this moment */
  readyTimestamp?: number;
  stage: KdsStage;
  isModified?: boolean;
};

function parseItemLines(kot: KdsTicket): Array<{ name: string; quantity: number; notes?: string }> {
  if (kot.items && kot.items.length > 0) return kot.items;
  return (kot.itemsText || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((line) => {
      const qtyMatch = line.match(/×\s*(\d+)\s*$/);
      if (qtyMatch) {
        return {
          name: line.replace(/×\s*\d+\s*$/, "").trim(),
          quantity: Number(qtyMatch[1]) || 1,
        };
      }
      return { name: line, quantity: 1 };
    });
}

function formatElapsed(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function timerTone(elapsedMs: number, stage: KdsStage) {
  if (stage === "Ready") return "ready" as const;
  const mins = elapsedMs / 60_000;
  if (mins >= 15) return "critical" as const;
  if (mins >= 10) return "warn" as const;
  return "ok" as const;
}

export function PosKotManager() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: kotData, refetch } = useKotOrders();
  const markPreparedMutation = useMarkKotPreparedMutation();

  // Poll a bit faster so billing → KOT appears quickly on KDS
  useEffect(() => {
    const id = setInterval(() => {
      refetch();
    }, 4000);
    return () => clearInterval(id);
  }, [refetch]);

  const tickets: KdsTicket[] = useMemo(() => {
    return (kotData?.records || []).map((k) => {
      const stage: KdsStage =
        k.status === "Prepared" || k.status === "Served" ? "Ready" : "Preparing";
      return {
        id: k.id,
        kotId: k.kotId,
        orderType: k.orderType,
        customerName: k.customerName,
        itemsText: k.itemsText,
        items: k.items,
        itemCount: k.itemCount,
        status: k.status,
        createdAt: k.createdAt,
        createdTimestamp: k.createdTimestamp ?? Date.now(),
        readyTimestamp: k.readyTimestamp,
        stage,
        isModified: k.isModified,
      };
    });
  }, [kotData]);

  // FCFS: oldest preparing first
  const preparingTickets = useMemo(
    () =>
      tickets
        .filter((t) => t.stage === "Preparing")
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp),
    [tickets],
  );

  const readyTickets = useMemo(
    () =>
      tickets
        .filter((t) => t.stage === "Ready")
        .sort((a, b) => b.createdTimestamp - a.createdTimestamp),
    [tickets],
  );

  const handleMarkReady = (kot: KdsTicket) => {
    markPreparedMutation.mutate(kot.kotId, {
      onSuccess: () => {
        toast.success(`KOT #${kot.kotId} moved to Ready`, {
          description: kot.orderType,
        });
        refetch();
      },
      onError: () => toast.error("Failed to mark KOT ready"),
    });
  };

  const handleExportExcel = () => {
    const headers = ["KOT ID", "Stage", "Order", "Items", "Elapsed", "Created"];
    const rows = tickets.map((k) => {
      const end = k.stage === "Ready" ? (k.readyTimestamp ?? now) : now;
      return [
        k.kotId,
        k.stage,
        k.orderType,
        k.itemsText,
        formatElapsed(Math.max(0, end - k.createdTimestamp)),
        k.createdAt,
      ];
    });
    exportToExcel({
      filename: `KDS_${new Date().toISOString().slice(0, 10)}`,
      title: "Kitchen Display System",
      columns: headers,
      rows,
    });
    toast.success(`Exported ${rows.length} KOT tickets`);
  };

  return (
    <div className="flex flex-col gap-3 pb-6 lg:h-[calc(100dvh-5.5rem)] lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-hidden">
      {/* Compact header */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 shadow-e1 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-tint border border-primary/20 text-primary">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-text-primary">Kitchen Display (KDS)</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-tint px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                <Flame className="h-3 w-3 animate-pulse" />
                Live · FCFS
              </span>
            </div>
            <p className="text-[11px] text-text-secondary">
              Billing KOT → Preparing → Ready · timer turns orange at 10m, red at 15m
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[11px] font-bold text-indigo-800">
            Preparing {preparingTickets.length}
          </span>
          <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
            Ready {readyTickets.length}
          </span>
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[11.5px] font-bold text-slate-700 hover:bg-surface-2 cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
            Export
          </button>
        </div>
      </div>

      {/* 2-stage board: Preparing 2/3 · Ready 1/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-0">
        {/* PREPARING — 2/3 */}
        <section className="lg:col-span-2 flex flex-col min-h-0 rounded-xl border border-indigo-200 bg-indigo-50/30 overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-indigo-200 bg-indigo-50/80 shrink-0">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-indigo-600" />
              <h3 className="text-[12px] font-extrabold uppercase tracking-wider text-indigo-900">
                Preparing
              </h3>
              <span className="rounded-full bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5">
                {preparingTickets.length}
              </span>
            </div>
            <span className="text-[10.5px] font-semibold text-indigo-700">FCFS · oldest first</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2.5">
            {preparingTickets.length === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-indigo-200 bg-white/60 text-[12px] text-slate-500">
                Waiting for KOT from Billing…
              </div>
            ) : (
              preparingTickets.map((kot) => (
                <KdsOrderCard
                  key={kot.id}
                  kot={kot}
                  now={now}
                  onReady={() => handleMarkReady(kot)}
                />
              ))
            )}
          </div>
        </section>

        {/* READY — 1/3 */}
        <section className="lg:col-span-1 flex flex-col min-h-0 rounded-xl border border-emerald-200 bg-emerald-50/30 overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-emerald-200 bg-emerald-50/80 shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <h3 className="text-[12px] font-extrabold uppercase tracking-wider text-emerald-900">
                Ready
              </h3>
              <span className="rounded-full bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5">
                {readyTickets.length}
              </span>
            </div>
            <span className="text-[10.5px] font-semibold text-emerald-700">Pickup</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2.5">
            {readyTickets.length === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-white/60 text-[12px] text-slate-500">
                No ready tickets yet
              </div>
            ) : (
              readyTickets.map((kot) => (
                <KdsOrderCard key={kot.id} kot={kot} now={now} />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function KdsOrderCard({
  kot,
  now,
  onReady,
}: {
  kot: KdsTicket;
  now: number;
  onReady?: () => void;
}) {
  // Live while Preparing; freeze at readyTimestamp once Ready
  const elapsedMs =
    kot.stage === "Ready"
      ? Math.max(0, (kot.readyTimestamp ?? now) - kot.createdTimestamp)
      : Math.max(0, now - kot.createdTimestamp);
  const tone = timerTone(elapsedMs, kot.stage);
  const lines = parseItemLines(kot);

  return (
    <article
      className={cn(
        "rounded-xl border bg-white p-3 shadow-e1 space-y-2.5",
        tone === "critical" && kot.stage === "Preparing"
          ? "border-rose-400 ring-1 ring-rose-300/60"
          : tone === "warn" && kot.stage === "Preparing"
            ? "border-amber-400 ring-1 ring-amber-300/50"
            : kot.stage === "Ready"
              ? "border-emerald-200"
              : "border-slate-200",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[14px] font-extrabold text-slate-900">#{kot.kotId}</span>
            <span className="truncate rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10.5px] font-bold text-slate-700">
              {kot.orderType}
            </span>
            {kot.isModified ? (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9.5px] font-bold uppercase text-amber-800">
                Updated
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
            <User className="h-3 w-3" />
            <span className="truncate">
              {kot.customerName && kot.customerName !== "--" ? kot.customerName : "Walk-in"}
            </span>
            <span className="text-slate-300">·</span>
            <span>{kot.itemCount} items</span>
          </div>
        </div>

        <div
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[12px] font-extrabold tabular-nums",
            tone === "critical"
              ? "bg-rose-100 text-rose-700 animate-pulse"
              : tone === "warn"
                ? "bg-amber-100 text-amber-800"
                : tone === "ready"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-800",
          )}
          title={
            kot.stage === "Ready"
              ? "Prep time (stopped when Ready)"
              : "Elapsed since KOT sent"
          }
        >
          <Clock className="h-3.5 w-3.5" />
          {formatElapsed(elapsedMs)}
        </div>
      </div>

      <ul className="space-y-1 rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-2">
        {lines.map((line, idx) => (
          <li
            key={`${line.name}-${idx}`}
            className="flex items-start justify-between gap-2 text-[12px] text-slate-800"
          >
            <span className="min-w-0 font-semibold leading-snug">
              {line.name}
              {line.notes ? (
                <span className="mt-0.5 block text-[10.5px] font-medium text-amber-700">
                  ★ {line.notes}
                </span>
              ) : null}
            </span>
            <span className="shrink-0 font-mono font-bold text-slate-600">×{line.quantity}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={() =>
            toast.success(`Reprint KOT #${kot.kotId}`, { description: kot.orderType })
          }
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 cursor-pointer"
          title="Print duplicate"
        >
          <Printer className="h-4 w-4" />
        </button>
        {kot.stage === "Preparing" && onReady ? (
          <button
            type="button"
            onClick={onReady}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-[12px] font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-[0.99] cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            Ready
          </button>
        ) : (
          <div className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 py-2 text-[12px] font-bold text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            Ready for pickup
          </div>
        )}
      </div>
    </article>
  );
}

export default PosKotManager;
