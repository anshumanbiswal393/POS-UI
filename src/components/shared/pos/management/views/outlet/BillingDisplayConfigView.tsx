import { useState } from "react";
import {
  ConfigPageShell,
  OptionRadios,
  SettingRow,
  YesNoRadios,
} from "@/components/shared/pos/management/outlet-config/ConfigPageShell";
import { useOutletConfig } from "@/components/shared/pos/management/outlet-config/useOutletConfig";

export function BillingDisplayConfigView() {
  const { config, persist } = useOutletConfig();
  const [form, setForm] = useState(config.billingDisplay);

  return (
    <ConfigPageShell
      title="Display"
      subtitle="Configure the billing screen display, look & values."
      onSave={() => persist({ ...config, billingDisplay: form }, "Billing display saved")}
    >
      <SettingRow label="Menu layout on the billing screen">
        <OptionRadios
          name="menuLayout"
          value={form.menuLayout}
          options={["Grid", "List"]}
          onChange={(v) => setForm((p) => ({ ...p, menuLayout: v as typeof form.menuLayout }))}
        />
      </SettingRow>
      <SettingRow label="How many item columns should the grid show?">
        <OptionRadios
          name="itemColumns"
          value={form.itemColumns}
          options={["3", "4", "5"]}
          onChange={(v) => setForm((p) => ({ ...p, itemColumns: v as typeof form.itemColumns }))}
        />
      </SettingRow>
      <SettingRow label="Show item images on billing?">
        <YesNoRadios
          name="showItemImages"
          value={form.showItemImages}
          onChange={(v) => setForm((p) => ({ ...p, showItemImages: v }))}
        />
      </SettingRow>
      <SettingRow label="Show category images?">
        <YesNoRadios
          name="showCategoryImages"
          value={form.showCategoryImages}
          onChange={(v) => setForm((p) => ({ ...p, showCategoryImages: v }))}
        />
      </SettingRow>
      <SettingRow label="Show item short code on the menu tile?">
        <YesNoRadios
          name="showItemCode"
          value={form.showItemCode}
          onChange={(v) => setForm((p) => ({ ...p, showItemCode: v }))}
        />
      </SettingRow>
      <SettingRow label="Show KOT number on the cart?">
        <YesNoRadios
          name="showKotNumber"
          value={form.showKotNumber}
          onChange={(v) => setForm((p) => ({ ...p, showKotNumber: v }))}
        />
      </SettingRow>
      <SettingRow label="Show tax breakup on the cart?">
        <YesNoRadios
          name="showTaxBreakup"
          value={form.showTaxBreakup}
          onChange={(v) => setForm((p) => ({ ...p, showTaxBreakup: v }))}
        />
      </SettingRow>
      <SettingRow label="Show running table amount on occupied tables?">
        <YesNoRadios
          name="showRunningTableAmount"
          value={form.showRunningTableAmount}
          onChange={(v) => setForm((p) => ({ ...p, showRunningTableAmount: v }))}
        />
      </SettingRow>
      <SettingRow
        label="Show out-of-stock items on billing?"
        tip="If No, items marked out of stock stay hidden from the biller."
      >
        <YesNoRadios
          name="showOutOfStock"
          value={form.showOutOfStock}
          onChange={(v) => setForm((p) => ({ ...p, showOutOfStock: v }))}
        />
      </SettingRow>
      <SettingRow label="Ask for confirmation before settling a bill?">
        <YesNoRadios
          name="confirmBeforeSettle"
          value={form.confirmBeforeSettle}
          onChange={(v) => setForm((p) => ({ ...p, confirmBeforeSettle: v }))}
        />
      </SettingRow>
      <SettingRow label="Default order type when billing opens">
        <select
          value={form.defaultOrderType}
          onChange={(e) => setForm((p) => ({ ...p, defaultOrderType: e.target.value }))}
          className="w-full max-w-xs cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-teal-500 focus:outline-none"
        >
          <option>Dine In</option>
          <option>Takeaway</option>
          <option>Delivery</option>
          <option>Room Service</option>
        </select>
      </SettingRow>
      <SettingRow label="Screen density">
        <OptionRadios
          name="density"
          value={form.density}
          options={["Comfortable", "Compact"]}
          onChange={(v) => setForm((p) => ({ ...p, density: v as typeof form.density }))}
        />
      </SettingRow>
      <SettingRow label="Accent colour">
        <OptionRadios
          name="themeAccent"
          value={form.themeAccent}
          options={["Teal", "Slate"]}
          onChange={(v) => setForm((p) => ({ ...p, themeAccent: v as typeof form.themeAccent }))}
        />
      </SettingRow>
    </ConfigPageShell>
  );
}
