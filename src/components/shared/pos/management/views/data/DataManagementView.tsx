import { useState } from "react";
import { Database, Upload, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function DataManagementView() {
  return (
    <div className="space-y-4 w-full">
      <div>
        <h2 className="font-serif text-[18px] font-bold text-slate-900 tracking-tight">Data Management</h2>
        <p className="text-[12.5px] text-slate-500 mt-0.5">
          Local POS offline database backup, historical data cleanup, and cloud restore points.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-slate-900">Cloud Sync & Local Cache</div>
              <div className="text-[12px] text-slate-500">
                Database Size: 24.8 MB • Last Synced: 2 mins ago
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => toast.success("Backup archive generated successfully")}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" /> Backup Now
          </button>
        </div>
      </div>
    </div>
  );
}
