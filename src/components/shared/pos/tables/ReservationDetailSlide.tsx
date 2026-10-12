import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  FileText,
  CreditCard,
  Crown,
  CheckCircle2,
  XCircle,
  Utensils,
  MapPin,
  Trash2,
  AlertCircle,
  Receipt,
  UserCheck,
} from "lucide-react";
import type { RestaurantTable, ReservationItem } from "@/types/posTables";

interface ReservationDetailSlideProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable: RestaurantTable | null;
  selectedReservation: ReservationItem | null;
  onSeatGuests: (tableId: string, reservationId?: string) => void;
  onCancelReservation: (reservationId: string) => void;
  onVacateTable: (tableId: string) => void;
  onOpenNewBooking: (tableId?: string) => void;
  onOpenEditOrder?: (table: RestaurantTable) => void;
}

export function ReservationDetailSlide({
  isOpen,
  onClose,
  selectedTable,
  selectedReservation,
  onSeatGuests,
  onCancelReservation,
  onVacateTable,
  onOpenNewBooking,
  onOpenEditOrder,
}: ReservationDetailSlideProps) {
  if (!selectedTable && !selectedReservation) return null;

  const res = selectedReservation || selectedTable?.activeReservation;
  const isReserved = selectedTable?.status === "reserved" || !!res;
  const isOccupied = selectedTable?.status === "occupied";
  const isVacant = selectedTable?.status === "vacant" && !res;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-white border-l border-slate-200 shadow-2xl z-50 overflow-hidden"
      >
        {/* Header Strip */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-xs">
                {selectedTable?.tableNumberRaw || "#"}
              </span>
              <div>
                <SheetTitle className="text-lg font-bold text-slate-900 leading-none">
                  {selectedTable?.tableNumber || res?.tableNumber || "Table Details"}
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedTable?.area || "Main Dining Area"}</span>
                  <span>•</span>
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedTable?.capacity || res?.guests || 4} Seats</span>
                </SheetDescription>
              </div>
            </div>

            {/* Current Status Pill */}
            {isReserved && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <CheckCircle2 className="w-3 h-3" />
                Reserved
              </span>
            )}
            {isOccupied && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                On Dine
              </span>
            )}
            {isVacant && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                Available
              </span>
            )}
          </div>
        </div>

        {/* Slide Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. RESERVATION DETAILS (When table is reserved or reservation is selected) */}
          {res && (
            <>
              {/* Who Reserved Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Who Reserved
                </div>

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-xs">
                      {res.customerName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900">
                          {res.customerName}
                        </span>
                        {res.isVip && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            <Crown className="w-2.5 h-2.5 text-amber-600" />
                            VIP Guest
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Users className="w-3.5 h-3.5 text-teal-600" />
                        <span className="font-semibold text-slate-700">{res.guests} Guests</span>
                        <span>allocated to</span>
                        <span className="font-semibold text-teal-700">{res.tableNumber}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact items */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <div className="h-6 w-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <a
                      href={`tel:${res.customerPhone}`}
                      className="font-medium hover:text-teal-600 hover:underline"
                    >
                      {res.customerPhone}
                    </a>
                  </div>
                  {res.customerEmail && (
                    <div className="flex items-center gap-2.5 text-slate-600">
                      <div className="h-6 w-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <a
                        href={`mailto:${res.customerEmail}`}
                        className="font-medium hover:text-teal-600 hover:underline truncate"
                      >
                        {res.customerEmail}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Timing & Schedule Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Timing & Booking Schedule
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <div className="flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      <span>Date</span>
                    </div>
                    <div className="mt-1 font-bold text-slate-900 text-sm">
                      {res.reservationDate}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <div className="flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>Reserved Time</span>
                    </div>
                    <div className="mt-1 font-bold text-slate-900 text-sm">
                      {res.reservationTime}
                    </div>
                  </div>
                </div>

                {res.endTime && (
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 bg-teal-50/60 p-2.5 rounded-lg border border-teal-100">
                    <span className="font-medium text-teal-900">Seating Duration:</span>
                    <span className="font-semibold text-teal-700">
                      {res.reservationTime} → {res.endTime} (approx. 2 hrs)
                    </span>
                  </div>
                )}
              </div>

              {/* Special Notes & Requests */}
              {res.notes && (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Special Notes & Requests</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-200/60 font-medium">
                    &quot;{res.notes}&quot;
                  </p>
                </div>
              )}

              {/* Payment / Deposit Status */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {res.paymentStatus === "paid"
                          ? "Booking Deposit Paid"
                          : res.paymentStatus === "deposit_paid"
                            ? "Partial Deposit Paid"
                            : "No Deposit Required"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {res.depositAmount
                          ? `₹${res.depositAmount.toFixed(2)} received via Card/Online`
                          : "Pay on arrival at POS"}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      res.paymentStatus === "paid" || res.paymentStatus === "deposit_paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {res.paymentStatus?.toUpperCase() || "CONFIRMED"}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* 2. OCCUPIED / ON DINE ACTIVE ORDER VIEW */}
          {isOccupied && selectedTable?.activeOrder && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-800">
                    <Receipt className="w-4 h-4 text-orange-600" />
                    <span>Active Order: {selectedTable.activeOrder.orderNumber}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-200 text-orange-800">
                    {selectedTable.activeOrder.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                  <div className="bg-white p-2.5 rounded-xl border border-orange-100">
                    <span className="text-slate-400 block text-[10.5px]">Seated At</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {selectedTable.activeOrder.seatedAt}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-orange-100">
                    <span className="text-slate-400 block text-[10.5px]">Elapsed Time</span>
                    <span className="font-bold text-orange-700 text-sm">
                      {selectedTable.activeOrder.elapsedMinutes} mins
                    </span>
                  </div>
                </div>

                {/* Guest & Waiter info */}
                <div className="bg-white p-2.5 rounded-xl border border-orange-100 text-xs mb-3 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Guest Name:</span>
                    <span className="font-bold text-slate-800">
                      {selectedTable.activeOrder.guestName || "Walk-in Guest"}
                    </span>
                  </div>
                  {selectedTable.activeOrder.guestPhone && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contact:</span>
                      <span className="font-semibold text-slate-700 font-mono">
                        {selectedTable.activeOrder.guestPhone}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Captain / Server:</span>
                    <span className="font-bold text-teal-800">
                      {selectedTable.activeOrder.serverName}
                    </span>
                  </div>
                </div>

                {/* Ordered Dishes List */}
                {selectedTable.activeOrder.items && selectedTable.activeOrder.items.length > 0 && (
                  <div className="bg-white p-3 rounded-xl border border-orange-100 space-y-2 mb-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Ordered Dishes:
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                      {selectedTable.activeOrder.items.map((it, idx) => (
                        <div key={idx} className="py-1.5 flex justify-between items-center">
                          <span className="font-medium text-slate-800">
                            {it.name} <strong className="text-teal-700">× {it.quantity}</strong>
                          </span>
                          <span className="font-bold text-slate-900">
                            ₹{it.price * it.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white p-3 rounded-xl border border-orange-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500">Current Total:</span>
                    <div className="text-lg font-bold text-slate-900">
                      ₹{selectedTable.activeOrder.totalAmount.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-teal-700">
                    {selectedTable.activeOrder.itemsCount} Dishes Billed
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 3. VACANT TABLE VIEW */}
          {isVacant && selectedTable && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">
                {selectedTable.tableNumber} is Vacant
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                No active reservations or dining party currently assigned to this table.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-2">
          {/* When Table is Reserved: Action to Seat Guests or Cancel */}
          {isReserved && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedTable?.id) {
                    onSeatGuests(selectedTable.id, res?.id);
                  } else if (res?.tableId) {
                    onSeatGuests(res.tableId, res.id);
                  }
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-sm hover:bg-primary/90 active:scale-[0.99] transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                Seat Guests Now (Mark On Dine)
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (res?.id) onCancelReservation(res.id);
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-rose-200 text-rose-600 font-semibold text-xs hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Cancel Reservation
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* When Table is Occupied: Option to Edit Order or Vacate */}
          {isOccupied && selectedTable && (
            <div className="space-y-2">
              {onOpenEditOrder && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenEditOrder(selectedTable);
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-sm hover:bg-primary/90 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Utensils className="w-4 h-4" />
                  Edit Order / Add Dishes
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onVacateTable(selectedTable.id);
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-orange-300 text-orange-800 bg-orange-50 font-bold text-xs hover:bg-orange-100 transition-colors cursor-pointer"
              >
                Clear & Vacate Table
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          )}

          {/* When Table is Vacant: Seat Walk-in or Reserve */}
          {isVacant && selectedTable && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onSeatGuests(selectedTable.id);
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                Seat Walk-in Guests
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenNewBooking(selectedTable.id);
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl border border-primary/20 text-primary font-semibold text-xs bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
              >
                + Book Reservation for {selectedTable.tableNumber}
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

