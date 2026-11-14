import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, ShoppingBag, ArrowRight, X, Sparkles, CheckCircle2 } from "lucide-react";
import { useOnlineOrders } from "@/hooks/queries/usePosOrders";
import type { OnlineOrderItem } from "@/types/posOrders";

export function OnlineOrderAlertModal() {
  const navigate = useNavigate();
  const { data } = useOnlineOrders();
  const [activeAlertOrder, setActiveAlertOrder] = useState<OnlineOrderItem | null>(null);
  const [dismissedOrderIds, setDismissedOrderIds] = useState<Set<string>>(new Set());

  // Listen for custom event or unhandled 'placed' online order
  useEffect(() => {
    const handleNewOrder = (e: any) => {
      if (e.detail) {
        const ord = e.detail;
        const item: OnlineOrderItem = {
          id: ord.id,
          orderNo: ord.orderNo,
          platform: ord.platform,
          outletName: ord.outletName,
          orderType: ord.orderType,
          riderDetails: ord.riderName ? `${ord.riderName} (${ord.riderPhone})` : "Assigning rider...",
          customerName: ord.customerName,
          customerPhone: ord.customerPhone,
          otp: ord.otp,
          dateTime: ord.dateTime,
          totalAmountFormatted: `₹ ${Number(ord.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          status: ord.status,
          statusDisplay: ord.statusDisplay,
          items: (ord.items || []).map((it: any) => ({
            name: it.name,
            quantity: it.quantity,
            priceFormatted: `₹ ${Number(it.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          })),
        };
        setActiveAlertOrder(item);
        playChime();
      }
    };

    window.addEventListener("retrod_pos_new_online_order", handleNewOrder);
    return () => {
      window.removeEventListener("retrod_pos_new_online_order", handleNewOrder);
    };
  }, []);

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  const handleDismiss = () => {
    if (activeAlertOrder) {
      setDismissedOrderIds((prev) => new Set(prev).add(activeAlertOrder.id));
    }
    setActiveAlertOrder(null);
  };

  const handleViewOrder = () => {
    if (!activeAlertOrder) return;
    const targetId = activeAlertOrder.id;
    handleDismiss();
    navigate({
      to: "/pos/orders/online",
      search: { viewOrderId: targetId } as any,
    });
  };

  if (!activeAlertOrder) return null;

  const platformBadge =
    activeAlertOrder.platform === "zomato"
      ? { label: "ZOMATO", bg: "bg-rose-500", text: "text-white", border: "border-rose-400" }
      : activeAlertOrder.platform === "swiggy"
        ? { label: "SWIGGY", bg: "bg-orange-500", text: "text-white", border: "border-orange-400" }
        : { label: "DIRECT WEB", bg: "bg-teal-600", text: "text-white", border: "border-teal-500" };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Top Glowing Header Bar */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-md animate-bounce">
                <Bell className="h-4 w-4" />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-black uppercase tracking-wider text-amber-300">
                    Online Order Incoming!
                  </span>
                </div>
                <p className="text-[11px] text-teal-100/90 font-medium">
                  New order received at Frontdesk
                </p>
              </div>
            </div>

            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-black tracking-wide border shadow-2xs ${platformBadge.bg} ${platformBadge.text} ${platformBadge.border}`}
            >
              {platformBadge.label}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3.5 bg-slate-50/50">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Order ID</span>
                <div className="text-[15px] font-black text-slate-900">
                  #{activeAlertOrder.orderNo}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Total Amount</span>
                <div className="text-[16px] font-black text-teal-700">
                  {activeAlertOrder.totalAmountFormatted}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11.5px] pt-1 text-slate-600">
              <div>
                <span className="text-slate-400 block font-semibold">Guest</span>
                <span className="font-bold text-slate-800">{activeAlertOrder.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Phone</span>
                <span className="font-bold text-slate-800">{activeAlertOrder.customerPhone}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 block mb-1">
                Dishes Ordered ({activeAlertOrder.items.length} items):
              </span>
              <div className="rounded-lg bg-slate-50 p-2 text-[11.5px] text-slate-700 font-medium border border-slate-200 max-h-24 overflow-y-auto">
                {activeAlertOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between py-0.5">
                    <span>
                      {it.name} <strong className="text-teal-800">× {it.quantity}</strong>
                    </span>
                    <span className="text-slate-500 font-semibold">{it.priceFormatted}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-[12px] font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs text-center"
            >
              Later
            </button>

            <button
              type="button"
              onClick={handleViewOrder}
              className="flex-2 flex items-center justify-center gap-1.5 rounded-xl bg-teal-700 py-2.5 text-[12.5px] font-black text-white hover:bg-teal-800 active:scale-98 transition cursor-pointer shadow-md"
            >
              <span>View Order & Pass to KOT</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
