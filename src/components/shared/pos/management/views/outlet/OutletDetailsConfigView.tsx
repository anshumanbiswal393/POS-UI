import { useState } from "react";
import { ChevronDown, ImagePlus, MapPin, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  ConfigPageShell,
  FieldLabel,
  TextInput,
} from "@/components/shared/pos/management/outlet-config/ConfigPageShell";
import { useOutletConfig } from "@/components/shared/pos/management/outlet-config/useOutletConfig";

export function OutletDetailsConfigView() {
  const { config, persist } = useOutletConfig();
  const [form, setForm] = useState(config.details);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onLogo = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update("logoDataUrl", String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!form.outletName.trim() || !form.email.trim() || !form.address.trim()) {
      toast.error("Outlet name, email and address are required");
      return;
    }
    persist({ ...config, details: form }, "Outlet details saved");
  };

  return (
    <ConfigPageShell
      title="Outlet Details"
      subtitle="Configure email id, address, and logo of an outlet."
      onSave={handleSave}
    >
      <div className="space-y-8">
        <section className="space-y-4">
          <h3 className="border-b border-slate-100 pb-2 text-[15px] font-bold text-slate-900">
            Outlet Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel required>Outlet Name</FieldLabel>
              <TextInput value={form.outletName} onChange={(v) => update("outletName", v)} />
              <p className="text-[11.5px] text-slate-500">
                Changing the legal name later may require Retrod support.
              </p>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Outlet Alias</FieldLabel>
              <TextInput value={form.alias} onChange={(v) => update("alias", v)} placeholder="HI-MAIN" />
            </div>
            <div className="space-y-1.5">
              <FieldLabel required>Email</FieldLabel>
              <TextInput type="email" value={form.email} onChange={(v) => update("email", v)} />
              <p className="text-[11.5px] text-slate-500">
                Used for communications from the Retrod team.
              </p>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Website</FieldLabel>
              <TextInput value={form.website} onChange={(v) => update("website", v)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Outlet Logo</FieldLabel>
            <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 hover:border-teal-400">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                {form.logoDataUrl ? (
                  <img src={form.logoDataUrl} alt="Outlet logo" className="h-full w-full object-contain" />
                ) : (
                  <ImagePlus className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-teal-700">
                  <Upload className="h-3.5 w-3.5" />
                  Upload logo
                </div>
                <p className="text-[11.5px] text-slate-500">PNG or JPG, square logo works best.</p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onLogo(e.target.files?.[0])}
              />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="border-b border-slate-100 pb-2 text-[15px] font-bold text-slate-900">
            Legal & Tax
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <FieldLabel>GSTIN</FieldLabel>
              <TextInput mono value={form.gstin} onChange={(v) => update("gstin", v)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>FSSAI License</FieldLabel>
              <TextInput mono value={form.fssai} onChange={(v) => update("fssai", v)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>TIN No.</FieldLabel>
              <TextInput mono value={form.tinNo} onChange={(v) => update("tinNo", v)} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-[15px] font-bold text-slate-900">Address Information</h3>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Provide zip code and state accurately for GST calculation whenever applicable.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel>Landmark</FieldLabel>
              <TextInput value={form.landmark} onChange={(v) => update("landmark", v)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel required>Zip Code</FieldLabel>
              <TextInput mono value={form.zipCode} onChange={(v) => update("zipCode", v)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Country</FieldLabel>
              <div className="relative">
                <select
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-[13px] focus:border-teal-500 focus:outline-none"
                >
                  <option>India</option>
                  <option>United Arab Emirates</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Timezone</FieldLabel>
              <TextInput value={form.timezone} onChange={(v) => update("timezone", v)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel required>State</FieldLabel>
              <TextInput value={form.state} onChange={(v) => update("state", v)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel required>City</FieldLabel>
              <TextInput value={form.city} onChange={(v) => update("city", v)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <FieldLabel required>Address</FieldLabel>
            <textarea
              rows={3}
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Area</FieldLabel>
            <TextInput value={form.area} onChange={(v) => update("area", v)} />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel>Latitude</FieldLabel>
              <TextInput mono value={form.latitude} onChange={(v) => update("latitude", v)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Longitude</FieldLabel>
              <TextInput mono value={form.longitude} onChange={(v) => update("longitude", v)} />
              <button
                type="button"
                onClick={() => toast.info("Map preview uses saved latitude and longitude")}
                className="inline-flex cursor-pointer items-center gap-1 text-[11.5px] font-semibold text-teal-700 hover:underline"
              >
                <MapPin className="h-3.5 w-3.5" />
                See location on map
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="border-b border-slate-100 pb-2 text-[15px] font-bold text-slate-900">
            Additional Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel>Cuisine</FieldLabel>
              <TextInput value={form.cuisine} onChange={(v) => update("cuisine", v)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Seating Capacity</FieldLabel>
              <TextInput value={form.seatingCapacity} onChange={(v) => update("seatingCapacity", v)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Notes</FieldLabel>
            <textarea
              rows={3}
              value={form.additionalInfo}
              onChange={(e) => update("additionalInfo", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-teal-500 focus:outline-none"
            />
          </div>
        </section>
      </div>
    </ConfigPageShell>
  );
}
