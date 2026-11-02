import { useState } from "react";
import { QrCode, Printer, Search, CheckCircle2, Tag } from "lucide-react";
import { toast } from "sonner";

export function BarcodeGenerationView() {
  const [selectedBatch, setSelectedBatch] = useState("PRD-REC-01");
  const [labelCount, setLabelCount] = useState("10");

  const items = [
    { id: "PRD-REC-01", name: "Makhani Gravy Base (1L Pack)", barcode: "890123450012", expDays: 3 },
    { id: "PRD-REC-02", name: "Pizza Dough Balls (250g)", barcode: "890123450029", expDays: 2 },
    {
      id: "PRD-REC-03",
      name: "Tandoori Chicken Marination (1kg)",
      barcode: "890123450036",
      expDays: 4,
    },
  ];

  const handlePrint = () => {
    toast.success(
      `Printing ${labelCount} barcode labels for ${items.find((i) => i.id === selectedBatch)?.name}...`,
    );
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-[18px] font-bold text-slate-900 tracking-tight">Create Barcodes</h2>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            Generate and print batch barcode labels with preparation date and expiry timestamps for
            thermal printers.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          Print Barcode Labels
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-slate-700">
              Select Production Item
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:outline-none focus:border-teal-500"
            >
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name} ({it.barcode})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-slate-700">
              Number of Label Stickers
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={labelCount}
              onChange={(e) => setLabelCount(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] font-mono focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Live Label Preview */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 flex flex-col items-center justify-center text-center space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Thermal Label Preview (50mm x 25mm)
          </div>
          <div className="rounded-lg border-2 border-dashed border-slate-300 bg-white p-4 shadow-xs w-64 text-center space-y-1">
            <div className="text-[12px] font-extrabold text-slate-900">
              {items.find((i) => i.id === selectedBatch)?.name}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              BATCH: #20260902-01 · PKG: 02/09/2026
            </div>
            <div className="font-mono text-[16px] tracking-widest text-slate-800 font-bold py-1">
              ||| | |||| | ||| |||| |
            </div>
            <div className="text-[10px] font-mono font-semibold text-slate-600">
              {items.find((i) => i.id === selectedBatch)?.barcode}
            </div>
            <div className="text-[9.5px] font-bold text-red-600">
              USE WITHIN {items.find((i) => i.id === selectedBatch)?.expDays} DAYS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
