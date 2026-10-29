import { useState } from "react";
import {
  ConfigPageShell,
  OptionRadios,
  SettingRow,
  TextInput,
  YesNoRadios,
} from "@/components/shared/pos/management/outlet-config/ConfigPageShell";
import { useDraftOnChange, useOutletConfig } from "@/components/shared/pos/management/outlet-config/useOutletConfig";

export function PrintConfigView() {
  const { config, persist, saveDraft, outletId } = useOutletConfig();
  const [form, setForm] = useState(config.print);
  useDraftOnChange("print", form, (c, f) => ({ ...c, print: f }), saveDraft, outletId);

  return (
    <ConfigPageShell
      title="Print"
      subtitle="Configure the print settings of the Bill and KOT."
      onSave={() => persist({ ...config, print: form }, "Print settings saved", "print")}
      stepId="print"
    >
      <SettingRow label="Number of bill copies">
        <div className="max-w-xs">
          <TextInput value={form.billCopies} onChange={(v) => setForm((p) => ({ ...p, billCopies: v }))} />
        </div>
      </SettingRow>
      <SettingRow label="Number of KOT copies">
        <div className="max-w-xs">
          <TextInput value={form.kotCopies} onChange={(v) => setForm((p) => ({ ...p, kotCopies: v }))} />
        </div>
      </SettingRow>
      <SettingRow label="Paper size">
        <OptionRadios
          name="paperSize"
          value={form.paperSize}
          options={["80mm", "58mm", "A4"]}
          onChange={(v) => setForm((p) => ({ ...p, paperSize: v as typeof form.paperSize }))}
        />
      </SettingRow>
      <SettingRow label="Auto print bill on settle?">
        <YesNoRadios
          name="autoPrintOnSettle"
          value={form.autoPrintOnSettle}
          onChange={(v) => setForm((p) => ({ ...p, autoPrintOnSettle: v }))}
        />
      </SettingRow>
      <SettingRow label="Auto print KOT when items are sent to kitchen?">
        <YesNoRadios
          name="autoPrintKot"
          value={form.autoPrintKot}
          onChange={(v) => setForm((p) => ({ ...p, autoPrintKot: v }))}
        />
      </SettingRow>
      <SettingRow label="Print token number?">
        <YesNoRadios
          name="printTokenNumber"
          value={form.printTokenNumber}
          onChange={(v) => setForm((p) => ({ ...p, printTokenNumber: v }))}
        />
      </SettingRow>
      <SettingRow label="Print extra customer copy?">
        <YesNoRadios
          name="printCustomerCopy"
          value={form.printCustomerCopy}
          onChange={(v) => setForm((p) => ({ ...p, printCustomerCopy: v }))}
        />
      </SettingRow>
      <SettingRow label="Print GSTIN on the bill?">
        <YesNoRadios
          name="printGstin"
          value={form.printGstin}
          onChange={(v) => setForm((p) => ({ ...p, printGstin: v }))}
        />
      </SettingRow>
      <SettingRow label="Print FSSAI license on the bill?">
        <YesNoRadios
          name="printFssai"
          value={form.printFssai}
          onChange={(v) => setForm((p) => ({ ...p, printFssai: v }))}
        />
      </SettingRow>
      <SettingRow label="Print table number?">
        <YesNoRadios
          name="printTableNumber"
          value={form.printTableNumber}
          onChange={(v) => setForm((p) => ({ ...p, printTableNumber: v }))}
        />
      </SettingRow>
      <SettingRow label="Print cashier / biller name?">
        <YesNoRadios
          name="printCashierName"
          value={form.printCashierName}
          onChange={(v) => setForm((p) => ({ ...p, printCashierName: v }))}
        />
      </SettingRow>
      <SettingRow label="Cut paper after print?">
        <YesNoRadios
          name="cutAfterPrint"
          value={form.cutAfterPrint}
          onChange={(v) => setForm((p) => ({ ...p, cutAfterPrint: v }))}
        />
      </SettingRow>
    </ConfigPageShell>
  );
}
