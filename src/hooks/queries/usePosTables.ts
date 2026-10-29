import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
    setTablesOutletScope(outletId || null, false);
  }, [outletId]);

  return { outletId, highwayDemo: false };
}

export function useDiningAreas() {
  const { outletId, highwayDemo } = useOutletScopedTables();
  return useQuery({
    queryKey: [...POS_AREAS_QUERY_KEY, outletId, highwayDemo],
    queryFn: () => {
      setTablesOutletScope(outletId, highwayDemo);
      return posTablesService.getAreas();
    },
    staleTime: 1000 * 60,
    enabled: Boolean(outletId),
  });
}

export function useAddAreaMutation() {
  const { outletId, highwayDemo } = useOutletScopedTables();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (areaName: string) => {
      setTablesOutletScope(outletId, highwayDemo);
      return posTablesService.addArea(areaName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_AREAS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: POS_TABLES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: POS_TABLE_STATS_QUERY_KEY });
      toast.success("Dining area saved");
    },
    onError: (err: unknown) => {
      const message =
        (err as { message?: string })?.message ||
        (err as { data?: { detail?: string } })?.data?.detail ||
        "Could not save dining area";
      toast.error(String(message));
    },
  });
}

export function useAddTableMutation() {
  const { outletId, highwayDemo } = useOutletScopedTables();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      tableNumber: string;
      capacity: number;
      area: string;
      shape?: "rectangle" | "square" | "circle";
    }) => {
      setTablesOutletScope(outletId, highwayDemo);
      return posTablesService.addTable(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_TABLES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: POS_TABLE_STATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: POS_AREAS_QUERY_KEY });
      toast.success("Table saved");
    },
    onError: (err: unknown) => {
      const message =
        (err as { message?: string })?.message ||
        (err as { data?: { detail?: string } })?.data?.detail ||
        "Could not save table";
      toast.error(String(message));
    },
  });
}

export function usePosTables(area?: DiningArea) {
  const { outletId, highwayDemo } = useOutletScopedTables();
  return useQuery({
    queryKey: [...POS_TABLES_QUERY_KEY, outletId, area, highwayDemo],
    queryFn: () => {
      setTablesOutletScope(outletId, highwayDemo);
      return posTablesService.getTables(area);
    },
    staleTime: 1000 * 10,
    enabled: Boolean(outletId),
  });
}

export function usePosReservations() {
  const { outletId, highwayDemo } = useOutletScopedTables();
  return useQuery({
    queryKey: [...POS_RESERVATIONS_QUERY_KEY, outletId],
    queryFn: () => {
      setTablesOutletScope(outletId, highwayDemo);
      return posTablesService.getReservations();
    },
    staleTime: 1000 * 10,
    enabled: Boolean(outletId),
  });
}

export function usePosTableStats(area?: DiningArea) {
  const { outletId, highwayDemo } = useOutletScopedTables();
  return useQuery({
    queryKey: [...POS_TABLE_STATS_QUERY_KEY, outletId, area, highwayDemo],
    queryFn: () => {
      setTablesOutletScope(outletId, highwayDemo);
      return posTablesService.getStats(area);
    },
    staleTime: 1000 * 10,
    enabled: Boolean(outletId),
  });
}

export function useSeatGuestsMutation() {
  const { outletId, highwayDemo } = useOutletScopedTables();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, reservationId }: { tableId: string; reservationId?: string }) => {
      setTablesOutletScope(outletId, highwayDemo);
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
  const { outletId, highwayDemo } = useOutletScopedTables();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reservationId: string) => {
      setTablesOutletScope(outletId, highwayDemo);
      return posTablesService.cancelReservation(reservationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_TABLES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: POS_RESERVATIONS_QUERY_KEY });
    },
  });
}

export function useVacateTableMutation() {
  const { outletId, highwayDemo } = useOutletScopedTables();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tableId: string) => {
      setTablesOutletScope(outletId, highwayDemo);
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
  const { outletId, highwayDemo } = useOutletScopedTables();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ReservationItem, "id" | "createdAt" | "status">) => {
      setTablesOutletScope(outletId, highwayDemo);
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
  const { outletId, highwayDemo } = useOutletScopedTables();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof posTablesService.createTableOrder>[0]) => {
      setTablesOutletScope(outletId, highwayDemo);
      return posTablesService.createTableOrder(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_TABLES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: POS_RESERVATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: POS_TABLE_STATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "live"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "kot"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "orders", "all"] });
      toast.success("Order sent to kitchen");
    },
    onError: (err: unknown) => {
      const message =
        (err as { message?: string })?.message ||
        (err as { data?: { detail?: string } })?.data?.detail ||
        "Could not send order";
      toast.error(String(message));
    },
  });
}

export function useUpdateTableOrderMutation() {
  const { outletId, highwayDemo } = useOutletScopedTables();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof posTablesService.updateTableOrder>[0]) => {
      setTablesOutletScope(outletId, highwayDemo);
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
