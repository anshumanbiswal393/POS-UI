import { useState } from "react";
import { toast } from "sonner";
import {
  ConfigPageShell,
  FieldLabel,
  TextInput,
  YesNoRadios,
} from "@/components/shared/pos/management/outlet-config/ConfigPageShell";
import { useOutletConfig } from "@/components/shared/pos/management/outlet-config/useOutletConfig";

export function PaymentConfigView() {
  const { config, persist } = useOutletConfig();
  const [form, setForm] = useState(config.payment);

  const handleSave = () => {
    if (!form.types.some((t) => t.enabled)) {
      toast.error("Enable at least one payment type");
      return;
    }
    persist({ ...config, payment: form }, "Payment configuration saved");
  };

  return (
    <ConfigPageShell
      title="Payment"
      subtitle="Configure currency and payment types available at this outlet."
      onSave={handleSave}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="space-y-1.5">
            <FieldLabel required>Currency</FieldLabel>
            <TextInput value={form.currency} onChange={(v) => setForm((p) => ({ ...p, currency: v }))} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Symbol</FieldLabel>
            <TextInput value={form.symbol} onChange={(v) => setForm((p) => ({ ...p, symbol: v }))} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Decimal places</FieldLabel>
            <TextInput
              value={form.decimalPlaces}
              onChange={(v) => setForm((p) => ({ ...p, decimalPlaces: v }))}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Symbol position</FieldLabel>
            <div className="flex gap-4 pt-2">
              {(["Before", "After"] as const).map((opt) => (
                <label key={opt} className="flex cursor-pointer items-center gap-2 text-[13px]">
                  <input
                    type="radio"
                    name="symbolPosition"
                    checked={form.symbolPosition === opt}
                    onChange={() => setForm((p) => ({ ...p, symbolPosition: opt }))}
                    className="h-4 w-4 text-teal-600"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel>Allow split payments?</FieldLabel>
            <YesNoRadios
              name="allowSplitPayment"
              value={form.allowSplitPayment}
              onChange={(v) => setForm((p) => ({ ...p, allowSplitPayment: v }))}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>Round off bill totals?</FieldLabel>
            <YesNoRadios
              name="roundOffBills"
              value={form.roundOffBills}
              onChange={(v) => setForm((p) => ({ ...p, roundOffBills: v }))}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-[12.5px]">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Payment type</th>
                <th className="px-4 py-2.5">Enabled</th>
                <th className="px-4 py-2.5">Default</th>
                <th className="px-4 py-2.5">Surcharge %</th>
              </tr>
            </thead>
            <tbody>
              {form.types.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 font-semibold text-slate-800">{row.name}</td>
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          types: p.types.map((t) =>
                            t.id === row.id ? { ...t, enabled: e.target.checked } : t,
                          ),
                        }))
                      }
                      className="h-4 w-4 cursor-pointer text-teal-600"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="radio"
                      name="defaultPay"
                      checked={row.isDefault}
                      onChange={() =>
                        setForm((p) => ({
                          ...p,
                          types: p.types.map((t) => ({ ...t, isDefault: t.id === row.id })),
                        }))
                      }
                      className="h-4 w-4 cursor-pointer text-teal-600"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      value={row.surchargePct}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          types: p.types.map((t) =>
                            t.id === row.id ? { ...t, surchargePct: e.target.value } : t,
                          ),
                        }))
                      }
                      className="w-24 rounded-lg border border-slate-300 px-2 py-1 font-mono text-[12.5px]"
                    />
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
