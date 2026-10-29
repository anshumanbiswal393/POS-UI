import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, Check, Lightbulb, Loader2, Store } from "lucide-react";
import { useOutletConfig } from "./useOutletConfig";
import { useState, useRef, useEffect } from "react";
import type { OutletSetupStepId } from "./outletConfigStore";

export function ConfigPageShell({
  title,
  subtitle,
  onSave,
  saveLabel = "Save",
  stepId,
  children,
}: {
  title: string;
  subtitle: string;
  onSave: () => void | Promise<void | boolean>;
  saveLabel?: string;
  stepId?: OutletSetupStepId;
  children: ReactNode;
}) {
  const { outlet, outlets, setActiveOutlet } = useOutletConfig();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };

  const handleSelectOutlet = (newId: string) => {
    setActiveOutlet(newId);
    setDropdownOpen(false);
    // Maintain the current route pathname but update ?outletId= query param
    const currentPath = window.location.pathname;
    window.location.href = `${currentPath}?outletId=${encodeURIComponent(newId)}`;
  };

  return (
    <div className="space-y-4 pb-6">
      {/* 1. Top Header with Back Link & Title */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Link
            to={outlet.id ? `/pos/management/configuration/outlet?outletId=${encodeURIComponent(outlet.id)}` : "/pos/management/configuration/outlet"}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-teal-700 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Outlet Setup Hub
          </Link>
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-bold tracking-tight text-slate-900">{title}</h2>
          </div>
          <p className="text-[12.5px] text-slate-500">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-teal-600 px-6 py-2 text-[13px] font-bold text-white shadow-md transition hover:bg-teal-700 disabled:opacity-70"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? "Saving…" : saveLabel}
        </button>
      </div>

      {/* 2. Persistent Active Outlet Identifier & Quick Switcher Banner */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50 via-emerald-50/60 to-slate-50 p-3 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white shadow-xs">
            <Store className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                Currently Configuring
              </span>
              <span className="rounded-full bg-teal-600/10 px-2 py-0.2 text-[9.5px] font-bold text-teal-800 border border-teal-300/60">
                Code: {outlet.code || "HI-MAIN"}
              </span>
            </div>
            <h3 className="text-[13.5px] font-extrabold text-slate-900 truncate">
              {outlet.name}
            </h3>
          </div>
        </div>

        {/* Quick Outlet Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <span>Switch Outlet</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-72 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 z-50">
              <div className="px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                Select Outlet to Configure
              </div>
              <div className="max-h-60 overflow-y-auto space-y-0.5 pt-1">
                {outlets.map((o) => {
                  const isSelected = o.id === outlet.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => handleSelectOutlet(o.id)}
                      className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12px] transition cursor-pointer ${
                        isSelected
                          ? "bg-teal-50 text-teal-900 font-bold"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="truncate">{o.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{o.code} • {o.cuisine || "Dine-In"}</p>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-teal-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-slate-100 mt-1 pt-1">
                <Link
                  to="/pos/management/configuration/outlet/add"
                  className="w-full flex items-center justify-center gap-1 rounded-lg py-1.5 text-[11.5px] font-bold text-teal-700 hover:bg-teal-50"
                >
                  + Add New Outlet
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="p-6">{children}</div>
        <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 p-4">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-teal-600 px-8 py-2 text-[13px] font-bold text-white shadow-md transition hover:bg-teal-700 disabled:opacity-70"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Saving…" : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettingRow({
  label,
  hint,
  tip,
  children,
}: {
  label: string;
  hint?: string;
  tip?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2 border-b border-slate-100 py-4 last:border-b-0 last:pb-0 first:pt-0">
      <div className="text-[13px] font-semibold text-slate-900">{label}</div>
      {children}
      {hint ? <p className="text-[12px] text-slate-500">{hint}</p> : null}
      {tip ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-[12px] text-amber-900">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <span>{tip}</span>
        </div>
      ) : null}
    </div>
  );
}

export function FieldLabel({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-[12.5px] font-semibold text-slate-800">
      {children}
      {required ? <span className="font-bold text-rose-500">*</span> : null}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  mono?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none ${
        mono ? "font-mono" : ""
      }`}
    />
  );
}

export function OptionRadios({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {options.map((opt) => (
        <label key={opt} className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700">
          <input
            type="radio"
            name={name}
            checked={value === opt}
            onChange={() => onChange(opt)}
            className="h-4 w-4 cursor-pointer text-teal-600 focus:ring-teal-500"
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

export function YesNoRadios({
  name,
  value,
  onChange,
}: {
  name: string;
  value: "Yes" | "No";
  onChange: (v: "Yes" | "No") => void;
}) {
  return <OptionRadios name={name} value={value} options={["Yes", "No"]} onChange={(v) => onChange(v as "Yes" | "No")} />;
}
