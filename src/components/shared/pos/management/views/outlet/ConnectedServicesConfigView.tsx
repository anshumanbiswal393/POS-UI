import { useState } from "react";
import { BedDouble, Package, Globe, Store, MessageCircle, Smartphone, CreditCard } from "lucide-react";
import {
  ConfigPageShell,
  YesNoRadios,
} from "@/components/shared/pos/management/outlet-config/ConfigPageShell";
import { useOutletConfig } from "@/components/shared/pos/management/outlet-config/useOutletConfig";
import { useSaveInventorySettings } from "@/hooks/queries/usePosInventory";
import type { OutletConfigState, YesNo } from "@/components/shared/pos/management/outlet-config/outletConfigStore";

const SERVICES: Array<{
  key: keyof OutletConfigState["connectedServices"];
  title: string;
  desc: string;
  icon: typeof BedDouble;
}> = [
  {
    key: "pmsRoomService",
    title: "PMS room service",
    desc: "Post guest charges to the room folio from billing.",
    icon: BedDouble,
  },
  {
    key: "inventoryConsumption",
    title: "Inventory consumption",
    desc: "Deduct raw materials from recipes when a bill is saved.",
    icon: Package,
  },
  {
    key: "onlineOrdering",
    title: "Direct online ordering",
    desc: "Accept orders from your own website / QR menu.",
    icon: Globe,
  },
  {
    key: "aggregatorSync",
    title: "Aggregator sync",
    desc: "Keep Zomato / Swiggy menus and item status in sync.",
    icon: Store,
  },
  {
    key: "whatsappBill",
    title: "WhatsApp bill",
    desc: "Send the invoice PDF to the guest on WhatsApp.",
    icon: MessageCircle,
  },
  {
    key: "smsBill",
    title: "SMS bill",
    desc: "Send a payment / invoice SMS after settlement.",
    icon: Smartphone,
  },
  {
    key: "paymentGateway",
    title: "Payment gateway",
    desc: "Collect UPI / card through the linked payment provider.",
    icon: CreditCard,
  },
];

export function ConnectedServicesConfigView() {
  const { config, persist } = useOutletConfig();
  const saveSettings = useSaveInventorySettings();
  const [form, setForm] = useState(config.connectedServices);

  return (
    <ConfigPageShell
      title="Connected Services"
      subtitle="Configure how different services gets connects."
      onSave={() => {
        persist({ ...config, connectedServices: form }, "Connected services saved");
        saveSettings.mutate({ recipeBasedConsumption: form.inventoryConsumption });
      }}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {SERVICES.map((svc) => {
          const Icon = svc.icon;
          const on = form[svc.key] === "Yes";
          return (
            <div
              key={svc.key}
              className={`rounded-2xl border p-4 ${
                on ? "border-teal-200 bg-teal-50/40" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-teal-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <div className="text-[13.5px] font-bold text-slate-900">{svc.title}</div>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{svc.desc}</p>
                  </div>
                  <YesNoRadios
                    name={svc.key}
                    value={form[svc.key]}
                    onChange={(v: YesNo) => setForm((p) => ({ ...p, [svc.key]: v }))}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ConfigPageShell>
  );
}
