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
  X,
  Flame,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useStockItems, useStockOverview, useStockCategories } from "@/hooks/queries/usePosInventory";
import type { StockItem } from "@/types/posInventory";
import { CreatePurchaseModal } from "@/components/shared/pos/inventory/modals/CreatePurchaseModal";
import { useOutletContext } from "@/context/PosOutletContext";

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
  const { data: stockItems = [], refetch: refetchStock } = useStockItems();
  const { data: overview } = useStockOverview();

  const itemsWithLow = useMemo(() => {
    const rawLow: StockItem[] = [];
    stockItems.forEach((sku) => {
      const threshold = sku.alertQuantity ?? sku.minThreshold ?? sku.reorderLevel ?? 0;
      if (threshold > 0 && (sku.availableStock ?? 0) <= threshold) {
        rawLow.push(sku);
      }
    });
    const existingIds = new Set(rawLow.map((i) => i.id));
    (overview?.lowStock || []).forEach((item: StockItem) => {
      if (!existingIds.has(item.id)) {
        rawLow.push(item);
      }
    });
    return rawLow;
  }, [stockItems, overview?.lowStock]);

  const nearExpiryItems = useMemo(() => {
    const today = new Date();
    return stockItems
      .filter((item) => Boolean(item.expiryDate))
      .map((item) => {
        const exp = new Date(item.expiryDate!);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { ...item, diffDays };
      })
      .filter((item) => item.diffDays <= 15);
  }, [stockItems]);

  const liveLowStock: LowStockRadarItem[] = itemsWithLow.map((item: StockItem) => {
    const current = item.availableStock ?? 0;
    const min = item.alertQuantity || item.minThreshold || item.reorderLevel || 1;
    const percent = min > 0 ? Math.round((current / Math.max(min, 1)) * 100) : 100;
    return {
      id: item.id,
      name: item.rawMaterial || item.name || "",
      category: item.category || "General",
      currentStock: current,
      minThreshold: min,
      unit: item.unit || "Kg",
      daysRemaining: 0,
      percent,
      supplier: "—",
      status: current <= min ? "critical" : "low",
    };
  });

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("September");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  const [lastSyncedTime, setLastSyncedTime] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveBannerDismissed, setLiveBannerDismissed] = useState(false);

  const { data: stockCategories = [] } = useStockCategories();
  const radarCategories = useMemo(() => {
    const list = ["All"];
    stockCategories.forEach((c) => {
      const name = c.name?.trim();
      if (name && !list.includes(name)) list.push(name);
    });
    return list;
  }, [stockCategories]);

  useEffect(() => {
    setSelectedCategoryFilter("All");
  }, [activeOutlet?.id]);

  const lowStock = liveLowStock;
  const categories = EMPTY_CATEGORIES;
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

  return (
    <div className="relative flex flex-col flex-1 gap-2 p-2.5 sm:p-3 lg:p-4 pt-2 sm:pt-2.5 lg:pt-2.5 pos-terminal-viewport lg:min-h-0 overflow-y-auto bg-slate-50/50 animate-in fade-in duration-200">
      {/* Top Action & Sync Bar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3 py-1.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50/80 px-2.5 py-0.5 text-[11px] font-bold text-teal-800">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-600" />
            </span>
            Live Sync
            <span className="font-normal text-teal-600/80">
              {secondsAgo === 0 ? "Just now" : `${secondsAgo}s ago`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`h-3 w-3 text-teal-600 ${isRefreshing ? "animate-spin" : ""}`} />
            Sync Now
          </button>
          <button
            type="button"
            onClick={() => setIsPurchaseModalOpen(true)}
            className="flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1 text-[11.5px] font-bold text-white hover:bg-teal-700 transition cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            Receive Stock
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/pos/inventory/closing-stock" })}
            className="flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50/60 px-2.5 py-1 text-[11.5px] font-bold text-teal-800 hover:bg-teal-100 transition cursor-pointer"
          >
            <CheckCircle2 className="h-3 w-3" />
            Stock Count
          </button>
        </div>
      </div>

      {nearExpiryItems.length > 0 && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-300/80 bg-rose-50 px-3 py-1.5 text-[11.5px] text-rose-950">
          <div className="flex min-w-0 items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-rose-600" />
            <span className="truncate">
              <strong className="font-bold">{nearExpiryItems.length} item(s) near expiry:</strong>
              {nearExpiryItems
                .slice(0, 3)
                .map(
                  (item) =>
                    ` ${item.rawMaterial || item.name} (${item.diffDays < 0 ? "Expired" : `${item.diffDays}d left`})`,
                )
                .join(", ")}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: "/pos/inventory/masters/raw-materials" })}
            className="rounded-md bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-rose-700 cursor-pointer"
          >
            Review Items
          </button>
        </div>
      )}

      {showAlert && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-1.5 text-[11.5px] text-amber-950">
          <div className="flex min-w-0 items-center gap-2">
            <Flame className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span className="truncate">
              <strong className="font-bold">{criticalCount} critical items</strong>
              {lowStock
                .filter((item) => item.status === "critical")
                .slice(0, 2)
                .map((item) => ` ${item.name} (${item.currentStock} ${item.unit})`)
                .join(" and ")}{" "}
              below reorder level.
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={handleReorderAllCritical}
              className="rounded-md bg-amber-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-amber-700 cursor-pointer"
            >
              Reorder Critical
            </button>
            <button
              type="button"
              onClick={() => setLiveBannerDismissed(true)}
              className="rounded-md p-0.5 text-amber-700 hover:bg-amber-100 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {!(overview?.skuActive) && (
        <div className="flex shrink-0 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
          <p className="truncate">
            <strong className="text-slate-800">{activeOutlet.name}</strong> — stock stays at zero
            until you add raw materials and receive a purchase.
          </p>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid shrink-0 grid-cols-2 gap-2 xl:grid-cols-4">
        {/* Total Stock Valuation */}
        <Link
          to="/pos/inventory/available-stock"
          className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-2xs hover:border-teal-400 transition"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-teal-200/80 bg-teal-50 text-teal-700">
            <Package className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Total Stock Valuation
            </div>
            <div className="text-[16px] font-black text-slate-900 leading-tight truncate">
              {kpis.valuation}
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[10.5px]">
              <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600 truncate">
                <ArrowUpRight className="h-3 w-3" /> {kpis.valuationTrend}
              </span>
              <span className="font-semibold text-slate-500 truncate">{kpis.skuActive}</span>
            </div>
          </div>
        </Link>

        {/* Today's Consumption */}
        <Link
          to="/pos/inventory/reports/stock-summary"
          className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-2xs hover:border-blue-400 transition"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-200/80 bg-blue-50 text-blue-700">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Today&apos;s Consumption
            </div>
            <div className="text-[16px] font-black text-slate-900 leading-tight truncate">
              {kpis.consumption}
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[10.5px]">
              <span className="font-bold text-slate-700 truncate">{kpis.portions}</span>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.2 text-[10px] font-bold text-blue-700">
                {kpis.pace}
              </span>
            </div>
          </div>
        </Link>

        {/* Wastage & Spoilage */}
        <Link
          to="/pos/inventory/wastage"
          className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-2xs hover:border-emerald-400 transition"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200/80 bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Wastage & Spoilage
            </div>
            <div className="text-[16px] font-black text-emerald-600 leading-tight truncate">
              {kpis.wastagePct}
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[10.5px]">
              <span className="font-semibold text-slate-600 truncate">{kpis.wastageAmt}</span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700">
                Target &lt; 3.0%
              </span>
            </div>
          </div>
        </Link>

        {/* Stock Health Index */}
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-2xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-200/80 bg-amber-50 text-amber-700">
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Stock Health Index
            </div>
            <div className="text-[16px] font-black text-slate-900 leading-tight truncate">
              {kpis.health}{" "}
              <span className="text-[12px] font-bold text-slate-500">{kpis.healthLabel}</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[10.5px] font-bold">
              <span className="text-rose-600 truncate">{kpis.critical} Crit</span>
              <span className="text-amber-600 truncate">{kpis.low} Low</span>
              <span className="text-emerald-600 truncate">{kpis.healthy} OK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Lower 2-Column Grid */}
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-12 lg:flex-1 lg:min-h-0 items-stretch">
        {/* Col 1: Low Stock Radar */}
        <div className="flex min-h-[300px] lg:min-h-0 flex-col rounded-xl border border-slate-300 bg-white shadow-2xs lg:col-span-6 lg:h-full overflow-hidden">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-rose-500" />
              <h3 className="text-[13.5px] font-bold text-slate-900">Low Stock Radar</h3>
            </div>
            <div className="flex flex-wrap gap-1">
              {radarCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`rounded-md px-2 py-0.5 text-[10.5px] font-bold cursor-pointer transition ${
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
              <div className="flex h-full min-h-[160px] flex-col items-center justify-center p-4 text-center">
                <Package className="mb-1.5 h-6 w-6 text-slate-300" />
                <p className="text-[12.5px] font-bold text-slate-700">No stock alerts</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
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
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50/80 transition"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[12.5px] font-bold text-slate-900">
                          {item.name}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.2 text-[9.5px] font-extrabold uppercase ${
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
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              isCritical ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(8, item.percent))}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-[11px] font-semibold text-slate-600">
                          {item.currentStock}/{item.minThreshold} {item.unit}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-slate-500 truncate">
                        {item.category} · Supplier:{" "}
                        <strong className="font-semibold text-slate-700">{item.supplier}</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickReorder(item)}
                      className="flex shrink-0 items-center gap-1 rounded-md bg-teal-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-teal-700 cursor-pointer"
                    >
                      <ShoppingCart className="h-3 w-3" />
                      Reorder
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Col 2: Daily Closing + Valuation by Category */}
        <div className="flex min-h-[300px] lg:min-h-0 flex-col gap-2 lg:col-span-6 lg:h-full">
          {/* Daily Closing */}
          <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-300 bg-white shadow-2xs overflow-hidden">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-3 py-2">
              <h3 className="text-[13.5px] font-bold text-slate-900">Daily Closing</h3>
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none rounded-md border border-slate-300 bg-white py-0.5 pl-2 pr-6 text-[11px] font-bold text-slate-700 cursor-pointer"
                >
                  <option value="September">Sep 2026</option>
                  <option value="August">Aug 2026</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-1.5 top-1.5 h-3 w-3 text-slate-400" />
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col justify-between gap-1.5 p-2.5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 shrink-0">
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-2">
                  <div className="text-[17px] font-black text-slate-900 leading-tight">
                    {kpis.closingCompliance}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-600">Compliance Rate</div>
                  <div className="mt-0.5 text-[10px] font-bold text-emerald-600">
                    {kpis.closingDays}
                  </div>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50/40 p-2">
                  <div className="text-[17px] font-black text-rose-600 leading-tight">
                    {kpis.missedDaysLabel}
                  </div>
                  <div className="text-[11px] font-semibold text-rose-800">Missed Closings</div>
                  <div className="mt-0.5 text-[10px] font-bold text-rose-600">{kpis.missedDates}</div>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 shrink-0">
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
                      className={`flex h-6.5 items-center justify-center rounded-md text-[11px] cursor-pointer transition ${cell}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Valuation by Category */}
          <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-300 bg-white shadow-2xs overflow-hidden">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-3 py-2">
              <h3 className="text-[13.5px] font-bold text-slate-900">Valuation by Category</h3>
              <span className="text-[11.5px] font-bold text-slate-500">{kpis.categoryTotal}</span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col justify-evenly p-2.5 overflow-y-auto">
              {categories.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-[11.5px] hover:bg-slate-50"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">
                    {item.label}
                  </span>
                  <span className="font-bold text-slate-900">{item.valuation}</span>
                  <span className="w-8 text-right font-mono text-[11px] text-slate-500">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
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
