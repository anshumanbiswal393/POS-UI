import { useState, useMemo, useEffect } from "react";
import { useOutletContext } from "@/context/PosOutletContext";
import posManagementService from "@/services/posManagementService";
import { Plus, Users, Edit2, Trash2, ShieldCheck, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AddGroupModal, type GroupFormData } from "./AddGroupModal";

export interface BillerGroup {
  id: string;
  name: string;
  count: number;
  permissions: string;
  description?: string;
}

const DEFAULT_BILLER_PERMISSIONS = [
  "Billing & Cash Checkout",
  "KOT Generation & Printing",
  "Bill Settlement & Tender Split",
  "Due & Ledger Collection",
  "Table Transfer & Merge",
  "Discount & Promo Application",
  "Aggregator Delivery Accept/Reject",
  "Take Order / Floor Service",
  "Reprint Final Invoices",
  "Cash Float & Day Handover",
  "Void Items & Return Slip",
  "Customer Loyalty Enrollment",
];

export function BillerGroupManagementView() {
  const { activeOutlet } = useOutletContext();
  const [groups, setGroups] = useState<BillerGroup[]>([]);

  useEffect(() => {
    if (!activeOutlet?.id) return;
    posManagementService.getBillerGroups(activeOutlet.id).then((res) => {
      setGroups(
        (res || []).map((g) => ({
          id: g.id,
          name: g.name,
          count: g.staff_count || 0,
          permissions: "Billing, KOT, Settlement",
          description: g.description,
        }))
      );
    }).catch(() => {});
  }, [activeOutlet?.id]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<BillerGroup | null>(null);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.permissions.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q)),
    );
  }, [groups, searchQuery]);

  const existingNames = useMemo(() => groups.map((g) => g.name), [groups]);

  const totalAssignedStaff = useMemo(
    () => groups.reduce((acc, g) => acc + (g.count || 0), 0),
    [groups],
  );

  const handleSaveGroup = (groupData: GroupFormData) => {
    if (groupData.id) {
      // Edit existing group
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupData.id
            ? {
                ...g,
                name: groupData.name,
                count: groupData.count,
                permissions: groupData.permissions,
                description: groupData.description,
              }
            : g,
        ),
      );
      toast.success(`Biller group "${groupData.name}" updated successfully`);
    } else {
      // Create new group
      const newGroup: BillerGroup = {
        id: `bg-${Date.now()}`,
        name: groupData.name,
        count: groupData.count,
        permissions: groupData.permissions,
        description: groupData.description,
      };
      setGroups((prev) => [newGroup, ...prev]);
      toast.success(`New biller group "${newGroup.name}" added successfully`);
    }

    setIsAddModalOpen(false);
    setEditingGroup(null);
  };

  const handleDeleteGroup = (id: string, name: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
    toast.success(`Biller group "${name}" removed`);
  };

  return (
    <div className="space-y-6 w-full">
      {/* 1. Header & Actions - Full width space utilization */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
            Biller Group Management
          </h2>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            Define role groups and granular permission templates for counter staff and service stewards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search groups or permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3.5 py-1.5 w-52 sm:w-64 rounded-lg border border-slate-300 bg-white text-[12.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100 transition shadow-2xs"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingGroup(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-teal-700 transition cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" /> Add Biller Group
          </button>
        </div>
      </div>

      {/* 2. Overview Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Total Groups
            </div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{groups.length}</div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 border border-teal-200 text-teal-700">
            <Users className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Assigned Staff
            </div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{totalAssignedStaff}</div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Coverage
            </div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">100% Operational</div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      {/* 3. Responsive Cards Grid - Spans full remaining space */}
      {filteredGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-[15px] font-bold text-slate-800">No Biller Groups Found</h3>
          <p className="text-[13px] text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No groups match your search "${searchQuery}". Try a different term or clear the filter.`
              : "Get started by adding your first biller role group."}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setEditingGroup(null);
              setIsAddModalOpen(true);
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-teal-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Biller Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4.5">
          {filteredGroups.map((g) => (
            <div
              key={g.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-teal-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Top: Icon + Title + Action buttons */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[14.5px] text-slate-900 leading-snug">{g.name}</h3>
                      <div className="text-[12px] font-medium text-slate-500 mt-0.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {g.count} Assigned Users
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGroup(g);
                        setIsAddModalOpen(true);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-teal-700 transition cursor-pointer"
                      title={`Edit ${g.name}`}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(g.id, g.name)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                      title={`Delete ${g.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description if present */}
                {g.description && (
                  <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed">
                    {g.description}
                  </p>
                )}
              </div>

              {/* Permissions Tags */}
              <div className="border-t border-slate-100 pt-3">
                <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                  Permissions
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {g.permissions.split(",").map((perm) => {
                    const clean = perm.trim();
                    if (!clean) return null;
                    return (
                      <span
                        key={clean}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11.5px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60"
                      >
                        {clean}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Add / Edit Group Modal Form */}
      <AddGroupModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingGroup(null);
        }}
        onSave={handleSaveGroup}
        initialData={editingGroup}
        groupType="biller"
        availablePermissions={DEFAULT_BILLER_PERMISSIONS}
        existingNames={existingNames}
      />
    </div>
  );
}
