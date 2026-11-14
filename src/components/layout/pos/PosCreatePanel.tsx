import { useEffect, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const posCreateCancelClassName =
  "rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-[13px] font-bold text-foreground hover:bg-slate-100 cursor-pointer transition-colors shadow-2xs";

export const posCreateSubmitClassName =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary bg-primary px-5 py-2.5 text-[13px] font-bold text-primary-foreground shadow-2xs hover:bg-primary/90 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const posCreateInputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

export function PosCreateCancelButton({
  children = "Cancel",
  onClick,
  className,
}: {
  children?: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button type="button" onClick={onClick} className={cn(posCreateCancelClassName, className)}>
      {children}
    </button>
  );
}

export function PosCreateSubmitButton({
  children,
  disabled,
  className,
}: {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button type="submit" disabled={disabled} className={cn(posCreateSubmitClassName, className)}>
      {children}
    </button>
  );
}

type PosCreatePanelProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  size?: "md" | "lg" | "xl";
  className?: string;
};

export function PosCreatePanel({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  children,
  footer,
  onSubmit,
  size = "md",
  className,
}: PosCreatePanelProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const body = (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">{children}</div>
  );

  const footerBar = footer ? (
    <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-primary-tint/30 px-6 py-3.5">
      {footer}
    </div>
  ) : null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-create-panel-title"
        className={cn(
          "relative z-10 flex w-full max-h-[92vh] flex-col rounded-2xl border border-slate-300 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden my-auto",
          size === "xl" ? "max-w-4xl" : size === "lg" ? "max-w-3xl" : "max-w-xl",
          className,
        )}
      >
        {/* Fixed Header */}
        <div className="shrink-0 border-b border-slate-200 bg-primary-tint/60 px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {Icon ? (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground border border-primary shadow-2xs font-bold">
                  <Icon className="h-4.5 w-4.5" />
                </div>
              ) : null}
              <div className="min-w-0">
                <h2
                  id="pos-create-panel-title"
                  className="text-[17px] font-extrabold leading-tight text-slate-900"
                >
                  {title}
                </h2>
                {description ? (
                  <p className="mt-0.5 text-[12px] leading-snug text-slate-600 font-medium">{description}</p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1.5 text-slate-700 transition-colors hover:bg-black/10 hover:text-black border border-slate-300 cursor-pointer shrink-0"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {onSubmit ? (
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {body}
            {footerBar}
          </form>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {body}
            {footerBar}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
