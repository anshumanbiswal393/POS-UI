import { useState } from "react";
import {
  ConfigPageShell,
  OptionRadios,
  SettingRow,
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
      subtitle="Configure how invoice gets calculate."
      onSave={() => persist({ ...config, calculations: form }, "Calculation settings saved")}
    >
      <SettingRow
        label="Are menu prices tax inclusive?"
        tip="If Yes, listed item prices already include GST. If No, tax is added on top."
      >
        <YesNoRadios
          name="taxInclusive"
          value={form.taxInclusive}
          onChange={(v) => setForm((p) => ({ ...p, taxInclusive: v }))}
        />
      </SettingRow>
      <SettingRow label="Apply service charge?">
        <YesNoRadios
          name="applyServiceCharge"
          value={form.applyServiceCharge}
          onChange={(v) => setForm((p) => ({ ...p, applyServiceCharge: v }))}
        />
      </SettingRow>
      {form.applyServiceCharge === "Yes" ? (
        <>
          <SettingRow label="Service charge %">
            <div className="max-w-xs">
              <TextInput
                value={form.serviceChargePct}
                onChange={(v) => setForm((p) => ({ ...p, serviceChargePct: v }))}
              />
            </div>
          </SettingRow>
          <SettingRow label="Apply service charge on">
            <OptionRadios
              name="serviceChargeOn"
              value={form.serviceChargeOn}
              options={["All orders", "Dine In only"]}
              onChange={(v) =>
                setForm((p) => ({ ...p, serviceChargeOn: v as typeof form.serviceChargeOn }))
              }
            />
          </SettingRow>
          <SettingRow label="Charge GST on service charge?">
            <YesNoRadios
              name="gstOnServiceCharge"
              value={form.gstOnServiceCharge}
              onChange={(v) => setForm((p) => ({ ...p, gstOnServiceCharge: v }))}
            />
          </SettingRow>
        </>
      ) : null}
      <SettingRow label="Apply packing charge on takeaway / delivery?">
        <YesNoRadios
          name="applyPackingCharge"
          value={form.applyPackingCharge}
          onChange={(v) => setForm((p) => ({ ...p, applyPackingCharge: v }))}
        />
      </SettingRow>
      {form.applyPackingCharge === "Yes" ? (
        <>
          <SettingRow label="Packing charge (₹)">
            <div className="max-w-xs">
              <TextInput
                value={form.packingCharge}
                onChange={(v) => setForm((p) => ({ ...p, packingCharge: v }))}
              />
            </div>
          </SettingRow>
          <SettingRow label="Charge GST on packing?">
            <YesNoRadios
              name="gstOnPacking"
              value={form.gstOnPacking}
              onChange={(v) => setForm((p) => ({ ...p, gstOnPacking: v }))}
            />
          </SettingRow>
        </>
      ) : null}
      <SettingRow label="Apply delivery charge?">
        <YesNoRadios
          name="applyDeliveryCharge"
          value={form.applyDeliveryCharge}
          onChange={(v) => setForm((p) => ({ ...p, applyDeliveryCharge: v }))}
        />
      </SettingRow>
      {form.applyDeliveryCharge === "Yes" ? (
        <SettingRow label="Delivery charge (₹)">
          <div className="max-w-xs">
            <TextInput
              value={form.deliveryCharge}
              onChange={(v) => setForm((p) => ({ ...p, deliveryCharge: v }))}
            />
          </div>
        </SettingRow>
      ) : null}
      <SettingRow label="Apply discount before tax?">
        <YesNoRadios
          name="discountBeforeTax"
          value={form.discountBeforeTax}
          onChange={(v) => setForm((p) => ({ ...p, discountBeforeTax: v }))}
        />
      </SettingRow>
      <SettingRow label="Auto round off invoice total?">
        <YesNoRadios
          name="autoRoundOff"
          value={form.autoRoundOff}
          onChange={(v) => setForm((p) => ({ ...p, autoRoundOff: v }))}
        />
      </SettingRow>
      {form.autoRoundOff === "Yes" ? (
        <SettingRow label="Round off method">
          <OptionRadios
            name="roundOffMethod"
            value={form.roundOffMethod}
            options={["Nearest", "Round off up", "Round off down"]}
            onChange={(v) =>
              setForm((p) => ({ ...p, roundOffMethod: v as typeof form.roundOffMethod }))
            }
          />
        </SettingRow>
      ) : null}
    </ConfigPageShell>
  );
}
