import { useState } from "react";
import {
  Home,
  Settings,
  ChevronLeft,
  Sparkles,
  Shield,
  Layers,
  ShoppingBag,
  Truck,
  Building,
  Users,
  CreditCard,
  Printer,
  ChevronRight,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function MarketplaceHubView() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"services" | "integration" | "subscription">(
    "services",
  );
  const [activeServicePill, setActiveServicePill] = useState("POS Plans");
  const [activeIntegrationPill, setActiveIntegrationPill] = useState("Online Orders");
  const [carouselIndex, setCarouselIndex] = useState(0);

  const servicePills = [
    "POS Plans",
    "Easy Operations",
    "CRM",
    "Customer Acquisition",
    "Retrod Capital",
  ];

  const integrationPills = [
    "Online Orders",
    "Order Delivery",
    "Accounting",
    "Customer Updates",
    "Loyalty Programs",
    "Payments",
    "Hardware",
  ];

  const serviceCardsMap: Record<
    string,
    Array<{ id: string; name: string; badge?: string | null }>
  > = {
    "POS Plans": [
      { id: "p-1", name: "Retrod POS - Renewal", badge: null },
      { id: "p-2", name: "Retrod - Growth Plan", badge: "Growth" },
      { id: "p-3", name: "Retrod - Scale Plan", badge: "Scale" },
      { id: "p-4", name: "Retrod POS + Growth Plan", badge: "Growth" },
      { id: "p-5", name: "Retrod POS + Scale Plan", badge: "Scale" },
    ],
    "Easy Operations": [
      { id: "eo-1", name: "Retrod Captain App (Waiter)", badge: "Mobile" },
      { id: "eo-2", name: "Retrod Kitchen Display (KDS)", badge: "Kitchen" },
      { id: "eo-3", name: "Retrod Inventory & Recipe", badge: "Stock" },
      { id: "eo-4", name: "Retrod Multi-Store Hub", badge: "HQ" },
      { id: "eo-5", name: "Retrod QR Digital Menu", badge: "Dine-in" },
    ],
    CRM: [
      { id: "crm-1", name: "Retrod Customer Loyalty", badge: "Rewards" },
      { id: "crm-2", name: "Retrod WhatsApp & SMS Bot", badge: "Campaigns" },
      { id: "crm-3", name: "Retrod Customer Feedback", badge: "Reviews" },
      { id: "crm-4", name: "Retrod Membership Wallet", badge: "Prepaid" },
    ],
    "Customer Acquisition": [
      { id: "ca-1", name: "Retrod Direct Online Store", badge: "0% Comm" },
      { id: "ca-2", name: "Retrod Google Order Sync", badge: "Search" },
      { id: "ca-3", name: "Retrod Social Ordering", badge: "Social" },
      { id: "ca-4", name: "Retrod Scan & Pay Table QR", badge: "Instant" },
    ],
    "Retrod Capital": [
      { id: "rc-1", name: "Retrod Growth Capital", badge: "Instant" },
      { id: "rc-2", name: "Retrod Working Capital Loan", badge: "Low Interest" },
      { id: "rc-3", name: "Retrod Equipment Financing", badge: "Asset" },
      { id: "rc-4", name: "Retrod Merchant Advance", badge: "Flexi-Pay" },
    ],
  };

  const currentServiceCards = serviceCardsMap[activeServicePill] || serviceCardsMap["POS Plans"];

  const onlineOrderCards = [
    { id: "o-1", name: "Zomato", color: "bg-rose-600 text-white", label: "zomato" },
    { id: "o-2", name: "Swiggy", color: "bg-amber-500 text-white", label: "SWIGGY" },
    { id: "o-3", name: "uEngage", color: "bg-lime-600 text-white", label: "uEngage" },
    { id: "o-4", name: "DotPe", color: "bg-black text-white", label: "DotPe" },
    { id: "o-5", name: "Airmenus", color: "bg-slate-900 text-white", label: "Airmenus" },
    {
      id: "o-6",
      name: "Retrod Aggregation - ONDC",
      color: "bg-slate-700 text-white",
      label: "ONDC",
    },
  ];

  return (
    <div className="space-y-4 w-full pb-10">
      {/* 1. Breadcrumb & Top Bar matching Screenshots 4 & 5 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <Link to="/pos" className="hover:text-slate-800">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="font-semibold text-slate-800">Marketplace</span>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/pos/management/marketplace/settings"
            className="flex items-center gap-1.5 rounded-lg border border-teal-500 bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-teal-600 shadow-2xs hover:bg-teal-50 transition cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5" />
            Marketplace Settings
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>
        </div>
      </div>

      {/* 2. Hero Banner Carousel matching Screenshots 4 & 5 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-100 via-rose-50 to-pink-100 p-6 md:p-8 border border-rose-200/60 shadow-xs">
        <div className="max-w-2xl space-y-3">
          {carouselIndex === 0 ? (
            <>
              <h1 className="text-[22px] md:text-[26px] font-extrabold text-slate-900 tracking-tight leading-tight">
                Find Next-Gen Tools To Revolutionize Your Restaurant Business
              </h1>
              <div className="inline-block rounded-md bg-slate-950 px-3 py-1.5 text-[11.5px] font-medium text-white shadow-sm">
                Explore <span className="font-bold text-amber-300">23+ services</span> &{" "}
                <span className="font-bold text-amber-300">40+ integrations</span> to make your
                restaurant operations & lives easier
              </div>
            </>
          ) : (
            <>
              <h1 className="text-[22px] md:text-[26px] font-extrabold text-slate-900 tracking-tight leading-tight">
                MANAGE EACH ASSIGNED TASK IN YOUR RESTAURANT
              </h1>
              <p className="text-[13px] text-slate-700 font-medium">
                Completion. Improve efficiency. Simplify operations.
              </p>
            </>
          )}
        </div>

        {/* Carousel indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCarouselIndex(0)}
            className={`h-2 rounded-full transition-all ${
              carouselIndex === 0 ? "w-6 bg-teal-600" : "w-2 bg-slate-400/60"
            }`}
          />
          <button
            type="button"
            onClick={() => setCarouselIndex(1)}
            className={`h-2 rounded-full transition-all ${
              carouselIndex === 1 ? "w-6 bg-teal-600" : "w-2 bg-slate-400/60"
            }`}
          />
          <button
            type="button"
            onClick={() => setCarouselIndex(0)}
            className="h-2 w-2 rounded-full bg-slate-400/60"
          />
        </div>
      </div>

      {/* 3. Primary Tab Navigation (Services, Integration, Active Subscription) */}
      <div className="border-b border-slate-200 flex flex-wrap gap-8 pt-2">
        <button
          type="button"
          onClick={() => setActiveTab("services")}
          className={`flex items-center gap-2 pb-3 text-[14px] font-bold border-b-2 transition cursor-pointer ${
            activeTab === "services"
              ? "border-teal-600 text-teal-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <span className="text-amber-500">⊞</span>
          Services
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("integration")}
          className={`flex items-center gap-2 pb-3 text-[14px] font-bold border-b-2 transition cursor-pointer ${
            activeTab === "integration"
              ? "border-teal-600 text-teal-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <span className="text-teal-600">⇄</span>
          Integration
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("subscription")}
          className={`flex items-center gap-2 pb-3 text-[14px] font-bold border-b-2 transition cursor-pointer ${
            activeTab === "subscription"
              ? "border-teal-600 text-teal-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <span className="text-rose-500">📜</span>
          Active Subscription
        </button>
      </div>

      {/* 4. Sub-category Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {activeTab === "services" &&
          servicePills.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => setActiveServicePill(pill)}
              className={`rounded-xl px-4 py-2 text-[12.5px] font-semibold transition cursor-pointer border ${
                activeServicePill === pill
                  ? "border-slate-300 bg-white text-slate-900 shadow-sm"
                  : "border-transparent text-slate-500 hover:bg-slate-100"
              }`}
            >
              {pill}
            </button>
          ))}

        {activeTab === "integration" &&
          integrationPills.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => setActiveIntegrationPill(pill)}
              className={`rounded-xl px-4 py-2 text-[12.5px] font-semibold transition cursor-pointer border ${
                activeIntegrationPill === pill
                  ? "border-slate-300 bg-white text-slate-900 shadow-sm"
                  : "border-transparent text-slate-500 hover:bg-slate-100"
              }`}
            >
              {pill}
            </button>
          ))}
      </div>

      {/* 5. Content Grid */}
      {activeTab === "services" && (
        <div className="space-y-4 pt-2">
          <div>
            <h3 className="text-[17px] font-bold text-slate-900">{activeServicePill}</h3>
            <p className="text-[12.5px] text-slate-500">
              {activeServicePill === "POS Plans"
                ? "Don't miss out on all the benefits & features of your Retrod subscription. Renew or upgrade your plan today!"
                : activeServicePill === "Retrod Capital"
                  ? "Fast, flexible financing and working capital tailored specifically for Retrod restaurant partners."
                  : `Supercharge your restaurant operations with Retrod's ${activeServicePill} suite.`}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {currentServiceCards.map((card) => (
              <div
                key={card.id}
                onClick={() => toast.info(`Viewing details for ${card.name}`)}
                className="group relative rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-xs hover:shadow-md transition cursor-pointer flex flex-col items-center justify-between min-h-[170px]"
              >
                {card.badge && (
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-hover:text-teal-600 transition" />
                )}
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 my-auto">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="text-[13px] font-bold text-slate-800 group-hover:text-teal-600 transition">
                  {card.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "integration" && (
        <div className="space-y-4 pt-2">
          <div>
            <h3 className="text-[17px] font-bold text-slate-900">{activeIntegrationPill}</h3>
            <p className="text-[12.5px] text-slate-500">
              Now manage all third-party orders from a single dashboard
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {onlineOrderCards.map((card) => (
              <div
                key={card.id}
                onClick={() => toast.info(`Connect / Configure ${card.name}`)}
                className="group rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-xs hover:shadow-md transition cursor-pointer flex flex-col items-center justify-between min-h-[170px]"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.color} font-bold text-[12px] shadow-sm my-auto`}
                >
                  {card.label.slice(0, 3)}
                </div>
                <div className="text-[13px] font-bold text-slate-800 group-hover:text-teal-600 transition">
                  {card.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "subscription" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
          {/* Card 1: Captain Application */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col items-center text-center justify-between min-h-[300px]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 mb-2">
              <span className="text-[24px]">🛎️</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-[16px] font-bold text-slate-900">Captain Application</h3>
              <p className="text-[12.5px] font-semibold text-slate-500">
                Expired on : <span className="font-mono text-slate-700">10 Mar 2026</span>
              </p>
            </div>

            <div className="text-[24px] font-extrabold text-slate-900 my-3">
              ₹ 4500 <span className="text-[13px] font-normal text-slate-500">+ Taxes</span>
            </div>

            <button
              type="button"
              onClick={() => toast.success("Initiating Captain Application renewal")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2.5 text-[12.5px] font-semibold text-slate-700 transition cursor-pointer"
            >
              Activate this service for 1 Year
            </button>
          </div>

          {/* Card 2: POS Subscription */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col items-center text-center justify-between min-h-[300px]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 mb-2">
              <Sparkles className="h-8 w-8 text-rose-600" />
            </div>

            <div className="space-y-1">
              <h3 className="text-[16px] font-bold text-slate-900">POS Subscription</h3>
              <p className="text-[12.5px] font-semibold text-slate-500">
                Expiring on :{" "}
                <span className="font-mono text-slate-700">03 Jun 2027 (274 Days Left)</span>
              </p>
            </div>

            <div className="text-[24px] font-extrabold text-slate-900 my-3">
              ₹ 7500 <span className="text-[13px] font-normal text-slate-500">+ Taxes</span>
            </div>

            <button
              type="button"
              onClick={() => toast.success("Initiating POS Subscription extension")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2.5 text-[12.5px] font-semibold text-slate-700 transition cursor-pointer"
            >
              Activate this service for 1 Year
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
