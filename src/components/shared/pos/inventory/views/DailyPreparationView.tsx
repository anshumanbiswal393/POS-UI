import { useState, useMemo } from "react";
import {
  CookingPot,
  Plus,
  Search,
  Calendar,
  UtensilsCrossed,
  Layers,
  Trash2,
  RefreshCw,
  X,
  ChefHat,
  PackageCheck,
  PackageMinus,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useDailyPreps, useDeleteDailyPrep } from "@/hooks/queries/usePosDailyPrep";
import { useMenuItems } from "@/hooks/queries/usePosMenu";
import { useOutletContext } from "@/context/PosOutletContext";
import { CreateDailyPrepModal } from "../modals/CreateDailyPrepModal";
import { FoodTypeIcon } from "@/components/ui/FoodTypeIcon";
import { PosDataGrid, type DataGridColumn } from "@/components/ui/data-grid";
import type { DailyPreparationRecord } from "@/services/posDailyPrepService";
import { cn } from "@/lib/utils";

export function DailyPreparationView() {
  const { activeOutlet } = useOutletContext();
  const { data: preps = [], isLoading, refetch, isFetching } = useDailyPreps();
  const { data: menuItems = [] } = useMenuItems();
  const deleteMutation = useDeleteDailyPrep();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("today"); // "today" | "all" | specific YYYY-MM-DD

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Filtered entries
  const filteredPreps = useMemo(() => {
    return preps.filter((p) => {
      // Date filter
      if (selectedDateFilter === "today" && p.date !== todayStr) return false;
      if (
        selectedDateFilter !== "today" &&
        selectedDateFilter !== "all" &&
        p.date !== selectedDateFilter
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.menuItemName.toLowerCase().includes(q);
        const matchesCode = p.menuItemCode.toLowerCase().includes(q);
        const matchesCat = (p.category || "").toLowerCase().includes(q);
        const matchesPrep = (p.preparedBy || "").toLowerCase().includes(q);
        const matchesIng = p.ingredients.some((ing) =>
          ing.rawMaterialName.toLowerCase().includes(q),
        );
        if (!matchesName && !matchesCode && !matchesCat && !matchesPrep && !matchesIng) {
          return false;
        }
      }
      return true;
    });
  }, [preps, selectedDateFilter, todayStr, searchQuery]);

  // Daily Statistics (for Today)
  const todayPreps = useMemo(() => {
    return preps.filter((p) => p.date === todayStr);
  }, [preps, todayStr]);

  const totalPlatesToday = useMemo(() => {
    return todayPreps.reduce((sum, p) => sum + Number(p.plates || 0), 0);
  }, [todayPreps]);

  const uniqueDishesToday = useMemo(() => {
    return new Set(todayPreps.map((p) => p.menuItemId)).size;
  }, [todayPreps]);

  const totalIngredientsDeductedToday = useMemo(() => {
    return todayPreps.reduce((sum, p) => sum + (p.ingredients?.length || 0), 0);
  }, [todayPreps]);

  const handleDelete = (record: DailyPreparationRecord) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this batch of ${record.plates} plates for "${record.menuItemName}"?\n\nThis will rollback ${record.plates} plates from POS stock and restore the consumed raw materials.`,
      )
    ) {
      return;
    }

    deleteMutation.mutate(
      { id: record.id, rollbackStock: true },
      {
        onSuccess: () => {
          toast.success(
            `Deleted batch entry for "${record.menuItemName}". Stock and plates rolled back.`,
          );
        },
        onError: () => {
          toast.error("Failed to delete preparation entry");
        },
      },
    );
  };

  const columns: DataGridColumn<DailyPreparationRecord>[] = [
    {
      id: "date",
      header: "Date & Time",
      accessorKey: "date",
      enableSorting: true,
      minWidth: 130,
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-slate-800 text-[12.5px] block">{row.date}</span>
          <span className="text-[11px] text-slate-400 font-mono">{row.time || "Logged"}</span>
        </div>
      ),
    },
    {
      id: "menuItem",
      header: "Food Menu Dish",
      accessorKey: "menuItemName",
      enableSorting: true,
      minWidth: 220,
      cell: ({ row }) => {
        const liveDish = menuItems.find((m) => m.id === row.menuItemId);
        return (
          <div className="flex items-center gap-2.5 py-1">
            <FoodTypeIcon
              type={row.diet === "Non-Veg" ? "non_veg" : "veg"}
              size="sm"
            />
            <div className="min-w-0">
              <span className="font-bold text-[13px] text-slate-900 block truncate">
                {row.menuItemName}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-[10.5px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/60">
                  {row.menuItemCode}
                </span>
                {row.category && (
                  <span className="text-[10.5px] text-slate-500 font-medium">
                    · {row.category}
                  </span>
                )}
                {liveDish && (
                  <span className="text-[10.5px] font-semibold text-teal-700 bg-teal-50 px-1.5 rounded">
                    POS: {liveDish.plates ?? 0} left
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "plates",
      header: "Plates Made",
      accessorKey: "plates",
      enableSorting: true,
      align: "center",
      minWidth: 120,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[12px] font-bold tracking-tight bg-emerald-100 text-emerald-800 border border-emerald-200">
          +{row.plates} Plates
        </span>
      ),
    },
    {
      id: "ingredients",
      header: "Raw Materials Consumed",
      minWidth: 260,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1.5 py-1">
          {row.ingredients && row.ingredients.length > 0 ? (
            row.ingredients.map((ing, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 text-[11px] font-medium"
                title={`${ing.rawMaterialName}: ${ing.quantity} ${ing.unit}`}
              >
                <span className="font-semibold text-slate-800">{ing.rawMaterialName}:</span>
                <span className="font-mono font-bold text-teal-700">
                  {ing.quantity} {ing.unit}
                </span>
              </span>
            ))
          ) : (
            <span className="text-[11.5px] text-slate-400 italic">No raw materials listed</span>
          )}
        </div>
      ),
    },
    {
      id: "notes",
      header: "Prepared By / Notes",
      minWidth: 160,
      cell: ({ row }) => (
        <div className="text-[12px]">
          {row.preparedBy && (
            <span className="font-semibold text-slate-800 block text-[11.5px]">
              {row.preparedBy}
            </span>
          )}
          {row.notes ? (
            <span className="text-slate-500 text-[11px] truncate block max-w-xs" title={row.notes}>
              {row.notes}
            </span>
          ) : (
            <span className="text-slate-400 text-[11px]">—</span>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Action",
      align: "center",
      minWidth: 80,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => handleDelete(row)}
          disabled={deleteMutation.isPending}
          className="h-8 w-8 inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
          title="Delete Batch & Rollback Stock"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs">
            <CookingPot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-serif text-[20px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Daily Kitchen Preparation
              <span className="text-[11px] font-sans font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                Plate & Raw Material Sync
              </span>
            </h1>
            <p className="text-[12px] text-slate-500">
              Record daily dishes prepared with plate yield. Deducts raw materials from inventory and updates waiter POS stock.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              refetch();
              toast.success("Preparation log refreshed");
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            title="Refresh"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-teal-600" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 px-4 py-2 text-[12.5px] font-bold text-white shadow-xs transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Record Daily Prep</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <PackageCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Plates Prepared Today
            </span>
            <span className="text-[19px] font-mono font-extrabold text-slate-900 leading-tight">
              {totalPlatesToday} Plates
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Dishes Prepared Today
            </span>
            <span className="text-[19px] font-mono font-extrabold text-slate-900 leading-tight">
              {uniqueDishesToday} Dishes
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Batches Recorded
            </span>
            <span className="text-[19px] font-mono font-extrabold text-slate-900 leading-tight">
              {todayPreps.length} Batches
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <PackageMinus className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Materials Deducted
            </span>
            <span className="text-[19px] font-mono font-extrabold text-slate-900 leading-tight">
              {totalIngredientsDeductedToday} Items
            </span>
          </div>
        </div>
      </div>

      {/* 3. Search and Date Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish name, SKU code, or raw material..."
            className="h-9 w-full rounded-lg border border-slate-300 bg-slate-50/70 pl-9 pr-8 text-[12.5px] text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-0.5 text-[12px] font-semibold">
            <button
              type="button"
              onClick={() => setSelectedDateFilter("today")}
              className={cn(
                "px-3 py-1 rounded-md transition cursor-pointer",
                selectedDateFilter === "today"
                  ? "bg-white font-bold text-teal-800 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setSelectedDateFilter("all")}
              className={cn(
                "px-3 py-1 rounded-md transition cursor-pointer",
                selectedDateFilter === "all"
                  ? "bg-white font-bold text-teal-800 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              All Records
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={selectedDateFilter !== "today" && selectedDateFilter !== "all" ? selectedDateFilter : ""}
              onChange={(e) => setSelectedDateFilter(e.target.value || "today")}
              className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-[12px] font-medium text-slate-700 focus:border-teal-500 focus:outline-hidden"
              title="Pick specific date"
            />
          </div>
        </div>
      </div>

      {/* 4. Daily Preps PosDataGrid */}
      <PosDataGrid<DailyPreparationRecord>
        data={filteredPreps}
        isLoading={isLoading}
        columns={columns}
        enablePagination={true}
        pageSize={15}
        pageSizeOptions={[15, 30, 50, 100]}
        emptyMessage={`No preparation entries recorded for this date. Click "+ Record Daily Prep" to log cooked batches.`}
      />

      {/* 5. Create Daily Prep Modal */}
      <CreateDailyPrepModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
