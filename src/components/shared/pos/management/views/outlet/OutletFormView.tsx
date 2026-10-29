import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useOutletContext } from "@/context/PosOutletContext";
import { fetchAddressFromPincode } from "@/utils/pincodeLookup";

export function OutletFormView() {
  const navigate = useNavigate();
  const { createOutletFromForm } = useOutletContext();

  const [saving, setSaving] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [outletName, setOutletName] = useState("");
  const [outletAlias, setOutletAlias] = useState("");
  const [cuisine, setCuisine] = useState("Multi-Cuisine");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [country, setCountry] = useState("India");
  const [zipCode, setZipCode] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [timezone, setTimezone] = useState("Asia/Calcutta");
  const [address, setAddress] = useState("");
  const [stateOptions, setStateOptions] = useState<string[]>([
    "Odisha",
    "Maharashtra",
    "Karnataka",
    "Delhi",
    "Gujarat",
  ]);
  const [cityOptions, setCityOptions] = useState<string[]>([
    "Angul",
    "Bhubaneswar",
    "Cuttack",
    "Mumbai",
    "Bengaluru",
  ]);

  const lookupFromZip = useCallback(
    async (rawPin?: string) => {
      const pin = (rawPin ?? zipCode).replace(/\D/g, "").slice(0, 6);
      if (pin.length !== 6) {
        if ((rawPin ?? zipCode).trim()) {
          toast.error("Enter a valid 6-digit zip / PIN code");
        }
        return;
      }
      setLookupLoading(true);
      try {
        const details = await fetchAddressFromPincode(pin);
        setCountry(details.country || "India");
        setState(details.state);
        setCity(details.city);
        setTimezone(details.timezone);
        setStateOptions((prev) =>
          details.state && !prev.includes(details.state) ? [details.state, ...prev] : prev,
        );
        setCityOptions((prev) =>
          details.city && !prev.includes(details.city) ? [details.city, ...prev] : prev,
        );
        toast.success(`Address filled from PIN ${pin} (${details.city}, ${details.state})`);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "PIN lookup failed");
      } finally {
        setLookupLoading(false);
      }
    },
    [zipCode],
  );

  const handleSave = async () => {
    if (!outletName.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!phone.trim()) {
      toast.error("Phone is required");
      return;
    }
    if (!zipCode.trim() || !country.trim() || !state.trim() || !city.trim()) {
      toast.error("PIN code, country, state and city are required");
      return;
    }

    setSaving(true);
    try {
      const created = await createOutletFromForm({
        name: outletName.trim(),
        code: outletAlias.trim() || undefined,
        outlet_type: "PRIMARY",
        cuisine: cuisine.trim() || "Multi-Cuisine",
        email: email.trim() || undefined,
        phone: phone.trim(),
        ownerMobile: phone.trim(),
        alias: outletAlias.trim(),
        zipCode: zipCode.trim(),
        country,
        state,
        city,
        timezone,
        address: address.trim(),
        is_active: isActive,
      });
      toast.success(`Outlet "${created.name}" registered successfully!`);
      // Redirect directly to the setup hub for the newly created outlet
      window.location.href = `/pos/management/configuration/outlet?outletId=${encodeURIComponent(created.id)}`;
    } catch (err: unknown) {
      const message =
        (err as { message?: string; data?: { detail?: string; code?: string[] } })?.data
          ?.detail ||
        (err as { data?: { code?: string[] } })?.data?.code?.[0] ||
        (err as { message?: string })?.message ||
        "Failed to create outlet";
      toast.error(String(message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div>
        <h2 className="text-[18px] font-bold tracking-tight text-slate-900">
          Add New Outlet
        </h2>
        <p className="mt-1 text-[12.5px] text-slate-500 max-w-2xl">
          Create and configure a new dining or restaurant outlet. The outlet will instantly be selectable across POS and management.
        </p>
      </div>

      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-6">
        <div className="space-y-4">
          <h3 className="text-[15px] font-bold text-slate-900 border-b border-slate-100 pb-2">
            Outlet Details
          </h3>

          <div className="space-y-1.5">
            <label className="text-[12.5px] font-semibold text-slate-800">
              Outlet Name<span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              type="text"
              value={outletName}
              onChange={(e) => setOutletName(e.target.value)}
              placeholder="e.g. Bayview Restaurant & Lounge"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">Code / Alias</label>
              <input
                type="text"
                value={outletAlias}
                onChange={(e) => setOutletAlias(e.target.value)}
                placeholder="e.g. BV-01"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">Cuisine</label>
              <input
                type="text"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                placeholder="e.g. Multi-Cuisine, Italian, Cafe"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">
                Phone<span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9937012345"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. contact@outlet.com"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            Active
          </label>
        </div>

        <div className="space-y-4">
          <h3 className="text-[15px] font-bold text-slate-900 border-b border-slate-100 pb-2">
            Address
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">
                PIN code<span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={zipCode}
                  onChange={(e) => {
                    const next = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setZipCode(next);
                    if (next.length === 6) void lookupFromZip(next);
                  }}
                  placeholder="6-digit PIN"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] font-mono text-slate-800 focus:border-teal-500 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={lookupLoading || zipCode.replace(/\D/g, "").length !== 6}
                  onClick={() => void lookupFromZip()}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50 px-3 py-2 text-[12px] font-semibold text-teal-800 hover:bg-teal-100 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {lookupLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5" />
                  )}
                  Fetch
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">
                Country<span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none cursor-pointer"
                >
                  <option value="India">India</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">
                State<span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none cursor-pointer"
                >
                  <option value="">Select state</option>
                  {stateOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">
                City<span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none cursor-pointer"
                >
                  <option value="">Select city</option>
                  {cityOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">Timezone</label>
              <div className="relative">
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none cursor-pointer"
                >
                  <option value="Asia/Calcutta">Asia/Calcutta</option>
                  <option value="UTC">UTC</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12.5px] font-semibold text-slate-800">Address</label>
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Building, street, landmark details"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => void navigate({ to: "/pos/management/configuration/outlet/list" })}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="rounded-lg bg-teal-600 px-6 py-2 text-[12.5px] font-bold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save Outlet"}
          </button>
        </div>
      </div>
    </div>
  );
}
