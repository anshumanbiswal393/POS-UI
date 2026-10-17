import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  ChefHat,
  AlertTriangle,
  X,
  FileText,
  Download,
  Filter,
  ArrowRight,
  TrendingUp,
  Layers,
  UtensilsCrossed,
  Printer,
  Eye,
  Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel } from "@/utils/exportUtils";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import {
  DataTableHeader,
  DataTableFooter,
  type DataTableColumn,
} from "@/components/common/DataTableHeader";
import { useNavigate } from "@tanstack/react-router";
import {
  posProductionService,
  type ProductionBatchDto,
  type ProductionRecipeDto,
  type AvailableRawMaterial,
} from "@/services/posProductionService";

export function ProductionExecutionView() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<ProductionBatchDto[]>([]);
  const [recipes, setRecipes] = useState<ProductionRecipeDto[]>([]);
  const [rawMaterials, setRawMaterials] = useState<AvailableRawMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Table sorting & pagination
  const [sortConfig, setSortConfig] = useState<{ colId: string; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isPrepareModalOpen, setIsPrepareModalOpen] = useState(false);
  const [selectedBatchDetails, setSelectedBatchDetails] = useState<ProductionBatchDto | null>(null);

  // New Batch Form state
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [targetYield, setTargetYield] = useState("");
  const [yieldUnit, setYieldUnit] = useState("");
  const [operator, setOperator] = useState("Chef Vikram");
  const [batchStatus, setBatchStatus] = useState<"COMPLETED" | "IN_PROGRESS">("COMPLETED");
  const [batchNotes, setBatchNotes] = useState("");
  const [customIngredients, setCustomIngredients] = useState<
    Array<{
      stockItemId: string;
      stockItemName: string;
      stockItemCode: string;
      standardQuantity: number;
      actualQuantity: number;
      unit: string;
      unitCost: number;
      stockOnHand: number;
    }>
  >([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedBatches, fetchedRecipes] = await Promise.all([
        posProductionService.fetchBatches(),
        posProductionService.fetchRecipes(),
      ]);
      setBatches(fetchedBatches);
      setRecipes(fetchedRecipes);
      const rawMats = posProductionService.getAvailableRawMaterials();
      setRawMaterials(rawMats);

      if (fetchedRecipes.length > 0) {
        setSelectedRecipeId(fetchedRecipes[0].id);
      }
    } catch {
      toast.error("Failed to load production batches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update ingredients whenever selected recipe or target yield changes
  useEffect(() => {
    if (!selectedRecipeId || recipes.length === 0) return;
    const recipe = recipes.find((r) => r.id === selectedRecipeId) || recipes[0];
    const stdYield = recipe.expectedYield || 1;
    const curYield = parseFloat(targetYield) || stdYield;
    const ratio = curYield / stdYield;

    setYieldUnit(recipe.outputUnit);
    if (!targetYield) {
      setTargetYield(String(stdYield));
    }

    const rawMap = new Map(rawMaterials.map((rm) => [rm.id, rm.quantityOnHand]));

    const computed = recipe.ingredients.map((ing) => {
      const scaled = Math.round(ing.quantity * ratio * 1000) / 1000;
      const onHand = rawMap.get(ing.stockItemId) ?? 50.0;
      return {
        stockItemId: ing.stockItemId,
        stockItemName: ing.stockItemName,
        stockItemCode: ing.stockItemCode,
        standardQuantity: scaled,
        actualQuantity: scaled,
        unit: ing.unit,
        unitCost: ing.unitCost,
        stockOnHand: onHand,
      };
    });
    setCustomIngredients(computed);
  }, [selectedRecipeId, targetYield, recipes, rawMaterials]);

  const handleOpenPrepareModal = () => {
    if (recipes.length > 0) {
      const first = recipes[0];
      setSelectedRecipeId(first.id);
      setTargetYield(String(first.expectedYield));
      setYieldUnit(first.outputUnit);
    }
    setOperator("Chef Vikram");
    setBatchStatus("COMPLETED");
    setBatchNotes("");
    setIsPrepareModalOpen(true);
  };

  const handleActualQtyChange = (idx: number, val: string) => {
    const num = parseFloat(val) || 0;
    setCustomIngredients((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], actualQuantity: num };
      return next;
    });
  };

  const batchCalculations = useMemo(() => {
    let total = 0;
    customIngredients.forEach((ing) => {
      total += ing.actualQuantity * ing.unitCost;
    });
    const yieldNum = parseFloat(targetYield) || 1;
    const unitCost = yieldNum > 0 ? total / yieldNum : 0;
    return {
      total: Math.round(total * 100) / 100,
      unitCost: Math.round(unitCost * 100) / 100,
    };
  }, [customIngredients, targetYield]);

  const handleExecuteBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const yieldNum = parseFloat(targetYield);
    if (!yieldNum || yieldNum <= 0) {
      toast.error("Please provide a valid preparation yield.");
      return;
    }

    try {
      const payload = {
        recipeId: selectedRecipeId,
        yieldQuantity: yieldNum,
        yieldUnit: yieldUnit || "L",
        operator: operator.trim() || "Chef",
        status: batchStatus,
        notes: batchNotes.trim(),
        ingredients: customIngredients.map((ing) => ({
          stockItemId: ing.stockItemId,
          actualQuantity: ing.actualQuantity,
        })),
      };

      const created = await posProductionService.createBatch(payload);
      setBatches((prev) => [created, ...prev]);
      setIsPrepareModalOpen(false);

      if (created.status === "COMPLETED") {
        toast.success(
          `Batch ${created.batchNumber} logged! Component raw materials deducted from inventory.`,
        );
      } else {
        toast.info(`Batch ${created.batchNumber} marked In Progress.`);
      }
    } catch {
      toast.error("Failed to log preparation batch.");
    }
  };

  const handleMarkBatchCompleted = async (batch: ProductionBatchDto) => {
    try {
      const updated = await posProductionService.updateBatchStatus(batch.id, "COMPLETED");
      if (updated) {
        setBatches((prev) => prev.map((b) => (b.id === batch.id ? updated : b)));
        toast.success(`Batch ${batch.batchNumber} completed and raw materials stock deducted!`);
      }
    } catch {
      toast.error("Failed to update batch status.");
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = batches.length;
    const completed = batches.filter((b) => b.status === "COMPLETED").length;
    const inProgress = batches.filter((b) => b.status === "IN_PROGRESS").length;
    const totalValue = batches
      .filter((b) => b.status === "COMPLETED")
      .reduce((sum, b) => sum + b.totalCost, 0);
    return { total, completed, inProgress, totalValue };
  }, [batches]);

  const filtered = useMemo(() => {
    return batches.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          b.batchNumber.toLowerCase().includes(q) ||
          b.recipeName.toLowerCase().includes(q) ||
          b.operator.toLowerCase().includes(q) ||
          b.rawMaterialsDeducted.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [batches, statusFilter, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const batchColumns = useMemo<DataTableColumn<ProductionBatchDto>[]>(
    () => [
      {
        id: "batchNumber",
        label: "Batch Number",
        sortable: true,
        filterable: true,
        defaultWidth: 160,
        getValue: (b) => b.batchNumber,
      },
      {
        id: "preparationDate",
        label: "Prep Date",
        sortable: true,
        defaultWidth: 120,
        getValue: (b) => b.preparationDate,
      },
      {
        id: "recipeName",
        label: "Prepared Item",
        sortable: true,
        filterable: true,
        defaultWidth: 200,
        getValue: (b) => b.recipeName,
      },
      {
        id: "batchQty",
        label: "Output Yield",
        sortable: true,
        align: "right",
        defaultWidth: 140,
        getValue: (b) => b.batchQty,
      },
      {
        id: "rawMaterialsDeducted",
        label: "Raw Materials Consumed",
        filterable: true,
        defaultWidth: 240,
        getValue: (b) => b.rawMaterialsDeducted,
      },
      {
        id: "totalCost",
        label: "Batch Cost (₹)",
        sortable: true,
        align: "right",
        defaultWidth: 140,
        getValue: (b) => `₹ ${b.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        getSortValue: (b) => b.totalCost,
      },
      {
        id: "unitCost",
        label: "Unit Cost (₹)",
        sortable: true,
        align: "right",
        defaultWidth: 130,
        getValue: (b) => `₹ ${b.unitCost.toFixed(2)}`,
        getSortValue: (b) => b.unitCost,
      },
      {
        id: "operator",
        label: "Chef In-Charge",
        sortable: true,
        filterable: true,
        defaultWidth: 150,
        getValue: (b) => b.operator,
      },
      {
        id: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        align: "center",
        defaultWidth: 130,
        getValue: (b) => b.status,
      },
      {
        id: "actions",
        label: "Actions",
        align: "right",
        defaultWidth: 130,
      },
    ],
    [],
  );

  const sortedBatches = useMemo(() => {
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      let aVal: any = a[sortConfig.colId as keyof ProductionBatchDto];
      let bVal: any = b[sortConfig.colId as keyof ProductionBatchDto];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal || "").toString().toLowerCase();
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedBatches.length / pageSize));
  const paginatedBatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedBatches.slice(start, start + pageSize);
  }, [sortedBatches, currentPage, pageSize]);

  const handleExportExcel = () => {
    const headers = [
      "Batch Number",
      "Date",
      "Prepared Item",
      "Output Yield",
      "Chef / Operator",
      "Status",
      "Total Cost (₹)",
      "Unit Cost (₹)",
      "Stock Deducted",
    ];
    const rows = filtered.map((b) => [
      b.batchNumber,
      b.preparationDate,
      b.recipeName,
      b.batchQty,
      b.operator,
      b.status,
      b.totalCost,
      b.unitCost,
      b.isStockDeducted ? "Yes" : "No",
    ]);

    exportToExcel({
      filename: `Production_Batches_${new Date().toISOString().slice(0, 10)}`,
      title: "Kitchen Preparation — Batch Production History",
      subtitle: `Total Batches: ${filtered.length}`,
      columns: headers,
      rows,
    });
    toast.success("Batch history exported to Excel (.xlsx)");
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Prepare Items</h2>
            <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700">
              Kitchen Production
            </span>
          </div>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Log and track daily food preparation batches. Converting raw materials automatically
            deducts component stocks and adds finished goods.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <ExportToExcelButton
            onClick={handleExportExcel}
            className="h-9 px-4 rounded-xl text-[12.5px]"
          />

          <button
            type="button"
            onClick={() => navigate({ to: "/pos/inventory/production" })}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12.5px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <Layers className="h-4 w-4 text-slate-500" />
            Preparation Setup
          </button>

          <button
            type="button"
            onClick={handleOpenPrepareModal}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm hover:bg-teal-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Prepare New Batch
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500">Total Batches Logged</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <ChefHat className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.total}</span>
            <span className="text-[11.5px] text-teal-600 font-medium">Production Runs</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500">Completed & Stocked</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.completed}</span>
            <span className="text-[11.5px] text-emerald-600 font-medium">Ready For Service</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500">In Progress / Proofing</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.inProgress}</span>
            <span className="text-[11.5px] text-amber-600 font-medium">Under Prep</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500">Total Preparation Value</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">₹ {metrics.totalValue.toLocaleString()}</span>
            <span className="text-[11.5px] text-slate-500 font-normal">Ingredients Value</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search batches by number, recipe name, or chef..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2 text-[13px] text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "ALL", label: "All Batches" },
              { id: "COMPLETED", label: "Completed" },
              { id: "IN_PROGRESS", label: "In Progress" },
              { id: "DISCARDED", label: "Discarded" },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`rounded-xl px-3 py-1.5 text-[12px] font-medium transition cursor-pointer whitespace-nowrap ${
                    active
                      ? "bg-teal-600 text-white shadow-2xs"
                      : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Batch Runs Table with DataTableHeader & DataTableFooter */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <DataTableHeader
              columns={batchColumns}
              data={sortedBatches}
              sortConfig={sortConfig}
              onSortChange={setSortConfig}
              themeVariant="primary"
            />
            <tbody className="divide-y divide-slate-100">
              {paginatedBatches.length === 0 ? (
                <tr>
                  <td colSpan={batchColumns.length} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-slate-400">
                      <ChefHat className="h-10 w-10 text-slate-300 mb-2 stroke-[1.5]" />
                      <p className="text-[14px] font-semibold text-slate-700">No preparation batches found</p>
                      <p className="text-[12px] text-slate-400 mt-0.5">
                        {search ? "No batches matching your search query." : "Log your first preparation batch run."}
                      </p>
                      {!search && (
                        <button
                          type="button"
                          onClick={handleOpenPrepareModal}
                          className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-1.5 text-[12px] font-medium text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Prepare Batch
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3.5 font-mono text-[12px] font-bold text-teal-700 whitespace-nowrap">
                      {b.batchNumber}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-[12.5px] whitespace-nowrap">
                      {b.preparationDate}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      {b.recipeName}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {b.batchQty}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-[12px] max-w-xs truncate" title={b.rawMaterialsDeducted}>
                      {b.rawMaterialsDeducted}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                      ₹ {b.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-[12.5px] text-slate-600 whitespace-nowrap">
                      ₹ {b.unitCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">
                      <span className="font-medium">{b.operator}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {b.status === "COMPLETED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </span>
                      ) : b.status === "IN_PROGRESS" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                          <Clock className="h-3 w-3" />
                          In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
                          Discarded
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status === "IN_PROGRESS" && (
                          <button
                            type="button"
                            onClick={() => handleMarkBatchCompleted(b)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11.5px] font-semibold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Finish
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedBatchDetails(b)}
                          title="View Batch Details & Deduction Log"
                          className="flex items-center gap-1 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Pagination */}
        <DataTableFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={sortedBatches.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          itemName="batches"
        />
      </div>

      {/* 5. "Prepare New Batch" Execution Modal */}
      {isPrepareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800 font-bold">
                  <ChefHat className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900">Prepare New Kitchen Batch</h3>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    Select a recipe formula, specify output quantity, and deduct raw materials from inventory.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrepareModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleExecuteBatch} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Recipe Picker & Batch Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[12px] font-semibold text-slate-700">
                    Select Preparation Recipe <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedRecipeId}
                    onChange={(e) => setSelectedRecipeId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-800 focus:border-teal-500 focus:outline-none"
                  >
                    {recipes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code}) — Standard Yield: {r.expectedYield} {r.outputUnit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-700">Chef / Operator</label>
                  <input
                    type="text"
                    required
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    placeholder="e.g. Chef Vikram"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-700">
                    Target Yield to Prepare <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      value={targetYield}
                      onChange={(e) => setTargetYield(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] font-mono font-bold text-slate-900 focus:border-teal-500 focus:outline-none"
                    />
                    <span className="flex items-center rounded-xl bg-slate-100 px-3 text-[12.5px] font-semibold text-slate-700 whitespace-nowrap">
                      {yieldUnit || "Units"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-700">Batch Status</label>
                  <select
                    value={batchStatus}
                    onChange={(e) => setBatchStatus(e.target.value as "COMPLETED" | "IN_PROGRESS")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-800 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="COMPLETED">Completed (Immediate Stock Deduction)</option>
                    <option value="IN_PROGRESS">In Progress (Proofing / Fermenting)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-700">Preparation Date</label>
                  <input
                    type="text"
                    disabled
                    value={new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Dynamic Raw Materials Consumption & Stock Verification */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[13.5px] font-bold text-slate-900">
                      Raw Materials Stock Verification & Actual Consumption
                    </h4>
                    <p className="text-[11.5px] text-slate-500">
                      Quantities are automatically scaled to your target yield. You can adjust actual consumed quantities if required.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-[12.5px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11.5px]">
                      <tr>
                        <th className="px-3.5 py-2.5">Raw Material</th>
                        <th className="px-3 py-2.5 text-right">Available Stock</th>
                        <th className="px-3 py-2.5 text-right">Standard Req.</th>
                        <th className="px-3.5 py-2.5 w-32 text-right">Actual Consumed</th>
                        <th className="px-3 py-2.5 text-right">Rate</th>
                        <th className="px-3.5 py-2.5 text-right">Total</th>
                        <th className="px-3 py-2.5 text-center">Stock Check</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {customIngredients.map((ing, idx) => {
                        const hasEnough = ing.stockOnHand >= ing.actualQuantity;
                        const lineTotal = ing.actualQuantity * ing.unitCost;
                        return (
                          <tr key={ing.stockItemId} className="hover:bg-slate-50/50">
                            <td className="px-3.5 py-2 font-medium text-slate-800">
                              {ing.stockItemName}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-slate-600">
                              {ing.stockOnHand} {ing.unit}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-slate-500">
                              {ing.standardQuantity} {ing.unit}
                            </td>
                            <td className="px-3 py-1.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={ing.actualQuantity}
                                  onChange={(e) => handleActualQtyChange(idx, e.target.value)}
                                  className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-right font-mono text-[12.5px] font-semibold text-slate-900 focus:border-teal-500 focus:outline-none"
                                />
                                <span className="text-[11px] text-slate-400 w-6">{ing.unit}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right text-slate-500">
                              ₹ {ing.unitCost}
                            </td>
                            <td className="px-3.5 py-2 text-right font-mono font-semibold text-slate-900">
                              ₹ {lineTotal.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {hasEnough ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700">
                                  <CheckCircle2 className="h-3 w-3" />
                                  OK
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-medium text-amber-700" title="Available stock is lower than required">
                                  <AlertTriangle className="h-3 w-3" />
                                  Low
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Real-time Costing Box */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-teal-200 bg-teal-50/60 p-3.5">
                  <div className="space-y-0.5">
                    <span className="text-[12px] font-semibold text-teal-900">
                      Estimated Batch Costing
                    </span>
                    <p className="text-[11.5px] text-teal-700">
                      Preparing {targetYield || 1} {yieldUnit || "Units"}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-[11px] text-teal-800 uppercase tracking-wide">Total Material Cost</span>
                      <p className="text-[18px] font-bold font-mono text-teal-950">
                        ₹ {batchCalculations.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="h-8 w-px bg-teal-200" />
                    <div>
                      <span className="text-[11px] text-teal-800 uppercase tracking-wide">Cost per Unit Output</span>
                      <p className="text-[18px] font-bold font-mono text-teal-950">
                        ₹ {batchCalculations.unitCost.toFixed(2)} / {yieldUnit?.split(" ")[0] || "Unit"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-slate-700">Batch Remarks / Quality Observations</label>
                <input
                  type="text"
                  placeholder="e.g. Color and taste approved by Chef Vikram, stored in walk-in section B..."
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[13px] text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPrepareModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 px-5 py-2 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
                >
                  Confirm & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Batch Details & Stock Deduction Modal */}
      {selectedBatchDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800 font-bold">
                  <ChefHat className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900">
                    Batch Details · {selectedBatchDetails.batchNumber}
                  </h3>
                  <p className="text-[12px] text-slate-500">
                    {selectedBatchDetails.recipeName} · Prepared on {selectedBatchDetails.preparationDate}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBatchDetails(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Stats overview */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">Batch Yield</span>
                  <p className="text-[15px] font-bold text-slate-900 mt-0.5">
                    {selectedBatchDetails.batchQty}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">Total Consumed Cost</span>
                  <p className="text-[15px] font-bold font-mono text-slate-900 mt-0.5">
                    ₹ {selectedBatchDetails.totalCost.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">Unit Production Cost</span>
                  <p className="text-[15px] font-bold font-mono text-teal-700 mt-0.5">
                    ₹ {selectedBatchDetails.unitCost.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Status and Stock Movement audit */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                <div className="space-y-0.5">
                  <span className="text-[11.5px] font-semibold text-slate-600">Stock Ledger Movement</span>
                  <p className="text-[12px] text-slate-800">
                    {selectedBatchDetails.isStockDeducted
                      ? "Component raw materials deducted from inventory (Stock OUT: PRODUCTION_BATCH)."
                      : "Stock deduction pending completion."}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                    selectedBatchDetails.isStockDeducted
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {selectedBatchDetails.isStockDeducted ? "Deducted: Yes" : "Deduction: Pending"}
                </span>
              </div>

              {/* Deducted raw materials breakdown table */}
              <div className="space-y-2">
                <h4 className="text-[13px] font-bold text-slate-800">Raw Materials Consumed</h4>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-[12.5px]">
                    <thead className="bg-slate-50 text-slate-600 text-[11.5px] font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-2">Item</th>
                        <th className="px-3 py-2 text-right">Standard Qty</th>
                        <th className="px-3 py-2 text-right">Actual Used</th>
                        <th className="px-3 py-2 text-right">Unit Rate</th>
                        <th className="px-3.5 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedBatchDetails.ingredients.map((ing) => (
                        <tr key={ing.id} className="hover:bg-slate-50/50">
                          <td className="px-3.5 py-2 font-medium text-slate-800">{ing.stockItemName}</td>
                          <td className="px-3 py-2 text-right text-slate-500">{ing.standardQuantity} {ing.unit}</td>
                          <td className="px-3 py-2 text-right font-medium text-slate-800">{ing.actualQuantity} {ing.unit}</td>
                          <td className="px-3 py-2 text-right text-slate-500">₹ {ing.unitCost}</td>
                          <td className="px-3.5 py-2 text-right font-mono font-semibold text-slate-900">
                            ₹ {ing.totalCost.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedBatchDetails.notes && (
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-slate-800">Chef Remarks</h4>
                  <p className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-[12.5px] text-slate-700">
                    {selectedBatchDetails.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 bg-slate-50/50">
              <span className="text-[11.5px] text-slate-500">
                In-Charge: <strong className="text-slate-800">{selectedBatchDetails.operator}</strong>
                {selectedBatchDetails.expiryDate && ` · Expiry: ${selectedBatchDetails.expiryDate}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toast.success(`Printing preparation slip for batch ${selectedBatchDetails.batchNumber}...`)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-100"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500" />
                  Print Slip
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBatchDetails(null)}
                  className="rounded-xl bg-slate-900 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
