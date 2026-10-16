import { useState } from "react";
import {
  Star,
  FileText,
  ArrowRight,
  Eye,
  TrendingUp,
  BarChart2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";

export function OtherReportsView() {
  const [activeTab, setActiveTab] = useState<
    | "bookmarked"
    | "movements"
    | "closing_tracking"
    | "po_monitoring"
    | "cost_profitability"
    | "all_other"
  >("bookmarked");

  const tabs = [
    { id: "bookmarked", label: "Bookmarked Reports" },
    { id: "movements", label: "Purchase And Transfer Movements" },
    { id: "closing_tracking", label: "Closing Stock Tracking" },
    { id: "po_monitoring", label: "Purchase Order Monitoring" },
    { id: "cost_profitability", label: "Cost & Profitability" },
    { id: "all_other", label: "Other Reports" },
  ] as const;

  const bookmarkedReports = [
    {
      title: "Consumption Summary",
      desc: "Displays raw material consumption details, including usage from bills, wastage, transfers, and capturing all types of movements.",
      iconBg: "bg-teal-50 text-teal-600",
      icon: RefreshCw,
    },
    {
      title: "Opening - Closing Report",
      desc: "Displays opening and closing balances, avg purchase price, and total stock value for each raw material over the selected period.",
      iconBg: "bg-emerald-50 text-emerald-600",
      icon: BarChart2,
    },
    {
      title: "Food Costing Report",
      desc: "Cost analysis of each menu item, including raw material cost, sales price, and calculated profit margin percentage.",
      iconBg: "bg-amber-50 text-amber-600",
      icon: TrendingUp,
    },
    {
      title: "Recipe Costing",
      desc: "Shows the estimated cost and profit of a menu item before billing, based on recipe ingredients and selected material prices.",
      iconBg: "bg-purple-50 text-purple-600",
      icon: FileText,
    },
  ];

  const movementReports = [
    {
      title: "Goods Received Note (GRN) Summary",
      desc: "Complete chronological audit trail of all vendor invoices received and accepted at store.",
      iconBg: "bg-teal-50 text-teal-600",
      icon: FileText,
    },
    {
      title: "Inter-Outlet / Section Transfer Ledger",
      desc: "Detailed movement vouchers between kitchen, bar, central warehouse, and banquet pantry.",
      iconBg: "bg-emerald-50 text-emerald-600",
      icon: RefreshCw,
    },
  ];

  const closingReports = [
    {
      title: "Daily Closing Variance Log",
      desc: "Calculates difference between physical counting entries and theoretical closing stock.",
      iconBg: "bg-amber-50 text-amber-600",
      icon: BarChart2,
    },
    {
      title: "Closing Stock Submission Audit",
      desc: "Staff compliance log showing exact timestamp and user ID when daily closing stock was locked.",
      iconBg: "bg-teal-50 text-teal-600",
      icon: FileText,
    },
  ];

  const poReports = [
    {
      title: "Pending Purchase Orders Tracking",
      desc: "List of open POs issued to vendors awaiting delivery fulfillment or acknowledgment.",
      iconBg: "bg-purple-50 text-purple-600",
      icon: FileText,
    },
  ];

  const costReports = [
    {
      title: "Gross Margin & Food Cost % Matrix",
      desc: "Identifies top high-margin dishes and dishes where ingredient inflation reduced profitability.",
      iconBg: "bg-emerald-50 text-emerald-600",
      icon: TrendingUp,
    },
  ];

  const getActiveList = () => {
    switch (activeTab) {
      case "bookmarked":
        return bookmarkedReports;
      case "movements":
        return movementReports;
      case "closing_tracking":
        return closingReports;
      case "po_monitoring":
        return poReports;
      case "cost_profitability":
        return costReports;
      default:
        return bookmarkedReports;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Tabs matching Screenshot 4 */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-4 py-2.5 text-[13px] font-semibold transition cursor-pointer ${
              activeTab === tab.id
                ? "border-b-2 border-teal-600 text-teal-600 font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Subheader description matching Screenshot 4 */}
      <div className="pt-2">
        <h3 className="text-[14px] font-bold text-slate-900">
          {tabs.find((t) => t.id === activeTab)?.label}
        </h3>
        <p className="text-[12.5px] text-slate-500 mt-0.5">
          {activeTab === "bookmarked"
            ? "This section shows all the reports you've bookmarked for easy and frequent access."
            : `Detailed analytical reports and ledgers for ${tabs.find((t) => t.id === activeTab)?.label}.`}
        </p>
      </div>

      {/* Cards Grid matching Screenshot 4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-1">
        {getActiveList().map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.title}
              className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-teal-300 hover:shadow-sm transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${r.iconBg}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.info(`Bookmarked status toggled for ${r.title}`)}
                    className="text-amber-400 hover:text-amber-500 cursor-pointer"
                    title="Bookmarked"
                  >
                    <Star className="h-4 w-4 fill-amber-400" />
                  </button>
                </div>

                <div>
                  <h4 className="text-[14px] font-bold text-slate-900 leading-snug">{r.title}</h4>
                  <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{r.desc}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toast.success(`Opening ${r.title}...`)}
                  className="text-[12px] font-semibold text-teal-600 hover:text-teal-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  View Report <ArrowRight className="h-3 w-3" />
                </button>

                <ExportToExcelButton
                  onClick={() => toast.success(`Downloading ${r.title} (Excel)...`)}
                  className="h-7 px-2.5 text-[10.5px]"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
