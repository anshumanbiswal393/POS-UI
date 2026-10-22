import { useState } from "react";
import { FileText } from "lucide-react";
import { useCreatePurchase, useInventoryVendors } from "@/hooks/queries/usePosInventory";
import { toast } from "sonner";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";

export function CreatePurchaseModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: vendors } = useInventoryVendors();
  const createMutation = useCreatePurchase();

  const [vendorName, setVendorName] = useState("Metro Cash & Carry");
  const [invoiceNo, setInvoiceNo] = useState(`INV-${Math.floor(10000 + Math.random() * 90000)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [totalAmount, setTotalAmount] = useState("4500");
  const [taxAmount, setTaxAmount] = useState("225");
  const [itemCount, setItemCount] = useState("6");
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Unpaid" | "Partial">("Paid");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNo.trim()) {
      toast.error("Please enter an Invoice Number");
      return;
    }

    createMutation.mutate(
      {
        invoiceNo: invoiceNo.trim(),
        vendorName,
        purchaseDate: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        invoiceDate,
        totalAmount: parseFloat(totalAmount) || 0,
        taxAmount: parseFloat(taxAmount) || 0,
        itemCount: parseInt(itemCount) || 1,
        status: "Completed",
        paymentStatus,
        notes,
      },
      {
        onSuccess: () => {
          toast.success(`Purchase ${invoiceNo} recorded successfully`);
          onClose();
        },
      },
    );
  };

  return (
    <PosCreatePanel
      open={isOpen}
      onClose={onClose}
      title="New Stock Purchase"
      description="Record a supplier invoice against kitchen stock."
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
              <label className="block text-[12.5px] font-medium text-slate-700 mb-1">
                Invoice Date
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-slate-700 mb-1">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid / Credit</option>
                <option value="Partial">Partial</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[12.5px] font-medium text-slate-700 mb-1">
                Total SKUs
              </label>
              <input
                type="number"
                min="1"
                value={itemCount}
                onChange={(e) => setItemCount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-slate-700 mb-1">Tax (₹)</label>
              <input
                type="number"
                step="any"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-slate-700 mb-1">
                Total Bill (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] font-semibold text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] font-medium text-slate-700 mb-1">
              Remarks / Internal Note
            </label>
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
