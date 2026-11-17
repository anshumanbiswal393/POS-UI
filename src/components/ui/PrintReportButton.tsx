import React from "react";
import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";

type PrintReportButtonProps = {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  title?: string;
  label?: string;
  disabled?: boolean;
};

/** Canonical POS “Print” header control — matches the standard nav pill styling. */
export function PrintReportButton({
  onClick,
  className,
  title = "Print report",
  label = "Print",
  disabled = false,
}: PrintReportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-800 hover:bg-slate-50 shadow-2xs transition cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      <Printer className="h-3.5 w-3.5 text-slate-700 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
