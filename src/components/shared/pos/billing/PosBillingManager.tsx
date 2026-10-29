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
import { BillingCartRegister } from "./BillingCartRegister";
import { BillingModifierModal } from "./BillingModifierModal";
import { BillingReceiptModal } from "./BillingReceiptModal";
import { BillingHeldDrawer } from "./BillingHeldDrawer";
import { BillingTableModal } from "./BillingTableModal";
import { BillingPayNowModal } from "./BillingPayNowModal";
import { useBillingMenuItems } from "@/hooks/queries/usePosMenu";
import { useOutletContext } from "@/context/PosOutletContext";
import { useAuth } from "@/hooks/useAuth";
import type { CurrentOrderRecord } from "@/services/posOrdersService";
import { useCurrentOrdersTimeline } from "@/hooks/queries/usePosOrders";
import {
  liveCreateOrder,
  livePatchOrder,
  liveSettleOrder,
  liveGetOrder,
  liveCancelOrder,
} from "@/services/posOrderLive";
import { getPosTaxSettings } from "@/lib/posTaxSettings";
import { useHotelRooms } from "@/hooks/queries/usePosRoomService";
import { usePosTables } from "@/hooks/queries/usePosTables";
import { isBackendOutletId } from "@/utils/outletId";
import { POS_ROOM_SERVICE_ROOMS_KEY } from "@/hooks/queries/usePosRoomService";

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
  const { user } = useAuth();
  const { data: menuList = [] } = useBillingMenuItems(activeOutlet?.id || "outlet-primary");
  const { data: hotelRooms = [] } = useHotelRooms();
  const { data: restaurantTables = [] } = usePosTables();
  const { data: currentTimeline = [] } = useCurrentOrdersTimeline();

  const occupiedRooms = useMemo(
    () =>
      hotelRooms
        .filter((room) => room.isOccupied)
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
    () => restaurantTables.filter((t) => t.status === "vacant" || t.status === "reserved"),
    [restaurantTables],
  );

  const resolveTableMatch = useCallback(
    (label: string) => {
      if (!label) return undefined;
      return restaurantTables.find(
        (t) =>
          t.tableNumber === label ||
          `Table #${t.tableNumberRaw}` === label ||
          `T-${t.tableNumberRaw}` === label ||
          String(t.tableNumberRaw) === label,
      );
    },
    [restaurantTables],
  );

  // 1. Order & Header State — blank until user picks table/pax for a new outlet
  const [orderType, setOrderType] = useState<BillingOrderType>("dine_in");
  const [activeTable, setActiveTable] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [guestCount, setGuestCount] = useState(0);
  const [billNumber, setBillNumber] = useState("NEW");
  const [searchQuery, setSearchQuery] = useState("");
  const [specialNote, setSpecialNote] = useState("");
  const [waiterFromUrl, setWaiterFromUrl] = useState("");
  const [billingTableId, setBillingTableId] = useState("");
  const [roomUnitId, setRoomUnitId] = useState("");
  const [reservationId, setReservationId] = useState("");
  const [folioId, setFolioId] = useState("");
  const [linkedOrderId, setLinkedOrderId] = useState<string | null>(null);
  const captainName = user?.name?.trim() || waiterFromUrl.trim() || "Steward";
  const isBackendOutlet = isBackendOutletId(activeOutlet?.id);
  const [isPayNowOpen, setIsPayNowOpen] = useState(false);
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
      setHeldBills(currentTimeline.filter((ord) => ord.held).map(currentOrderToHeldBill));
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
    if (!menuList) {
      return [];
    }

    return menuList
      .filter((item) => item.status === "Active" && item.baseMenu !== false)
      .map((item) => {
        const primaryImg =
          item.images?.find((img) => img.isPrimary)?.url || item.images?.[0]?.url;
        const diet: "veg" | "non_veg" | "egg" | "drinks" =
          item.itemType === "Veg"
            ? "veg"
            : item.itemType === "Egg"
              ? "egg"
              : item.category.toLowerCase().includes("bev") ||
                item.category.toLowerCase().includes("cocktail") ||
                item.category.toLowerCase().includes("vodka") ||
                item.category.toLowerCase().includes("whisky")
                ? "drinks"
                : "non_veg";

        return {
          id: item.id,
          code: item.code.startsWith("#") ? item.code : `#${item.code}`,
          name: item.name,
          category: item.category as any,
          diet,
          price: item.price,
          inStock: true,
          prepTimeMinutes: 15,
          imageUrl: primaryImg,
          description: item.description,
          variants: item.variants && item.variants.length > 0 ? (item.variants as any) : undefined,
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
      setSelectedCustomer({
        id: `guest-${Date.now()}`,
        name: decodeURIComponent(qGuestName),
        phone: phoneRaw || "+91 98765 00000",
        tier: "Silver",
        loyaltyPoints: 0,
        visitCount: 1,
        lastVisit: "Today",
      });
    }

    // Edit existing Current Order → hydrate cart + link check
    if ((qOrderId || qOrderNumber) && qEditOrder) {
      if (qOrderId) {
        liveGetOrder(qOrderId).then((open) => {
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
            open.items.map((line, idx) => ({
              cartId: `edit-${open.orderNumber}-${idx}`,
              item: {
                id: line.id,
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
              id: line.id,
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

  // 3. Customer Loyalty State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);

  // 5. Modals State
  const [modifierItem, setModifierItem] = useState<BillingMenuItem | null>(null);
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [settlementRecord, setSettlementRecord] = useState<BillSettlementRecord | null>(null);

  // --- Handlers ---

  // Add item with chosen portion variant
  const handleAddItem = (item: BillingMenuItem, selectedVariant?: BillingItemVariant) => {
    const chosenVariant =
      selectedVariant ||
      (item.variants && item.variants.length > 0 ? item.variants[0] : undefined);

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
    setCartItems((prev) =>
      prev.map((ci) => (ci.cartId === cartId ? { ...ci, quantity: newQty } : ci)),
    );
  };

  // Remove Cart Item
  const handleRemoveCartItem = (cartId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.cartId !== cartId));
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
    toast.info("Cleared order cart");
  };

  // New Bill
  const handleNewBill = useCallback(() => {
    const nextNum = "NEW";
    setBillNumber(nextNum);
    setCartItems([]);
    setSelectedCustomer(null);
    setSpecialNote("");
    setKotSentForCart(false);
    setLinkedOrderNumber(null);
    setLinkedOrderId(null);
    if (orderType === "room_service") {
      setRoomNumber("");
      setGuestCount(0);
    }
    toast.success(`New check ${nextNum} started`);
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

    const discountAmount = 0;
    const taxableAmount = subtotal - discountAmount;
    const cgst = Math.round((taxableAmount * taxSettings.cgstPercent) / 100);
    const sgst = Math.round((taxableAmount * taxSettings.sgstPercent) / 100);
    const serviceCharge = Math.round((taxableAmount * taxSettings.serviceChargePercent) / 100);
    const rawTotal = taxableAmount + cgst + sgst + serviceCharge;
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
  }, [cartItems, orderType, activeTable, roomNumber]);

  const invalidateOrderSurfaces = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["pos", "orders"] });
    queryClient.invalidateQueries({ queryKey: ["pos", "tables"] });
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

    if (held.customerName) {
      setSelectedCustomer({
        id: `guest-${Date.now()}`,
        name: held.customerName,
        phone: held.customerPhone || "",
        tier: "Silver",
        loyaltyPoints: 0,
        visitCount: 1,
        lastVisit: "Today",
      });
    }

    setHeldBills((prev) => prev.filter((h) => h.id !== held.id));
    toast.success(`Resumed check ${held.billNumber} for ${held.tableNumber || held.roomNumber || "Takeaway"}`);
  };

  // Discard Held Check
  const handleDeleteHeldBill = (id: string) => {
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
        setHeldBills((prev) => prev.filter((h) => h.id !== id));
        toast.error("Discarded held check");
      })();
      return;
    }
    setHeldBills((prev) => prev.filter((h) => h.id !== id));
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
            const updated = await livePatchOrder(linkedOrderId, payload);
            setKotSentForCart(true);
            queryClient.invalidateQueries({ queryKey: ["pos", "orders"] });
            queryClient.invalidateQueries({ queryKey: ["pos", "tables"] });
            invalidateOrderSurfaces();
            toast.success(`KOT updated → Preparing`, {
              description: `${updated.orderNumber || linkedOrderNumber || ""} · Current Orders · Pending Payments`,
            });
            return;
          }
          const created = await liveCreateOrder(payload);
          setKotSentForCart(true);
          setLinkedOrderId(created.id);
          setLinkedOrderNumber(created.orderNumber);
          setBillNumber(created.orderNumber);
          if (created.tableId) setBillingTableId(created.tableId);
          invalidateOrderSurfaces();
          toast.success(`KOT #${created.kotId || ""} → Preparing`, {
            description: `${created.orderNumber} · Current Orders · Pending Payments`,
          });
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
              paymentMode: payMap[paymentMethod] || "CASH",
              tenderedAmount: Math.max(tenderedAmount || 0, grandTotal),
              folioId: folioId || undefined,
              reservationId: reservationId || undefined,
              idempotencyKey: `settle-${orderId}-${Date.now()}`,
            });
            invalidateOrderSurfaces();
            setIsPayNowOpen(false);
            toast.success(`Paid · ${settled.orderNumber || billNumber} saved to Order History`, {
              description: "Sent to KOT · not added to Pending Payments",
            });
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
      folioId,
      linkedOrderId,
      invalidateOrderSurfaces,
    ],
  );

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

  // Keyboard Shortcuts (F2, F4, F8, F10)
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
      } else if (e.key === "F10") {
        e.preventDefault();
        if (cartItems.length > 0) {
          setIsPayNowOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNewBill, handleHoldBill, handlePrintKot, cartItems.length]);

  return (
    <div className="flex flex-col gap-2 lg:h-[calc(100dvh-5.5rem)] lg:max-h-[calc(100dvh-5.5rem)] lg:overflow-hidden min-h-[calc(100vh-5.5rem)]">
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

      {/* 2. Main Workspace: Menu Catalog (Left/Center) + Cart Register (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-0 lg:overflow-hidden items-stretch">
        {/* Left / Center Catalog (7 cols on desktop, 8 on 2xl) */}
        <div className="lg:col-span-7 xl:col-span-7 2xl:col-span-8 flex flex-col h-full min-h-0 overflow-hidden">
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

        {/* Right Billing Cart Register & Settlement (5 cols on desktop, 4 on 2xl) */}
        <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-4 flex flex-col h-full min-h-0 overflow-hidden">
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
            onPayNow={() => {
              if (cartItems.length === 0) return;
              setIsPayNowOpen(true);
            }}
            onAddToRoomFolio={handleAddToRoomFolio}
            busyAction={busyAction}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={setSelectedCustomer}
          />
        </div>
      </div>

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
          if (table.activeReservation?.customerName) {
            setSelectedCustomer({
              id: `res-${table.id}`,
              name: table.activeReservation.customerName,
              phone: table.activeReservation.customerPhone || "",
              tier: table.activeReservation.isVip ? "Gold" : "Silver",
              loyaltyPoints: 0,
              visitCount: 1,
              lastVisit: "Today",
            });
          }
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
        onPrint={() => toast.success("Sent receipt to USB thermal receipt printer")}
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
        busy={busyAction === "pay"}
        onConfirm={handleSettleBill}
      />
    </div>
  );
}
