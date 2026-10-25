import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  RefreshCw,
  Package,
  Plus,
  ShoppingCart,
  Activity,
  X,
  Flame,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useStockItems, useStockOverview } from "@/hooks/queries/usePosInventory";
import type { StockItem } from "@/types/posInventory";
import { CreatePurchaseModal } from "@/components/shared/pos/inventory/modals/CreatePurchaseModal";
import { useOutletContext } from "@/context/PosOutletContext";

type StockLocation = "all" | "kitchen" | "bar" | "cold_storage";

interface LiveStockMovement {
  id: string;
  type: "sale" | "purchase" | "wastage";
  item: string;
  qty: string;
  location: string;
  time: string;
  amount?: string;
  deltaType: "increase" | "decrease" | "neutral";
}

interface LowStockRadarItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  unit: string;
  daysRemaining: number;
  percent: number;
  supplier: string;
  status: "critical" | "low" | "optimal";
}

const EMPTY_CATEGORIES = [
  { label: "Groceries", percentage: 0, valuation: "₹0", color: "#38bdf8" },
  { label: "Dairy", percentage: 0, valuation: "₹0", color: "#facc15" },
  { label: "Beverages", percentage: 0, valuation: "₹0", color: "#34d399" },
  { label: "Meat & Apps", percentage: 0, valuation: "₹0", color: "#fb923c" },
  { label: "Others", percentage: 0, valuation: "₹0", color: "#c084fc" },
];

export function InventoryDashboardView() {
  const navigate = useNavigate();
  const { activeOutlet } = useOutletContext();
  const { refetch: refetchStock } = useStockItems();
  const { data: overview } = useStockOverview();

  const liveLowStock: LowStockRadarItem[] = (overview?.lowStock || []).map((item: StockItem) => {
    const current = item.availableStock;
    const min = item.minThreshold || item.reorderLevel || 0;
    const percent = min > 0 ? Math.round((current / Math.max(min, 1)) * 100) : 100;
    return {
      id: item.id,
      name: item.rawMaterial,
      category: item.category,
      currentStock: current,
      minThreshold: min,
      unit: item.unit,
      daysRemaining: 0,
      percent,
      supplier: "—",
      status: item.isLow ? "critical" : item.isAtPar ? "low" : "optimal",
    };
  });

  const liveMovements: LiveStockMovement[] = (overview?.movements || []).map((mov) => {
    const typeName = (mov.type || "").toUpperCase();
    const type: LiveStockMovement["type"] = typeName.includes("WASTAGE")
      ? "wastage"
      : typeName.includes("IN") || typeName.includes("PURCHASE")
        ? "purchase"
        : "sale";
    return {
      id: mov.id,
      type,
      item: mov.name,
      qty: `${mov.signedQty} ${mov.unit}`,
      location: "Kitchen",
      time: mov.createdAt ? new Date(mov.createdAt).toLocaleTimeString() : "",
      deltaType: mov.signedQty >= 0 ? "increase" : "decrease",
    };
  });

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<StockLocation>("all");
  const [selectedMonth, setSelectedMonth] = useState("September");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  const [lastSyncedTime, setLastSyncedTime] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveBannerDismissed, setLiveBannerDismissed] = useState(false);

  const lowStock = liveLowStock;
  const categories = EMPTY_CATEGORIES;
  const movements = liveMovements;
  const formatInr = (n: number) =>
    `₹ ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const kpis = {
    valuation: formatInr(overview?.valuation || 0),
    valuationTrend: "Stock ledger",
    skuActive: `${overview?.skuActive || 0} SKUs Active`,
    consumption: formatInr(0),
    portions: `${overview?.skuActive || 0} SKUs`,
    pace: overview?.skuActive ? "Live" : "No Activity",
    wastagePct: overview?.wastageTodayQty ? `${overview.wastageTodayQty}` : "0%",
    wastageAmt: `${overview?.wastageTodayQty || 0} logged today`,
    health: overview?.lowStockCount ? "Watch" : "—",
    healthLabel: overview?.skuActive ? "Live" : "No Data",
    critical: overview?.critical || 0,
    low: overview?.lowStockCount || 0,
    healthy: Math.max(0, (overview?.skuActive || 0) - (overview?.lowStockCount || 0)),
    closingCompliance: "0%",
    closingDays: "0 of 0 Days Closed",
    missedDaysLabel: "0 Days",
    missedDates: "—",
    categoryTotal: "₹ 0",
  };

  const currentDay = new Date().getDate();
  const missedDays: number[] = [];
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);
  const completedDays: number[] = [];

  useEffect(() => {
    setLiveBannerDismissed(false);
    setLastSyncedTime(new Date());
    setSecondsAgo(0);
  }, [activeOutlet?.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastSyncedTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastSyncedTime]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    refetchStock();
    setTimeout(() => {
      setLastSyncedTime(new Date());
      setSecondsAgo(0);
      setIsRefreshing(false);
      toast.success("Stock synced with live POS");
    }, 400);
  };

  const handleQuickReorder = (item: LowStockRadarItem) => {
    toast.success(`PO drafted for ${item.name}`, {
      description: `Supplier: ${item.supplier}`,
      action: {
        label: "View",
        onClick: () => navigate({ to: "/pos/inventory/purchase" }),
      },
    });
  };

  const handleReorderAllCritical = () => {
    const n = lowStock.filter((i) => i.status === "critical").length;
    toast.success(`Batch reorder created for ${n} critical items`);
  };

  const filteredRadar = useMemo(() => {
    return lowStock.filter(
      (item) =>
        selectedCategoryFilter === "All" || item.category === selectedCategoryFilter,
    );
  }, [selectedCategoryFilter, lowStock]);

  const criticalCount = lowStock.filter((i) => i.status === "critical").length;
  const showAlert = !liveBannerDismissed && criticalCount > 0;

  const locations: { id: StockLocation; label: string }[] = [
    { id: "all", label: "All" },
    { id: "kitchen", label: "Kitchen" },
    { id: "bar", label: "Bar" },
    { id: "cold_storage", label: "Cold" },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50/80 px-3 py-1 text-[12px] font-bold text-teal-800">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-600" />
            </span>
            Live Sync
            <span className="font-normal text-teal-600/80">
              {secondsAgo === 0 ? "Just now" : `${secondsAgo}s ago`}
            </span>
          </div>

          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            {locations.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => setSelectedLocation(loc.id)}
                className={`rounded-lg px-2.5 py-1 text-[12px] font-bold transition cursor-pointer ${
                  selectedLocation === loc.id
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-teal-600 ${isRefreshing ? "animate-spin" : ""}`} />
            Sync Now
          </button>
          <button
            type="button"
            onClick={() => setIsPurchaseModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-[12.5px] font-bold text-white hover:bg-teal-700 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Receive Stock
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/pos/inventory/closing-stock" })}
            className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-1.5 text-[12.5px] font-bold text-teal-800 hover:bg-teal-100 transition cursor-pointer"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Stock Count
          </button>
        </div>
      </div>

      {showAlert && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-2.5 text-[12.5px] text-amber-950">
          <div className="flex min-w-0 items-center gap-2.5">
            <Flame className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              <strong className="font-bold">{criticalCount} critical items</strong>
              {lowStock
                .filter((item) => item.status === "critical")
                .slice(0, 2)
                .map((item) => ` ${item.name} ${item.currentStock} ${item.unit}`)
                .join(" and ")}{" "}
              below reorder level.
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleReorderAllCritical}
              className="rounded-lg bg-amber-600 px-2.5 py-1 text-[12px] font-bold text-white hover:bg-amber-700 cursor-pointer"
            >
              Reorder Critical
            </button>
            <button
              type="button"
              onClick={() => setLiveBannerDismissed(true)}
              className="rounded-md p-1 text-amber-700 hover:bg-amber-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {!(overview?.skuActive) && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[12.5px] text-slate-600">
          <strong className="text-slate-800">{activeOutlet.name}</strong> — stock stays at zero
          until you add raw materials and receive a purchase.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          to="/pos/inventory/available-stock"
          className="rounded-2xl border border-slate-300 bg-white p-5 shadow-2xs hover:border-teal-400 transition"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Stock Valuation
              </span>
              <div className="text-[28px] font-extrabold tracking-tight text-slate-900">
                {kpis.valuation}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-200/80 bg-teal-50 text-teal-700">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[12px]">
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
              <ArrowUpRight className="h-3.5 w-3.5" /> {kpis.valuationTrend}
            </span>
            <span className="font-semibold text-slate-500">{kpis.skuActive}</span>
          </div>
        </Link>

        <Link
          to="/pos/inventory/reports"
          className="rounded-2xl border border-slate-300 bg-white p-5 shadow-2xs hover:border-blue-400 transition"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Today&apos;s Consumption
              </span>
              <div className="text-[28px] font-extrabold tracking-tight text-slate-900">
                {kpis.consumption}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200/80 bg-blue-50 text-blue-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[12px]">
            <span className="font-bold text-slate-700">{kpis.portions}</span>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
              {kpis.pace}
            </span>
          </div>
        </Link>

        <Link
          to="/pos/inventory/wastage"
          className="rounded-2xl border border-slate-300 bg-white p-5 shadow-2xs hover:border-emerald-400 transition"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Wastage & Spoilage
              </span>
              <div className="text-[28px] font-extrabold tracking-tight text-emerald-600">
                {kpis.wastagePct}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[12px]">
            <span className="font-semibold text-slate-600">{kpis.wastageAmt}</span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
              Target &lt; 3.0%
            </span>
          </div>
        </Link>

        <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Stock Health Index
              </span>
              <div className="text-[28px] font-extrabold tracking-tight text-slate-900">
                {kpis.health}{" "}
                <span className="text-[14px] font-bold text-slate-500">{kpis.healthLabel}</span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200/80 bg-amber-50 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[12px] font-bold">
            <span className="text-rose-600">{kpis.critical} Critical</span>
            <span className="text-amber-600">{kpis.low} Low Stock</span>
            <span className="text-emerald-600">{kpis.healthy} Healthy</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch lg:min-h-[560px]">
        <div className="flex min-h-[560px] flex-col rounded-2xl border border-slate-300 bg-white shadow-2xs lg:col-span-5 lg:h-full lg:min-h-0">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-rose-500" />
              <h3 className="text-[16px] font-bold text-slate-900">Low Stock Radar</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["All", "Meat", "Dairy", "Beverages", "Groceries"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`rounded-lg px-2.5 py-1 text-[11.5px] font-bold cursor-pointer ${
                    selectedCategoryFilter === cat
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredRadar.length === 0 ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-6 text-center">
                <Package className="mb-2 h-8 w-8 text-slate-300" />
                <p className="text-[13px] font-bold text-slate-700">No stock alerts</p>
                <p className="mt-1 text-[12px] text-slate-400">
                  Items appear here after you receive stock and set reorder levels.
                </p>
              </div>
            ) : (
              filteredRadar.map((item) => {
                const isCritical = item.status === "critical";
                const isLow = item.status === "low";
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/80"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13.5px] font-bold text-slate-900">
                          {item.name}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-extrabold uppercase ${
                            isCritical
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : isLow
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isCritical ? "Critical" : isLow ? "Low Buffer" : "Optimal"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              isCritical ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(8, item.percent))}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-[12px] font-semibold text-slate-600">
                          {item.currentStock}/{item.minThreshold} {item.unit}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-slate-500">
                        {item.category} · Supplier:{" "}
                        <strong className="font-semibold text-slate-700">{item.supplier}</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickReorder(item)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-teal-700 cursor-pointer"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Reorder
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex min-h-[560px] flex-col gap-4 lg:col-span-4 lg:h-full lg:min-h-0">
          <div className="flex min-h-0 flex-[1.15] flex-col rounded-2xl border border-slate-300 bg-white shadow-2xs">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <h3 className="text-[16px] font-bold text-slate-900">Daily Closing</h3>
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none rounded-lg border border-slate-300 bg-white py-1 pl-2.5 pr-7 text-[12px] font-bold text-slate-700 cursor-pointer"
                >
                  <option value="September">Sep 2026</option>
                  <option value="August">Aug 2026</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-2 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col justify-between space-y-3 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                  <div className="text-[24px] font-black text-slate-900">
                    {kpis.closingCompliance}
                  </div>
                  <div className="text-[12px] font-semibold text-slate-600">Compliance Rate</div>
                  <div className="mt-1 text-[11px] font-bold text-emerald-600">
                    {kpis.closingDays}
                  </div>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3.5">
                  <div className="text-[24px] font-black text-rose-600">{kpis.missedDaysLabel}</div>
                  <div className="text-[12px] font-semibold text-rose-800">Missed Closings</div>
                  <div className="mt-1 text-[11px] font-bold text-rose-600">{kpis.missedDates}</div>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {daysInMonth.map((day) => {
                  const isDone = completedDays.includes(day);
                  const isMissed = missedDays.includes(day);
                  const isToday = day === currentDay;
                  let cell = "bg-slate-50 text-slate-300";
                  if (isDone)
                    cell = "bg-emerald-50 text-emerald-700 font-bold border border-emerald-200";
                  else if (isMissed)
                    cell = "bg-rose-50 text-rose-700 font-bold border border-rose-200";
                  else if (isToday) cell = "bg-teal-600 text-white font-black";
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        if (isToday) navigate({ to: "/pos/inventory/closing-stock" });
                        else if (isMissed) toast.error(`Day ${day}: closing missed`);
                        else if (isDone) toast.success(`Day ${day}: closing recorded`);
                      }}
                      className={`flex h-8 items-center justify-center rounded-lg text-[12px] cursor-pointer ${cell}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-300 bg-white p-5 shadow-2xs">
            <div className="mb-3 flex shrink-0 items-center justify-between">
              <h3 className="text-[16px] font-bold text-slate-900">Valuation by Category</h3>
              <span className="text-[12px] font-bold text-slate-500">{kpis.categoryTotal}</span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col justify-evenly">
              {categories.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-lg p-2 text-[12.5px] hover:bg-slate-50"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">
                    {item.label}
                  </span>
                  <span className="font-bold text-slate-900">{item.valuation}</span>
                  <span className="w-9 text-right font-mono text-[12px] text-slate-500">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex min-h-[560px] flex-col rounded-2xl border border-slate-300 bg-white shadow-2xs lg:col-span-3 lg:h-full lg:min-h-0">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-teal-600" />
              <h3 className="text-[16px] font-bold text-slate-900">Stock Movements</h3>
            </div>
            <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11.5px] font-bold text-teal-700">
              Live Stream
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-slate-100">
            {movements.length === 0 ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-5 text-center">
                <Activity className="mb-2 h-8 w-8 text-slate-300" />
                <p className="text-[13px] font-bold text-slate-700">No movements yet</p>
                <p className="mt-1 text-[12px] text-slate-400">
                  Sales, purchases, and wastage will stream here once stock is active.
                </p>
              </div>
            ) : (
              movements.map((mov) => {
                const badge =
                  mov.type === "purchase"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : mov.type === "wastage"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-blue-50 text-blue-700 border-blue-200";
                return (
                  <div key={mov.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span
                          className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase ${badge}`}
                        >
                          {mov.type}
                        </span>
                        <div className="mt-1 truncate text-[13px] font-bold text-slate-900">
                          {mov.item}
                        </div>
                        <div className="text-[11.5px] text-slate-500">{mov.location}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div
                          className={`text-[13px] font-extrabold font-mono ${
                            mov.deltaType === "increase"
                              ? "text-emerald-600"
                              : mov.deltaType === "decrease"
                                ? "text-rose-600"
                                : "text-slate-700"
                          }`}
                        >
                          {mov.qty}
                        </div>
                        {mov.amount && (
                          <div className="text-[11.5px] font-medium text-slate-400">
                            {mov.amount}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400">{mov.time}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <CreatePurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
      />
    </div>
  );
}
