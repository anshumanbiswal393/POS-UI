import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronDown, ChevronRight, CreditCard, Plus, Store } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useOutletContext } from "@/context/PosOutletContext";
import {
  getStepStatus,
  loadOutletConfig,
  syncOutletConfigFromBackend,
  type OutletConfigState,
  type OutletStepStatus,
} from "@/components/shared/pos/management/outlet-config/outletConfigStore";
import {
  BILLING_SETUP_STEPS,
  OUTLET_CONFIGURATION_STEPS,
  type OutletSetupStep,
} from "@/components/shared/pos/management/outlet-config/outletSetupSteps";
import { locationRoleLabel } from "@/utils/outletKind";

function withOutlet(path: string, outletId: string) {
  return `${path}?outletId=${encodeURIComponent(outletId)}`;
}

function ProgressRing({ value, caption }: { value: number; caption: string }) {
  const radius = 20;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-[52px] w-[52px]">
        <svg viewBox="0 0 52 52" className="h-[52px] w-[52px] -rotate-90">
          <circle
            cx="26"
            cy="26"
            r={radius}
            fill="none"
            className="stroke-slate-200"
            strokeWidth="5"
          />
          <circle
            cx="26"
            cy="26"
            r={radius}
            fill="none"
            className="stroke-primary"
            strokeWidth="5"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-primary">
          {value}%
        </span>
      </div>
      <span className="text-[12px] font-medium text-slate-500">{caption}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: OutletStepStatus }) {
  if (status === "completed") {
    return <span className="text-[12.5px] font-semibold text-primary">Completed</span>;
  }
  if (status === "in_progress") {
    return (
      <span className="rounded-md border border-primary/30 bg-primary-tint px-2 py-0.5 text-[11.5px] font-semibold text-primary">
        In Progress
      </span>
    );
  }
  return <span className="text-[12.5px] font-medium text-slate-400">Not Started</span>;
}

function StepRow({
  step,
  status,
  outletId,
}: {
  step: OutletSetupStep;
  status: OutletStepStatus;
  outletId: string;
}) {
  const Icon = step.icon;
  const completed = status === "completed";
  const inProgress = status === "in_progress";
  return (
    <Link
      to={withOutlet(step.to, outletId)}
      className={`group flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition ${
        inProgress
          ? "border-primary/35 bg-primary-tint/70 shadow-xs"
          : completed
            ? "border-slate-100 bg-white hover:border-primary/25 hover:bg-primary-tint/40"
            : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
      }`}
    >
      {completed ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
          <Check className="h-4 w-4 stroke-[2.5]" />
        </span>
      ) : inProgress ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white">
          {step.n}
        </span>
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[12px] font-bold text-slate-500">
          {step.n}
        </span>
      )}

      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          inProgress || completed
            ? "bg-primary-tint text-primary"
            : "bg-slate-50 text-slate-500"
        }`}
      >
        <Icon className="h-4.5 w-4.5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold text-slate-900">{step.title}</span>
        <span className="mt-0.5 block truncate text-[12px] text-slate-500">{step.desc}</span>
      </span>

      <span className="flex shrink-0 items-center gap-2">
        <StatusBadge status={status} />
        <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:text-primary" />
      </span>
    </Link>
  );
}

function SetupColumn({
  title,
  subtitle,
  icon: Icon,
  steps,
  config,
  outletId,
}: {
  title: string;
  subtitle: string;
  icon: typeof Store;
  steps: OutletSetupStep[];
  config: OutletConfigState;
  outletId: string;
}) {
  const completed = steps.filter((s) => getStepStatus(config, s.id) === "completed").length;
  const pct = Math.round((completed / steps.length) * 100);
  return (
    <section className="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-tint text-primary">
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div>
            <h3 className="text-[16px] font-bold text-slate-900">{title}</h3>
            <p className="mt-0.5 text-[12.5px] text-slate-500">{subtitle}</p>
          </div>
        </div>
        <ProgressRing value={pct} caption={`${completed} / ${steps.length} completed`} />
      </div>
      <div className="flex flex-col gap-1.5">
        {steps.map((step) => (
          <StepRow
            key={step.id}
            step={step}
            status={getStepStatus(config, step.id)}
            outletId={outletId}
          />
        ))}
      </div>
    </section>
  );
}

export function OutletConfigurationHubView() {
  const { outlets, activeOutlet, setActiveOutlet } = useOutletContext();
  const [selectedOutletId, setSelectedOutletId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      return new URLSearchParams(window.location.search).get("outletId") || "";
    } catch {
      return "";
    }
  });
  const [config, setConfig] = useState<OutletConfigState>(() =>
    loadOutletConfig(selectedOutletId || activeOutlet?.id || ""),
  );

  const effectiveOutletId = selectedOutletId || activeOutlet?.id || "";
  const selectedOutlet =
    outlets.find((o) => o.id === effectiveOutletId) || activeOutlet || outlets[0];
  const isOutletSelected = Boolean(selectedOutlet?.id);

  useEffect(() => {
    if (!selectedOutlet?.id) return;
    setConfig(loadOutletConfig(selectedOutlet.id));
    let cancelled = false;
    void syncOutletConfigFromBackend(selectedOutlet.id).then((remote) => {
      if (!cancelled) setConfig(remote);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedOutlet?.id]);

  const allSteps = useMemo(
    () => [...OUTLET_CONFIGURATION_STEPS, ...BILLING_SETUP_STEPS],
    [],
  );
  const allComplete = allSteps.every((s) => getStepStatus(config, s.id) === "completed");
  const role = selectedOutlet ? locationRoleLabel(selectedOutlet) : "Outlet";
  const locationLine = selectedOutlet
    ? `${role === "HO" ? "Head Office" : role === "Kitchen" ? "Central Kitchen" : "Outlet"}${
        selectedOutlet.city ? ` · ${selectedOutlet.city}` : selectedOutlet.address ? ` · ${selectedOutlet.address}` : ""
      }`
    : "";

  const handleSwitchOutlet = (newId: string) => {
    if (!newId) {
      setSelectedOutletId("");
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", "/pos/management/configuration/outlet");
      }
      return;
    }
    setSelectedOutletId(newId);
    setActiveOutlet(newId);
    if (typeof window !== "undefined") {
      window.history.replaceState(
        null,
        "",
        `/pos/management/configuration/outlet?outletId=${encodeURIComponent(newId)}`,
      );
    }
  };

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Link
            to="/pos"
            className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Back"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <div>
            <h2 className="text-[20px] font-bold tracking-tight text-slate-900">Outlet Setup</h2>
            <p className="mt-0.5 text-[12.5px] text-slate-500">
              Configure your outlet settings, contact details, timings and billing for smooth operations.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/pos/management/configuration/outlet/list"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
          >
            View All Outlets ({outlets.length})
          </Link>
          <Link
            to="/pos/management/configuration/outlet/add"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[12.5px] font-semibold text-white shadow-xs transition hover:bg-primary-pressed"
          >
            <Plus className="h-3.5 w-3.5" />
            Add New Outlet
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-teal-800 px-5 py-4 text-white shadow-e2">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <Store className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal-100">
                Outlet Setup
              </span>
              {isOutletSelected && selectedOutlet ? (
                <>
                  <span className="rounded-md border border-white/25 bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white">
                    Outlet Code{" "}
                    <span className="font-mono text-teal-50">{selectedOutlet.code || "—"}</span>
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      allComplete
                        ? "bg-emerald-400/25 text-emerald-50"
                        : "bg-amber-300/30 text-amber-50"
                    }`}
                  >
                    Status {allComplete ? "Ready" : "Draft"}
                  </span>
                </>
              ) : null}
            </div>
            <h3 className="mt-1 truncate text-[18px] font-bold tracking-tight text-white">
              {isOutletSelected && selectedOutlet ? selectedOutlet.name : "Choose an outlet to configure"}
            </h3>
            <p className="truncate text-[12.5px] text-teal-100/85">
              {isOutletSelected ? locationLine : "Select an outlet from the dropdown to begin setup."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-teal-100">
            Target Hotel / Outlet
          </span>
          <div className="relative">
            <select
              value={isOutletSelected && selectedOutlet ? selectedOutlet.id : ""}
              onChange={(e) => handleSwitchOutlet(e.target.value)}
              className="min-w-[240px] cursor-pointer appearance-none rounded-xl border border-white/20 bg-white py-2.5 pl-3.5 pr-10 text-[13px] font-semibold text-slate-900 shadow-md focus:outline-none sm:min-w-[280px]"
            >
              <option value="">-- Choose Outlet --</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.code || "Outlet"})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <ChevronDown className="h-4 w-4 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>

      {!isOutletSelected || !selectedOutlet ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-8 py-14 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-tint text-primary">
            <Store className="h-7 w-7" />
          </div>
          <h4 className="text-[16px] font-bold text-slate-900">Select an outlet to start setup</h4>
          <p className="mx-auto mt-1 max-w-md text-[13px] text-slate-500">
            Choose an outlet from the dropdown above. You can open any step, save it, and come back later to update it.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SetupColumn
            title="Outlet Configuration"
            subtitle="Configure basic outlet information, staff, services and integrations."
            icon={Store}
            steps={OUTLET_CONFIGURATION_STEPS}
            config={config}
            outletId={selectedOutlet.id}
          />
          <SetupColumn
            title="Billing Setup"
            subtitle="Configure billing rules, taxes, receipts and payment settings."
            icon={CreditCard}
            steps={BILLING_SETUP_STEPS}
            config={config}
            outletId={selectedOutlet.id}
          />
        </div>
      )}
    </div>
  );
}
