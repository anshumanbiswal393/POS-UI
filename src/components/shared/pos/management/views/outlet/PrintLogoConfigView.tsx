import { useState } from "react";
import { ImagePlus, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  ConfigPageShell,
  OptionRadios,
  SettingRow,
  TextInput,
  YesNoRadios,
} from "@/components/shared/pos/management/outlet-config/ConfigPageShell";
import { useDraftOnChange, useOutletConfig } from "@/components/shared/pos/management/outlet-config/useOutletConfig";

export function PrintLogoConfigView() {
  const { config, persist, saveDraft, outletId } = useOutletConfig();
  const [form, setForm] = useState(config.printLogo);
  useDraftOnChange("print-logo", form, (c, f) => ({ ...c, printLogo: f }), saveDraft, outletId);
  const alignClass =
    form.alignment === "Left" ? "text-left" : form.alignment === "Right" ? "text-right" : "text-center";

  return (
    <ConfigPageShell
      title="Set Your Print Logo"
      subtitle="Logo to print at your desktop point of sale."
      onSave={() => persist({ ...config, printLogo: form }, "Print logo saved", "print-logo")}
      stepId="print-logo"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          <SettingRow
            label="Upload print logo"
            hint="High-contrast PNG prints cleanly on thermal paper."
          >
            <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 hover:border-teal-400">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                {form.logoDataUrl ? (
                  <img src={form.logoDataUrl} alt="Print logo" className="h-full w-full object-contain" />
                ) : (
                  <ImagePlus className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-teal-700">
                  <Upload className="h-3.5 w-3.5" />
                  Choose image
                </div>
                <p className="text-[11.5px] text-slate-500">PNG or JPG · keep it square</p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!file.type.startsWith("image/")) {
                    toast.error("Please upload an image file");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () =>
                    setForm((p) => ({ ...p, logoDataUrl: String(reader.result || "") }));
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </SettingRow>
          <SettingRow label="Alignment on the bill">
            <OptionRadios
              name="alignment"
              value={form.alignment}
              options={["Left", "Center", "Right"]}
              onChange={(v) => setForm((p) => ({ ...p, alignment: v as typeof form.alignment }))}
            />
          </SettingRow>
          <SettingRow label="Logo width (mm)">
            <div className="max-w-xs">
              <TextInput value={form.widthMm} onChange={(v) => setForm((p) => ({ ...p, widthMm: v }))} />
            </div>
          </SettingRow>
          <SettingRow label="Print logo on the bill?">
            <YesNoRadios
              name="printOnBill"
              value={form.printOnBill}
              onChange={(v) => setForm((p) => ({ ...p, printOnBill: v }))}
            />
          </SettingRow>
          <SettingRow label="Print logo on KOT?">
            <YesNoRadios
              name="printOnKot"
              value={form.printOnKot}
              onChange={(v) => setForm((p) => ({ ...p, printOnKot: v }))}
            />
          </SettingRow>
          <SettingRow label="Print outlet name under the logo?">
            <YesNoRadios
              name="printOutletName"
              value={form.printOutletName}
              onChange={(v) => setForm((p) => ({ ...p, printOutletName: v }))}
            />
          </SettingRow>
          <SettingRow label="Bill header text">
            <TextInput
              value={form.headerText}
              onChange={(v) => setForm((p) => ({ ...p, headerText: v }))}
            />
          </SettingRow>
          <SettingRow label="Bill footer text">
            <TextInput
              value={form.footerText}
              onChange={(v) => setForm((p) => ({ ...p, footerText: v }))}
            />
          </SettingRow>
        </div>

        <div className="h-fit rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Thermal preview
          </div>
          <div className={`mt-3 rounded-lg bg-white p-4 shadow-inner ${alignClass}`}>
            {form.logoDataUrl ? (
              <img
                src={form.logoDataUrl}
                alt=""
                className={`h-12 object-contain ${
                  form.alignment === "Left"
                    ? "ml-0 mr-auto"
                    : form.alignment === "Right"
                      ? "ml-auto mr-0"
                      : "mx-auto"
                }`}
              />
            ) : (
              <div className="text-[12px] text-slate-400">No logo</div>
            )}
            {form.printOutletName === "Yes" ? (
              <div className="mt-2 text-[12px] font-bold text-slate-800">HIGHWAY INN</div>
            ) : null}
            <div className="text-[10px] text-slate-500">TAX INVOICE</div>
            {form.headerText ? (
              <div className="mt-2 text-[10px] text-slate-600">{form.headerText}</div>
            ) : null}
            <div className="my-3 border-t border-dashed border-slate-300" />
            <div className="text-[10px] text-slate-500">Item × qty</div>
            {form.footerText ? (
              <div className="mt-3 text-[10px] text-slate-600">{form.footerText}</div>
            ) : null}
          </div>
        </div>
      </div>
    </ConfigPageShell>
  );
}
