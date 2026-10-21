import { useState } from "react";
import {
  ConfigPageShell,
  FieldLabel,
  YesNoRadios,
} from "@/components/shared/pos/management/outlet-config/ConfigPageShell";
import { useOutletConfig } from "@/components/shared/pos/management/outlet-config/useOutletConfig";
import type { DayTiming } from "@/components/shared/pos/management/outlet-config/outletConfigStore";

function TimeInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="time"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[12.5px] disabled:bg-slate-50 disabled:text-slate-400"
    />
  );
}

export function OutletTimingsConfigView() {
  const { config, persist } = useOutletConfig();
  const [form, setForm] = useState(config.timings);

  const patchDay = (day: string, patch: Partial<DayTiming>) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.map((row) => (row.day === day ? { ...row, ...patch } : row)),
    }));
  };

  const applyToAll = (source: DayTiming) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.map((row) => ({
        ...source,
        day: row.day,
      })),
    }));
  };

  const handleSave = () => persist({ ...config, timings: form }, "Outlet timings saved");

  const templateDay = form.days[0];

  return (
    <ConfigPageShell
      title="Outlet Timings"
      subtitle="Configure closing hours, lunch & dinner timings, and where they are displayed."
      onSave={handleSave}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <FieldLabel>Use the same timings for all days?</FieldLabel>
            <YesNoRadios
              name="sameAllDays"
              value={form.sameAllDays}
              onChange={(v) => setForm((p) => ({ ...p, sameAllDays: v }))}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>Display timings on bills?</FieldLabel>
            <YesNoRadios
              name="displayOnBill"
              value={form.displayOnBill}
              onChange={(v) => setForm((p) => ({ ...p, displayOnBill: v }))}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>Display timings online?</FieldLabel>
            <YesNoRadios
              name="displayOnline"
              value={form.displayOnline}
              onChange={(v) => setForm((p) => ({ ...p, displayOnline: v }))}
            />
          </div>
        </div>

        {form.sameAllDays === "Yes" && templateDay ? (
          <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <h4 className="text-[13px] font-bold text-slate-800">Daily hours</h4>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="space-y-1">
                <span className="text-[11.5px] font-semibold text-slate-600">Opens</span>
                <TimeInput
                  value={templateDay.open}
                  onChange={(v) => applyToAll({ ...templateDay, open: v })}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11.5px] font-semibold text-slate-600">Closes</span>
                <TimeInput
                  value={templateDay.close}
                  onChange={(v) => applyToAll({ ...templateDay, close: v })}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11.5px] font-semibold text-slate-600">Lunch start</span>
                <TimeInput
                  value={templateDay.lunchStart}
                  onChange={(v) => applyToAll({ ...templateDay, lunchStart: v })}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11.5px] font-semibold text-slate-600">Lunch end</span>
                <TimeInput
                  value={templateDay.lunchEnd}
                  onChange={(v) => applyToAll({ ...templateDay, lunchEnd: v })}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11.5px] font-semibold text-slate-600">Dinner start</span>
                <TimeInput
                  value={templateDay.dinnerStart}
                  onChange={(v) => applyToAll({ ...templateDay, dinnerStart: v })}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11.5px] font-semibold text-slate-600">Dinner end</span>
                <TimeInput
                  value={templateDay.dinnerEnd}
                  onChange={(v) => applyToAll({ ...templateDay, dinnerEnd: v })}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[760px] text-left text-[12.5px]">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Day</th>
                  <th className="px-3 py-2.5">Closed</th>
                  <th className="px-3 py-2.5">Open</th>
                  <th className="px-3 py-2.5">Close</th>
                  <th className="px-3 py-2.5">Lunch</th>
                  <th className="px-3 py-2.5">Dinner</th>
                </tr>
              </thead>
              <tbody>
                {form.days.map((row) => (
                  <tr key={row.day} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-semibold text-slate-800">{row.day}</td>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={row.closed}
                        onChange={(e) => patchDay(row.day, { closed: e.target.checked })}
                        className="h-4 w-4 cursor-pointer text-teal-600"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <TimeInput
                        disabled={row.closed}
                        value={row.open}
                        onChange={(v) => patchDay(row.day, { open: v })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <TimeInput
                        disabled={row.closed}
                        value={row.close}
                        onChange={(v) => patchDay(row.day, { close: v })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <TimeInput
                          disabled={row.closed}
                          value={row.lunchStart}
                          onChange={(v) => patchDay(row.day, { lunchStart: v })}
                        />
                        <TimeInput
                          disabled={row.closed}
                          value={row.lunchEnd}
                          onChange={(v) => patchDay(row.day, { lunchEnd: v })}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <TimeInput
                          disabled={row.closed}
                          value={row.dinnerStart}
                          onChange={(v) => patchDay(row.day, { dinnerStart: v })}
                        />
                        <TimeInput
                          disabled={row.closed}
                          value={row.dinnerEnd}
                          onChange={(v) => patchDay(row.day, { dinnerEnd: v })}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ConfigPageShell>
  );
}
