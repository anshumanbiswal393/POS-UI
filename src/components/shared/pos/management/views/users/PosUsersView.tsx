import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Key,
  ShieldCheck,
  Check,
  X,
  Phone,
  Mail,
  Store,
  Calendar,
  Lock,
  Download,
  Users as UsersIcon,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  posUsersRbacService,
  type POSUser,
  type POSUserPayload,
  type POSRole,
} from "@/services/posUsersRbacService";
import { useOutletContext } from "@/context/PosOutletContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function PosUsersView() {
  const { outlets, activeOutlet } = useOutletContext();
  const [users, setUsers] = useState<POSUser[]>([]);
  const [roles, setRoles] = useState<POSRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<POSUser | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formOutletId, setFormOutletId] = useState("");
  const [formPin, setFormPin] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  // Reset PIN Modal State
  const [pinTargetUser, setPinTargetUser] = useState<POSUser | null>(null);
  const [newPin, setNewPin] = useState("");

  // Delete Confirmation State
  const [deleteTargetUser, setDeleteTargetUser] = useState<POSUser | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, rList] = await Promise.all([
        posUsersRbacService.getUsers(),
        posUsersRbacService.getRoles(),
      ]);
      setUsers(uList);
      setRoles(rList);
    } catch (err: any) {
      toast.error("Failed to load staff users: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setFormName("");
    setFormUsername("");
    setFormEmail("");
    setFormPhone("");
    setFormRole(roles[1]?.code || roles[0]?.code || "pos_cashier");
    setFormOutletId(activeOutlet?.id || (outlets[0]?.id ? String(outlets[0].id) : ""));
    setFormPin("");
    setFormPassword("");
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (u: POSUser) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormUsername(u.username);
    setFormEmail(u.email);
    setFormPhone(u.phone || "");
    setFormRole(u.role || u.role_code || "pos_waiter");
    setFormOutletId(u.outlet_id || activeOutlet?.id || "");
    setFormPin(u.pin || u.user_code || "");
    setFormPassword("");
    setFormIsActive(u.is_active);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Full Name is required");
      return;
    }

    const selectedRoleObj = roles.find((r) => r.code === formRole || r.id === formRole);
    const selectedOutletObj = outlets.find((o) => String(o.id) === formOutletId);

    const payload: POSUserPayload = {
      name: formName.trim(),
      username: formUsername.trim() || formName.trim().toLowerCase().replace(/\s+/g, "."),
      email: formEmail.trim(),
      phone: formPhone.trim() || undefined,
      role: formRole,
      outlet_id: formOutletId || undefined,
      outlet_name: selectedOutletObj?.name || activeOutlet?.name || "Main Outlet",
      user_code: formPin.trim() || undefined,
      pin: formPin.trim() || undefined,
      password: formPassword.trim() || undefined,
      is_active: formIsActive,
    };

    try {
      if (editingUser) {
        await posUsersRbacService.updateUser(editingUser.id, payload);
        toast.success(`Staff user "${formName}" updated successfully.`);
      } else {
        await posUsersRbacService.createUser(payload);
        toast.success(`Staff user "${formName}" created successfully.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error("Failed to save user: " + err.message);
    }
  };

  const handleToggleStatus = async (user: POSUser) => {
    try {
      await posUsersRbacService.updateUser(user.id, { is_active: !user.is_active });
      toast.success(`${user.name} is now ${!user.is_active ? "Active" : "Inactive"}`);
      loadData();
    } catch (err: any) {
      toast.error("Failed to toggle status: " + err.message);
    }
  };

  const handleSavePin = async () => {
    if (!pinTargetUser) return;
    if (!newPin.trim() || newPin.length < 4) {
      toast.error("PIN must be at least 4 digits");
      return;
    }
    try {
      await posUsersRbacService.updateUser(pinTargetUser.id, {
        pin: newPin.trim(),
        user_code: newPin.trim(),
      });
      toast.success(`Terminal PIN for ${pinTargetUser.name} updated.`);
      setPinTargetUser(null);
      setNewPin("");
      loadData();
    } catch (err: any) {
      toast.error("Failed to update PIN: " + err.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTargetUser) return;
    try {
      await posUsersRbacService.deleteUser(deleteTargetUser.id);
      toast.success(`User ${deleteTargetUser.name} removed.`);
      setDeleteTargetUser(null);
      loadData();
    } catch (err: any) {
      toast.error("Failed to delete user: " + err.message);
    }
  };

  const exportToCsv = () => {
    if (filteredUsers.length === 0) {
      toast.info("No records to export");
      return;
    }
    const headers = ["Name", "Username", "Email", "Phone", "Role", "Outlet", "Status", "Created At"];
    const rows = filteredUsers.map((u) => [
      `"${u.name}"`,
      `"${u.username}"`,
      `"${u.email}"`,
      `"${u.phone || ""}"`,
      `"${u.role_name || u.role}"`,
      `"${u.outlet_name || ""}"`,
      `"${u.is_active ? "Active" : "Inactive"}"`,
      `"${u.created_at || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pos_staff_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q));

      const matchesRole =
        roleFilter === "all" ||
        u.role === roleFilter ||
        u.role_code === roleFilter ||
        u.role_name?.toLowerCase() === roleFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && u.is_active) ||
        (statusFilter === "inactive" && !u.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full overflow-y-auto bg-slate-50/50">
      {/* 1. Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-white border-b border-slate-200 shrink-0">
        <div>
          <h1 className="font-serif text-[20px] sm:text-[22px] font-bold text-slate-900 tracking-tight leading-tight">
            Users
          </h1>
          <p className="text-[11px] text-slate-500">
            Manage POS staff accounts, assign operational roles, and set terminal PINs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={exportToCsv}
            className="h-8.5 px-3 text-[12px] gap-1.5 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export</span>
          </Button>

          <Button
            size="sm"
            onClick={openAddModal}
            className="h-8.5 px-3 text-[12px] gap-1.5 bg-teal-800 hover:bg-teal-900 text-white cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add User</span>
          </Button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="px-4 sm:px-6 py-3 bg-white border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
          {/* Search */}
          <div className="relative flex-1 max-w-xs sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 w-full rounded-md border border-slate-200 bg-slate-50/50 pl-8.5 pr-3 text-[12px] text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-8.5 rounded-md border border-slate-200 bg-slate-50/50 px-2.5 text-[12px] text-slate-700 focus:border-teal-700 focus:bg-white focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-8.5 rounded-md border border-slate-200 bg-slate-50/50 px-2.5 text-[12px] text-slate-700 focus:border-teal-700 focus:bg-white focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="text-[11px] font-medium text-slate-500">
          Showing <strong className="text-slate-800">{filteredUsers.length}</strong> of {users.length} staff
        </div>
      </div>

      {/* 3. Users Table / Empty State */}
      <div className="p-4 sm:p-6 flex-1 min-h-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-teal-700" />
            <span className="text-xs">Loading staff users...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-dashed border-slate-300 rounded-xl text-center max-w-xl mx-auto my-6 shadow-2xs">
            <div className="h-12 w-12 rounded-full bg-teal-50 text-teal-800 flex items-center justify-center mb-3">
              <UsersIcon className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-[16px] font-bold text-slate-900 mb-1">
              No staff users found
            </h3>
            <p className="text-[12px] text-slate-500 max-w-sm mb-4">
              {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                ? "No staff members match the selected filters. Try clearing your search."
                : "No users have been onboarded yet. Add your cashiers, captains, waiters, and kitchen staff to get started."}
            </p>
            <Button
              size="sm"
              onClick={openAddModal}
              className="bg-teal-800 hover:bg-teal-900 text-white text-xs gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add First User
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-teal-900 text-white text-[11px] font-bold uppercase tracking-wider divide-x divide-teal-800/60">
                    <th className="px-4 py-3">User Details</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Assigned Outlet</th>
                    <th className="px-4 py-3">Terminal PIN</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[12px]">
                  {filteredUsers.map((u) => {
                    const initials = u.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/70 transition-colors divide-x divide-slate-100"
                      >
                        {/* 1. User Details */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-900 font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 truncate">
                                {u.name}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 truncate">
                                {u.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3 text-slate-400" />
                                    {u.email}
                                  </span>
                                )}
                                {u.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3 text-slate-400" />
                                    {u.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Role */}
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                            {u.role_name || u.role}
                          </span>
                        </td>

                        {/* 3. Assigned Outlet */}
                        <td className="px-4 py-3 text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <Store className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium text-[11.5px] truncate">
                              {u.outlet_name || "Main Restaurant"}
                            </span>
                          </div>
                        </td>

                        {/* 4. Terminal PIN */}
                        <td className="px-4 py-3">
                          {u.pin || u.user_code ? (
                            <button
                              type="button"
                              onClick={() => {
                                setPinTargetUser(u);
                                setNewPin("");
                              }}
                              className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-200 cursor-pointer"
                              title="Click to change PIN"
                            >
                              <Lock className="h-3 w-3 text-slate-500" />
                              <span>••••</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setPinTargetUser(u);
                                setNewPin("");
                              }}
                              className="text-[10.5px] text-teal-700 hover:underline font-medium cursor-pointer"
                            >
                              + Set PIN
                            </button>
                          )}
                        </td>

                        {/* 5. Status Toggle */}
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold transition cursor-pointer ${
                              u.is_active
                                ? "bg-teal-50 text-teal-800 border border-teal-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                u.is_active ? "bg-teal-600" : "bg-slate-400"
                              }`}
                            />
                            {u.is_active ? "Active" : "Inactive"}
                          </button>
                        </td>

                        {/* 6. Created Date */}
                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>

                        {/* 7. Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              className="p-1 rounded text-slate-500 hover:text-teal-800 hover:bg-slate-100 transition cursor-pointer"
                              title="Edit user details"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPinTargetUser(u);
                                setNewPin("");
                              }}
                              className="p-1 rounded text-slate-500 hover:text-amber-700 hover:bg-slate-100 transition cursor-pointer"
                              title="Reset POS PIN"
                            >
                              <Key className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTargetUser(u)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete user"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 4. Add / Edit User Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          <form onSubmit={handleSaveUser}>
            <DialogHeader className="px-6 pt-5 pb-3 border-b border-slate-100 bg-slate-50/70">
              <DialogTitle className="font-serif text-[18px] font-bold text-slate-900">
                {editingUser ? "Edit Staff User" : "Add New Staff User"}
              </DialogTitle>
              <p className="text-[11px] text-slate-500">
                Enter details to register or update restaurant staff account credentials.
              </p>
            </DialogHeader>

            <div className="px-6 py-4 space-y-3.5 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full h-8.5 px-3 rounded-md border border-slate-300 text-[12.5px] text-slate-800 focus:border-teal-700 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ramesh.k"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full h-8.5 px-3 rounded-md border border-slate-300 text-[12.5px] text-slate-800 focus:border-teal-700 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Role *
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full h-8.5 px-2.5 rounded-md border border-slate-300 text-[12.5px] text-slate-800 focus:border-teal-700 focus:outline-hidden cursor-pointer"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.code}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="ramesh@restaurant.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full h-8.5 px-3 rounded-md border border-slate-300 text-[12.5px] text-slate-800 focus:border-teal-700 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full h-8.5 px-3 rounded-md border border-slate-300 text-[12.5px] text-slate-800 focus:border-teal-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Assigned Outlet
                  </label>
                  <select
                    value={formOutletId}
                    onChange={(e) => setFormOutletId(e.target.value)}
                    className="w-full h-8.5 px-2.5 rounded-md border border-slate-300 text-[12.5px] text-slate-800 focus:border-teal-700 focus:outline-hidden cursor-pointer"
                  >
                    {outlets.map((o) => (
                      <option key={o.id} value={String(o.id)}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    POS Terminal PIN (4 Digits)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="e.g. 1234"
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ""))}
                    className="w-full h-8.5 px-3 rounded-md border border-slate-300 text-[12.5px] text-slate-800 font-mono tracking-widest focus:border-teal-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {editingUser ? "Change Web Password (Optional)" : "Web Password (Optional)"}
                </label>
                <input
                  type="password"
                  placeholder="Leave empty to use OTP or keep existing"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full h-8.5 px-3 rounded-md border border-slate-300 text-[12.5px] text-slate-800 focus:border-teal-700 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-[12px] font-semibold text-slate-700">Account Active</span>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700 cursor-pointer"
                />
              </div>
            </div>

            <DialogFooter className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs bg-teal-800 hover:bg-teal-900 text-white cursor-pointer"
              >
                {editingUser ? "Save Changes" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Reset PIN Dialog */}
      <Dialog open={!!pinTargetUser} onOpenChange={(open) => !open && setPinTargetUser(null)}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-[16px] font-bold text-slate-900">
              Reset Terminal PIN
            </DialogTitle>
            <p className="text-[11px] text-slate-500">
              Set a quick 4-digit numeric login PIN for <strong>{pinTargetUser?.name}</strong>.
            </p>
          </DialogHeader>

          <div className="py-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              New 4-Digit PIN
            </label>
            <input
              type="password"
              maxLength={6}
              autoFocus
              placeholder="••••"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              className="w-full h-9 px-3 rounded-md border border-slate-300 text-center text-lg font-mono tracking-widest text-slate-900 focus:border-teal-700 focus:outline-hidden"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPinTargetUser(null)}
              className="h-8 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSavePin}
              className="h-8 text-xs bg-teal-800 hover:bg-teal-900 text-white cursor-pointer"
            >
              Update PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Delete Confirmation Dialog */}
      <Dialog open={!!deleteTargetUser} onOpenChange={(open) => !open && setDeleteTargetUser(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-[16px] font-bold text-slate-900">
              Remove Staff User
            </DialogTitle>
            <p className="text-[12px] text-slate-500 leading-relaxed pt-1">
              Are you sure you want to remove <strong>{deleteTargetUser?.name}</strong>? This user will lose access to billing and kitchen terminals.
            </p>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTargetUser(null)}
              className="h-8 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDeleteUser}
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
