import { useEffect, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const posCreateCancelClassName =
  "rounded-lg border border-border bg-white px-4 py-2 text-[13px] font-medium text-foreground hover:bg-muted cursor-pointer transition-colors";

export const posCreateSubmitClassName =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const posCreateInputClassName =
  "w-full rounded-lg border border-border bg-primary-tint/70 px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";

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
  size?: "md" | "lg";
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
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>
  );

  const footerBar = footer ? (
    <div className="flex shrink-0 items-center justify-end gap-2 border-t border-primary/10 bg-primary-tint/70 px-5 py-3">
      {footer}
    </div>
  ) : null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close create panel"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-create-panel-title"
        className={cn(
          "relative z-10 flex h-full w-full flex-col border-l border-border bg-white shadow-2xl animate-in slide-in-from-right duration-300",
          size === "lg" ? "max-w-xl" : "max-w-md",
          className,
        )}
      >
        <div className="shrink-0 border-b border-primary/15 bg-primary-tint px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              {Icon ? (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              ) : null}
              <div className="min-w-0">
                <h2
                  id="pos-create-panel-title"
                  className="text-[16px] font-semibold leading-tight text-foreground"
                >
                  {title}
                </h2>
                {description ? (
                  <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{description}</p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {onSubmit ? (
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            {body}
            {footerBar}
          </form>
        ) : (
          <>
            {body}
            {footerBar}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
