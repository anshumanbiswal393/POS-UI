import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  UtensilsCrossed,
  FileEdit,
  Coins,
  BookOpen,
  RefreshCw,
  ChevronLeft,
} from "lucide-react";
import type { MenuTabKey } from "@/types/posMenu";
import { useSyncPos } from "@/hooks/queries/usePosMenu";
import { useOutletContext } from "@/context/PosOutletContext";
import { MenuListManagerView } from "./views/MenuListManagerView";
import { SpecialNoteView } from "./views/SpecialNoteView";
import { SetItemCommissionView } from "./views/SetItemCommissionView";
import { PhysicalMenuView } from "./views/PhysicalMenuView";
import { toast } from "sonner";

export function PosMenuManager() {
  const navigate = useNavigate();
  const { activeOutlet } = useOutletContext();
  const [activeTab, setActiveTab] = useState<MenuTabKey>("menu_list");
  const [lastSyncText, setLastSyncText] = useState("12 hr ago");
  const syncMutation = useSyncPos();

  const handleSyncPos = () => {
    syncMutation.mutate(undefined, {
      onSuccess: (data) => {
        setLastSyncText(data.lastSync);
        toast.success(`POS Synced successfully! ${data.totalItemsSynced} items updated.`);
      },
      onError: () => {
        toast.error("Failed to sync POS data");
      },
    });
  };

  const navMenuItems = [
    {
      id: "menu_list" as MenuTabKey,
      label: "Menu List",
      icon: UtensilsCrossed,
    },
    {
      id: "special_note_list" as MenuTabKey,
      label: "Special Notes",
      icon: FileEdit,
    },
    {
      id: "menucommission_list" as MenuTabKey,
      label: "Set Item Commission",
      icon: Coins,
    },
    {
      id: "physical_menu" as MenuTabKey,
      label: "Printed Menu",
      icon: BookOpen,
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#f8fafc]">
      {/* 1. Left Menu Sub-Navigation Rail */}
      <aside className="w-60 shrink-0 border-r border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
        <div className="py-2">
          {/* Back To Billing Link */}
          <Link
            to="/pos/billing"
            className="flex items-center gap-2.5 px-4 py-3 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-600 border-b border-slate-100 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back To Billing</span>
          </Link>

          {/* Sub Nav Items */}
          <nav className="p-2 space-y-0.5">
            {navMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition cursor-pointer text-left ${
                    isActive
                      ? "bg-teal-50/80 font-bold text-teal-600 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isActive ? "text-teal-600" : "text-slate-400"}`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Outlet Indicator in Rail Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Outlet Context
          </div>
          <div
            className="truncate text-[12px] font-bold text-slate-800 mt-0.5"
            title={activeOutlet.name}
          >
            {activeOutlet.name}
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 space-y-5 overflow-y-auto">
        {/* Top Header Bar with Outlet Title, Last Menu Sync, and Sync POS */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-bold text-slate-900">
              {activeTab === "menu_list" && "Menu List"}
              {activeTab === "special_note_list" && "Special Notes"}
              {activeTab === "menucommission_list" && "Set Item Commission"}
              {activeTab === "physical_menu" && "Printed Menu"}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Last Menu Sync indicator */}
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-1.5 text-[12px] text-amber-800 shadow-2xs">
              <RefreshCw
                className={`h-3.5 w-3.5 text-amber-600 ${syncMutation.isPending ? "animate-spin" : ""}`}
              />
              <span>
                Last Menu Sync <strong className="font-semibold">{lastSyncText}</strong>
              </span>
            </div>

            {/* Sync POS Action Button */}
            <button
              type="button"
              onClick={handleSyncPos}
              disabled={syncMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 px-4 py-1.5 text-[12.5px] font-bold text-white shadow-2xs transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${syncMutation.isPending ? "animate-spin" : ""}`}
              />
              {syncMutation.isPending ? "Syncing..." : "Sync POS"}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => {
                if (activeTab !== "menu_list") {
                  setActiveTab("menu_list");
                } else {
                  navigate({ to: "/pos/billing" });
                }
              }}
              className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </button>
          </div>
        </div>

        {/* Dynamic Sub-View Content */}
        {activeTab === "menu_list" && <MenuListManagerView />}
        {activeTab === "special_note_list" && (
          <SpecialNoteView onBack={() => setActiveTab("menu_list")} />
        )}
        {activeTab === "menucommission_list" && (
          <SetItemCommissionView onBack={() => setActiveTab("menu_list")} />
        )}
        {activeTab === "physical_menu" && (
          <PhysicalMenuView onBack={() => setActiveTab("menu_list")} />
        )}
      </div>
    </div>
  );
}
