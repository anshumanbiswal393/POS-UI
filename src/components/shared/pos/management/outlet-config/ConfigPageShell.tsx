import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

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
            Outlet Configuration
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">{children}</div>
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

export function YesNoRadios({
  name,
  value,
  onChange,
}: {
  name: string;
  value: "Yes" | "No";
  onChange: (v: "Yes" | "No") => void;
}) {
  return (
    <div className="flex items-center gap-4">
      {(["Yes", "No"] as const).map((opt) => (
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
