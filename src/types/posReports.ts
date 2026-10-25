export type PosReportKind =
  | "dashboard"
  | "overview"
  | "items"
  | "invoices"
  | "biller"
  | "channels"
  | "daywise"
  | "discounts"
  | "category"
  | "customers"
  | "hourly"
  | "payments"
  | "gst";

export type PosReportCatalogId =
  | "REP-01"
  | "REP-02"
  | "REP-03"
  | "REP-04"
  | "REP-05"
  | "REP-06"
  | "REP-07"
  | "REP-08"
  | "REP-09"
  | "REP-10"
  | "REP-11"
  | "REP-12";

export interface PosReportChannel {
  label: string;
  amount: number;
  pct: number;
  color?: string;
}

export interface PosReportTopDish {
  name: string;
  category: string;
  qty: number;
  revenue: number;
}

export interface PosReportKpis {
  grossSales: number;
  netSales: number;
  totalBills: number;
  avgTicket: number;
  dineInVolume: number;
  billsPerDay: number;
  grossDeltaPct: number;
  avgTicketDelta: number;
  taxes: number;
  discounts: number;
}

export interface PosSalesReportResponse {
  success: boolean;
  kind?: string;
  startDate?: string;
  endDate?: string;
  count: number;
  records: Array<Record<string, unknown>>;
  items?: Array<Record<string, unknown>>;
  totalRevenue?: number;
  kpis?: PosReportKpis;
  channels?: PosReportChannel[];
  topDishes?: PosReportTopDish[];
  detail?: string;
}

export interface DayEndRecord {
  id: string;
  date: string;
  businessDate?: string;
  orderCount: number;
  totalAmount: number;
  isClosed?: boolean;
}

export interface DayEndRangeResponse {
  success: boolean;
  startDate: string;
  endDate: string;
  count: number;
  records: DayEndRecord[];
}

export interface DayEndDetail {
  businessDate: string;
  orderCount: number;
  totalAmount: number;
  byPaymentMode: Record<string, number>;
  openDueCount: number;
  openDueAmount: number;
  isClosed?: boolean;
  closedAt?: string | null;
}

export interface ReportNotifyPrefs {
  emailAlerts: boolean;
  whatsappAlerts: boolean;
  scheduleTime: string;
}
