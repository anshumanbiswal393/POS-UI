import { createFileRoute } from "@tanstack/react-router";
import { PosBillingManager } from "@/components/shared/pos/billing/PosBillingManager";

type BillingSearch = {
  orderType?: string;
  table?: string;
  room?: string;
  guests?: number | string;
  pax?: number | string;
  guestName?: string;
  guestPhone?: string;
  waiterName?: string;
  note?: string;
  orderNumber?: string;
  editOrder?: string;
  settle?: string;
};

export const Route = createFileRoute("/pos/billing")({
  validateSearch: (search: Record<string, unknown>): BillingSearch => ({
    orderType: typeof search.orderType === "string" ? search.orderType : undefined,
    table: typeof search.table === "string" ? search.table : undefined,
    room: typeof search.room === "string" ? search.room : undefined,
    guests: search.guests as number | string | undefined,
    pax: search.pax as number | string | undefined,
    guestName: typeof search.guestName === "string" ? search.guestName : undefined,
    guestPhone: typeof search.guestPhone === "string" ? search.guestPhone : undefined,
    waiterName: typeof search.waiterName === "string" ? search.waiterName : undefined,
    note: typeof search.note === "string" ? search.note : undefined,
    orderNumber: typeof search.orderNumber === "string" ? search.orderNumber : undefined,
    editOrder: typeof search.editOrder === "string" ? search.editOrder : undefined,
    settle: typeof search.settle === "string" ? search.settle : undefined,
  }),
  head: () => ({ meta: [{ title: "Fast Touch Billing — Retrod POS" }] }),
  component: PosBillingManager,
});
