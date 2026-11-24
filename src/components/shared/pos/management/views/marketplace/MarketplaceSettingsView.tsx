import { useState } from "react";
import { toast } from "sonner";

export function MarketplaceSettingsView() {
  const [activeTab, setActiveTab] = useState<"pos_subscription" | "online_integration">(
    "pos_subscription",
  );

  const [ebillMethod, setEbillMethod] = useState<"text" | "whatsapp">("whatsapp");
  const [expiryDays, setExpiryDays] = useState("2");
  const [senderId, setSenderId] = useState("");

  const handleSave = () => {
    toast.success("Marketplace settings saved successfully!");
  };

  return (
    <div className="space-y-4 w-full pb-10">
      {/* 1. Header matching Screenshot 3 */}
      <div>
        <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
          Marketplace Settings
        </h2>
      </div>

      {/* 2. Split Layout: Left vertical tabs + Right Settings form matching Screenshot 3 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left vertical tab rail */}
        <div className="md:col-span-3 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setActiveTab("pos_subscription")}
              className={`text-left px-5 py-3.5 text-[13px] font-semibold border-l-4 transition cursor-pointer ${
                activeTab === "pos_subscription"
                  ? "border-teal-600 bg-teal-50/50 text-teal-600"
                  : "border-transparent text-slate-700 hover:bg-slate-50"
              }`}
            >
              POS Subscription
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("online_integration")}
              className={`text-left px-5 py-3.5 text-[13px] font-semibold border-l-4 transition cursor-pointer ${
                activeTab === "online_integration"
                  ? "border-teal-600 bg-teal-50/50 text-teal-600"
                  : "border-transparent text-slate-700 hover:bg-slate-50"
              }`}
            >
              Online Orders Integration
            </button>
          </div>
        </div>

        {/* Right Configuration panel */}
        <div className="md:col-span-9 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <h3 className="text-[15px] font-bold text-slate-900 border-b border-slate-100 pb-3">
            {activeTab === "pos_subscription" ? "POS Subscription" : "Online Orders Integration"}
          </h3>

          {activeTab === "pos_subscription" ? (
            <div className="space-y-6">
              {/* Field 1: How Would You Like To Send The Ebill Messages To You Customers? */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-900 block">
                  How Would You Like To Send The Ebill Messages To You Customers?
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="ebillMethod"
                      checked={ebillMethod === "text"}
                      onChange={() => setEbillMethod("text")}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                    Text message
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="ebillMethod"
                      checked={ebillMethod === "whatsapp"}
                      onChange={() => setEbillMethod("whatsapp")}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                    WhatsApp Message
                  </label>
                </div>
                <p className="text-[11.5px] text-slate-500">
                  [Note: This configuration would not work if you have an active WhatsApp campaign
                  or Green Receipt to send the ebill to customers.]
                </p>
              </div>

              {/* Field 2: Expiry time */}
              <div className="space-y-1.5 max-w-md">
                <label className="text-[13px] font-bold text-slate-900 block">
                  Provide No. Of Days To Set As POS Subscription Link Expiry Time.
                </label>
                <input
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
                />
                <p className="text-[11.5px] text-slate-500">
                  [Mentioning &ldquo;0&rdquo; days will consider as Link will not to expire ever.]
                </p>
              </div>

              {/* Field 3: Sender ID */}
              <div className="space-y-1.5 max-w-md">
                <label className="text-[13px] font-bold text-slate-900 block">Sender ID</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. DM-PPOOJA"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] font-mono text-slate-800 uppercase focus:border-teal-500 focus:outline-none"
                />
                <p className="text-[11.5px] text-slate-500">
                  [Enter your 6 characters Sender ID. The sender ID is the name of the eBill sender
                  which will display on the customer&apos;s phone eg. DM-PPOOJA or MD-PTPOOJ.]
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[13px] text-slate-600">
                Third-party online delivery aggregation webhook triggers and automatic item toggle
                settings.
              </p>
            </div>
          )}

          {/* Bottom Save Action matching Screenshot 3 */}
          <div className="border-t border-slate-100 pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-teal-600 px-6 py-2 text-[13px] font-bold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
