import { useState } from "react";
import { useOutletContext } from "@/context/PosOutletContext";
import {
  BookOpen,
  Store,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Layers,
} from "lucide-react";
import { ManageMenuModal } from "../modals/ManageMenuModal";
import { AddVirtualOutletModal } from "../modals/AddVirtualOutletModal";
import { useVirtualOutlets } from "@/hooks/queries/usePosMenu";

export function MenuDiscountsView() {
  const { activeOutlet } = useOutletContext();
  const [isManageMenuOpen, setIsManageMenuOpen] = useState(false);
  const [isAddOutletOpen, setIsAddOutletOpen] = useState(false);
  const { data: virtualOutlets } = useVirtualOutlets();

  return (
    <div className="space-y-6">
      {/* 2 Primary Configuration Cards from Petpooja Screenshot 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: All In One Menu */}
        <div className="group rounded-2xl border border-slate-300 bg-white p-6 shadow-xs transition hover:shadow-md hover:border-teal-300 flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-900 group-hover:text-teal-700 transition">
                All In One Menu
              </h3>
              <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">
                Manage Menu & it's related configuration from below.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsManageMenuOpen(true)}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-[13px] font-semibold text-slate-800 hover:bg-slate-50 hover:text-teal-700 transition cursor-pointer shadow-2xs"
            >
              Manage Menu
            </button>
            <span className="text-[12px] text-slate-400">Master POS Catalog</span>
          </div>
        </div>

        {/* Card 2: Add Virtual Outlet */}
        <div className="group rounded-2xl border border-slate-300 bg-white p-6 shadow-xs transition hover:shadow-md hover:border-teal-300 flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-900 group-hover:text-teal-700 transition">
                Add Virtual Outlet
              </h3>
              <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">
                Create a new virtual outlet and have the ability to control the menu independently.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsAddOutletOpen(true)}
              className="rounded-lg bg-teal-600 px-5 py-2 text-[13px] font-semibold text-white hover:bg-teal-700 shadow-xs transition cursor-pointer"
            >
              Add Outlet
            </button>
            <span className="text-[12px] text-slate-400">Multi-brand kitchen</span>
          </div>
        </div>
      </div>

      {/* Active Outlets & Menu Architecture Overview */}
      <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h4 className="text-[14px] font-bold text-slate-900">Active Outlets & Menu Control</h4>
            <p className="text-[12px] text-slate-500">
              Live outlets linked to this POS billing counter
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOutletOpen(true)}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Virtual Outlet
          </button>
        </div>

        <div className="space-y-3">
          {/* Main Outlet */}
          <div className="flex flex-wrap items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-800 font-bold text-[14px] border border-slate-200">
                {(activeOutlet?.name || "MO").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-bold text-slate-900">
                    {activeOutlet?.name || "Main Outlet"}
                  </span>
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10.5px] font-semibold text-teal-800 border border-teal-200">
                    Primary Outlet
                  </span>
                </div>
                <div className="text-[12px] text-slate-500">
                  Dine-In, Takeaway, Room Service, Aggregators · 660 active items
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsManageMenuOpen(true)}
              className="text-[12.5px] font-semibold text-teal-700 hover:underline cursor-pointer flex items-center gap-1"
            >
              Configure Menu <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Virtual Outlets */}
          {virtualOutlets?.map((outlet) => (
            <div
              key={outlet.id}
              className="flex flex-wrap items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 transition hover:bg-slate-50/60"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700 font-bold text-[14px] border border-teal-200">
                  VO
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-bold text-slate-900">{outlet.name}</span>
                    <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10.5px] font-semibold text-teal-800 border border-teal-200">
                      Virtual Cloud Brand
                    </span>
                  </div>
                  <div className="text-[12px] text-slate-500">
                    {outlet.cuisine} · {outlet.menuCount} customized items · Code: {outlet.code}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManageMenuOpen(true)}
                className="text-[12.5px] font-semibold text-teal-700 hover:underline cursor-pointer flex items-center gap-1"
              >
                Manage Items <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <ManageMenuModal isOpen={isManageMenuOpen} onClose={() => setIsManageMenuOpen(false)} />
      <AddVirtualOutletModal isOpen={isAddOutletOpen} onClose={() => setIsAddOutletOpen(false)} />
    </div>
  );
}
