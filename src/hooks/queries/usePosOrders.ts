import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLiveOrdersSummary,
  getInitialLiveOrdersData,
  getAllOrders,
  getInitialAllOrdersData,
  getOnlineOrders,
  getInitialOnlineOrdersData,
  getKotOrders,
  getInitialKotData,
  getDueBills,
  getCurrentOrdersTimeline,
  advanceCurrentOrderStage,
  markKotPrepared,
  settleDueBill,
  acceptOnlineOrderToKitchen,
  cancelOnlineOrder,
  dispatchNewOnlineOrder,
  type DueBill,
  type CurrentOrderRecord,
} from "@/services/posOrdersService";
import { POS_TABLES_QUERY_KEY, POS_TABLE_STATS_QUERY_KEY } from "./usePosTables";

export function useLiveOrders() {
  return useQuery({
    queryKey: ["pos", "orders", "live"],
    queryFn: () => getLiveOrdersSummary(),
    initialData: () => getInitialLiveOrdersData(),
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30,
  });
}

export function useCurrentOrdersTimeline() {
  return useQuery({
    queryKey: ["pos", "orders", "current-timeline"],
    queryFn: async (): Promise<CurrentOrderRecord[]> => getCurrentOrdersTimeline(),
    initialData: () => getCurrentOrdersTimeline(),
    staleTime: 1000 * 5,
    refetchInterval: 1000 * 15,
  });
}

export function useAdvanceCurrentOrderStageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderNumber: string) => advanceCurrentOrderStage(orderNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "current-timeline"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "live"] });
    },
  });
}

export function useAllOrders(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["pos", "orders", "all", filters],
    queryFn: () => getAllOrders(filters),
    initialData: () => getInitialAllOrdersData(),
    staleTime: 1000 * 30,
  });
}

export function useOnlineOrders(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["pos", "orders", "online", filters],
    queryFn: () => getOnlineOrders(filters),
    initialData: () => getInitialOnlineOrdersData(),
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30,
  });
}

export function useKotOrders(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["pos", "orders", "kot", filters],
    queryFn: () => getKotOrders(filters),
    initialData: () => getInitialKotData(),
    staleTime: 1000 * 5,
    refetchInterval: 1000 * 15,
  });
}

export function useDueBills() {
  return useQuery({
    queryKey: ["pos", "orders", "due-bills"],
    queryFn: () => getDueBills(),
    staleTime: 1000 * 5,
    refetchInterval: 1000 * 15,
  });
}

export function useMarkKotPreparedMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (kotId: number) => markKotPrepared(kotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "kot"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "due-bills"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "live"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "current-timeline"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "all"] });
      queryClient.invalidateQueries({ queryKey: POS_TABLES_QUERY_KEY });
    },
  });
}

export function useSettleDueBillMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      billId,
      paymentMode,
      paidAmount,
    }: {
      billId: string;
      paymentMode: "Cash" | "Card" | "UPI" | "Room Charge" | "Split";
      paidAmount?: number;
    }) => settleDueBill(billId, paymentMode, paidAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "due-bills"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "all"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "live"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "current-timeline"] });
      queryClient.invalidateQueries({ queryKey: POS_TABLES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: POS_TABLE_STATS_QUERY_KEY });
    },
  });
}

export function useAcceptOnlineOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => acceptOnlineOrderToKitchen(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "online"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "kot"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "live"] });
    },
  });
}

export function useCancelOnlineOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => cancelOnlineOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "online"] });
    },
  });
}


