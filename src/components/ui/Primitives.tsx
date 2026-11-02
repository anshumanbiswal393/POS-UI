import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-3 border-b border-primary/20 bg-gradient-to-r from-primary-tint/40 via-primary/5 to-surface px-4 py-3.5 shadow-xs sm:flex-row sm:items-end sm:gap-4 sm:px-6 sm:py-4">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            {eyebrow}
          </div>
        )}
        <h1 className="font-serif font-display text-[20px] font-bold leading-tight text-text-primary sm:text-[22px]">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 max-w-2xl text-[12px] text-text-secondary sm:text-[13px]">
            {description}
          </p>
        )}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap [&>*]:flex-1 sm:[&>*]:flex-none">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface shadow-e1", className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  action,
  hint,
}: {
  title: string;
  action?: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border-subtle px-4 py-3 sm:flex-nowrap sm:items-center sm:gap-3 sm:px-5 sm:py-3.5">
      <div>
        <h3 className="text-[14px] font-semibold text-text-primary">{title}</h3>
        {hint && <p className="text-[11px] text-text-secondary">{hint}</p>}
      </div>
      {action ? <div className="w-full sm:w-auto">{action}</div> : null}
    </div>
  );
}

type Tone = "success" | "warning" | "error" | "info" | "neutral" | "brand" | "dark";
const toneClasses: Record<Tone, string> = {
  success: "bg-success-tint text-success font-medium",
  warning: "bg-warning-tint text-warning font-medium",
  error: "bg-error-tint text-error font-medium",
  info: "bg-info-tint text-info font-medium",
  neutral: "bg-surface-2 text-text-secondary font-medium",
  brand: "bg-primary-tint text-primary font-medium",
  dark: "bg-foreground/10 text-foreground font-medium",
};

export function StatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[11px] font-medium",
        toneClasses[tone],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {children}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  deltaTone = "success",
  accent = "brand",
  suffix,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "success" | "error" | "neutral";
  accent?: "brand" | "info" | "success" | "warning" | "error";
  suffix?: string;
}) {
  const accentColor = {
    brand: "var(--color-primary)",
    info: "var(--color-info)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    error: "var(--color-error)",
  }[accent];
  const deltaCls =
    deltaTone === "success"
      ? "text-[var(--color-success)]"
      : deltaTone === "error"
        ? "text-[var(--color-error)]"
        : "text-text-secondary";
  return (
    <div className="relative rounded-lg border border-border bg-surface px-4 py-3.5 shadow-e1 transition hover:shadow-e2 sm:px-5 sm:py-4">
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r"
        style={{ background: accentColor }}
      />
      <div className="label-uppercase">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="font-mono text-[24px] font-bold leading-none tracking-tight text-text-primary sm:text-[28px]">
          {value}
        </span>
        {suffix && <span className="text-[12px] text-text-secondary">{suffix}</span>}
      </div>
      {delta && <div className={cn("mt-2 text-[11px] font-medium", deltaCls)}>{delta}</div>}
    </div>
  );
}

export function SectionDivider({ children }: { children: React.ReactNode }) {
  return <div className="label-uppercase mb-3 mt-1 text-text-secondary">{children}</div>;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md";
}) {
  const sz = size === "sm" ? "h-8 px-3 text-[12px]" : "h-9 px-3.5 text-[13px]";
  const styles = {
    primary: "bg-primary text-primary-foreground hover:bg-primary-pressed shadow-e1 font-medium",
    secondary: "bg-accent text-accent-foreground hover:bg-primary-tint font-medium",
    outline: "border border-border bg-surface text-black dark:text-white font-semibold hover:bg-surface-2 shadow-2xs",
    ghost: "text-black dark:text-white font-medium hover:bg-surface-2",
    danger: "bg-error-tint text-error hover:bg-error/10 font-semibold",
  }[variant];
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-medium transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        "justify-center whitespace-nowrap cursor-pointer",
        sz,
        styles,
        className,
      )}
    >
      {children}
    </button>
  );
}

export function PriceDisplay({
  amount,
  className,
  prefix = "₹",
  highlight = false,
}: {
  amount: number | string | null | undefined;
  className?: string;
  prefix?: string;
  highlight?: boolean;
}) {
  const num = typeof amount === "number" ? amount : Number(amount) || 0;
  return (
    <span
      className={cn(
        "font-mono tracking-tight",
        highlight ? "font-bold text-primary" : "text-text-primary",
        className,
      )}
    >
      {prefix}
      {num.toLocaleString("en-IN")}
    </span>
  );
}
