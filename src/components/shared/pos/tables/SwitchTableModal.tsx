import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Users, ArrowLeftRight, Check, MapPin, Search } from "lucide-react";
import type { RestaurantTable, ReservationItem } from "@/types/posTables";

interface SwitchTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationItem | null;
  tables: RestaurantTable[];
  onConfirmSwitch: (reservationId: string, newTableId: string) => void;
  isPending?: boolean;
}

export function SwitchTableModal({
  isOpen,
  onClose,
  reservation,
  tables,
  onConfirmSwitch,
  isPending = false,
}: SwitchTableModalProps) {
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedTableId("");
      setSearchQuery("");
    }
  }, [isOpen]);

  const candidateTables = useMemo(() => {
    if (!reservation) return [];
    return tables.filter((t) => {
      // Exclude current table
      if (t.id === reservation.tableId) return false;
      if (reservation.mergedTableIds?.includes(t.id)) return false;

      // Filter by search query if any
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = t.tableNumber.toLowerCase().includes(q);
        const matchArea = (t.area || "").toLowerCase().includes(q);
        if (!matchNum && !matchArea) return false;
      }

      return true;
    });
  }, [tables, reservation, searchQuery]);

  if (!reservation) return null;

  const currentTable = tables.find((t) => t.id === reservation.tableId);
  const selectedTable = tables.find((t) => t.id === selectedTableId);

  const handleConfirm = () => {
    if (!selectedTableId || !reservation) return;
    onConfirmSwitch(reservation.id, selectedTableId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <DialogHeader className="p-5 pb-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 leading-tight">
                Switch Reservation Table
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Reassign this booking to another available table.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Reservation Summary */}
          <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-teal-950 text-sm">{reservation.customerName}</span>
                <div className="text-teal-700 font-medium text-[11.5px] mt-0.5">
                  {reservation.guests} Guests • {reservation.reservationDate} at {reservation.reservationTime}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal-600 block">
                  Current Table
                </span>
                <span className="font-extrabold text-teal-900 text-sm">
                  {reservation.tableNumber || currentTable?.tableNumber || "Table"}
                </span>
              </div>
            </div>
          </div>

          {/* Search Table */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search available tables or dining area..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Tables Grid */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Choose New Table
            </span>

            {candidateTables.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No alternative tables found.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {candidateTables.map((table) => {
                  const isSelected = selectedTableId === table.id;
                  const isVacant = table.status === "vacant";
                  const fitsParty = table.capacity >= reservation.guests;

                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => setSelectedTableId(table.id)}
                      className={`relative p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? "bg-primary/5 border-primary ring-2 ring-primary/20 shadow-xs"
                          : "bg-white hover:bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 w-full">
                        <div>
                          <div className="font-bold text-xs text-slate-900 truncate">
                            {table.tableNumber}
                          </div>
                          <div className="flex items-center gap-1 text-[10.5px] text-slate-500 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span className="truncate">{table.area || "Dining Area"}</span>
                          </div>
                        </div>
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[10.5px]">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{table.capacity} Seats</span>
                        </span>
                        {fitsParty ? (
                          <span className="px-1.5 py-0.2 rounded font-bold bg-emerald-100 text-emerald-800 text-[9.5px]">
                            Fits
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium text-[9.5px]">
                            Needs {reservation.guests - table.capacity}+
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedTableId || isPending}
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Confirm Switch Table</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
