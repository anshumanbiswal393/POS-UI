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
import { MOCK_HELD_BILLS, MOCK_CUSTOMERS } from "./mockBillingData";
import { BillingHeader } from "./BillingHeader";
import { BillingMenuCatalog } from "./BillingMenuCatalog";
import { BillingCartRegister } from "./BillingCartRegister";
import { BillingModifierModal } from "./BillingModifierModal";
import { BillingReceiptModal } from "./BillingReceiptModal";
import { BillingHeldDrawer } from "./BillingHeldDrawer";
import { BillingTableModal } from "./BillingTableModal";
import { useMenuItems } from "@/hooks/queries/usePosMenu";
import { useOutletContext } from "@/context/PosOutletContext";
import { useAuth } from "@/hooks/useAuth";
import {
  createDineInOrder,
  markOrderSettledInHistory,
  getCurrentOrderByNumber,
  updateCurrentOrderFromBilling,
} from "@/services/posOrdersService";
import { getPosTaxSettings } from "@/lib/posTaxSettings";
import { useHotelRooms } from "@/hooks/queries/usePosRoomService";
import { usePosTables } from "@/hooks/queries/usePosTables";
import { isBackendOutletId } from "@/utils/outletId";

export function PosBillingManager() {
  const queryClient = useQueryClient();
  const { activeOutlet } = useOutletContext();
  const { user } = useAuth();
  const { data: menuList = [] } = useMenuItems(activeOutlet?.id || "outlet-primary");
  const { data: hotelRooms = [] } = useHotelRooms();
  const { data: restaurantTables = [] } = usePosTables();

  const occupiedRooms = useMemo(
    () =>
      hotelRooms
        .filter((room) => room.isOccupied)
        .map((room) => ({
          roomNumber: room.roomNumber,
          guestName: room.guest?.name,
          guestPhone: room.guest?.phoneExtension,
          pax: room.guest?.pax ?? 0,
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
  const [billNumber, setBillNumber] = useState("RET-2026-9024");
  const [searchQuery, setSearchQuery] = useState("");
  const [specialNote, setSpecialNote] = useState("");
  const captainName = user?.name?.trim() || "Steward";
  const isBackendOutlet = isBackendOutletId(activeOutlet?.id);

  // Reset cart / held bills when switching to a real DB outlet (new HO/Kitchen starts empty)
  useEffect(() => {
    if (!isBackendOutlet) return;
    setActiveTable("");
    setGuestCount(0);
    setSpecialNote("");
  }, [activeOutlet?.id, isBackendOutlet]);

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

  // When an occupied room is already set (e.g. from Take Order URL), fill pax from folio
  useEffect(() => {
    if (orderType !== "room_service" || !roomNumber || occupiedRooms.length === 0) return;
    const match = occupiedRooms.find((r) => `Room ${r.roomNumber}` === roomNumber);
    if (match && guestCount === 0 && (match.pax ?? 0) > 0) {
      setGuestCount(match.pax ?? 0);
    }
  }, [orderType, roomNumber, occupiedRooms, guestCount]);

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
    const qEditOrder = params.get("editOrder");

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
    if (qOrderNumber && qEditOrder) {
      const open = getCurrentOrderByNumber(decodeURIComponent(qOrderNumber));
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

  // 4. Parked/Held Bills State — empty for real DB outlets
  const [heldBills, setHeldBills] = useState<HeldBill[]>(() =>
    isBackendOutletId(activeOutlet?.id) ? [] : MOCK_HELD_BILLS,
  );
  const [isHeldDrawerOpen, setIsHeldDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isBackendOutlet) return;
    setHeldBills([]);
  }, [activeOutlet?.id, isBackendOutlet]);

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
    toast.info("Cleared order cart");
  };

  // New Bill
  const handleNewBill = useCallback(() => {
    const nextNum = `RET-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setBillNumber(nextNum);
    setCartItems([]);
    setSelectedCustomer(null);
    setSpecialNote("");
    setKotSentForCart(false);
    setLinkedOrderNumber(null);
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

    return {
      orderItems,
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

  // Hold Check
  const handleHoldBill = useCallback(() => {
    if (cartItems.length === 0) return;

    const subtotal = cartItems.reduce((sum, ci) => {
      const bp = ci.selectedVariant ? ci.selectedVariant.price : ci.item.price;
      const mp = ci.selectedModifiers.reduce((s, m) => s + m.price, 0);
      return sum + (bp + mp) * ci.quantity;
    }, 0);

    const tax = Math.round(subtotal * 0.05);

    const newHeld: HeldBill = {
      id: `held-${Date.now()}`,
      billNumber,
      orderType,
      tableNumber: orderType === "dine_in" ? activeTable : undefined,
      roomNumber: orderType === "room_service" ? roomNumber : undefined,
      guestCount,
      items: [...cartItems],
      heldAt: "Just now",
      subtotal,
      tax,
      grandTotal: subtotal + tax,
      captainName,
      customerName: selectedCustomer?.name,
      customerPhone: selectedCustomer?.phone,
      notes: specialNote.trim() || undefined,
    };

    setHeldBills((prev) => [newHeld, ...prev]);
    toast.warning(`Order for ${activeTable || "Walk-in"} placed on Hold`);
    handleNewBill();
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
  ]);

  // Resume Held Check
  const handleResumeHeldBill = (held: HeldBill) => {
    setBillNumber(held.billNumber);
    setOrderType(held.orderType);
    if (held.tableNumber) setActiveTable(held.tableNumber);
    if (held.roomNumber) setRoomNumber(held.roomNumber);
    setGuestCount(held.guestCount);
    setCartItems(held.items);
    setSpecialNote(held.notes || "");

    if (held.customerName) {
      const match = MOCK_CUSTOMERS.find((c) => c.phone === held.customerPhone);
      setSelectedCustomer(
        match || {
          id: "temp",
          name: held.customerName,
          phone: held.customerPhone || "",
          tier: "Silver",
          loyaltyPoints: 0,
          visitCount: 1,
          lastVisit: "Today",
        },
      );
    }

    setHeldBills((prev) => prev.filter((h) => h.id !== held.id));
    toast.success(`Resumed check ${held.billNumber} for ${held.tableNumber || "Takeaway"}`);
  };

  // Discard Held Check
  const handleDeleteHeldBill = (id: string) => {
    setHeldBills((prev) => prev.filter((h) => h.id !== id));
    toast.error("Discarded held check");
  };

  // Print / Update KOT → Preparing (new check) or incremental KOT (edit existing)
  const handlePrintKot = useCallback(() => {
    if (cartItems.length === 0) return;

    const { orderItems, subtotal, grandTotal, tableLabel } = buildOrderPayload();
    if (!tableLabel && orderType === "dine_in") {
      toast.error("Select a table before sending KOT");
      return;
    }

    // Editing an open Current Order → send modified KOT for new/changed items
    if (kotSentForCart && linkedOrderNumber) {
      const prev = getCurrentOrderByNumber(linkedOrderNumber);
      const prevMap = new Map((prev?.items || []).map((i) => [`${i.id}|${i.selectedVariantName || ""}`, i.quantity]));
      const deltas: string[] = [];
      for (const line of orderItems) {
        const key = `${line.id}|${line.selectedVariantName || ""}`;
        const before = prevMap.get(key) || 0;
        if (line.quantity > before) {
          deltas.push(`+${line.quantity - before}× ${line.name}`);
        } else if (line.quantity < before) {
          deltas.push(`${line.quantity - before}× ${line.name}`);
        }
        prevMap.delete(key);
      }
      for (const [key, qty] of prevMap) {
        const name =
          prev?.items.find((i) => `${i.id}|${i.selectedVariantName || ""}` === key)?.name || key;
        deltas.push(`-${qty}× ${name}`);
      }

      if (deltas.length === 0) {
        toast.info("No item changes — nothing new for kitchen");
        return;
      }

      const result = updateCurrentOrderFromBilling({
        orderNumber: linkedOrderNumber,
        items: orderItems,
        subtotal,
        grandTotal,
        guestName: selectedCustomer?.name,
        guestPhone: selectedCustomer?.phone,
        waiterName: captainName,
        orderNote: specialNote.trim() || undefined,
        modifiedSummaryText: deltas.join(", "),
      });

      if (!result) {
        toast.error("Could not update open order");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "kot"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "live"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "current-timeline"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "all"] });
      toast.success(`KOT #${result.kotId} updated → Preparing`, {
        description: `${linkedOrderNumber} · ${deltas.join(", ")}`,
      });
      return;
    }

    if (kotSentForCart) {
      toast.info("KOT already sent for this check — open Kitchen Display");
      return;
    }

    const { orderNumber, kotId } = createDineInOrder({
      tableId: `tbl-${(tableLabel || "takeaway").toLowerCase().replace(/\s+/g, "-")}`,
      tableNumber: tableLabel || "Takeaway",
      section: activeOutlet?.name || "Main Dining",
      waiterName: captainName,
      pax: guestCount,
      guestName: selectedCustomer?.name,
      guestPhone: selectedCustomer?.phone,
      orderNote: specialNote.trim() || undefined,
      items: orderItems,
      subtotal,
      grandTotal,
    });

    setKotSentForCart(true);
    setLinkedOrderNumber(orderNumber);
    setBillNumber(orderNumber);
    queryClient.invalidateQueries({ queryKey: ["pos", "orders", "kot"] });
    queryClient.invalidateQueries({ queryKey: ["pos", "orders", "live"] });
    queryClient.invalidateQueries({ queryKey: ["pos", "orders", "current-timeline"] });
    const noteHint = specialNote.trim() ? ` · Note: ${specialNote.trim()}` : "";
    toast.success(`KOT #${kotId} → Preparing (${tableLabel || "Takeaway"})${noteHint}`, {
      description: `${orderNumber} · Current Orders`,
    });
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

      const effectiveTender = tenderedAmount || grandTotal;
      const changeDue = Math.max(0, effectiveTender - grandTotal);

      let orderNumber = billNumber;
      let kotId: number | null = null;
      const historyPayMode =
        paymentMethod === "upi" ? ("UPI" as const) : ("Cash" as const);

      if (!kotSentForCart) {
        const created = createDineInOrder({
          tableId: `tbl-${(tableLabel || "takeaway").toLowerCase().replace(/\s+/g, "-")}`,
          tableNumber: tableLabel || "Takeaway",
          section: activeOutlet?.name || "Main Dining",
          waiterName: captainName,
          pax: guestCount,
          guestName: selectedCustomer?.name,
          guestPhone: selectedCustomer?.phone,
          orderNote: specialNote.trim() || undefined,
          items: orderItems,
          subtotal,
          grandTotal,
          paymentMode: historyPayMode,
          markSettled: true,
        });
        orderNumber = created.orderNumber;
        kotId = created.kotId;
        queryClient.invalidateQueries({ queryKey: ["pos", "orders", "kot"] });
        queryClient.invalidateQueries({ queryKey: ["pos", "orders", "live"] });
        queryClient.invalidateQueries({ queryKey: ["pos", "orders", "all"] });
      } else {
        // Persist latest cart amounts before settle if items changed
        if (linkedOrderNumber) {
          const open = getCurrentOrderByNumber(linkedOrderNumber);
          if (open && Math.abs(open.amount - grandTotal) > 0.01) {
            updateCurrentOrderFromBilling({
              orderNumber: linkedOrderNumber,
              items: orderItems,
              subtotal,
              grandTotal,
              guestName: selectedCustomer?.name,
              guestPhone: selectedCustomer?.phone,
              waiterName: captainName,
              modifiedSummaryText: "Settled with updated items",
            });
          }
          markOrderSettledInHistory(linkedOrderNumber, historyPayMode);
          orderNumber = linkedOrderNumber;
        } else {
          markOrderSettledInHistory(orderNumber, historyPayMode);
        }
        queryClient.invalidateQueries({ queryKey: ["pos", "orders", "all"] });
        queryClient.invalidateQueries({ queryKey: ["pos", "orders", "live"] });
        queryClient.invalidateQueries({ queryKey: ["pos", "orders", "current-timeline"] });
        queryClient.invalidateQueries({ queryKey: ["pos", "orders", "kot"] });
      }

      const now = new Date();
      const dateStr = now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const record: BillSettlementRecord = {
        billNumber: orderNumber,
        orderType,
        tableNumber: orderType === "dine_in" ? activeTable : undefined,
        roomNumber: orderType === "room_service" ? roomNumber : undefined,
        customerName: selectedCustomer?.name,
        customerPhone: selectedCustomer?.phone,
        guestCount,
        captainName,
        terminal: "Counter POS 01",
        shift: "Shift 01",
        items: [...cartItems],
        subtotal,
        discountAmount,
        cgst,
        sgst,
        serviceCharge,
        roundOff,
        grandTotal,
        paymentMethod,
        tenderedAmount: effectiveTender,
        changeDue,
        settledAt: `${dateStr} ${timeStr}`,
        specialNote: specialNote.trim() || undefined,
      };

      setSettlementRecord(record);
      toast.success(
        kotId
          ? `${orderNumber} saved · KOT #${kotId} → Preparing · ${paymentMethod.toUpperCase()}`
          : `${orderNumber} saved · ${paymentMethod.toUpperCase()}`,
      );
      handleNewBill();
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
    ],
  );

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
          handleSettleBill("cash", 0);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNewBill, handleHoldBill, handlePrintKot, cartItems.length, handleSettleBill]);

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
          onSelectRoom={(nextRoom) => {
            if (!nextRoom) {
              setRoomNumber("");
              setGuestCount(0);
              setSelectedCustomer(null);
              return;
            }
            setRoomNumber(nextRoom);
            const match = occupiedRooms.find((r) => `Room ${r.roomNumber}` === nextRoom);
            setGuestCount(match?.pax ?? 0);
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
          }}
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
            onSettleBill={handleSettleBill}
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
    </div>
  );
}
