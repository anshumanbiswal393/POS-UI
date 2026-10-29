import { useState } from "react";
import {
  ConfigPageShell,
  SettingRow,
  YesNoRadios,
} from "@/components/shared/pos/management/outlet-config/ConfigPageShell";
import { useDraftOnChange, useOutletConfig } from "@/components/shared/pos/management/outlet-config/useOutletConfig";
import { Utensils, ShoppingBag, BedDouble, Truck } from "lucide-react";

export function ServiceModeConfigView() {
  const { config, persist, saveDraft, outletId } = useOutletConfig();
  const sm = config.serviceMode || {
    dineIn: "Yes" as const,
    takeaway: "Yes" as const,
    roomService: "Yes" as const,
    delivery: "Yes" as const,
    autoAcceptDelivery: "No" as const,
    printToken: "Yes" as const,
  };
  const [form, setForm] = useState(sm);
  useDraftOnChange("service-mode", form, (c, f) => ({ ...c, serviceMode: f }), saveDraft, outletId);

  const handleSave = () =>
    persist({ ...config, serviceMode: form }, "Service modes saved successfully", "service-mode");

  return (
    <ConfigPageShell
      title="Service Mode"
      subtitle="Configure service modes (Dine-in, Takeaway, Room Service etc.)."
      onSave={handleSave}
      stepId="service-mode"
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Utensils className="h-4.5 w-4.5 text-teal-700" />
            <h3 className="text-[15px] font-bold text-slate-900">Dine-In Restaurant Service</h3>
          </div>
          <SettingRow label="Enable Table Dine-In Service?">
            <YesNoRadios
              name="dineIn"
              value={form.dineIn}
              onChange={(v) => setForm((p) => ({ ...p, dineIn: v }))}
            />
          </SettingRow>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <ShoppingBag className="h-4.5 w-4.5 text-teal-700" />
            <h3 className="text-[15px] font-bold text-slate-900">Takeaway & Quick Counter Pickup</h3>
          </div>
          <SettingRow label="Enable Takeaway Orders?">
            <YesNoRadios
              name="takeaway"
              value={form.takeaway}
              onChange={(v) => setForm((p) => ({ ...p, takeaway: v }))}
            />
          </SettingRow>
          <SettingRow label="Print order token number on receipt?">
            <YesNoRadios
              name="printToken"
              value={form.printToken}
              onChange={(v) => setForm((p) => ({ ...p, printToken: v }))}
            />
          </SettingRow>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <BedDouble className="h-4.5 w-4.5 text-teal-700" />
            <h3 className="text-[15px] font-bold text-slate-900">In-Room Dining / Room Service</h3>
          </div>
          <SettingRow label="Enable Room Service folio posting?">
            <YesNoRadios
              name="roomService"
              value={form.roomService}
              onChange={(v) => setForm((p) => ({ ...p, roomService: v }))}
            />
          </SettingRow>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Truck className="h-4.5 w-4.5 text-teal-700" />
            <h3 className="text-[15px] font-bold text-slate-900">Online Delivery & Aggregators</h3>
          </div>
          <SettingRow label="Accept Direct Online Orders?">
            <YesNoRadios
              name="delivery"
              value={form.delivery}
              onChange={(v) => setForm((p) => ({ ...p, delivery: v }))}
            />
          </SettingRow>
          <SettingRow label="Auto-accept incoming aggregator orders?">
            <YesNoRadios
              name="autoAcceptDelivery"
              value={form.autoAcceptDelivery}
              onChange={(v) => setForm((p) => ({ ...p, autoAcceptDelivery: v }))}
            />
          </SettingRow>
        </section>
      </div>
    </ConfigPageShell>
  );
}
