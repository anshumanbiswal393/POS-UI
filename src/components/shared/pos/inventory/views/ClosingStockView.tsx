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
  Upload,
  Download,
  BookOpen,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import { useStockItems, useSaveClosingStock } from "@/hooks/queries/usePosInventory";
import {
  DataTableHeader,
  type DataTableColumn,
} from "@/components/common/DataTableHeader";
import { toast } from "sonner";

export function ClosingStockView() {
  const { data: stockItems } = useStockItems();
  const saveMutation = useSaveClosingStock();

  const [activeTab, setActiveTab] = useState<"add_closing" | "import_excel">("add_closing");
  const [selectedDate, setSelectedDate] = useState("2026-09-01");
  const [updateCycle, setUpdateCycle] = useState("Daily");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All categories");

  // Excel import state matching AvailableStockView
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

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

  // Local state for stock entry values
  const [newStockInputs, setNewStockInputs] = useState<Record<string, string>>({});
  const [notesInputs, setNotesInputs] = useState<Record<string, string>>({});
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

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

  const handleStockChange = (id: string, val: string) => {
    setNewStockInputs((prev) => ({ ...prev, [id]: val }));
  };

  const handleResetRow = (id: string) => {
    setNewStockInputs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    toast.info("Row entry reset");
  };

  const handleClearAll = () => {
    setNewStockInputs({});
    setNotesInputs({});
    toast.info("All entries cleared");
  };

  const handleQuickSave = () => {
    const entries = Object.entries(newStockInputs).map(([id, val]) => ({
      id,
      newStock: parseFloat(val) || 0,
      notes: notesInputs[id],
    }));

    if (entries.length === 0) {
      toast.info("No entries to save");
      return;
    }

    saveMutation.mutate(
      { entries, date: selectedDate },
      {
        onSuccess: () => {
          toast.success(`Saved closing stock for ${entries.length} items`);
        },
      },
    );
  };

  const handleReview = () => {
    handleQuickSave();
  };

  const handleDownloadSample = () => {
    toast.success("Downloading Closing_Stock_Import_Template.xlsx...");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      toast.success(`Selected file: ${file.name}`);
      setStep(2);
    }
  };

  const handleConfirmExcelImport = () => {
    if (!stockItems || stockItems.length === 0) return;
    // Simulate updating items from file
    const sampleImportEntries = stockItems.map((item) => ({
      id: item.id,
      newStock: item.closingStock + Math.floor(Math.random() * 5),
      notes: "Imported via Excel spreadsheet",
    }));

    saveMutation.mutate({ entries: sampleImportEntries, date: selectedDate }, {
      onSuccess: () => {
        setStep(3);
        toast.success(
          `Successfully imported closing stock for ${sampleImportEntries.length} items from ${uploadedFile?.name || "Excel"}`,
        );
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Daily Stock Count</h2>

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

      {/* 2. Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("add_closing")}
          className={`px-5 py-2 text-[13px] font-bold transition cursor-pointer ${
            activeTab === "add_closing"
              ? "border-b-2 border-teal-600 text-teal-600 font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Daily Stock Count
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("import_excel")}
          className={`px-5 py-2 text-[13px] font-bold transition cursor-pointer ${
            activeTab === "import_excel"
              ? "border-b-2 border-teal-600 text-teal-600 font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Import Via Excel
        </button>
      </div>

      {activeTab === "import_excel" ? (
        /* Excel Import Flow matching AvailableStockView */
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          {/* Stepper */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
            {/* Step 1 */}
            <div className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold ${
                  step >= 1 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
                }`}
              >
                1
              </span>
              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  STEP 1
                </div>
                <div className="text-[13px] font-semibold text-slate-900">Upload</div>
              </div>
            </div>

            <div className="hidden sm:block flex-1 border-t border-slate-200 mx-4" />

            {/* Step 2 */}
            <div className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold ${
                  step >= 2
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-500 border border-slate-300"
                }`}
              >
                2
              </span>
              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  STEP 2
                </div>
                <div className="text-[13px] font-medium text-slate-600">Review pending errors</div>
              </div>
            </div>

            <div className="hidden sm:block flex-1 border-t border-slate-200 mx-4" />

            {/* Step 3 */}
            <div className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold ${
                  step >= 3
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-500 border border-slate-300"
                }`}
              >
                3
              </span>
              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  STEP 3
                </div>
                <div className="text-[13px] font-medium text-slate-600">Check your summary</div>
              </div>
            </div>
          </div>

          {/* Subheader action row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">
                Upload Your Closing Stock Excel
              </h3>
              <p className="text-[12.5px] text-slate-500 mt-0.5">
                Download the sample template, fill in your closing counts and variance notes, and
                upload the completed file.
              </p>
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
                  <option value="Monthly">Monthly</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleDownloadSample}
                className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Download Excel File
              </button>

              <button
                type="button"
                onClick={() => toast.info("Step-by-Step closing stock guide opened")}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <BookOpen className="h-4 w-4 text-slate-500" />
                Step-By-Step Guide
              </button>
            </div>
          </div>

          {/* Drag & Drop Dropzone */}
          <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-teal-200 bg-teal-50/20 p-12 text-center hover:bg-teal-50/40 transition">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-600 mb-3">
              <Upload className="h-6 w-6" />
            </div>
            <div className="text-[14px] font-semibold text-slate-800">
              {uploadedFile ? uploadedFile.name : "Drag & drop your closing stock file here"}
            </div>
            <div className="text-[12px] text-slate-400 mt-1">
              or click to browse · .xlsx, .xls, .csv · max 10MB
            </div>

            {uploadedFile && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> File validated (0 errors)
                </span>
                <button
                  type="button"
                  onClick={handleConfirmExcelImport}
                  className="rounded-lg bg-teal-600 px-4 py-1.5 text-[12.5px] font-semibold text-white hover:bg-teal-700 cursor-pointer shadow-2xs"
                >
                  Confirm Import
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Manual Stock Entry View */
        <div className="space-y-4">
          {/* 3. Search & Cycle Bar matching Screenshot 2 */}
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

          {/* 4. Two-Column Layout matching Screenshot 2 (Left Categories Rail + Right Table) */}
          <div className="flex flex-col md:flex-row items-start gap-4">
            {/* Left Categories Box from Screenshot 2 */}
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

            {/* Right Data Table from Screenshot 2 */}
            <div className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] border-collapse">
                  <DataTableHeader
                    columns={closingColumns}
                    data={filteredItems}
                    themeVariant="primary"
                  />
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => {
                      const enteredVal = newStockInputs[item.id] ?? "";
                      const parsedNewStock = enteredVal !== "" ? parseFloat(enteredVal) : null;
                      const variance =
                        parsedNewStock !== null ? parsedNewStock - item.closingStock : null;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {item.rawMaterial}
                          </td>

                          <td className="px-4 py-3 text-slate-600 font-mono text-[12.5px]">
                            {item.closingStock} {item.unit}
                          </td>

                          {/* New Stock Input matching Screenshot 2 [       / Dish] */}
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
                          <td className="px-4 py-3 font-mono text-[12.5px]">
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

                          {/* Comment & Reset Icons matching Screenshot 2 */}
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
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer Action Bar matching Screenshot 2 */}
              <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[13px] font-medium text-slate-600 hover:text-slate-900 cursor-pointer underline"
                >
                  Clear All Entries
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleQuickSave}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Quick Save
                  </button>
                  <button
                    type="button"
                    onClick={handleReview}
                    className="rounded-lg bg-teal-600 px-5 py-1.5 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
                  >
                    Review →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
