import { Plus, Trash2 } from "lucide-react";
import type { StockItem } from "@/types/posInventory";

export type StockSkuLine = {
  stockItemId: string;
  name: string;
  quantity: string;
  unit: string;
  unitPrice: string;
};

export function emptySkuLine(): StockSkuLine {
  return { stockItemId: "", name: "", quantity: "1", unit: "Kg", unitPrice: "0" };
}

export function lineAmount(line: StockSkuLine) {
  return (parseFloat(line.quantity) || 0) * (parseFloat(line.unitPrice) || 0);
}

export function StockSkuLines({
  lines,
  onChange,
  stockItems,
}: {
  lines: StockSkuLine[];
  onChange: (lines: StockSkuLine[]) => void;
  stockItems: StockItem[];
}) {
  const update = (idx: number, patch: Partial<StockSkuLine>) => {
    onChange(lines.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[12.5px] font-semibold text-slate-700">
          Line items <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={() => onChange([...lines, emptySkuLine()])}
          className="inline-flex items-center gap-1 text-[12px] font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          Add SKU
        </button>
      </div>
      <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        {lines.map((line, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-center rounded-lg bg-white border border-slate-200 p-2">
            <div className="col-span-12 sm:col-span-5">
              <select
                value={line.stockItemId}
                onChange={(e) => {
                  const sku = stockItems.find((s) => s.id === e.target.value);
                  update(idx, {
                    stockItemId: e.target.value,
                    name: sku?.rawMaterial || "",
                    unit: sku?.unit || line.unit,
                    unitPrice: sku?.unitCost != null ? String(sku.unitCost) : line.unitPrice,
                  });
                }}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-[12.5px] focus:border-teal-500 focus:outline-hidden cursor-pointer"
              >
                <option value="">Select stock item</option>
                {stockItems.map((sku) => (
                  <option key={sku.id} value={sku.id}>
                    {sku.rawMaterial}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-4 sm:col-span-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={line.quantity}
                onChange={(e) => update(idx, { quantity: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-[12.5px] text-right focus:border-teal-500 focus:outline-hidden"
              />
            </div>
            <div className="col-span-3 sm:col-span-2">
              <input
                type="text"
                value={line.unit}
                onChange={(e) => update(idx, { unit: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-[12.5px] focus:border-teal-500 focus:outline-hidden"
              />
            </div>
            <div className="col-span-4 sm:col-span-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={line.unitPrice}
                onChange={(e) => update(idx, { unitPrice: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-[12.5px] text-right focus:border-teal-500 focus:outline-hidden"
              />
            </div>
            <div className="col-span-1 flex justify-end">
              {lines.length > 1 ? (
                <button
                  type="button"
                  onClick={() => onChange(lines.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function toPurchaseItems(lines: StockSkuLine[]) {
  return lines
    .filter((line) => line.stockItemId && (parseFloat(line.quantity) || 0) > 0)
    .map((line) => {
      const quantity = parseFloat(line.quantity) || 0;
      const unitPrice = parseFloat(line.unitPrice) || 0;
      return {
        stockItemId: line.stockItemId,
        name: line.name,
        quantity,
        unit: line.unit,
        unitPrice,
        lineTotal: Math.round(quantity * unitPrice * 100) / 100,
      };
    });
}
