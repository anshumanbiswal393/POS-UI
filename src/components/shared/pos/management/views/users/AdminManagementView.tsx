import { useState, useMemo } from "react";
import { Plus, Eye, Edit2, Trash2, ShieldCheck, X, Building2, Mail, Phone, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid } from "@/components/ui/data-grid";
import type { DataGridColumn } from "@/components/ui/data-grid/types";
import { AddAdminUserModal, type AdminUserFormData } from "./AddAdminUserModal";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  type: string;
  outlet: string;
  phone?: string;
  status: "Active" | "Inactive";
  createdDate: string;
}

export function AdminManagementView() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [viewingAdmin, setViewingAdmin] = useState<AdminUser | null>(null);

  const existingEmails = useMemo(() => admins.map((a) => a.email), [admins]);

  const handleSaveAdmin = (data: AdminUserFormData) => {
    if (data.id) {
      // Edit existing admin
      setAdmins((prev) =>
        prev.map((a) =>
          a.id === data.id
            ? {
                ...a,
                name: data.name,
                email: data.email,
                type: data.type,
                outlet: data.outlet,
                phone: data.phone,
                status: data.status,
              }
            : a,
        ),
      );
      toast.success(`Admin user "${data.name}" updated successfully`);
    } else {
      // Add new admin user
      const formattedDate = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const newAdmin: AdminUser = {
        id: `adm-${Date.now()}`,
        name: data.name,
        email: data.email,
        type: data.type,
        outlet: data.outlet,
        phone: data.phone,
        status: data.status,
        createdDate: formattedDate,
      };

      setAdmins((prev) => [newAdmin, ...prev]);
      toast.success(`New admin user "${newAdmin.name}" added successfully`);
    }

    setIsAddModalOpen(false);
    setEditingAdmin(null);
  };

  const handleDeleteAdmin = (id: string, name: string) => {
    setAdmins((prev) => prev.filter((a) => a.id !== id));
    toast.success(`Removed admin user "${name}"`);
  };

  const columns: DataGridColumn<AdminUser>[] = [
    {
      id: "name",
      header: "Admin User",
      sortable: true,
      filterable: true,
      width: 180,
      render: (val: any) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-50 text-teal-700 font-bold text-xs border border-teal-200">
            {val.charAt(0)}
          </div>
          <span className="font-semibold text-slate-900">{val}</span>
        </div>
      ),
    },
    {
      id: "email",
      header: "Email Address",
      sortable: true,
      filterable: true,
      width: 220,
      render: (val: any) => <span className="font-mono text-xs text-slate-600">{val}</span>,
    },
    {
      id: "type",
      header: "Role / Access Level",
      sortable: true,
      filterable: true,
      width: 170,
      render: (val: any) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
          <ShieldCheck className="h-3 w-3" />
          <span>{val}</span>
        </span>
      ),
    },
    {
      id: "outlet",
      header: "Outlet Assignment",
      sortable: true,
      filterable: true,
      width: 220,
      render: (val: any) => <span className="text-xs text-slate-800 font-medium">{val}</span>,
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      filterable: true,
      align: "center",
      width: 120,
      render: (val: any) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            val === "Active"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-slate-100 text-slate-600 border border-slate-200"
          }`}
        >
          {val}
        </span>
      ),
    },
    {
      id: "createdDate",
      header: "Created Date",
      sortable: true,
      width: 140,
      render: (val: any) => <span className="text-slate-500 text-xs">{val}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      width: 120,
      render: (_: any, row: AdminUser) => (
        <div className="flex items-center justify-end gap-1 text-slate-400">
          <button
            type="button"
            onClick={() => setViewingAdmin(row)}
            className="p-1 hover:text-teal-600 hover:bg-slate-100 rounded transition cursor-pointer"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingAdmin(row);
              setIsAddModalOpen(true);
            }}
            className="p-1 hover:text-teal-600 hover:bg-slate-100 rounded transition cursor-pointer"
            title="Edit User"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteAdmin(row.id, row.name)}
            className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
            title="Delete User"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
            Admin & User Access Management
          </h2>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            Configure franchise manager accounts, biler logins, and access permissions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingAdmin(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-teal-700 shadow-xs transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Admin User</span>
        </button>
      </div>

      {/* 2. Interactive Data Grid */}
      <PosDataGrid
        data={admins}
        columns={columns}
        keyField="id"
        title="Admin User Accounts"
        subtitle="Manage user credentials and role hierarchies"
        showToolbar
        selectable
        storageKey="pos-admin-management"
        themeVariant="primary"
        pageSize={10}
      />

      {/* 3. Add / Edit Admin User Modal */}
      <AddAdminUserModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingAdmin(null);
        }}
        onSave={handleSaveAdmin}
        initialData={
          editingAdmin
            ? {
                id: editingAdmin.id,
                name: editingAdmin.name,
                email: editingAdmin.email,
                type: editingAdmin.type,
                outlet: editingAdmin.outlet,
                phone: editingAdmin.phone || "",
                status: editingAdmin.status,
              }
            : null
        }
        existingEmails={existingEmails}
      />

      {/* 4. Admin Profile View Modal */}
      {viewingAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingAdmin(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900">{viewingAdmin.name}</h3>
                  <p className="text-[12px] text-slate-500">{viewingAdmin.type}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingAdmin(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-3.5 text-[13px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Email Address</span>
                <span className="font-mono text-slate-900">{viewingAdmin.email}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Role Privilege</span>
                <span className="font-semibold text-slate-900">{viewingAdmin.type}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Outlet Scope</span>
                <span className="text-slate-900 font-medium">{viewingAdmin.outlet}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Mobile Phone</span>
                <span className="font-mono text-slate-900">{viewingAdmin.phone || "—"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-slate-500">Account Created</span>
                <span className="text-slate-700">{viewingAdmin.createdDate}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Access Status</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    viewingAdmin.status === "Active"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {viewingAdmin.status}
                </span>
              </div>
            </div>
            <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewingAdmin(null)}
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
