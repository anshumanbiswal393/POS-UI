import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Building2, ChefHat, Plus, Store } from "lucide-react";
import { useOutletContext } from "@/context/PosOutletContext";
import { isBackendOutletId, isHighwayDemoOutlet } from "@/utils/outletId";
import { locationRoleLabel } from "@/utils/outletKind";
import type { PosOutlet } from "@/types/posMenu";

function roleBadgeClass(role: "HO" | "Kitchen" | "Outlet") {
  if (role === "HO") return "bg-indigo-50 text-indigo-800 border-indigo-200";
  if (role === "Kitchen") return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-teal-50 text-teal-800 border-teal-200";
}

export function OutletListView() {
  const { outlets, isLoadingOutlets, refreshOutlets } = useOutletContext();

  const rows = useMemo(
    () =>
      outlets.filter((o) => !isHighwayDemoOutlet(o.id)),
    [outlets],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold tracking-tight text-slate-900">Outlet List</h2>
          <p className="mt-0.5 text-[12.5px] text-slate-500 max-w-xl">
            All Head Offices, dining outlets, and kitchens for this property. Highway Inn demo data
            stays out of this list. Take Order only uses dining outlets.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/pos/management/outlet/ho"
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-xs hover:bg-teal-700 transition"
          >
            <Building2 className="h-3.5 w-3.5" />
            Add HO
          </Link>
          <Link
            to="/pos/management/outlet/kitchen"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <ChefHat className="h-3.5 w-3.5" />
            Add Kitchen
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoadingOutlets ? (
          <div className="px-4 py-16 text-center text-[13px] text-slate-500">Loading locations…</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-16 text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
              <Store className="h-6 w-6" />
            </div>
            <div className="text-[14px] font-bold text-slate-800">No locations yet</div>
            <p className="text-[12.5px] text-slate-500 max-w-md mx-auto">
              Add a Head Office, Kitchen, or use an existing restaurant outlet.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Link
                to="/pos/management/outlet/ho"
                className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-[12px] font-semibold text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Add HO
              </Link>
              <Link
                to="/pos/management/outlet/kitchen"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700"
              >
                Add Kitchen
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead className="bg-teal-800 text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">City</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row: PosOutlet) => {
                  const role = locationRoleLabel(row);
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-semibold text-slate-900">{row.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold ${roleBadgeClass(role)}`}
                        >
                          {role}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{row.code}</td>
                      <td className="px-4 py-3 text-slate-600">{row.city || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            row.status === "Active"
                              ? "font-semibold text-teal-700"
                              : "font-semibold text-slate-400"
                          }
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-slate-400">—</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => void refreshOutlets()}
        className="text-[12px] font-semibold text-teal-700 hover:underline"
      >
        Refresh list
      </button>
    </div>
  );
}
