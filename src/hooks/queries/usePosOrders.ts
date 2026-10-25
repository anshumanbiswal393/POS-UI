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
  advanceCurrentOrderById,
  markKotPrepared,
  markKotReadyLive,
  markKotServedLive,
  settleDueBill,
  settleDueBillLive,
  acceptOnlineOrderToKitchen,
  cancelOnlineOrder,
  type DueBill,
  type CurrentOrderRecord,
} from "@/services/posOrdersService";
import { POS_TABLES_QUERY_KEY, POS_TABLE_STATS_QUERY_KEY } from "./usePosTables";
import { useOutletContext } from "@/context/PosOutletContext";
import { isBackendOutletId } from "@/utils/outletId";

function useActiveOutletId() {
  const { activeOutlet } = useOutletContext();
  return activeOutlet?.id;
}

export function useLiveOrders() {
  const outletId = useActiveOutletId();
  const live = isBackendOutletId(outletId);
  return useQuery({
    queryKey: ["pos", "orders", "live", outletId],
    queryFn: () => getLiveOrdersSummary(outletId),
    initialData: live ? undefined : () => getInitialLiveOrdersData(),
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30,
  });
}

export function useCurrentOrdersTimeline() {
  const outletId = useActiveOutletId();
  const live = isBackendOutletId(outletId);
  return useQuery({
    queryKey: ["pos", "orders", "current-timeline", outletId],
    queryFn: async (): Promise<CurrentOrderRecord[]> => getCurrentOrdersTimeline(outletId),
    initialData: live ? undefined : [],
    staleTime: 1000 * 5,
    refetchInterval: 1000 * 15,
  });
}

export function useAdvanceCurrentOrderStageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderIdOrNumber: string) => advanceCurrentOrderById(orderIdOrNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "current-timeline"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "live"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "kot"] });
    },
  });
}

export function useAllOrders(filters?: Record<string, any>) {
  const outletId = useActiveOutletId();
  const live = isBackendOutletId(outletId);
  return useQuery({
    queryKey: ["pos", "orders", "all", outletId, filters],
    queryFn: () => getAllOrders(filters, outletId),
    initialData: live ? undefined : () => getInitialAllOrdersData(),
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
  const outletId = useActiveOutletId();
  const live = isBackendOutletId(outletId);
  return useQuery({
    queryKey: ["pos", "orders", "kot", outletId, filters],
    queryFn: () => getKotOrders(filters, outletId),
    initialData: live ? undefined : () => getInitialKotData(),
    staleTime: 1000 * 5,
    refetchInterval: 1000 * 15,
  });
}

export function useDueBills() {
  const outletId = useActiveOutletId();
  return useQuery({
    queryKey: ["pos", "orders", "due-bills", outletId],
    queryFn: () => getDueBills(outletId),
    staleTime: 1000 * 5,
    refetchInterval: 1000 * 15,
  });
}

export function useMarkKotPreparedMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: number | { ticketId?: string; kotId?: number }) => {
      if (typeof input === "object" && input.ticketId && /^[0-9a-f-]{36}$/i.test(input.ticketId)) {
        return markKotReadyLive(input.ticketId);
      }
      const kotId = typeof input === "number" ? input : Number(input.kotId);
      return markKotPrepared(kotId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "kot"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "live"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "current-timeline"] });
    },
  });
}

export function useMarkKotServedMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ticketId: string) => markKotServedLive(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "kot"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "live"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "current-timeline"] });
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
    }) => settleDueBillLive(billId, paymentMode, paidAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "due-bills"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "all"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "live"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "current-timeline"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "kot"] });
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
