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
      color: "bg-primary",
    },
    {
      label: "Card",
      amount: paymentSummary.card.formatted,
      percentage: paymentSummary.card.percentage,
      color: "bg-primary/80",
    },
    {
      label: "UPI & wallets",
      amount: paymentSummary.upiWallets.formatted,
      percentage: paymentSummary.upiWallets.percentage,
      color: "bg-slate-600",
    },
    {
      label: "Other",
      amount: paymentSummary.other.formatted,
      percentage: paymentSummary.other.percentage,
      color: "bg-slate-400",
    },
  ];

  return (
    <div className="flex min-h-[175px] flex-col rounded-xl border border-slate-400/80 bg-white p-2.5 sm:p-3 shadow-2xs">
      <h2 className="shrink-0 text-[13.5px] font-bold text-slate-900">Payment summary</h2>

      <div className="mt-1 flex min-h-0 flex-1 flex-col justify-around py-0.5 gap-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-[12px]">
            <span className="w-24 shrink-0 font-medium text-slate-700 dark:text-slate-200 truncate">{item.label}</span>
            {/* Progress bar in the same row */}
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-300 ${item.color}`}
                style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
              />
            </div>
            <div className="flex shrink-0 items-center justify-end gap-1 text-right min-w-[68px]">
              <span className="font-bold text-slate-900 dark:text-white">{item.amount}</span>
              <span className="min-w-[28px] text-right text-[10.5px] font-normal text-slate-400 dark:text-slate-500">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-1 flex shrink-0 items-center justify-between border-t border-slate-200 pt-1">
        <span className="text-[12.5px] font-bold text-slate-900">Total</span>
        <span className="text-[15px] font-bold text-slate-900">
          {paymentSummary.totalFormatted}
        </span>
      </div>
    </div>
  );
}

export default PaymentSummaryCard;
