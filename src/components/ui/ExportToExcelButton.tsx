import React from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

type ExportToExcelButtonProps = {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  title?: string;
  label?: string;
};

/** Canonical POS “Excel” control — matches the standard nav pill styling. */
export function ExportToExcelButton({
  onClick,
  className,
  title = "Export data to Excel (.xlsx)",
  label = "Excel",
}: ExportToExcelButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-800 hover:bg-slate-50 shadow-2xs transition cursor-pointer shrink-0",
        className
      )}
    >
      <Download className="h-3.5 w-3.5 text-slate-700 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
