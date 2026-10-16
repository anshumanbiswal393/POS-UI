import { useState, useMemo } from "react";
import {
  Save,
  CheckCircle2,
  Building,
  Percent,
  FileCheck,
  AlertCircle,
  ShieldCheck,
  Receipt,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { DataTableHeader, DataTableFooter, type DataTableColumn } from "@/components/common";
import { PosDataGrid } from "@/components/ui/data-grid";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import { exportToExcel } from "@/utils/exportUtils";

interface TaxSlabRecord {
  id: string;
  category: string;
  hsnSac: string;
  cgstRate: number;
  sgstRate: number;
  totalGst: number;
  cessRate: number;
  description: string;
  status: "Active" | "Exempted";
}

const TAX_SLABS: TaxSlabRecord[] = [
  {
    id: "ts-1",
    category: "Restaurant Dine-In (Food & Bev)",
    hsnSac: "996331",
    cgstRate: 2.5,
    sgstRate: 2.5,
    totalGst: 5.0,
    cessRate: 0,
    description: "Standard restaurant food supply without Input Tax Credit (ITC)",
    status: "Active",
  },
  {
    id: "ts-2",
    category: "Liquor Sales (State VAT / Excise)",
    hsnSac: "2203 / 2208",
    cgstRate: 0,
    sgstRate: 0,
    totalGst: 0,
    cessRate: 20.0,
    description: "Covered under State Excise VAT (Outside Central GST purview)",
    status: "Active",
  },
  {
    id: "ts-3",
    category: "Banquet & Event Catering",
    hsnSac: "996334",
    cgstRate: 9.0,
    sgstRate: 9.0,
    totalGst: 18.0,
    cessRate: 0,
    description: "Outdoor catering and banquet rental with Input Tax Credit eligibility",
    status: "Active",
  },
  {
    id: "ts-4",
    category: "Room Tariff (> ₹7,500/night)",
    hsnSac: "996311",
    cgstRate: 9.0,
    sgstRate: 9.0,
    totalGst: 18.0,
    cessRate: 0,
    description: "Luxury suite room accommodation tariff",
    status: "Active",
  },
  {
    id: "ts-5",
    category: "Packaged Confectionery Retail",
    hsnSac: "190590",
    cgstRate: 2.5,
    sgstRate: 2.5,
    totalGst: 5.0,
    cessRate: 0,
    description: "Packaged sweets, bread and confection retail",
    status: "Active",
  },
  {
    id: "ts-6",
    category: "Direct Delivery / Takeaway Pack",
    hsnSac: "996332",
    cgstRate: 2.5,
    sgstRate: 2.5,
    totalGst: 5.0,
    cessRate: 0,
    description: "Online order takeaway food packaging",
    status: "Active",
  },
];

export function GstInformationView() {
  const [hasGst, setHasGst] = useState<"Yes" | "No">("Yes");
  const [gstNumber, setGstNumber] = useState("21AAAAA0000A1Z5");
  const [registeredName, setRegisteredName] = useState("RETROD HOSPITALITY & RESORTS PVT LTD");
  const [registeredAddress, setRegisteredAddress] = useState(
    "PLOT NO 1977 KHATA NO 304/102, KARADAGADIA, Angul, Odisha, 759132"
  );
  const [state, setState] = useState("Odisha");
  const [city, setCity] = useState("Angul");
  const [vatNumber, setVatNumber] = useState("VAT-OD-2023-88192");
  const [pan, setPan] = useState("AAAAA0000A");
  const [cin, setCin] = useState("U55101OR2023PTC042891");
  const [zipCode, setZipCode] = useState("759132");

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Form Validation
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};

    if (hasGst === "Yes") {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstNumber.trim()) {
        errs.gstNumber = "GSTIN identification number is required.";
      } else if (!gstinRegex.test(gstNumber.trim().toUpperCase())) {
        errs.gstNumber = "Invalid GSTIN format (e.g. 21AAAAA0000A1Z5).";
      }
    }

    if (!registeredName.trim()) {
      errs.registeredName = "Registered legal business name is mandatory.";
    } else if (registeredName.trim().length < 3) {
      errs.registeredName = "Legal business name must be at least 3 characters.";
    }

    if (!registeredAddress.trim()) {
      errs.registeredAddress = "Principal place of business address is required.";
    } else if (registeredAddress.trim().length < 10) {
      errs.registeredAddress = "Enter full registered address (min 10 characters).";
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!pan.trim()) {
      errs.pan = "Permanent Account Number (PAN) is required.";
    } else if (!panRegex.test(pan.trim().toUpperCase())) {
      errs.pan = "Invalid 10-character PAN format (e.g. AAAAA0000A).";
    }

    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!zipCode.trim()) {
      errs.zipCode = "Postal PIN / Zip Code is required.";
    } else if (!pinRegex.test(zipCode.trim())) {
      errs.zipCode = "Enter a valid 6-digit Indian PIN code.";
    }

    return errs;
  }, [hasGst, gstNumber, registeredName, registeredAddress, pan, zipCode]);

  const isFormValid = Object.keys(errors).length === 0;

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setTouched({
        gstNumber: true,
        registeredName: true,
        registeredAddress: true,
        pan: true,
        zipCode: true,
      });
      toast.error("Please fill all required mandatory fields correctly.");
      return;
    }

    toast.success("GSTIN registration details and tax invoice headers saved successfully!");
  };

  // Tax Slabs Table
  const [selectedSlabIds, setSelectedSlabIds] = useState<string[]>([]);

  const slabColumns = useMemo(
    () => [
      {
        id: "category",
        header: "Tax Category / Service Supply",
        label: "Tax Category / Service Supply",
        sortable: true,
        filterable: true,
        width: 220,
        render: (_: any, r: TaxSlabRecord) => (
          <span className="font-semibold text-slate-900">{r.category}</span>
        ),
        getValue: (r: TaxSlabRecord) => r.category,
      },
      {
        id: "hsnSac",
        header: "HSN / SAC",
        label: "HSN / SAC",
        sortable: true,
        filterable: true,
        width: 100,
        render: (_: any, r: TaxSlabRecord) => (
          <span className="font-mono text-slate-600 font-bold">{r.hsnSac}</span>
        ),
        getValue: (r: TaxSlabRecord) => r.hsnSac,
      },
      {
        id: "cgstRate",
        header: "CGST",
        label: "CGST",
        align: "right" as const,
        sortable: true,
        width: 70,
        render: (_: any, r: TaxSlabRecord) => (
          <span className="font-mono text-slate-800">{r.cgstRate}%</span>
        ),
        getValue: (r: TaxSlabRecord) => `${r.cgstRate}%`,
      },
      {
        id: "sgstRate",
        header: "SGST",
        label: "SGST",
        align: "right" as const,
        sortable: true,
        width: 70,
        render: (_: any, r: TaxSlabRecord) => (
          <span className="font-mono text-slate-800">{r.sgstRate}%</span>
        ),
        getValue: (r: TaxSlabRecord) => `${r.sgstRate}%`,
      },
      {
        id: "totalGst",
        header: "GST Rate",
        label: "GST Rate",
        align: "right" as const,
        sortable: true,
        width: 85,
        render: (_: any, r: TaxSlabRecord) => (
          <span className="font-mono font-bold text-teal-700">{r.totalGst}%</span>
        ),
        getValue: (r: TaxSlabRecord) => `${r.totalGst}%`,
      },
      {
        id: "description",
        header: "Applicability Rules",
        label: "Applicability Rules",
        sortable: false,
        width: 200,
        render: (_: any, r: TaxSlabRecord) => (
          <span className="text-slate-500 text-[11.5px]">{r.description}</span>
        ),
        getValue: (r: TaxSlabRecord) => r.description,
      },
    ],
    []
  );

  return (
    <div className="w-full space-y-4">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
            GST & Statutory Business Tax Profile
          </h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Configure restaurant GSTIN registration, tax invoice legal headers, and live HSN/SAC rate slabs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[12px] font-bold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Verified GSTIN Active
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider">GSTIN Status</p>
            <h3 className="text-base font-bold font-mono text-slate-900 mt-1">
              {hasGst === "Yes" ? "Regular Taxpayer" : "Unregistered"}
            </h3>
            <p className="text-[11px] text-teal-600 mt-0.5">State: 21 (Odisha)</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Building className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider">Restaurant GST Rate</p>
            <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">5.0%</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">2.5% CGST + 2.5% SGST</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Percent className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider">State Liquor VAT</p>
            <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">20.0%</h3>
            <p className="text-[11px] text-amber-600 mt-0.5">FL-4 Bar Excise Levy</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider">GSTR Filing</p>
            <h3 className="text-base font-bold font-mono text-slate-900 mt-1">GSTR-1 & 3B</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Auto-Reconciled</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <FileCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Two-Column Side-by-Side Layout: Left = GST Form, Right = Tax Slabs Table */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: GST Fill Form */}
        <div className="xl:col-span-6 space-y-4">
          <form onSubmit={handleSave} className="rounded-2xl border border-slate-300 bg-white p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-teal-600" />
                  Statutory GST Registration Details
                </h3>
                <p className="text-[11.5px] text-slate-500">Legal entity information printed on tax receipts.</p>
              </div>
            </div>

            {/* Do you have GST No? */}
            <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
              <label className="text-[12.5px] font-bold text-slate-900">
                Do you have GSTIN Registration? <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-[12.5px] font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="hasGst"
                    checked={hasGst === "Yes"}
                    onChange={() => setHasGst("Yes")}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  Yes (Regular GST Registered)
                </label>
                <label className="flex items-center gap-2 text-[12.5px] font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="hasGst"
                    checked={hasGst === "No"}
                    onChange={() => setHasGst("No")}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  No (Exempted)
                </label>
              </div>
            </div>

            {hasGst === "Yes" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-800">
                    GSTIN Number <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 21AAAAA0000A1Z5"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    onBlur={() => handleBlur("gstNumber")}
                    className={`w-full rounded-lg border bg-white px-3 py-1.5 text-[12.5px] font-mono font-bold uppercase text-slate-900 focus:outline-none ${
                      touched.gstNumber && errors.gstNumber
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-300 focus:border-teal-500"
                    }`}
                  />
                  {touched.gstNumber && errors.gstNumber && (
                    <div className="flex items-center gap-1 text-[11px] font-medium text-rose-600">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{errors.gstNumber}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-800">
                    PAN Number <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="e.g. AAAAA0000A"
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    onBlur={() => handleBlur("pan")}
                    className={`w-full rounded-lg border bg-white px-3 py-1.5 text-[12.5px] font-mono font-bold uppercase text-slate-900 focus:outline-none ${
                      touched.pan && errors.pan
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-300 focus:border-teal-500"
                    }`}
                  />
                  {touched.pan && errors.pan && (
                    <div className="flex items-center gap-1 text-[11px] font-medium text-rose-600">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{errors.pan}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Registered Legal Name */}
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-slate-800">
                Registered Legal Name For Invoice Header <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={registeredName}
                onChange={(e) => setRegisteredName(e.target.value)}
                onBlur={() => handleBlur("registeredName")}
                className={`w-full rounded-lg border bg-white px-3 py-1.5 text-[12.5px] text-slate-900 focus:outline-none ${
                  touched.registeredName && errors.registeredName
                    ? "border-rose-400 focus:border-rose-500"
                    : "border-slate-300 focus:border-teal-500"
                }`}
              />
              {touched.registeredName && errors.registeredName && (
                <div className="flex items-center gap-1 text-[11px] font-medium text-rose-600">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{errors.registeredName}</span>
                </div>
              )}
            </div>

            {/* Registered Address */}
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-slate-800">
                Principal Place of Business Registered Address <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              <textarea
                rows={2}
                value={registeredAddress}
                onChange={(e) => setRegisteredAddress(e.target.value)}
                onBlur={() => handleBlur("registeredAddress")}
                className={`w-full rounded-lg border bg-white px-3 py-1.5 text-[12.5px] text-slate-900 focus:outline-none ${
                  touched.registeredAddress && errors.registeredAddress
                    ? "border-rose-400 focus:border-rose-500"
                    : "border-slate-300 focus:border-teal-500"
                }`}
              />
              {touched.registeredAddress && errors.registeredAddress && (
                <div className="flex items-center gap-1 text-[11px] font-medium text-rose-600">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{errors.registeredAddress}</span>
                </div>
              )}
            </div>

            {/* State, City & PIN */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-slate-800">State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] text-slate-900 focus:border-teal-500 focus:outline-none cursor-pointer"
                >
                  <option value="Odisha">Odisha (21)</option>
                  <option value="Maharashtra">Maharashtra (27)</option>
                  <option value="Karnataka">Karnataka (29)</option>
                  <option value="Delhi">Delhi (07)</option>
                  <option value="Gujarat">Gujarat (24)</option>
                  <option value="West Bengal">West Bengal (19)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-slate-800">City / District</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-slate-800">
                  PIN Code <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  onBlur={() => handleBlur("zipCode")}
                  className={`w-full rounded-lg border bg-white px-3 py-1.5 text-[12.5px] font-mono text-slate-900 focus:outline-none ${
                    touched.zipCode && errors.zipCode
                      ? "border-rose-400 focus:border-rose-500"
                      : "border-slate-300 focus:border-teal-500"
                  }`}
                />
                {touched.zipCode && errors.zipCode && (
                  <div className="flex items-center gap-1 text-[11px] font-medium text-rose-600">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{errors.zipCode}</span>
                  </div>
                )}
              </div>
            </div>

            {/* State VAT & Corporate CIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-slate-800">State Liquor VAT / Excise No.</label>
                <input
                  type="text"
                  placeholder="e.g. VAT-OD-2023-88192"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-slate-800">Corporate CIN / Reg No.</label>
                <input
                  type="text"
                  placeholder="e.g. U55101OR2023PTC042891"
                  value={cin}
                  onChange={(e) => setCin(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="border-t border-slate-100 pt-3 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => toast.info("Reverted to saved tax profile.")}
                className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={!isFormValid}
                className={`flex items-center gap-1.5 rounded-lg px-5 py-1.5 text-[12px] font-bold transition shadow-xs ${
                  isFormValid
                    ? "bg-teal-600 text-white hover:bg-teal-700 cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Save className="h-3.5 w-3.5" />
                Save GST Profile
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: HSN / SAC Tax Slabs & Rate Configuration Table */}
        <div className="xl:col-span-6 space-y-3">
          <div className="rounded-2xl border border-slate-300 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-slate-200 p-4 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-teal-600" />
                  HSN / SAC Tax Slabs & Rates
                </h3>
                <p className="text-[11.5px] text-slate-500">Preset tax slabs mapped to POS menu items & billing.</p>
              </div>
              <ExportToExcelButton
                onClick={() => {
                  exportToExcel(
                    TAX_SLABS.map((s) => ({
                      Category: s.category,
                      "HSN / SAC": s.hsnSac,
                      "CGST (%)": `${s.cgstRate}%`,
                      "SGST (%)": `${s.sgstRate}%`,
                      "Total GST (%)": `${s.totalGst}%`,
                      "Cess (%)": `${s.cessRate}%`,
                      Description: s.description,
                      Status: s.status,
                    })),
                    `GST_Tax_Slabs_Master_${new Date().toISOString().slice(0, 10)}`,
                    { title: "GST HSN / SAC Tax Slabs Master Configuration" }
                  );
                  toast.success("Exported tax slab rates to Excel");
                }}
              />
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <PosDataGrid
                data={TAX_SLABS}
                columns={slabColumns}
                keyField="id"
                selectable={false}
                storageKey="pos-accounting-gst-slabs"
                pageSize={5}
                themeVariant="primary"
                emptyMessage="No tax slabs registered."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
