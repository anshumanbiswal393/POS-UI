import React, { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  usePosTables,
  useDiningAreas,
  usePosTableStats,
  useSeatGuestsMutation,
  useCancelReservationMutation,
  useVacateTableMutation,
  useAddReservationMutation,
  useAddAreaMutation,
  useAddTableMutation,
  useCreateTableOrderMutation,
  useUpdateTableOrderMutation,
} from "@/hooks/queries/usePosTables";
import {
  useRoomServiceOrders,
  useHotelRooms,
  useUpdateRoomOrderStatusMutation,
  useClearTrayMutation,
  useCreateRoomOrderMutation,
  useAddItemsToOrderMutation,
} from "@/hooks/queries/usePosRoomService";
import { TableFloorPlan } from "./tables/TableFloorPlan";
import { AddTableModal } from "./tables/AddTableModal";
import { AddAreaModal } from "./tables/AddAreaModal";
import { AssignGuestModal } from "./tables/AssignGuestModal";
import { TableOrderWizardModal } from "./tables/TableOrderWizardModal";
import { TableOrderEditModal } from "./tables/TableOrderEditModal";
import { ReservationDetailSlide } from "./tables/ReservationDetailSlide";
import { NewReservationModal } from "./tables/NewReservationModal";
import { RoomOrderCategoryGridView } from "./roomService/RoomOrderCategoryGridView";
import { RoomOrderDetailSlide } from "./roomService/RoomOrderDetailSlide";
import { RoomOrderWizardModal, type HeldRoomOrder } from "./roomService/RoomOrderWizardModal";
import { RoomFolioOrderSlide } from "./roomService/RoomFolioOrderSlide";
import { AddItemsToOrderModal } from "./roomService/AddItemsToOrderModal";
import type { DiningArea, RestaurantTable, ReservationItem, TableShape } from "@/types/posTables";
import type {
  HotelRoom,
  RoomServiceOrder,
  RoomServiceOrderStatus,
  RoomOrderItem,
} from "@/types/posRoomService";

export function PosTakeOrderManager() {
  const navigate = useNavigate();

  // Slide Switcher State: "restaurant" (Table) vs "room" (Room)
  const [activeSlide, setActiveSlide] = useState<"restaurant" | "room">("restaurant");

  // ===================== RESTAURANT (TABLE) STATE =====================
  const [activeArea, setActiveArea] = useState<DiningArea>("Main Dining");
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null);
  const [isDetailSlideOpen, setIsDetailSlideOpen] = useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [isAddAreaOpen, setIsAddAreaOpen] = useState(false);
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  const [isAssignGuestOpen, setIsAssignGuestOpen] = useState(false);
  const [isTakeOrderWizardOpen, setIsTakeOrderWizardOpen] = useState(false);
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [wizardTableId, setWizardTableId] = useState<string | undefined>(undefined);
  const [bookingTableId, setBookingTableId] = useState<string | undefined>(undefined);

  // Table queries & mutations
  const { data: diningAreas = [] } = useDiningAreas();
  const { data: tables = [], refetch: refetchTables } = usePosTables(activeArea);
  const { data: allTables = [] } = usePosTables();
  const { data: stats } = usePosTableStats(activeArea);

  const seatGuestsMutation = useSeatGuestsMutation();
  const cancelReservationMutation = useCancelReservationMutation();
  const vacateTableMutation = useVacateTableMutation();
  const addReservationMutation = useAddReservationMutation();
  const addAreaMutation = useAddAreaMutation();
  const addTableMutation = useAddTableMutation();
  const createTableOrderMutation = useCreateTableOrderMutation();
  const updateTableOrderMutation = useUpdateTableOrderMutation();

  // ===================== ROOM SERVICE STATE =====================
  const [selectedRoomOrder, setSelectedRoomOrder] = useState<RoomServiceOrder | null>(null);
  const [isRoomSlideOpen, setIsRoomSlideOpen] = useState(false);
  const [isRoomWizardOpen, setIsRoomWizardOpen] = useState(false);
  const [selectedRoomForWizard, setSelectedRoomForWizard] = useState<HotelRoom | null>(null);
  const [heldRoomOrders, setHeldRoomOrders] = useState<HeldRoomOrder[]>([]);
  const [activeHeldOrder, setActiveHeldOrder] = useState<HeldRoomOrder | null>(null);
  const [isAddItemsModalOpen, setIsAddItemsModalOpen] = useState(false);
  const [folioPreviewRoom, setFolioPreviewRoom] = useState<HotelRoom | null>(null);

  // Room queries & mutations
  const { data: roomOrders = [], refetch: refetchRoomOrders } = useRoomServiceOrders();
  const { data: hotelRooms = [], refetch: refetchRooms } = useHotelRooms();

  const updateRoomStatusMutation = useUpdateRoomOrderStatusMutation();
  const clearTrayMutation = useClearTrayMutation();
  const createRoomOrderMutation = useCreateRoomOrderMutation();
  const addItemsMutation = useAddItemsToOrderMutation();

  // ===================== HANDLERS: RESTAURANT =====================
  const handleSelectTable = (table: RestaurantTable) => {
    if ((table.status === "occupied" || table.activeOrder?.orderId) && table.activeOrder?.orderId) {
      navigate({
        to: "/pos/billing",
        search: {
          orderType: "dine_in",
          table: table.tableNumber,
          tableId: table.id,
          orderId: table.activeOrder.orderId,
          orderNumber: table.activeOrder.orderNumber || undefined,
          editOrder: "1",
          guests: table.currentGuests || table.capacity,
          waiterName: table.activeOrder.serverName || "",
        },
      });
      return;
    }
    setWizardTableId(table.id);
    setIsTakeOrderWizardOpen(true);
  };

  const handleSelectReserved = (table: RestaurantTable, res?: ReservationItem) => {
    setSelectedTable(table);
    setSelectedReservation(res || table.activeReservation || null);
    setIsDetailSlideOpen(true);
  };

  const handleConfirmTableOrder = (data: {
    tableId: string;
    waiterName?: string;
    pax: number;
    guestName?: string;
    guestPhone?: string;
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      price: number;
      selectedVariantName?: string;
      notes?: string;
    }>;
    subtotal: number;
    grandTotal: number;
  }) => {
    createTableOrderMutation.mutate(data);
  };

  const handleSaveUpdatedOrder = (data: {
    tableId: string;
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      price: number;
      selectedVariantName?: string;
      notes?: string;
    }>;
    subtotal: number;
    grandTotal: number;
    modifiedSummaryText: string;
  }) => {
    updateTableOrderMutation.mutate(data);
  };

  useEffect(() => {
    if (diningAreas.length > 0 && !diningAreas.includes(activeArea)) {
      setActiveArea(diningAreas[0]);
    }
  }, [diningAreas, activeArea]);

  const handleAddArea = (areaName: string) => {
    addAreaMutation.mutate(areaName, {
      onSuccess: () => {
        setActiveArea(areaName);
      },
    });
  };

  const handleAddTable = (data: {
    tableNumber: string;
    capacity: number;
    area: string;
    shape?: TableShape;
  }) => {
    addTableMutation.mutate(data, {
      onSuccess: () => {
        if (data.area) setActiveArea(data.area);
      },
    });
  };

  const handleAssignGuest = (tableId: string, guestName: string, partySize: number) => {
    seatGuestsMutation.mutate({ tableId });
  };

  // ===================== HANDLERS: ROOM =====================
  const handleSelectRoom = (room: HotelRoom) => {
    // Only in-house guests — skip pax/waiter wizard; steward = device login on Billing
    if (!room.isOccupied || !room.guest?.name) return;
    navigate({
      to: "/pos/billing",
      search: {
        orderType: "room_service",
        room: room.roomNumber,
        roomUnitId: room.roomUnitId || "",
        reservationId: room.reservationId || "",
        folioId: room.folioId || "",
        guests: room.guest.pax || 1,
        guestName: room.guest.name,
        guestPhone: room.guest.phoneExtension || "",
      },
    });
  };

  const handleResumeHeldOrder = (held: HeldRoomOrder) => {
    const matchingRoom = hotelRooms.find((r) => r.roomNumber === held.roomNumber) || null;
    setSelectedRoomForWizard(matchingRoom);
    setActiveHeldOrder(held);
    setIsRoomWizardOpen(true);
  };

  const handleCancelHeldOrder = (heldId: string) => {
    setHeldRoomOrders((prev) => prev.filter((h) => h.id !== heldId));
  };

  const handleHoldRoomOrder = (held: HeldRoomOrder) => {
    setHeldRoomOrders((prev) => {
      const filtered = prev.filter((h) => h.roomNumber !== held.roomNumber);
      return [held, ...filtered];
    });
    setIsRoomWizardOpen(false);
  };

  const handleConfirmRoomOrder = (data: {
    roomNumber: string;
    roomType: string;
    floor: string;
    guestName: string;
    pax: number;
    waiterName?: string;
    notes?: string;
    items: RoomOrderItem[];
    subtotal: number;
    tax: number;
    serviceCharge: number;
    totalAmount: number;
  }) => {
    createRoomOrderMutation.mutate({
      orderNumber: `RS-${Math.floor(8000 + Math.random() * 1900)}`,
      roomNumber: data.roomNumber,
      floor: data.floor as any,
      roomType: data.roomType,
      guest: {
        name: data.guestName,
        phoneExtension: data.roomNumber,
      },
      items: data.items,
      status: "kitchen_prep",
      subtotal: data.subtotal,
      serviceCharge: data.serviceCharge,
      tax: data.tax,
      totalAmount: data.totalAmount,
      estimatedDeliveryTime: "in 25 mins",
      assignedRunner: data.waiterName || "Room Runner",
      traySetup: "Single Tray",
      paymentMethod: "room_folio",
      notes: data.notes,
    });

    // Remove from held orders if was held
    setHeldRoomOrders((prev) => prev.filter((h) => h.roomNumber !== data.roomNumber));
    setIsRoomWizardOpen(false);
  };

  const handleConfirmAddItems = (orderId: string, newItems: RoomOrderItem[]) => {
    addItemsMutation.mutate(
      { orderId, newItems },
      {
        onSuccess: (updatedOrder) => {
          setSelectedRoomOrder(updatedOrder);
        },
      },
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-100 font-sans">
      {/* Top Header Switcher: Restaurant vs Room */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2">
          {/* Pill Toggle Buttons with Dynamic Theme styling */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/70 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveSlide("restaurant")}
              className={`px-5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSlide === "restaurant"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              }`}
            >
              Restaurant
            </button>
            <button
              type="button"
              onClick={() => setActiveSlide("room")}
              className={`px-5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSlide === "room"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              }`}
            >
              Room
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          {activeSlide === "restaurant"
            ? "Restaurant Seating & Table Ordering"
            : "In-House Guest Room Orders"}
        </div>
      </div>

      {/* Main Slide Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeSlide === "restaurant" ? (
          // RESTAURANT (TABLE) SLIDE
          <TableFloorPlan
            tables={tables}
            areas={diningAreas}
            activeArea={activeArea}
            onSelectArea={setActiveArea}
            onSelectReserved={handleSelectReserved}
            onSelectTable={handleSelectTable}
            onOpenAddArea={() => setIsAddAreaOpen(true)}
            onOpenAddTable={() => setIsAddTableOpen(true)}
            onOpenBookReservation={() => {
              setBookingTableId(undefined);
              setIsNewReservationOpen(true);
            }}
            onOpenSeatGuest={() => setIsAssignGuestOpen(true)}
            onOpenTakeOrder={(tblId) => {
              // Open table / merge chooser first — billing only after Continue
              setWizardTableId(tblId);
              setIsTakeOrderWizardOpen(true);
            }}
            stats={stats}
            onRefresh={() => refetchTables()}
          />
        ) : (
          // ROOM SLIDE - Ultra-compact Room View matching reference image
          <RoomOrderCategoryGridView
            rooms={hotelRooms}
            heldOrders={heldRoomOrders}
            onSelectRoom={handleSelectRoom}
            onViewRoomOrders={(room) => setFolioPreviewRoom(room)}
            onResumeHeldOrder={handleResumeHeldOrder}
            onCancelHeldOrder={handleCancelHeldOrder}
          />
        )}
      </div>

      {/* ===================== DIALOGS & DRAWERS ===================== */}

      {/* 0. Table Order Wizard Modal */}
      <TableOrderWizardModal
        isOpen={isTakeOrderWizardOpen}
        onClose={() => setIsTakeOrderWizardOpen(false)}
        availableTables={allTables.filter(
          (t) => t.status === "vacant" || t.status === "reserved",
        )}
        preselectedTableId={wizardTableId}
        onConfirmOrder={handleConfirmTableOrder}
      />

      {/* 0.1 Table Order Edit Modal */}
      <TableOrderEditModal
        isOpen={isEditOrderOpen}
        onClose={() => setIsEditOrderOpen(false)}
        table={editingTable}
        onSaveUpdatedOrder={handleSaveUpdatedOrder}
      />

      {/* 1. Add Area Modal */}
      <AddAreaModal
        isOpen={isAddAreaOpen}
        onClose={() => setIsAddAreaOpen(false)}
        onAddArea={handleAddArea}
        existingAreas={diningAreas}
      />

      {/* 2. Add Table Modal */}
      <AddTableModal
        isOpen={isAddTableOpen}
        onClose={() => setIsAddTableOpen(false)}
        areas={diningAreas}
        defaultArea={activeArea}
        onAddTable={handleAddTable}
        nextTableNumberHint={allTables.length + 1}
      />

      {/* 3. Assign Guest to Table Modal */}
      <AssignGuestModal
        isOpen={isAssignGuestOpen}
        onClose={() => setIsAssignGuestOpen(false)}
        availableTables={allTables.filter((t) => t.status === "vacant")}
        onAssignGuest={handleAssignGuest}
      />

      {/* 4. Table Details / Reservation Drawer */}
      <ReservationDetailSlide
        isOpen={isDetailSlideOpen}
        onClose={() => setIsDetailSlideOpen(false)}
        selectedTable={selectedTable}
        selectedReservation={selectedReservation}
        onSeatGuests={(tableId) => {
          setIsDetailSlideOpen(false);
          setWizardTableId(tableId);
          setIsTakeOrderWizardOpen(true);
        }}
        onCancelReservation={(resId) => cancelReservationMutation.mutate(resId)}
        onVacateTable={(tableId) => vacateTableMutation.mutate(tableId)}
        onOpenNewBooking={(tableId) => {
          setBookingTableId(tableId);
          setIsNewReservationOpen(true);
        }}
        onOpenEditOrder={(tbl) => {
          setIsDetailSlideOpen(false);
          navigate({
            to: "/pos/billing",
            search: {
              orderType: "dine_in",
              table: tbl.tableNumber,
              guests: tbl.capacity,
            },
          });
        }}
      />

      {/* 5. New Reservation Modal */}
      <NewReservationModal
        isOpen={isNewReservationOpen}
        onClose={() => setIsNewReservationOpen(false)}
        tables={allTables}
        preselectedTableId={bookingTableId}
        onSaveReservation={(data) => addReservationMutation.mutate(data)}
      />

      {/* 6. Room Order Detail Slide */}
      <RoomOrderDetailSlide
        isOpen={isRoomSlideOpen}
        onClose={() => setIsRoomSlideOpen(false)}
        order={selectedRoomOrder}
        onUpdateStatus={(orderId, status) => updateRoomStatusMutation.mutate({ orderId, status })}
        onClearTray={(orderId) => clearTrayMutation.mutate(orderId)}
        onOpenAddItems={() => {
          if (selectedRoomOrder) {
            setIsRoomSlideOpen(false);
            navigate({
              to: "/pos/billing",
              search: {
                orderType: "room_service",
                room: selectedRoomOrder.roomNumber,
                guests: 2,
                guestName: selectedRoomOrder.guest?.name || "",
              },
            });
          }
        }}
      />

      {/* 7. Room Order Wizard Modal (Card in Middle, Waiter & Pax -> Tabular Menu + Live Bill + Hold) */}
      <RoomOrderWizardModal
        isOpen={isRoomWizardOpen}
        onClose={() => setIsRoomWizardOpen(false)}
        room={selectedRoomForWizard}
        heldOrder={activeHeldOrder}
        onConfirmOrder={handleConfirmRoomOrder}
        onHoldOrder={handleHoldRoomOrder}
      />

      <RoomFolioOrderSlide
        isOpen={Boolean(folioPreviewRoom)}
        onClose={() => setFolioPreviewRoom(null)}
        room={folioPreviewRoom}
      />

      {/* 8. Add Items to Room Order Modal */}
      <AddItemsToOrderModal
        isOpen={isAddItemsModalOpen}
        onClose={() => setIsAddItemsModalOpen(false)}
        order={selectedRoomOrder}
        onConfirmAddItems={handleConfirmAddItems}
      />
    </div>
  );
}


