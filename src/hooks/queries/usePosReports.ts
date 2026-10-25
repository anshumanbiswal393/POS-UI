import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "@/context/PosOutletContext";
import { isBackendOutletId } from "@/utils/outletId";
import {
  closePosDay,
  fetchDayEndDetail,
  fetchDayEndRange,
  fetchSalesReport,
} from "@/services/posReportsService";

function useActiveOutletId() {
  const { activeOutlet } = useOutletContext();
  return activeOutlet?.id;
}

export const POS_REPORTS_QUERY_KEY = ["pos", "reports"] as const;

export function usePosSalesReport(opts: {
  kind?: string | null;
  fromDate: string;
  toDate: string;
  enabled?: boolean;
}) {
  const outletId = useActiveOutletId();
  const live = isBackendOutletId(outletId);
  const enabled = Boolean(live && opts.kind && (opts.enabled ?? true));

  return useQuery({
    queryKey: [...POS_REPORTS_QUERY_KEY, "sales", outletId, opts.kind, opts.fromDate, opts.toDate],
    queryFn: () =>
      fetchSalesReport({
        outletId,
        kind: opts.kind as string,
        fromDate: opts.fromDate,
        toDate: opts.toDate,
      }),
    enabled,
    staleTime: 1000 * 30,
  });
}

export function usePosReportsDashboard(fromDate: string, toDate: string, enabled = true) {
  return usePosSalesReport({
    kind: "dashboard",
    fromDate,
    toDate,
    enabled,
  });
}

export function usePosDayEnd(startDate: string, endDate: string, enabled = true) {
  const outletId = useActiveOutletId();
  const live = isBackendOutletId(outletId);

  return useQuery({
    queryKey: [...POS_REPORTS_QUERY_KEY, "day-end", outletId, startDate, endDate],
    queryFn: () => fetchDayEndRange({ outletId, startDate, endDate }),
    enabled: Boolean(live && enabled),
    staleTime: 1000 * 30,
  });
}

export function usePosDayEndDetail(businessDate?: string | null) {
  const outletId = useActiveOutletId();
  const live = isBackendOutletId(outletId);
  return useQuery({
    queryKey: [...POS_REPORTS_QUERY_KEY, "day-end-detail", outletId, businessDate],
    queryFn: () => fetchDayEndDetail({ outletId, businessDate: businessDate as string }),
    enabled: Boolean(live && businessDate),
  });
}

export function useClosePosDayMutation() {
  const outletId = useActiveOutletId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (businessDate: string) => closePosDay({ outletId, businessDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...POS_REPORTS_QUERY_KEY, "day-end"] });
    },
  });
}
