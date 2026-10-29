import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  ConfigPageShell,
  FieldLabel,
  TextInput,
} from "@/components/shared/pos/management/outlet-config/ConfigPageShell";
import { useDraftOnChange, useOutletConfig } from "@/components/shared/pos/management/outlet-config/useOutletConfig";
import type { StaffContact } from "@/components/shared/pos/management/outlet-config/outletConfigStore";

function ContactBlock({
  title,
  name,
  mobile,
  email,
  onName,
  onMobile,
  onEmail,
}: {
  title: string;
  name: string;
  mobile: string;
  email: string;
  onName: (v: string) => void;
  onMobile: (v: string) => void;
  onEmail: (v: string) => void;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/40 p-4">
      <h4 className="text-[13px] font-bold text-slate-800">{title}</h4>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="space-y-1.5">
          <FieldLabel>Name</FieldLabel>
          <TextInput value={name} onChange={onName} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Mobile</FieldLabel>
          <TextInput value={mobile} onChange={onMobile} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Email</FieldLabel>
          <TextInput type="email" value={email} onChange={onEmail} />
        </div>
      </div>
    </section>
  );
}

export function ContactDetailsConfigView() {
  const { config, persist, saveDraft, outletId } = useOutletConfig();
  const [form, setForm] = useState(config.contact);
  useDraftOnChange("contact", form, (c, f) => ({ ...c, contact: f }), saveDraft, outletId);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateStaff = (id: string, patch: Partial<StaffContact>) => {
    setForm((prev) => ({
      ...prev,
      staff: prev.staff.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));
  };

  const handleSave = () => {
    if (!form.ownerName.trim() || !form.ownerMobile.trim()) {
      toast.error("Owner name and mobile are required");
      return;
    }
    return persist({ ...config, contact: form }, "Contact details saved", "contact");
  };

  return (
    <ConfigPageShell
      title="Contact Details"
      subtitle="Configure contact details of you and your staff to be reached by the Retrod team."
      onSave={handleSave}
      stepId="contact"
    >
      <div className="space-y-4">
        <ContactBlock
          title="Owner"
          name={form.ownerName}
          mobile={form.ownerMobile}
          email={form.ownerEmail}
          onName={(v) => update("ownerName", v)}
          onMobile={(v) => update("ownerMobile", v)}
          onEmail={(v) => update("ownerEmail", v)}
        />
        <ContactBlock
          title="Outlet Manager"
          name={form.managerName}
          mobile={form.managerMobile}
          email={form.managerEmail}
          onName={(v) => update("managerName", v)}
          onMobile={(v) => update("managerMobile", v)}
          onEmail={(v) => update("managerEmail", v)}
        />
        <ContactBlock
          title="Accounts"
          name={form.accountsName}
          mobile={form.accountsMobile}
          email={form.accountsEmail}
          onName={(v) => update("accountsName", v)}
          onMobile={(v) => update("accountsMobile", v)}
          onEmail={(v) => update("accountsEmail", v)}
        />

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[13px] font-bold text-slate-800">Additional staff contacts</h4>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  staff: [
                    ...prev.staff,
                    {
                      id: `st-${Date.now()}`,
                      role: "Staff",
                      name: "",
                      mobile: "",
                      email: "",
                    },
                  ],
                }))
              }
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-[12px] font-semibold text-teal-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Add contact
            </button>
          </div>

          {form.staff.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-[12.5px] text-slate-500">
              No additional staff contacts yet.
            </p>
          ) : (
            form.staff.map((row) => (
              <div key={row.id} className="grid grid-cols-1 items-end gap-3 rounded-xl border border-slate-100 p-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                <div className="space-y-1.5">
                  <FieldLabel>Role</FieldLabel>
                  <TextInput value={row.role} onChange={(v) => updateStaff(row.id, { role: v })} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Name</FieldLabel>
                  <TextInput value={row.name} onChange={(v) => updateStaff(row.id, { name: v })} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Mobile</FieldLabel>
                  <TextInput value={row.mobile} onChange={(v) => updateStaff(row.id, { mobile: v })} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Email</FieldLabel>
                  <TextInput value={row.email} onChange={(v) => updateStaff(row.id, { email: v })} />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, staff: prev.staff.filter((s) => s.id !== row.id) }))
                  }
                  className="mb-0.5 cursor-pointer rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </section>
      </div>
    </ConfigPageShell>
  );
}
