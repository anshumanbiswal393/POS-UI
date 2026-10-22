import { useState, useEffect } from "react";
import { Store } from "lucide-react";
import type { PosOutlet } from "@/types/posMenu";
import { useOutletContext } from "@/context/PosOutletContext";
import { toast } from "sonner";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";

const OUTLET_TYPES = [
  "Virtual Outlet",
  "Cloud Kitchen Brand",
  "Dark Kitchen",
  "Dessert & Bakery Studio",
  "Express Takeaway Kiosk",
  "Bar & Cocktail Counter",
];

const ORDER_TYPE_OPTIONS = [
  "Dine-In",
  "Takeaway",
  "Online Delivery",
  "Room Service",
  "Aggregators",
  "Direct QR Ordering",
];

export function OutletFormModal({
  isOpen,
  onClose,
  outlet,
}: {
  isOpen: boolean;
  onClose: () => void;
  outlet?: PosOutlet | null;
}) {
  const { createVirtualOutlet, updateOutlet } = useOutletContext();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [outletType, setOutletType] = useState(OUTLET_TYPES[0]);
  const [cuisine, setCuisine] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [orderTypes, setOrderTypes] = useState<string[]>(["Online Delivery", "Takeaway"]);
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  useEffect(() => {
    if (isOpen) {
      if (outlet) {
        setName(outlet.name);
        setCode(outlet.code);
        setOutletType(outlet.type === "Primary Outlet" ? "Primary Outlet" : OUTLET_TYPES[0]);
        setCuisine(outlet.cuisine || "");
        setDescription(outlet.description || "");
        setAddress(outlet.address || "");
        setContact(outlet.contact || "");
        setOrderTypes(outlet.orderTypes || ["Online Delivery"]);
        setStatus(outlet.status || "Active");
      } else {
        setName("");
        setCode(`VO-${Math.floor(100 + Math.random() * 900)}`);
        setOutletType(OUTLET_TYPES[0]);
        setCuisine("");
        setDescription("");
        setAddress("");
        setContact("");
        setOrderTypes(["Online Delivery", "Takeaway"]);
        setStatus("Active");
      }
    }
  }, [isOpen, outlet]);

  const toggleOrderType = (type: string) => {
    setOrderTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter the outlet / brand name");
      return;
    }
    if (!code.trim()) {
      toast.error("Please enter an outlet code");
      return;
    }

    if (outlet) {
      updateOutlet(outlet.id, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        cuisine: cuisine.trim(),
        description: description.trim(),
        address: address.trim(),
        contact: contact.trim(),
        orderTypes,
        status,
      });
      onClose();
      return;
    }

    setSaving(true);
    try {
      await createVirtualOutlet({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        cuisine: cuisine.trim() || "Multi-Cuisine",
        description: description.trim(),
        address: address.trim() || "Main Restaurant Complex",
        contact: contact.trim() || "+91 98765 00000",
        orderTypes: orderTypes.length > 0 ? orderTypes : ["Online Delivery"],
        status,
      });
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { message?: string; data?: { detail?: string } })?.data?.detail ||
        (err as { message?: string })?.message ||
        "Failed to create outlet";
      toast.error(String(message));
    } finally {
      setSaving(false);
    }
  };

  const isEditingPrimary = outlet?.type === "Primary Outlet";

  return (
    <PosCreatePanel
      open={isOpen}
      onClose={onClose}
      title={
        outlet
          ? `Edit ${isEditingPrimary ? "Primary Outlet" : "Virtual Outlet"}: ${outlet.name}`
          : "Create New Virtual Outlet"
      }
      description={
        isEditingPrimary
          ? "Update master restaurant profile and core contact details"
          : "Create independent menu brand, kitchen bay, and online aggregator presence"
      }
      icon={Store}
      size="lg"
      onSubmit={(e) => void handleSubmit(e)}
      footer={
        <>
          <span className="mr-auto text-[11.5px] text-slate-500">
            {outlet
              ? "Updates persist in local state."
              : "New outlet will appear in top header selector."}
          </span>
          <PosCreateCancelButton onClick={onClose} />
          <PosCreateSubmitButton disabled={saving}>
            {saving ? "Saving…" : outlet ? "Save Changes" : "Create Virtual Outlet"}
          </PosCreateSubmitButton>
        </>
      }
    >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Outlet Name */}
            <div className="sm:col-span-2">
              <label className="block text-[12.5px] font-bold text-slate-700 mb-1">
                Outlet / Brand Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Highway Inn - Kebab & Biryani Co."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Outlet Code */}
            <div>
              <label className="block text-[12.5px] font-bold text-slate-700 mb-1">
                Outlet Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. HI-KB03"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] text-slate-900 font-mono uppercase focus:border-teal-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Outlet Type */}
            <div>
              <label className="block text-[12.5px] font-bold text-slate-700 mb-1">
                Outlet Type
              </label>
              {isEditingPrimary ? (
                <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-[13px] font-bold text-teal-800">
                  Primary Outlet (Main Flagship)
                </div>
              ) : (
                <select
                  value={outletType}
                  onChange={(e) => setOutletType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 focus:border-teal-500 focus:outline-hidden cursor-pointer font-medium"
                >
                  {OUTLET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Cuisine / Concept */}
            <div className="sm:col-span-2">
              <label className="block text-[12.5px] font-bold text-slate-700 mb-1">
                Cuisine / Brand Concept
              </label>
              <input
                type="text"
                placeholder="e.g. Authentic Dum Biryanis, Charcoal Kebabs & Mughlai"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            {/* Address / Kitchen Location */}
            <div className="sm:col-span-2">
              <label className="block text-[12.5px] font-bold text-slate-700 mb-1">
                Operating Kitchen Location / Station
              </label>
              <input
                type="text"
                placeholder="e.g. Shared Kitchen Bay 2, Main Highway Inn Complex"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-[12.5px] font-bold text-slate-700 mb-1">
                Dispatch / Counter Phone
              </label>
              <input
                type="text"
                placeholder="e.g. +91 98765 43210"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-[12.5px] font-bold text-slate-700 mb-1">
                Operational Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 focus:border-teal-500 focus:outline-hidden cursor-pointer font-semibold"
              >
                <option value="Active">🟢 Active (Accepting Orders)</option>
                <option value="Inactive">🔴 Inactive (Paused / Maintenance)</option>
              </select>
            </div>
          </div>

          {/* Supported Order Types */}
          <div>
            <label className="block text-[12.5px] font-bold text-slate-800 mb-2">
              Supported Order Channels
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ORDER_TYPE_OPTIONS.map((type) => {
                const isChecked = orderTypes.includes(type);
                return (
                  <label
                    key={type}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 cursor-pointer text-[12px] font-semibold transition ${
                      isChecked
                        ? "border-teal-500 bg-teal-50/50 text-teal-900"
                        : "border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOrderType(type)}
                      className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4 cursor-pointer"
                    />
                    <span>{type}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12.5px] font-bold text-slate-700 mb-1">
              Internal Notes / Description
            </label>
            <textarea
              rows={2}
              placeholder="Brand concept, packaging protocols, and staff notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[12.5px] text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden resize-none"
            />
          </div>
    </PosCreatePanel>
  );
}
