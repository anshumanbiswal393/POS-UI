import { useState, useMemo } from "react";
import {
  CheckCircle2,
  Check,
  Eye,
  Printer,
  Download,
  FileText,
  Sliders,
  Sparkles,
  Building2,
  Receipt,
  Layers,
  ZoomIn,
  ZoomOut,
  QrCode,
  ShieldCheck,
  Truck,
  RotateCcw,
  Palette,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { useOutletContext } from "@/context/PosOutletContext";

export type InvoiceTemplateId =
  | "gst_tax"
  | "modern_clean"
  | "executive_letterhead"
  | "compact_thermal"
  | "dispatch_challan"
  | "hospitality_guest";

interface InvoiceTemplateConfig {
  id: InvoiceTemplateId;
  name: string;
  subtitle: string;
  badge: string;
  category: string;
  accentColor: string;
  headerBg: string;
}

const INVOICE_TEMPLATES: InvoiceTemplateConfig[] = [
  {
    id: "gst_tax",
    name: "Standard GST Tax Invoice",
    subtitle: "Full HSN/SAC, GSTIN, CGST & SGST tax breakup",
    badge: "GST / B2B Compliant",
    category: "Official",
    accentColor: "#0f766e",
    headerBg: "bg-teal-700 text-white",
  },
  {
    id: "modern_clean",
    name: "Modern Minimalist",
    subtitle: "Clean grid layout with instant UPI QR & terms",
    badge: "Contemporary",
    category: "Modern",
    accentColor: "#2563eb",
    headerBg: "bg-slate-900 text-white",
  },
  {
    id: "executive_letterhead",
    name: "Executive Letterhead",
    subtitle: "Two-tone corporate banner with PO ref & seal",
    badge: "Corporate / B2B",
    category: "Formal",
    accentColor: "#1e293b",
    headerBg: "bg-gradient-to-r from-slate-900 to-slate-800 text-white",
  },
  {
    id: "compact_thermal",
    name: "80mm POS Thermal Slip",
    subtitle: "High-density receipt format for roll printers",
    badge: "Thermal / Counter",
    category: "Receipt",
    accentColor: "#c2410c",
    headerBg: "bg-stone-800 text-white",
  },
  {
    id: "dispatch_challan",
    name: "Stock Dispatch & Transfer",
    subtitle: "Batch, UOM, transporter info & receiver sign",
    badge: "Inventory / Logistics",
    category: "Transfer",
    accentColor: "#7c3aed",
    headerBg: "bg-indigo-900 text-white",
  },
  {
    id: "hospitality_guest",
    name: "Hospitality Guest Folio",
    subtitle: "Table, Captain, Service Charge & F&B breakdown",
    badge: "Dine-In / Guest",
    category: "Hospitality",
    accentColor: "#b45309",
    headerBg: "bg-amber-900 text-amber-100",
  },
];

export function InvoiceTemplatesView() {
  const { activeOutlet } = useOutletContext();

  const [activeTab, setActiveTab] = useState<"purchase" | "po" | "sales" | "transfer">("purchase");

  // Selected template per transaction type
  const [templateMap, setTemplateMap] = useState<Record<string, InvoiceTemplateId>>({
    purchase: "gst_tax",
    po: "executive_letterhead",
    sales: "modern_clean",
    transfer: "dispatch_challan",
  });

  const selectedTemplate = templateMap[activeTab] || "gst_tax";

  // Customizer Controls
  const [companyName, setCompanyName] = useState(activeOutlet.name || "Retrod Fine Dining & Bar");
  const [gstin, setGstin] = useState("27AABCR8492Q1ZV");
  const [fssaiNo, setFssaiNo] = useState("11521056000428");
  const [address, setAddress] = useState(
    activeOutlet.address || "Plot 42, Bandra Kurla Complex, Mumbai, MH 400051",
  );
  const [contactPhone, setContactPhone] = useState(activeOutlet.contact || "+91 98200 12345");
  const [emailContact, setEmailContact] = useState("accounts@retrodhospitality.com");
  const [termsText, setTermsText] = useState(
    "1. Goods once sold will not be taken back.\n2. Payment due within 15 days of invoice date.\n3. Subject to local jurisdiction.",
  );

  // Toggles
  const [showHsn, setShowHsn] = useState(true);
  const [showGstBreakup, setShowGstBreakup] = useState(true);
  const [showBankDetails, setShowBankDetails] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [showTerms, setShowTerms] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);

  const tabs = [
    { id: "purchase", label: "Purchase Inward", desc: "Vendor stock purchase bills" },
    { id: "po", label: "Purchase Order (PO)", desc: "Procurement purchase orders" },
    { id: "sales", label: "Sales & B2B Invoices", desc: "Customer bills & catering invoices" },
    { id: "transfer", label: "Stock Transfer Challan", desc: "Inter-outlet transfer slips" },
  ] as const;

  const handleSelectTemplate = (id: InvoiceTemplateId, name: string) => {
    setTemplateMap((prev) => ({ ...prev, [activeTab]: id }));
    toast.success(`"${name}" set as active template for ${tabs.find((t) => t.id === activeTab)?.label}`);
  };

  const handlePrint = () => {
    toast.info("Opening print dialog for invoice sample...");
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Sample items based on active tab
  const sampleItems = useMemo(() => {
    switch (activeTab) {
      case "purchase":
        return [
          { name: "Basmati Rice Royal Classic", hsn: "100630", qty: 50, uom: "KG", rate: 110, taxRate: 5 },
          { name: "Pure Cow Ghee Premium Tin", hsn: "040590", qty: 15, uom: "LTR", rate: 620, taxRate: 12 },
          { name: "Amul Fresh Cream (1L Pack)", hsn: "040120", qty: 24, uom: "PKT", rate: 210, taxRate: 5 },
          { name: "Paneer Fresh Malai Block", hsn: "040610", qty: 30, uom: "KG", rate: 360, taxRate: 5 },
          { name: "Kashmiri Red Chilli Whole", hsn: "090421", qty: 10, uom: "KG", rate: 450, taxRate: 5 },
        ];
      case "po":
        return [
          { name: "Farm Fresh Chicken Breast Boneless", hsn: "020712", qty: 40, uom: "KG", rate: 260, taxRate: 5 },
          { name: "Jumbo Tiger Prawns Grade A", hsn: "030617", qty: 12, uom: "KG", rate: 850, taxRate: 5 },
          { name: "Refined Sunflower Cooking Oil", hsn: "151219", qty: 60, uom: "LTR", rate: 145, taxRate: 5 },
          { name: "Garlic Peeled Premium Bulk", hsn: "070320", qty: 25, uom: "KG", rate: 180, taxRate: 5 },
        ];
      case "transfer":
        return [
          { name: "Marinated Butter Chicken Gravy Base", hsn: "210390", qty: 20, uom: "LTR", rate: 280, taxRate: 0 },
          { name: "Dum Biryani Spice Mix Blend", hsn: "091091", qty: 15, uom: "KG", rate: 380, taxRate: 0 },
          { name: "Signature Tandoori Masala Pre-mix", hsn: "091091", qty: 10, uom: "KG", rate: 420, taxRate: 0 },
          { name: "Cleaned Vegetable Pre-Cut Packs", hsn: "071290", qty: 35, uom: "KG", rate: 95, taxRate: 0 },
        ];
      case "sales":
      default:
        return [
          { name: "Murgh Dum Handi Biryani (Family Pack)", hsn: "996331", qty: 3, uom: "PORTION", rate: 650, taxRate: 5 },
          { name: "Paneer Tikka Angare Platter", hsn: "996331", qty: 4, uom: "PORTION", rate: 420, taxRate: 5 },
          { name: "Dal Makhani Grand Reserve", hsn: "996331", qty: 3, uom: "PORTION", rate: 380, taxRate: 5 },
          { name: "Assorted Tandoori Bread Basket", hsn: "996331", qty: 5, uom: "BASKET", rate: 220, taxRate: 5 },
          { name: "Artisanal Mocktail Berry Punch", hsn: "996332", qty: 6, uom: "GLASS", rate: 195, taxRate: 18 },
        ];
    }
  }, [activeTab]);

  // Calculations
  const calculatedItems = useMemo(() => {
    return sampleItems.map((item) => {
      const taxable = item.qty * item.rate;
      const taxAmount = (taxable * item.taxRate) / 100;
      const cgst = taxAmount / 2;
      const sgst = taxAmount / 2;
      const total = taxable + taxAmount;
      return {
        ...item,
        taxable,
        cgst,
        sgst,
        taxAmount,
        total,
      };
    });
  }, [sampleItems]);

  const subtotal = calculatedItems.reduce((acc, i) => acc + i.taxable, 0);
  const totalCgst = calculatedItems.reduce((acc, i) => acc + i.cgst, 0);
  const totalSgst = calculatedItems.reduce((acc, i) => acc + i.sgst, 0);
  const grandTotal = subtotal + totalCgst + totalSgst;

  return (
    <div className="space-y-5">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs no-print">
        <div>
          <h2 className="text-[17px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="h-5 w-5 text-teal-600" />
            Stock & Inventory Invoice Format Studio
          </h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Configure, preview, and customize printable invoice formats for Purchase, Orders, Sales, and Stock Transfers.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 px-4 py-2 text-[12.5px] font-bold text-white shadow-2xs transition cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print Sample Invoice
          </button>
        </div>
      </div>

      {/* 2. Transaction Flow Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 bg-white rounded-xl px-2 py-1 shadow-2xs no-print">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const assignedTpl = INVOICE_TEMPLATES.find((t) => t.id === templateMap[tab.id])?.name || "Standard";
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col px-5 py-2.5 rounded-lg text-left transition cursor-pointer shrink-0 border-b-2 ${
                isActive
                  ? "border-teal-600 bg-teal-50/50 text-teal-900 font-bold"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div className="text-[13px] font-bold flex items-center gap-1.5">
                <span>{tab.label}</span>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                Active: <span className="font-semibold text-slate-700">{assignedTpl}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Peach Styled Template Selector Cards (6 Designs) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3 no-print">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[14.5px] font-bold text-slate-900 flex items-center gap-2">
              <Palette className="h-4.5 w-4.5 text-orange-600" />
              Select Invoice Design Template for {tabs.find((t) => t.id === activeTab)?.label}
            </h3>
            <p className="text-[12px] text-slate-500">
              Choose from 6 professionally engineered invoice layouts with statutory GST compliance and custom header branding.
            </p>
          </div>
          <span className="text-[11px] font-bold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-md">
            {INVOICE_TEMPLATES.length} Formats Available
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {INVOICE_TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplate === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tmpl.id, tmpl.name)}
                className={`relative rounded-xl border-2 p-3 text-left transition cursor-pointer flex flex-col justify-between min-h-[160px] ${
                  isSelected
                    ? "border-orange-500 bg-gradient-to-br from-orange-100 via-amber-100/90 to-orange-100 ring-3 ring-orange-400/35 shadow-sm text-orange-950"
                    : "border-orange-200/80 bg-gradient-to-br from-orange-50/90 via-amber-50/70 to-orange-50/50 hover:border-orange-400 hover:bg-orange-100/60 shadow-2xs hover:shadow-xs text-orange-950"
                }`}
              >
                <div>
                  {/* Header Badge Row */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded bg-orange-200/80 border border-orange-300/60 px-1.5 py-0.5 text-[9px] font-bold text-orange-900">
                      {tmpl.badge}
                    </span>
                    {isSelected ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-white text-[10px] font-bold shadow-xs">
                        ✓
                      </span>
                    ) : null}
                  </div>

                  {/* Miniature Skeleton Graphic matching style */}
                  <div className="w-full h-14 bg-white/90 rounded-md border border-orange-200/70 p-1.5 space-y-1 overflow-hidden pointer-events-none mb-2.5">
                    {/* Header bar */}
                    <div
                      className="h-2 rounded-xs w-full"
                      style={{ backgroundColor: tmpl.accentColor }}
                    />
                    {/* Customer Info row */}
                    <div className="flex justify-between">
                      <div className="h-1.5 w-1/3 bg-orange-200/80 rounded-xs" />
                      <div className="h-1.5 w-1/4 bg-orange-200/60 rounded-xs" />
                    </div>
                    {/* Item lines */}
                    <div className="space-y-0.5 pt-0.5">
                      <div className="flex justify-between">
                        <div className="h-1 w-1/2 bg-orange-300/60 rounded-xs" />
                        <div className="h-1 w-1/5 bg-orange-300/60 rounded-xs" />
                      </div>
                      <div className="flex justify-between">
                        <div className="h-1 w-2/5 bg-orange-200/60 rounded-xs" />
                        <div className="h-1 w-1/5 bg-orange-200/60 rounded-xs" />
                      </div>
                    </div>
                    {/* Total bar */}
                    <div className="border-t border-orange-200/80 pt-0.5 flex justify-end">
                      <div
                        className="h-1.5 w-1/3 rounded-xs"
                        style={{ backgroundColor: tmpl.accentColor }}
                      />
                    </div>
                  </div>

                  <div className="text-[12.5px] font-bold text-orange-950 leading-tight">
                    {tmpl.name}
                  </div>
                  <div className="text-[10.5px] text-orange-900/80 mt-0.5 line-clamp-2">
                    {tmpl.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Main Two-Column Studio: Customizer Controls (Left) & Live Printable Sheet (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customizer Controls (4 Cols) */}
        <div className="lg:col-span-4 space-y-4 no-print">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-[13.5px] font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-teal-600" />
                Invoice Field Customizer
              </h4>
              <button
                type="button"
                onClick={() => {
                  setCompanyName(activeOutlet.name || "Retrod Fine Dining");
                  setAddress(activeOutlet.address || "Bandra Kurla Complex, Mumbai");
                  setContactPhone(activeOutlet.contact || "+91 98200 12345");
                  setShowHsn(true);
                  setShowGstBreakup(true);
                  setShowBankDetails(true);
                  setShowSignatures(true);
                  setShowTerms(true);
                  setZoomLevel(100);
                  toast.info("Reset invoice customization to defaults");
                }}
                className="text-[11.5px] font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Reset Defaults
              </button>
            </div>

            {/* Outlet Header Info */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Company & Tax Info
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Business / Outlet Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[12px] font-semibold text-slate-800 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    GSTIN Number
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11.5px] text-slate-700 font-mono focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    FSSAI Lic. No.
                  </label>
                  <input
                    type="text"
                    value={fssaiNo}
                    onChange={(e) => setFssaiNo(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11.5px] text-slate-700 font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Registered Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11.5px] text-slate-700 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Phone Contact
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11.5px] text-slate-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Accounts Email
                  </label>
                  <input
                    type="text"
                    value={emailContact}
                    onChange={(e) => setEmailContact(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11.5px] text-slate-700 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Statutory Column & Section Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Invoice Columns & Sections
              </div>

              <label className="flex items-center justify-between py-1 text-[12px] text-slate-700 cursor-pointer">
                <span>Show HSN / SAC Code Column</span>
                <input
                  type="checkbox"
                  checked={showHsn}
                  onChange={(e) => setShowHsn(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between py-1 text-[12px] text-slate-700 cursor-pointer">
                <span>Show CGST & SGST Split Columns</span>
                <input
                  type="checkbox"
                  checked={showGstBreakup}
                  onChange={(e) => setShowGstBreakup(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between py-1 text-[12px] text-slate-700 cursor-pointer">
                <span>Show Bank Details & UPI QR Code</span>
                <input
                  type="checkbox"
                  checked={showBankDetails}
                  onChange={(e) => setShowBankDetails(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between py-1 text-[12px] text-slate-700 cursor-pointer">
                <span>Show Authorized Signatory Block</span>
                <input
                  type="checkbox"
                  checked={showSignatures}
                  onChange={(e) => setShowSignatures(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between py-1 text-[12px] text-slate-700 cursor-pointer">
                <span>Show Terms & Conditions</span>
                <input
                  type="checkbox"
                  checked={showTerms}
                  onChange={(e) => setShowTerms(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
              </label>
            </div>

            {/* Terms and Conditions */}
            {showTerms && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-semibold text-slate-600">
                  Terms & Conditions Text
                </label>
                <textarea
                  rows={2}
                  value={termsText}
                  onChange={(e) => setTermsText(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px] text-slate-700 focus:outline-hidden resize-none"
                />
              </div>
            )}

            {/* Zoom Controls */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[12px]">
              <span className="font-semibold text-slate-600">Preview Zoom:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="font-mono font-bold text-slate-800 w-10 text-center">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Printable Sheet Preview (8 Cols) */}
        <div className="lg:col-span-8 w-full min-w-0 overflow-x-auto pb-2 flex flex-col items-center print:overflow-visible print:pb-0">
          <div
            id="printable-invoice-area"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top center",
            }}
            className={`w-full transition-all shadow-xl rounded-xl border bg-white ${
              selectedTemplate === "compact_thermal"
                ? "max-w-[420px] p-4 font-mono text-slate-900 border-dashed border-stone-400 text-[11px]"
                : "max-w-[780px] p-6 sm:p-8 text-slate-900 border-slate-300 text-[12px]"
            }`}
          >
            {/* -------------------- 1. HEADER SECTION -------------------- */}
            {selectedTemplate === "executive_letterhead" ? (
              <div className="border-b-2 border-slate-800 pb-4 mb-4">
                <div className="bg-slate-900 text-white p-4 rounded-t-lg flex justify-between items-center">
                  <div>
                    <h1 className="text-[18px] font-extrabold uppercase tracking-wider">{companyName}</h1>
                    <p className="text-[10.5px] opacity-80 mt-0.5">{address}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-white text-slate-900 px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase">
                      {activeTab === "po" ? "PURCHASE ORDER" : activeTab === "transfer" ? "DELIVERY CHALLAN" : "TAX INVOICE"}
                    </span>
                    <p className="text-[11px] font-mono mt-1">#INV-2026-0849</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[11px] pt-3 px-2">
                  <div>
                    <span className="font-bold text-slate-500 uppercase text-[9.5px]">Supplier / Vendor:</span>
                    <p className="font-bold text-slate-800">Apex Hospitality Provisions Ltd</p>
                    <p className="text-slate-600">GSTIN: 27AABCA1234F1Z5 • State: Maharashtra (27)</p>
                  </div>
                  <div className="text-right">
                    <p><span className="text-slate-500">Invoice Date:</span> <strong className="font-mono">07-Sep-2026</strong></p>
                    <p><span className="text-slate-500">Payment Terms:</span> <strong>Net 15 Days</strong></p>
                    <p><span className="text-slate-500">GSTIN:</span> <strong className="font-mono">{gstin}</strong></p>
                  </div>
                </div>
              </div>
            ) : selectedTemplate === "compact_thermal" ? (
              <div className="text-center pb-3 border-b border-dashed border-stone-400 space-y-1">
                <h1 className="text-[15px] font-extrabold uppercase tracking-wider">{companyName}</h1>
                <p className="text-[10px] text-stone-600">{address}</p>
                <p className="text-[10px] text-stone-600">GSTIN: {gstin} • Ph: {contactPhone}</p>
                <div className="pt-1.5 flex justify-between text-[10px] font-bold border-t border-stone-200 mt-1">
                  <span>BILL NO: #INV-0849</span>
                  <span>07/09/2026 13:15</span>
                </div>
              </div>
            ) : selectedTemplate === "hospitality_guest" ? (
              <div className="border-b-2 border-amber-800/60 pb-3.5 mb-3.5 space-y-1.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-[20px] font-extrabold text-amber-950 uppercase">{companyName}</h1>
                    <p className="text-[11px] text-amber-900/80">{address}</p>
                    <p className="text-[10.5px] text-amber-900/70">GSTIN: {gstin} • FSSAI: {fssaiNo}</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded bg-amber-100 text-amber-900 px-2.5 py-0.5 font-bold text-[11px] uppercase">
                      GUEST FOLIO / BILL
                    </span>
                    <p className="text-[11.5px] font-mono font-bold mt-1">#FOL-2026-981</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[10.5px] border-t border-amber-200 bg-amber-50/50 p-2 rounded-lg">
                  <div><span className="text-amber-800">Table:</span> <strong>T-08 (Indoor)</strong></div>
                  <div><span className="text-amber-800">Captain:</span> <strong>Rajesh K.</strong></div>
                  <div><span className="text-amber-800">Guests:</span> <strong>4 Pax</strong></div>
                  <div className="text-right"><span className="text-amber-800">Date:</span> <strong>07-Sep-2026</strong></div>
                </div>
              </div>
            ) : (
              /* Standard & Modern Templates Header */
              <div className="border-b border-slate-200 pb-3 mb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-teal-600 text-white flex items-center justify-center font-bold text-[12px]">
                        R
                      </div>
                      <h1 className="text-[18px] font-extrabold text-slate-900">{companyName}</h1>
                    </div>
                    <p className="text-[11px] text-slate-500">{address}</p>
                    <p className="text-[11px] text-slate-500">
                      GSTIN: <strong className="font-mono text-slate-700">{gstin}</strong> • Phone: {contactPhone}
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="inline-block bg-teal-50 border border-teal-200 text-teal-800 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wide">
                      {activeTab === "purchase"
                        ? "TAX INVOICE (PURCHASE)"
                        : activeTab === "po"
                          ? "PURCHASE ORDER"
                          : activeTab === "transfer"
                            ? "TRANSFER DELIVERY CHALLAN"
                            : "TAX INVOICE / CASH MEMO"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      <div>Invoice No: <strong className="font-mono text-slate-800">INV-2026-0849</strong></div>
                      <div>Date: <strong className="font-mono text-slate-800">07-Sep-2026</strong></div>
                    </div>
                  </div>
                </div>

                {/* Billed To / Shipped To Info */}
                <div className="grid grid-cols-2 gap-4 pt-2.5 mt-2 border-t border-slate-100 text-[11px]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {activeTab === "purchase" ? "Vendor / Supplier Details:" : "Billed To / Customer:"}
                    </span>
                    <p className="font-bold text-slate-900">
                      {activeTab === "purchase" ? "Apex Agri Supplies & Dairy Corp" : "Mr. Vikramaditya Sharma"}
                    </p>
                    <p className="text-slate-600">Unit 14, Wholesale APMC Market, Vashi, Navi Mumbai</p>
                    <p className="text-slate-600 font-mono">GSTIN: 27AAACA9876R1Z2 • State: 27-MH</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {activeTab === "transfer" ? "Destination Outlet:" : "Delivery Address:"}
                    </span>
                    <p className="font-bold text-slate-900">{activeOutlet.name}</p>
                    <p className="text-slate-600">{activeOutlet.address || "Sector 4, Main Express Highway"}</p>
                    <p className="text-slate-600">Place of Supply: Maharashtra (27)</p>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------- 2. LINE ITEMS TABLE -------------------- */}
            {selectedTemplate === "compact_thermal" ? (
              <div className="py-2 space-y-1.5">
                <div className="border-b border-stone-300 pb-1 flex justify-between font-bold text-[10.5px]">
                  <span className="w-1/2">ITEM</span>
                  <span className="w-1/6 text-center">QTY</span>
                  <span className="w-1/6 text-right">RATE</span>
                  <span className="w-1/6 text-right">TOTAL</span>
                </div>
                {calculatedItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[10px] border-b border-stone-100 pb-0.5">
                    <div className="w-1/2 truncate font-semibold">{item.name}</div>
                    <div className="w-1/6 text-center">{item.qty}</div>
                    <div className="w-1/6 text-right">₹{item.rate}</div>
                    <div className="w-1/6 text-right font-bold">₹{item.taxable}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto my-2">
                <table className="w-full text-left border-collapse text-[11.5px]">
                  <thead>
                    <tr
                      className={`border-y ${
                        selectedTemplate === "executive_letterhead"
                          ? "bg-slate-800 text-white border-slate-700"
                          : selectedTemplate === "hospitality_guest"
                            ? "bg-amber-100 text-amber-950 border-amber-300"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                      } text-[10.5px] font-bold uppercase tracking-wider`}
                    >
                      <th className="py-2 px-2 text-center w-8">#</th>
                      <th className="py-2 px-2">Item Description</th>
                      {showHsn && <th className="py-2 px-2 text-center font-mono w-16">HSN</th>}
                      <th className="py-2 px-2 text-center w-14">Qty</th>
                      <th className="py-2 px-2 text-right w-16">Rate (₹)</th>
                      <th className="py-2 px-2 text-right w-20">Taxable</th>
                      {showGstBreakup && (
                        <>
                          <th className="py-2 px-2 text-right w-16">CGST</th>
                          <th className="py-2 px-2 text-right w-16">SGST</th>
                        </>
                      )}
                      <th className="py-2 px-2 text-right w-20">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calculatedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-1.5 px-2 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-1.5 px-2 font-semibold text-slate-900">
                          {item.name}
                          {selectedTemplate === "dispatch_challan" && (
                            <span className="block text-[9.5px] text-slate-400 font-mono">
                              Batch: BT-260907 • UOM: {item.uom}
                            </span>
                          )}
                        </td>
                        {showHsn && (
                          <td className="py-1.5 px-2 text-center font-mono text-slate-600">{item.hsn}</td>
                        )}
                        <td className="py-1.5 px-2 text-center font-bold">
                          {item.qty} <span className="text-[9.5px] text-slate-500 font-normal">{item.uom}</span>
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-700">
                          {item.rate.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-800">
                          {item.taxable.toFixed(2)}
                        </td>
                        {showGstBreakup && (
                          <>
                            <td className="py-1.5 px-2 text-right font-mono text-slate-600 text-[10.5px]">
                              {item.cgst.toFixed(2)}
                              <span className="block text-[8.5px] text-slate-400">({item.taxRate / 2}%)</span>
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono text-slate-600 text-[10.5px]">
                              {item.sgst.toFixed(2)}
                              <span className="block text-[8.5px] text-slate-400">({item.taxRate / 2}%)</span>
                            </td>
                          </>
                        )}
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                          {item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* -------------------- 3. TOTALS & SUMMARY BREAKDOWN -------------------- */}
            <div className="pt-2 border-t-2 border-slate-200 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                {/* Left Side: Bank Details & QR or Terms */}
                <div className="space-y-2 text-[10.5px]">
                  {showBankDetails && selectedTemplate !== "compact_thermal" && (
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                        <Building2 className="h-3.5 w-3.5 text-teal-600" />
                        Bank & Electronic Settlement Details
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 text-slate-600 text-[10px]">
                        <div>Bank: <strong>HDFC Bank Ltd</strong></div>
                        <div>A/C: <strong>50200049281742</strong></div>
                        <div>IFSC: <strong>HDFC0000128</strong></div>
                        <div>Branch: <strong>BKC Mumbai</strong></div>
                      </div>
                    </div>
                  )}

                  {showTerms && termsText && (
                    <div className="text-[10px] text-slate-500 space-y-0.5">
                      <strong className="text-slate-700 block">Terms & Conditions:</strong>
                      <p className="whitespace-pre-line leading-tight">{termsText}</p>
                    </div>
                  )}
                </div>

                {/* Right Side: Totals Card */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-[11.5px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono font-semibold">₹ {subtotal.toFixed(2)}</span>
                  </div>

                  {showGstBreakup && (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Central GST (CGST):</span>
                        <span className="font-mono">₹ {totalCgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>State GST (SGST):</span>
                        <span className="font-mono">₹ {totalSgst.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between text-slate-900 pt-1.5 border-t border-slate-300 font-extrabold text-[13.5px]">
                    <span>Grand Total:</span>
                    <span className="font-mono text-teal-700">₹ {grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* -------------------- 4. SIGNATURE & VERIFICATION FOOTER -------------------- */}
            {showSignatures && selectedTemplate !== "compact_thermal" && (
              <div className="grid grid-cols-2 gap-6 pt-6 mt-4 border-t border-slate-200 text-[10.5px]">
                <div className="text-left">
                  <div className="h-10 border-b border-dashed border-slate-300 w-36" />
                  <p className="mt-1 font-semibold text-slate-700">Prepared / Received By</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="h-10 border-b border-dashed border-slate-300 w-44" />
                  <p className="mt-1 font-bold text-slate-800">For {companyName}</p>
                  <p className="text-[9.5px] text-slate-400 uppercase tracking-wider">Authorized Signatory</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
