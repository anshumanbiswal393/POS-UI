import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, Users, Phone, User, Check, Combine, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { RestaurantTable, ReservationItem } from "@/types/posTables";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";

interface NewReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: RestaurantTable[];
  preselectedTableId?: string;
  onSaveReservation: (data: Omit<ReservationItem, "id" | "createdAt" | "status">) => void;
}

const PAX_PRESETS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16] as const;

function todayInputValue() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDisplayDate(isoDate: string) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDisplayTime(hhmm: string) {
  if (!hhmm) return "";
  const [hStr, mStr] = hhmm.split(":");
  let h = Number(hStr);
  const m = Number(mStr) || 0;
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
}

function tableCapacitySum(tables: RestaurantTable[], ids: string[]) {
  return ids.reduce((sum, id) => {
    const table = tables.find((t) => t.id === id);
    return sum + (table?.capacity || 0);
  }, 0);
}

export function NewReservationModal({
  isOpen,
  onClose,
  tables,
  preselectedTableId,
  onSaveReservation,
}: NewReservationModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [guests, setGuests] = useState(2);
  const [isCustomPax, setIsCustomPax] = useState(false);
  const [customPaxText, setCustomPaxText] = useState("");
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [mergeMode, setMergeMode] = useState(false);
  const [reservationDate, setReservationDate] = useState(todayInputValue);
  const [reservationTime, setReservationTime] = useState("19:30");
  const [notes, setNotes] = useState("");
  const [isVip, setIsVip] = useState(false);

  const vacantTables = useMemo(
    () => tables.filter((t) => t.status === "vacant").sort((a, b) => a.capacity - b.capacity),
    [tables],
  );

  const fittingSingleTables = useMemo(
    () => vacantTables.filter((t) => t.capacity >= guests),
    [vacantTables, guests],
  );

  const needsMerge = fittingSingleTables.length === 0 && vacantTables.length > 0;

  const selectedCapacity = useMemo(
    () => tableCapacitySum(tables, selectedTableIds),
    [tables, selectedTableIds],
  );

  const capacityOk = selectedTableIds.length > 0 && selectedCapacity >= guests;
  const totalVacantCapacity = useMemo(
    () => vacantTables.reduce((sum, t) => sum + t.capacity, 0),
    [vacantTables],
  );

  // Defaults only when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setReservationDate(todayInputValue());
    setReservationTime("19:30");
    setIsCustomPax(false);
    setCustomPaxText("");
    setGuests(2);
  }, [isOpen]);

  // Recompute table picks when pax / vacancy changes while open
  useEffect(() => {
    if (!isOpen) return;

    const preferMerge = vacantTables.every((t) => t.capacity < guests) && vacantTables.length > 0;
    setMergeMode(preferMerge);

    if (preferMerge) {
      const picks: string[] = [];
      let seats = 0;
      for (const table of vacantTables) {
        if (seats >= guests) break;
        picks.push(table.id);
        seats += table.capacity;
      }
      setSelectedTableIds(picks);
      return;
    }

    const preferred =
      (preselectedTableId &&
        vacantTables.find((t) => t.id === preselectedTableId && t.capacity >= guests)) ||
      fittingSingleTables[0] ||
      vacantTables.find((t) => t.id === preselectedTableId) ||
      vacantTables[0];

    setSelectedTableIds(preferred ? [preferred.id] : []);
  }, [isOpen, guests, vacantTables, fittingSingleTables, preselectedTableId]);

  function selectPresetPax(num: number) {
    setIsCustomPax(false);
    setCustomPaxText("");
    setGuests(num);
  }

  function enableCustomPax() {
    setIsCustomPax(true);
    setCustomPaxText(guests > 16 ? String(guests) : "18");
    setGuests(guests > 16 ? guests : 18);
  }

  function handleCustomPaxChange(value: string) {
    const cleaned = value.replace(/\D/g, "").slice(0, 2);
    setCustomPaxText(cleaned);
    const parsed = parseInt(cleaned, 10);
    if (parsed >= 1) setGuests(parsed);
  }

  function toggleMergedTable(tableId: string) {
    setSelectedTableIds((prev) => {
      if (prev.includes(tableId)) return prev.filter((id) => id !== tableId);
      return [...prev, tableId];
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Customer name and phone are required.");
      return;
    }
    if (!reservationDate) {
      toast.error("Please choose a reservation date.");
      return;
    }
    if (!reservationTime) {
      toast.error("Please choose a reservation time.");
      return;
    }
    if (isCustomPax && (!customPaxText || guests < 1)) {
      toast.error("Enter a valid custom party size.");
      return;
    }
    if (selectedTableIds.length === 0) {
      toast.error("Select at least one vacant table.");
      return;
    }
    if (!capacityOk) {
      toast.error(
        `Selected tables seat ${selectedCapacity}, but party is ${guests} pax. Merge more vacant tables.`,
      );
      return;
    }
    if (totalVacantCapacity < guests) {
      toast.error("Not enough vacant seats available for this party size.");
      return;
    }

    const ordered = selectedTableIds
      .map((id) => tables.find((t) => t.id === id))
      .filter(Boolean) as RestaurantTable[];
    const primary = ordered[0];
    const isMerged = ordered.length > 1;
    const tableLabel = isMerged
      ? ordered.map((t) => t.tableNumber).join(" + ")
      : primary.tableNumber;

    const displayDate = formatDisplayDate(reservationDate);
    const displayTime = formatDisplayTime(reservationTime);
    const mergeNote = isMerged
      ? `Merged tables: ${tableLabel} (${selectedCapacity} seats) for ${guests} pax.`
      : undefined;

    onSaveReservation({
      tableId: primary.id,
      tableNumber: tableLabel,
      mergedTableIds: ordered.map((t) => t.id),
      mergedTableNumbers: ordered.map((t) => t.tableNumber),
      isMerged,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail || undefined,
      guests,
      reservationDate: displayDate,
      reservationTime: displayTime,
      endTime: formatDisplayTime(
        (() => {
          const [h, m] = reservationTime.split(":").map(Number);
          const end = new Date();
          end.setHours(h || 0, (m || 0) + 120, 0, 0);
          return `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
        })(),
      ),
      paymentStatus: "deposit_paid",
      depositAmount: 25,
      isVip,
      notes: [notes.trim() || undefined, mergeNote].filter(Boolean).join(" "),
    });

    toast.success(
      isMerged
        ? `Reserved ${tableLabel} for ${customerName.trim()} (${guests} pax)`
        : `Reserved ${primary.tableNumber} for ${customerName.trim()} (${guests} pax)`,
    );

    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setNotes("");
    setIsVip(false);
    setGuests(2);
    setIsCustomPax(false);
    setCustomPaxText("");
    setMergeMode(false);
    setSelectedTableIds([]);
    onClose();
  }

  return (
    <PosCreatePanel
      open={isOpen}
      onClose={onClose}
      title="Book Reservation"
      description="Set pax first. If one vacant table is too small, merge tables under the same guest."
      icon={Calendar}
      size="lg"
      onSubmit={handleSubmit}
      footer={
        <>
          <PosCreateCancelButton onClick={onClose} />
          <PosCreateSubmitButton disabled={!capacityOk}>
            <Check className="w-3.5 h-3.5" />
            {selectedTableIds.length > 1 ? "Confirm merged reservation" : "Confirm reservation"}
          </PosCreateSubmitButton>
        </>
      }
    >
          {/* Pax first — single compact row */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                Party size (Pax) *
              </label>
              <span className="text-[11px] font-semibold text-primary">{guests} guests</span>
            </div>
            <div className="flex flex-nowrap items-center gap-1 overflow-x-auto pb-0.5">
              {PAX_PRESETS.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => selectPresetPax(num)}
                  className={`shrink-0 min-w-7 px-2 py-1 rounded-md text-[11.5px] font-bold border transition cursor-pointer ${
                    !isCustomPax && guests === num
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-surface text-text-primary border-border hover:bg-surface-2"
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={enableCustomPax}
                className={`shrink-0 px-2 py-1 rounded-md text-[11.5px] font-bold border transition cursor-pointer ${
                  isCustomPax
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-surface text-text-primary border-border hover:bg-surface-2"
                }`}
              >
                Custom
              </button>
              {isCustomPax && (
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g. 20"
                  value={customPaxText}
                  onChange={(e) => handleCustomPaxChange(e.target.value)}
                  className="shrink-0 w-16 rounded-md border border-border bg-surface px-2 py-1 text-[11.5px] font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  aria-label="Custom party size"
                />
              )}
            </div>

            <div className="mt-1.5 text-[11px] text-text-secondary">
              {fittingSingleTables.length > 0 ? (
                <span>
                  {fittingSingleTables.length} vacant table
                  {fittingSingleTables.length > 1 ? "s" : ""} can seat {guests}+ alone.
                </span>
              ) : totalVacantCapacity >= guests ? (
                <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  No single vacant table fits {guests} pax — merge tables below.
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Only {totalVacantCapacity} vacant seats available (need {guests}).
                </span>
              )}
            </div>
          </div>

          {/* Customer */}
          <div>
            <label className="block text-[12px] font-semibold text-text-primary mb-1">
              Customer Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. Usman ibn Hunaif"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[13px] bg-surface-2 border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[12px] font-semibold text-text-primary mb-1">Phone *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-[13px] bg-surface-2 border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-text-primary mb-1">Date *</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  min={todayInputValue()}
                  value={reservationDate}
                  onChange={(e) => setReservationDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-[13px] bg-surface-2 border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-text-primary mb-1">Time *</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-text-disabled absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="time"
                  required
                  value={reservationTime}
                  onChange={(e) => setReservationTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-[13px] bg-surface-2 border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Table assign / merge */}
          <div className="rounded-xl border border-border p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[12.5px] font-bold text-text-primary">Assign table(s)</div>
                <div className="text-[11px] text-text-secondary">
                  Selected seats:{" "}
                  <span className={capacityOk ? "text-primary font-bold" : "text-rose-600 font-bold"}>
                    {selectedCapacity}
                  </span>{" "}
                  / {guests} pax
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !mergeMode;
                  setMergeMode(next);
                  if (!next && fittingSingleTables[0]) {
                    setSelectedTableIds([fittingSingleTables[0].id]);
                  } else if (next && selectedTableIds.length <= 1) {
                    const picks: string[] = [];
                    let seats = 0;
                    for (const table of vacantTables) {
                      if (seats >= guests) break;
                      picks.push(table.id);
                      seats += table.capacity;
                    }
                    setSelectedTableIds(picks);
                  }
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-bold border transition cursor-pointer ${
                  mergeMode || needsMerge
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-surface text-text-primary border-border hover:bg-surface-2"
                }`}
              >
                <Combine className="w-3.5 h-3.5" />
                Merge tables
              </button>
            </div>

            {!mergeMode && !needsMerge ? (
              <select
                value={selectedTableIds[0] || ""}
                onChange={(e) => setSelectedTableIds(e.target.value ? [e.target.value] : [])}
                className="w-full py-2 px-3 text-[13px] bg-surface-2 border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Select a vacant table</option>
                {fittingSingleTables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tableNumber} — {t.capacity} seats ({t.area})
                  </option>
                ))}
                {vacantTables
                  .filter((t) => t.capacity < guests)
                  .map((t) => (
                    <option key={t.id} value={t.id} disabled>
                      {t.tableNumber} — {t.capacity} seats (too small for {guests} pax)
                    </option>
                  ))}
              </select>
            ) : (
              <div className="space-y-1.5">
                <p className="text-[11px] text-text-secondary">
                  Tap vacant tables to merge under this guest until seats cover {guests} pax.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-0.5">
                  {vacantTables.map((t) => {
                    const selected = selectedTableIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleMergedTable(t.id)}
                        className={`rounded-xl border px-3 py-2 text-left transition cursor-pointer ${
                          selected
                            ? "border-primary bg-primary/10 shadow-xs"
                            : "border-border bg-surface hover:bg-surface-2"
                        }`}
                      >
                        <div className="text-[13px] font-bold text-text-primary">{t.tableNumber}</div>
                        <div className="text-[11px] text-text-secondary">
                          {t.capacity} seats · {t.area}
                        </div>
                        {selected && (
                          <div className="mt-0.5 text-[10.5px] font-bold text-primary">Selected</div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {vacantTables.length === 0 && (
                  <p className="text-[11px] text-rose-600 font-medium">No vacant tables right now.</p>
                )}
              </div>
            )}

            {selectedTableIds.length > 1 && (
              <div className="rounded-lg bg-surface-2 border border-border px-3 py-2 text-[11px] text-text-secondary">
                Merged under{" "}
                <span className="font-bold text-text-primary">{customerName.trim() || "this guest"}</span>
                :{" "}
                <span className="font-semibold text-primary">
                  {selectedTableIds
                    .map((id) => tables.find((t) => t.id === id)?.tableNumber)
                    .filter(Boolean)
                    .join(" + ")}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-text-primary mb-1">
              Special notes / requests
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Window side, high chair, celebration cake"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 text-[13px] bg-surface-2 border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="vipGuestCheck"
              checked={isVip}
              onChange={(e) => setIsVip(e.target.checked)}
              className="rounded text-primary focus:ring-primary"
            />
            <label htmlFor="vipGuestCheck" className="text-[12px] text-text-primary font-medium cursor-pointer">
              Mark as VIP guest
            </label>
          </div>
    </PosCreatePanel>
  );
}
