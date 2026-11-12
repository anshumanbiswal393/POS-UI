import { useState, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Keyboard,
  UtensilsCrossed,
  ChefHat,
  Receipt,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookPage {
  section: string;
  title: string;
  subtitle: string;
  render: () => React.ReactNode;
}

export function PosHelpGuideBook() {
  const [currentSpread, setCurrentSpread] = useState(0);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");
  const [isFlipping, setIsFlipping] = useState(false);
  const [pageFlipKey, setPageFlipKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [, startTransition] = useTransition();

  const pages: BookPage[] = [
    // Page 1: Keyboard Shortcuts Cheat Sheet
    {
      section: "Quick Operations",
      title: "Keyboard Shortcuts Master Guide",
      subtitle: "Operate the entire POS at light-speed without touching the mouse",
      render: () => (
        <div className="space-y-3.5 text-slate-700">
          <p className="text-[12px] leading-relaxed text-slate-600">
            Cashiers and hotel front-desk staff can perform every critical transaction using standardized function keys:
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-2 p-1.5 rounded-md bg-emerald-50/70 border border-emerald-200/60">
              <kbd className="px-2 py-0.5 rounded bg-white shadow-xs border border-emerald-300 font-mono font-bold text-emerald-800 text-[11px]">
                F1
              </kbd>
              <span className="font-medium text-slate-800">Help Guide Book</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-md bg-emerald-50/70 border border-emerald-200/60">
              <kbd className="px-2 py-0.5 rounded bg-white shadow-xs border border-emerald-300 font-mono font-bold text-emerald-800 text-[11px]">
                F2
              </kbd>
              <span className="font-medium text-slate-800">New Order / Billing</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-md bg-emerald-50/70 border border-emerald-200/60">
              <kbd className="px-2 py-0.5 rounded bg-white shadow-xs border border-emerald-300 font-mono font-bold text-emerald-800 text-[11px]">
                F3
              </kbd>
              <span className="font-medium text-slate-800">Search Dishes / Orders</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-md bg-emerald-50/70 border border-emerald-200/60">
              <kbd className="px-2 py-0.5 rounded bg-white shadow-xs border border-emerald-300 font-mono font-bold text-emerald-800 text-[11px]">
                F4
              </kbd>
              <span className="font-medium text-slate-800">Hold Check / Due Bills</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-md bg-emerald-50/70 border border-emerald-200/60">
              <kbd className="px-2 py-0.5 rounded bg-white shadow-xs border border-emerald-300 font-mono font-bold text-emerald-800 text-[11px]">
                F8
              </kbd>
              <span className="font-medium text-slate-800">Send KOT to Kitchen</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-md bg-emerald-50/70 border border-emerald-200/60">
              <kbd className="px-2 py-0.5 rounded bg-white shadow-xs border border-emerald-300 font-mono font-bold text-emerald-800 text-[11px]">
                F9 / F10
              </kbd>
              <span className="font-medium text-slate-800">Pay & Settle Bill</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-md bg-slate-100 border border-slate-200 col-span-2">
              <kbd className="px-2 py-0.5 rounded bg-white shadow-xs border border-slate-300 font-mono font-bold text-slate-800 text-[11px]">
                Esc
              </kbd>
              <span className="font-medium text-slate-700">Dismiss Modal / Cancel Action / Clear Selection</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-teal-50/90 border-l-4 border-teal-600 text-[11px] text-teal-900 leading-snug">
            <span className="font-bold flex items-center gap-1.5 text-teal-950 mb-0.5">
              <Sparkles className="h-3.5 w-3.5 text-teal-600 shrink-0" />
              Pro-Tip for Fast Checkouts:
            </span>
            Press <kbd className="font-mono font-bold bg-white px-1 py-0.2 rounded border text-teal-800">F2</kbd> to open cart $\rightarrow$ enter item code $\rightarrow$ press <kbd className="font-mono font-bold bg-white px-1 py-0.2 rounded border text-teal-800">F8</kbd> for KOT $\rightarrow$ press <kbd className="font-mono font-bold bg-white px-1 py-0.2 rounded border text-teal-800">F9</kbd> to print receipt!
          </div>
        </div>
      ),
    },

    // Page 2: No-Mouse Order Workflow Diagram
    {
      section: "Quick Operations",
      title: "No-Mouse Rapid Order Flow",
      subtitle: "Complete guest orders end-to-end using keyboard only",
      render: () => (
        <div className="space-y-3.5 text-slate-700">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Step-by-Step Keyboard Cycle
            </div>
            <div className="flex flex-col gap-2 text-[11px]">
              <div className="flex items-center gap-2 bg-white p-1.5 rounded border border-slate-200 shadow-2xs">
                <span className="h-5 w-5 rounded-full bg-teal-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                  1
                </span>
                <span className="font-semibold text-slate-800">Press F2</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <span className="text-slate-600">Opens Billing Register & Cart</span>
              </div>
              <div className="flex items-center gap-2 bg-white p-1.5 rounded border border-slate-200 shadow-2xs">
                <span className="h-5 w-5 rounded-full bg-teal-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                  2
                </span>
                <span className="font-semibold text-slate-800">Press F3</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <span className="text-slate-600">Type dish name or item shortcut</span>
              </div>
              <div className="flex items-center gap-2 bg-white p-1.5 rounded border border-slate-200 shadow-2xs">
                <span className="h-5 w-5 rounded-full bg-teal-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                  3
                </span>
                <span className="font-semibold text-slate-800">Press F8</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <span className="text-slate-600">Sends ticket directly to kitchen</span>
              </div>
              <div className="flex items-center gap-2 bg-white p-1.5 rounded border border-slate-200 shadow-2xs">
                <span className="h-5 w-5 rounded-full bg-teal-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                  4
                </span>
                <span className="font-semibold text-slate-800">Press F9</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <span className="text-slate-600">Collects payment & prints tax invoice</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50/90 border-l-4 border-amber-500 text-[11px] text-amber-900 leading-snug">
            <span className="font-bold flex items-center gap-1 text-amber-950 mb-0.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              Notice for Multi-Terminal Outlets:
            </span>
            If a table is modified from another captain terminal, the order updates automatically in real-time.
          </div>
        </div>
      ),
    },

    // Page 3: Table Management & Status Codes
    {
      section: "Tables & Floor Plan",
      title: "Table Status & 30-Min Alerts",
      subtitle: "Real-time table states and automated guest preparation alerts",
      render: () => (
        <div className="space-y-3 text-slate-700">
          <p className="text-[12px] text-slate-600 leading-relaxed">
            Tables reflect real-time live occupancy and never stay reserved prematurely before guest arrival:
          </p>

          <div className="space-y-2 text-[11px]">
            <div className="flex items-start gap-2.5 p-2 rounded-md bg-white border border-slate-200 shadow-2xs">
              <span className="h-3 w-3 rounded-full bg-slate-300 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">⚪ Available (Ready for Guests)</span>
                <p className="text-slate-500 text-[10.5px]">
                  Table is vacant. Tap to start a walk-in order or seat arriving guests.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-md bg-white border border-teal-200 shadow-2xs">
              <span className="h-3 w-3 rounded-full bg-teal-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-teal-800">🟢 Reserved (Target Time Arrived)</span>
                <p className="text-slate-500 text-[10.5px]">
                  Active reservation time is reached. Table is held exclusively for the guest.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-md bg-white border border-amber-200 shadow-2xs">
              <span className="h-3 w-3 rounded-full bg-amber-500 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-amber-800">🟠 On Dine (Occupied & Ordering)</span>
                <p className="text-slate-500 text-[10.5px]">
                  Guests seated with active running KOTs and live bill.
                </p>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-teal-50 border-l-4 border-teal-600 text-[11px] text-teal-900 leading-snug">
            <span className="font-bold flex items-center gap-1.5 text-teal-950 mb-0.5">
              <Clock className="h-3.5 w-3.5 text-teal-600 shrink-0" />
              30-Minute Preparation Notification:
            </span>
            30 minutes prior to reservation time, Retrod notifies staff to clear and prepare the table for the incoming party.
          </div>
        </div>
      ),
    },

    // Page 4: Switching Tables & Reservation Lifecycle
    {
      section: "Tables & Floor Plan",
      title: "Table Switch & Seating Flow",
      subtitle: "Moving tables without losing active orders or kitchen tickets",
      render: () => (
        <div className="space-y-3.5 text-slate-700">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Seating Lifecycle Diagram
            </div>
            <div className="flex items-center justify-between text-[10.5px] font-semibold text-slate-700 gap-1 text-center">
              <div className="p-1.5 rounded bg-white border border-slate-200 flex-1">
                Book Reserved
              </div>
              <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
              <div className="p-1.5 rounded bg-teal-50 border border-teal-200 text-teal-800 flex-1">
                30m Alert
              </div>
              <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
              <div className="p-1.5 rounded bg-amber-50 border border-amber-200 text-amber-800 flex-1">
                Seat Guest
              </div>
              <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
              <div className="p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 flex-1">
                Completed
              </div>
            </div>
          </div>

          <div className="space-y-2 text-[11.5px]">
            <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-teal-700" />
              How to Switch an Occupied Table:
            </h5>
            <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
              <li>Click on the occupied table on the floor plan.</li>
              <li>Select <strong>Switch Table</strong> from the action options.</li>
              <li>Pick any available target table and confirm.</li>
              <li>Running items, kitchen tickets, and bill balance transfer automatically!</li>
            </ul>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900">
            <span className="font-bold flex items-center gap-1 mb-0.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Automatic Status Transition:
            </span>
            When a reserved table is seated for dining, the reservation automatically marks as <strong>Completed</strong>.
          </div>
        </div>
      ),
    },

    // Page 5: Taking Orders & KOT
    {
      section: "Kitchen & Orders",
      title: "Taking Orders & Kitchen KOT",
      subtitle: "Sending order tickets to kitchen display and thermal printers",
      render: () => (
        <div className="space-y-3.5 text-slate-700">
          <p className="text-[12px] text-slate-600 leading-relaxed">
            Every dining item placed sends an electronic Kitchen Order Ticket (KOT) directly to the kitchen display:
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              KOT Dispatch Workflow
            </div>
            <div className="flex items-center justify-between text-[10.5px] font-semibold text-slate-700 gap-1 text-center">
              <div className="p-1.5 rounded bg-white border border-slate-200 flex-1">
                Select Table
              </div>
              <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
              <div className="p-1.5 rounded bg-white border border-slate-200 flex-1">
                Add Dishes
              </div>
              <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
              <div className="p-1.5 rounded bg-teal-50 border border-teal-200 text-teal-800 flex-1 font-bold">
                Press F8
              </div>
              <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
              <div className="p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 flex-1">
                Kitchen Prep
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="font-bold text-slate-800">Special Instructions & Cooking Notes:</div>
            <p className="text-slate-600">
              Type special customer requests (e.g. <em>"Medium spicy"</em> or <em>"No garlic"</em>) directly into the item notes before pressing <kbd className="px-1 py-0.5 rounded bg-slate-100 font-mono font-bold text-[10px]">F8</kbd>.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-teal-50/90 border-l-4 border-teal-600 text-[11px] text-teal-900 leading-snug">
            <span className="font-bold flex items-center gap-1 text-teal-950 mb-0.5">
              <Info className="h-3.5 w-3.5 text-teal-600 shrink-0" />
              Add-On KOTs:
            </span>
            Guests can order additional rounds of drinks or dessert anytime. Pressing <kbd className="font-mono font-bold">F8</kbd> dispatches only the new items as KOT #2, #3, etc.
          </div>
        </div>
      ),
    },

    // Page 6: Live Orders & Kitchen Stages
    {
      section: "Kitchen & Orders",
      title: "Order Stages & Kitchen Pipeline",
      subtitle: "Monitoring ticket lifecycle from placed to served",
      render: () => (
        <div className="space-y-3.5 text-slate-700">
          <div className="space-y-2 text-[11px]">
            <div className="p-2 rounded border border-blue-200 bg-blue-50/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-blue-900">1. Placed (Pending)</span>
                <p className="text-[10px] text-blue-700">Ticket printed at chef station</p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded text-blue-800">
                KOT Received
              </span>
            </div>

            <div className="p-2 rounded border border-amber-200 bg-amber-50/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-900">2. In Preparation</span>
                <p className="text-[10px] text-amber-700">Chef actively cooking dishes</p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded text-amber-800">
                Cooking
              </span>
            </div>

            <div className="p-2 rounded border border-emerald-200 bg-emerald-50/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-emerald-900">3. Food Ready & Served</span>
                <p className="text-[10px] text-emerald-700">Picked up by runner / captain</p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded text-emerald-800">
                Served
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50 border-l-4 border-amber-500 text-[11px] text-amber-900">
            <span className="font-bold flex items-center gap-1 mb-0.5 text-amber-950">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              Void / Cancellation Policy:
            </span>
            Never cancel a dish without checking with the kitchen chef if preparation has already started.
          </div>
        </div>
      ),
    },

    // Page 7: Billing & Multi-Mode Settlement
    {
      section: "Settlement & Cashier",
      title: "Billing & Payment Modes",
      subtitle: "Cash, UPI/QR, Credit Cards, and Hotel Room Folio transfers",
      render: () => (
        <div className="space-y-3.5 text-slate-700">
          <p className="text-[12px] text-slate-600 leading-relaxed">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 font-mono font-bold text-emerald-800 border">F9</kbd> on any active table to open the Settlement modal:
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded bg-white border border-slate-200 shadow-2xs">
              <div className="font-bold text-slate-800">💵 Cash</div>
              <div className="text-[10px] text-slate-500">Auto change calculator</div>
            </div>
            <div className="p-2 rounded bg-white border border-slate-200 shadow-2xs">
              <div className="font-bold text-slate-800">📱 UPI / Dynamic QR</div>
              <div className="text-[10px] text-slate-500">Instant on-screen QR</div>
            </div>
            <div className="p-2 rounded bg-white border border-slate-200 shadow-2xs">
              <div className="font-bold text-slate-800">💳 Card POS Terminal</div>
              <div className="text-[10px] text-slate-500">Swipe / contactless tap</div>
            </div>
            <div className="p-2 rounded bg-white border border-teal-200 bg-teal-50/50 shadow-2xs">
              <div className="font-bold text-teal-900">🏨 Post to Room</div>
              <div className="text-[10px] text-teal-700">Charge to resident folio</div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-teal-50 border-l-4 border-teal-600 text-[11px] text-teal-900">
            <span className="font-bold flex items-center gap-1 mb-0.5 text-teal-950">
              <Receipt className="h-3.5 w-3.5 text-teal-600" />
              Split Billing Feature:
            </span>
            Click <strong>Split Bill</strong> to divide the amount equally or split specific dishes among separate paying guests.
          </div>
        </div>
      ),
    },

    // Page 8: Pending Payments & Due Settlement
    {
      section: "Settlement & Cashier",
      title: "Pending Payments Management",
      subtitle: "Recover open balances and settle deferred customer dues",
      render: () => (
        <div className="space-y-3.5 text-slate-700">
          <p className="text-[12px] text-slate-600 leading-relaxed">
            If a table is cleared before payment receipt, the balance moves directly to <strong>Pending Payments</strong>:
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Pending Recovery Workflow
            </div>
            <div className="flex items-center justify-between text-[10.5px] font-semibold text-slate-700 gap-1 text-center">
              <div className="p-1.5 rounded bg-white border border-slate-200 flex-1">
                Open Dues (F4)
              </div>
              <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
              <div className="p-1.5 rounded bg-white border border-slate-200 flex-1">
                Search Customer
              </div>
              <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
              <div className="p-1.5 rounded bg-teal-50 border border-teal-200 text-teal-800 flex-1">
                Collect Payment
              </div>
              <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
              <div className="p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 flex-1">
                Order History
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-rose-50 border-l-4 border-rose-500 text-[11px] text-rose-900 leading-snug">
            <span className="font-bold flex items-center gap-1 text-rose-950 mb-0.5">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
              Cashier Security Rule:
            </span>
            Never vacate a table without ensuring payment is captured or transferred to an active Room Folio.
          </div>
        </div>
      ),
    },

    // Page 9: Stock Tracking & Ingredients
    {
      section: "Stock & Inventory",
      title: "Real-Time Recipe Consumption",
      subtitle: "Automated ingredient depletion and low stock warnings",
      render: () => (
        <div className="space-y-3.5 text-slate-700">
          <p className="text-[12px] text-slate-600 leading-relaxed">
            Every dish sold triggers real-time recipe stock depletion based on configured raw materials:
          </p>

          <div className="space-y-2 text-[11px]">
            <div className="flex items-start gap-2 p-2 rounded bg-white border border-slate-200 shadow-2xs">
              <span className="font-bold text-teal-700">1. Recipe Mapping:</span>
              <span className="text-slate-600">Dishes link directly to raw ingredients (Paneer, Rice, Oil, Spices).</span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded bg-white border border-slate-200 shadow-2xs">
              <span className="font-bold text-teal-700">2. Auto Deduct:</span>
              <span className="text-slate-600">On KOT dispatch, required ingredient quantities are deducted automatically.</span>
            </div>
            <div className="flex items-start gap-2 p-2 rounded bg-white border border-slate-200 shadow-2xs">
              <span className="font-bold text-teal-700">3. Low Stock Alerts:</span>
              <span className="text-slate-600">Items reaching threshold trigger warnings on the dashboard and stock report.</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-teal-50 border-l-4 border-teal-600 text-[11px] text-teal-900">
            <span className="font-bold flex items-center gap-1 text-teal-950 mb-0.5">
              <Info className="h-3.5 w-3.5 text-teal-600" />
              Wastage Logging:
            </span>
            Record burnt or spilled items under <strong>Stock Usage $\rightarrow$ Wastage</strong> to maintain exact balance sheets.
          </div>
        </div>
      ),
    },

    // Page 10: Day End Summary Closing SOP
    {
      section: "Day End Closing",
      title: "Day End Closing SOP",
      subtitle: "Standard operating procedure to finalize and lock daily business",
      render: () => (
        <div className="space-y-3.5 text-slate-700">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Closing Procedure Sequence
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Verify all tables are settled (No open bills)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Count cashier cash drawer against Cash Report</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Reconcile UPI & EDC machine settlement slips</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Click <strong>Close Day</strong> in Day End Summary</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50 border-l-4 border-emerald-600 text-[11px] text-emerald-900 leading-snug">
            <span className="font-bold flex items-center gap-1 text-emerald-950 mb-0.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Day Rollover Complete:
            </span>
            Closing the day locks all transactions, generates final financial reports, and automatically rolls the calendar to the next operational date.
          </div>
        </div>
      ),
    },
  ];

  const totalPages = pages.length;
  const totalSpreads = Math.ceil(totalPages / 2) + 1; // 0 is cover, 1..5 are pages
  const activeMobilePageIndex = currentSpread === 0 ? 0 : (currentSpread - 1) * 2;
  const activeMobilePage = pages[activeMobilePageIndex] ?? pages[0];
  const secondaryMobilePage =
    currentSpread > 0 && activeMobilePageIndex + 1 < totalPages
      ? pages[activeMobilePageIndex + 1]
      : null;

  const handleNext = () => {
    if (currentSpread >= totalSpreads - 1 || isFlipping) return;
    setIsFlipping(true);
    setFlipDirection("next");
    startTransition(() => {
      setCurrentSpread((prev) => prev + 1);
      setPageFlipKey((k) => k + 1);
    });
    setTimeout(() => setIsFlipping(false), 700);
  };

  const handlePrev = () => {
    if (currentSpread <= 0 || isFlipping) return;
    setIsFlipping(true);
    setFlipDirection("prev");
    startTransition(() => {
      setCurrentSpread((prev) => prev - 1);
      setPageFlipKey((k) => k + 1);
    });
    setTimeout(() => setIsFlipping(false), 700);
  };

  const jumpToSpread = (spreadIndex: number) => {
    if (spreadIndex === currentSpread || isFlipping) return;
    setIsFlipping(true);
    setFlipDirection(spreadIndex > currentSpread ? "next" : "prev");
    startTransition(() => {
      setCurrentSpread(spreadIndex);
      setPageFlipKey((k) => k + 1);
    });
    setTimeout(() => setIsFlipping(false), 700);
  };

  // Spread data helper
  const getLeftPage = (spread: number) => {
    if (spread === 0) return null;
    const pageIndex = (spread - 1) * 2;
    return pageIndex < totalPages ? { ...pages[pageIndex], pageNum: pageIndex + 1 } : null;
  };

  const getRightPage = (spread: number) => {
    if (spread === 0) return { isCover: true };
    const pageIndex = (spread - 1) * 2 + 1;
    return pageIndex < totalPages ? { ...pages[pageIndex], pageNum: pageIndex + 1 } : null;
  };

  const leftPageData = getLeftPage(currentSpread);
  const rightPageData = getRightPage(currentSpread);

  return (
    <div
      className={`flex flex-col w-full ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-slate-900/90 p-3 sm:p-6 backdrop-blur-md overflow-y-auto md:overflow-hidden"
          : "min-h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-3.5rem)] md:overflow-hidden bg-slate-50/50"
      }`}
    >
      {/* Top Header / Chapter Navigator */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 px-3 sm:px-6 py-2.5 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-teal-800 text-white flex items-center justify-center shadow-xs">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-serif text-[18px] sm:text-[20px] font-bold text-slate-900 leading-tight">
              Retrod POS Operating Manual
            </h1>
            <p className="text-[11px] text-slate-500">
              Interactive 3D Handbook for Hoteliers & Cashiers
            </p>
          </div>
        </div>

        {/* Chapter jump pills */}
        <div className="hidden lg:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => jumpToSpread(0)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition cursor-pointer ${
              currentSpread === 0
                ? "bg-teal-800 text-white shadow-2xs font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Cover
          </button>
          <button
            type="button"
            onClick={() => jumpToSpread(1)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition cursor-pointer flex items-center gap-1 ${
              currentSpread === 1
                ? "bg-teal-800 text-white shadow-2xs font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Keyboard className="h-3 w-3" />
            Shortcuts
          </button>
          <button
            type="button"
            onClick={() => jumpToSpread(2)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition cursor-pointer ${
              currentSpread === 2
                ? "bg-teal-800 text-white shadow-2xs font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Tables & Seating
          </button>
          <button
            type="button"
            onClick={() => jumpToSpread(3)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition cursor-pointer ${
              currentSpread === 3
                ? "bg-teal-800 text-white shadow-2xs font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Kitchen KOT
          </button>
          <button
            type="button"
            onClick={() => jumpToSpread(4)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition cursor-pointer ${
              currentSpread === 4
                ? "bg-teal-800 text-white shadow-2xs font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Settlement & Dues
          </button>
          <button
            type="button"
            onClick={() => jumpToSpread(5)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition cursor-pointer ${
              currentSpread === 5
                ? "bg-teal-800 text-white shadow-2xs font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Day End SOP
          </button>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => jumpToSpread(0)}
            className="h-8 text-xs cursor-pointer"
            title="Reset to Cover"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">Cover</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8 text-xs cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Mobile / Small-Tablet Single-Column Reader (<md) */}
      <div className="md:hidden flex-1 overflow-y-auto p-3 space-y-3">
        {/* Horizontal chapter pills for mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { spread: 0, label: "Cover" },
            { spread: 1, label: "Shortcuts" },
            { spread: 2, label: "Tables & Seating" },
            { spread: 3, label: "Kitchen KOT" },
            { spread: 4, label: "Settlement & Dues" },
            { spread: 5, label: "Day End SOP" },
          ].map((ch) => (
            <button
              key={ch.spread}
              type="button"
              onClick={() => jumpToSpread(ch.spread)}
              className={`shrink-0 px-3 py-1.5 text-[11.5px] font-semibold rounded-full transition cursor-pointer ${
                currentSpread === ch.spread
                  ? "bg-teal-800 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600"
              }`}
            >
              {ch.label}
            </button>
          ))}
        </div>

        {currentSpread === 0 ? (
          <div className="rounded-2xl bg-gradient-to-br from-[#064e3b] via-[#0d5e48] to-[#042f2e] text-white p-6 flex flex-col justify-between gap-6 border border-teal-400/20 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-200">
                Retrod Cloud Hospitality
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-teal-100">
                Manual v2.4
              </span>
            </div>
            <div className="space-y-3 text-center">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <BookOpen className="h-7 w-7 text-amber-300" />
              </div>
              <h2 className="font-serif text-xl font-black tracking-tight text-white">
                POS Billing & Operations Handbook
              </h2>
              <p className="text-xs text-teal-100/85 leading-relaxed">
                Your concise desktop & mobile guide to table billing, kitchen tickets, dues collection, and day-end rollover.
              </p>
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="w-full py-2.5 rounded-xl bg-white text-teal-900 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Open Handbook</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {[activeMobilePage, secondaryMobilePage].filter(Boolean).map((pg, idx) =>
              pg ? (
                <div
                  key={pg.title + idx}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                      {pg.section}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Page {activeMobilePageIndex + idx + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-serif text-[16px] font-bold text-slate-900">{pg.title}</h3>
                    <p className="text-[11px] text-slate-500 font-medium">{pg.subtitle}</p>
                  </div>
                  <div>{pg.render()}</div>
                </div>
              ) : null,
            )}
          </div>
        )}
      </div>

      {/* 3D Book Stage (md+) */}
      <div className="hidden md:flex flex-1 min-h-0 items-center justify-center p-3 sm:p-6 overflow-hidden select-none">
        <div
          style={{ perspective: "2500px" }}
          className="relative w-full max-w-4xl max-h-[calc(100vh-170px)] aspect-[1.55/1] flex items-center justify-center"
        >
          {/* Click zones for natural page turn */}
          <div
            className={`absolute left-0 top-0 w-1/2 h-full z-40 ${
              currentSpread > 0 ? "cursor-pointer" : "pointer-events-none"
            }`}
            onClick={handlePrev}
            title={currentSpread > 0 ? "Turn page back" : undefined}
          />
          <div
            className={`absolute right-0 top-0 w-1/2 h-full z-40 ${
              currentSpread < totalSpreads - 1 ? "cursor-pointer" : "pointer-events-none"
            }`}
            onClick={handleNext}
            title={currentSpread < totalSpreads - 1 ? "Turn page forward" : undefined}
          />

          {/* Book container with subtle 3D tilt */}
          <div
            className="relative w-full h-full flex transition-transform duration-700 ease-out"
            style={{
              transformStyle: "preserve-3d",
              transform: currentSpread === 0 ? "translateX(-25%)" : "translateX(0%)",
            }}
          >
            {/* LEFT PAGE (Visible when book is open) */}
            <div
              className={`absolute left-0 top-0 w-1/2 h-full z-10 transition-opacity duration-500 ${
                currentSpread > 0 ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              style={{ transform: "translateZ(0px)" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#fafafa] via-[#ffffff] to-[#f0f0f0] rounded-l-2xl border-y border-l border-slate-300 p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-xl">
                {/* Book inner spine shadow */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-black/10 pointer-events-none" />

                {leftPageData ? (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                        {leftPageData.section}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Section {leftPageData.pageNum}
                      </span>
                    </div>

                    <div className="flex-1 py-3 overflow-y-auto pr-1">
                      <h3 className="font-serif text-[15px] sm:text-[17px] font-bold text-slate-900 mb-1">
                        {leftPageData.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mb-3 font-medium">
                        {leftPageData.subtitle}
                      </p>
                      {leftPageData.render()}
                    </div>

                    <div className="text-center text-[10px] font-mono text-slate-400 border-t border-slate-200 pt-2">
                      Page {leftPageData.pageNum}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 italic text-xs">
                    Beginning of guide.
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT PAGE */}
            <div
              className="absolute right-0 top-0 w-1/2 h-full z-10"
              style={{ transform: "translateZ(0px)" }}
            >
              {currentSpread === 0 ? (
                // Hardcover Front
                <div className="absolute inset-0 bg-gradient-to-br from-[#0c6b4e] via-[#0f766e] to-[#0f172a] rounded-r-2xl border-y border-r border-teal-500/30 p-8 flex flex-col justify-between shadow-2xl overflow-hidden">
                  <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />
                  <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-white font-mono text-[9px] uppercase tracking-widest font-semibold border border-white/20">
                      Standard Operating Procedures
                    </span>
                  </div>

                  <div className="my-auto space-y-3">
                    <div className="h-12 w-12 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
                      <BookOpen className="h-6 w-6 text-emerald-200" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight uppercase font-serif">
                      Retrod POS Staff Handbook
                    </h2>
                    <p className="text-[12px] sm:text-[13px] text-teal-100/90 font-medium leading-relaxed max-w-sm">
                      Master quick keyboard checkout, dynamic seating, table switches, KOT lifecycle, and day end settlement.
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/15 pt-4 text-[10.5px] uppercase font-bold tracking-wider text-teal-200">
                    <span>Press F1 Anytime for Guide</span>
                    <span className="text-white animate-pulse flex items-center gap-1 cursor-pointer">
                      Click to Open <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              ) : (
                // Normal Right Page
                <div className="absolute inset-0 bg-gradient-to-l from-[#fafafa] via-[#ffffff] to-[#f0f0f0] rounded-r-2xl border-y border-r border-slate-300 p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-xl">
                  {/* Book inner spine shadow */}
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-l from-transparent to-black/10 pointer-events-none" />

                  {rightPageData && !rightPageData.isCover ? (
                    <>
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                          {rightPageData.section}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Section {rightPageData.pageNum}
                        </span>
                      </div>

                      <div className="flex-1 py-3 overflow-y-auto pr-1">
                        <h3 className="font-serif text-[15px] sm:text-[17px] font-bold text-slate-900 mb-1">
                          {rightPageData.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 mb-3 font-medium">
                          {rightPageData.subtitle}
                        </p>
                        {rightPageData.render()}
                      </div>

                      <div className="text-center text-[10px] font-mono text-slate-400 border-t border-slate-200 pt-2">
                        Page {rightPageData.pageNum}
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 italic text-xs">
                      End of handbook.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CENTER SPINE CREASE DETAIL */}
            <div
              className={`absolute top-0 bottom-0 w-[14px] bg-gradient-to-r from-black/25 via-transparent to-black/25 pointer-events-none z-30 left-1/2 -ml-[7px] transition-opacity duration-700 ${
                currentSpread > 0 ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Bottom Spread Navigation Footer */}
      <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-2 bg-white border-t border-slate-200">
        <Button
          size="sm"
          variant="outline"
          disabled={currentSpread <= 0}
          onClick={handlePrev}
          className="h-8 px-3 text-xs gap-1 cursor-pointer disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Previous Page
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500">
            {currentSpread === 0 ? (
              <span className="font-semibold text-teal-800">Book Cover</span>
            ) : (
              <span>
                Spread <strong className="text-slate-800">{currentSpread}</strong> of {totalSpreads - 1} (Pages{" "}
                <strong className="text-slate-800">{(currentSpread - 1) * 2 + 1} - {(currentSpread - 1) * 2 + 2}</strong>)
              </span>
            )}
          </span>
        </div>

        <Button
          size="sm"
          variant="outline"
          disabled={currentSpread >= totalSpreads - 1}
          onClick={handleNext}
          className="h-8 px-3 text-xs gap-1 cursor-pointer disabled:opacity-40"
        >
          Next Page
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
