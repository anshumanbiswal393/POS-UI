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
import { useStockItems } from "@/hooks/queries/usePosInventory";
import { CreatePurchaseModal } from "@/components/shared/pos/inventory/modals/CreatePurchaseModal";

type StockLocation = "all" | "kitchen" | "bar" | "cold_storage";

interface LiveStockMovement {
  id: string;
  type: "sale" | "purchase" | "transfer" | "wastage";
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

const LOW_STOCK: LowStockRadarItem[] = [
  {
    id: "ls-1",
    name: "Chicken Breast Boneless",
    category: "Meat",
    currentStock: 1.4,
    minThreshold: 8,
    unit: "Kg",
    daysRemaining: 1,
    percent: 17,
    supplier: "Supreme Poultry",
    status: "critical",
  },
  {
    id: "ls-2",
    name: "Amul Butter Salted",
    category: "Dairy",
    currentStock: 3,
    minThreshold: 12,
    unit: "Pkt",
    daysRemaining: 2,
    percent: 25,
    supplier: "Royal Dairy",
    status: "critical",
  },
  {
    id: "ls-3",
    name: "7 Up (330ml)",
    category: "Beverages",
    currentStock: 6,
    minThreshold: 24,
    unit: "Cans",
    daysRemaining: 4,
    percent: 25,
    supplier: "Classic Spirits",
    status: "low",
  },
  {
    id: "ls-4",
    name: "Sprite (330ml)",
    category: "Beverages",
    currentStock: 8,
    minThreshold: 24,
    unit: "Cans",
    daysRemaining: 5,
    percent: 33,
    supplier: "Classic Spirits",
    status: "low",
  },
  {
    id: "ls-5",
    name: "Paneer Fresh Malai",
    category: "Dairy",
    currentStock: 2.5,
    minThreshold: 6,
    unit: "Kg",
    daysRemaining: 2,
    percent: 41,
    supplier: "Royal Dairy",
    status: "low",
  },
  {
    id: "ls-6",
    name: "Garlic (Peeled)",
    category: "Groceries",
    currentStock: 3.2,
    minThreshold: 5,
    unit: "Kg",
    daysRemaining: 6,
    percent: 64,
    supplier: "Fresh Farm",
    status: "optimal",
  },
];

const CATEGORIES = [
  { label: "Groceries", percentage: 40, valuation: "₹1.14L", color: "#38bdf8" },
  { label: "Dairy", percentage: 24, valuation: "₹68k", color: "#facc15" },
  { label: "Beverages", percentage: 18, valuation: "₹51k", color: "#34d399" },
  { label: "Meat & Apps", percentage: 12, valuation: "₹34k", color: "#fb923c" },
  { label: "Others", percentage: 6, valuation: "₹17k", color: "#c084fc" },
];

const INITIAL_MOVEMENTS: LiveStockMovement[] = [
  {
    id: "mov-1",
    type: "sale",
    item: "Paneer Chilli Dry",
    qty: "-2",
    location: "Kitchen",
    time: "Just now",
    amount: "₹520",
    deltaType: "decrease",
  },
  {
    id: "mov-2",
    type: "sale",
    item: "Sprite 330ml",
    qty: "-1",
    location: "Bar",
    time: "2m",
    amount: "₹60",
    deltaType: "decrease",
  },
  {
    id: "mov-3",
    type: "purchase",
    item: "Basmati Rice",
    qty: "+50kg",
    location: "Dry Store",
    time: "14m",
    amount: "₹4.2k",
    deltaType: "increase",
  },
  {
    id: "mov-4",
    type: "transfer",
    item: "Cooking Oil",
    qty: "5L",
    location: "Store→Kitchen",
    time: "26m",
    deltaType: "neutral",
  },
  {
    id: "mov-5",
    type: "wastage",
    item: "Tomatoes",
    qty: "-0.8kg",
    location: "Cold Store",
    time: "42m",
    amount: "₹35",
    deltaType: "decrease",
  },
];

export function InventoryDashboardView() {
  const navigate = useNavigate();
  const { refetch: refetchStock } = useStockItems();

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<StockLocation>("all");
  const [selectedMonth, setSelectedMonth] = useState("September");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  const [lastSyncedTime, setLastSyncedTime] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveBannerDismissed, setLiveBannerDismissed] = useState(false);
  const [movements] = useState<LiveStockMovement[]>(INITIAL_MOVEMENTS);

  const currentDay = 26;
  const missedDays = [4, 18];
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);
  const completedDays = Array.from({ length: 25 }, (_, i) => i + 1).filter(
    (d) => !missedDays.includes(d) && d < currentDay,
  );

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
    const n = LOW_STOCK.filter((i) => i.status === "critical").length;
    toast.success(`Batch reorder created for ${n} critical items`);
  };

  const filteredRadar = useMemo(() => {
    return LOW_STOCK.filter(
      (item) =>
        selectedCategoryFilter === "All" || item.category === selectedCategoryFilter,
    );
  }, [selectedCategoryFilter]);

  const locations: { id: StockLocation; label: string }[] = [
    { id: "all", label: "All" },
    { id: "kitchen", label: "Kitchen" },
    { id: "bar", label: "Bar" },
    { id: "cold_storage", label: "Cold" },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Toolbar */}
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

      {/* Alert */}
      {!liveBannerDismissed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-2.5 text-[12.5px] text-amber-950">
          <div className="flex min-w-0 items-center gap-2.5">
            <Flame className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              <strong className="font-bold">2 critical items</strong> — Chicken Breast 1.4 kg and
              Amul Butter 3 packets below safe buffer.
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

      {/* KPI row */}
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
                ₹ 2,84,500
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-200/80 bg-teal-50 text-teal-700">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[12px]">
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
              <ArrowUpRight className="h-3.5 w-3.5" /> +3.4% this week
            </span>
            <span className="font-semibold text-slate-500">142 SKUs Active</span>
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
                ₹ 19,840
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200/80 bg-blue-50 text-blue-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[12px]">
            <span className="font-bold text-slate-700">184 Portions Served</span>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
              Normal Pace
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
                1.8%
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[12px]">
            <span className="font-semibold text-slate-600">₹ 1,420 logged today</span>
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
                92%{" "}
                <span className="text-[14px] font-bold text-slate-500">Optimal</span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200/80 bg-amber-50 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[12px] font-bold">
            <span className="text-rose-600">2 Critical</span>
            <span className="text-amber-600">3 Low Stock</span>
            <span className="text-emerald-600">137 Healthy</span>
          </div>
        </div>
      </div>

      {/* Main panels — equal-height columns, same bottom edge */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch lg:min-h-[560px]">
        {/* Low stock */}
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
            {filteredRadar.map((item) => {
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
            })}
          </div>
        </div>

        {/* Closing + category — stacked to same column height */}
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
                  <div className="text-[24px] font-black text-slate-900">86%</div>
                  <div className="text-[12px] font-semibold text-slate-600">Compliance Rate</div>
                  <div className="mt-1 text-[11px] font-bold text-emerald-600">23 of 25 Days Closed</div>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3.5">
                  <div className="text-[24px] font-black text-rose-600">2 Days</div>
                  <div className="text-[12px] font-semibold text-rose-800">Missed Closings</div>
                  <div className="mt-1 text-[11px] font-bold text-rose-600">Sep 4, Sep 18</div>
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
              <span className="text-[12px] font-bold text-slate-500">₹ 2.84L</span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col justify-evenly">
              {CATEGORIES.map((item) => (
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

        {/* Movement feed */}
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
            {movements.map((mov) => {
              const badge =
                mov.type === "purchase"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : mov.type === "transfer"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
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
                        <div className="text-[11.5px] font-medium text-slate-400">{mov.amount}</div>
                      )}
                      <div className="text-[11px] text-slate-400">{mov.time}</div>
                    </div>
                  </div>
                </div>
              );
            })}
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
