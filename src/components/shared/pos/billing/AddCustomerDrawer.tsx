import { useState } from "react";
import { X, UserPlus, Phone, Mail, Award, MapPin, FileText, Check } from "lucide-react";
import { toast } from "sonner";
import { savePosCustomer, type PosCustomerRecord } from "@/services/posCustomerStore";
import type { CustomerProfile } from "@/types/posBilling";

type AddCustomerDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded: (customer: CustomerProfile) => void;
  outletId?: string;
};

export function AddCustomerDrawer({
  isOpen,
  onClose,
  onCustomerAdded,
  outletId,
}: AddCustomerDrawerProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<"Silver" | "Gold" | "Platinum VIP">("Silver");
  const [gstin, setGstin] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      toast.error("Please enter the guest full name");
      return;
    }
    if (!cleanPhone || cleanPhone.replace(/\D/g, "").length < 7) {
      toast.error("Please enter a valid mobile number");
      return;
    }

    const saved = savePosCustomer(
      {
        name: cleanName,
        phone: cleanPhone,
        email: email.trim() || undefined,
        tier,
        gstin: gstin.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      outletId
    );

    const profile: CustomerProfile = {
      id: saved.id,
      name: saved.name,
      phone: saved.phone,
      tier: saved.tier,
      loyaltyPoints: saved.loyaltyPoints,
      visitCount: saved.visitCount,
      lastVisit: saved.lastVisit,
    };

    toast.success(`Guest "${cleanName}" added and selected`);
    onCustomerAdded(profile);
    onClose();

    // Reset fields
    setName("");
    setPhone("");
    setEmail("");
    setGstin("");
    setAddress("");
    setNotes("");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-250"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-customer-title"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 id="add-customer-title" className="text-base font-bold text-slate-900">
                Add Guest
              </h2>
              <p className="text-xs text-slate-500">
                Save guest profile for billing &amp; loyalty rewards
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Drawer Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Guest Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ayush Mishra"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mobile Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>
          </div>

          {/* Customer Tier */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Membership Tier
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Silver", "Gold", "Platinum VIP"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold border transition flex flex-col items-center gap-1 cursor-pointer ${
                    tier === t
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Award className="h-3.5 w-3.5" />
                  <span className="truncate">{t}</span>
                </button>
              ))}
            </div>
          </div>

          {/* GSTIN (Tax Invoice) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              GSTIN Number <span className="text-slate-400 font-normal">(For corporate tax invoice)</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 uppercase placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition font-mono"
              />
            </div>
          </div>

          {/* Address / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Delivery Address / Special Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Suite / Apartment / Street landmark..."
                rows={2}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none"
              />
            </div>
          </div>
        </form>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary-pressed shadow-xs transition cursor-pointer"
          >
            <Check className="h-4 w-4" />
            <span>Save &amp; Select</span>
          </button>
        </div>
      </div>
    </div>
  );
}

