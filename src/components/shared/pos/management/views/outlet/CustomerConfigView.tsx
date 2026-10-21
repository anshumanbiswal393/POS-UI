import { useState } from "react";
import {
  ConfigPageShell,
  FieldLabel,
  YesNoRadios,
} from "@/components/shared/pos/management/outlet-config/ConfigPageShell";
import { useOutletConfig } from "@/components/shared/pos/management/outlet-config/useOutletConfig";

export function CustomerConfigView() {
  const { config, persist } = useOutletConfig();
  const [form, setForm] = useState(config.customer);

  return (
    <ConfigPageShell
      title="Customer"
      subtitle="Configure customer capture on the billing screen."
      onSave={() => persist({ ...config, customer: form }, "Customer settings saved")}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <FieldLabel>Make customer mobile mandatory?</FieldLabel>
          <YesNoRadios
            name="mandatoryMobile"
            value={form.mandatoryMobile}
            onChange={(v) => setForm((p) => ({ ...p, mandatoryMobile: v }))}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel>Make customer name mandatory?</FieldLabel>
          <YesNoRadios
            name="mandatoryName"
            value={form.mandatoryName}
            onChange={(v) => setForm((p) => ({ ...p, mandatoryName: v }))}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel>Allow GST number on the bill?</FieldLabel>
          <YesNoRadios
            name="allowGstOnBill"
            value={form.allowGstOnBill}
            onChange={(v) => setForm((p) => ({ ...p, allowGstOnBill: v }))}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel>Enable loyalty on billing?</FieldLabel>
          <YesNoRadios
            name="enableLoyalty"
            value={form.enableLoyalty}
            onChange={(v) => setForm((p) => ({ ...p, enableLoyalty: v }))}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel>Allow walk-in bills without a customer?</FieldLabel>
          <YesNoRadios
            name="allowWalkInWithoutCustomer"
            value={form.allowWalkInWithoutCustomer}
            onChange={(v) => setForm((p) => ({ ...p, allowWalkInWithoutCustomer: v }))}
          />
        </div>
      </div>
    </ConfigPageShell>
  );
}
