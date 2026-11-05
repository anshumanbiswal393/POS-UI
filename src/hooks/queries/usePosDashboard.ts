import { useQuery } from "@tanstack/react-query";
import { getPosDashboardData } from "@/services/posDashboardService";
import type { DashboardFilterParams, PosDashboardData } from "@/types/posDashboard";
import { useOutletContext } from "@/context/PosOutletContext";

export const POS_DASHBOARD_QUERY_KEY = ["pos", "dashboard"] as const;

/**
 * Custom TanStack Query hook for POS Dashboard
 * Supports auto-refetching, smooth background updates, and filter state caching.
 */
export function usePosDashboard(filters?: DashboardFilterParams) {
  const { activeOutlet } = useOutletContext();
  const outletId = activeOutlet?.id || filters?.outletId;
  const mergedFilters: DashboardFilterParams = { ...filters, outletId };

  return useQuery<PosDashboardData, Error>({
    queryKey: [...POS_DASHBOARD_QUERY_KEY, mergedFilters],
    queryFn: () => getPosDashboardData(mergedFilters),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 5,
    refetchInterval: 1000 * 10,
    enabled: Boolean(outletId),
  });
}
