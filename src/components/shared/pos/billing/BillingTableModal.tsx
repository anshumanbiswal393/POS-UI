import { useMemo, useState } from "react";
import { X, Users, CheckCircle2 } from "lucide-react";
import { useDiningAreas, usePosTables } from "@/hooks/queries/usePosTables";
import type { RestaurantTable } from "@/types/posTables";

type BillingTableModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedTable: string;
  onSelectTable: (table: RestaurantTable) => void;
};

export function BillingTableModal({
  isOpen,
  onClose,
  selectedTable,
  onSelectTable,
}: BillingTableModalProps) {
  const [activeArea, setActiveArea] = useState<string>("All Areas");
  const { data: areasData = [] } = useDiningAreas();
  const { data: tables = [], isLoading } = usePosTables();

  const areas = useMemo(
    () => ["All Areas", ...areasData.filter((a) => a && a !== "All Areas")],
    [areasData],
  );

  // Same Take Order floor data — only tables free to start a check
  const selectableTables = useMemo(
    () => tables.filter((t) => t.status === "vacant" || t.status === "reserved"),
    [tables],
  );

  const filteredTables = useMemo(() => {
    if (activeArea === "All Areas") return selectableTables;
    return selectableTables.filter((t) => t.area === activeArea);
  }, [selectableTables, activeArea]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Select Table for Dine-In</h3>
            <p className="text-xs text-slate-500">
              Same floor tables as Take Order · Available &amp; Reserved only
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3 border-b border-slate-200 bg-white flex items-center gap-1.5 overflow-x-auto">
          {areas.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => setActiveArea(area)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeArea === area
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {isLoading ? (
            <p className="text-center text-xs text-slate-500 py-8">Loading tables…</p>
          ) : filteredTables.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-8">
              No available or reserved tables in this area.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredTables.map((table) => {
                const isSelected =
                  selectedTable === table.tableNumber ||
                  selectedTable === `Table #${table.tableNumberRaw}` ||
                  selectedTable === `T-${table.tableNumberRaw}`;
                const isVacant = table.status === "vacant";
                const guestHint = table.activeReservation?.customerName;
                const paxHint =
                  table.activeReservation?.guests || table.currentGuests || table.capacity;

                return (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => {
                      onSelectTable(table);
                      onClose();
                    }}
                    className={`flex flex-col justify-between p-3.5 rounded-xl border text-left transition cursor-pointer shadow-2xs hover:shadow-xs ${
                      isSelected
                        ? "border-teal-600 bg-teal-50/80 ring-2 ring-teal-600"
                        : isVacant
                          ? "border-emerald-200 bg-emerald-50/30 hover:border-emerald-400"
                          : "border-amber-200 bg-amber-50/30 hover:border-amber-400"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <span className="font-extrabold text-sm text-slate-900">
                          {table.tableNumber}
                        </span>
                        <div className="text-[11px] text-slate-500 truncate">{table.area}</div>
                        {guestHint ? (
                          <div className="text-[10px] text-amber-800 truncate mt-0.5">{guestHint}</div>
                        ) : null}
                      </div>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                        <Users className="h-3 w-3" /> {table.capacity} Seats
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isVacant
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isVacant ? "Available" : `Reserved · ${paxHint} Pax`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
