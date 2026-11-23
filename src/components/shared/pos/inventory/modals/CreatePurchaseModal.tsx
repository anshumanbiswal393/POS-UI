import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import {
  useCreatePurchase,
  useInventoryVendors,
  useStockItems,
} from "@/hooks/queries/usePosInventory";
import { toast } from "sonner";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";
import {
  StockSkuLines,
  emptySkuLine,
  lineAmount,
  toPurchaseItems,
} from "@/components/shared/pos/inventory/StockSkuLines";

export function CreatePurchaseModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: vendors } = useInventoryVendors();
  const { data: stockItems = [] } = useStockItems();
  const createMutation = useCreatePurchase();

  const [vendorName, setVendorName] = useState("Metro Cash & Carry");
  const [invoiceNo, setInvoiceNo] = useState(`INV-${Math.floor(10000 + Math.random() * 90000)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [discountAmount, setDiscountAmount] = useState("0");
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [discountRate, setDiscountRate] = useState("0");
  const [taxAmount, setTaxAmount] = useState("0");
  const [taxType, setTaxType] = useState<"flat" | "percent">("flat");
  const [taxRate, setTaxRate] = useState("5");
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Unpaid" | "Partial">("Paid");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([emptySkuLine()]);

  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + lineAmount(line), 0), [lines]);
  const rawDiscount =
    discountType === "percent"
      ? Math.round(subtotal * (parseFloat(discountRate) || 0)) / 100
      : parseFloat(discountAmount) || 0;
  const discount = Math.min(subtotal, Math.max(0, rawDiscount));
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax =
    taxType === "percent"
      ? Math.round(taxableAmount * (parseFloat(taxRate) || 0)) / 100
      : parseFloat(taxAmount) || 0;
  const total = Math.round((taxableAmount + tax) * 100) / 100;
  const items = toPurchaseItems(lines);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNo.trim()) {
      toast.error("Please enter an Invoice Number");
      return;
    }
    if (items.length === 0) {
      toast.error("Add at least one stock SKU");
      return;
    }

    const matchedVendor = vendors?.find((v) => v.name.toLowerCase() === vendorName.toLowerCase());

    createMutation.mutate(
      {
        invoiceNo: invoiceNo.trim(),
        vendorId: matchedVendor?.id || null,
        vendorName,
        purchaseDate: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        invoiceDate,
        discountAmount: discount,
        taxableAmount,
        totalAmount: total,
        taxAmount: tax,
        itemCount: items.length,
        status: "Completed",
        paymentStatus,
        notes,
        items,
      },
      {
        onSuccess: () => {
          toast.success(`Purchase ${invoiceNo} recorded successfully`);
          onClose();
        },
        onError: () => toast.error("Failed to record purchase"),
      },
    );
  };

  return (
    <PosCreatePanel
      open={isOpen}
      onClose={onClose}
      title="New Stock Purchase"
      description="Receive a supplier invoice. Stock is added only for selected SKUs."
      icon={FileText}
      onSubmit={handleSubmit}
      footer={
        <>
          <PosCreateCancelButton onClick={onClose} />
          <PosCreateSubmitButton>Save Stock Purchase</PosCreateSubmitButton>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[12.5px] font-medium text-slate-700 mb-1">
            Supplier / Vendor <span className="text-red-500">*</span>
          </label>
          <select
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            {vendors?.map((v) => (
              <option key={v.id} value={v.name}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[12.5px] font-medium text-slate-700 mb-1">
            Invoice No. <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[12.5px] font-medium text-slate-700 mb-1">Invoice Date</label>
          <input
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={invoiceDate}
            onChange={(e) => {
              const val = e.target.value;
              const todayIso = new Date().toISOString().slice(0, 10);
              if (val && val > todayIso) return;
              setInvoiceDate(val);
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-[12.5px] font-medium text-slate-700 mb-1">Payment Status</label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as "Paid" | "Unpaid" | "Partial")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid / Credit</option>
            <option value="Partial">Partial</option>
          </select>
        </div>
      </div>

      <StockSkuLines lines={lines} onChange={setLines} stockItems={stockItems} />

      {/* Totals Summary: Subtotal, Discount, Taxable Amount, GST, Total Bill */}
      <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-2 text-[12.5px]">
        <div className="flex items-center justify-between">
          <span className="text-slate-600 font-medium">Subtotal:</span>
          <span className="font-mono font-semibold text-slate-800">₹ {subtotal.toFixed(2)}</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">Discount:</span>
            <div className="flex items-center gap-1.5">
              <div className="flex rounded-md border border-slate-200 bg-slate-100 p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => {
                    if (subtotal > 0 && discountType === "flat") {
                      const rate = ((parseFloat(discountAmount) || 0) / subtotal) * 100;
                      setDiscountRate(rate > 0 ? rate.toFixed(1) : discountRate);
                    }
                    setDiscountType("percent");
                  }}
                  className={`px-1.5 py-0.5 rounded cursor-pointer transition ${
                    discountType === "percent" ? "bg-white text-teal-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (discountType === "percent") {
                      setDiscountAmount(discount.toFixed(2));
                    }
                    setDiscountType("flat");
                  }}
                  className={`px-1.5 py-0.5 rounded cursor-pointer transition ${
                    discountType === "flat" ? "bg-white text-teal-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  ₹ Flat
                </button>
              </div>

              {discountType === "percent" ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(e.target.value)}
                    className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-right font-mono text-[12px] text-slate-800 focus:border-teal-500 focus:outline-none"
                  />
                  <span className="text-slate-500 font-mono text-[11px]">%</span>
                  <span className="text-[11px] text-slate-500 font-mono pl-1">(-₹{discount.toFixed(2)})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-mono text-[11px]">₹</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-right font-mono text-[12px] text-slate-800 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {discount > 0 && (
          <div className="flex items-center justify-between text-slate-600">
            <span className="font-medium">Taxable Amount:</span>
            <span className="font-mono font-semibold text-slate-800">₹ {taxableAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">GST / Tax:</span>
            <div className="flex items-center gap-1.5">
              <div className="flex rounded-md border border-slate-200 bg-slate-100 p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => {
                    if (taxableAmount > 0 && taxType === "flat") {
                      const rate = ((parseFloat(taxAmount) || 0) / taxableAmount) * 100;
                      setTaxRate(rate > 0 ? rate.toFixed(1) : taxRate);
                    }
                    setTaxType("percent");
                  }}
                  className={`px-1.5 py-0.5 rounded cursor-pointer transition ${
                    taxType === "percent" ? "bg-white text-teal-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (taxType === "percent") {
                      setTaxAmount(tax.toFixed(2));
                    }
                    setTaxType("flat");
                  }}
                  className={`px-1.5 py-0.5 rounded cursor-pointer transition ${
                    taxType === "flat" ? "bg-white text-teal-700 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  ₹ Flat
                </button>
              </div>

              {taxType === "percent" ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-right font-mono text-[12px] text-slate-800 focus:border-teal-500 focus:outline-none"
                  />
                  <span className="text-slate-500 font-mono text-[11px]">%</span>
                  <span className="text-[11px] text-slate-500 font-mono pl-1">(₹{tax.toFixed(2)})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-mono text-[11px]">₹</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(e.target.value)}
                    className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-right font-mono text-[12px] text-slate-800 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-200 font-bold">
          <span className="text-slate-900 text-[13.5px]">Total Bill:</span>
          <span className="font-mono text-slate-900 text-[14px]">₹ {total.toFixed(2)}</span>
        </div>
      </div>

      <div>
        <label className="block text-[12.5px] font-medium text-slate-700 mb-1">Remarks / Internal Note</label>
        <input
          type="text"
          placeholder="e.g. Received at kitchen store in good condition"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:outline-none focus:border-teal-500"
        />
      </div>
    </PosCreatePanel>
  );
}
