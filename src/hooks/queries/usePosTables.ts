import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { posTablesService, setTablesOutletScope } from "@/services/posTablesService";
import type { DiningArea, ReservationItem } from "@/types/posTables";
import { useOutletContext } from "@/context/PosOutletContext";

export const POS_TABLES_QUERY_KEY = ["pos", "tables"];
export const POS_RESERVATIONS_QUERY_KEY = ["pos", "reservations"];
export const POS_TABLE_STATS_QUERY_KEY = ["pos", "table-stats"];
export const POS_AREAS_QUERY_KEY = ["pos", "dining-areas"];

function useOutletScopedTables() {
  const { activeOutlet } = useOutletContext();
  const outletId = activeOutlet?.id || "";

  useEffect(() => {
    setTablesOutletScope(outletId || null);
  }, [outletId]);

  return outletId;
}

export function useDiningAreas() {
  const outletId = useOutletScopedTables();
  return useQuery({
    queryKey: [...POS_AREAS_QUERY_KEY, outletId],
    queryFn: () => {
      setTablesOutletScope(outletId);
      return posTablesService.getAreas();
    },
    staleTime: 1000 * 60,
    enabled: Boolean(outletId),
  });
}

export function useAddAreaMutation() {
  const outletId = useOutletScopedTables();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (areaName: string) => {
      setTablesOutletScope(outletId);
      return posTablesService.addArea(areaName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_AREAS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: POS_TABLES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: POS_TABLE_STATS_QUERY_KEY });
    },
  });
}

export function useAddTableMutation() {
  const outletId = useOutletScopedTables();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      tableNumber: string;
      capacity: number;
      area: string;
      shape?: "rectangle" | "square" | "circle";
    }) => {
      setTablesOutletScope(outletId);
      return posTablesService.addTable(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_TABLES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: POS_TABLE_STATS_QUERY_KEY });
    },
  });
}

export function usePosTables(area?: DiningArea) {
  const outletId = useOutletScopedTables();
  return useQuery({
    queryKey: [...POS_TABLES_QUERY_KEY, outletId, area],
    queryFn: () => {
      setTablesOutletScope(outletId);
      return posTablesService.getTables(area);
    },
    staleTime: 1000 * 10,
    enabled: Boolean(outletId),
  });
}

export function usePosReservations() {
  const outletId = useOutletScopedTables();
  return useQuery({
    queryKey: [...POS_RESERVATIONS_QUERY_KEY, outletId],
    queryFn: () => {
      setTablesOutletScope(outletId);
      return posTablesService.getReservations();
    },
    staleTime: 1000 * 10,
    enabled: Boolean(outletId),
  });
}

export function usePosTableStats(area?: DiningArea) {
  const outletId = useOutletScopedTables();
  return useQuery({
    queryKey: [...POS_TABLE_STATS_QUERY_KEY, outletId, area],
    queryFn: () => {
      setTablesOutletScope(outletId);
      return posTablesService.getStats(area);
    },
    staleTime: 1000 * 10,
    enabled: Boolean(outletId),
  });
}

export function useSeatGuestsMutation() {
  const outletId = useOutletScopedTables();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, reservationId }: { tableId: string; reservationId?: string }) => {
      setTablesOutletScope(outletId);
      return posTablesService.seatGuests(tableId, reservationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_TABLES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: POS_RESERVATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: POS_TABLE_STATS_QUERY_KEY });
    },
  });
}

export function useCancelReservationMutation() {
  const outletId = useOutletScopedTables();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reservationId: string) => {
      setTablesOutletScope(outletId);
      return posTablesService.cancelReservation(reservationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_TABLES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: POS_RESERVATIONS_QUERY_KEY });
    },
  });
}

export function useVacateTableMutation() {
  const outletId = useOutletScopedTables();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tableId: string) => {
      setTablesOutletScope(outletId);
      return posTablesService.vacateTable(tableId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_TABLES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: POS_RESERVATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: POS_TABLE_STATS_QUERY_KEY });
    },
  });
}

export function useAddReservationMutation() {
  const outletId = useOutletScopedTables();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ReservationItem, "id" | "createdAt" | "status">) => {
      setTablesOutletScope(outletId);
      return posTablesService.addReservation(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_TABLES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: POS_RESERVATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: POS_TABLE_STATS_QUERY_KEY });
    },
  });
}

export function useCreateTableOrderMutation() {
  const outletId = useOutletScopedTables();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof posTablesService.createTableOrder>[0]) => {
      setTablesOutletScope(outletId);
      return posTablesService.createTableOrder(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_TABLES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: POS_RESERVATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: POS_TABLE_STATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "live"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "kot"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "all"] });
    },
  });
}

export function useUpdateTableOrderMutation() {
  const outletId = useOutletScopedTables();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof posTablesService.updateTableOrder>[0]) => {
      setTablesOutletScope(outletId);
      return posTablesService.updateTableOrder(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_TABLES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: POS_TABLE_STATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "live"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "kot"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "due-bills"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "all"] });
    },
  });
}
