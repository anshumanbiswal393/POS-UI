import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BedDouble, Receipt, UtensilsCrossed } from "lucide-react";
import type { HotelRoom, RoomFolioOrder } from "@/types/posRoomService";

type RoomFolioOrderSlideProps = {
  isOpen: boolean;
  onClose: () => void;
  room: HotelRoom | null;
};

function formatMoney(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function OrderBlock({ order }: { order: RoomFolioOrder }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[13px] font-black text-text-primary">{order.orderNumber}</p>
          <p className="text-[11px] text-text-secondary">{order.createdAt || "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-[14px] font-black text-primary">{formatMoney(order.totalAmount)}</p>
          <p className="text-[10.5px] font-semibold text-teal-800">
            {order.paymentMode || "Add to Room Folio"}
          </p>
        </div>
      </div>
      {order.items?.length ? (
        <ul className="space-y-1 border-t border-border pt-2">
          {order.items.map((item, idx) => (
            <li
              key={`${order.id}-${item.name}-${idx}`}
              className="flex items-center justify-between gap-2 text-[12px]"
            >
              <span className="min-w-0 truncate text-text-primary">
                {item.name}
                <span className="text-text-secondary"> × {item.quantity}</span>
              </span>
              <span className="font-mono font-semibold text-text-primary">
                {formatMoney(item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-text-secondary">{order.itemsSummary || "No item detail"}</p>
      )}
    </div>
  );
}

export function RoomFolioOrderSlide({ isOpen, onClose, room }: RoomFolioOrderSlideProps) {
  const orders = room?.folioOrders || [];
  const total = room?.posChargeTotal ?? orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-[16px]">
            <BedDouble className="h-4.5 w-4.5 text-primary" />
            Room {room?.roomNumber || "—"}
          </SheetTitle>
          <SheetDescription>
            {room?.guest?.name ? `${room.guest.name} · ` : ""}
            Folio orders already posted. View only.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 px-3 py-2.5">
            <div className="flex items-center gap-2 text-teal-900">
              <Receipt className="h-4 w-4" />
              <span className="text-[12px] font-bold">Posted to folio</span>
            </div>
            <span className="text-[15px] font-black text-teal-900">{formatMoney(total)}</span>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-text-secondary">
              <UtensilsCrossed className="mx-auto mb-2 h-5 w-5 opacity-50" />
              <p className="text-[12.5px] font-semibold">No F&amp;B orders on this room yet</p>
            </div>
          ) : (
            orders.map((order) => <OrderBlock key={order.id} order={order} />)
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
