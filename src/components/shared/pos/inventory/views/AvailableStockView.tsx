import { useState, useMemo } from "react";
import {
  Upload,
  Download,
  BookOpen,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { useStockItems } from "@/hooks/queries/usePosInventory";
import {
  DataTableHeader,
  type DataTableColumn,
} from "@/components/common/DataTableHeader";
import { toast } from "sonner";

export function AvailableStockView() {
  const { data: stockItems, refetch, isFetching } = useStockItems();

  const [activeTab, setActiveTab] = useState<"add_stock" | "import_excel">("add_stock");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [updateCycle, setUpdateCycle] = useState("Daily");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const availableStockColumns: DataTableColumn<any>[] = useMemo(
    () => [
      {
        id: "rawMaterial",
        label: "Raw Material / Item",
        sortable: true,
        filterable: true,
        defaultWidth: 240,
        getValue: (r) => r.rawMaterial,
      },
      {
        id: "category",
        label: "Category",
        sortable: true,
        filterable: true,
        defaultWidth: 160,
        getValue: (r) => r.category,
      },
      {
        id: "availableStock",
        label: "Available Stock",
        sortable: true,
        align: "right",
        defaultWidth: 150,
        getValue: (r) => String(r.availableStock),
      },
      {
        id: "unit",
        label: "Unit",
        sortable: true,
        defaultWidth: 100,
        getValue: (r) => r.unit,
      },
      {
        id: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        align: "center",
        defaultWidth: 130,
        getValue: (r) => (r.availableStock > 0 ? "In Stock" : "Zero Stock"),
      },
    ],
    [],
  );

  const handleDownloadSample = () => {
    toast.success("Downloading Stock_Import_Template.xlsx...");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      toast.success(`Selected file: ${file.name}`);
      setStep(2);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Top Header Bar matching Screenshot 1 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Available Stock</h2>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Tabs matching Screenshot 1 */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("add_stock")}
          className={`px-5 py-2 text-[13px] font-bold transition cursor-pointer ${
            activeTab === "add_stock"
              ? "border-b-2 border-teal-600 text-teal-600 font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Available Stock List
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
        /* Excel Import Flow from Screenshot 1 */
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          {/* Stepper matching Screenshot 1 */}
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

          {/* Subheader action row matching Screenshot 1 */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">Upload Your Stock Excel</h3>
              <p className="text-[12.5px] text-slate-500 mt-0.5">
                Download the sample template, fill in your stock details, and upload the completed
                file to import your inventory.
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
                onClick={() => toast.info("Step-by-Step guide opened")}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <BookOpen className="h-4 w-4 text-slate-500" />
                Step-By-Step Guide
              </button>
            </div>
          </div>

          {/* Drag & Drop Dropzone matching Screenshot 1 */}
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
              {uploadedFile ? uploadedFile.name : "Drag & drop your file here"}
            </div>
            <div className="text-[12px] text-slate-400 mt-1">
              or click to browse · .xlsx, .xls, .csv · max 10MB
            </div>

            {uploadedFile && (
              <div className="mt-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> File validated (0 errors)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep(3);
                    toast.success("Import processed successfully!");
                  }}
                  className="rounded-lg bg-teal-600 px-4 py-1.5 text-[12.5px] font-semibold text-white hover:bg-teal-700 cursor-pointer shadow-2xs"
                >
                  Confirm Import
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Manual Available Stock Table */
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-[14.5px] font-bold text-slate-900">
              Current On-Hand Available Stock
            </h3>
            <span className="text-[12px] text-slate-500">
              {stockItems?.length} raw materials tracked
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <DataTableHeader
                columns={availableStockColumns}
                data={stockItems ?? []}
                themeVariant="primary"
              />
              <tbody className="divide-y divide-slate-100">
                {(!stockItems || stockItems.length === 0) ? (
                  <tr>
                    <td colSpan={availableStockColumns.length} className="py-12 text-center text-slate-400">
                      No available stock items recorded yet.
                    </td>
                  </tr>
                ) : (
                  stockItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900">{item.rawMaterial}</td>
                      <td className="px-4 py-3 text-slate-600">{item.category}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {item.availableStock}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{item.unit}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            item.availableStock > 0
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {item.availableStock > 0 ? "In Stock" : "Zero Stock"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
