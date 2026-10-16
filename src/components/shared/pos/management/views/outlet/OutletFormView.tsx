import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, MapPin, ExternalLink, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useOutletContext } from "@/context/PosOutletContext";
import { fetchAddressFromPincode } from "@/utils/pincodeLookup";

interface OutletFormProps {
  type: "HO" | "Kitchen";
}

export function OutletFormView({ type }: OutletFormProps) {
  const navigate = useNavigate();
  const { createOutletFromForm } = useOutletContext();
  const [saving, setSaving] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
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
  ]);

  // Outlet Information — blank for new HO / Kitchen
  const [outletName, setOutletName] = useState("");
  const [outletAlias, setOutletAlias] = useState("");
  const [email, setEmail] = useState("");

  // Address Information
  const [country, setCountry] = useState("India");
  const [landmark, setLandmark] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [fax, setFax] = useState("");
  const [tinNo, setTinNo] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [timezone, setTimezone] = useState("Asia/Calcutta");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Kitchen specific fields
  const [kitchenCode, setKitchenCode] = useState("");
  const [hsnMandatory, setHsnMandatory] = useState(true);
  const [servingType, setServingType] = useState<"Service" | "Goods" | "Both">("Service");
  const [enableKotOnline, setEnableKotOnline] = useState(false);
  const [managerPhone, setManagerPhone] = useState("");

  // HO specific fields
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [cuisines, setCuisines] = useState("");
  const [seatingCapacity, setSeatingCapacity] = useState("");
  const [decisionMaker, setDecisionMaker] = useState("");

  // Communication Details
  const [ownerMobile, setOwnerMobile] = useState("");
  const [directNumber, setDirectNumber] = useState("");

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
        setArea((prev) => prev.trim() || details.area);
        setLandmark((prev) => prev.trim() || details.area);
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
      toast.error("Outlet name is required");
      return;
    }
    if (!zipCode.trim() || !country.trim() || !state.trim() || !city.trim()) {
      toast.error("Zip code, country, state and city are required");
      return;
    }
    if (!ownerMobile.trim() || !directNumber.trim()) {
      toast.error("Owner mobile and direct number are required");
      return;
    }

    setSaving(true);
    try {
      const created = await createOutletFromForm({
        name: outletName.trim(),
        code: outletAlias.trim() || undefined,
        outlet_type: type === "HO" ? "HO" : "KITCHEN",
        formType: type,
        cuisine: cuisines.trim() || (type === "HO" ? "Head Office" : "Central Kitchen"),
        email: email.trim() || undefined,
        phone: ownerMobile.trim(),
        alias: outletAlias.trim(),
        landmark: landmark.trim(),
        zipCode: zipCode.trim(),
        fax: fax.trim(),
        tinNo: tinNo.trim(),
        country,
        state,
        city,
        timezone,
        address: address.trim(),
        area: area.trim(),
        latitude: latitude.trim(),
        longitude: longitude.trim(),
        ownerMobile: ownerMobile.trim(),
        directNumber: directNumber.trim(),
        decisionMaker: decisionMaker.trim(),
        kitchenCode: kitchenCode.trim() || outletAlias.trim(),
        seatingCapacity: seatingCapacity.trim(),
        additionalInfo: additionalInfo.trim(),
        is_active: true,
      });
      toast.success(
        `${type === "HO" ? "Head Office" : "Central Kitchen"} "${created.name}" saved to database`,
      );
      void navigate({ to: "/pos/menu" });
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
    <div className="w-full max-w-none space-y-4">
      {/* 1. Header Instruction Bar */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-[13px] text-slate-700 font-medium shadow-2xs">
        Below are the configuration to manage your outlet information. Click on the Save button once
        you change the information. Enter a 6-digit Zip Code to auto-fill state, city, and area.
      </div>

      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-8">
        {/* =========================================================================
            SECTION 1: Outlet Information
        ========================================================================= */}
        <div className="space-y-4">
          <h3 className="text-[16px] font-bold text-slate-900 border-b border-slate-100 pb-2">
            Outlet Information
          </h3>

          <div className="space-y-1.5">
            <label className="text-[12.5px] font-semibold text-slate-800">
              Outlet Name<span className="text-rose-500 font-bold">*</span> :
            </label>
            <input
              type="text"
              value={outletName}
              onChange={(e) => setOutletName(e.target.value)}
              placeholder={type === "HO" ? "e.g. My Head Office" : "e.g. Central Kitchen"}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
            />
            <p className="text-[11.5px] text-slate-500">
              You can not change the name of created outlet. Contact Retrod support for help.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12.5px] font-semibold text-slate-800">Outlet Alias :</label>
            <input
              type="text"
              value={outletAlias}
              onChange={(e) => setOutletAlias(e.target.value)}
              placeholder={type === "HO" ? "e.g. HQ-01" : "e.g. CK-01"}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12.5px] font-semibold text-slate-800">Email :</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@yourhotel.com"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
            />
            <p className="text-[11.5px] text-slate-500">
              Enter Email ID through which you will receive all communications from Retrod.
            </p>
          </div>
        </div>

        {/* =========================================================================
            SECTION 2: Address Information
        ========================================================================= */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-[16px] font-bold text-slate-900">Address Information</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Enter physical location of your outlet. Provide your ZipCode and State accurately for
              GST calculation whenever applicable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">Landmark :</label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">
                Zip Code<span className="text-rose-500 font-bold">*</span> :
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
                    if (next.length === 6) {
                      void lookupFromZip(next);
                    }
                  }}
                  onBlur={() => {
                    if (zipCode.replace(/\D/g, "").length === 6) {
                      void lookupFromZip(zipCode);
                    }
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
              <p className="text-[11.5px] text-slate-500">
                Auto-fills Country, State, City, Area, and Timezone from the PIN code.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">Fax :</label>
              <input
                type="text"
                value={fax}
                onChange={(e) => setFax(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">Tin No. :</label>
              <input
                type="text"
                value={tinNo}
                onChange={(e) => setTinNo(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Country (shown on HO) */}
          {type === "HO" && (
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">
                Country<span className="text-rose-500 font-bold">*</span> :
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
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">
                State<span className="text-rose-500 font-bold">*</span> :
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
                City<span className="text-rose-500 font-bold">*</span> :
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
              <label className="text-[12.5px] font-semibold text-slate-800">Timezone :</label>
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
            <label className="text-[12.5px] font-semibold text-slate-800">
              Address<span className="text-rose-500 font-bold">*</span> :
            </label>
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12.5px] font-semibold text-slate-800">
              Area<span className="text-rose-500 font-bold">*</span> :
            </label>
            <textarea
              rows={3}
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Location Finders */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setLatitude("20.8444");
                setLongitude("85.1511");
                toast.success("Coordinates acquired from current GPS location");
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              <MapPin className="h-3.5 w-3.5 text-teal-600" />
              Find Current Location
            </button>

            <button
              type="button"
              onClick={() => {
                setLatitude("20.8444");
                setLongitude("85.1511");
                toast.success("Geocoded coordinates from postal address");
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              Find Location From Address
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">
                Latitude<span className="text-rose-500 font-bold">*</span> :
              </label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] font-mono text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">
                Longitude<span className="text-rose-500 font-bold">*</span> :
              </label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] font-mono text-slate-800 focus:border-teal-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => toast.info("Opening map viewer at coordinates")}
                className="text-[11.5px] text-teal-600 hover:underline block pt-0.5 cursor-pointer"
              >
                See location on map
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 3A: Kitchen Specific Fields (Screenshots 1 & 2)
        ========================================================================= */}
        {type === "Kitchen" && (
          <div className="space-y-5 border-t border-slate-100 pt-5">
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">Code :</label>
              <input
                type="text"
                placeholder="Third-party kitchen code"
                value={kitchenCode}
                onChange={(e) => setKitchenCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
              />
              <p className="text-[11.5px] text-slate-500">
                It will be use for communication with third party.
              </p>
            </div>

            {/* HSN Mandatory Item level */}
            <div className="flex items-center gap-2">
              <label className="text-[12.5px] font-semibold text-slate-800 min-w-[200px]">
                HSN Mandatory Item level :
              </label>
              <input
                type="checkbox"
                checked={hsnMandatory}
                onChange={(e) => setHsnMandatory(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
            </div>

            {/* Outlet Serving Type */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-6">
                <span className="text-[12.5px] font-semibold text-slate-800 min-w-[180px]">
                  Outlet Serving Type :
                </span>
                <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="servingType"
                    checked={servingType === "Service"}
                    onChange={() => setServingType("Service")}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  Service
                </label>
                <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="servingType"
                    checked={servingType === "Goods"}
                    onChange={() => setServingType("Goods")}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  Goods
                </label>
                <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="servingType"
                    checked={servingType === "Both"}
                    onChange={() => setServingType("Both")}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  Both
                </label>
              </div>
              <p className="text-[11.5px] text-slate-500">
                Note: In case if &quot;Both&quot; option is selected, then in an invoice if both
                (goods and services ) type of items are available then the master tax of items
                tagged as service would be calculated.
              </p>
            </div>

            {/* Enable KOT for online order */}
            <div className="flex items-center gap-6">
              <span className="text-[12.5px] font-semibold text-slate-800 min-w-[180px]">
                Enable KOT for online order :
              </span>
              <input
                type="checkbox"
                checked={enableKotOnline}
                onChange={(e) => setEnableKotOnline(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 3B: Head Office Specific Fields (Screenshot 4)
        ========================================================================= */}
        {type === "HO" && (
          <div className="space-y-5 border-t border-slate-100 pt-5">
            <h3 className="text-[16px] font-bold text-slate-900 border-b border-slate-100 pb-2">
              Additional Information
            </h3>

            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">
                Additional Info :
              </label>
              <textarea
                rows={3}
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12.5px] font-semibold text-slate-800">Cuisines :</label>
                <div className="relative">
                  <select
                    value={cuisines}
                    onChange={(e) => setCuisines(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">Select Cuisines</option>
                    <option value="North Indian">North Indian</option>
                    <option value="South Indian">South Indian</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Continental">Continental</option>
                    <option value="Multi-Cuisine">Multi-Cuisine</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12.5px] font-semibold text-slate-800">
                  Seating Capacity :
                </label>
                <div className="relative">
                  <select
                    value={seatingCapacity}
                    onChange={(e) => setSeatingCapacity(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">Select Capacity</option>
                    <option value="1-50">1 - 50 Seats</option>
                    <option value="51-100">51 - 100 Seats</option>
                    <option value="101-200">101 - 200 Seats</option>
                    <option value="200+">200+ Seats</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">Logo :</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  className="text-[12.5px] text-slate-600 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[12px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
              </div>
              <p className="text-[11.5px] text-slate-500">Upload only png, jpeg or jpg file</p>
            </div>

            {/* Images Upload */}
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">Images :</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="text-[12.5px] text-slate-600 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[12px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 4: Communication Details (Screenshots 1, 2, 5)
        ========================================================================= */}
        <div className="space-y-5 border-t border-slate-100 pt-5">
          <h3 className="text-[16px] font-bold text-slate-900 border-b border-slate-100 pb-2">
            Communication Details :
          </h3>

          {/* Manager's Phone Number (Shown on Kitchen) */}
          {type === "Kitchen" && (
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">
                Manager&apos;s Phone Number :
              </label>
              <input
                type="text"
                placeholder="e.g. 9876543210"
                value={managerPhone}
                onChange={(e) => setManagerPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
              />
              <p className="text-[11.5px] text-slate-500">
                <span className="text-rose-600 font-medium">
                  Note: You can add more than one with , separated.
                </span>{" "}
                Provide contact details of Manager who manages the outlet. ( comma separated if
                multiple )
              </p>
            </div>
          )}

          {/* Owner Mobile No. */}
          <div className="space-y-1.5">
            <label className="text-[12.5px] font-semibold text-slate-800">
              Owner Mobile No. <span className="text-rose-500 font-bold">*</span> :
            </label>
            <input
              type="text"
              placeholder="e.g. 9937012345"
              value={ownerMobile}
              onChange={(e) => setOwnerMobile(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
            />
            <p className="text-[11.5px] text-slate-500">
              <span className="text-rose-600 font-medium">
                Note: You can add more than one with , separated.
              </span>{" "}
              Provide contact details ( comma separated if multiple ) to reach.
            </p>
          </div>

          {/* Direct Number */}
          <div className="space-y-1.5">
            <label className="text-[12.5px] font-semibold text-slate-800">
              Direct Number <span className="text-rose-500 font-bold">*</span> :
            </label>
            <input
              type="text"
              placeholder="e.g. 06764-230000"
              value={directNumber}
              onChange={(e) => setDirectNumber(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
            />
            <p className="text-[11.5px] text-slate-500">
              <span className="text-rose-600 font-medium">
                Note: You can add more than one with , separated.
              </span>{" "}
              Provide a direct mobile number for Retrod support to reach in case of any Point of
              Sale related support. ( Comma separated if multiple )
            </p>
          </div>

          {/* Decision Maker (Shown on HO - Screenshot 5) */}
          {type === "HO" && (
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-slate-800">Decision Maker :</label>
              <input
                type="text"
                placeholder="e.g. Mr. Kailash Rao (Managing Partner)"
                value={decisionMaker}
                onChange={(e) => setDecisionMaker(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* =========================================================================
            BOTTOM ACTION BAR (Matching all Screenshots)
        ========================================================================= */}
        <div className="border-t border-slate-100 pt-4 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => toast.info("Discarded outlet changes")}
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
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
