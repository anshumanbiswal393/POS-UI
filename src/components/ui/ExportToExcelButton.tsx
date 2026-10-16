import { FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

type ExportToExcelButtonProps = {
  onClick: () => void;
  className?: string;
  title?: string;
};

/** Canonical POS “Export to Excel” control — use everywhere Excel export is offered. */
export function ExportToExcelButton({
  onClick,
  className,
  title = "Export formatted data to Excel (.xlsx)",
}: ExportToExcelButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-300 bg-slate-50 px-3.5 text-[11.5px] font-medium text-teal-700 hover:bg-slate-100 shadow-2xs transition cursor-pointer",
        className
      )}
    >
      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
      <span>Export to Excel</span>
    </button>
  );
}
