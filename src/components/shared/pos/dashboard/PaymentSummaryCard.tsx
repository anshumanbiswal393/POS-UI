import type { PaymentSummaryData } from "@/types/posDashboard";

interface PaymentSummaryCardProps {
  paymentSummary: PaymentSummaryData;
}

export function PaymentSummaryCard({ paymentSummary }: PaymentSummaryCardProps) {
  const items = [
    {
      label: "Cash",
      amount: paymentSummary.cash.formatted,
      percentage: paymentSummary.cash.percentage,
      count: paymentSummary.cash.count,
      color: "bg-primary",
    },
    {
      label: "Card",
      amount: paymentSummary.card.formatted,
      percentage: paymentSummary.card.percentage,
      count: paymentSummary.card.count,
      color: "bg-primary/80",
    },
    {
      label: "UPI & wallets",
      amount: paymentSummary.upiWallets.formatted,
      percentage: paymentSummary.upiWallets.percentage,
      count: paymentSummary.upiWallets.count,
      color: "bg-teal-600",
    },
    {
      label: "Other",
      amount: paymentSummary.other.formatted,
      percentage: paymentSummary.other.percentage,
      count: paymentSummary.other.count,
      color: "bg-slate-400",
    },
  ];

  const totalCount =
    paymentSummary.totalCount ||
    items.reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-300 bg-white p-3 shadow-2xs">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 pb-1.5">
        <h2 className="text-[13.5px] font-bold text-slate-900">Payment summary</h2>
        <span className="text-[11px] font-semibold text-slate-500">
          {totalCount} {totalCount === 1 ? "Payment" : "Payments"}
        </span>
      </div>

      {/* Rows with method, small progress bar in same row, and amount + percentage */}
      <div className="mt-1.5 flex min-h-0 flex-1 flex-col justify-around gap-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-2 text-[12.5px]">
            {/* Payment Method + Count Badge */}
            <div className="flex items-center gap-1.5 min-w-[95px] shrink-0">
              <span className="font-semibold text-slate-700">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  {item.count}
                </span>
              )}
            </div>

            {/* Progress bar taking small space in same row */}
            <div className="flex-1 max-w-[110px] sm:max-w-[130px] h-1.5 rounded-full bg-slate-100 overflow-hidden shrink">
              <div
                className={`h-full rounded-full transition-all duration-300 ${item.color}`}
                style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
              />
            </div>

            {/* Amount & Percentage */}
            <div className="flex items-center justify-end gap-1.5 shrink-0 min-w-[85px] text-right">
              <span className="font-bold text-slate-900">{item.amount}</span>
              <span className="text-[11px] font-medium text-slate-400 w-8 text-right">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Total Row with ample breathing room */}
      <div className="mt-auto shrink-0 flex items-center justify-between border-t border-slate-200 pt-2">
        <span className="text-[13px] font-extrabold text-slate-900">Total</span>
        <span className="text-[16px] font-black text-slate-900">
          {paymentSummary.totalFormatted}
        </span>
      </div>
    </div>
  );
}
