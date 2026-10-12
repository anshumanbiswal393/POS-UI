import { useState, useMemo } from "react";
import {
  Upload,
  Edit2,
  Save,
  Phone,
  Mail,
  Globe,
  MapPin,
  Sparkles,
  Send,
  Smartphone,
  Monitor,
  Star,
  Check,
  RotateCcw,
  Palette,
  Eye,
  Receipt,
  Gift,
  Tag,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Utensils,
  Share2,
  Crown,
  Columns,
  FileText,
  QrCode,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useOutletContext } from "@/context/PosOutletContext";

export type EmailTemplateLayoutId =
  | "centered_modern"
  | "split_corporate"
  | "luxury_editorial"
  | "thermal_pos_slip"
  | "visual_showcase";

export type EmailUseCaseType = "ebill" | "giftcard" | "loyalty" | "reservation";

interface TemplateLayoutConfig {
  id: EmailTemplateLayoutId;
  name: string;
  subtitle: string;
  badge: string;
  accentColor: string;
  structureDesc: string;
}

const EMAIL_LAYOUT_TEMPLATES: TemplateLayoutConfig[] = [
  {
    id: "centered_modern",
    name: "Modern Centered Receipt Card",
    subtitle: "Centered emblem, prominent total pill & clean rounded flow",
    badge: "Centered / Modern",
    accentColor: "#0f766e",
    structureDesc: "Centered alignment with hero amount badge & streamlined card modules",
  },
  {
    id: "split_corporate",
    name: "Asymmetric Two-Column Split",
    subtitle: "Left itemized invoice table with right order summary sidebar",
    badge: "Dual-Column / Corporate",
    accentColor: "#1e293b",
    structureDesc: "Two-column asymmetric layout with structured tabular line items & metadata sidebar",
  },
  {
    id: "luxury_editorial",
    name: "Fine Dining Royal Letterhead",
    subtitle: "Serif typography, double gold borders & Chef sign-off",
    badge: "Editorial / Luxury",
    accentColor: "#78350f",
    structureDesc: "Formal dining letterhead with course breakdown, ornate borders & executive sign-off",
  },
  {
    id: "thermal_pos_slip",
    name: "80mm POS Thermal Slip",
    subtitle: "Monospace font, dashed tear-off lines & scannable barcode",
    badge: "Monospace / POS Slip",
    accentColor: "#0f172a",
    structureDesc: "Realistic counter thermal roll receipt layout with dot leaders & barcode",
  },
  {
    id: "visual_showcase",
    name: "Culinary Hero & Voucher",
    subtitle: "Hero banner, visual dish grid & interactive loyalty ribbon",
    badge: "Visual / Promotional",
    accentColor: "#ea580c",
    structureDesc: "Full-width hero visual header with 2-column dish showcase & discount coupon",
  },
];

export function EmailTemplateSettingsView() {
  const { activeOutlet } = useOutletContext();

  // Template Layout Selection
  const [selectedLayout, setSelectedLayout] = useState<EmailTemplateLayoutId>("centered_modern");

  // Email Use-Case Tabs
  const [activeUseCase, setActiveUseCase] = useState<EmailUseCaseType>("ebill");

  // Device Preview Mode (Desktop vs Mobile)
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  // Branding Details
  const [restaurantName, setRestaurantName] = useState(activeOutlet.name || "Retrod Fine Dining & Lounge");
  const [brandTagline, setBrandTagline] = useState(
    activeOutlet.cuisine ? `${activeOutlet.cuisine} • Freshly Prepared Daily` : "Exquisite Culinary Experience & Cocktail Lounge",
  );
  const [address, setAddress] = useState(
    activeOutlet.address || "Plot 42, Bandra Kurla Complex, G Block, Mumbai, MH 400051",
  );
  const [contactNo, setContactNo] = useState(activeOutlet.contact || "+91 98200 54321");
  const [emailId, setEmailId] = useState("support@retrod.in");
  const [website, setWebsite] = useState("https://retrod.in/");

  // Dynamic Content Customization
  const [subjectLine, setSubjectLine] = useState("Your E-Receipt from Retrod POS (Order #ORD-8492)");
  const [greetingText, setGreetingText] = useState("Dear Valued Guest, thank you for dining with us today!");
  const [footerDisclaimer, setFooterDisclaimer] = useState(
    "This is an official transactional receipt generated via Retrod POS Cloud Systems. For queries or instant support, please reach out directly.",
  );

  // Feature Toggles
  const [showTaxBreakup, setShowTaxBreakup] = useState(true);
  const [showFeedbackRating, setShowFeedbackRating] = useState(true);
  const [showSocialLinks, setShowSocialLinks] = useState(true);
  const [showDownloadCta, setShowDownloadCta] = useState(true);

  // Test Email Modal
  const [testEmailAddress, setTestEmailAddress] = useState("guest@example.com");
  const [isTestEmailModalOpen, setIsTestEmailModalOpen] = useState(false);

  const activeTemplateConfig = useMemo(() => {
    return EMAIL_LAYOUT_TEMPLATES.find((t) => t.id === selectedLayout) || EMAIL_LAYOUT_TEMPLATES[0];
  }, [selectedLayout]);

  const handleUseCaseChange = (tab: EmailUseCaseType) => {
    setActiveUseCase(tab);
    switch (tab) {
      case "ebill":
        setSubjectLine(`Your E-Receipt from ${restaurantName} (Order #ORD-8492)`);
        break;
      case "giftcard":
        setSubjectLine(`Gift Card Balance & Transaction Update - ${restaurantName}`);
        break;
      case "loyalty":
        setSubjectLine(`Congratulations! You earned 150 Retrod Loyalty Points`);
        break;
      case "reservation":
        setSubjectLine(`Table Reservation Confirmed for Tonight at ${restaurantName}`);
        break;
    }
  };

  const handleSave = () => {
    toast.success("Retrod Email Template settings saved successfully!");
  };

  const handleSendTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress) {
      toast.error("Please enter a valid email address");
      return;
    }
    toast.success(`Test email sample (${activeTemplateConfig.name}) dispatched to ${testEmailAddress}!`);
    setIsTestEmailModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs no-print">
        <div>
          <h2 className="text-[17px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Mail className="h-5 w-5 text-teal-600" />
            Retrod Email Template & E-Bill Studio
          </h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Choose from 5 distinct architectural email layouts with unique alignments, typography, and card structures.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsTestEmailModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 transition cursor-pointer"
          >
            <Send className="h-4 w-4 text-teal-600" />
            Send Test Email
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 px-5 py-2 text-[12.5px] font-bold text-white shadow-2xs transition cursor-pointer"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>

      {/* 2. Email Use-Case Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 bg-white rounded-xl px-2 py-1 shadow-2xs no-print">
        <button
          type="button"
          onClick={() => handleUseCaseChange("ebill")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold transition cursor-pointer shrink-0 border-b-2 ${
            activeUseCase === "ebill"
              ? "border-teal-600 bg-teal-50/60 text-teal-900"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Receipt className="h-4 w-4 text-teal-600" />
          <span>E-Bill & Digital Receipts</span>
        </button>

        <button
          type="button"
          onClick={() => handleUseCaseChange("giftcard")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold transition cursor-pointer shrink-0 border-b-2 ${
            activeUseCase === "giftcard"
              ? "border-teal-600 bg-teal-50/60 text-teal-900"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Gift className="h-4 w-4 text-amber-600" />
          <span>Gift Card & Wallet Balances</span>
        </button>

        <button
          type="button"
          onClick={() => handleUseCaseChange("loyalty")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold transition cursor-pointer shrink-0 border-b-2 ${
            activeUseCase === "loyalty"
              ? "border-teal-600 bg-teal-50/60 text-teal-900"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Tag className="h-4 w-4 text-purple-600" />
          <span>Loyalty Rewards & Offers</span>
        </button>

        <button
          type="button"
          onClick={() => handleUseCaseChange("reservation")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold transition cursor-pointer shrink-0 border-b-2 ${
            activeUseCase === "reservation"
              ? "border-teal-600 bg-teal-50/60 text-teal-900"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Calendar className="h-4 w-4 text-blue-600" />
          <span>Reservation Confirmations</span>
        </button>
      </div>

      {/* 3. Template Architecture Selector (5 Structural Designs) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
              <Palette className="h-4 w-4 text-teal-600" />
              Select Email Layout Structure & Alignment
            </h3>
            <p className="text-[12px] text-slate-500">
              Each template provides a distinct architectural layout, alignment hierarchy, and visual styling.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-md self-start sm:self-auto">
            {EMAIL_LAYOUT_TEMPLATES.length} Layout Templates
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {EMAIL_LAYOUT_TEMPLATES.map((tmpl) => {
            const isSelected = selectedLayout === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => {
                  setSelectedLayout(tmpl.id);
                  toast.success(`Switched layout to "${tmpl.name}"`);
                }}
                className={`relative rounded-xl border p-3 text-left transition-all duration-150 cursor-pointer flex flex-col justify-between min-h-[160px] group ${
                  isSelected
                    ? "border-teal-600 bg-teal-50/35 shadow-2xs"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs"
                }`}
              >
                <div>
                  {/* Top Badge & Checkmark */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9.5px] font-semibold border ${
                        isSelected
                          ? "bg-teal-100/80 border-teal-200 text-teal-800"
                          : "bg-slate-100 border-slate-200 text-slate-600"
                      }`}
                    >
                      {tmpl.badge.split("/")[0].trim()}
                    </span>
                    {isSelected && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-white text-[9px] font-bold shadow-2xs">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Structural Skeleton Preview Graphic */}
                  <div
                    className={`w-full h-14 rounded-lg border p-1.5 space-y-1 overflow-hidden pointer-events-none mb-2.5 transition-colors ${
                      isSelected ? "bg-white border-teal-200" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    {tmpl.id === "centered_modern" && (
                      <div className="flex flex-col items-center justify-between h-full py-0.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-teal-600" />
                        <div className="h-1.5 w-14 bg-teal-100 rounded-xs" />
                        <div className="h-2 w-16 bg-teal-600/70 rounded-full" />
                        <div className="h-1 w-20 bg-slate-200 rounded-xs" />
                      </div>
                    )}

                    {tmpl.id === "split_corporate" && (
                      <div className="grid grid-cols-12 gap-1 h-full py-0.5">
                        <div className="col-span-8 space-y-1">
                          <div className="h-1.5 w-full bg-slate-800 rounded-xs" />
                          <div className="h-1 w-3/4 bg-slate-300 rounded-xs" />
                          <div className="h-1 w-full bg-slate-200 rounded-xs" />
                        </div>
                        <div className="col-span-4 bg-slate-100 rounded-xs p-0.5 space-y-0.5 border border-slate-200">
                          <div className="h-1 w-full bg-slate-400 rounded-xs" />
                          <div className="h-1.5 w-full bg-slate-800 rounded-xs" />
                        </div>
                      </div>
                    )}

                    {tmpl.id === "luxury_editorial" && (
                      <div className="border border-amber-400/60 rounded-xs p-1 h-full flex flex-col justify-between text-center items-center bg-amber-50/30">
                        <div className="h-1.5 w-3.5 bg-amber-700 rounded-xs" />
                        <div className="h-1 w-14 bg-amber-900 rounded-xs" />
                        <div className="h-0.5 w-full bg-amber-300" />
                        <div className="h-1 w-16 bg-amber-800/60 rounded-xs" />
                      </div>
                    )}

                    {tmpl.id === "thermal_pos_slip" && (
                      <div className="font-mono text-[6px] space-y-0.5 h-full flex flex-col justify-between text-slate-500">
                        <div className="border-b border-dashed border-slate-300 text-center font-bold">
                          -----------------
                        </div>
                        <div className="flex justify-between px-1">
                          <div className="h-1 w-8 bg-slate-700 rounded-xs" />
                          <div className="h-1 w-3 bg-slate-700 rounded-xs" />
                        </div>
                        <div className="border-t border-dashed border-slate-300 text-center">
                          -----------------
                        </div>
                      </div>
                    )}

                    {tmpl.id === "visual_showcase" && (
                      <div className="h-full flex flex-col justify-between">
                        <div className="h-2.5 w-full bg-orange-500 rounded-xs" />
                        <div className="grid grid-cols-2 gap-1">
                          <div className="h-2 bg-slate-200 rounded-xs" />
                          <div className="h-2 bg-slate-200 rounded-xs" />
                        </div>
                        <div className="h-1.5 w-full bg-slate-700 rounded-xs" />
                      </div>
                    )}
                  </div>

                  <div
                    className={`text-[12.5px] font-bold leading-tight ${
                      isSelected ? "text-teal-950" : "text-slate-900"
                    }`}
                  >
                    {tmpl.name}
                  </div>
                  <div className="text-[10.5px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {tmpl.structureDesc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Split Studio: Customizer Form (Left 5 Cols) & Interactive Email Inbox Preview (Right 7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editor Controls */}
        <div className="lg:col-span-5 space-y-4 no-print">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-[13.5px] font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-teal-600" />
                Template Customizer
              </h4>
              <button
                type="button"
                onClick={() => {
                  setRestaurantName(activeOutlet.name || "Retrod Fine Dining");
                  setAddress(activeOutlet.address || "Bandra Kurla Complex, Mumbai");
                  setContactNo(activeOutlet.contact || "+91 98200 54321");
                  setEmailId("support@retrod.in");
                  setWebsite("https://retrod.in/");
                  setShowTaxBreakup(true);
                  setShowFeedbackRating(true);
                  setShowSocialLinks(true);
                  setShowDownloadCta(true);
                  toast.info("Reset email settings to defaults");
                }}
                className="text-[11.5px] font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Reset Defaults
              </button>
            </div>

            {/* Brand Header & Subject */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Subject & Brand Header
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={subjectLine}
                  onChange={(e) => setSubjectLine(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[12px] font-semibold text-slate-800 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Restaurant / Brand Display Name
                </label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[12px] font-semibold text-slate-800 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tagline / Header Slogan
                </label>
                <input
                  type="text"
                  value={brandTagline}
                  onChange={(e) => setBrandTagline(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[11.5px] text-slate-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Greeting / Headline Text
                </label>
                <textarea
                  rows={2}
                  value={greetingText}
                  onChange={(e) => setGreetingText(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11.5px] text-slate-700 focus:outline-hidden resize-none"
                />
              </div>
            </div>

            {/* Outlet Contact Details */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Outlet Contact & Footer Info
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Physical Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11.5px] text-slate-700 focus:outline-hidden resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11.5px] text-slate-700 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={emailId}
                    onChange={(e) => setEmailId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11.5px] text-slate-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Website URL
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11.5px] text-slate-700 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Content Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Interactive Modules
              </div>

              <label className="flex items-center justify-between py-1 text-[12px] text-slate-700 cursor-pointer">
                <span>Show Itemized Order / Tax Summary</span>
                <input
                  type="checkbox"
                  checked={showTaxBreakup}
                  onChange={(e) => setShowTaxBreakup(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between py-1 text-[12px] text-slate-700 cursor-pointer">
                <span>Show 5-Star Feedback Rating Module</span>
                <input
                  type="checkbox"
                  checked={showFeedbackRating}
                  onChange={(e) => setShowFeedbackRating(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between py-1 text-[12px] text-slate-700 cursor-pointer">
                <span>Show Download PDF E-Receipt CTA</span>
                <input
                  type="checkbox"
                  checked={showDownloadCta}
                  onChange={(e) => setShowDownloadCta(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between py-1 text-[12px] text-slate-700 cursor-pointer">
                <span>Show Social Media & Website Links</span>
                <input
                  type="checkbox"
                  checked={showSocialLinks}
                  onChange={(e) => setShowSocialLinks(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Live Responsive Email Preview (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {(() => {
            const isMobile = previewDevice === "mobile";
            return (
              <>
                {/* Device Switcher Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full max-w-[620px] mb-2 px-1 gap-2 text-[12px] text-slate-600">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Eye className="h-4 w-4 text-teal-600" />
                    <span>
                      Preview: <strong className="text-slate-900">{activeTemplateConfig.name}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("desktop")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11.5px] font-bold transition cursor-pointer ${
                        !isMobile
                          ? "bg-teal-600 text-white shadow-2xs"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Monitor className="h-3.5 w-3.5" />
                      Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("mobile")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11.5px] font-bold transition cursor-pointer ${
                        isMobile
                          ? "bg-teal-600 text-white shadow-2xs"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                      Mobile
                    </button>
                  </div>
                </div>

                {/* Email Client Simulated Envelope */}
                <div
                  className={`w-full transition-all duration-200 shadow-xl rounded-2xl border border-slate-300 bg-[#f8fafc] overflow-hidden ${
                    isMobile ? "max-w-[380px]" : "max-w-[620px]"
                  }`}
                >
                  {/* Mobile Device Status Bar Simulation */}
                  {isMobile && (
                    <div className="bg-slate-900 text-white text-[10px] px-4 py-1.5 flex items-center justify-between select-none">
                      <span className="font-semibold tracking-tight">9:41</span>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>5G</span>
                        <span>100%</span>
                      </div>
                    </div>
                  )}

                  {/* Inbox Header Info Bar */}
                  <div className="bg-white border-b border-slate-200 p-3 sm:p-3.5 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-500 gap-2">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5 min-w-0">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate">
                          From: {restaurantName} &lt;{emailId}&gt;
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] text-slate-400">Today, 13:20</span>
                    </div>
                    <div className="font-bold text-slate-900 text-[12.5px] truncate">
                      {subjectLine}
                    </div>
                  </div>

                  {/* ========================================================================= */}
                  {/* STRUCTURE 1: CENTERED MODERN RECEIPT CARD                                */}
                  {/* ========================================================================= */}
                  {selectedLayout === "centered_modern" && (
                    <div className={isMobile ? "p-3 sm:p-4" : "p-4 sm:p-6"}>
                      <div className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden text-center">
                        {/* Top Centered Banner */}
                        <div
                          className={`bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 text-white text-center relative ${
                            isMobile ? "p-4 pb-6" : "p-6 pb-8"
                          }`}
                        >
                          <div
                            className={`inline-flex items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-black shadow-sm mb-2 ${
                              isMobile ? "h-10 w-10 text-[17px]" : "h-12 w-12 text-[20px]"
                            }`}
                          >
                            R
                          </div>
                          <h1
                            className={`font-extrabold uppercase tracking-tight ${
                              isMobile ? "text-[16px] leading-tight" : "text-[20px]"
                            }`}
                          >
                            {restaurantName}
                          </h1>
                          <p className="text-[11px] text-teal-100 opacity-90 mt-0.5 max-w-sm mx-auto line-clamp-2">
                            {brandTagline}
                          </p>
                        </div>

                        {/* Floating Total Paid Hero Card */}
                        <div
                          className={`bg-white rounded-xl shadow-md border border-teal-200/80 space-y-1.5 text-center ${
                            isMobile ? "-mt-4 mx-3 p-3" : "-mt-5 mx-6 p-4"
                          }`}
                        >
                          <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider">
                            <CheckCircle2 className="h-3 w-3" />
                            Paid & Verified
                          </div>
                          <div
                            className={`font-extrabold text-teal-950 font-mono ${
                              isMobile ? "text-[22px]" : "text-[26px]"
                            }`}
                          >
                            ₹ 1,816.50
                          </div>
                          <p className="text-[10.5px] text-slate-500">
                            Order #ORD-8492 • Table T-04 • Settled via UPI
                          </p>
                        </div>

                        {/* Body Content */}
                        <div
                          className={`space-y-3.5 text-slate-700 text-left ${
                            isMobile ? "p-3.5 pt-4 text-[11.5px]" : "p-6 text-[12.5px]"
                          }`}
                        >
                          <p className="text-center font-bold text-slate-900 text-[12.5px] sm:text-[13.5px]">
                            {greetingText}
                          </p>

                          {showTaxBreakup && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-3.5 space-y-2 text-[11px] sm:text-[11.5px]">
                              <div className="flex justify-between font-bold text-slate-800 border-b border-slate-200 pb-1.5 text-[10.5px] sm:text-[11px] uppercase tracking-wider">
                                <span>Itemized Dine-In Bill</span>
                                <span>Amount</span>
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-slate-700">
                                  <span className="font-medium">2x Murgh Dum Biryani (Handi)</span>
                                  <span className="font-mono font-semibold text-slate-900 shrink-0 ml-2">
                                    ₹ 960.00
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-slate-700">
                                  <span className="font-medium">1x Paneer Tikka Angare</span>
                                  <span className="font-mono font-semibold text-slate-900 shrink-0 ml-2">
                                    ₹ 380.00
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-slate-700">
                                  <span className="font-medium">2x Artisanal Berry Mocktail</span>
                                  <span className="font-mono font-semibold text-slate-900 shrink-0 ml-2">
                                    ₹ 390.00
                                  </span>
                                </div>
                              </div>

                              <div className="border-t border-slate-200 pt-1.5 space-y-0.5 text-slate-500 text-[10.5px]">
                                <div className="flex justify-between">
                                  <span>Subtotal:</span>
                                  <span className="font-mono">₹ 1,730.00</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>GST (5%):</span>
                                  <span className="font-mono">₹ 86.50</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Centered CTA */}
                          {showDownloadCta && (
                            <div className="pt-1 text-center">
                              <button
                                type="button"
                                className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-[12px] sm:text-[13px] shadow-2xs transition cursor-pointer"
                              >
                                View & Download Tax Invoice (PDF)
                              </button>
                            </div>
                          )}

                          {/* Feedback Rating */}
                          {showFeedbackRating && (
                            <div className="border-t border-slate-100 pt-2.5 text-center space-y-1">
                              <p className="text-[11px] font-bold text-slate-700">
                                Rate your dining experience:
                              </p>
                              <div className="flex justify-center gap-1 text-amber-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className="h-4 w-4 fill-amber-400 hover:scale-110 transition cursor-pointer"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Centered Minimal Footer */}
                        <div className="bg-slate-900 text-white p-4 sm:p-5 text-[10.5px] sm:text-[11px] space-y-1.5 text-center">
                          <p className="text-slate-300 text-[10px] sm:text-[11px]">{address}</p>
                          <p className="text-teal-400 font-medium text-[10px] sm:text-[11px]">
                            Ph: {contactNo} • {emailId}
                          </p>
                          <p className="text-[9px] text-slate-500 pt-1 border-t border-slate-800">
                            Powered by Retrod POS Cloud Systems • SSL Secured
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* STRUCTURE 2: ASYMMETRIC TWO-COLUMN SPLIT (CORPORATE)                      */}
                  {/* ========================================================================= */}
                  {selectedLayout === "split_corporate" && (
                    <div className={isMobile ? "p-3 sm:p-4" : "p-4 sm:p-6"}>
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        {/* Top Dark Header Bar */}
                        <div className={`bg-slate-900 text-white ${isMobile ? "p-3.5 space-y-2" : "p-4 sm:p-5"}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="h-6.5 w-6.5 shrink-0 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white text-[12px]">
                                R
                              </div>
                              <h1
                                className={`font-extrabold uppercase tracking-wide truncate ${
                                  isMobile ? "text-[14px]" : "text-[17px]"
                                }`}
                              >
                                {restaurantName}
                              </h1>
                            </div>
                            <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0">
                              B2B / E-INVOICE
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800">
                            <p className="truncate pr-2">{address}</p>
                            <p className="font-mono text-slate-300 shrink-0">#INV-2026-8492</p>
                          </div>
                        </div>

                        {/* Body Grid: Stacked vertically in mobile, 2-column split on desktop */}
                        <div
                          className={
                            isMobile
                              ? "p-3.5 space-y-3.5 text-[11.5px]"
                              : "p-5 grid grid-cols-12 gap-5 text-[12px]"
                          }
                        >
                          {/* Itemized Bill Section (Full width on mobile, 8 cols on desktop) */}
                          <div className={isMobile ? "space-y-2.5" : "col-span-8 space-y-3"}>
                            <div className="border-b border-slate-200 pb-1.5">
                              <h3 className="font-bold text-slate-900 text-[12.5px] sm:text-[13px]">
                                Itemized Invoice
                              </h3>
                              <p className="text-[10.5px] text-slate-500 line-clamp-1">{greetingText}</p>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                              <table className="w-full text-left border-collapse text-[11px] sm:text-[11.5px]">
                                <thead>
                                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-[9.5px] font-bold uppercase tracking-wider">
                                    <th className="py-1.5 px-2.5">Item Description</th>
                                    <th className="py-1.5 px-1.5 text-center w-9 sm:w-12">Qty</th>
                                    <th className="py-1.5 px-1.5 text-right w-14 sm:w-16">Rate</th>
                                    <th className="py-1.5 px-2.5 text-right w-16 sm:w-20">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                  <tr>
                                    <td className="py-1.5 px-2.5 font-medium text-slate-900 leading-snug">
                                      Murgh Dum Biryani (Handi)
                                    </td>
                                    <td className="py-1.5 px-1.5 text-center text-slate-600">2</td>
                                    <td className="py-1.5 px-1.5 text-right font-mono text-slate-500">480.00</td>
                                    <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                                      960.00
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="py-1.5 px-2.5 font-medium text-slate-900 leading-snug">
                                      Paneer Tikka Angare
                                    </td>
                                    <td className="py-1.5 px-1.5 text-center text-slate-600">1</td>
                                    <td className="py-1.5 px-1.5 text-right font-mono text-slate-500">380.00</td>
                                    <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                                      380.00
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="py-1.5 px-2.5 font-medium text-slate-900 leading-snug">
                                      Artisanal Berry Mocktail
                                    </td>
                                    <td className="py-1.5 px-1.5 text-center text-slate-600">2</td>
                                    <td className="py-1.5 px-1.5 text-right font-mono text-slate-500">195.00</td>
                                    <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                                      390.00
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            {showDownloadCta && (
                              <button
                                type="button"
                                className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11.5px] transition cursor-pointer"
                              >
                                Download Official PDF Invoice
                              </button>
                            )}
                          </div>

                          {/* Summary & Metadata (Full width below on mobile, 4 cols sidebar on desktop) */}
                          <div
                            className={`rounded-xl border border-slate-200 bg-slate-50/90 space-y-2.5 ${
                              isMobile ? "p-3" : "col-span-4 p-3.5"
                            }`}
                          >
                            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Transaction Summary
                              </span>
                              <div className="flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                                <CheckCircle2 className="h-3 w-3" />
                                Settled via UPI
                              </div>
                            </div>

                            <div
                              className={`gap-2 text-[10.5px] text-slate-600 ${
                                isMobile ? "grid grid-cols-3" : "space-y-1"
                              }`}
                            >
                              <div className={isMobile ? "" : "flex justify-between"}>
                                <span className={isMobile ? "text-slate-400 block text-[9px]" : ""}>
                                  Table:
                                </span>
                                <strong className="text-slate-800">T-04</strong>
                              </div>
                              <div className={isMobile ? "" : "flex justify-between"}>
                                <span className={isMobile ? "text-slate-400 block text-[9px]" : ""}>
                                  Server:
                                </span>
                                <strong className="text-slate-800">Rajesh K.</strong>
                              </div>
                              <div className={isMobile ? "" : "flex justify-between"}>
                                <span className={isMobile ? "text-slate-400 block text-[9px]" : ""}>
                                  GSTIN:
                                </span>
                                <strong className="font-mono text-slate-800 text-[9.5px]">
                                  27AABCR8492
                                </strong>
                              </div>
                            </div>

                            <div className="border-t border-slate-200 pt-2 space-y-1 text-[11px]">
                              <div className="flex justify-between text-slate-600">
                                <span>Subtotal:</span>
                                <span className="font-mono">₹ 1,730.00</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>GST (5%):</span>
                                <span className="font-mono">₹ 86.50</span>
                              </div>
                              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-300 pt-1 text-[12.5px]">
                                <span>Net Paid:</span>
                                <span className="font-mono text-indigo-700 font-extrabold">
                                  ₹ 1,816.50
                                </span>
                              </div>
                            </div>

                            {!isMobile && (
                              <div className="border-t border-slate-200 pt-2 text-[10px] text-slate-500">
                                <p>Ref: UPI-9842187</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom Footer */}
                        <div className="bg-slate-100 p-3 text-center text-[10px] text-slate-600 border-t border-slate-200">
                          <p className="line-clamp-2">{footerDisclaimer}</p>
                          <p className="mt-0.5 font-bold text-slate-800">
                            Support: {contactNo} • {emailId} • {website}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* STRUCTURE 3: LUXURY EDITORIAL LETTERHEAD                                  */}
                  {/* ========================================================================= */}
                  {selectedLayout === "luxury_editorial" && (
                    <div className={isMobile ? "p-3 sm:p-4" : "p-4 sm:p-6"}>
                      <div
                        className={`bg-[#fffdf9] rounded-2xl shadow-sm text-[#2c1d11] ${
                          isMobile
                            ? "border-2 border-double border-[#b45309]/40 p-4"
                            : "border-4 border-double border-[#b45309]/50 p-6"
                        }`}
                      >
                        {/* Ornate Gold Crown Crest */}
                        <div className="text-center pb-3 border-b border-[#b45309]/30 space-y-1">
                          <div className="flex justify-center text-[#b45309] mb-1">
                            <Crown className={isMobile ? "h-6 w-6" : "h-7 w-7"} />
                          </div>
                          <h1
                            className={`font-serif font-extrabold tracking-tight uppercase text-[#78350f] ${
                              isMobile ? "text-[18px] leading-tight" : "text-[24px]"
                            }`}
                          >
                            {restaurantName}
                          </h1>
                          <p className="text-[11px] sm:text-[12px] font-serif italic text-amber-900/80">
                            ~ {brandTagline} ~
                          </p>
                          <p className="text-[9.5px] text-stone-500 uppercase tracking-widest pt-0.5">
                            Guest Dining Folio • Order #ORD-8492
                          </p>
                        </div>

                        {/* Letterhead Body */}
                        <div className="py-3.5 space-y-3 text-[11.5px] sm:text-[12.5px] font-serif leading-relaxed">
                          <p className="italic text-[#78350f] font-bold">
                            Dear Honored Patron,
                          </p>
                          <p className="text-stone-700">
                            It was our absolute pleasure hosting you at {restaurantName}. We hope each course met your expectations for exceptional culinary craftsmanship.
                          </p>

                          {/* Course Breakdown */}
                          <div className="border-y border-[#b45309]/30 py-2.5 space-y-2">
                            <div className="text-[10.5px] uppercase tracking-wider font-sans font-bold text-[#92400e] text-center">
                              Curated Dining Bill
                            </div>
                            <div className="space-y-1.5 text-[11.5px]">
                              <div className="flex justify-between items-center">
                                <span>2x Murgh Dum Biryani (Royal Handi)</span>
                                <span className="font-mono font-bold text-stone-900 shrink-0 ml-2">
                                  ₹ 960.00
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>1x Paneer Tikka Angare</span>
                                <span className="font-mono font-bold text-stone-900 shrink-0 ml-2">
                                  ₹ 380.00
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>2x Artisanal Berry Mocktail Punch</span>
                                <span className="font-mono font-bold text-stone-900 shrink-0 ml-2">
                                  ₹ 390.00
                                </span>
                              </div>
                            </div>

                            <div className="border-t border-dashed border-[#b45309]/30 pt-2 flex justify-between font-sans font-bold text-[13px] sm:text-[14px] text-[#78350f]">
                              <span>Grand Total Paid:</span>
                              <span className="font-mono text-[#92400e]">₹ 1,816.50</span>
                            </div>
                          </div>

                          {showDownloadCta && (
                            <div className="text-center pt-1">
                              <button
                                type="button"
                                className="w-full sm:w-auto px-6 py-2 rounded-xl bg-[#78350f] hover:bg-[#92400e] text-amber-50 font-sans font-bold text-[12px] transition cursor-pointer shadow-2xs"
                              >
                                Download Official Dining Receipt
                              </button>
                            </div>
                          )}

                          {/* Executive Sign-off */}
                          <div
                            className={`pt-2.5 border-t border-[#b45309]/20 text-[10.5px] italic text-stone-600 ${
                              isMobile
                                ? "flex flex-col gap-2 text-left"
                                : "flex justify-between items-end"
                            }`}
                          >
                            <div>
                              <p>With Warm Regards,</p>
                              <p className="font-bold text-[#78350f] font-serif">Executive Culinary Team</p>
                              <p>{restaurantName}</p>
                            </div>
                            <div
                              className={
                                isMobile
                                  ? "text-left text-[9.5px] font-sans text-stone-500"
                                  : "text-right text-[10px] font-sans text-stone-500"
                              }
                            >
                              <p className="truncate">{address}</p>
                              <p>Reservations: {contactNo}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* STRUCTURE 4: 80MM POS THERMAL TEAR-OFF SLIP                               */}
                  {/* ========================================================================= */}
                  {selectedLayout === "thermal_pos_slip" && (
                    <div
                      className={
                        isMobile
                          ? "p-3 sm:p-4 flex justify-center"
                          : "p-4 sm:p-6 flex justify-center"
                      }
                    >
                      <div
                        className={`bg-white rounded-lg shadow-md border-2 border-dashed border-slate-300 font-mono text-slate-900 w-full space-y-2 ${
                          isMobile
                            ? "p-3.5 text-[10.5px] max-w-[340px]"
                            : "p-5 text-[11px] max-w-[360px]"
                        }`}
                      >
                        {/* Top Tear Off Effect */}
                        <div className="text-center text-slate-400 text-[10px] tracking-widest select-none">
                          - - - - - - - - - - - - - - - - - - - -
                        </div>

                        <div className="text-center space-y-0.5">
                          <h1 className="text-[14px] sm:text-[15px] font-black uppercase tracking-wider">
                            {restaurantName}
                          </h1>
                          <p className="text-[9.5px] text-slate-600 line-clamp-1">{address}</p>
                          <p className="text-[9.5px] text-slate-600">
                            GSTIN: 27AABCR8492Q1ZV • TEL: {contactNo}
                          </p>
                          <div className="pt-1 text-[9.5px] font-bold border-t border-slate-200 mt-1">
                            TAX INVOICE / DIGITAL RECEIPT
                          </div>
                        </div>

                        {/* Order Meta */}
                        <div className="border-t border-b border-slate-300 py-1 text-[9.5px] space-y-0.5">
                          <div className="flex justify-between">
                            <span>BILL NO: #8492</span>
                            <span>DATE: 07/09/2026</span>
                          </div>
                          <div className="flex justify-between">
                            <span>TABLE: T-04</span>
                            <span>TIME: 13:20:14</span>
                          </div>
                          <div className="flex justify-between">
                            <span>SERVER: RAJESH K.</span>
                            <span>PAX: 4</span>
                          </div>
                        </div>

                        {/* Dot Leader Items */}
                        <div className="space-y-1 py-1 text-[10px] sm:text-[10.5px]">
                          <div className="flex justify-between font-bold border-b border-slate-200 pb-0.5 text-[9.5px]">
                            <span>ITEM DESCRIPTION</span>
                            <span>AMOUNT</span>
                          </div>
                          <div className="flex justify-between">
                            <span>2x MURGH DUM BIRYANI</span>
                            <span className="font-bold">960.00</span>
                          </div>
                          <div className="flex justify-between">
                            <span>1x PANEER TIKKA ANGARE</span>
                            <span className="font-bold">380.00</span>
                          </div>
                          <div className="flex justify-between">
                            <span>2x ARTISANAL BERRY MOCK</span>
                            <span className="font-bold">390.00</span>
                          </div>
                        </div>

                        {/* Totals */}
                        <div className="border-t-2 border-slate-900 pt-1.5 space-y-0.5 text-[10.5px]">
                          <div className="flex justify-between">
                            <span>SUBTOTAL:</span>
                            <span>1,730.00</span>
                          </div>
                          <div className="flex justify-between">
                            <span>CGST (2.5%):</span>
                            <span>43.25</span>
                          </div>
                          <div className="flex justify-between">
                            <span>SGST (2.5%):</span>
                            <span>43.25</span>
                          </div>
                          <div className="flex justify-between font-black text-[12.5px] border-t border-slate-400 pt-1">
                            <span>TOTAL PAID:</span>
                            <span>₹ 1,816.50</span>
                          </div>
                        </div>

                        {/* Scannable Barcode & QR Simulation */}
                        <div className="pt-2 text-center space-y-1">
                          <div className="flex justify-center">
                            <div className="h-6.5 w-44 bg-slate-900 flex items-center justify-around px-2 text-white font-mono text-[8px] tracking-widest">
                              ||| | |||| || ||| |||| | ||
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-500">PAID VIA UPI REF: 9842187</p>
                        </div>

                        {/* Bottom Tear Off Effect */}
                        <div className="text-center text-slate-400 text-[10px] tracking-widest pt-1 select-none">
                          - - - - - - - - - - - - - - - - - - - -
                        </div>
                        <p className="text-center font-bold text-[9.5px]">THANK YOU! VISIT AGAIN</p>
                      </div>
                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* STRUCTURE 5: CULINARY HERO & PROMO VOUCHER                                */}
                  {/* ========================================================================= */}
                  {selectedLayout === "visual_showcase" && (
                    <div className={isMobile ? "p-3 sm:p-4" : "p-4 sm:p-6"}>
                      <div className="bg-white rounded-2xl shadow-sm border border-orange-200 overflow-hidden">
                        {/* Hero Gradient Banner */}
                        <div
                          className={`bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white relative overflow-hidden ${
                            isMobile ? "p-4" : "p-6"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <span className="bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider inline-block">
                                Culinary E-Receipt
                              </span>
                              <h1
                                className={`font-black uppercase mt-1 truncate ${
                                  isMobile ? "text-[16px]" : "text-[22px]"
                                }`}
                              >
                                {restaurantName}
                              </h1>
                              <p className="text-[11px] text-orange-100 opacity-90 line-clamp-1">
                                {brandTagline}
                              </p>
                            </div>

                            <div
                              className={`rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white border border-white/30 shrink-0 ${
                                isMobile ? "h-8 w-8 text-[14px]" : "h-10 w-10 text-[16px]"
                              }`}
                            >
                              R
                            </div>
                          </div>
                        </div>

                        {/* Highlight Ribbon / Reward Voucher */}
                        <div
                          className={`bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between font-bold ${
                            isMobile ? "p-2.5 px-3.5 text-[11px]" : "p-3 px-5 text-[11.5px]"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Sparkles className="h-4 w-4 text-amber-200 shrink-0" />
                            <span className="truncate">Next-Visit Reward Unlocked!</span>
                          </div>
                          <span className="bg-white text-orange-950 font-mono px-2 py-0.5 rounded font-black text-[10.5px] shrink-0 ml-2">
                            RETROD100
                          </span>
                        </div>

                        {/* Dish Showcase Grid: 1 col on mobile, 2 cols on desktop */}
                        <div
                          className={`space-y-3.5 text-slate-700 ${
                            isMobile ? "p-3.5 text-[11.5px]" : "p-5 text-[12px]"
                          }`}
                        >
                          <div className="flex justify-between items-center border-b border-orange-100 pb-2">
                            <div>
                              <h3 className="font-bold text-slate-900 text-[12.5px] sm:text-[13px]">
                                Dine-In Summary
                              </h3>
                              <p className="text-[10.5px] text-slate-500">Order #ORD-8492 • Table T-04</p>
                            </div>
                            <span className="font-bold text-[13.5px] sm:text-[14px] text-orange-700 font-mono">
                              ₹ 1,816.50
                            </span>
                          </div>

                          <div
                            className={
                              isMobile ? "grid grid-cols-1 gap-2" : "grid grid-cols-2 gap-2.5"
                            }
                          >
                            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-orange-50/50 border border-orange-100">
                              <div className="h-9 w-9 rounded-lg bg-orange-200/80 flex items-center justify-center text-orange-800 shrink-0 font-bold text-[9.5px]">
                                FOOD
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-900 text-[11.5px] truncate">
                                  Murgh Dum Biryani
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  2x @ ₹480 = ₹960.00
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-orange-50/50 border border-orange-100">
                              <div className="h-9 w-9 rounded-lg bg-orange-200/80 flex items-center justify-center text-orange-800 shrink-0 font-bold text-[9.5px]">
                                FOOD
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-900 text-[11.5px] truncate">
                                  Paneer Tikka Angare
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  1x @ ₹380 = ₹380.00
                                </div>
                              </div>
                            </div>
                          </div>

                          {showDownloadCta && (
                            <button
                              type="button"
                              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-[12px] shadow-2xs transition cursor-pointer"
                            >
                              Download Full E-Bill & Tax Breakdown
                            </button>
                          )}

                          {showFeedbackRating && (
                            <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-center space-y-1">
                              <p className="font-bold text-amber-950 text-[10.5px]">
                                How was your food & hospitality?
                              </p>
                              <div className="flex justify-center gap-1.5 text-amber-500">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className="h-4 w-4 fill-amber-400 cursor-pointer" />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Visual Footer */}
                        <div className="bg-slate-900 p-3.5 text-white text-[10px] text-center space-y-1">
                          <p className="text-slate-300">{address}</p>
                          <p className="text-orange-300">Phone: {contactNo} • {website}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Test Email Dispatch Modal */}
      {isTestEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
                <Send className="h-4.5 w-4.5 text-teal-600" />
                Send Test Email Sample
              </h3>
              <button
                type="button"
                onClick={() => setIsTestEmailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSendTestEmail} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  required
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] text-slate-800 focus:outline-hidden focus:border-teal-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  A preview of <strong>{activeTemplateConfig.name}</strong> will be sent.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTestEmailModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 hover:bg-teal-700 px-5 py-2 text-[12.5px] font-bold text-white shadow-2xs transition cursor-pointer"
                >
                  Send Sample
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
