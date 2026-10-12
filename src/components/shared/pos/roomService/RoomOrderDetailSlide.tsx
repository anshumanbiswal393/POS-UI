import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  BedDouble,
  User,
  Crown,
  Clock,
  CheckCircle2,
  ChefHat,
  Sparkles,
  Truck,
  BellRing,
  CreditCard,
  Building2,
  Receipt,
  FileText,
  Printer,
  Trash2,
  Check,
  AlertTriangle,
  Plus,
} from "lucide-react";
import type { RoomServiceOrder, RoomServiceOrderStatus } from "@/types/posRoomService";

interface RoomOrderDetailSlideProps {
  isOpen: boolean;
  onClose: () => void;
  order: RoomServiceOrder | null;
  onUpdateStatus: (orderId: string, status: RoomServiceOrderStatus) => void;
  onClearTray: (orderId: string) => void;
  onOpenAddItems: () => void;
}

const RUNNERS = [
  "Vikram N. (Butler)",
  "James Sterling (Head Butler)",
  "Marcus Chen (In-Room Server)",
  "Elena Rostova (Floor Captain)",
];

export function RoomOrderDetailSlide({
  isOpen,
  onClose,
  order,
  onUpdateStatus,
  onClearTray,
  onOpenAddItems,
}: RoomOrderDetailSlideProps) {
  if (!order) return null;

  const {
    orderNumber,
    roomNumber,
    floor,
    roomType,
    guest,
    items,
    status,
    subtotal,
    serviceCharge,
    tax,
    totalAmount,
    elapsedMinutes,
    assignedRunner,
    traySetup,
    paymentMethod,
    notes,
    isUrgent,
  } = order;

  // Timeline step calculation
  const steps: { key: RoomServiceOrderStatus; label: string; icon: React.ReactNode }[] = [
    { key: "kitchen_prep", label: "Kitchen Prep", icon: <ChefHat className="w-3.5 h-3.5" /> },
    { key: "tray_ready", label: "Tray Packed", icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: "dispatched", label: "Dispatched", icon: <Truck className="w-3.5 h-3.5" /> },
    { key: "delivered", label: "In Room", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    {
      key: "clearance_needed",
      label: "Tray Clearance",
      icon: <BellRing className="w-3.5 h-3.5" />,
    },
  ];

  const statusOrder: RoomServiceOrderStatus[] = [
    "kitchen_prep",
    "tray_ready",
    "dispatched",
    "delivered",
    "clearance_needed",
    "settled",
  ];

  const currentIdx = statusOrder.indexOf(status);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-white border-l border-slate-200 shadow-2xl z-50 overflow-hidden"
      >
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-extrabold text-lg shadow-xs">
                {roomNumber}
              </span>
              <div>
                <SheetTitle className="text-lg font-bold text-slate-900 leading-tight flex items-center gap-2">
                  <span>Room {roomNumber}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {orderNumber}
                  </span>
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-500 mt-0.5">
                  {floor} • {roomType}
                </SheetDescription>
              </div>
            </div>

            {isUrgent && (
              <span className="px-2 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 uppercase animate-pulse">
                Priority
              </span>
            )}
          </div>
        </div>

        {/* Slide Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Timeline Progress Tracker */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              In-Room Service Progress
            </div>

            <div className="flex items-center justify-between relative">
              {/* Connector line */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 -z-0" />

              {steps.map((s, idx) => {
                const isCompleted = currentIdx > idx;
                const isCurrent = currentIdx === idx;

                let circleClass = "bg-slate-100 text-slate-400 border-slate-200";
                if (isCompleted) {
                  circleClass = "bg-primary text-primary-foreground border-primary";
                } else if (isCurrent) {
                  circleClass = "bg-primary text-primary-foreground border-primary ring-4 ring-primary/20";
                }

                return (
                  <div key={s.key} className="flex flex-col items-center relative z-10">
                    <div
                      className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${circleClass}`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : s.icon}
                    </div>
                    <span
                      className={`text-[10px] font-bold mt-1 text-center whitespace-nowrap ${
                        isCurrent ? "text-primary" : "text-slate-400"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Guest Information Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              Guest Profile & Folio
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                  {guest.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{guest.name}</span>
                    {guest.vipTier && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Crown className="w-2.5 h-2.5 text-amber-600" />
                        VIP {guest.vipTier}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    Phone Ext: <strong className="text-slate-700">{guest.phoneExtension}</strong> •
                    Stay: {guest.checkInDate} - {guest.checkOutDate}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Ordered Dishes & In-Room Customizations */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              <span>Tray Items & Food Prep</span>
              <span className="font-mono text-primary font-bold">{items.length} Items</span>
            </div>

            <div className="space-y-2.5 divide-y divide-slate-100">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="pt-2 first:pt-0 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <span className="text-primary">{item.quantity}x</span>
                      <span>{item.name}</span>
                    </div>
                    {item.specialInstructions && (
                      <p className="text-[11px] text-amber-800 bg-amber-50/70 p-1.5 rounded-md mt-1 border border-amber-200/50">
                        Note: {item.specialInstructions}
                      </p>
                    )}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="flex items-center gap-1 text-[10.5px] text-slate-500 mt-0.5">
                        {item.modifiers.join(" • ")}
                      </div>
                    )}
                  </div>
                  <span className="font-bold text-slate-800 font-mono text-xs">
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Action to add more items / supplementary KOT */}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onOpenAddItems}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add More Items / Supplementary KOT</span>
              </button>
            </div>

            {notes && (
              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block text-[10.5px] uppercase">
                  Service Notes
                </span>
                <p className="text-slate-600 mt-0.5 leading-relaxed">{notes}</p>
              </div>
            )}
          </div>

          {/* 4. Tray Setup & Assigned Butler */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-semibold">Tray Setup</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">{traySetup}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-semibold">
                Assigned Butler
              </span>
              <span className="font-bold text-primary text-sm mt-0.5 block truncate">
                {assignedRunner || "Unassigned"}
              </span>
            </div>
          </div>

          {/* 5. In-Room Dining Bill Breakdown */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Food & Beverage Subtotal</span>
              <span className="font-mono text-slate-800">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>In-Room Dining Service Charge (15%)</span>
              <span className="font-mono text-slate-800">${serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Applicable Taxes (8%)</span>
              <span className="font-mono text-slate-800">${tax.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Total In-Room Bill</span>
              <span className="font-bold text-primary text-lg font-mono">
                ${totalAmount.toFixed(2)}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-primary/10 border border-primary/20 text-foreground text-xs">
              <Building2 className="w-4 h-4 text-primary" />
              <span>
                Billing Method:{" "}
                <strong className="capitalize font-bold">{paymentMethod.replace("_", " ")}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-2">
          {/* Advance status action */}
          {status === "kitchen_prep" && (
            <button
              type="button"
              onClick={() => {
                onUpdateStatus(order.id, "tray_ready");
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Mark Tray Packed & Ready
            </button>
          )}

          {status === "tray_ready" && (
            <button
              type="button"
              onClick={() => {
                onUpdateStatus(order.id, "dispatched");
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              Dispatch Tray to Room {roomNumber}
            </button>
          )}

          {status === "dispatched" && (
            <button
              type="button"
              onClick={() => {
                onUpdateStatus(order.id, "delivered");
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm Delivery to Guest
            </button>
          )}

          {status === "delivered" && (
            <button
              type="button"
              onClick={() => {
                onUpdateStatus(order.id, "clearance_needed");
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-xs hover:bg-amber-700 transition-colors cursor-pointer"
            >
              <BellRing className="w-4 h-4" />
              Log Guest Tray Clearance Request
            </button>
          )}

          {status === "clearance_needed" && (
            <button
              type="button"
              onClick={() => {
                onClearTray(order.id);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-700 text-white font-bold text-xs shadow-xs hover:bg-emerald-800 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Mark Tray Cleared & Post Folio
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAddItems}
              className="flex-1 py-2.5 px-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-bold text-xs hover:bg-teal-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Items
            </button>
            <button
              type="button"
              onClick={() => alert(`KOT & Room Guest Folio printed for Room ${roomNumber}`)}
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print KOT
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
      </SheetContent>
    </Sheet>
  );
}
