import { useState, useEffect, useCallback, useMemo } from "react";
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
import { createDineInOrder } from "@/services/posOrdersService";
import { getPosTaxSettings } from "@/lib/posTaxSettings";
import { useHotelRooms } from "@/hooks/queries/usePosRoomService";
import { usePosTables } from "@/hooks/queries/usePosTables";

export function PosBillingManager() {
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

  // 1. Order & Header State
  const [orderType, setOrderType] = useState<BillingOrderType>("dine_in");
  const [activeTable, setActiveTable] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [guestCount, setGuestCount] = useState(4);
  const [billNumber, setBillNumber] = useState("RET-2026-9024");
  const [searchQuery, setSearchQuery] = useState("");
  const [specialNote, setSpecialNote] = useState("");
  const captainName = user?.name?.trim() || "Steward";

  // Default dine-in table to first available/reserved (canonical Take Order tableNumber)
  useEffect(() => {
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
  }, [selectableTables, activeTable, resolveTableMatch]);

  // Default room service selection to first occupied room (same Room Service store)
  useEffect(() => {
    if (occupiedRooms.length === 0) return;
    const stillValid = occupiedRooms.some((r) => `Room ${r.roomNumber}` === roomNumber);
    if (!roomNumber || !stillValid) {
      const first = occupiedRooms[0];
      setRoomNumber(`Room ${first.roomNumber}`);
    }
  }, [occupiedRooms, roomNumber]);

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

  // Read URL Query parameters on mount (when redirected from Take Order for a Table or Room)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const qOrderType = params.get("orderType") as BillingOrderType | null;
    const qTable = params.get("table");
    const qRoom = params.get("room");
    const qGuests = params.get("guests") || params.get("pax");
    const qGuestName = params.get("guestName");

    if (qOrderType) {
      setOrderType(qOrderType);
    }
    if (qTable) {
      setActiveTable(qTable);
    }
    if (qRoom) {
      const formatted = qRoom.toLowerCase().startsWith("room") ? qRoom : `Room ${qRoom}`;
      setRoomNumber(formatted);
    }
    if (qGuests) {
      const parsed = parseInt(qGuests, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setGuestCount(parsed);
      }
    }
    if (qGuestName) {
      setSelectedCustomer({
        id: `guest-${Date.now()}`,
        name: decodeURIComponent(qGuestName),
        phone: "+91 98765 00000",
        tier: "Silver",
        loyaltyPoints: 0,
        visitCount: 1,
        lastVisit: "Today",
      });
    }

    if (qTable || qRoom) {
      const target = qOrderType === "room_service" ? `Room ${qRoom}` : `Table ${qTable}`;
      toast.success(`Active billing session for ${target}`);
    }
  }, []);

  // 2. Cart Items State (empty for fresh and redirected billing sessions)
  const [cartItems, setCartItems] = useState<BillingCartItem[]>([]);

  // 3. Customer Loyalty State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);

  // 4. Parked/Held Bills State
  const [heldBills, setHeldBills] = useState<HeldBill[]>(MOCK_HELD_BILLS);
  const [isHeldDrawerOpen, setIsHeldDrawerOpen] = useState(false);

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
    toast.info("Cleared order cart");
  };

  // New Bill
  const handleNewBill = useCallback(() => {
    const nextNum = `RET-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setBillNumber(nextNum);
    setCartItems([]);
    setSelectedCustomer(null);
    setSpecialNote("");
    toast.success(`New check ${nextNum} started`);
  }, []);

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

  // Print KOT
  const handlePrintKot = useCallback(() => {
    if (cartItems.length === 0) return;
    const noteHint = specialNote.trim() ? ` · Note: ${specialNote.trim()}` : "";
    toast.info(
      `Kitchen Ticket (KOT) sent to Chef Printer for ${activeTable || "Takeaway"}${noteHint}`,
    );
  }, [cartItems.length, activeTable, specialNote]);

  // Submit order → Current Orders + KOT
  const handleSettleBill = useCallback(
    (paymentMethod: BillingPaymentMethod, tenderedAmount: number) => {
      if (cartItems.length === 0) return;

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
      const effectiveTender = tenderedAmount || grandTotal;
      const changeDue = Math.max(0, effectiveTender - grandTotal);

      const tableLabel =
        orderType === "dine_in"
          ? activeTable
          : orderType === "room_service"
            ? roomNumber
            : orderType === "delivery"
              ? "Delivery"
              : "Takeaway";

      const { orderNumber, kotId } = createDineInOrder({
        tableId: `tbl-${tableLabel.toLowerCase().replace(/\s+/g, "-")}`,
        tableNumber: tableLabel,
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
      toast.success(`${orderNumber} saved · KOT #${kotId} sent · ${paymentMethod.toUpperCase()}`);
      handleNewBill();
    },
    [
      cartItems,
      orderType,
      activeTable,
      roomNumber,
      activeOutlet?.name,
      captainName,
      guestCount,
      specialNote,
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
          setOrderType={setOrderType}
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
            setRoomNumber(nextRoom);
            const match = occupiedRooms.find((r) => `Room ${r.roomNumber}` === nextRoom);
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
