import httpClient from "@/utils/httpClient";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { isBackendOutletId } from "@/utils/outletId";
import type {
  DayEndDetail,
  DayEndRangeResponse,
  DayEndRecord,
  PosSalesReportResponse,
  ReportNotifyPrefs,
} from "@/types/posReports";

export function reportScope(outletId?: string | null) {
  if (!isBackendOutletId(outletId)) return null;
  return { outlet_id: outletId, outletId };
}

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function rangeLastDays(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - Math.max(days - 1, 0));
  return { from: isoDate(from), to: isoDate(to) };
}

export function rangeThisMonth(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: isoDate(from), to: isoDate(now) };
}

const NOTIFY_KEY = (outletId: string) => `pos_report_notify_${outletId}`;

export const DEFAULT_NOTIFY_PREFS: ReportNotifyPrefs = {
  emailAlerts: true,
  whatsappAlerts: false,
  scheduleTime: "23:30",
};

export function loadReportNotifyPrefs(outletId?: string | null): ReportNotifyPrefs {
  if (!outletId || typeof window === "undefined") return DEFAULT_NOTIFY_PREFS;
  try {
    const raw = localStorage.getItem(NOTIFY_KEY(outletId));
    if (!raw) return DEFAULT_NOTIFY_PREFS;
    return { ...DEFAULT_NOTIFY_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFY_PREFS;
  }
}

export function saveReportNotifyPrefs(outletId: string | null | undefined, prefs: ReportNotifyPrefs) {
  if (!outletId || typeof window === "undefined") return;
  localStorage.setItem(NOTIFY_KEY(outletId), JSON.stringify(prefs));
}

export async function fetchSalesReport(params: {
  outletId?: string | null;
  kind: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}): Promise<PosSalesReportResponse> {
  const scope = reportScope(params.outletId);
  if (!scope) {
    return { success: true, count: 0, records: [] };
  }
  const res = await httpClient.get<PosSalesReportResponse>(API_ENDPOINTS.REPORTS.SALES, {
    params: {
      ...scope,
      kind: params.kind,
      startDate: params.fromDate,
      endDate: params.toDate,
      fromDate: params.fromDate,
      toDate: params.toDate,
      limit: params.limit ?? 200,
    },
  });
  const data = res.data || { success: true, count: 0, records: [] };
  const records = data.records?.length ? data.records : data.items || [];
  return { ...data, records, count: data.count ?? records.length };
}

export async function fetchDayEndRange(params: {
  outletId?: string | null;
  startDate?: string;
  endDate?: string;
}): Promise<DayEndRangeResponse> {
  const scope = reportScope(params.outletId);
  if (!scope) {
    return { success: true, startDate: "", endDate: "", count: 0, records: [] };
  }
  const res = await httpClient.get<DayEndRangeResponse>(API_ENDPOINTS.REPORTS.DAY_END, {
    params: {
      ...scope,
      startDate: params.startDate,
      endDate: params.endDate,
      start_date: params.startDate,
      end_date: params.endDate,
    },
  });
  const records: DayEndRecord[] = (res.data.records || []).map((r) => ({
    ...r,
    id: r.id || r.businessDate || r.date,
    orderCount: Number(r.orderCount || 0),
    totalAmount: Number(r.totalAmount || 0),
  }));
  return { ...res.data, records, count: records.length };
}

export async function fetchDayEndDetail(params: {
  outletId?: string | null;
  businessDate: string;
}): Promise<DayEndDetail | null> {
  const scope = reportScope(params.outletId);
  if (!scope) return null;
  const res = await httpClient.get<DayEndDetail>(API_ENDPOINTS.REPORTS.DAY_END, {
    params: { ...scope, businessDate: params.businessDate, business_date: params.businessDate },
  });
  return res.data;
}

export async function closePosDay(params: {
  outletId?: string | null;
  businessDate: string;
}): Promise<DayEndDetail> {
  const scope = reportScope(params.outletId);
  if (!scope) {
    throw new Error("Select a live outlet to close the day.");
  }
  const res = await httpClient.post<DayEndDetail>(API_ENDPOINTS.REPORTS.DAY_END_CLOSE, {
    ...scope,
    businessDate: params.businessDate,
    business_date: params.businessDate,
  });
  return res.data;
}
