import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Shield,
  ShieldCheck,
  Lock,
  UtensilsCrossed,
  Hotel,
  RefreshCw,
  CheckCircle2,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  posUsersRbacService,
  type POSRole,
  type POSPermission,
  type POSRolePermission,
} from "@/services/posUsersRbacService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function PosUserRolesView() {
  const [roles, setRoles] = useState<POSRole[]>([]);
  const [permissions, setPermissions] = useState<POSPermission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<POSRolePermission[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [roleTab, setRoleTab] = useState<"all" | "pos" | "pms">("all");

  // Modal states for creating / editing a custom role
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<POSRole | null>(null);
  const [formRoleName, setFormRoleName] = useState("");
  const [formRoleCode, setFormRoleCode] = useState("");
  const [formRoleDesc, setFormRoleDesc] = useState("");

  // Delete modal state
  const [deleteTargetRole, setDeleteTargetRole] = useState<POSRole | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rList, pList, rpList] = await Promise.all([
        posUsersRbacService.getRoles(),
        posUsersRbacService.getPermissions(),
        posUsersRbacService.getRolePermissions(),
      ]);
      setRoles(rList);
      setPermissions(pList);
      setRolePermissions(rpList);

      if (!selectedRoleId && rList.length > 0) {
        const defaultRole = rList.find((r) => r.code === "pos_cashier") || rList[0];
        setSelectedRoleId(defaultRole.id);
      }
    } catch (err: any) {
      toast.error("Failed to load roles: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isOwnerRole = (role: POSRole | null | undefined) => {
    if (!role) return false;
    return role.code === "TENANT_OWNER" || role.code === "pos_admin";
  };

  const isRoleEditable = (role: POSRole | null | undefined) => {
    if (!role) return false;
    return !role.is_managed && !isOwnerRole(role);
  };

  const filteredRoles = useMemo(() => {
    if (roleTab === "pos") {
      return roles.filter((r) => r.domain === "pos" || r.code.startsWith("pos_"));
    }
    if (roleTab === "pms") {
      return roles.filter((r) => r.domain === "pms" || (!r.code.startsWith("pos_") && r.code !== "TENANT_OWNER"));
    }
    return roles;
  }, [roles, roleTab]);

  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || roles[0] || null;
  }, [roles, selectedRoleId]);

  // Group permissions by category
  const categorizedPermissions = useMemo(() => {
    const map: Record<string, POSPermission[]> = {};
    permissions.forEach((p) => {
      const cat = p.category || "General";
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    });
    return map;
  }, [permissions]);

  const openAddRoleModal = () => {
    setEditingRole(null);
    setFormRoleName("");
    setFormRoleCode("");
    setFormRoleDesc("");
    setRoleModalOpen(true);
  };

  const openEditRoleModal = (r: POSRole) => {
    setEditingRole(r);
    setFormRoleName(r.name);
    setFormRoleCode(r.code);
    setFormRoleDesc(r.description);
    setRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRoleName.trim()) {
      toast.error("Role Name is required");
      return;
    }
    const code =
      formRoleCode.trim().toLowerCase().replace(/\s+/g, "_") ||
      `pos_${formRoleName.trim().toLowerCase().replace(/\s+/g, "_")}`;

    try {
      if (editingRole) {
        // update
        const updated = roles.map((r) =>
          r.id === editingRole.id
            ? { ...r, name: formRoleName.trim(), code, description: formRoleDesc.trim() }
            : r
        );
        setRoles(updated);
        toast.success(`Role "${formRoleName}" updated.`);
      } else {
        const created = await posUsersRbacService.createRole({
          name: formRoleName.trim(),
          code,
          description: formRoleDesc.trim() || "Custom POS staff role",
          domain: "pos",
          is_managed: false,
        });
        setRoles((prev) => [...prev, created]);
        setSelectedRoleId(created.id);
        toast.success(`Role "${formRoleName}" created successfully.`);
      }
      setRoleModalOpen(false);
    } catch (err: any) {
      toast.error("Failed to save role: " + err.message);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteTargetRole) return;
    try {
      await posUsersRbacService.deleteRole(deleteTargetRole.id);
      const remaining = roles.filter((r) => r.id !== deleteTargetRole.id);
      setRoles(remaining);
      if (selectedRoleId === deleteTargetRole.id && remaining.length > 0) {
        setSelectedRoleId(remaining[0].id);
      }
      toast.success(`Role "${deleteTargetRole.name}" deleted.`);
      setDeleteTargetRole(null);
    } catch (err: any) {
      toast.error("Failed to delete role: " + err.message);
    }
  };

  // Instant Select All
  const handleSelectAll = async () => {
    if (!selectedRole || !isRoleEditable(selectedRole)) {
      toast.info("Master Administrator permissions cannot be modified.");
      return;
    }
    const allPermIds = permissions.map((p) => p.id);
    const newItems: POSRolePermission[] = permissions.map((p) => ({
      id: `rp-${selectedRole.id}-${p.id}`,
      role: selectedRole.id,
      permission: p.id,
      permission_code: p.code,
    }));

    setRolePermissions((prev) => [
      ...prev.filter((rp) => rp.role !== selectedRole.id),
      ...newItems,
    ]);
    toast.success(`All permissions granted to ${selectedRole.name}.`);
    await posUsersRbacService.syncRolePermissions(selectedRole.id, allPermIds, "assign");
  };

  // Instant Clear All
  const handleClearAll = async () => {
    if (!selectedRole || !isRoleEditable(selectedRole)) {
      toast.info("Master Administrator permissions cannot be modified.");
      return;
    }
    const allPermIds = permissions.map((p) => p.id);
    setRolePermissions((prev) => prev.filter((rp) => rp.role !== selectedRole.id));
    toast.success(`All permissions cleared for ${selectedRole.name}.`);
    await posUsersRbacService.syncRolePermissions(selectedRole.id, allPermIds, "revoke");
  };

  // Toggle single permission
  const handleTogglePermission = async (perm: POSPermission) => {
    if (!selectedRole) return;
    if (!isRoleEditable(selectedRole)) {
      toast.info("Master Administrator permissions are fixed.");
      return;
    }

    const isAssigned = rolePermissions.some(
      (rp) => rp.role === selectedRole.id && (rp.permission === perm.id || rp.permission_code === perm.code)
    );

    if (isAssigned) {
      setRolePermissions((prev) =>
        prev.filter(
          (rp) =>
            !(
              rp.role === selectedRole.id &&
              (rp.permission === perm.id || rp.permission_code === perm.code)
            )
        )
      );
      await posUsersRbacService.syncRolePermissions(selectedRole.id, [perm.id], "revoke");
    } else {
      const newEntry: POSRolePermission = {
        id: `rp-${selectedRole.id}-${perm.id}`,
        role: selectedRole.id,
        permission: perm.id,
        permission_code: perm.code,
      };
      setRolePermissions((prev) => [...prev, newEntry]);
      await posUsersRbacService.syncRolePermissions(selectedRole.id, [perm.id], "assign");
    }
  };

  // Category Toggle
  const handleCategoryToggle = async (catPerms: POSPermission[], allSelected: boolean, categoryName: string) => {
    if (!selectedRole || !isRoleEditable(selectedRole)) {
      toast.info("Master Administrator permissions cannot be modified.");
      return;
    }
    const catPermIds = catPerms.map((p) => p.id);

    if (allSelected) {
      // Revoke all in category
      setRolePermissions((prev) =>
        prev.filter(
          (rp) =>
            !(
              rp.role === selectedRole.id &&
              catPerms.some((p) => rp.permission === p.id || rp.permission_code === p.code)
            )
        )
      );
      toast.success(`Revoked all ${categoryName} permissions.`);
      await posUsersRbacService.syncRolePermissions(selectedRole.id, catPermIds, "revoke");
    } else {
      // Assign all in category
      const newEntries: POSRolePermission[] = catPerms.map((p) => ({
        id: `rp-${selectedRole.id}-${p.id}`,
        role: selectedRole.id,
        permission: p.id,
        permission_code: p.code,
      }));
      setRolePermissions((prev) => {
        const clean = prev.filter(
          (rp) =>
            !(
              rp.role === selectedRole.id &&
              catPerms.some((p) => rp.permission === p.id || rp.permission_code === p.code)
            )
        );
        return [...clean, ...newEntries];
      });
      toast.success(`Granted all ${categoryName} permissions.`);
      await posUsersRbacService.syncRolePermissions(selectedRole.id, catPermIds, "assign");
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full overflow-y-auto bg-slate-50/50">
      {/* 1. Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-white border-b border-slate-200 shrink-0">
        <div>
          <h1 className="font-serif text-[20px] sm:text-[22px] font-bold text-slate-900 tracking-tight leading-tight">
            User Roles & Permissions
          </h1>
          <p className="text-[11px] text-slate-500">
            Define POS staff roles, grant granular terminal access, and manage operational privileges.
          </p>
        </div>

        <Button
          size="sm"
          onClick={openAddRoleModal}
          className="h-8.5 px-3 text-[12px] gap-1.5 bg-teal-800 hover:bg-teal-900 text-white cursor-pointer shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Add Custom Role</span>
        </Button>
      </div>

      {/* 2. Main Content */}
      <div className="p-4 sm:p-6 space-y-6 flex-1 min-h-0">
        {/* Domain Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] font-semibold text-slate-500">Filter Roles:</span>
            <button
              type="button"
              onClick={() => setRoleTab("all")}
              className={`px-3 py-1 text-[11.5px] font-semibold rounded-full transition cursor-pointer ${
                roleTab === "all"
                  ? "bg-teal-800 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              All Roles ({roles.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleTab("pos")}
              className={`px-3 py-1 text-[11.5px] font-semibold rounded-full transition cursor-pointer flex items-center gap-1.5 ${
                roleTab === "pos"
                  ? "bg-teal-800 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <UtensilsCrossed className="h-3 w-3" />
              Restaurant & POS ({roles.filter((r) => r.domain === "pos" || r.code.startsWith("pos_")).length})
            </button>
            <button
              type="button"
              onClick={() => setRoleTab("pms")}
              className={`px-3 py-1 text-[11.5px] font-semibold rounded-full transition cursor-pointer flex items-center gap-1.5 ${
                roleTab === "pms"
                  ? "bg-teal-800 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Hotel className="h-3 w-3" />
              Hotel / PMS ({roles.filter((r) => r.domain === "pms").length})
            </button>
          </div>
        </div>

        {/* 3. Role Cards Grid (Matching PMS Style) */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-teal-700" />
            <span className="text-xs">Loading roles...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredRoles.map((r) => {
              const isOwner = isOwnerRole(r);
              const isSelected = selectedRole?.id === r.id;
              const rolePermsCount = isOwner
                ? permissions.length
                : rolePermissions.filter((rp) => rp.role === r.id).length;

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`rounded-xl border p-4 shadow-2xs transition-all duration-200 flex flex-col justify-between cursor-pointer relative bg-white ${
                    isSelected
                      ? "border-teal-700 ring-2 ring-teal-700/20 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-bold text-slate-900 truncate">
                        {r.name}
                      </span>
                      <span
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                          isOwner
                            ? "bg-teal-50 text-teal-800 border border-teal-200"
                            : r.domain === "pos" || r.code.startsWith("pos_")
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {isOwner ? "Managed" : r.domain === "pos" ? "POS Role" : "PMS Role"}
                      </span>
                    </div>

                    <p className="mt-2 text-[11.5px] leading-relaxed text-slate-500 line-clamp-2 min-h-[34px]">
                      {r.description || "Operational role permissions configuration."}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      <strong className="text-slate-800 font-semibold">{rolePermsCount}</strong> / {permissions.length} perms
                    </span>

                    {!isOwner && (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openEditRoleModal(r)}
                          className="p-1 rounded text-slate-400 hover:text-teal-800 transition cursor-pointer"
                          title="Edit Role Details"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetRole(r)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Delete Custom Role"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Selected Role Permissions Card (Matching PMS Style) */}
        {selectedRole && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-serif text-[17px] font-bold text-slate-900">
                    Permissions for:{" "}
                    <span className="text-teal-800 font-extrabold">{selectedRole.name}</span>
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      isOwnerRole(selectedRole)
                        ? "bg-teal-50 text-teal-800 border border-teal-200"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {isOwnerRole(selectedRole) ? "Master Access" : "Custom Configuration"}
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-500 mt-1">
                  {selectedRole.description || "Configure operational permissions granted to this role."}
                </p>
              </div>

              {isRoleEditable(selectedRole) && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSelectAll}
                    className="h-8 text-xs cursor-pointer text-teal-800 hover:bg-teal-50 border-teal-300"
                  >
                    <Check className="h-3.5 w-3.5 mr-1 text-teal-700" />
                    Select All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearAll}
                    className="h-8 text-xs cursor-pointer text-rose-700 hover:bg-rose-50 border-rose-200"
                  >
                    <X className="h-3.5 w-3.5 mr-1 text-rose-600" />
                    Clear All
                  </Button>
                </div>
              )}
            </div>

            {/* Categorized Permissions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(categorizedPermissions).map(([category, catPerms]) => {
                const grantedInCat = isOwnerRole(selectedRole)
                  ? catPerms.length
                  : catPerms.filter((p) =>
                      rolePermissions.some(
                        (rp) =>
                          rp.role === selectedRole.id &&
                          (rp.permission === p.id || rp.permission_code === p.code)
                      )
                    ).length;

                const allCatSelected = grantedInCat === catPerms.length && catPerms.length > 0;

                return (
                  <div
                    key={category}
                    className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      {/* Category Header */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <Layers className="h-3.5 w-3.5 text-teal-700" />
                          <h4 className="font-bold text-[13px] text-slate-800">
                            {category}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10.5px] font-mono font-medium px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                            {grantedInCat} / {catPerms.length}
                          </span>
                          {isRoleEditable(selectedRole) && (
                            <button
                              type="button"
                              onClick={() => handleCategoryToggle(catPerms, allCatSelected, category)}
                              className="text-[11px] font-semibold text-teal-700 hover:underline cursor-pointer"
                            >
                              {allCatSelected ? "Revoke All" : "Grant All"}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Permissions List */}
                      <div className="pt-2 space-y-2">
                        {catPerms.map((perm) => {
                          const isChecked =
                            isOwnerRole(selectedRole) ||
                            rolePermissions.some(
                              (rp) =>
                                rp.role === selectedRole.id &&
                                (rp.permission === perm.id || rp.permission_code === perm.code)
                            );

                          return (
                            <label
                              key={perm.id}
                              className={`flex items-start gap-2.5 p-2 rounded-lg transition border cursor-pointer ${
                                isChecked
                                  ? "bg-white border-teal-200 shadow-2xs"
                                  : "bg-white/60 border-slate-200/60 hover:bg-white"
                              } ${!isRoleEditable(selectedRole) ? "cursor-not-allowed opacity-90" : ""}`}
                            >
                              <input
                                type="checkbox"
                                disabled={!isRoleEditable(selectedRole)}
                                checked={isChecked}
                                onChange={() => handleTogglePermission(perm)}
                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700 cursor-pointer disabled:cursor-not-allowed"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-[12px] font-semibold text-slate-800 flex items-center justify-between">
                                  <span>{perm.name}</span>
                                  <span className="text-[9.5px] font-mono text-slate-400">
                                    {perm.code}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                                  {perm.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. Add / Edit Role Modal Dialog */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <form onSubmit={handleSaveRole}>
            <DialogHeader>
              <DialogTitle className="font-serif text-[17px] font-bold text-slate-900">
                {editingRole ? "Edit Role Details" : "Create Custom Role"}
              </DialogTitle>
              <p className="text-[11px] text-slate-500">
                Define a new operational role profile for restaurant or floor staff.
              </p>
            </DialogHeader>

            <div className="py-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Role Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Floor Captain"
                  value={formRoleName}
                  onChange={(e) => setFormRoleName(e.target.value)}
                  className="w-full h-8.5 px-3 rounded-md border border-slate-300 text-[12.5px] text-slate-800 focus:border-teal-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Role Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. pos_senior_captain"
                  value={formRoleCode}
                  onChange={(e) => setFormRoleCode(e.target.value)}
                  className="w-full h-8.5 px-3 rounded-md border border-slate-300 text-[12.5px] font-mono text-slate-800 focus:border-teal-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Role Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Operational responsibilities and scope of this role..."
                  value={formRoleDesc}
                  onChange={(e) => setFormRoleDesc(e.target.value)}
                  className="w-full p-2.5 rounded-md border border-slate-300 text-[12.5px] text-slate-800 focus:border-teal-700 focus:outline-hidden"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRoleModalOpen(false)}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs bg-teal-800 hover:bg-teal-900 text-white cursor-pointer"
              >
                {editingRole ? "Save Changes" : "Create Role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Delete Role Dialog */}
      <Dialog open={!!deleteTargetRole} onOpenChange={(open) => !open && setDeleteTargetRole(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-[16px] font-bold text-slate-900">
              Delete Custom Role
            </DialogTitle>
            <p className="text-[12px] text-slate-500 leading-relaxed pt-1">
              Are you sure you want to delete role <strong>{deleteTargetRole?.name}</strong>? Any staff users assigned to this role will lose their custom permissions.
            </p>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTargetRole(null)}
              className="h-8 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDeleteRole}
              className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
