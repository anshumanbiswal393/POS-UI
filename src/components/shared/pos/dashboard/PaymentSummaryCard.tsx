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
    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-300 bg-white p-3.5 sm:p-4 shadow-2xs">
      <h2 className="text-[14px] font-bold text-slate-900">Payment summary</h2>

      <div className="mt-4 space-y-4 flex-1">
        {items.map((item) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-medium text-slate-700">{item.label}</span>
              <div className="space-x-2">
                <span className="font-bold text-slate-900">{item.amount}</span>
                <span className="text-[11.5px] text-slate-400 font-normal">{item.percentage}%</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${item.color}`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5">
        <span className="text-[13px] font-bold text-slate-900">Total</span>
        <span className="text-[17px] font-bold text-slate-900">
          {paymentSummary.totalFormatted}
        </span>
      </div>
    </div>
  );
}
