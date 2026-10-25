import { useState, useMemo, useEffect } from "react";
import { Download, ChevronDown, FileText } from "lucide-react";
import { toast } from "sonner";
import { DataTableHeader, DataTableFooter, type DataTableColumn } from "@/components/common";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import { exportToExcel } from "@/utils/exportUtils";
import { useOutletContext } from "@/context/PosOutletContext";
import { isBackendOutletId } from "@/utils/outletId";
import { useClosePosDayMutation, usePosDayEnd } from "@/hooks/queries/usePosReports";
import {
  fetchDayEndDetail,
  isoDate,
  rangeLastDays,
} from "@/services/posReportsService";
import type { DayEndRecord } from "@/types/posReports";

const MOCK_RECORDS: DayEndRecord[] = [
  { id: "1", date: "1 Sep 2026", orderCount: 48, totalAmount: 36400 },
  { id: "2", date: "31 Aug 2026", orderCount: 38, totalAmount: 28726 },
  { id: "3", date: "30 Aug 2026", orderCount: 64, totalAmount: 52984 },
  { id: "4", date: "29 Aug 2026", orderCount: 61, totalAmount: 54227 },
  { id: "5", date: "28 Aug 2026", orderCount: 71, totalAmount: 71860 },
  { id: "6", date: "27 Aug 2026", orderCount: 54, totalAmount: 61031 },
  { id: "7", date: "26 Aug 2026", orderCount: 44, totalAmount: 51155 },
  { id: "8", date: "25 Aug 2026", orderCount: 50, totalAmount: 48320 },
  { id: "9", date: "24 Aug 2026", orderCount: 41, totalAmount: 39140 },
  { id: "10", date: "23 Aug 2026", orderCount: 68, totalAmount: 65400 },
];

export function DayEndSummaryView() {
  const { activeOutlet } = useOutletContext();
  const live = isBackendOutletId(activeOutlet?.id);
  const defaultRange = live ? rangeLastDays(14) : { from: "2026-08-03", to: "2026-09-02" };

  const [startDate, setStartDate] = useState(defaultRange.from);
  const [endDate, setEndDate] = useState(defaultRange.to);
  const [appliedStart, setAppliedStart] = useState(defaultRange.from);
  const [appliedEnd, setAppliedEnd] = useState(defaultRange.to);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ colId: string; direction: "asc" | "desc" } | null>(null);

  useEffect(() => {
    const range = live ? rangeLastDays(14) : { from: "2026-08-03", to: "2026-09-02" };
    setStartDate(range.from);
    setEndDate(range.to);
    setAppliedStart(range.from);
    setAppliedEnd(range.to);
    setSelectedIds([]);
    setCurrentPage(1);
  }, [live, activeOutlet?.id]);

  const dayEndQuery = usePosDayEnd(appliedStart, appliedEnd, live);
  const closeMut = useClosePosDayMutation();

  const records: DayEndRecord[] = live ? dayEndQuery.data?.records || [] : MOCK_RECORDS;

  const columns: DataTableColumn<DayEndRecord>[] = useMemo(
    () => [
      {
        id: "date",
        label: "Created Date",
        sortable: true,
        filterable: true,
        defaultWidth: 200,
        getValue: (r) => r.date,
      },
      {
        id: "orderCount",
        label: "No. Of Orders",
        sortable: true,
        filterable: true,
        align: "right",
        defaultWidth: 150,
        getValue: (r) => String(r.orderCount),
      },
      {
        id: "totalAmount",
        label: "Total (₹)",
        sortable: true,
        filterable: true,
        align: "right",
        defaultWidth: 160,
        getValue: (r) => `₹${r.totalAmount.toLocaleString("en-IN")}`,
      },
      {
        id: "actions",
        label: "Actions",
        sortable: false,
        filterable: false,
        align: "right",
        defaultWidth: 120,
      },
    ],
    [],
  );

  const sortedRecords = useMemo(() => {
    if (!sortConfig) return records;
    return [...records].sort((a, b) => {
      const field = sortConfig.colId as keyof DayEndRecord;
      const aVal = a[field];
      const bVal = b[field];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [records, sortConfig]);

  const pageSize = 10;
  const pagedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage]);

  const toggleSelectAll = () => {
    if (selectedIds.length === pagedRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pagedRecords.map((r) => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSearch = () => {
    setAppliedStart(startDate);
    setAppliedEnd(endDate);
    setCurrentPage(1);
    toast.info("Loaded day-end settlement records");
  };

  const handleShowAll = () => {
    const range = live ? rangeLastDays(30) : { from: "2026-08-03", to: "2026-09-02" };
    setStartDate(range.from);
    setEndDate(range.to);
    setAppliedStart(range.from);
    setAppliedEnd(range.to);
    setCurrentPage(1);
    toast.info("Showing all day-end summaries");
  };

  const handleExport = () => {
    exportToExcel(
      sortedRecords.map((r) => ({
        Date: r.date,
        "No. Of Orders": r.orderCount,
        "Total (₹)": r.totalAmount,
        Status: r.isClosed ? "Closed" : "Open",
      })),
      `Day_End_Summary_${appliedStart}_to_${appliedEnd}`,
      { title: "Day End Summary", dateRange: `${appliedStart} to ${appliedEnd}` },
    );
    toast.success("Exported Day End Summary to Excel");
  };

  const handleViewDetail = async (row: DayEndRecord) => {
    if (!live) {
      toast.info(`Opening day-end audit for ${row.date}`);
      return;
    }
    const businessDate = row.businessDate || row.id;
    try {
      const detail = await fetchDayEndDetail({
        outletId: activeOutlet?.id,
        businessDate,
      });
      if (!detail) {
        toast.info(`No day-end detail for ${row.date}`);
        return;
      }
      const modes = Object.entries(detail.byPaymentMode || {})
        .filter(([, amt]) => Number(amt) > 0)
        .map(([mode, amt]) => `${mode} ₹${Number(amt).toLocaleString("en-IN")}`)
        .join(" · ");
      toast.success(
        `${row.date}: ${detail.orderCount} bills, ₹${detail.totalAmount.toLocaleString("en-IN")}${
          modes ? ` — ${modes}` : ""
        }`,
      );
    } catch {
      toast.error("Could not load day-end detail");
    }
  };

  const handleCloseDays = async () => {
    if (!live) {
      toast.info("Day End Actions");
      return;
    }
    const dates = selectedIds.length
      ? sortedRecords
          .filter((r) => selectedIds.includes(r.id))
          .map((r) => r.businessDate || r.id)
      : [isoDate(new Date())];
    try {
      for (const d of dates) {
        await closeMut.mutateAsync(d);
      }
      toast.success(`Closed ${dates.length} business day(s)`);
      setSelectedIds([]);
    } catch {
      toast.error("Could not close day — check outlet and Postgres, then retry");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Day End Summary</h2>

        <div className="flex items-center gap-2">
          <ExportToExcelButton onClick={handleExport} />

          <button
            type="button"
            onClick={handleCloseDays}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            {live ? "Close Day" : "Action"} <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-[11.5px] font-semibold text-slate-600">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11.5px] font-semibold text-slate-600">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSearch}
              className="rounded-lg bg-teal-600 px-5 py-1.5 text-[12.5px] font-semibold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer"
            >
              Search
            </button>

            <button
              type="button"
              onClick={handleShowAll}
              className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              Show All
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-300 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <DataTableHeader
              columns={columns}
              data={pagedRecords}
              selectable
              isAllSelected={selectedIds.length === pagedRecords.length && pagedRecords.length > 0}
              isSomeSelected={selectedIds.length > 0 && selectedIds.length < pagedRecords.length}
              onToggleSelectAll={toggleSelectAll}
              sortConfig={sortConfig}
              onSortChange={setSortConfig}
              themeVariant="primary"
            />
            <tbody className="divide-y divide-slate-100">
              {live && dayEndQuery.isFetching ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    Loading day-end totals…
                  </td>
                </tr>
              ) : pagedRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No settled bills in this date range.
                  </td>
                </tr>
              ) : (
                pagedRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition">
                    <td className="w-12 px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        className="rounded border-slate-300 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {r.date}
                      {r.isClosed ? (
                        <span className="ml-2 rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-700">
                          Closed
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 font-mono font-medium">{r.orderCount}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      ₹{r.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5 text-slate-400">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(r)}
                          className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                          title="View Details"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewDetail(r)}
                          className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                          title="Download Summary"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DataTableFooter
          currentPage={currentPage}
          totalCount={sortedRecords.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
        />
      </div>
    </div>
  );
}
