import { useState, useMemo, useEffect } from "react";
import { useOutletContext } from "@/context/PosOutletContext";
import posManagementService from "@/services/posManagementService";
import { Plus, RefreshCw, Eye, Edit2, Copy, Trash2, CheckCircle2, Download, X } from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid";
import { AddBillerUserModal, type StaffUserFormData } from "./AddBillerUserModal";

export interface StaffUser {
  id: string;
  name: string;
  username: string;
  userCode: string;
  status: boolean;
  phone?: string;
  email?: string;
  billerGroup?: string;
}

export function BillerAppManagementView() {
  const { activeOutlet } = useOutletContext();
  const [activeTab, setActiveTab] = useState<
    "biller" | "captain" | "delivery_boy" | "waiter" | "order_acceptance"
  >("biller");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ colId: string; direction: "asc" | "desc" } | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [viewingUser, setViewingUser] = useState<StaffUser | null>(null);

  // 1. Biller Users (Screenshot 1)
  const [billerUsers, setBillerUsers] = useState<StaffUser[]>([]);

  useEffect(() => {
    if (!activeOutlet?.id) return;
    posManagementService.getStaffUsers(activeOutlet.id).then((res) => {
      const staff = (res || []).map((s) => ({
        id: s.id,
        name: s.name,
        username: s.user_code || s.name.toLowerCase().replace(/\s+/g, ""),
        userCode: s.user_code || "-",
        phone: s.phone || "-",
        billerGroup: s.biller_group_name || "General Staff",
        status: s.is_active,
      }));
      setBillerUsers(staff);
    }).catch(() => {});
  }, [activeOutlet?.id]);

  // 2. Captain Users (Screenshot 2)
  const [captainUsers, setCaptainUsers] = useState<StaffUser[]>([]);

  // 3. Delivery Boy Users
  const [deliveryUsers, setDeliveryUsers] = useState<StaffUser[]>([]);

  // 4. Waiter Users
  const [waiterUsers, setWaiterUsers] = useState<StaffUser[]>([]);

  // 5. Order Acceptance App (Screenshot 3)
  const [orderAcceptanceUsers, setOrderAcceptanceUsers] = useState<StaffUser[]>([]);

  const tabs = [
    { id: "biller", label: "Biller" },
    { id: "captain", label: "Captain" },
    { id: "delivery_boy", label: "Delivery Boy" },
    { id: "waiter", label: "Waiter" },
    { id: "order_acceptance", label: "Order Acceptance App" },
  ] as const;

  const currentList =
    activeTab === "biller"
      ? billerUsers
      : activeTab === "captain"
        ? captainUsers
        : activeTab === "delivery_boy"
          ? deliveryUsers
          : activeTab === "waiter"
            ? waiterUsers
            : orderAcceptanceUsers;

  const titleText =
    activeTab === "biller"
      ? "Biller"
      : activeTab === "captain"
        ? "Captain"
        : activeTab === "delivery_boy"
          ? "Delivery Boy"
          : activeTab === "waiter"
            ? "Waiter"
            : "Order Acceptance App";

  const existingUsernames = useMemo(
    () => currentList.map((u) => u.username),
    [currentList],
  );

  const toggleStatus = (id: string) => {
    const updater = (list: StaffUser[]) =>
      list.map((u) => (u.id === id ? { ...u, status: !u.status } : u));

    if (activeTab === "biller") setBillerUsers(updater);
    else if (activeTab === "captain") setCaptainUsers(updater);
    else if (activeTab === "delivery_boy") setDeliveryUsers(updater);
    else if (activeTab === "waiter") setWaiterUsers(updater);
    else setOrderAcceptanceUsers(updater);

    toast.success("User access status updated");
  };

  const handleDeleteUser = (id: string, name: string) => {
    const updater = (list: StaffUser[]) => list.filter((u) => u.id !== id);
    if (activeTab === "biller") setBillerUsers(updater);
    else if (activeTab === "captain") setCaptainUsers(updater);
    else if (activeTab === "delivery_boy") setDeliveryUsers(updater);
    else if (activeTab === "waiter") setWaiterUsers(updater);
    else setOrderAcceptanceUsers(updater);

    toast.success(`User "${name}" removed from ${titleText} list`);
  };

  const handleCopyUser = (user: StaffUser) => {
    const info = `Role: ${titleText}\nName: ${user.name}\nUsername: ${user.username}\nCode: ${user.userCode}\nMobile: ${user.phone || "-"}\nStatus: ${user.status ? "Active" : "Inactive"}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(info);
    }
    toast.success(`Copied login credentials for ${user.name}`);
  };

  const handleSaveUser = (userData: StaffUserFormData) => {
    if (userData.id) {
      // Edit existing user
      const updater = (list: StaffUser[]) =>
        list.map((u) =>
          u.id === userData.id
            ? {
                ...u,
                name: userData.name,
                username: userData.username,
                userCode: userData.userCode,
                status: userData.status,
                phone: userData.phone,
                email: userData.email,
                billerGroup: userData.billerGroup,
              }
            : u,
        );

      if (activeTab === "biller") setBillerUsers(updater);
      else if (activeTab === "captain") setCaptainUsers(updater);
      else if (activeTab === "delivery_boy") setDeliveryUsers(updater);
      else if (activeTab === "waiter") setWaiterUsers(updater);
      else setOrderAcceptanceUsers(updater);

      toast.success(`${titleText} "${userData.name}" updated successfully`);
    } else {
      // Add new user
      const prefix =
        activeTab === "biller"
          ? "b"
          : activeTab === "captain"
            ? "c"
            : activeTab === "delivery_boy"
              ? "d"
              : activeTab === "waiter"
                ? "w"
                : "oa";

      const newUser: StaffUser = {
        id: `${prefix}-${Date.now()}`,
        name: userData.name,
        username: userData.username,
        userCode: userData.userCode,
        status: userData.status,
        phone: userData.phone,
        email: userData.email,
        billerGroup: userData.billerGroup,
      };

      const updater = (list: StaffUser[]) => [newUser, ...list];

      if (activeTab === "biller") setBillerUsers(updater);
      else if (activeTab === "captain") setCaptainUsers(updater);
      else if (activeTab === "delivery_boy") setDeliveryUsers(updater);
      else if (activeTab === "waiter") setWaiterUsers(updater);
      else setOrderAcceptanceUsers(updater);

      toast.success(`New ${titleText} "${newUser.name}" added successfully`);
    }

    setIsAddModalOpen(false);
    setEditingUser(null);
  };

  const columns: PosDataGridColumn<StaffUser>[] = useMemo(
    () => [
      {
        id: "name",
        label: `${titleText} Name`,
        sortable: true,
        filterable: true,
        defaultWidth: 200,
        getValue: (r) => r.name,
        cell: ({ row }) => <span className="font-medium text-slate-800">{row.name}</span>,
      },
      {
        id: "username",
        label: "User Name",
        sortable: true,
        filterable: true,
        defaultWidth: 180,
        getValue: (r) => r.username,
        cell: ({ row }) => <span className="font-mono text-[12.5px] text-slate-600">{row.username}</span>,
      },
      {
        id: "userCode",
        label: "User Code",
        sortable: true,
        filterable: true,
        defaultWidth: 140,
        getValue: (r) => r.userCode,
        cell: ({ row }) => <span className="font-mono text-[12.5px] text-slate-700">{row.userCode}</span>,
      },
      {
        id: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        align: "center",
        defaultWidth: 130,
        getValue: (r) => (r.status ? "Active" : "Inactive"),
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => toggleStatus(row.id)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              row.status ? "bg-teal-600" : "bg-slate-300"
            }`}
            title={`Click to ${row.status ? "deactivate" : "activate"}`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                row.status ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        ),
      },
      {
        id: "actions",
        label: "Action",
        sortable: false,
        filterable: false,
        align: "right",
        defaultWidth: 150,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setViewingUser(row)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition cursor-pointer"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingUser(row);
                setIsAddModalOpen(true);
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition cursor-pointer"
              title="Edit Profile"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleCopyUser(row)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition cursor-pointer"
              title="Copy Credentials"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteUser(row.id, row.name)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
              title="Delete User"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [titleText],
  );

  return (
    <div className="space-y-4">
      {/* 1. Dynamic Header matching Screenshots */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">{titleText}</h2>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Order Acceptance specific badges */}
          {activeTab === "order_acceptance" && (
            <>
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                App Activated
              </div>
              <button
                type="button"
                onClick={() => toast.info("Downloading Order Acceptance APK...")}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                Download App
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => toast.success("Sync code generated and dispatched via SMS")}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            Sync Code
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingUser(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create
          </button>
        </div>
      </div>

      {/* 2. Tab Navigation Bar */}
      <div className="border-b border-slate-200 flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedIds([]);
              setCurrentPage(1);
            }}
            className={`px-4 py-2.5 text-[13px] font-medium transition cursor-pointer border-b-2 ${
              activeTab === tab.id
                ? "border-teal-600 text-teal-600 font-bold"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Data Table with PosDataGrid */}
      <PosDataGrid
        data={currentList}
        columns={columns}
        keyField="id"
        selectable
        selectedRowIds={selectedIds}
        onSelectionChange={(ids: any) => setSelectedIds(ids as string[])}
        storageKey={`pos-users-${activeTab}`}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        themeVariant="primary"
        itemName="users"
      />

      {/* 4. Add / Edit User Form Modal with strict validations & mandatory markings */}
      <AddBillerUserModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        initialData={
          editingUser
            ? {
                id: editingUser.id,
                name: editingUser.name,
                username: editingUser.username,
                userCode: editingUser.userCode,
                phone: editingUser.phone || "",
                email: editingUser.email || "",
                billerGroup: editingUser.billerGroup || "Main Counter Cashiers",
                status: editingUser.status,
              }
            : null
        }
        roleTitle={titleText}
        existingUsernames={existingUsernames}
      />

      {/* 5. Staff User Profile View Modal */}
      {viewingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingUser(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900">{viewingUser.name}</h3>
                  <p className="text-[12px] text-slate-500 font-mono">@{viewingUser.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-3.5 text-[13px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Role / Category</span>
                <span className="font-semibold text-slate-900">{titleText}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">User Code (PIN)</span>
                <span className="font-mono font-medium text-slate-800">{viewingUser.userCode || "-"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Mobile Number</span>
                <span className="font-mono text-slate-800">{viewingUser.phone || "—"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Email Address</span>
                <span className="text-slate-800">{viewingUser.email || "—"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Biller Group</span>
                <span className="font-medium text-slate-800">{viewingUser.billerGroup || "Main Counter Cashiers"}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Access Status</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    viewingUser.status
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {viewingUser.status ? "Active Access" : "Inactive / Suspended"}
                </span>
              </div>
            </div>
            <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="rounded-lg bg-teal-600 px-4 py-1.5 text-[12.5px] font-semibold text-white hover:bg-teal-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
