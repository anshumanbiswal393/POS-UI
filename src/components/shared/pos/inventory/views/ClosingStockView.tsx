import { useState, useMemo } from "react";
import {
  Search,
  Clock,
  RotateCcw,
  Star,
  CheckCircle2,
  ChevronDown,
  MessageSquare,
  X,
  Check,
  Loader2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useStockItems, useSaveClosingStock } from "@/hooks/queries/usePosInventory";
import {
  DataTableHeader,
  type DataTableColumn,
} from "@/components/common/DataTableHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function ClosingStockView() {
  const { data: stockItems, isLoading: isLoadingStock } = useStockItems();
  const saveMutation = useSaveClosingStock();

  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [updateCycle, setUpdateCycle] = useState("Daily");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local state for stock entry values & notes
  const [newStockInputs, setNewStockInputs] = useState<Record<string, string>>({});
  const [notesInputs, setNotesInputs] = useState<Record<string, string>>({});
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  const closingColumns: DataTableColumn<any>[] = useMemo(
    () => [
      {
        id: "rawMaterial",
        label: "Raw Material",
        sortable: true,
        filterable: true,
        defaultWidth: 200,
        getValue: (r) => r.rawMaterial,
      },
      {
        id: "closingStock",
        label: "Closing Stock",
        sortable: true,
        align: "right",
        defaultWidth: 140,
        getValue: (r) => `${r.closingStock} ${r.unit}`,
      },
      {
        id: "newStock",
        label: "New Stock",
        sortable: false,
        defaultWidth: 160,
      },
      {
        id: "variance",
        label: "Variance",
        sortable: false,
        align: "center",
        defaultWidth: 120,
      },
      {
        id: "actions",
        label: "Actions",
        sortable: false,
        filterable: false,
        align: "right",
        defaultWidth: 100,
      },
    ],
    [],
  );

  const categories = [
    "All categories",
    "No category",
    "Appetizers",
    "Non-Veg Appetizers",
    "Groceries",
    "Dairy",
  ];

  const filteredItems = (stockItems ?? []).filter((item) => {
    if (selectedCategory !== "All categories" && item.category !== selectedCategory) {
      return false;
    }
    if (searchQuery && !item.rawMaterial.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Calculate modified entries with valid numbers
  const modifiedEntries = useMemo(() => {
    if (!stockItems) return [];
    const list: Array<{
      id: string;
      rawMaterial: string;
      unit: string;
      previousStock: number;
      newStock: number;
      variance: number;
      notes?: string;
    }> = [];

    for (const [id, val] of Object.entries(newStockInputs)) {
      if (val === "" || val === undefined) continue;
      const parsed = parseFloat(val);
      if (Number.isNaN(parsed)) continue;
      const item = stockItems.find((s) => s.id === id);
      if (!item) continue;

      list.push({
        id,
        rawMaterial: item.rawMaterial,
        unit: item.unit,
        previousStock: item.closingStock,
        newStock: parsed,
        variance: parsed - item.closingStock,
        notes: notesInputs[id]?.trim() || undefined,
      });
    }
    return list;
  }, [stockItems, newStockInputs, notesInputs]);

  const handleStockChange = (id: string, val: string) => {
    setNewStockInputs((prev) => ({ ...prev, [id]: val }));
  };

  const handleResetRow = (id: string) => {
    setNewStockInputs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setNotesInputs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (activeNoteId === id) setActiveNoteId(null);
    toast.info("Row entry reset");
  };

  const handleClearAll = () => {
    setNewStockInputs({});
    setNotesInputs({});
    setActiveNoteId(null);
    toast.info("All entries cleared");
  };

  const executeSave = async (entriesToSave = modifiedEntries) => {
    if (entriesToSave.length === 0) {
      toast.info("Please enter a new stock count for at least one item first.");
      return;
    }

    setIsSaving(true);
    try {
      const payloadEntries = entriesToSave.map((e) => ({
        id: e.id,
        newStock: e.newStock,
        notes: e.notes,
      }));

      await saveMutation.mutateAsync({
        entries: payloadEntries,
        date: selectedDate,
      });

      // Clear draft entries so closing stock column visibly reflects new updated stock
      setNewStockInputs({});
      setNotesInputs({});
      setActiveNoteId(null);
      setIsReviewOpen(false);

      toast.success(
        `Successfully updated closing stock for ${entriesToSave.length} ${
          entriesToSave.length === 1 ? "item" : "items"
        }`,
      );
    } catch (err: any) {
      console.error("Save closing stock error:", err);
      toast.error(err?.message || "Failed to save closing stock. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickSave = () => {
    executeSave();
  };

  const handleReview = () => {
    if (modifiedEntries.length === 0) {
      toast.info("Please enter a new stock count for at least one item before reviewing.");
      return;
    }
    setIsReviewOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-[18px] font-bold text-slate-900 tracking-tight">
            Daily Stock Count
          </h2>
          <p className="text-[12px] text-slate-500">
            Record physical stock counts and update closing balances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
          />

          <button
            type="button"
            onClick={() => toast.info("Stock count history log")}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            History <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5 text-slate-500" />
            Reset
          </button>
        </div>
      </div>

      {/* 2. Search & Cycle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search raw material or barcode"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 text-[12.5px] text-slate-600">
            <span>Stock update cycle:</span>
            <select
              value={updateCycle}
              onChange={(e) => setUpdateCycle(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => toast.info("Filter by starred items")}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Star className="h-3.5 w-3.5 text-amber-500" />
            Favourites
          </button>

          <button
            type="button"
            onClick={() => toast.info("Showing items entered today")}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Entered Today
          </button>
        </div>
      </div>

      {/* 3. Two-Column Layout (Left Categories Rail + Right Table) */}
      <div className="flex flex-col md:flex-row items-start gap-4">
        {/* Left Categories Box */}
        <div className="w-full md:w-56 shrink-0 rounded-xl border border-slate-200 bg-white shadow-xs p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-[12px] font-bold text-slate-700 uppercase tracking-wider">
            <span>CATEGORIES</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </div>

          <div className="space-y-1">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[12.5px] font-medium transition cursor-pointer text-left ${
                    isSelected
                      ? "bg-teal-50 text-teal-700 font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  {isSelected && (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-white">
                      <Check className="h-2.5 w-2.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Data Table */}
        <div className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <DataTableHeader
                columns={closingColumns}
                data={filteredItems}
                themeVariant="primary"
              />
              <tbody className="divide-y divide-slate-100">
                {isLoadingStock ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-teal-600 mb-2" />
                      Loading inventory items...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No inventory items found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const enteredVal = newStockInputs[item.id] ?? "";
                    const parsedNewStock = enteredVal !== "" ? parseFloat(enteredVal) : null;
                    const variance =
                      parsedNewStock !== null && !Number.isNaN(parsedNewStock)
                        ? parsedNewStock - item.closingStock
                        : null;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {item.rawMaterial}
                        </td>

                        <td className="px-4 py-3 text-slate-600 font-mono text-[12.5px]">
                          {item.closingStock} {item.unit}
                        </td>

                        {/* New Stock Input */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 max-w-[150px]">
                            <input
                              type="number"
                              step="any"
                              value={enteredVal}
                              onChange={(e) => handleStockChange(item.id, e.target.value)}
                              placeholder="0"
                              className="w-20 rounded-lg border border-slate-300 px-2.5 py-1 text-[13px] font-mono text-slate-900 focus:border-teal-500 focus:outline-none"
                            />
                            <span className="text-[12px] text-slate-500">/ {item.unit}</span>
                          </div>
                        </td>

                        {/* Live Variance */}
                        <td className="px-4 py-3 font-mono text-[12.5px] text-center">
                          {variance !== null ? (
                            <span
                              className={
                                variance === 0
                                  ? "text-slate-500"
                                  : variance > 0
                                    ? "text-emerald-600 font-bold"
                                    : "text-red-600 font-bold"
                              }
                            >
                              {variance > 0 ? `+${variance}` : variance} {item.unit}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Comment & Reset Icons */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 text-slate-400">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveNoteId(activeNoteId === item.id ? null : item.id)
                              }
                              className={`p-1.5 rounded transition cursor-pointer ${
                                notesInputs[item.id]
                                  ? "text-teal-600 bg-teal-50"
                                  : "hover:text-slate-700 hover:bg-slate-100"
                              }`}
                              title="Add variance reason / remark"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResetRow(item.id)}
                              className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="Reset entry"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {activeNoteId === item.id && (
                            <div className="mt-2 text-left">
                              <input
                                type="text"
                                placeholder="Reason for variance..."
                                value={notesInputs[item.id] || ""}
                                onChange={(e) =>
                                  setNotesInputs({ ...notesInputs, [item.id]: e.target.value })
                                }
                                className="w-full rounded border border-slate-300 px-2 py-1 text-[11px] focus:outline-none focus:border-teal-500"
                                autoFocus
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Action Bar */}
          <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[13px] font-medium text-slate-600 hover:text-slate-900 cursor-pointer underline"
              >
                Clear All Entries
              </button>
              {modifiedEntries.length > 0 && (
                <span className="text-[12px] font-medium text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                  {modifiedEntries.length} {modifiedEntries.length === 1 ? "entry" : "entries"} ready to save
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleQuickSave}
                disabled={isSaving || modifiedEntries.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Quick Save"
                )}
              </button>
              <button
                type="button"
                onClick={handleReview}
                disabled={isSaving || modifiedEntries.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-5 py-1.5 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Review <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-serif font-bold text-slate-900">
              Review Daily Stock Count
            </DialogTitle>
            <DialogDescription className="text-[13px] text-slate-500">
              Verify your physical stock counts for{" "}
              <span className="font-semibold text-slate-700">{selectedDate}</span> before updating inventory.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 space-y-4">
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-[12.5px]">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Raw Material</th>
                    <th className="px-3 py-2.5 text-right">Previous Stock</th>
                    <th className="px-3 py-2.5 text-right">New Count</th>
                    <th className="px-3 py-2.5 text-center">Variance</th>
                    <th className="px-3 py-2.5">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modifiedEntries.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2.5 font-semibold text-slate-800">
                        {row.rawMaterial}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-600 font-mono">
                        {row.previousStock} {row.unit}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900 font-mono">
                        {row.newStock} {row.unit}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            row.variance === 0
                              ? "bg-slate-100 text-slate-600"
                              : row.variance > 0
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                          }`}
                        >
                          {row.variance > 0 ? `+${row.variance}` : row.variance} {row.unit}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 italic text-[11.5px]">
                        {row.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg bg-amber-50/60 border border-amber-200 p-3 text-[12px] text-amber-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                Updating closing stock will adjust quantity on hand and post inventory variances to the stock ledger for{" "}
                <span className="font-semibold">{selectedDate}</span>.
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsReviewOpen(false)}
              disabled={isSaving}
              className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              Back to Edit
            </button>
            <button
              type="button"
              onClick={() => executeSave()}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-5 py-1.5 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Confirm & Update Stock"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
