import { useState } from "react";
import { ImagePlus, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  ConfigPageShell,
  FieldLabel,
  TextInput,
  YesNoRadios,
} from "@/components/shared/pos/management/outlet-config/ConfigPageShell";
import { useOutletConfig } from "@/components/shared/pos/management/outlet-config/useOutletConfig";

export function PrintLogoConfigView() {
  const { config, persist } = useOutletConfig();
  const [form, setForm] = useState(config.printLogo);

  return (
    <ConfigPageShell
      title="Set Your Print Logo"
      subtitle="Logo to print at your desktop point of sale."
      onSave={() => persist({ ...config, printLogo: form }, "Print logo saved")}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
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
                Upload print logo
              </div>
              <p className="text-[11.5px] text-slate-500">High-contrast PNG prints cleanly on thermal paper.</p>
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
                reader.onload = () => setForm((p) => ({ ...p, logoDataUrl: String(reader.result || "") }));
                reader.readAsDataURL(file);
              }}
            />
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel>Alignment</FieldLabel>
              <div className="flex flex-wrap gap-4">
                {(["Left", "Center", "Right"] as const).map((opt) => (
                  <label key={opt} className="flex cursor-pointer items-center gap-2 text-[13px]">
                    <input
                      type="radio"
                      name="alignment"
                      checked={form.alignment === opt}
                      onChange={() => setForm((p) => ({ ...p, alignment: opt }))}
                      className="h-4 w-4 text-teal-600"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Width (mm)</FieldLabel>
              <TextInput value={form.widthMm} onChange={(v) => setForm((p) => ({ ...p, widthMm: v }))} />
            </div>
            <div className="space-y-2">
              <FieldLabel>Print on bill?</FieldLabel>
              <YesNoRadios
                name="printOnBill"
                value={form.printOnBill}
                onChange={(v) => setForm((p) => ({ ...p, printOnBill: v }))}
              />
            </div>
            <div className="space-y-2">
              <FieldLabel>Print on KOT?</FieldLabel>
              <YesNoRadios
                name="printOnKot"
                value={form.printOnKot}
                onChange={(v) => setForm((p) => ({ ...p, printOnKot: v }))}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Thermal preview
          </div>
          <div className="mt-3 rounded-lg bg-white p-4 text-center shadow-inner">
            {form.logoDataUrl ? (
              <img
                src={form.logoDataUrl}
                alt=""
                className={`mx-auto h-12 object-contain ${
                  form.alignment === "Left" ? "ml-0 mr-auto" : form.alignment === "Right" ? "ml-auto mr-0" : ""
                }`}
              />
            ) : (
              <div className="text-[12px] text-slate-400">No logo</div>
            )}
            <div className="mt-3 text-[12px] font-bold text-slate-800">HIGHWAY INN</div>
            <div className="text-[10px] text-slate-500">TAX INVOICE</div>
          </div>
        </div>
      </div>
    </ConfigPageShell>
  );
}
