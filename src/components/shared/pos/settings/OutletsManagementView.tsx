import { useMemo, useState } from "react";
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Phone,
  MapPin,
  ChefHat,
  ArrowRight,
} from "lucide-react";
import type { PosOutlet } from "@/types/posMenu";
import { useOutletContext } from "@/context/PosOutletContext";
import { OutletFormModal } from "./modals/OutletFormModal";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

export function OutletsManagementView() {
  const { outlets, activeOutlet, setActiveOutlet, toggleOutletStatus, deleteVirtualOutlet } =
    useOutletContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<PosOutlet | null>(null);

  const primaryOutlets = useMemo(
    () => outlets.filter((o) => o.type === "Primary Outlet"),
    [outlets],
  );
  const virtualOutlets = useMemo(
    () => outlets.filter((o) => o.type === "Virtual Outlet"),
    [outlets],
  );

  /** Physical outlet whose virtual brands we show (active primary, or parent of active virtual). */
  const focusPrimaryId = useMemo(() => {
    if (activeOutlet.type === "Primary Outlet") return activeOutlet.id;
    if (activeOutlet.parentOutletId) return activeOutlet.parentOutletId;
    return primaryOutlets[0]?.id || "";
  }, [activeOutlet, primaryOutlets]);

  const focusPrimary =
    primaryOutlets.find((o) => o.id === focusPrimaryId) || primaryOutlets[0] || null;

  const virtualsForFocus = useMemo(() => {
    if (!focusPrimary) return virtualOutlets;
    return virtualOutlets.filter(
      (v) => !v.parentOutletId || v.parentOutletId === focusPrimary.id,
    );
  }, [virtualOutlets, focusPrimary]);

  const handleOpenCreate = () => {
    setEditingOutlet(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (outlet: PosOutlet) => {
    setEditingOutlet(outlet);
    setIsModalOpen(true);
  };

  const handleDelete = (outlet: PosOutlet) => {
    if (confirm(`Are you sure you want to delete virtual brand "${outlet.name}"?`)) {
      deleteVirtualOutlet(outlet.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-bold text-slate-900">
                Outlets & Virtual Cloud Brands
              </h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                {primaryOutlets.length} Outlets · {virtualOutlets.length} Virtual
              </span>
            </div>
            <p className="text-[12.5px] text-slate-500 mt-0.5">
              All saved HO / kitchen outlets stay listed. Virtual brands are shown for the selected
              outlet.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 px-4 py-2.5 text-[13px] font-bold text-white shadow-2xs transition cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Virtual Outlet
        </button>
      </div>

      {/* All physical / HO outlets */}
      <div className="space-y-3">
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-500">
          Outlets ({primaryOutlets.length})
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {primaryOutlets.map((outlet) => {
            const isSelected = activeOutlet.id === outlet.id;
            const isFocus = focusPrimary?.id === outlet.id;
            const childCount = virtualOutlets.filter(
              (v) => v.parentOutletId === outlet.id,
            ).length;

            return (
              <div
                key={outlet.id}
                className={`rounded-2xl border-2 bg-white p-5 shadow-xs relative overflow-hidden transition ${
                  isFocus ? "border-teal-500/80" : "border-slate-200"
                }`}
              >
                {outlet.id === "outlet-primary" ? (
                  <div className="absolute top-0 right-0 bg-teal-600 text-white text-[10.5px] font-bold uppercase tracking-wider px-4 py-1 rounded-bl-xl shadow-xs">
                    Primary Outlet (Master Kitchen)
                  </div>
                ) : (
                  <div className="absolute top-0 right-0 bg-slate-700 text-white text-[10.5px] font-bold uppercase tracking-wider px-4 py-1 rounded-bl-xl shadow-xs">
                    {outlet.cuisine || "Outlet"}
                  </div>
                )}

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="space-y-3 max-w-2xl">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-800 font-bold text-[14px] border border-teal-200">
                        {initials(outlet.name) || "HO"}
                      </div>
                      <div>
                        <h3 className="text-[17px] font-bold text-slate-900">{outlet.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-500 mt-0.5">
                          <span className="font-mono font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                            {outlet.code}
                          </span>
                          <span>•</span>
                          <span className="font-medium text-slate-700">{outlet.cuisine}</span>
                          {childCount > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-600 font-semibold">
                                {childCount} virtual brand{childCount === 1 ? "" : "s"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {outlet.description && (
                      <p className="text-[13px] text-slate-600 leading-relaxed">
                        {outlet.description}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] text-slate-600 pt-1">
                      {outlet.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="truncate">{outlet.address}</span>
                        </div>
                      )}
                      {outlet.contact && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>{outlet.contact}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11.5px] font-semibold text-slate-400 mr-1">
                        Active Channels:
                      </span>
                      {outlet.orderTypes?.map((type) => (
                        <span
                          key={type}
                          className="rounded-lg bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800 border border-teal-200"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(outlet)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit Profile
                    </button>

                    {isSelected ? (
                      <div className="flex items-center justify-center gap-1.5 rounded-xl bg-teal-50 border border-teal-200 px-4 py-2 text-[12.5px] font-bold text-teal-800">
                        <CheckCircle2 className="h-4 w-4 text-teal-600" />
                        Currently Selected
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveOutlet(outlet.id)}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 px-4 py-2 text-[12.5px] font-bold text-white shadow-2xs transition cursor-pointer"
                      >
                        Switch Context
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Virtual brands for focused parent */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
              <ChefHat className="h-4.5 w-4.5 text-indigo-600" />
              Virtual Outlets & Cloud Brands ({virtualsForFocus.length})
              {focusPrimary && (
                <span className="text-[12px] font-semibold text-slate-500 normal-case">
                  for {focusPrimary.name}
                </span>
              )}
            </h3>
            <p className="text-[12px] text-slate-500">
              Cloud brands created while this outlet is selected stay linked to it.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 text-[12.5px] font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Virtual Outlet
          </button>
        </div>

        {virtualsForFocus.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Store className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-[14px] font-bold text-slate-700">No Virtual Outlets Created</h4>
            <p className="text-[12px] text-slate-400 mt-1 max-w-sm mx-auto">
              Create virtual cloud kitchen brands for{" "}
              {focusPrimary?.name || "this outlet"} to run specialized menus on Zomato and Swiggy.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-bold text-white hover:bg-teal-700 transition cursor-pointer shadow-2xs"
            >
              + Create First Virtual Outlet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {virtualsForFocus.map((outlet) => {
              const isSelected = activeOutlet.id === outlet.id;
              const isActive = outlet.status === "Active";

              return (
                <div
                  key={outlet.id}
                  className={`rounded-2xl border bg-white p-5 shadow-2xs transition flex flex-col justify-between ${
                    isSelected
                      ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm"
                      : "border-slate-200/90 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-bold text-[14px] border border-indigo-200">
                          VO
                        </div>
                        <div>
                          <h4 className="text-[15px] font-bold text-slate-900">{outlet.name}</h4>
                          <div className="flex items-center gap-2 text-[11.5px] text-slate-500 mt-0.5">
                            <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-700 font-semibold">
                              {outlet.code}
                            </span>
                            <span>•</span>
                            <span className="truncate">{outlet.cuisine}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleOutletStatus(outlet.id)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition cursor-pointer ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                        }`}
                        title="Click to toggle status"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isActive ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {isActive ? "Active" : "Paused"}
                      </button>
                    </div>

                    {outlet.description && (
                      <p className="text-[12.5px] text-slate-600 line-clamp-2">
                        {outlet.description}
                      </p>
                    )}

                    <div className="space-y-1.5 text-[11.5px] text-slate-500 pt-1">
                      {outlet.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{outlet.address}</span>
                        </div>
                      )}
                      {outlet.contact && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{outlet.contact}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {outlet.orderTypes?.map((type) => (
                        <span
                          key={type}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-700"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(outlet)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(outlet)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition cursor-pointer"
                        title="Delete Virtual Brand"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {isSelected ? (
                      <span className="rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-[12px] font-bold text-indigo-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Active in Session
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveOutlet(outlet.id)}
                        className="rounded-lg bg-slate-800 hover:bg-slate-900 px-3.5 py-1.5 text-[12px] font-bold text-white shadow-2xs transition cursor-pointer flex items-center gap-1"
                      >
                        Select Outlet
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <OutletFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        outlet={editingOutlet}
      />
    </div>
  );
}
