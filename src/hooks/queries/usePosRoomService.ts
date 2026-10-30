import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { posRoomService, setRoomsOutletScope } from "@/services/posRoomService";
import { useOutletContext } from "@/context/PosOutletContext";
import type {
  RoomFloor,
  RoomServiceOrderStatus,
  RoomServiceOrder,
  RoomOrderItem,
} from "@/types/posRoomService";

export const POS_ROOM_SERVICE_ORDERS_KEY = ["pos", "room-service", "orders"];
export const POS_ROOM_SERVICE_ROOMS_KEY = ["pos", "room-service", "rooms"];
export const POS_ROOM_SERVICE_KPIS_KEY = ["pos", "room-service", "kpis"];

export function useRoomServiceOrders(floor?: RoomFloor) {
  return useQuery({
    queryKey: [...POS_ROOM_SERVICE_ORDERS_KEY, floor],
    queryFn: () => posRoomService.getOrders(floor),
    staleTime: 1000 * 10,
  });
}

export function useHotelRooms(floor?: RoomFloor) {
  const { activeOutlet } = useOutletContext();
  useEffect(() => {
    setRoomsOutletScope({
      outletId: activeOutlet?.id,
      propertyId: activeOutlet?.propertyId,
      tenantId: activeOutlet?.tenantId,
      highwayDemo: false,
    });
  }, [activeOutlet?.id, activeOutlet?.propertyId, activeOutlet?.tenantId]);
  return useQuery({
    queryKey: [...POS_ROOM_SERVICE_ROOMS_KEY, floor, activeOutlet?.id, activeOutlet?.propertyId],
    queryFn: () => {
      setRoomsOutletScope({
        outletId: activeOutlet?.id,
        propertyId: activeOutlet?.propertyId,
        tenantId: activeOutlet?.tenantId,
        highwayDemo: false,
      });
      return posRoomService.getRooms(floor);
    },
    staleTime: 1000 * 10,
  });
}

export function useRoomServiceKpis() {
  return useQuery({
    queryKey: POS_ROOM_SERVICE_KPIS_KEY,
    queryFn: () => posRoomService.getKpis(),
    staleTime: 1000 * 10,
  });
}

export function useUpdateRoomOrderStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: RoomServiceOrderStatus }) =>
      posRoomService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_ROOM_SERVICE_ORDERS_KEY });
      queryClient.invalidateQueries({ queryKey: POS_ROOM_SERVICE_ROOMS_KEY });
      queryClient.invalidateQueries({ queryKey: POS_ROOM_SERVICE_KPIS_KEY });
    },
  });
}

export function useAssignRunnerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, runnerName }: { orderId: string; runnerName: string }) =>
      posRoomService.assignRunner(orderId, runnerName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_ROOM_SERVICE_ORDERS_KEY });
      queryClient.invalidateQueries({ queryKey: POS_ROOM_SERVICE_ROOMS_KEY });
      queryClient.invalidateQueries({ queryKey: POS_ROOM_SERVICE_KPIS_KEY });
    },
  });
}

export function useClearTrayMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => posRoomService.clearTray(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_ROOM_SERVICE_ORDERS_KEY });
      queryClient.invalidateQueries({ queryKey: POS_ROOM_SERVICE_ROOMS_KEY });
      queryClient.invalidateQueries({ queryKey: POS_ROOM_SERVICE_KPIS_KEY });
    },
  });
}

export function useCreateRoomOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newOrderData: Omit<RoomServiceOrder, "id" | "createdAt" | "elapsedMinutes">) =>
      posRoomService.addOrder(newOrderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_ROOM_SERVICE_ORDERS_KEY });
      queryClient.invalidateQueries({ queryKey: POS_ROOM_SERVICE_ROOMS_KEY });
      queryClient.invalidateQueries({ queryKey: POS_ROOM_SERVICE_KPIS_KEY });
    },
  });
}

export function useAddItemsToOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, newItems }: { orderId: string; newItems: RoomOrderItem[] }) =>
      posRoomService.addItemsToOrder(orderId, newItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_ROOM_SERVICE_ORDERS_KEY });
      queryClient.invalidateQueries({ queryKey: POS_ROOM_SERVICE_ROOMS_KEY });
      queryClient.invalidateQueries({ queryKey: POS_ROOM_SERVICE_KPIS_KEY });
    },
  });
}
