import { useMemo, useState } from "react";
import {
  Building2,
  PhoneCall,
  Clock,
  CreditCard,
  FileSpreadsheet,
  Monitor,
  Image,
  Calculator,
  Share2,
  Printer,
  Users,
  Copy,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { useOutletContext } from "@/context/PosOutletContext";
import { loadOutletConfig } from "@/components/shared/pos/management/outlet-config/outletConfigStore";

type ConfigCard = {
  title: string;
  desc: string;
  icon: typeof Building2;
  to: string;
};

const outletInfoCards: ConfigCard[] = [
  {
    title: "Outlet Details",
    desc: "Configure email id, address, Logo of an Outlet.",
    icon: Building2,
    to: "/pos/management/configuration/outlet/details",
  },
  {
    title: "Contact Details",
    desc: "Configure contact details of you and your staff to be reached by the Retrod team.",
    icon: PhoneCall,
    to: "/pos/management/configuration/outlet/contact",
  },
  {
    title: "Outlet Timings",
    desc: "Configure Closing hours, lunch & dinner timings, timing information to display on various places.",
    icon: Clock,
    to: "/pos/management/configuration/outlet/timings",
  },
  {
    title: "Payment",
    desc: "Configure Currency and Payment Types available.",
    icon: CreditCard,
    to: "/pos/management/configuration/outlet/payment",
  },
  {
    title: "Invoice Sequence",
    desc: "Configure multiple invoice sequence",
    icon: FileSpreadsheet,
    to: "/pos/management/configuration/outlet/invoice-sequence",
  },
];

const billingScreenCards: ConfigCard[] = [
  {
    title: "Display",
    desc: "Configure the billing screen display, look & values.",
    icon: Monitor,
    to: "/pos/management/configuration/outlet/display",
  },
  {
    title: "Set Your Print Logo",
    desc: "Logo to print at your desktop point of sale.",
    icon: Image,
    to: "/pos/management/configuration/outlet/print-logo",
  },
  {
    title: "Calculations",
    desc: "Configure how invoice gets calculate.",
    icon: Calculator,
    to: "/pos/management/configuration/outlet/calculations",
  },
  {
    title: "Connected Services",
    desc: "Configure how different services gets connects.",
    icon: Share2,
    to: "/pos/management/configuration/outlet/connected-services",
  },
  {
    title: "Print",
    desc: "Configure the print settings of the Bill and KOT.",
    icon: Printer,
    to: "/pos/management/configuration/outlet/print",
  },
  {
    title: "Customer",
    desc: "Configure the billing screen and It's component.",
    icon: Users,
    to: "/pos/management/configuration/outlet/customer",
  },
];

function CardGrid({ cards }: { cards: ConfigCard[] }) {
  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center text-[13px] text-slate-500">
        No matching configuration.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.title}
            to={card.to}
            className="group flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-300 bg-white p-5 shadow-xs transition hover:border-teal-400 hover:shadow-sm"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-teal-700">
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0 space-y-1">
              <h4 className="text-[14px] font-bold text-slate-900 transition group-hover:text-teal-700">
                {card.title}
              </h4>
              <p className="text-[12px] leading-relaxed text-slate-500">{card.desc}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function OutletConfigurationHubView() {
  const { activeOutlet } = useOutletContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const q = searchQuery.trim().toLowerCase();
  const filteredOutlet = useMemo(
    () =>
      outletInfoCards.filter(
        (c) => !q || c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q),
      ),
    [q],
  );
  const filteredBilling = useMemo(
    () =>
      billingScreenCards.filter(
        (c) => !q || c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q),
      ),
    [q],
  );

  const handleCopyConfig = async () => {
    try {
      const snapshot = loadOutletConfig(activeOutlet.id);
      await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
      toast.success("Outlet configuration copied to clipboard");
    } catch {
      toast.info("Could not copy configuration");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold tracking-tight text-slate-900">Outlet Configuration</h2>
          <p className="mt-0.5 text-[12.5px] text-slate-500">
            Below are the configuration to manage your outlet information.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[12px] font-semibold text-slate-700">
            • Restaurant: ID - <span className="font-mono font-bold text-teal-700">{activeOutlet.code || "330067"}</span>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[12px] font-semibold text-slate-700">
            • Desktop Version : <span className="font-mono font-bold text-teal-700">126.0.1</span>
          </div>
          <button
            type="button"
            onClick={() => void handleCopyConfig()}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            <Copy className="h-3.5 w-3.5 text-slate-500" />
            Copy Config
          </button>
          {showSearch ? (
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-44 rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-[12.5px] focus:border-teal-500 focus:outline-none"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
            >
              Search <Search className="h-3.5 w-3.5 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[14.5px] font-bold text-slate-900">Outlet Information</h3>
        <CardGrid cards={filteredOutlet} />
      </div>

      <div className="space-y-3">
        <h3 className="text-[14.5px] font-bold text-slate-900">Billing Screen</h3>
        <CardGrid cards={filteredBilling} />
      </div>
    </div>
  );
}
