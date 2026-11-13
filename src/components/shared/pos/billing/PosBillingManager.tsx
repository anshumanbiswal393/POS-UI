import { useState, useEffect, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  BillingMenuItem,
  BillingCartItem,
  BillingOrderType,
  BillingItemVariant,
  BillingSelectedModifier,
  BillingPaymentMethod,
  CustomerProfile,
  HeldBill,
  BillSettlementRecord,
} from "@/types/posBilling";
import { BillingHeader } from "./BillingHeader";
import { BillingMenuCatalog } from "./BillingMenuCatalog";
import { BillingCartRegister, type RunningOrderSummary } from "./BillingCartRegister";
import { BillingTablesOrdersSidebar } from "./BillingTablesOrdersSidebar";
import type { RestaurantTable, ReservationItem } from "@/types/posTables";
import { BillingModifierModal } from "./BillingModifierModal";
import { BillingReceiptModal } from "./BillingReceiptModal";
import { BillingHeldDrawer } from "./BillingHeldDrawer";
import { BillingTableModal } from "./BillingTableModal";
import { BillingPayNowModal } from "./BillingPayNowModal";
import { BillingPreviousOrdersModal } from "./BillingPreviousOrdersModal";
import { useBillingMenuItems } from "@/hooks/queries/usePosMenu";
import { useOutletContext } from "@/context/PosOutletContext";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentOrderByNumber, type CurrentOrderRecord } from "@/services/posOrdersService";
import { useCurrentOrdersTimeline } from "@/hooks/queries/usePosOrders";
import { calculateEffectivePrice } from "@/utils/commissionUtils";
import { cn } from "@/lib/utils";
import {
  liveCreateOrder,
  livePatchOrder,
  liveSettleOrder,
  liveGetOrder,
  liveCancelOrder,
} from "@/services/posOrderLive";
import { getPosTaxSettings } from "@/lib/posTaxSettings";
import { useHotelRooms } from "@/hooks/queries/usePosRoomService";
import { usePosTables, usePosReservations, POS_RESERVATIONS_QUERY_KEY } from "@/hooks/queries/usePosTables";
import { posTablesService } from "@/services/posTablesService";
import { savePosCustomer } from "@/services/posCustomerStore";
import { isBackendOutletId } from "@/utils/outletId";
import { printPosInvoice, settlementRecordToInvoicePayload } from "@/utils/printReceipt";
import { POS_ROOM_SERVICE_ROOMS_KEY } from "@/hooks/queries/usePosRoomService";
import { posMenuService } from "@/services/posMenuService";

const heldBillsKey = (outletId?: string) => `retrod:pos:held-bills:${outletId || "local"}`;

function cloneHeldCart(items: BillingCartItem[]): BillingCartItem[] {
  try {
    return JSON.parse(JSON.stringify(items)) as BillingCartItem[];
  } catch {
    return items.map((item) => ({ ...item, selectedModifiers: [...item.selectedModifiers] }));
  }
}

function currentOrderToHeldBill(ord: CurrentOrderRecord): HeldBill {
  const rawCart = ord.heldCart as BillingCartItem[] | undefined;
  const items =
    Array.isArray(rawCart) && rawCart.length > 0 && rawCart[0]?.item
      ? rawCart
      : (ord.items || []).map((line) => ({
          cartId: `resume-${ord.id}-${line.id}`,
          item: {
            id: String(line.id),
            code: line.code || "",
            name: line.name,
            category: (line.category || "All Items") as BillingMenuItem["category"],
            diet: (line.diet || "veg") as BillingMenuItem["diet"],
            price: line.price,
            inStock: true,
            prepTimeMinutes: 0,
          },
          quantity: line.quantity,
          selectedVariant: line.selectedVariantName
            ? { id: line.selectedVariantName, name: line.selectedVariantName, price: line.price }
            : undefined,
          selectedModifiers: [],
          specialInstructions: line.notes,
          addedAt: "",
        }));
  const roomLabel = ord.roomNumber || (ord.type === "room_service" ? ord.tableOrRoom : undefined);
  return {
    id: ord.id,
    linkedOrderId: ord.id,
    billNumber: ord.orderNumber,
    orderType:
      ord.type === "room_service"
        ? "room_service"
        : ord.type === "takeaway" || ord.type === "pickup"
          ? "takeaway"
          : "dine_in",
    tableNumber: ord.type === "room_service" ? undefined : ord.tableOrRoom,
    tableId: ord.tableId,
    roomNumber: roomLabel,
    roomUnitId: ord.roomUnitId,
    reservationId: ord.reservationId,
    folioId: ord.folioId,
    guestCount: ord.pax || 1,
    items,
    heldAt: "Saved",
    subtotal: ord.subtotal || 0,
    tax: Math.max(0, ord.amount - (ord.subtotal || 0)),
    grandTotal: ord.amount,
    captainName: ord.waiterName || "Captain",
    customerName: ord.customerName,
    customerPhone: ord.customerPhone,
    notes: ord.orderNote,
  };
}

export function PosBillingManager() {
  const queryClient = useQueryClient();
  const { activeOutlet } = useOutletContext();
  const { user, can } = useAuth();
  const isMaster =
    Boolean(user?.is_superuser) ||
    ["super_admin", "owner", "tenant_owner", "general_manager", "pos_admin"].includes(
      String(user?.role || "").toLowerCase()
    );
  const canVoid = isMaster || can("pos.orders.void");
  const { data: menuList = [] } = useBillingMenuItems(activeOutlet?.id);
  const { data: hotelRooms = [] } = useHotelRooms();
  const { data: restaurantTables = [] } = usePosTables();
  const { data: reservations = [] } = usePosReservations();
  const { data: currentTimeline = [] } = useCurrentOrdersTimeline();

  const occupiedRooms = useMemo(
    () =>
      (Array.isArray(hotelRooms) ? hotelRooms : [])
        .filter((room) => room && room.isOccupied)
        .map((room) => ({
          roomNumber: room.roomNumber,
          guestName: room.guest?.name,
          guestPhone: room.guest?.phoneExtension,
          pax: room.guest?.pax ?? 0,
          roomUnitId: room.roomUnitId,
          reservationId: room.reservationId,
          folioId: room.folioId,
        })),
    [hotelRooms],
  );

  const selectableTables = useMemo(
    () =>
      (Array.isArray(restaurantTables) ? restaurantTables : []).filter(
        (t) => t && (t.status === "vacant" || t.status === "reserved"),
      ),
    [restaurantTables],
  );

  const resolveTableMatch = useCallback(
    (label: string) => {
      if (!label) return undefined;
      const primary = label.includes("+") ? label.split("+")[0].trim() : label.trim();
      const numOnly = primary.replace(/\D/g, "");
      return restaurantTables.find(
        (t) =>
          t.tableNumber === label ||
          t.tableNumber === primary ||
          (t.tableNumber && primary && t.tableNumber.toLowerCase() === primary.toLowerCase()) ||
          `Table #${t.tableNumberRaw}` === label ||
          `Table #${t.tableNumberRaw}` === primary ||
          `T${String(t.tableNumberRaw || "").padStart(2, "0")}` === primary ||
          `T${t.tableNumberRaw}` === primary ||
          `T-${t.tableNumberRaw}` === label ||
          `T-${t.tableNumberRaw}` === primary ||
          String(t.tableNumberRaw) === label ||
          String(t.tableNumberRaw) === primary ||
          (numOnly && String(t.tableNumberRaw) === numOnly) ||
          (numOnly && t.tableNumber && t.tableNumber.replace(/\D/g, "") === numOnly),
      );
    },
    [restaurantTables],
  );

  const findCustomerForTable = useCallback(
    (tblLabel: string, tblId?: string): CustomerProfile | null => {
      if (!tblLabel && !tblId) return null;
      const matchedTable = tblId
        ? restaurantTables.find((t) => t.id === tblId) || resolveTableMatch(tblLabel)
        : resolveTableMatch(tblLabel);

      // 1. If table has activeReservation with customer details
      if (matchedTable?.activeReservation?.customerName) {
        return {
          id: `res-${matchedTable.id}`,
          name: matchedTable.activeReservation.customerName,
          phone: matchedTable.activeReservation.customerPhone || "",
          tier: matchedTable.activeReservation.isVip ? "Gold" : "Silver",
          loyaltyPoints: 0,
          visitCount: 1,
          lastVisit: "Today",
        };
      }

      // 2. If table has activeOrder with guest details
      if (matchedTable?.activeOrder?.guestName) {
        return {
          id: `order-guest-${matchedTable.id}`,
          name: matchedTable.activeOrder.guestName,
          phone: matchedTable.activeOrder.guestPhone || "",
          tier: "Silver",
          loyaltyPoints: 0,
          visitCount: 1,
          lastVisit: "Today",
        };
      }

      // 3. Search reservations list for this table
      const numOnly = (tblLabel || "").replace(/\D/g, "");
      const resMatch = reservations.find((r) => {
        if (tblId && r.tableId === tblId) return true;
        if (matchedTable?.id && r.tableId === matchedTable.id) return true;
        if (r.tableNumber && tblLabel && r.tableNumber.toLowerCase() === tblLabel.toLowerCase()) return true;
        if (matchedTable?.tableNumber && r.tableNumber === matchedTable.tableNumber) return true;
        const resNum = (r.tableNumber || "").replace(/\D/g, "");
        if (numOnly && resNum && numOnly === resNum) return true;
        return false;
      });

      if (resMatch?.customerName) {
        return {
          id: `res-${resMatch.id}`,
          name: resMatch.customerName,
          phone: resMatch.customerPhone || "",
          tier: resMatch.isVip ? "Gold" : "Silver",
          loyaltyPoints: 0,
          visitCount: 1,
          lastVisit: "Today",
        };
      }

      // 4. Search activeTimeline for this table
      const orderMatch = (currentTimeline || []).find((ord) => {
        if (tblId && ord.tableId === tblId) return true;
        if (ord.tableOrRoom && tblLabel && ord.tableOrRoom.toLowerCase() === tblLabel.toLowerCase()) return true;
        const ordNum = (ord.tableOrRoom || "").replace(/\D/g, "");
        if (numOnly && ordNum && numOnly === ordNum) return true;
        return false;
      });

      if (orderMatch?.customerName) {
        return {
          id: `timeline-${orderMatch.id}`,
          name: orderMatch.customerName,
          phone: orderMatch.customerPhone || "",
          tier: "Silver",
          loyaltyPoints: 0,
          visitCount: 1,
          lastVisit: "Today",
        };
      }

      return null;
    },
    [restaurantTables, resolveTableMatch, reservations, currentTimeline],
  );

  // 1. Order & Header State — blank until user picks table/pax for a new outlet
  const [orderType, setOrderType] = useState<BillingOrderType>("dine_in");
  const [activeTable, setActiveTable] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [guestCount, setGuestCount] = useState(0);
  const [billNumber, setBillNumber] = useState("NEW");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobilePane, setMobilePane] = useState<"menu" | "cart" | "tables">("menu");
  const [isTablesPanelCollapsed, setIsTablesPanelCollapsed] = useState(false);
  const [discountType, setDiscountType] = useState<"percent" | "flat">("percent");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxType, setTaxType] = useState<"percent" | "flat">("percent");
  const [taxValue, setTaxValue] = useState<number>(5);
  const [specialNote, setSpecialNote] = useState("");
  const [waiterFromUrl, setWaiterFromUrl] = useState("");
  const [billingTableId, setBillingTableId] = useState("");
  const [roomUnitId, setRoomUnitId] = useState("");
  const [reservationId, setReservationId] = useState("");
  const [activeTableReservationId, setActiveTableReservationId] = useState("");
  const [folioId, setFolioId] = useState("");
  const [linkedOrderId, setLinkedOrderId] = useState<string | null>(null);

  // 3. Customer Loyalty State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);

  const handleSelectCustomer = useCallback(
    (cust: CustomerProfile | null) => {
      setSelectedCustomer(cust);
      if (cust?.name) {
        try {
          savePosCustomer(
            {
              name: cust.name,
              phone: cust.phone || "",
              tier: cust.tier as any,
            },
            activeOutlet?.id,
          );
        } catch {
          // ignore
        }
      }
    },
    [activeOutlet?.id],
  );
  const captainName = user?.name?.trim() || waiterFromUrl.trim() || "Steward";
  const isBackendOutlet = isBackendOutletId(activeOutlet?.id);
  const [isPayNowOpen, setIsPayNowOpen] = useState(false);
  const [runningOrderMeta, setRunningOrderMeta] = useState<RunningOrderSummary | null>(null);
  const [isPreviousOrdersOpen, setIsPreviousOrdersOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<"hold" | "kot" | "pay" | "folio" | null>(null);
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [isHeldDrawerOpen, setIsHeldDrawerOpen] = useState(false);
  const [heldHydrated, setHeldHydrated] = useState(false);

  // Reset cart when switching to a real DB outlet (new HO/Kitchen starts empty)
  useEffect(() => {
    if (!isBackendOutlet) return;
    setActiveTable("");
    setGuestCount(0);
    setSpecialNote("");
  }, [activeOutlet?.id, isBackendOutlet]);

  useEffect(() => {
    if (isBackendOutlet) {
      setHeldBills(
        (Array.isArray(currentTimeline) ? currentTimeline : [])
          .filter((ord) => ord && ord.held)
          .map(currentOrderToHeldBill),
      );
      setHeldHydrated(true);
      return;
    }
    setHeldHydrated(false);
    try {
      const raw = localStorage.getItem(heldBillsKey(activeOutlet?.id));
      setHeldBills(raw ? (JSON.parse(raw) as HeldBill[]) : []);
    } catch {
      setHeldBills([]);
    }
    setHeldHydrated(true);
  }, [activeOutlet?.id, isBackendOutlet, currentTimeline]);

  useEffect(() => {
    if (!heldHydrated || isBackendOutlet) return;
    try {
      localStorage.setItem(heldBillsKey(activeOutlet?.id), JSON.stringify(heldBills));
    } catch {
      /* ignore quota */
    }
  }, [heldBills, heldHydrated, activeOutlet?.id, isBackendOutlet]);

  // Legacy mock outlets only: auto-pick first vacant/reserved table
  useEffect(() => {
    if (isBackendOutlet) return;
    if (selectableTables.length === 0) return;
    const match = resolveTableMatch(activeTable);
    if (match) {
      if (activeTable !== match.tableNumber) {
        setActiveTable(match.tableNumber);
      }
      return;
    }
    const first = selectableTables[0];
    setActiveTable(first.tableNumber);
    setGuestCount(first.activeReservation?.guests || first.capacity || 4);
  }, [selectableTables, activeTable, resolveTableMatch, isBackendOutlet]);

  // When an occupied room is already set (e.g. from Take Order URL), fill pax / folio
  useEffect(() => {
    if (orderType !== "room_service" || !roomNumber || occupiedRooms.length === 0) return;
    const match = occupiedRooms.find((r) => `Room ${r.roomNumber}` === roomNumber);
    if (!match) return;
    if (guestCount === 0 && (match.pax ?? 0) > 0) {
      setGuestCount(match.pax ?? 0);
    }
    if (!folioId && match.folioId) setFolioId(match.folioId);
    if (!reservationId && match.reservationId) setReservationId(match.reservationId);
    if (!roomUnitId && match.roomUnitId) setRoomUnitId(match.roomUnitId);
  }, [orderType, roomNumber, occupiedRooms, guestCount, folioId, reservationId, roomUnitId]);

  // When a table is active/selected for dine-in, auto-fetch guest details from reservation if not selected
  useEffect(() => {
    if (orderType !== "dine_in" || !activeTable || selectedCustomer) return;
    const autoCust = findCustomerForTable(activeTable, billingTableId);
    if (autoCust) {
      handleSelectCustomer(autoCust);
    }
  }, [orderType, activeTable, billingTableId, selectedCustomer, findCustomerForTable, handleSelectCustomer]);

  const handleOrderTypeChange = useCallback(
    (type: BillingOrderType) => {
      setOrderType(type);
      if (type === "room_service") {
        setRoomNumber("");
        setGuestCount(0);
        setSelectedCustomer(null);
      }
    },
    [],
  );

  // Map dynamic menu items from Food Menu service
  // Real-time synchronization: disabled/inactive items and deleted items are NOT shown; newly added active items are shown!
  const billingItems: BillingMenuItem[] = useMemo(() => {
    const list = Array.isArray(menuList) ? menuList : [];
    if (list.length === 0) {
      return [];
    }

    return list
      .filter((item) => item && item.status === "Active" && item.baseMenu !== false)
      .map((item) => {
        const primaryImg =
          item.images?.find((img) => img?.isPrimary)?.url || item.images?.[0]?.url;
        const catLower = String(item.category || "").toLowerCase();
        const diet: "veg" | "non_veg" | "egg" | "drinks" =
          item.itemType === "Veg"
            ? "veg"
            : item.itemType === "Egg"
              ? "egg"
              : catLower.includes("bev") ||
                catLower.includes("cocktail") ||
                catLower.includes("vodka") ||
                catLower.includes("whisky")
                ? "drinks"
                : "non_veg";

        // Use effective price (with commission markup already applied by useBillingMenuItems)
        // If originalPrice exists on item, item.price is already the final effective selling price.
        // Otherwise calculate from base price to ensure commission is never added twice.
        const basePrice = (item as any).originalPrice ?? item.price;
        const effectivePrice =
          (item as any).originalPrice !== undefined
            ? item.price
            : calculateEffectivePrice(basePrice, item.commissionType, item.commissionValue);

        // Apply same commission markup to variants if defined
        const effectiveVariants = item.variants?.map((v: any) => {
          const vBasePrice = v.originalPrice ?? v.price;
          return {
            ...v,
            price:
              v.originalPrice !== undefined
                ? v.price
                : calculateEffectivePrice(vBasePrice, item.commissionType, item.commissionValue),
          };
        });

        return {
          id: item.id,
          code: item.code.startsWith("#") ? item.code : `#${item.code}`,
          name: item.name,
          category: item.category as any,
          diet,
          price: effectivePrice,
          originalPrice: basePrice,
          commissionType: item.commissionType,
          commissionValue: item.commissionValue,
          inStock: item.plates !== undefined ? item.plates > 0 : true,
          plates: item.plates,
          prepTimeMinutes: 15,
          imageUrl: primaryImg,
          description: item.description,
          variants: effectiveVariants && effectiveVariants.length > 0 ? (effectiveVariants as any) : undefined,
          modifierGroups: item.modifierGroups,
        };
      });
  }, [menuList]);

  // Read URL Query parameters on mount (Take Order redirect OR Edit from Current Orders)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const qOrderType = params.get("orderType") as BillingOrderType | null;
    const qTable = params.get("table");
    const qRoom = params.get("room");
    const qGuests = params.get("guests") || params.get("pax");
    const qGuestName = params.get("guestName");
    const qGuestPhone = params.get("guestPhone");
    const qNote = params.get("note");
    const qOrderNumber = params.get("orderNumber");
    const qOrderId = params.get("orderId");
    const qEditOrder = params.get("editOrder");
    const qExtraOrder = params.get("extraOrder") === "1" || params.get("extraOrder") === "true";
    const qWaiter = params.get("waiterName");
    const qTableId = params.get("tableId");
    const qRoomUnitId = params.get("roomUnitId");
    const qReservationId = params.get("reservationId");
    const qFolioId = params.get("folioId");
    if (qWaiter) setWaiterFromUrl(decodeURIComponent(qWaiter));
    if (qTableId) setBillingTableId(qTableId);
    if (qRoomUnitId) setRoomUnitId(qRoomUnitId);
    if (qReservationId) setReservationId(qReservationId);
    if (qFolioId) setFolioId(qFolioId);

    if (qOrderType) {
      setOrderType(qOrderType);
    }
    if (qTable) {
      setActiveTable(qTable);
    }
    if (qNote?.trim()) {
      setSpecialNote(decodeURIComponent(qNote.trim()));
    }
    if (qRoom) {
      const formatted = qRoom.toLowerCase().startsWith("room") ? qRoom : `Room ${qRoom}`;
      setRoomNumber(formatted);
      if (qOrderType === "room_service" || !qOrderType) {
        setOrderType("room_service");
        if (!qGuests) setGuestCount(0);
      }
    }
    if (qGuests) {
      const parsed = parseInt(qGuests, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        setGuestCount(parsed);
      }
    }
    if (qGuestName) {
      const phoneRaw = qGuestPhone?.trim() ? decodeURIComponent(qGuestPhone.trim()) : "";
      handleSelectCustomer({
        id: `guest-${Date.now()}`,
        name: decodeURIComponent(qGuestName),
        phone: phoneRaw,
        tier: "Silver",
        loyaltyPoints: 0,
        visitCount: 1,
        lastVisit: "Today",
      });
    } else if (qTable || qTableId) {
      const autoCust = findCustomerForTable(qTable || "", qTableId || undefined);
      if (autoCust) {
        handleSelectCustomer(autoCust);
      }
    }

    // Extra Order for an occupied table / seated guest:
    // Link table, guest, open order, but keep active cart BLANK for adding extra items.
    if ((qOrderId || qOrderNumber) && qExtraOrder) {
      if (qOrderId && !qOrderId.startsWith("ord-")) {
        liveGetOrder(qOrderId)
          .then((open) => {
            if (!open) {
              toast.error("Open order not found");
              return;
            }
            setLinkedOrderId(open.id);
            setLinkedOrderNumber(open.orderNumber);
            setBillNumber(open.orderNumber);
            setKotSentForCart(false);
            if (open.tableId) setBillingTableId(open.tableId);
            if (open.tableOrRoom) {
              const tbl = open.tableOrRoom.startsWith("Table")
                ? open.tableOrRoom
                : `Table ${open.tableOrRoom}`;
              setActiveTable(tbl);
            }
            if (open.pax) setGuestCount(open.pax);
            if (open.orderNote) setSpecialNote(open.orderNote);
            if (open.customerName) {
              setSelectedCustomer({
                id: `guest-${open.orderNumber}`,
                name: open.customerName,
                phone: open.customerPhone && open.customerPhone !== "--" ? open.customerPhone : "",
                tier: "Silver",
                loyaltyPoints: 0,
                visitCount: 1,
                lastVisit: "Today",
              });
            }
            setCartItems([]); // BLANK CHECK!
            setRunningOrderMeta({
              id: open.id,
              orderNumber: open.orderNumber,
              tableNumber: open.tableOrRoom || qTable || "",
              guestName: open.customerName || "Guest",
              itemsCount: (open.items || []).length,
              amount: open.grandTotal || open.amount || 0,
              items: (open.items || []).map((line) => ({
                name: line.name,
                quantity: line.quantity,
                price: line.price,
                variant: line.selectedVariantName,
              })),
            });
            toast.info(`Table ${open.tableOrRoom || qTable || ""} · Blank check ready for extra items.`);
          })
          .catch((err) => {
            console.warn("Could not fetch open order for extra order:", err);
          });
        return;
      }
    }

    // Edit existing Current Order → hydrate cart + link check
    if ((qOrderId || qOrderNumber) && qEditOrder) {
      if (qOrderId && !qOrderId.startsWith("ord-")) {
        liveGetOrder(qOrderId)
          .then((open) => {
            if (!open) {
              toast.error("Open order not found");
              return;
            }
            setLinkedOrderId(open.id);
            setLinkedOrderNumber(open.orderNumber);
            setBillNumber(open.orderNumber);
            setKotSentForCart(true);
            if (open.tableId) setBillingTableId(open.tableId);
            if (open.tableOrRoom) {
              const tbl = open.tableOrRoom.startsWith("Table")
                ? open.tableOrRoom
                : `Table ${open.tableOrRoom}`;
              setActiveTable(tbl);
            }
            if (open.pax) setGuestCount(open.pax);
            if (open.orderNote) setSpecialNote(open.orderNote);
            if (open.customerName) {
              setSelectedCustomer({
                id: `guest-${open.orderNumber}`,
                name: open.customerName,
                phone: open.customerPhone && open.customerPhone !== "--" ? open.customerPhone : "",
                tier: "Silver",
                loyaltyPoints: 0,
                visitCount: 1,
                lastVisit: "Today",
              });
            }
            setCartItems(
              (open.items || []).map((line, idx) => ({
                cartId: `edit-${open.orderNumber}-${idx}`,
                item: {
                  id: (line as any).menuItemId || line.id,
                  code: line.code || `#${line.id}`,
                  name: line.name,
                  category: (line.category as BillingMenuItem["category"]) || "All Items",
                  diet: line.diet || "veg",
                  price: line.price,
                  inStock: true,
                  prepTimeMinutes: 15,
                },
                quantity: line.quantity,
                selectedVariant: line.selectedVariantName
                  ? { id: `var-${line.id}`, name: line.selectedVariantName, price: line.price }
                  : undefined,
                selectedModifiers: [],
                specialInstructions: line.notes,
                addedAt: open.startTime,
              })),
            );
            toast.success(`Editing ${open.orderNumber}`);
          })
          .catch((err) => {
            console.warn("Could not fetch open order for editing:", err);
          });
        return;
      }
      const open = getCurrentOrderByNumber(decodeURIComponent(qOrderNumber || ""));
      if (open) {
        setLinkedOrderNumber(open.orderNumber);
        setBillNumber(open.orderNumber);
        setKotSentForCart(true);
        if (open.tableOrRoom) {
          const tbl = open.tableOrRoom.startsWith("Table")
            ? open.tableOrRoom
            : `Table ${open.tableOrRoom}`;
          setActiveTable(tbl);
        }
        if (open.pax) setGuestCount(open.pax);
        if (open.orderNote) setSpecialNote(open.orderNote);
        if (open.customerName) {
          setSelectedCustomer({
            id: `guest-${open.orderNumber}`,
            name: open.customerName,
            phone: open.customerPhone && open.customerPhone !== "--" ? open.customerPhone : "+91 98765 00000",
            tier: "Silver",
            loyaltyPoints: 0,
            visitCount: 1,
            lastVisit: "Today",
          });
        }
        setCartItems(
          open.items.map((line, idx) => ({
            cartId: `edit-${open.orderNumber}-${idx}`,
            item: {
              id: (line as any).menuItemId || line.id,
              code: line.code || `#${line.id}`,
              name: line.name,
              category: (line.category as BillingMenuItem["category"]) || "All Items",
              diet: line.diet || "veg",
              price: line.price,
              inStock: true,
              prepTimeMinutes: 15,
            },
            quantity: line.quantity,
            selectedVariant: line.selectedVariantName
              ? { id: `var-${line.id}`, name: line.selectedVariantName, price: line.price }
              : undefined,
            selectedModifiers: [],
            specialInstructions: line.notes,
            addedAt: open.startTime,
          })),
        );
        toast.success(`Editing ${open.orderNumber}`, {
          description: "Add or remove items, then Update KOT / Settle",
        });
        return;
      }
      toast.error(`Open order ${qOrderNumber} not found`);
    }

    if (qTable || qRoom) {
      const target =
        qOrderType === "room_service"
          ? `Room ${qRoom}${qGuestName ? ` · ${decodeURIComponent(qGuestName)}` : ""}`
          : `Table ${qTable}`;
      toast.success(`Billing ready — ${target}`);
    }
  }, []);

  // 2. Cart Items State (empty for fresh and redirected billing sessions)
  const [cartItems, setCartItems] = useState<BillingCartItem[]>([]);
  /** Prevents double KOT when user clicks KOT then settles the same cart */
  const [kotSentForCart, setKotSentForCart] = useState(false);
  const [linkedOrderNumber, setLinkedOrderNumber] = useState<string | null>(null);

  // 5. Modals State
  const [modifierItem, setModifierItem] = useState<BillingMenuItem | null>(null);
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [settlementRecord, setSettlementRecord] = useState<BillSettlementRecord | null>(null);

  // Deduct plate stock (Half portion = 0.5 plate, Full/Standard = 1.0 plate per quantity)
  const deductPlatesForItems = useCallback(
    (itemsToDeduct: BillingCartItem[]) => {
      const outletId = activeOutlet?.id;
      for (const ci of itemsToDeduct) {
        if (!ci?.item?.id) continue;
        const variantName = (ci.selectedVariant?.name || "").toLowerCase();
        const factor = variantName.includes("half") ? 0.5 : 1.0;
        const platesToDeduct = ci.quantity * factor;
        posMenuService.deductItemPlates(outletId, ci.item.id, platesToDeduct);
      }
      queryClient.invalidateQueries({ queryKey: ["pos", "menu"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "billing", "menu"] });
    },
    [activeOutlet?.id, queryClient],
  );

  // --- Handlers ---

  // Add item with chosen portion variant
  const handleAddItem = (item: BillingMenuItem, selectedVariant?: BillingItemVariant) => {
    if (item.plates !== undefined && item.plates <= 0) {
      toast.error(`"${item.name}" is sold out (0 plates available).`);
      return;
    }

    const chosenVariant =
      selectedVariant ||
      (item.variants && item.variants.length > 0 ? item.variants[0] : undefined);

    const isHalf = (chosenVariant?.name || "").toLowerCase().includes("half");
    const plateCost = isHalf ? 0.5 : 1.0;

    if (item.plates !== undefined) {
      const currentPlatesInCart = cartItems
        .filter((ci) => ci.item.id === item.id)
        .reduce((sum, ci) => {
          const varHalf = (ci.selectedVariant?.name || "").toLowerCase().includes("half");
          return sum + ci.quantity * (varHalf ? 0.5 : 1.0);
        }, 0);

      if (currentPlatesInCart + plateCost > item.plates) {
        toast.error(`Only ${item.plates} plates available for "${item.name}".`);
        return;
      }
    }

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (ci) =>
          ci.item.id === item.id &&
          ci.selectedVariant?.id === chosenVariant?.id &&
          ci.selectedModifiers.length === 0 &&
          !ci.specialInstructions,
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }

      return [
        ...prev,
        {
          cartId: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          item,
          quantity: 1,
          selectedVariant: chosenVariant,
          selectedModifiers: [],
          addedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ];
    });

    toast.success(
      `Added ${item.name}${chosenVariant ? ` (${chosenVariant.name})` : ""} to check`,
      { duration: 1500 },
    );
  };

  // Confirm custom item add
  const handleConfirmCustomAdd = (
    item: BillingMenuItem,
    variant: BillingItemVariant | undefined,
    modifiers: BillingSelectedModifier[],
    instructions: string,
    quantity: number,
  ) => {
    if (item.plates !== undefined && item.plates <= 0) {
      toast.error(`"${item.name}" is sold out (0 plates available).`);
      return;
    }
    setCartItems((prev) => [
      ...prev,
      {
        cartId: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        item,
        quantity,
        selectedVariant: variant,
        selectedModifiers: modifiers,
        specialInstructions: instructions || undefined,
        addedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    toast.success(`Added ${quantity}× ${item.name} (${variant?.name || "Standard"})`, {
      duration: 2000,
    });
  };

  // Update Cart Quantity
  const handleUpdateCartQty = (cartId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(cartId);
      return;
    }
    const targetItem = cartItems.find((ci) => ci.cartId === cartId);
    if (targetItem && targetItem.item.plates !== undefined && newQty > targetItem.quantity) {
      const isHalf = (targetItem.selectedVariant?.name || "").toLowerCase().includes("half");
      const currentOtherPlates = cartItems
        .filter((ci) => ci.item.id === targetItem.item.id && ci.cartId !== cartId)
        .reduce((sum, ci) => {
          const varHalf = (ci.selectedVariant?.name || "").toLowerCase().includes("half");
          return sum + ci.quantity * (varHalf ? 0.5 : 1.0);
        }, 0);
      const requestedPlates = currentOtherPlates + newQty * (isHalf ? 0.5 : 1.0);
      if (requestedPlates > targetItem.item.plates) {
        toast.error(`Only ${targetItem.item.plates} plates available for "${targetItem.item.name}".`);
        return;
      }
    }
    setCartItems((prev) =>
      prev.map((ci) => (ci.cartId === cartId ? { ...ci, quantity: newQty } : ci)),
    );
  };

  // Remove Cart Item
  const handleRemoveCartItem = (cartId: string) => {
    setCartItems((prev) => (Array.isArray(prev) ? prev : []).filter((ci) => ci && ci.cartId !== cartId));
  };

  // Toggle Complimentary
  const handleToggleComplimentary = (cartId: string) => {
    setCartItems((prev) =>
      prev.map((ci) =>
        ci.cartId === cartId ? { ...ci, isComplimentary: !ci.isComplimentary } : ci,
      ),
    );
  };

  // Clear Cart
  const handleClearCart = () => {
    setCartItems([]);
    setKotSentForCart(false);
    setLinkedOrderNumber(null);
    setLinkedOrderId(null);
    setRunningOrderMeta(null);
    setDiscountType("percent");
    setDiscountValue(0);
    setTaxType("percent");
    setTaxValue(5);
    toast.info("Cleared order cart");
  };

  // New Bill
  const handleNewBill = useCallback((silent = false) => {
    const nextNum = "NEW";
    setBillNumber(nextNum);
    setCartItems([]);
    setSelectedCustomer(null);
    setSpecialNote("");
    setKotSentForCart(false);
    setLinkedOrderNumber(null);
    setLinkedOrderId(null);
    setRunningOrderMeta(null);
    setActiveTable("");
    setBillingTableId("");
    setActiveTableReservationId("");
    setGuestCount(0);
    setDiscountType("percent");
    setDiscountValue(0);
    setTaxType("percent");
    setTaxValue(5);
    if (orderType === "room_service") {
      setRoomNumber("");
      setRoomUnitId("");
      setReservationId("");
      setFolioId("");
      setGuestCount(0);
    }
    if (!silent) {
      toast.success(`New check ${nextNum} started`);
    }
  }, [orderType]);

  const buildOrderPayload = useCallback(() => {
    const taxSettings = getPosTaxSettings();
    const orderItems = cartItems.map((item) => {
      const bp = item.selectedVariant ? item.selectedVariant.price : item.item.price;
      const mp = item.selectedModifiers.reduce((mSum, m) => mSum + m.price, 0);
      return {
        id: item.item.id,
        menuItemId: item.item.id,
        name: item.item.name,
        quantity: item.quantity,
        price: item.isComplimentary ? 0 : bp + mp,
        selectedVariantName: item.selectedVariant?.name,
        notes: item.specialInstructions,
        code: item.item.code,
        category: typeof item.item.category === "string" ? item.item.category : undefined,
        diet: item.item.diet,
      };
    });

    const subtotal = cartItems.reduce((sum, item) => {
      if (item.isComplimentary) return sum;
      const bp = item.selectedVariant ? item.selectedVariant.price : item.item.price;
      const mp = item.selectedModifiers.reduce((mSum, m) => mSum + m.price, 0);
      return sum + (bp + mp) * item.quantity;
    }, 0);

    const discountAmount =
      discountType === "percent"
        ? Math.round((subtotal * Math.min(100, Math.max(0, discountValue))) / 100)
        : Math.min(subtotal, Math.max(0, Math.round(discountValue)));

    const taxableAmount = Math.max(0, subtotal - discountAmount);

    const taxAmount =
      taxType === "percent"
        ? Math.round((taxableAmount * Math.max(0, taxValue)) / 100)
        : Math.max(0, Math.round(taxValue));

    const cgst = Math.round(taxAmount / 2);
    const sgst = taxAmount - cgst;
    const serviceCharge = 0;
    const rawTotal = taxableAmount + taxAmount;
    const grandTotal = Math.round(rawTotal);
    const roundOff = Number((grandTotal - rawTotal).toFixed(2));

    const tableLabel =
      orderType === "dine_in"
        ? activeTable
        : orderType === "room_service"
          ? roomNumber
          : orderType === "delivery"
            ? "Delivery"
            : "Takeaway";

    const itemsSummary = orderItems
      .map(
        (i) =>
          `${i.name}${i.selectedVariantName ? ` (${i.selectedVariantName})` : ""} × ${i.quantity}`,
      )
      .join(", ");

    return {
      orderItems,
      itemsSummary,
      subtotal,
      discountAmount,
      cgst,
      sgst,
      serviceCharge,
      grandTotal,
      roundOff,
      tableLabel,
    };
  }, [cartItems, orderType, activeTable, roomNumber, discountType, discountValue, taxType, taxValue]);

  const activeReservationDeposit = useMemo(() => {
    if (orderType !== "dine_in") return 0;
    if (activeTableReservationId) {
      const match = reservations.find((r) => r.id === activeTableReservationId);
      if (match?.depositAmount && match.depositAmount > 0) return match.depositAmount;
    }
    if (billingTableId || activeTable) {
      const cleanTbl = activeTable.replace(/\D/g, "");
      const match = reservations.find((r) => {
        if (!r.depositAmount || r.depositAmount <= 0) return false;
        if (r.status !== "seated" && r.status !== "reserved") return false;
        if (billingTableId && r.tableId === billingTableId) return true;
        const rTbl = String(r.tableNumber || "").replace(/\D/g, "");
        return Boolean(cleanTbl && rTbl && cleanTbl === rTbl);
      });
      if (match?.depositAmount && match.depositAmount > 0) return match.depositAmount;
    }
    if (selectedCustomer?.phone) {
      const cleanPhone = selectedCustomer.phone.replace(/\D/g, "");
      const match = reservations.find((r) => {
        if (!r.depositAmount || r.depositAmount <= 0) return false;
        if (r.status !== "seated" && r.status !== "reserved") return false;
        return Boolean(r.customerPhone && r.customerPhone.replace(/\D/g, "") === cleanPhone);
      });
      if (match?.depositAmount && match.depositAmount > 0) return match.depositAmount;
    }
    return 0;
  }, [orderType, activeTableReservationId, billingTableId, activeTable, reservations, selectedCustomer]);

  const invalidateOrderSurfaces = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["pos", "orders"] });
    queryClient.invalidateQueries({ queryKey: ["pos", "tables"] });
    queryClient.invalidateQueries({ queryKey: POS_RESERVATIONS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: POS_ROOM_SERVICE_ROOMS_KEY });
    queryClient.invalidateQueries({ queryKey: ["pos", "inventory"] });
  }, [queryClient]);

  const applyOccupiedRoom = useCallback(
    (nextRoom: string) => {
      if (!nextRoom) {
        setRoomNumber("");
        setGuestCount(0);
        setSelectedCustomer(null);
        setRoomUnitId("");
        setReservationId("");
        setFolioId("");
        return;
      }
      setRoomNumber(nextRoom);
      const match = occupiedRooms.find((r) => `Room ${r.roomNumber}` === nextRoom);
      setGuestCount(match?.pax ?? 0);
      setRoomUnitId(match?.roomUnitId || "");
      setReservationId(match?.reservationId || "");
      setFolioId(match?.folioId || "");
      if (match?.guestName) {
        setSelectedCustomer({
          id: `room-${match.roomNumber}`,
          name: match.guestName,
          phone: match.guestPhone || "",
          tier: "Silver",
          loyaltyPoints: 0,
          visitCount: 1,
          lastVisit: "Today",
          roomNumber: match.roomNumber,
        });
      } else {
        setSelectedCustomer(null);
      }
    },
    [occupiedRooms],
  );

  // Hold Check — persisted in the database so it survives refresh
  const handleHoldBill = useCallback(() => {
    if (cartItems.length === 0) return;

    const {
      orderItems,
      subtotal,
      cgst,
      sgst,
      serviceCharge,
      discountAmount,
      grandTotal,
      tableLabel,
    } = buildOrderPayload();

    if (!isBackendOutlet || !activeOutlet?.id) {
      toast.error("Choose a saved outlet so this check can be stored in the database.");
      return;
    }

    const heldCart = cloneHeldCart(cartItems);
    const payload = {
      outletId: activeOutlet.id,
      orderType,
      tableId: billingTableId || resolveTableMatch(activeTable)?.id,
      tableNumber: tableLabel,
      section: activeOutlet.name,
      roomNumber:
        orderType === "room_service" ? roomNumber.replace(/^Room\s+/i, "") : undefined,
      roomUnitId: roomUnitId || undefined,
      reservationId: reservationId || undefined,
      folioId: folioId || undefined,
      guestName: selectedCustomer?.name,
      guestPhone: selectedCustomer?.phone,
      waiterName: captainName,
      pax: guestCount || 1,
      orderNote: specialNote.trim() || undefined,
      subtotal,
      taxAmount: cgst + sgst,
      serviceCharge,
      discountAmount,
      grandTotal,
      sendKot: false,
      held: true,
      heldCart,
      meta: { held: true, heldCart },
      items: orderItems,
    };

    void (async () => {
      setBusyAction("hold");
      try {
        const saved = linkedOrderId
          ? await livePatchOrder(linkedOrderId, payload)
          : await liveCreateOrder(payload);
        invalidateOrderSurfaces();
        toast.success(`Held · ${saved.orderNumber || billNumber} saved`, {
          description: "Resume from Held Checks anytime — this check stays after refresh.",
        });
        handleNewBill();
      } catch (err: any) {
        toast.error(err?.response?.data?.detail || err?.message || "Could not hold this check");
      } finally {
        setBusyAction(null);
      }
    })();
  }, [
    cartItems,
    billNumber,
    orderType,
    activeTable,
    roomNumber,
    guestCount,
    captainName,
    selectedCustomer,
    specialNote,
    handleNewBill,
    buildOrderPayload,
    isBackendOutlet,
    activeOutlet?.id,
    activeOutlet?.name,
    billingTableId,
    resolveTableMatch,
    roomUnitId,
    reservationId,
    folioId,
    linkedOrderId,
    invalidateOrderSurfaces,
    handleNewBill,
  ]);

  // Resume Held Check
  const handleResumeHeldBill = (held: HeldBill) => {
    setBillNumber(held.billNumber);
    setOrderType(held.orderType);
    if (held.tableNumber) setActiveTable(held.tableNumber);
    if (held.tableId) setBillingTableId(held.tableId);
    if (held.roomNumber) setRoomNumber(held.roomNumber);
    if (held.roomUnitId) setRoomUnitId(held.roomUnitId);
    if (held.reservationId) setReservationId(held.reservationId);
    if (held.folioId) setFolioId(held.folioId);
    setGuestCount(held.guestCount);
    setCartItems(held.items);
    setSpecialNote(held.notes || "");
    setLinkedOrderId(held.linkedOrderId || held.id);
    setLinkedOrderNumber(held.billNumber);
    setKotSentForCart(false);
    setRunningOrderMeta(null);

    if (held.customerName) {
      handleSelectCustomer({
        id: `guest-${Date.now()}`,
        name: held.customerName,
        phone: held.customerPhone || "",
        tier: "Silver",
        loyaltyPoints: 0,
        visitCount: 1,
        lastVisit: "Today",
      });
    } else if (held.tableNumber || held.tableId) {
      const autoCust = findCustomerForTable(held.tableNumber || "", held.tableId);
      if (autoCust) {
        handleSelectCustomer(autoCust);
      }
    }

    setHeldBills((prev) => (Array.isArray(prev) ? prev : []).filter((h) => h && h.id !== held.id));
    toast.success(`Resumed check ${held.billNumber} for ${held.tableNumber || held.roomNumber || "Takeaway"}`);
  };

  // Select Table from Left Sidebar (or via Reservations Tab)
  const handleSelectTableFromSidebar = (table: RestaurantTable, reservation?: ReservationItem) => {
    const code =
      table.tableNumber && /^T\d+/i.test(table.tableNumber)
        ? table.tableNumber.toUpperCase()
        : `T${String(table.tableNumberRaw || 1).padStart(2, "0")}`;

    setActiveTable(code);
    if (table.id) setBillingTableId(table.id);
    setOrderType("dine_in");
    setGuestCount(reservation?.guests || table.activeReservation?.guests || table.capacity || 4);

    const linkedResId = reservation?.id || table.activeReservation?.id || "";
    setActiveTableReservationId(linkedResId);

    if (reservation && reservation.status === "reserved" && table.id) {
      void (async () => {
        try {
          await posTablesService.seatGuests(table.id, reservation.id);
          queryClient.invalidateQueries({ queryKey: ["pos", "tables"] });
          queryClient.invalidateQueries({ queryKey: POS_RESERVATIONS_QUERY_KEY });
        } catch {
          // ignore non-blocking seat transition error
        }
      })();
    }

    if (reservation?.customerName) {
      handleSelectCustomer({
        id: `cust-${reservation.id}`,
        name: reservation.customerName,
        phone: reservation.customerPhone || "",
      });
      toast.info(`Selected Table ${code} for ${reservation.customerName} (${reservation.guests} pax)`);
    } else {
      const foundCust = findCustomerForTable(code, table.id);
      handleSelectCustomer(foundCust || null);
    }

    // If table has a held check or active timeline order, resume it
    const existingHeld = heldBills.find(
      (h) =>
        h.tableNumber === code ||
        h.tableId === table.id ||
        h.tableNumber === table.tableNumber
    );
    if (existingHeld) {
      handleResumeHeldBill(existingHeld);
      if (!existingHeld.customerName && foundCust) {
        handleSelectCustomer(foundCust);
      }
      return;
    }

    const activeTimelineOrder = (currentTimeline || []).find(
      (ord) =>
        ord.tableOrRoom === code ||
        ord.tableId === table.id ||
        ord.tableOrRoom === table.tableNumber
    );
    if (activeTimelineOrder) {
      setLinkedOrderId(activeTimelineOrder.id);
      setLinkedOrderNumber(activeTimelineOrder.orderNumber);
      setBillNumber(activeTimelineOrder.orderNumber);
      setCartItems([]); // BLANK CHECK for extra items!
      setKotSentForCart(false);
      setRunningOrderMeta({
        id: activeTimelineOrder.id,
        orderNumber: activeTimelineOrder.orderNumber,
        tableNumber: activeTimelineOrder.tableOrRoom || code,
        guestName: activeTimelineOrder.customerName || (foundCust ? foundCust.name : "Guest"),
        itemsCount: activeTimelineOrder.itemCount || (activeTimelineOrder.items || []).length || 0,
        amount: activeTimelineOrder.amount || 0,
        items: (activeTimelineOrder.items || []).map((it) => ({
          name: it.name,
          quantity: it.quantity,
          price: it.price,
        })),
      });
      if (activeTimelineOrder.customerName) {
        handleSelectCustomer({
          id: `guest-${activeTimelineOrder.orderNumber}`,
          name: activeTimelineOrder.customerName,
          phone: activeTimelineOrder.customerPhone && activeTimelineOrder.customerPhone !== "--" ? activeTimelineOrder.customerPhone : "",
          tier: "Silver",
          loyaltyPoints: 0,
          visitCount: 1,
          lastVisit: "Today",
        });
      } else if (foundCust) {
        handleSelectCustomer(foundCust);
      }
      toast.info(`Table ${code} is occupied. Blank check ready for extra items.`);
      return;
    }
  };

  // Select/Edit Order from Left Sidebar
  const handleSelectOrderFromSidebar = (order: CurrentOrderRecord) => {
    const held = currentOrderToHeldBill(order);
    handleResumeHeldBill(held);
    if (order.customerName) {
      setSelectedCustomer({
        id: `ord-cust-${order.id}`,
        name: order.customerName,
        phone: order.customerPhone || "",
        tier: "Silver",
        loyaltyPoints: 0,
        visitCount: 1,
        lastVisit: "Today",
      });
    }
  };

  // Discard Held Check
  const handleDeleteHeldBill = (id: string) => {
    if (!canVoid) {
      toast.error("Permission required: pos.orders.void to discard or cancel checks.");
      return;
    }
    const target = heldBills.find((h) => h.id === id);
    const orderId = target?.linkedOrderId || (isBackendOutlet ? id : "");
    if (orderId && isBackendOutlet) {
      void (async () => {
        try {
          await liveCancelOrder(orderId);
          invalidateOrderSurfaces();
        } catch (err: any) {
          toast.error(err?.response?.data?.detail || err?.message || "Could not discard held check");
          return;
        }
        setHeldBills((prev) => (Array.isArray(prev) ? prev : []).filter((h) => h && h.id !== id));
        toast.error("Discarded held check");
      })();
      return;
    }
    setHeldBills((prev) => (Array.isArray(prev) ? prev : []).filter((h) => h && h.id !== id));
    toast.error("Discarded held check");
  };

  // Print / Update KOT → Preparing (new check) or incremental KOT (edit existing)
  const handlePrintKot = useCallback(() => {
    if (cartItems.length === 0) return;

    const { orderItems, subtotal, grandTotal, tableLabel, cgst, sgst, serviceCharge, discountAmount } =
      buildOrderPayload();
    if (!tableLabel && orderType === "dine_in") {
      toast.error("Select a table before sending KOT");
      return;
    }
    if (orderType === "room_service" && !roomNumber) {
      toast.error("Select a room before sending KOT");
      return;
    }

    if (isBackendOutlet && activeOutlet?.id) {
      const payload = {
        outletId: activeOutlet.id,
        orderType,
        tableId: billingTableId || resolveTableMatch(activeTable)?.id,
        tableNumber: tableLabel,
        section: activeOutlet.name,
        roomNumber:
          orderType === "room_service" ? roomNumber.replace(/^Room\s+/i, "") : undefined,
        roomUnitId: roomUnitId || undefined,
        reservationId: reservationId || undefined,
        folioId: folioId || undefined,
        guestName: selectedCustomer?.name,
        guestPhone: selectedCustomer?.phone,
        waiterName: captainName,
        pax: guestCount || 1,
        orderNote: specialNote.trim() || undefined,
        subtotal,
        taxAmount: cgst + sgst,
        serviceCharge,
        discountAmount,
        grandTotal,
        sendKot: true,
        held: false,
        items: orderItems,
      };
      void (async () => {
        setBusyAction("kot");
        try {
          if (linkedOrderId) {
            const isExtraAppend = Boolean(runningOrderMeta?.id === linkedOrderId || !search.editOrder);
            const patchPayload = {
              ...payload,
              append: isExtraAppend,
              append_items: isExtraAppend,
            };
            const updated = await livePatchOrder(linkedOrderId, patchPayload);
            deductPlatesForItems(cartItems);
            setKotSentForCart(true);
            queryClient.invalidateQueries({ queryKey: ["pos", "orders"] });
            queryClient.invalidateQueries({ queryKey: ["pos", "tables"] });
            queryClient.invalidateQueries({ queryKey: ["pos", "orders", "kot"] });
            invalidateOrderSurfaces();
            const checkDesc = updated.kotNumber
              ? `${updated.kotNumber} · Extra items sent to kitchen`
              : `${updated.orderNumber || linkedOrderNumber || ""} · Order updated`;
            toast.success(`KOT updated → Preparing`, {
              description: checkDesc,
            });
            handleNewBill(true);
            setRunningOrderMeta(null);
            return;
          }
          const created = await liveCreateOrder(payload);
          deductPlatesForItems(cartItems);
          setKotSentForCart(true);
          queryClient.invalidateQueries({ queryKey: ["pos", "orders"] });
          queryClient.invalidateQueries({ queryKey: ["pos", "tables"] });
          invalidateOrderSurfaces();
          toast.success(`KOT #${created.kotId || ""} → Preparing`, {
            description: `${created.orderNumber} · New check generated`,
          });
          handleNewBill(true);
        } catch (err: any) {
          toast.error(err?.response?.data?.detail || err?.message || "Could not send KOT");
        } finally {
          setBusyAction(null);
        }
      })();
      return;
    }

    toast.error("Choose a saved outlet so this KOT can be stored in the database.");
  }, [
    cartItems,
    kotSentForCart,
    linkedOrderNumber,
    buildOrderPayload,
    orderType,
    activeOutlet?.name,
    captainName,
    guestCount,
    selectedCustomer,
    specialNote,
    queryClient,
    isBackendOutlet,
    activeOutlet?.id,
    activeOutlet?.name,
    billingTableId,
    resolveTableMatch,
    activeTable,
    roomNumber,
    roomUnitId,
    reservationId,
    folioId,
    linkedOrderId,
    invalidateOrderSurfaces,
  ]);

  // Submit order → Current Orders (+ KOT if not already sent)
  const handleSettleBill = useCallback(
    (paymentMethod: BillingPaymentMethod, tenderedAmount: number) => {
      if (cartItems.length === 0) return;

      const {
        orderItems,
        subtotal,
        discountAmount,
        cgst,
        sgst,
        serviceCharge,
        grandTotal,
        roundOff,
        tableLabel,
      } = buildOrderPayload();

      if (paymentMethod === "room_post" && !folioId && !reservationId) {
        toast.error("No open guest folio for this room");
        return;
      }

      if (isBackendOutlet && activeOutlet?.id) {
        const payMap: Record<string, string> = {
          cash: "CASH",
          upi: "UPI",
          card: "CARD",
          room_post: "ROOM_CHARGE",
          due: "DUE",
          split: "SPLIT",
        };
        void (async () => {
          setBusyAction("pay");
          try {
            let orderId = linkedOrderId;
            if (!orderId) {
              const created = await liveCreateOrder({
                outletId: activeOutlet.id,
                orderType,
                tableId: billingTableId || resolveTableMatch(activeTable)?.id,
                tableNumber: tableLabel,
                section: activeOutlet.name,
                roomNumber:
                  orderType === "room_service"
                    ? roomNumber.replace(/^Room\s+/i, "")
                    : undefined,
                roomUnitId: roomUnitId || undefined,
                reservationId: reservationId || undefined,
                folioId: folioId || undefined,
                guestName: selectedCustomer?.name,
                guestPhone: selectedCustomer?.phone,
                waiterName: captainName,
                pax: guestCount || 1,
                orderNote: specialNote.trim() || undefined,
                subtotal,
                taxAmount: cgst + sgst,
                serviceCharge,
                discountAmount,
                grandTotal,
                sendKot: true,
                held: false,
                items: orderItems,
                meta:
                  activeReservationDeposit > 0
                    ? {
                        deposit_amount: activeReservationDeposit,
                        reservation_deposit: activeReservationDeposit,
                      }
                    : undefined,
              });
              orderId = created.id;
              setLinkedOrderId(created.id);
              setLinkedOrderNumber(created.orderNumber);
              setBillNumber(created.orderNumber);
            }
            if (!orderId) {
              toast.error("Could not create order");
              return;
            }
            const effectiveTendered = Number(tenderedAmount || 0);
            const totalPaidTowardsBill = effectiveTendered + activeReservationDeposit;
            const isPartial = totalPaidTowardsBill < grandTotal;
            const settled = await liveSettleOrder(orderId, {
              paymentMode: payMap[paymentMethod] || "CASH",
              tenderedAmount: effectiveTendered,
              folioId: folioId || undefined,
              reservationId: reservationId || undefined,
              idempotencyKey: `settle-${orderId}-${Date.now()}`,
            });
            if (!kotSentForCart) {
              deductPlatesForItems(cartItems);
            }
            if (!isPartial && orderType === "dine_in") {
              try {
                await posTablesService.completeReservation({
                  reservationId: activeTableReservationId || undefined,
                  tableId: billingTableId || resolveTableMatch(activeTable)?.id,
                  tableNumber: tableLabel,
                });
              } catch {
                // non-blocking so bill settlement still completes cleanly
              }
            }
            invalidateOrderSurfaces();
            setIsPayNowOpen(false);
            if (isPartial) {
              const remainingDue = Math.max(0, grandTotal - totalPaidTowardsBill);
              toast.success(`Partial Paid · ${settled.orderNumber || billNumber}`, {
                description: `₹${totalPaidTowardsBill.toLocaleString("en-IN")} paid (including ₹${activeReservationDeposit} advance) · ₹${remainingDue.toLocaleString("en-IN")} balance due moved to Pending Payments`,
              });
            } else {
              toast.success(`Paid · ${settled.orderNumber || billNumber} saved to Order History`, {
                description:
                  activeReservationDeposit > 0
                    ? `Full payment settled (₹${effectiveTendered.toLocaleString("en-IN")} + ₹${activeReservationDeposit.toLocaleString("en-IN")} advance deposit)`
                    : "Full payment received · sent to KOT",
              });
            }
            handleNewBill();
          } catch (err: any) {
            const detail = err?.response?.data;
            const message =
              (typeof detail?.detail === "string" && detail.detail) ||
              (typeof detail?.folio_id === "string" && detail.folio_id) ||
              (typeof detail?.order === "string" && detail.order) ||
              err?.message ||
              "Could not save paid order";
            toast.error(message);
          } finally {
            setBusyAction(null);
          }
        })();
        return;
      }

      toast.error("Choose a saved outlet so this payment can be stored in the database.");
    },
    [
      cartItems,
      kotSentForCart,
      linkedOrderNumber,
      buildOrderPayload,
      billNumber,
      orderType,
      activeTable,
      roomNumber,
      activeOutlet?.name,
      captainName,
      guestCount,
      specialNote,
      queryClient,
      selectedCustomer,
      handleNewBill,
      isBackendOutlet,
      activeOutlet?.id,
      billingTableId,
      resolveTableMatch,
      roomUnitId,
      reservationId,
      activeTableReservationId,
      folioId,
      linkedOrderId,
      invalidateOrderSurfaces,
    ],
  );

  // Settle full running order: fetch all rounds and open Pay Now modal
  const handleSettleRunningOrder = useCallback(async () => {
    const targetId = runningOrderMeta?.id || linkedOrderId;
    if (!targetId) return;
    try {
      const order = await liveGetOrder(targetId);
      if (!order) {
        toast.error("Running order could not be loaded");
        return;
      }
      setCartItems(
        (order.items || []).map((line, idx) => ({
          cartId: `settle-${order.orderNumber}-${idx}`,
          item: {
            id: (line as any).menuItemId || line.id,
            code: line.code || `#${line.id}`,
            name: line.name,
            category: (line.category as BillingMenuItem["category"]) || "All Items",
            diet: line.diet || "veg",
            price: line.price,
            inStock: true,
            prepTimeMinutes: 15,
          },
          quantity: line.quantity,
          selectedVariant: line.selectedVariantName
            ? { id: `var-${line.id}`, name: line.selectedVariantName, price: line.price }
            : undefined,
          selectedModifiers: [],
          specialInstructions: line.notes,
          addedAt: order.startTime,
        })),
      );
      setBillNumber(order.orderNumber);
      setLinkedOrderId(order.id);
      setLinkedOrderNumber(order.orderNumber);
      setRunningOrderMeta(null);
      setIsPreviousOrdersOpen(false);
      setIsPayNowOpen(true);
    } catch (err: any) {
      toast.error(err?.message || "Could not load full check for settlement");
    }
  }, [runningOrderMeta, linkedOrderId]);

  const handleAddToRoomFolio = useCallback(() => {
    if (cartItems.length === 0) return;
    if (orderType !== "room_service" || !roomNumber) {
      toast.error("Choose the guest room first");
      return;
    }

    const {
      orderItems,
      subtotal,
      discountAmount,
      cgst,
      sgst,
      serviceCharge,
      grandTotal,
      tableLabel,
    } = buildOrderPayload();
    const roomBare = roomNumber.replace(/^Room\s+/i, "");

    if (isBackendOutlet && activeOutlet?.id) {
      if (!folioId && !reservationId) {
        toast.error("No open folio for this room — guest must be checked in");
        return;
      }
      void (async () => {
        setBusyAction("folio");
        try {
          let orderId = linkedOrderId;
          if (!orderId) {
            const created = await liveCreateOrder({
              outletId: activeOutlet.id,
              orderType: "room_service",
              tableNumber: tableLabel,
              section: activeOutlet.name,
              roomNumber: roomBare,
              roomUnitId: roomUnitId || undefined,
              reservationId: reservationId || undefined,
              folioId: folioId || undefined,
              guestName: selectedCustomer?.name,
              guestPhone: selectedCustomer?.phone,
              waiterName: captainName,
              pax: guestCount || 1,
              orderNote: specialNote.trim() || undefined,
              subtotal,
              taxAmount: cgst + sgst,
              serviceCharge,
              discountAmount,
              grandTotal,
              sendKot: true,
              held: false,
              items: orderItems,
            });
            orderId = created.id;
            setLinkedOrderId(created.id);
            setLinkedOrderNumber(created.orderNumber);
            setBillNumber(created.orderNumber);
          }
          if (!orderId) {
            toast.error("Could not create order");
            return;
          }
          const settled = await liveSettleOrder(orderId, {
            paymentMode: "ROOM_CHARGE",
            tenderedAmount: grandTotal,
            folioId: folioId || undefined,
            reservationId: reservationId || undefined,
            idempotencyKey: `folio-${orderId}-${Date.now()}`,
          });
          if (!kotSentForCart) {
            deductPlatesForItems(cartItems);
          }
          invalidateOrderSurfaces();
          toast.success(`Posted to room ${roomBare} folio`, {
            description: `${settled.orderNumber || billNumber} · KOT sent · Order History (Add to Room Folio)`,
          });
          handleNewBill();
        } catch (err: any) {
          const detail = err?.response?.data;
          const message =
            (typeof detail?.detail === "string" && detail.detail) ||
            (typeof detail?.folio_id === "string" && detail.folio_id) ||
            (typeof detail?.reservation_id === "string" && detail.reservation_id) ||
            err?.message ||
            "Could not post to room folio";
          toast.error(message);
        } finally {
          setBusyAction(null);
        }
      })();
      return;
    }

    toast.error("Choose a saved outlet so this room charge can be stored in the database.");
  }, [
    cartItems,
    orderType,
    roomNumber,
    buildOrderPayload,
    isBackendOutlet,
    activeOutlet?.id,
    activeOutlet?.name,
    folioId,
    reservationId,
    linkedOrderId,
    roomUnitId,
    selectedCustomer,
    captainName,
    guestCount,
    specialNote,
    billNumber,
    invalidateOrderSurfaces,
    handleNewBill,
  ]);

  // Keyboard Shortcuts (F2, F4, F8, F9, F10)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        handleNewBill();
      } else if (e.key === "F4") {
        e.preventDefault();
        handleHoldBill();
      } else if (e.key === "F8") {
        e.preventDefault();
        handlePrintKot();
      } else if (e.key === "F9" || e.key === "F10") {
        e.preventDefault();
        if (cartItems.length > 0) {
          setIsPayNowOpen(true);
        } else {
          toast.info("Cart is empty — add items to settle bill");
        }
      }
    };

    const handleCustomKot = () => handlePrintKot();
    const handleCustomPay = () => {
      if (cartItems.length > 0) {
        setIsPayNowOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pos:send-kot", handleCustomKot);
    window.addEventListener("pos:pay-settle", handleCustomPay);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pos:send-kot", handleCustomKot);
      window.removeEventListener("pos:pay-settle", handleCustomPay);
    };
  }, [handleNewBill, handleHoldBill, handlePrintKot, cartItems.length]);

  const mobileCartQty = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );
  const mobileCartTotal = useMemo(
    () =>
      cartItems.reduce((sum, item) => {
        if (item.isComplimentary) return sum;
        const basePrice = item.selectedVariant ? item.selectedVariant.price : item.item.price;
        const modPrice = item.selectedModifiers.reduce((mSum, m) => mSum + m.price, 0);
        return sum + (basePrice + modPrice) * item.quantity;
      }, 0),
    [cartItems],
  );

  return (
    <div className="flex flex-col flex-1 min-h-[calc(100dvh-3.5rem)] lg:h-[calc(100dvh-3.5rem)] lg:max-h-[calc(100dvh-3.5rem)] lg:overflow-hidden bg-slate-50/50">
      {/* 1. Top Order Mode & Action Header */}
      <div className="shrink-0">
        <BillingHeader
          orderType={orderType}
          setOrderType={handleOrderTypeChange}
          activeTable={activeTable}
          onOpenTableSelector={() => setIsTableModalOpen(true)}
          guestCount={guestCount}
          setGuestCount={setGuestCount}
          heldCount={heldBills.length}
          onOpenHeldDrawer={() => setIsHeldDrawerOpen(true)}
          onNewBill={handleNewBill}
          roomNumber={roomNumber}
          occupiedRooms={occupiedRooms}
          onSelectRoom={applyOccupiedRoom}
        />
      </div>

      {/* Mobile & Tablet (<lg) Workspace Switcher */}
      <div className="lg:hidden px-2.5 pt-2 shrink-0">
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setMobilePane("menu")}
            className={cn(
              "rounded-lg py-2 px-2 text-xs font-bold transition cursor-pointer",
              mobilePane === "menu"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            Menu
          </button>
          <button
            type="button"
            onClick={() => setMobilePane("cart")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-2 px-2 text-xs font-bold transition cursor-pointer",
              mobilePane === "cart"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            <span>Cart</span>
            {mobileCartQty > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-extrabold",
                  mobilePane === "cart"
                    ? "bg-white/20 text-white"
                    : "bg-primary/15 text-primary",
                )}
              >
                {mobileCartQty}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobilePane("tables")}
            className={cn(
              "rounded-lg py-2 px-2 text-xs font-bold transition cursor-pointer truncate",
              mobilePane === "tables"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            Tables & Orders
          </button>
        </div>
      </div>

      {/* 2. Main Workspace: Tables & Orders (Left) + Menu Catalog (Center) + Cart Register (Right) */}
      <div className="flex flex-col lg:flex-row gap-2.5 flex-1 min-h-0 lg:overflow-hidden items-stretch px-2 sm:px-2.5 pt-2 lg:pt-0 pb-2.5">
        {/* Left: Tables & Orders Panel (Responsive & Auto-adjusts screen space) */}
        <div
          className={cn(
            mobilePane === "tables" ? "flex h-[calc(100dvh-13.5rem)] min-h-[420px]" : "hidden",
            "lg:flex shrink-0 lg:h-full min-h-0 transition-all duration-200 ease-in-out",
            isTablesPanelCollapsed ? "lg:w-14" : "w-full lg:w-80 xl:w-[340px] 2xl:w-[380px]",
          )}
        >
          <BillingTablesOrdersSidebar
            activeTable={activeTable}
            onSelectTable={(table, reservation) => {
              handleSelectTableFromSidebar(table, reservation);
              setMobilePane("menu");
            }}
            onSelectOrder={(order) => {
              handleSelectOrderFromSidebar(order);
              setMobilePane("cart");
            }}
            activeOutletId={activeOutlet?.id}
            isCollapsed={isTablesPanelCollapsed}
            onToggleCollapse={() => setIsTablesPanelCollapsed((c) => !c)}
          />
        </div>

        {/* Center: Menu Catalog */}
        <div
          className={cn(
            mobilePane === "menu" ? "flex" : "hidden lg:flex",
            "flex-1 min-w-0 flex-col min-h-0 lg:h-full overflow-hidden",
          )}
        >
          <BillingMenuCatalog
            items={billingItems}
            cartItems={cartItems}
            onAddItem={handleAddItem}
            onOpenModifierModal={(item) => {
              setModifierItem(item);
              setIsModifierModalOpen(true);
            }}
            onUpdateCartQty={handleUpdateCartQty}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Right: Billing Cart Register & Settlement */}
        <div
          className={cn(
            mobilePane === "cart" ? "flex" : "hidden lg:flex",
            "w-full lg:w-[350px] xl:w-[380px] 2xl:w-[420px] shrink-0 flex-col min-h-0 lg:h-full overflow-hidden",
          )}
        >
          <BillingCartRegister
            cartItems={cartItems}
            orderType={orderType}
            tableNumber={activeTable}
            roomNumber={roomNumber}
            guestCount={guestCount}
            billNumber={billNumber}
            captainName={captainName}
            specialNote={specialNote}
            onSpecialNoteChange={setSpecialNote}
            onUpdateCartQty={handleUpdateCartQty}
            onRemoveCartItem={handleRemoveCartItem}
            onToggleComplimentary={handleToggleComplimentary}
            onClearCart={handleClearCart}
            onHoldBill={handleHoldBill}
            onPrintKot={handlePrintKot}
            runningOrder={runningOrderMeta}
            onViewPreviousOrders={() => setIsPreviousOrdersOpen(true)}
            onSettleRunningOrder={handleSettleRunningOrder}
            onPayNow={() => {
              if (cartItems.length === 0) {
                if (runningOrderMeta) {
                  handleSettleRunningOrder();
                }
                return;
              }
              setIsPayNowOpen(true);
            }}
            onAddToRoomFolio={handleAddToRoomFolio}
            busyAction={busyAction}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={handleSelectCustomer}
            discountType={discountType}
            discountValue={discountValue}
            onDiscountChange={(type, val) => {
              setDiscountType(type);
              setDiscountValue(val);
            }}
            taxType={taxType}
            taxValue={taxValue}
            onTaxChange={(type, val) => {
              setTaxType(type);
              setTaxValue(val);
            }}
          />
        </div>
      </div>

      {/* Sticky Mobile Cart Bar (<lg when browsing Menu with items in cart) */}
      {mobilePane === "menu" && mobileCartQty > 0 && (
        <div className="lg:hidden sticky bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur-xs px-3 py-2 shadow-e2">
          <button
            type="button"
            onClick={() => setMobilePane("cart")}
            className="flex w-full items-center justify-between rounded-xl bg-primary px-4 py-2.5 text-primary-foreground shadow-sm cursor-pointer active:scale-[0.99] transition"
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="rounded-md bg-white/20 px-2 py-0.5 font-mono">
                {mobileCartQty} {mobileCartQty === 1 ? "item" : "items"}
              </span>
              <span>View Cart & Settle</span>
            </div>
            <span className="font-mono text-sm font-black">
              ₹{mobileCartTotal.toLocaleString("en-IN")} →
            </span>
          </button>
        </div>
      )}

      {/* 3. Integrated Modals & Slide Drawers */}
      <BillingModifierModal
        isOpen={isModifierModalOpen}
        onClose={() => setIsModifierModalOpen(false)}
        item={modifierItem}
        onConfirmAddToCart={handleConfirmCustomAdd}
      />

      <BillingTableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        selectedTable={activeTable}
        onSelectTable={(table) => {
          setActiveTable(table.tableNumber);
          setGuestCount(table.activeReservation?.guests || table.capacity || 4);
          const foundCust = findCustomerForTable(table.tableNumber, table.id);
          handleSelectCustomer(foundCust || null);
        }}
      />

      <BillingHeldDrawer
        isOpen={isHeldDrawerOpen}
        onClose={() => setIsHeldDrawerOpen(false)}
        heldBills={heldBills}
        onResumeHeldBill={handleResumeHeldBill}
        onDeleteHeldBill={handleDeleteHeldBill}
      />

      <BillingReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        record={settlementRecord}
        onPrint={() => {
          if (settlementRecord) {
            printPosInvoice(settlementRecordToInvoicePayload(settlementRecord, activeOutlet));
            toast.success(`Printing Tax Invoice ${settlementRecord.billNumber}`);
          }
        }}
        onNewBill={handleNewBill}
      />

      <BillingPayNowModal
        isOpen={isPayNowOpen}
        onClose={() => setIsPayNowOpen(false)}
        billNumber={billNumber}
        tableOrRoom={
          orderType === "dine_in"
            ? activeTable
            : orderType === "room_service"
              ? roomNumber
              : "Takeaway"
        }
        customerName={selectedCustomer?.name}
        itemsSummary={buildOrderPayload().itemsSummary}
        grandTotal={buildOrderPayload().grandTotal}
        depositAmount={activeReservationDeposit}
        busy={busyAction === "pay"}
        onConfirm={handleSettleBill}
      />

      <BillingPreviousOrdersModal
        isOpen={isPreviousOrdersOpen}
        onClose={() => setIsPreviousOrdersOpen(false)}
        orderNumber={runningOrderMeta?.orderNumber || billNumber}
        tableNumber={runningOrderMeta?.tableNumber || activeTable}
        guestName={runningOrderMeta?.guestName || selectedCustomer?.name}
        items={runningOrderMeta?.items || []}
        grandTotal={runningOrderMeta?.amount || 0}
        onSettleBill={handleSettleRunningOrder}
      />
    </div>
  );
}
