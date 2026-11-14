import { useState } from "react";
import { Download, FileText, BarChart2, Calendar, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export function InventoryReportsView() {
  const reports = [
    {
      title: "Daily Stock Summary Report",
      desc: "Opening, purchases, sales consumption, and closing stock valuation by day.",
      type: "PDF / Excel",
      icon: BarChart2,
    },
    {
      title: "Variance & Leakage Analysis",
      desc: "Detailed breakdown of discrepancies between ideal theoretical consumption and physical count.",
      type: "Excel",
      icon: TrendingUp,
    },
    {
      title: "Vendor Purchase & Price Variance",
      desc: "Total spends per supplier, item rate history fluctuations, and pending payments.",
      type: "PDF / Excel",
      icon: FileText,
    },
    {
      title: "Raw Material Consumption by Recipe",
      desc: "Menu item level ingredient usage and dish food cost percentage.",
      type: "Excel",
      icon: BarChart2,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Reports</h2>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            Audit logs, valuation ledgers, consumption trends, and variance analytics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[14.5px] font-bold text-slate-900">{r.title}</h3>
                  <p className="text-[12.5px] text-slate-500 mt-1 leading-relaxed">{r.desc}</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[11.5px] font-semibold text-slate-500">{r.type}</span>
                <button
                  type="button"
                  onClick={() => toast.success(`Generating and downloading ${r.title}...`)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Report
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
