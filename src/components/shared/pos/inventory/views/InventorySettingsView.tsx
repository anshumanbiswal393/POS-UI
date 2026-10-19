import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Search,
  Lightbulb,
  ChevronDown,
  RotateCw,
  FileText,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_INVENTORY_SETTINGS,
  INVENTORY_SETTING_FIELDS,
  INVENTORY_SETTINGS_SECTIONS,
  INVENTORY_SETTINGS_STORAGE_KEY,
  type InventorySettings,
  type InventorySettingsSectionId,
  type SettingFieldDef,
  type YesNo,
} from "@/components/shared/pos/inventory/settings/inventorySettingsSchema";

function loadSettings(): InventorySettings {
  try {
    const raw = localStorage.getItem(INVENTORY_SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_INVENTORY_SETTINGS };
    return { ...DEFAULT_INVENTORY_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_INVENTORY_SETTINGS };
  }
}

function TipBanner({
  text,
  linkLabel,
  onLink,
}: {
  text: string;
  linkLabel?: string;
  onLink?: () => void;
}) {
  return (
    <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-[12px] text-amber-900">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <span>
        {text}
        {linkLabel ? (
          <>
            {" "}
            <button
              type="button"
              onClick={onLink}
              className="cursor-pointer font-bold text-amber-950 underline hover:text-teal-700"
            >
              {linkLabel}
            </button>
          </>
        ) : null}
      </span>
    </div>
  );
}

function YesNoRadios({
  name,
  value,
  onChange,
}: {
  name: string;
  value: YesNo;
  onChange: (v: YesNo) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      {(["Yes", "No"] as const).map((opt) => (
        <label
          key={opt}
          className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700"
        >
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

function SettingField({
  field,
  settings,
  onChange,
  onTipLink,
}: {
  field: SettingFieldDef;
  settings: InventorySettings;
  onChange: <K extends keyof InventorySettings>(key: K, value: InventorySettings[K]) => void;
  onTipLink: (action?: string) => void;
}) {
  if (field.showWhen && !field.showWhen(settings)) return null;

  const value = settings[field.key];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-900">
        <span>
          {field.label}
          {field.required ? <span className="text-red-500"> *</span> : null}
        </span>
        {field.info ? (
          <span className="cursor-help text-slate-400" title={field.info}>
            ⓘ
          </span>
        ) : null}
      </div>

      {field.type === "yesno" ? (
        <YesNoRadios
          name={field.key}
          value={value as YesNo}
          onChange={(v) => onChange(field.key, v)}
        />
      ) : null}

      {field.type === "radio" && field.options ? (
        <div className="flex flex-wrap items-center gap-5">
          {field.options.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700"
            >
              <input
                type="radio"
                name={field.key}
                checked={String(value) === opt}
                onChange={() => onChange(field.key, opt as InventorySettings[typeof field.key])}
                className="h-4 w-4 cursor-pointer text-teal-600 focus:ring-teal-500"
              />
              {opt || "Select"}
            </label>
          ))}
        </div>
      ) : null}

      {field.type === "text" || field.type === "number" ? (
        <div className="max-w-md">
          <input
            type={field.type === "number" ? "number" : "text"}
            value={String(value ?? "")}
            onChange={(e) => onChange(field.key, e.target.value as InventorySettings[typeof field.key])}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
          />
        </div>
      ) : null}

      {field.type === "select" && field.options ? (
        <div className="relative max-w-md">
          <select
            value={String(value ?? "")}
            onChange={(e) => onChange(field.key, e.target.value as InventorySettings[typeof field.key])}
            className="w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-[12.5px] text-slate-700 focus:border-teal-500 focus:outline-none"
          >
            {field.options.map((opt) => (
              <option key={opt || "__empty"} value={opt}>
                {opt || "Select options"}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-3.5 w-3.5 text-slate-400" />
        </div>
      ) : null}

      {field.type === "textarea" ? (
        <div className="max-w-xl">
          <textarea
            rows={3}
            value={String(value ?? "")}
            onChange={(e) => onChange(field.key, e.target.value as InventorySettings[typeof field.key])}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
            placeholder="Enter shipping address"
          />
        </div>
      ) : null}

      {field.tip ? (
        <TipBanner
          text={field.tip.text}
          linkLabel={field.tip.linkLabel}
          onLink={() => onTipLink(field.tip?.linkAction)}
        />
      ) : null}

      {field.note ? <div className="pt-0.5 text-[12px] text-teal-600">{field.note}</div> : null}
    </div>
  );
}

export function InventorySettingsView() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] =
    useState<InventorySettingsSectionId>("consumption_production");
  const [searchQuery, setSearchQuery] = useState("");
  const [settings, setSettings] = useState<InventorySettings>(() => loadSettings());
  const [logFromDate, setLogFromDate] = useState("2026-10-13");
  const [logToDate, setLogToDate] = useState("2026-10-19");
  const [logs] = useState<
    Array<{
      at: string;
      section: string;
      setting: string;
      previous: string;
      next: string;
      by: string;
    }>
  >([]);

  const update = <K extends keyof InventorySettings>(key: K, value: InventorySettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const sectionFields = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return INVENTORY_SETTING_FIELDS.filter((f) => {
      if (f.section !== activeSection) return false;
      if (!q) return true;
      return f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q);
    });
  }, [activeSection, searchQuery]);

  const matchedSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return new Set<InventorySettingsSectionId>();
    return new Set(
      INVENTORY_SETTING_FIELDS.filter(
        (f) => f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q),
      ).map((f) => f.section),
    );
  }, [searchQuery]);

  const handleTipLink = (action?: string) => {
    if (action === "recipes") {
      void navigate({ to: "/pos/inventory/masters/recipes" });
      return;
    }
    if (action === "barcodes") {
      toast.info("Open Raw Materials to generate barcodes");
      void navigate({ to: "/pos/inventory/masters/raw-materials" });
      return;
    }
    toast.info("Opening related setup…");
  };

  const handleSave = () => {
    if (!settings.purchaseInvoiceLabel.trim() || !settings.salesInvoiceLabel.trim()) {
      toast.error("Purchase and sales invoice labels are required");
      return;
    }
    if (!settings.transferPdfLabel.trim()) {
      toast.error("Transfer PDF label is required");
      return;
    }
    localStorage.setItem(INVENTORY_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    toast.success("Stock settings saved");
  };

  const handleCopySettings = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
      toast.success("Settings copied to clipboard");
    } catch {
      toast.info("Settings configuration ready to copy");
    }
  };

  const activeLabel =
    INVENTORY_SETTINGS_SECTIONS.find((s) => s.id === activeSection)?.label ?? "Settings";

  return (
    <div className="flex flex-col items-start gap-4 pb-12 lg:flex-row">
      <div className="w-full shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs lg:w-[280px]">
        <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/50 p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Sliders className="h-4 w-4" />
          </div>
          <span className="text-[14px] font-bold text-slate-900">Inventory Settings</span>
        </div>

        <div className="divide-y divide-slate-100 text-[13px]">
          {INVENTORY_SETTINGS_SECTIONS.map((sec) => {
            const isActive = activeSection === sec.id;
            const hasMatch = matchedSections.has(sec.id);
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left font-medium transition ${
                  isActive
                    ? "border-l-4 border-teal-600 bg-teal-50/40 font-bold text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="leading-snug">{sec.label}</span>
                {searchQuery && hasMatch && !isActive ? (
                  <span className="ml-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-[580px] w-full flex-1 flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/30 p-4">
          <h3 className="text-[15px] font-bold text-slate-900">{activeLabel}</h3>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => void handleCopySettings()}
              className="cursor-pointer rounded-lg border border-teal-600 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-teal-600 transition hover:bg-teal-50"
            >
              Copy Settings
            </button>
            <div className="relative min-w-[200px] max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search for setting here"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-1 pl-8 pr-3 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6 p-6">
          {activeSection === "configuration_logs" ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <label className="text-[11.5px] font-semibold text-slate-600">From Date</label>
                  <input
                    type="date"
                    value={logFromDate}
                    onChange={(e) => setLogFromDate(e.target.value)}
                    className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11.5px] font-semibold text-slate-600">To Date</label>
                  <input
                    type="date"
                    value={logToDate}
                    onChange={(e) => setLogToDate(e.target.value)}
                    className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => toast.info("Searching configuration logs…")}
                  className="cursor-pointer rounded-lg border border-teal-500 bg-white px-5 py-1.5 text-[12.5px] font-semibold text-teal-600 shadow-2xs transition hover:bg-teal-50"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => toast.info("Reloading audit log")}
                  className="cursor-pointer rounded-lg border border-slate-300 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
                  title="Reload"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-xs">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                    <FileText className="h-10 w-10" />
                  </div>
                  <div className="text-[15px] font-bold text-slate-700">Record Not Found</div>
                  <p className="mx-auto max-w-sm text-[12.5px] text-slate-400">
                    No configuration changes recorded in this date range.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-[12.5px]">
                    <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5">Date & Time</th>
                        <th className="px-4 py-2.5">Section</th>
                        <th className="px-4 py-2.5">Setting</th>
                        <th className="px-4 py-2.5">Previous Value</th>
                        <th className="px-4 py-2.5">New Value</th>
                        <th className="px-4 py-2.5">Changed By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((row, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="px-4 py-2.5">{row.at}</td>
                          <td className="px-4 py-2.5">{row.section}</td>
                          <td className="px-4 py-2.5">{row.setting}</td>
                          <td className="px-4 py-2.5">{row.previous}</td>
                          <td className="px-4 py-2.5">{row.next}</td>
                          <td className="px-4 py-2.5">{row.by}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : sectionFields.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-6 py-12 text-center text-[13px] text-slate-500">
              No settings match “{searchQuery}” in this section.
            </div>
          ) : (
            sectionFields.map((field) => (
              <SettingField
                key={field.key}
                field={field}
                settings={settings}
                onChange={update}
                onTipLink={handleTipLink}
              />
            ))
          )}

          {activeSection === "sales_transfer" ? (
            <div className="space-y-2">
              <div className="text-[13px] font-semibold text-slate-900">
                Standardise the sale&apos;s terms and conditions.
              </div>
              <button
                type="button"
                onClick={() => toast.info("Terms & conditions editor coming soon")}
                className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-semibold text-teal-600 hover:underline"
              >
                Click here
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
        </div>

        {activeSection !== "configuration_logs" ? (
          <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 p-4">
            <button
              type="button"
              onClick={handleSave}
              className="cursor-pointer rounded-lg bg-teal-600 px-8 py-2 text-[13px] font-bold text-white shadow-md transition hover:bg-teal-700"
            >
              Save
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
