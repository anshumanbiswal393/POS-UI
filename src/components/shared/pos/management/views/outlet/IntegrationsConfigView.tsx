import { useState } from "react";
import {
  ConfigPageShell,
  SettingRow,
  YesNoRadios,
} from "@/components/shared/pos/management/outlet-config/ConfigPageShell";
import { useDraftOnChange, useOutletConfig } from "@/components/shared/pos/management/outlet-config/useOutletConfig";
import { Store, BedDouble, MessageCircle, CreditCard } from "lucide-react";

export function IntegrationsConfigView() {
  const { config, persist, saveDraft, outletId } = useOutletConfig();
  const [form, setForm] = useState(
    config.integrations || {
      aggregatorSync: "No" as const,
      pmsRoomService: "Yes" as const,
      whatsappBill: "No" as const,
      smsBill: "No" as const,
      paymentGateway: "No" as const,
    },
  );
  useDraftOnChange("integrations", form, (c, f) => ({ ...c, integrations: f }), saveDraft, outletId);

  const handleSave = () =>
    persist({ ...config, integrations: form }, "Integrations configuration saved", "integrations");

  return (
    <ConfigPageShell
      title="Integrations"
      subtitle="Connect with external systems and third-party integrations."
      onSave={handleSave}
      stepId="integrations"
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Store className="h-4.5 w-4.5 text-teal-700" />
            <h3 className="text-[15px] font-bold text-slate-900">Food Delivery Aggregators</h3>
          </div>
          <SettingRow label="Sync menu with Zomato & Swiggy (UrbanPiper)?">
            <YesNoRadios
              name="aggregatorSync"
              value={form.aggregatorSync}
              onChange={(v) => setForm((p) => ({ ...p, aggregatorSync: v }))}
            />
          </SettingRow>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <BedDouble className="h-4.5 w-4.5 text-teal-700" />
            <h3 className="text-[15px] font-bold text-slate-900">Property Management System (PMS)</h3>
          </div>
          <SettingRow label="Direct PMS Folio Room Charge Integration?">
            <YesNoRadios
              name="pmsRoomService"
              value={form.pmsRoomService}
              onChange={(v) => setForm((p) => ({ ...p, pmsRoomService: v }))}
            />
          </SettingRow>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <MessageCircle className="h-4.5 w-4.5 text-teal-700" />
            <h3 className="text-[15px] font-bold text-slate-900">Customer Messaging & Notifications</h3>
          </div>
          <SettingRow label="Send digital bills to guest WhatsApp?">
            <YesNoRadios
              name="whatsappBill"
              value={form.whatsappBill}
              onChange={(v) => setForm((p) => ({ ...p, whatsappBill: v }))}
            />
          </SettingRow>
          <SettingRow label="Send SMS delivery notifications?">
            <YesNoRadios
              name="smsBill"
              value={form.smsBill}
              onChange={(v) => setForm((p) => ({ ...p, smsBill: v }))}
            />
          </SettingRow>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <CreditCard className="h-4.5 w-4.5 text-teal-700" />
            <h3 className="text-[15px] font-bold text-slate-900">Payment Gateway & Hardware</h3>
          </div>
          <SettingRow label="Enable Dynamic UPI QR code on billing display?">
            <YesNoRadios
              name="paymentGateway"
              value={form.paymentGateway}
              onChange={(v) => setForm((p) => ({ ...p, paymentGateway: v }))}
            />
          </SettingRow>
        </section>
      </div>
    </ConfigPageShell>
  );
}
