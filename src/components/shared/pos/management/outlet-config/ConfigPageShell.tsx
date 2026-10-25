import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Lightbulb } from "lucide-react";

export function ConfigPageShell({
  title,
  subtitle,
  onSave,
  saveLabel = "Save",
  children,
}: {
  title: string;
  subtitle: string;
  onSave: () => void;
  saveLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Link
            to="/pos/management/configuration/outlet"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-teal-700 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Outlet Setup
          </Link>
          <h2 className="text-[18px] font-bold tracking-tight text-slate-900">{title}</h2>
          <p className="text-[12.5px] text-slate-500">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onSave}
          className="cursor-pointer rounded-lg bg-teal-600 px-6 py-2 text-[13px] font-bold text-white shadow-md transition hover:bg-teal-700"
        >
          {saveLabel}
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="p-6">{children}</div>
        <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 p-4">
          <button
            type="button"
            onClick={onSave}
            className="cursor-pointer rounded-lg bg-teal-600 px-8 py-2 text-[13px] font-bold text-white shadow-md transition hover:bg-teal-700"
          >
            {saveLabel}
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
