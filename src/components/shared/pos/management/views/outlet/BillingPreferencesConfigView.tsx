import { useState } from "react";
import { toast } from "sonner";
import {
  ConfigPageShell,
  FieldLabel,
  TextInput,
  SettingRow,
  YesNoRadios,
} from "@/components/shared/pos/management/outlet-config/ConfigPageShell";
import { useDraftOnChange, useOutletConfig } from "@/components/shared/pos/management/outlet-config/useOutletConfig";

export function BillingPreferencesConfigView() {
  const { config, persist, saveDraft, outletId } = useOutletConfig();
  const [form, setForm] = useState(() => ({
    currency: config.billingPreferences?.currency || config.payment.currency || "INR",
    symbol: config.billingPreferences?.symbol || config.payment.symbol || "₹",
    decimalPlaces: config.billingPreferences?.decimalPlaces || config.payment.decimalPlaces || "2",
    symbolPosition: config.billingPreferences?.symbolPosition || config.payment.symbolPosition || "Before",
    allowSplitPayment: config.billingPreferences?.allowSplitPayment || config.payment.allowSplitPayment || "Yes",
    roundOffBills: config.billingPreferences?.roundOffBills || config.payment.roundOffBills || "Yes",
  }));
  useDraftOnChange(
    "billing-preferences",
    form,
    (c, f) => ({ ...c, billingPreferences: f }),
    saveDraft,
    outletId,
  );

  const handleSave = () => {
    if (!form.currency.trim()) {
      toast.error("Currency is required");
      return;
    }
    return persist(
      { ...config, billingPreferences: form },
      "Billing preferences saved successfully",
      "billing-preferences",
    );
  };

  return (
    <ConfigPageShell
      title="Billing Preferences"
      subtitle="Configure currency, payment types and payment options available."
      onSave={handleSave}
      stepId="billing-preferences"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <FieldLabel required>Currency</FieldLabel>
            <TextInput
              value={form.currency}
              onChange={(v) => setForm((p) => ({ ...p, currency: v }))}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Symbol</FieldLabel>
            <TextInput
              value={form.symbol}
              onChange={(v) => setForm((p) => ({ ...p, symbol: v }))}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Decimal Places</FieldLabel>
            <TextInput
              value={form.decimalPlaces}
              onChange={(v) => setForm((p) => ({ ...p, decimalPlaces: v }))}
            />
          </div>
        </div>

        <SettingRow label="Allow split payment among multiple tenders?">
          <YesNoRadios
            name="allowSplitPayment"
            value={form.allowSplitPayment}
            onChange={(v) => setForm((p) => ({ ...p, allowSplitPayment: v }))}
          />
        </SettingRow>

        <SettingRow label="Automatically round off bill total?">
          <YesNoRadios
            name="roundOffBills"
            value={form.roundOffBills}
            onChange={(v) => setForm((p) => ({ ...p, roundOffBills: v }))}
          />
        </SettingRow>
      </div>
    </ConfigPageShell>
  );
}
