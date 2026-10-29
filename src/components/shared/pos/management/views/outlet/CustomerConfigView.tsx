import { useState } from "react";
import {
  ConfigPageShell,
  SettingRow,
  YesNoRadios,
} from "@/components/shared/pos/management/outlet-config/ConfigPageShell";
import { useDraftOnChange, useOutletConfig } from "@/components/shared/pos/management/outlet-config/useOutletConfig";

export function CustomerConfigView() {
  const { config, persist, saveDraft, outletId } = useOutletConfig();
  const [form, setForm] = useState(config.customer);
  useDraftOnChange("customer", form, (c, f) => ({ ...c, customer: f }), saveDraft, outletId);

  return (
    <ConfigPageShell
      title="Customer"
      subtitle="Configure the billing screen and it's component."
      onSave={() => persist({ ...config, customer: form }, "Customer settings saved", "customer")}
      stepId="customer"
    >
      <SettingRow label="Make customer mobile mandatory on billing?">
        <YesNoRadios
          name="mandatoryMobile"
          value={form.mandatoryMobile}
          onChange={(v) => setForm((p) => ({ ...p, mandatoryMobile: v }))}
        />
      </SettingRow>
      <SettingRow label="Make customer name mandatory?">
        <YesNoRadios
          name="mandatoryName"
          value={form.mandatoryName}
          onChange={(v) => setForm((p) => ({ ...p, mandatoryName: v }))}
        />
      </SettingRow>
      <SettingRow
        label="Allow adding GST number on the bill?"
        tip="Guests can enter a GSTIN so the invoice prints as a tax invoice."
      >
        <YesNoRadios
          name="allowGstOnBill"
          value={form.allowGstOnBill}
          onChange={(v) => setForm((p) => ({ ...p, allowGstOnBill: v }))}
        />
      </SettingRow>
      <SettingRow label="Enable loyalty points on billing?">
        <YesNoRadios
          name="enableLoyalty"
          value={form.enableLoyalty}
          onChange={(v) => setForm((p) => ({ ...p, enableLoyalty: v }))}
        />
      </SettingRow>
      <SettingRow label="Allow walk-in bills without a customer?">
        <YesNoRadios
          name="allowWalkInWithoutCustomer"
          value={form.allowWalkInWithoutCustomer}
          onChange={(v) => setForm((p) => ({ ...p, allowWalkInWithoutCustomer: v }))}
        />
      </SettingRow>
      <SettingRow label="Capture address for delivery orders?">
        <YesNoRadios
          name="captureAddress"
          value={form.captureAddress}
          onChange={(v) => setForm((p) => ({ ...p, captureAddress: v }))}
        />
      </SettingRow>
      <SettingRow label="Capture birthday / anniversary?">
        <YesNoRadios
          name="captureBirthday"
          value={form.captureBirthday}
          onChange={(v) => setForm((p) => ({ ...p, captureBirthday: v }))}
        />
      </SettingRow>
      <SettingRow label="Search existing customers by mobile number?">
        <YesNoRadios
          name="searchByMobile"
          value={form.searchByMobile}
          onChange={(v) => setForm((p) => ({ ...p, searchByMobile: v }))}
        />
      </SettingRow>
      <SettingRow label="Auto-create a customer when a new number is billed?">
        <YesNoRadios
          name="autoCreateOnBill"
          value={form.autoCreateOnBill}
          onChange={(v) => setForm((p) => ({ ...p, autoCreateOnBill: v }))}
        />
      </SettingRow>
      <SettingRow label="Show last orders for the selected customer?">
        <YesNoRadios
          name="showLastOrders"
          value={form.showLastOrders}
          onChange={(v) => setForm((p) => ({ ...p, showLastOrders: v }))}
        />
      </SettingRow>
    </ConfigPageShell>
  );
}
