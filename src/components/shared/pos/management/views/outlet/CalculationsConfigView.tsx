import { useState } from "react";
import {
  ConfigPageShell,
  FieldLabel,
  TextInput,
  YesNoRadios,
} from "@/components/shared/pos/management/outlet-config/ConfigPageShell";
import { useOutletConfig } from "@/components/shared/pos/management/outlet-config/useOutletConfig";

export function CalculationsConfigView() {
  const { config, persist } = useOutletConfig();
  const [form, setForm] = useState(config.calculations);

  return (
    <ConfigPageShell
      title="Calculations"
      subtitle="Configure how an invoice gets calculated."
      onSave={() => persist({ ...config, calculations: form }, "Calculation settings saved")}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <FieldLabel>Are menu prices tax inclusive?</FieldLabel>
          <YesNoRadios
            name="taxInclusive"
            value={form.taxInclusive}
            onChange={(v) => setForm((p) => ({ ...p, taxInclusive: v }))}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel>Apply service charge?</FieldLabel>
          <YesNoRadios
            name="applyServiceCharge"
            value={form.applyServiceCharge}
            onChange={(v) => setForm((p) => ({ ...p, applyServiceCharge: v }))}
          />
          {form.applyServiceCharge === "Yes" ? (
            <div className="max-w-xs space-y-1.5">
              <FieldLabel>Service charge %</FieldLabel>
              <TextInput
                value={form.serviceChargePct}
                onChange={(v) => setForm((p) => ({ ...p, serviceChargePct: v }))}
              />
            </div>
          ) : null}
        </div>
        <div className="space-y-2">
          <FieldLabel>Apply packing charge on takeaway / delivery?</FieldLabel>
          <YesNoRadios
            name="applyPackingCharge"
            value={form.applyPackingCharge}
            onChange={(v) => setForm((p) => ({ ...p, applyPackingCharge: v }))}
          />
          {form.applyPackingCharge === "Yes" ? (
            <div className="max-w-xs space-y-1.5">
              <FieldLabel>Packing charge (₹)</FieldLabel>
              <TextInput
                value={form.packingCharge}
                onChange={(v) => setForm((p) => ({ ...p, packingCharge: v }))}
              />
            </div>
          ) : null}
        </div>
        <div className="space-y-2">
          <FieldLabel>Apply discount before tax?</FieldLabel>
          <YesNoRadios
            name="discountBeforeTax"
            value={form.discountBeforeTax}
            onChange={(v) => setForm((p) => ({ ...p, discountBeforeTax: v }))}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel>Auto round off invoice total?</FieldLabel>
          <YesNoRadios
            name="autoRoundOff"
            value={form.autoRoundOff}
            onChange={(v) => setForm((p) => ({ ...p, autoRoundOff: v }))}
          />
        </div>
      </div>
    </ConfigPageShell>
  );
}
