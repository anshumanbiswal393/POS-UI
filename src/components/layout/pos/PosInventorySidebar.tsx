import { useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  LayoutDashboard,
  ShoppingCart,
  Sliders,
  Utensils,
  Trash2,
  Factory,
  BarChart2,
  Database,
  Settings,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { RetrodLogo } from "@/components/common";

export function PosInventorySidebar({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    purchase: true,
    manageStock: true,
    production: false,
    reports: false,
    masters: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isExact = (path: string) => pathname === path || pathname === `${path}/`;
  const isDashboardActive = isExact("/pos/inventory") || isExact("/pos/inventory/dashboard");

  return (
    <aside className="flex h-full w-[240px] flex-col border-r border-slate-200 bg-white text-slate-800 shadow-sm transition-all duration-200">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
        <Link
          to="/pos"
          onClick={onNavigate}
          className="flex items-center gap-2 py-1 transition-opacity hover:opacity-90 cursor-pointer"
          title="Go to POS Dashboard"
        >
          <RetrodLogo variant="light" size="md" />
          <span className="label-uppercase shrink-0 text-[9px] text-slate-400">POS</span>
        </Link>
      </div>

      {/* Navigation Scrollable Area */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3 scrollbar-thin text-[13px]">
        {/* Back To Billing */}
        <div>
          <Link
            to="/pos/billing"
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 text-slate-500" />
            <span>Back To Billing</span>
          </Link>
        </div>

        {/* Dashboard Link matching Screenshot */}
        <div>
          <Link
            to="/pos/inventory"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 font-bold transition",
              isDashboardActive
                ? "bg-teal-50 text-teal-600"
                : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            <LayoutDashboard
              className={cn("h-4 w-4", isDashboardActive ? "text-teal-600" : "text-slate-500")}
            />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Purchase Group matching Screenshot */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => toggleSection("purchase")}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingCart className="h-4 w-4 text-slate-500" />
              <span>Purchase</span>
            </div>
            {openSections.purchase ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>

          {openSections.purchase && (
            <div className="ml-4 space-y-0.5 border-l border-slate-200 pl-3 py-1">
              <Link
                to="/pos/inventory/purchase"
                onClick={onNavigate}
                className={cn(
                  "block rounded-md px-2.5 py-1.5 text-[12px] font-medium transition",
                  isExact("/pos/inventory/purchase")
                    ? "text-teal-600 font-bold bg-teal-50/70"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                )}
              >
                Stock Purchase
              </Link>
              <Link
                to="/pos/inventory/order"
                onClick={onNavigate}
                className={cn(
                  "block rounded-md px-2.5 py-1.5 text-[12px] font-medium transition",
                  isExact("/pos/inventory/order")
                    ? "text-teal-600 font-bold bg-teal-50/70"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                )}
              >
                Purchase Order
              </Link>
              <Link
                to="/pos/inventory/return"
                onClick={onNavigate}
                className={cn(
                  "block rounded-md px-2.5 py-1.5 text-[12px] font-medium transition",
                  isExact("/pos/inventory/return")
                    ? "text-teal-600 font-bold bg-teal-50/70"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                )}
              >
                Purchase Return
              </Link>
            </div>
          )}
        </div>

        {/* Manage Stock Group matching Screenshot */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => toggleSection("manageStock")}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Sliders className="h-4 w-4 text-slate-500" />
              <span>Manage Stock</span>
            </div>
            {openSections.manageStock ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>

          {openSections.manageStock && (
            <div className="ml-4 space-y-0.5 border-l border-slate-200 pl-3 py-1">
              <Link
                to="/pos/inventory/available-stock"
                onClick={onNavigate}
                className={cn(
                  "block rounded-md px-2.5 py-1.5 text-[12px] font-medium transition",
                  isExact("/pos/inventory/available-stock")
                    ? "text-teal-600 font-bold bg-teal-50/70"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                )}
              >
                Available Stock
              </Link>
              <Link
                to="/pos/inventory/closing-stock"
                onClick={onNavigate}
                className={cn(
                  "block rounded-md px-2.5 py-1.5 text-[12px] font-medium transition",
                  isExact("/pos/inventory/closing-stock")
                    ? "text-teal-600 font-bold bg-teal-50/70"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                )}
              >
                Closing Stock
              </Link>
            </div>
          )}
        </div>

        {/* Consumption Group Header matching Screenshot */}
        <div className="pt-2">
          <div className="px-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Consumption
          </div>
          <div className="space-y-0.5">
            <Link
              to="/pos/inventory/sales"
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition",
                isExact("/pos/inventory/sales")
                  ? "text-teal-600 font-bold bg-teal-50"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Utensils className="h-4 w-4 text-slate-500" />
              <span>Sales</span>
            </Link>

            <Link
              to="/pos/inventory/wastage"
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition",
                isExact("/pos/inventory/wastage")
                  ? "text-teal-600 font-bold bg-teal-50"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Trash2 className="h-4 w-4 text-slate-500" />
              <span>Wastage</span>
            </Link>
          </div>
        </div>

        {/* Other Sections matching Screenshot */}
        <div className="space-y-1 pt-1">
          <Link
            to="/pos/inventory/production"
            onClick={onNavigate}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 font-medium transition",
              isExact("/pos/inventory/production")
                ? "text-teal-600 font-bold bg-teal-50"
                : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            <div className="flex items-center gap-2.5">
              <Factory className="h-4 w-4 text-slate-500" />
              <span>Production</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </Link>

          <Link
            to="/pos/inventory/reports"
            onClick={onNavigate}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 font-medium transition",
              isExact("/pos/inventory/reports")
                ? "text-teal-600 font-bold bg-teal-50"
                : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            <div className="flex items-center gap-2.5">
              <BarChart2 className="h-4 w-4 text-slate-500" />
              <span>Reports</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </Link>

          <Link
            to="/pos/inventory/masters"
            onClick={onNavigate}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 font-medium transition",
              isExact("/pos/inventory/masters")
                ? "text-teal-600 font-bold bg-teal-50"
                : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            <div className="flex items-center gap-2.5">
              <Database className="h-4 w-4 text-slate-500" />
              <span>Masters</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </Link>

          <Link
            to="/pos/inventory/settings"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition",
              isExact("/pos/inventory/settings")
                ? "text-teal-600 font-bold bg-teal-50"
                : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            <Settings className="h-4 w-4 text-slate-500" />
            <span className="truncate">Settings (RestId - 330067)</span>
          </Link>
        </div>
      </nav>

      {/* Footer Assistance Card matching Screenshot */}
      <div className="border-t border-slate-100 p-3 bg-slate-50/50">
        <button
          type="button"
          onClick={() =>
            toast.success(
              "Callback requested! Our inventory support team will call you within 15 minutes.",
            )
          }
          className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 text-left text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600">
            <HelpCircle className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-bold text-slate-900">Need Assistance ?</div>
            <div className="text-[10.5px] font-semibold text-teal-600 hover:underline truncate">
              Request a Callback.
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
}
