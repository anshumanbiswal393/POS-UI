import React, { useState } from "react";
import {
  useRoomServiceOrders,
  useHotelRooms,
  useRoomServiceKpis,
  useUpdateRoomOrderStatusMutation,
  useClearTrayMutation,
  useCreateRoomOrderMutation,
  useAddItemsToOrderMutation,
} from "@/hooks/queries/usePosRoomService";
import { RoomServiceKpiStrip } from "./RoomServiceKpiStrip";
import { RoomServiceOrderCard } from "./RoomServiceOrderCard";
import { RoomGridFloorView } from "./RoomGridFloorView";
import { RoomOrderDetailSlide } from "./RoomOrderDetailSlide";
import { NewRoomOrderModal } from "./NewRoomOrderModal";
import { AddItemsToOrderModal } from "./AddItemsToOrderModal";
import type {
  RoomFloor,
  RoomServiceOrder,
  RoomServiceOrderStatus,
  RoomOrderItem,
} from "@/types/posRoomService";
import {
  Utensils,
  Plus,
  Search,
  LayoutGrid,
  ListOrdered,
  BedDouble,
  RotateCw,
  SlidersHorizontal,
} from "lucide-react";

export function PosRoomServiceManager() {
  const [viewMode, setViewMode] = useState<"pipeline" | "floor_grid">("pipeline");
  const [selectedFloor, setSelectedFloor] = useState<RoomFloor>("All");
  const [statusFilter, setStatusFilter] = useState<"all" | RoomServiceOrderStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Slide drawer & modal state
  const [selectedOrder, setSelectedOrder] = useState<RoomServiceOrder | null>(null);
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isAddItemsModalOpen, setIsAddItemsModalOpen] = useState(false);
  const [targetRoomNumber, setTargetRoomNumber] = useState<string | undefined>(undefined);

  // Queries
  const { data: orders = [], refetch: refetchOrders } = useRoomServiceOrders(selectedFloor);
  const { data: rooms = [], refetch: refetchRooms } = useHotelRooms(selectedFloor);
  const { data: kpis } = useRoomServiceKpis();

  // Keep selectedOrder in sync with latest orders query data
  const currentSelectedOrder = selectedOrder
    ? orders.find((o) => o.id === selectedOrder.id) || selectedOrder
    : null;

  // Mutations
  const updateStatusMutation = useUpdateRoomOrderStatusMutation();
  const clearTrayMutation = useClearTrayMutation();
  const createOrderMutation = useCreateRoomOrderMutation();
  const addItemsMutation = useAddItemsToOrderMutation();

  const handleConfirmAddItems = (orderId: string, newItems: RoomOrderItem[]) => {
    addItemsMutation.mutate(
      { orderId, newItems },
      {
        onSuccess: (updatedOrder) => {
          setSelectedOrder(updatedOrder);
        },
      },
    );
  };

  // Handlers
  const handleAdvanceStatus = (orderId: string, currentStatus: RoomServiceOrderStatus) => {
    let nextStatus: RoomServiceOrderStatus = "tray_ready";
    if (currentStatus === "kitchen_prep") nextStatus = "tray_ready";
    else if (currentStatus === "tray_ready") nextStatus = "dispatched";
    else if (currentStatus === "dispatched") nextStatus = "delivered";
    else if (currentStatus === "delivered") nextStatus = "clearance_needed";
    else if (currentStatus === "clearance_needed") {
      clearTrayMutation.mutate(orderId);
      return;
    }

    updateStatusMutation.mutate({ orderId, status: nextStatus });
  };

  const handleSelectOrder = (order: RoomServiceOrder) => {
    setSelectedOrder(order);
    setIsSlideOpen(true);
  };

  const handleOpenNewOrder = (roomNumber?: string) => {
    setTargetRoomNumber(roomNumber);
    setIsNewModalOpen(true);
  };

  // Filtered orders for pipeline
  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRoom = o.roomNumber.toLowerCase().includes(q);
      const matchGuest = o.guest.name.toLowerCase().includes(q);
      const matchOrder = o.orderNumber.toLowerCase().includes(q);
      return matchRoom || matchGuest || matchOrder;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-[calc(100dvh-6rem)] min-h-[520px] w-full overflow-hidden bg-slate-100 font-sans rounded-xl border border-slate-200/80 shadow-2xs">
      {/* 1. Header Toolbar */}
      <div className="p-4 sm:p-6 pb-4 bg-white border-b border-slate-200/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-xs">
                <BedDouble className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none">
                  Room Orders
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Guest room orders, butler dispatch queue, and PMS folio billing.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search room, guest..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-56 pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* View Mode Toggle: Pipeline vs Floor Grid */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => setViewMode("pipeline")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "pipeline"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Queue</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("floor_grid")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "floor_grid"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Floor Grid</span>
              </button>
            </div>

            {/* New Room Order Button */}
            <button
              type="button"
              onClick={() => handleOpenNewOrder()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-pressed text-primary-foreground font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Take Room Order</span>
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={() => {
                refetchOrders();
                refetchRooms();
              }}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
              title="Refresh Queue"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Pipeline Filter Pills (Only visible in Pipeline View) */}
        {viewMode === "pipeline" && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
              }`}
            >
              All Active ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("kitchen_prep")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "kitchen_prep"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
              }`}
            >
              Kitchen Prep ({orders.filter((o) => o.status === "kitchen_prep").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("tray_ready")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "tray_ready"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
              }`}
            >
              Tray Packed ({orders.filter((o) => o.status === "tray_ready").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("dispatched")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "dispatched"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
              }`}
            >
              En Route ({orders.filter((o) => o.status === "dispatched").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("delivered")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "delivered"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
              }`}
            >
              In Room ({orders.filter((o) => o.status === "delivered").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("clearance_needed")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === "clearance_needed"
                  ? "bg-rose-600 text-white shadow-xs animate-pulse"
                  : "bg-rose-50 text-rose-800 hover:bg-rose-100"
              }`}
            >
              Tray Clearance ({orders.filter((o) => o.status === "clearance_needed").length})
            </button>
          </div>
        )}
      </div>

      {/* 3. Operational KPI Strip */}
      <RoomServiceKpiStrip kpis={kpis} />

      {/* 4. Main Body: Queue Pipeline vs Floor Grid */}
      {viewMode === "pipeline" ? (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Utensils className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-sm">No room service orders in this queue.</p>
              <button
                type="button"
                onClick={() => handleOpenNewOrder()}
                className="mt-3 text-xs font-bold text-teal-700 hover:underline"
              >
                + Create a new room order
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => (
                <RoomServiceOrderCard
                  key={order.id}
                  order={order}
                  onSelectOrder={handleSelectOrder}
                  onAdvanceStatus={handleAdvanceStatus}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <RoomGridFloorView
          rooms={rooms}
          selectedFloor={selectedFloor}
          onSelectFloor={setSelectedFloor}
          onSelectRoomOrder={handleSelectOrder}
          onOpenNewOrderModal={handleOpenNewOrder}
        />
      )}

      {/* 5. Order Detail Slide Drawer */}
      <RoomOrderDetailSlide
        isOpen={isSlideOpen}
        onClose={() => setIsSlideOpen(false)}
        order={currentSelectedOrder}
        onUpdateStatus={(orderId, status) => {
          updateStatusMutation.mutate({ orderId, status });
        }}
        onClearTray={(orderId) => {
          clearTrayMutation.mutate(orderId);
        }}
        onOpenAddItems={() => setIsAddItemsModalOpen(true)}
      />

      {/* 6. New Order Dialog */}
      <NewRoomOrderModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        rooms={rooms}
        preselectedRoomNumber={targetRoomNumber}
        onCreateOrder={(data) => {
          createOrderMutation.mutate(data);
        }}
      />

      {/* 7. Add Items Later (Supplementary KOT) Modal */}
      <AddItemsToOrderModal
        isOpen={isAddItemsModalOpen}
        onClose={() => setIsAddItemsModalOpen(false)}
        order={currentSelectedOrder}
        onConfirmAddItems={handleConfirmAddItems}
      />
    </div>
  );
}
