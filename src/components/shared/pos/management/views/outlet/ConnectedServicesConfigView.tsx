import { useState } from "react";
import {
  ConfigPageShell,
  FieldLabel,
  YesNoRadios,
} from "@/components/shared/pos/management/outlet-config/ConfigPageShell";
import { useOutletConfig } from "@/components/shared/pos/management/outlet-config/useOutletConfig";

export function ConnectedServicesConfigView() {
  const { config, persist } = useOutletConfig();
  const [form, setForm] = useState(config.connectedServices);

  return (
    <ConfigPageShell
      title="Connected Services"
      subtitle="Configure how different services connect to this outlet."
      onSave={() => persist({ ...config, connectedServices: form }, "Connected services saved")}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <FieldLabel>Connect PMS room service / in-room dining?</FieldLabel>
          <YesNoRadios
            name="pmsRoomService"
            value={form.pmsRoomService}
            onChange={(v) => setForm((p) => ({ ...p, pmsRoomService: v }))}
          />
          <p className="text-[12px] text-slate-500">Post guest charges to the room folio when enabled.</p>
        </div>
        <div className="space-y-2">
          <FieldLabel>Deduct inventory on billed items using recipes?</FieldLabel>
          <YesNoRadios
            name="inventoryConsumption"
            value={form.inventoryConsumption}
            onChange={(v) => setForm((p) => ({ ...p, inventoryConsumption: v }))}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel>Enable direct online ordering?</FieldLabel>
          <YesNoRadios
            name="onlineOrdering"
            value={form.onlineOrdering}
            onChange={(v) => setForm((p) => ({ ...p, onlineOrdering: v }))}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel>Sync aggregator menus (Zomato / Swiggy)?</FieldLabel>
          <YesNoRadios
            name="aggregatorSync"
            value={form.aggregatorSync}
            onChange={(v) => setForm((p) => ({ ...p, aggregatorSync: v }))}
          />
        </div>
      </div>
    </ConfigPageShell>
  );
}
