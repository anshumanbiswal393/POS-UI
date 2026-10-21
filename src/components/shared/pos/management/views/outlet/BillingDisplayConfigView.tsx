import { useState } from "react";
import {
  ConfigPageShell,
  FieldLabel,
  YesNoRadios,
} from "@/components/shared/pos/management/outlet-config/ConfigPageShell";
import { useOutletConfig } from "@/components/shared/pos/management/outlet-config/useOutletConfig";

export function BillingDisplayConfigView() {
  const { config, persist } = useOutletConfig();
  const [form, setForm] = useState(config.billingDisplay);

  return (
    <ConfigPageShell
      title="Display"
      subtitle="Configure the billing screen display, look and values."
      onSave={() => persist({ ...config, billingDisplay: form }, "Billing display saved")}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel>Show item images on billing?</FieldLabel>
            <YesNoRadios
              name="showItemImages"
              value={form.showItemImages}
              onChange={(v) => setForm((p) => ({ ...p, showItemImages: v }))}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>Show KOT number on billing?</FieldLabel>
            <YesNoRadios
              name="showKotNumber"
              value={form.showKotNumber}
              onChange={(v) => setForm((p) => ({ ...p, showKotNumber: v }))}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>Show tax breakup on the cart?</FieldLabel>
            <YesNoRadios
              name="showTaxBreakup"
              value={form.showTaxBreakup}
              onChange={(v) => setForm((p) => ({ ...p, showTaxBreakup: v }))}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>Default order type</FieldLabel>
            <select
              value={form.defaultOrderType}
              onChange={(e) => setForm((p) => ({ ...p, defaultOrderType: e.target.value }))}
              className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-[13px]"
            >
              <option>Dine In</option>
              <option>Takeaway</option>
              <option>Delivery</option>
              <option>Room Service</option>
            </select>
          </div>
          <div className="space-y-2">
            <FieldLabel>Screen density</FieldLabel>
            <div className="flex gap-4">
              {(["Comfortable", "Compact"] as const).map((opt) => (
                <label key={opt} className="flex cursor-pointer items-center gap-2 text-[13px]">
                  <input
                    type="radio"
                    name="density"
                    checked={form.density === opt}
                    onChange={() => setForm((p) => ({ ...p, density: opt }))}
                    className="h-4 w-4 text-teal-600"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabel>Accent</FieldLabel>
            <div className="flex gap-4">
              {(["Teal", "Slate"] as const).map((opt) => (
                <label key={opt} className="flex cursor-pointer items-center gap-2 text-[13px]">
                  <input
                    type="radio"
                    name="themeAccent"
                    checked={form.themeAccent === opt}
                    onChange={() => setForm((p) => ({ ...p, themeAccent: opt }))}
                    className="h-4 w-4 text-teal-600"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ConfigPageShell>
  );
}
