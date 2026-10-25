import { useState, useMemo, useEffect } from "react";
import { ChefHat, Clock, CheckCircle2, Flame, Printer } from "lucide-react";
import {
  useKotOrders,
  useMarkKotPreparedMutation,
  useMarkKotServedMutation,
} from "@/hooks/queries/usePosOrders";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { printKotTicket } from "@/utils/printKotTicket";

type KdsTicket = {
  id: string;
  kotId: number;
  orderId?: string;
  status?: string;
  orderType: string;
  customerName: string;
  itemsText: string;
  items?: Array<{ name: string; quantity: number; notes?: string }>;
  itemCount: number;
  createdAt?: string;
  createdTimestamp: number;
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

function timerTone(elapsedMs: number) {
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
  const markServedMutation = useMarkKotServedMutation();

  useEffect(() => {
    const id = setInterval(() => refetch(), 4000);
    return () => clearInterval(id);
  }, [refetch]);

  // Kitchen queue: active preparation tickets (Ready/Prepared removes from KOT screen)
  const tickets: KdsTicket[] = useMemo(() => {
    return (kotData?.records || [])
      .filter((k) => k.status !== "Served" && k.status !== "Prepared")
      .map((k) => ({
        id: k.id,
        kotId: k.kotId,
        orderId: k.orderId,
        status: k.status,
        orderType: k.orderType,
        customerName: k.customerName,
        itemsText: k.itemsText,
        items: k.items,
        itemCount: k.itemCount,
        createdAt: k.createdAt,
        createdTimestamp: k.createdTimestamp ?? Date.now(),
        isModified: k.isModified,
      }))
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp);
  }, [kotData]);

  const handleMarkReady = (kot: KdsTicket) => {
    markPreparedMutation.mutate(
      { ticketId: kot.id, kotId: kot.kotId },
      {
        onSuccess: () => {
          toast.success(`KOT #${kot.kotId} ready — notify waiter`);
          refetch();
        },
        onError: () => toast.error("Failed to mark ready"),
      },
    );
  };

  const handleMarkServed = (kot: KdsTicket) => {
    if (/^[0-9a-f-]{36}$/i.test(kot.id)) {
      markServedMutation.mutate(kot.id, {
        onSuccess: () => {
          toast.success(`KOT #${kot.kotId} served`);
          refetch();
        },
        onError: () => toast.error("Failed to mark served"),
      });
      return;
    }
    handleMarkReady(kot);
  };

  const handlePrintKot = (kot: KdsTicket) => {
    try {
      printKotTicket({
        kotId: kot.kotId,
        orderType: kot.orderType,
        customerName: kot.customerName,
        createdTimestamp: kot.createdTimestamp,
        createdAt: kot.createdAt,
        items: parseItemLines(kot),
        isModified: kot.isModified,
      });
      toast.success(`Printing KOT #${kot.kotId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not print KOT");
    }
  };

  return (
    <div className="flex flex-col gap-3 pb-4 lg:h-[calc(100dvh-5.5rem)] lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-2 shrink-0 px-0.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-e1">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-extrabold tracking-tight text-text-primary">
                Kitchen Display
              </h2>
              <span className="inline-flex items-center gap-1 rounded-md bg-primary-tint px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary border border-primary/20">
                <Flame className="h-3 w-3" />
                Live
              </span>
            </div>
            <p className="text-[11.5px] text-text-secondary">
              FCFS · timer orange at 10m · red at 15m · Ready notifies waiter · Serve clears the card
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[12px] font-bold text-text-primary shadow-e1">
          Open orders{" "}
          <span className="ml-1 inline-flex min-w-[1.4rem] justify-center rounded-md bg-primary px-1.5 py-0.5 text-white tabular-nums">
            {tickets.length}
          </span>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {tickets.length === 0 ? (
          <div className="flex h-[min(50vh,22rem)] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface-2/50 text-center">
            <ChefHat className="h-8 w-8 text-text-secondary/50" />
            <p className="text-[14px] font-semibold text-text-secondary">No open kitchen tickets</p>
            <p className="text-[12px] text-text-secondary/80">Send KOT from Billing to appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 content-start">
            {tickets.map((kot) => (
              <KdsOrderCard
                key={kot.id}
                kot={kot}
                now={now}
                onReady={() => handleMarkReady(kot)}
                onServe={() => handleMarkServed(kot)}
                onPrint={() => handlePrintKot(kot)}
                isBusy={markPreparedMutation.isPending || markServedMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KdsOrderCard({
  kot,
  now,
  onReady,
  onServe,
  onPrint,
  isBusy,
}: {
  kot: KdsTicket;
  now: number;
  onReady: () => void;
  onServe: () => void;
  onPrint: () => void;
  isBusy?: boolean;
}) {
  const isReady = kot.status === "Prepared";
  const elapsedMs = Math.max(0, now - kot.createdTimestamp);
  const tone = timerTone(elapsedMs);
  const lines = parseItemLines(kot);

  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border bg-surface shadow-e1 overflow-hidden transition-shadow hover:shadow-e2",
        tone === "critical"
          ? "border-rose-400 ring-1 ring-rose-300/50"
          : tone === "warn"
            ? "border-amber-400 ring-1 ring-amber-300/40"
            : "border-border",
      )}
    >
      {/* Top: order id + table · timer + print */}
      <div className="flex items-start justify-between gap-2 border-b border-border/80 bg-surface-2/60 px-3 py-2.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[18px] font-black leading-none text-text-primary">
              #{kot.kotId}
            </span>
            {kot.isModified ? (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-800">
                Updated
              </span>
            ) : null}
          </div>
          <p className="mt-1 truncate text-[11.5px] font-semibold text-text-secondary">
            {kot.orderType}
            {kot.customerName && kot.customerName !== "--" ? ` · ${kot.customerName}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[13px] font-extrabold tabular-nums",
              tone === "critical"
                ? "bg-rose-100 text-rose-700 animate-pulse"
                : tone === "warn"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-900 text-white",
            )}
            title="Elapsed since KOT"
          >
            <Clock className="h-3.5 w-3.5 opacity-80" />
            {formatElapsed(elapsedMs)}
          </div>
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary hover:bg-primary-tint hover:text-primary cursor-pointer"
            title="Print kitchen ticket"
          >
            <Printer className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Items one by one under this order */}
      <ul className="flex-1 space-y-0 divide-y divide-border/70 px-0 py-0 min-h-[5.5rem]">
        {lines.map((line, idx) => (
          <li
            key={`${line.name}-${idx}`}
            className="flex items-start justify-between gap-3 px-3 py-2.5 text-[13px]"
          >
            <span className="min-w-0 font-semibold leading-snug text-text-primary">
              <span className="mr-1.5 text-[11px] font-bold text-text-secondary/70">
                {idx + 1}.
              </span>
              {line.name}
              {line.notes ? (
                <span className="mt-0.5 block pl-5 text-[11px] font-medium text-amber-700">
                  ★ {line.notes}
                </span>
              ) : null}
            </span>
            <span className="shrink-0 rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[12px] font-bold text-text-primary">
              ×{line.quantity}
            </span>
          </li>
        ))}
      </ul>

      <div className="border-t border-border/80 px-3 py-2.5">
        <button
          type="button"
          disabled={isBusy}
          onClick={isReady ? onServe : onReady}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {isReady ? "Serve" : "Ready"}
        </button>
      </div>
    </article>
  );
}

export default PosKotManager;
