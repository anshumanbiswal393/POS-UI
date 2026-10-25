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
  const [taxAmount, setTaxAmount] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Unpaid" | "Partial">("Paid");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([emptySkuLine()]);

  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + lineAmount(line), 0), [lines]);
  const tax = parseFloat(taxAmount) || 0;
  const total = Math.round((subtotal + tax) * 100) / 100;
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
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
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

      <div className="grid grid-cols-2 gap-3">
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
          <label className="block text-[12.5px] font-medium text-slate-700 mb-1">Total Bill (₹)</label>
          <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-semibold text-slate-900">
            {total.toFixed(2)}
          </div>
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
