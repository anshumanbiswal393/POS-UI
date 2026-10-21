import { useState } from "react";
import {
  ConfigPageShell,
  FieldLabel,
  TextInput,
  YesNoRadios,
} from "@/components/shared/pos/management/outlet-config/ConfigPageShell";
import { useOutletConfig } from "@/components/shared/pos/management/outlet-config/useOutletConfig";

export function PrintConfigView() {
  const { config, persist } = useOutletConfig();
  const [form, setForm] = useState(config.print);

  return (
    <ConfigPageShell
      title="Print"
      subtitle="Configure print settings for the bill and KOT."
      onSave={() => persist({ ...config, print: form }, "Print settings saved")}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-1.5">
          <FieldLabel>Bill copies</FieldLabel>
          <TextInput value={form.billCopies} onChange={(v) => setForm((p) => ({ ...p, billCopies: v }))} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>KOT copies</FieldLabel>
          <TextInput value={form.kotCopies} onChange={(v) => setForm((p) => ({ ...p, kotCopies: v }))} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Paper size</FieldLabel>
          <select
            value={form.paperSize}
            onChange={(e) =>
              setForm((p) => ({ ...p, paperSize: e.target.value as typeof form.paperSize }))
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px]"
          >
            <option value="80mm">80mm thermal</option>
            <option value="58mm">58mm thermal</option>
            <option value="A4">A4</option>
          </select>
        </div>
        <div className="space-y-2">
          <FieldLabel>Auto print on settle?</FieldLabel>
          <YesNoRadios
            name="autoPrintOnSettle"
            value={form.autoPrintOnSettle}
            onChange={(v) => setForm((p) => ({ ...p, autoPrintOnSettle: v }))}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel>Print token number?</FieldLabel>
          <YesNoRadios
            name="printTokenNumber"
            value={form.printTokenNumber}
            onChange={(v) => setForm((p) => ({ ...p, printTokenNumber: v }))}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel>Print extra customer copy?</FieldLabel>
          <YesNoRadios
            name="printCustomerCopy"
            value={form.printCustomerCopy}
            onChange={(v) => setForm((p) => ({ ...p, printCustomerCopy: v }))}
          />
        </div>
      </div>
    </ConfigPageShell>
  );
}
