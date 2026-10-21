import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfigPageShell } from "@/components/shared/pos/management/outlet-config/ConfigPageShell";
import { useOutletConfig } from "@/components/shared/pos/management/outlet-config/useOutletConfig";
import type { InvoiceSequenceRow } from "@/components/shared/pos/management/outlet-config/outletConfigStore";

function preview(row: InvoiceSequenceRow) {
  const n = Number(row.nextNumber || 0);
  const pad = Number(row.padding || 0);
  const num = Number.isFinite(n) ? String(n).padStart(Math.max(pad, 1), "0") : row.nextNumber;
  return `${row.prefix}${num}${row.suffix}`;
}

export function InvoiceSequenceConfigView() {
  const { config, persist } = useOutletConfig();
  const [rows, setRows] = useState(config.invoiceSequences);

  const patch = (id: string, next: Partial<InvoiceSequenceRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...next } : row)));
  };

  const handleSave = () => {
    if (rows.some((r) => !r.name.trim() || !r.prefix.trim())) {
      toast.error("Each sequence needs a name and prefix");
      return;
    }
    persist({ ...config, invoiceSequences: rows }, "Invoice sequences saved");
  };

  return (
    <ConfigPageShell
      title="Invoice Sequence"
      subtitle="Configure multiple invoice sequences by order type."
      onSave={handleSave}
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() =>
              setRows((prev) => [
                ...prev,
                {
                  id: `seq-${Date.now()}`,
                  name: "New sequence",
                  orderType: "Dine In",
                  prefix: "INV",
                  nextNumber: "1",
                  padding: "4",
                  suffix: "",
                  active: true,
                },
              ])
            }
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-[12px] font-semibold text-teal-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Add sequence
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[820px] text-left text-[12.5px]">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2.5">Name</th>
                <th className="px-3 py-2.5">Order type</th>
                <th className="px-3 py-2.5">Prefix</th>
                <th className="px-3 py-2.5">Next no.</th>
                <th className="px-3 py-2.5">Padding</th>
                <th className="px-3 py-2.5">Suffix</th>
                <th className="px-3 py-2.5">Preview</th>
                <th className="px-3 py-2.5">Active</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <input
                      value={row.name}
                      onChange={(e) => patch(row.id, { name: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.orderType}
                      onChange={(e) => patch(row.id, { orderType: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1"
                    >
                      <option>Dine In</option>
                      <option>Takeaway</option>
                      <option>Delivery</option>
                      <option>Room Service</option>
                      <option>Aggregators</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.prefix}
                      onChange={(e) => patch(row.id, { prefix: e.target.value })}
                      className="w-20 rounded-lg border border-slate-300 px-2 py-1 font-mono"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.nextNumber}
                      onChange={(e) => patch(row.id, { nextNumber: e.target.value })}
                      className="w-20 rounded-lg border border-slate-300 px-2 py-1 font-mono"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.padding}
                      onChange={(e) => patch(row.id, { padding: e.target.value })}
                      className="w-16 rounded-lg border border-slate-300 px-2 py-1 font-mono"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.suffix}
                      onChange={(e) => patch(row.id, { suffix: e.target.value })}
                      className="w-16 rounded-lg border border-slate-300 px-2 py-1 font-mono"
                    />
                  </td>
                  <td className="px-3 py-2 font-mono text-teal-700">{preview(row)}</td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={row.active}
                      onChange={(e) => patch(row.id, { active: e.target.checked })}
                      className="h-4 w-4 cursor-pointer text-teal-600"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                      className="cursor-pointer rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ConfigPageShell>
  );
}
