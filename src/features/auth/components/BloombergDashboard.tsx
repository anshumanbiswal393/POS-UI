import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { RetrodLogo } from "@/components/common";
import {
  Sparkles,
  ShieldCheck,
  Globe,
  ShoppingBag,
  UtensilsCrossed,
  Truck,
  Package,
  CircleDollarSign,
  Users,
  TrendingUp,
  Clock,
  Quote,
  CheckCircle2,
  Receipt,
  Flame,
} from "lucide-react";

export function BloombergDashboard() {
  return (
    <div
      className="relative hidden lg:flex flex-col overflow-hidden text-white
                    bg-[radial-gradient(120%_90%_at_0%_0%,oklch(0.22_0.10_285)_0%,oklch(0.13_0.05_270)_45%,oklch(0.10_0.03_265)_100%)]"
    >
      {/* Decorative gradients */}
      <div
        className="pointer-events-none absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full
                      bg-[radial-gradient(circle,oklch(0.55_0.22_295/.45),transparent_60%)] blur-3xl"
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-32 h-[460px] w-[460px] rounded-full
                      bg-[radial-gradient(circle,oklch(0.65_0.18_55/.25),transparent_60%)] blur-3xl"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full
                      bg-[radial-gradient(circle,oklch(0.45_0.20_265/.35),transparent_60%)] blur-3xl"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]
                      bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)]
                      bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]"
      />

      {/* Top bar */}
      <div className="relative flex items-center justify-between px-12 pt-10">
        <Link
          to="/pos"
          className="flex items-center gap-2.5 transition-transform hover:scale-105 cursor-pointer"
          title="Go to POS Dashboard"
        >
          <RetrodLogo variant="dark" size="lg" />
        </Link>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/70 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_oklch(0.7_0.18_155)]" />
          POS Server Online · Cloud Synced
        </div>
      </div>

      {/* Body grid */}
      <div className="relative grid flex-1 grid-cols-12 gap-8 px-12 pt-10 pb-10">
        {/* Left col: hero + benefits + trust */}
        <div className="col-span-7 flex flex-col justify-between">
          <div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/70 backdrop-blur">
              <Sparkles className="h-3 w-3 text-[oklch(0.78_0.14_85)]" />
              Restaurant Point of Sale & Operations
            </div>

            <h1 className="mt-4 text-[46px] leading-[1.05] tracking-tight">
              Fast restaurant operations
              <br />
              start with{" "}
              <span className="bg-gradient-to-r from-[oklch(0.78_0.14_85)] via-[oklch(0.72_0.18_310)] to-primary bg-clip-text text-transparent">
                Retrod POS.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-white/65">
              The unified cloud POS platform for modern dining — lightning touch billing, real-time
              KOT kitchen display, multi-channel aggregator sync (Swiggy/Zomato), and automated
              inventory deductions.
            </p>

            {/* Benefits */}
            <div className="mt-7 grid grid-cols-2 gap-3">
              {[
                {
                  icon: ShoppingBag,
                  title: "Fast Touch Billing",
                  body: "Sub-10s checkout, dynamic QR UPI & split payments.",
                },
                {
                  icon: UtensilsCrossed,
                  title: "Live Kitchen Display (KOT)",
                  body: "Real-time kitchen ticket flow & preparation timers.",
                },
                {
                  icon: Truck,
                  title: "Online Aggregator Sync",
                  body: "1-click accept & dispatch for Swiggy & Zomato.",
                },
                {
                  icon: Package,
                  title: "Inventory & Recipe BOM",
                  body: "Automatic raw material deductions on every punch.",
                },
                {
                  icon: CircleDollarSign,
                  title: "Shift Float & EOD Audits",
                  body: "Cash register reconciliation & Z-Reports.",
                },
                {
                  icon: Users,
                  title: "Customer Khata & CRM",
                  body: "Loyalty points, spend metrics & credit ledger.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="group rounded-xl border border-white/8 bg-white/[0.03] p-3 backdrop-blur transition-colors hover:border-white/15 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary/25 to-[oklch(0.55_0.22_295)]/20 text-[oklch(0.85_0.10_290)] ring-1 ring-white/10">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-[12.5px] font-semibold text-white">{title}</div>
                  </div>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-white/55">{body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trust strip */}
          <div className="pt-6">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Trust icon={ShieldCheck} label="Offline-Resilient POS" />
              <Trust icon={Receipt} label="ESC/POS Thermal Printing" />
              <Trust icon={Globe} label="Multi-Outlet Ready" />
              <div className="hidden h-4 w-px bg-white/10 md:block" />
              <span className="text-[11px] text-white/45">
                Built for High-Velocity Restaurants & Cafes
              </span>
            </div>
          </div>
        </div>

        {/* Right col: KPI + Live restaurant status + testimonial */}
        <div className="col-span-5 flex flex-col gap-3.5">
          <KPIRow />
          <LiveOperationsCard />
          <TestimonialCard />
        </div>
      </div>
    </div>
  );
}

function Trust({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[11.5px] text-white/55">
      <Icon className="h-3.5 w-3.5 text-[oklch(0.78_0.14_85)]" />
      <span>{label}</span>
    </div>
  );
}

function KPIRow() {
  const kpis = [
    { label: "Today's Sales", value: "₹48,250", delta: "+14.8%", tone: "emerald" },
    { label: "Active Tables", value: "14 / 18", delta: "78% Occ", tone: "emerald" },
    { label: "Live KOTs", value: "6 Pending", delta: "Avg 8m", tone: "amber" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {kpis.map((k) => (
        <div
          key={k.label}
          className="rounded-xl border border-white/8 bg-white/[0.03] p-3 backdrop-blur"
        >
          <div className="text-[10px] font-medium uppercase tracking-wider text-white/45">
            {k.label}
          </div>
          <div className="mt-1 text-[17px] font-semibold text-white">{k.value}</div>
          <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-emerald-300/90 font-medium">
            <TrendingUp className="h-3 w-3" />
            {k.delta}
          </div>
        </div>
      ))}
    </div>
  );
}

function LiveOperationsCard() {
  const hourlyOrders = [12, 28, 45, 62, 85, 94, 76, 52];
  const hours = ["12 PM", "1 PM", "2 PM", "3 PM", "7 PM", "8 PM", "9 PM", "10 PM"];

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Live Restaurant Velocity
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="text-[19px] font-semibold text-white">
              184 Orders Today
            </div>
            <div className="text-[11px] text-emerald-300/90">● 98.2% on time</div>
          </div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Flame className="h-4 w-4" />
        </div>
      </div>

      {/* Hourly Bar Chart */}
      <div className="mt-4 flex h-20 items-end gap-2">
        {hourlyOrders.map((val, idx) => (
          <div key={idx} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className="w-full rounded-sm bg-gradient-to-t from-primary/50 to-[oklch(0.72_0.18_310)] transition-all hover:brightness-125"
              style={{ height: `${(val / 100) * 100}%` }}
            />
            <div className="text-[8.5px] text-white/40">{hours[idx]}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-white/60">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-primary" /> Avg Bill Turnaround:{" "}
          <b className="text-white">42s</b>
        </span>
        <span className="flex items-center gap-1 text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" /> 0 KOT Leakages
        </span>
      </div>
    </div>
  );
}

function TestimonialCard() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/8 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4">
      <Quote className="h-4 w-4 text-[oklch(0.78_0.14_85)]" />
      <p className="mt-2 text-[12px] leading-relaxed text-white/80">
        "Retrod POS slashed our checkout time by 60% and unified our Swiggy, Zomato, and Dine-in
        operations effortlessly across all shifts."
      </p>
      <div className="mt-3 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.55_0.22_295)] text-[10px] font-semibold text-white">
          AS
        </div>
        <div>
          <div className="text-[11.5px] font-semibold text-white">Aarav Sharma</div>
          <div className="text-[10px] text-white/45">Store Owner · Retrod Bistro & Cafe</div>
        </div>
      </div>
      <Sparkles className="absolute -right-2 -bottom-2 h-16 w-16 text-white/[0.04]" />
    </div>
  );
}

export default BloombergDashboard;
