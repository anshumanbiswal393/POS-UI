import { Bot, Sliders, Bell, Settings } from "lucide-react";
import { toast } from "sonner";

/** Slim inventory utility bar — outlet/hotel name lives in the top nav, not here. */
export function PosInventoryHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
          Inventory
        </span>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
          Store #330067
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => toast.info("Retrod Inventory AI Agent assistant activated")}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <Bot className="h-3.5 w-3.5 text-teal-600" />
          <span className="hidden sm:inline">AI</span>
        </button>

        <button
          type="button"
          onClick={() => toast.info("Inventory preferences dialog")}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <Sliders className="h-3.5 w-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Prefs</span>
        </button>

        <button
          type="button"
          onClick={() => toast.info("Inventory alerts: 2 low stock warnings")}
          className="relative rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        <button
          type="button"
          onClick={() => toast.info("Inventory settings")}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
