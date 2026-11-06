import { useState, useMemo, useEffect } from "react";
import { Download, ChevronDown, FileText } from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import { PosDateRangePicker } from "@/components/common/PosDateRangePicker";
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

export function DayEndSummaryView() {
  const { activeOutlet } = useOutletContext();
  const live = isBackendOutletId(activeOutlet?.id);
  const defaultRange = rangeLastDays(14);

  const [startDate, setStartDate] = useState(defaultRange.from);
  const [endDate, setEndDate] = useState(defaultRange.to);
  const [appliedStart, setAppliedStart] = useState(defaultRange.from);
  const [appliedEnd, setAppliedEnd] = useState(defaultRange.to);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const range = rangeLastDays(14);
    setStartDate(range.from);
    setEndDate(range.to);
    setAppliedStart(range.from);
    setAppliedEnd(range.to);
    setSelectedIds([]);
  }, [live, activeOutlet?.id]);

  const dayEndQuery = usePosDayEnd(appliedStart, appliedEnd, live);
  const closeMut = useClosePosDayMutation();

  const records: DayEndRecord[] = dayEndQuery.data?.records || [];

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

  const columns: PosDataGridColumn<DayEndRecord>[] = useMemo(
    () => [
      {
        id: "date",
        header: "CREATED DATE",
        accessorKey: "date",
        sortable: true,
        filterable: true,
        minWidth: 200,
        render: (_, r) => (
          <div className="flex items-center gap-2 font-medium text-slate-800">
            <span>{r.date}</span>
            {r.isClosed && (
              <span className="rounded-md bg-teal-50 border border-teal-200 px-1.5 py-0.5 text-[10.5px] font-bold text-teal-700">
                Closed
              </span>
            )}
          </div>
        ),
      },
      {
        id: "orderCount",
        header: "NO. OF ORDERS",
        accessorKey: "orderCount",
        sortable: true,
        filterable: true,
        align: "right",
        minWidth: 160,
        render: (_, r) => (
          <span className="font-mono font-medium text-slate-700">
            {r.orderCount}
          </span>
        ),
      },
      {
        id: "totalAmount",
        header: "TOTAL (₹)",
        accessorKey: "totalAmount",
        sortable: true,
        filterable: true,
        align: "right",
        minWidth: 180,
        render: (_, r) => (
          <span className="font-mono font-bold text-slate-900">
            ₹{r.totalAmount.toLocaleString("en-IN")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "ACTIONS",
        sortable: false,
        filterable: false,
        align: "right",
        minWidth: 120,
        render: (_, r) => (
          <div
            className="flex items-center justify-end gap-1.5 text-slate-400"
            onClick={(e) => e.stopPropagation()}
          >
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
        ),
      },
    ],
    [live, activeOutlet?.id],
  );

  const handleSearch = () => {
    setAppliedStart(startDate);
    setAppliedEnd(endDate);
    toast.info("Loaded day-end settlement records");
  };

  const handleShowAll = () => {
    const range = live ? rangeLastDays(30) : { from: "2026-08-03", to: "2026-09-02" };
    setStartDate(range.from);
    setEndDate(range.to);
    setAppliedStart(range.from);
    setAppliedEnd(range.to);
    toast.info("Showing all day-end summaries");
  };

  const handleExport = () => {
    exportToExcel(
      records.map((r) => ({
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

  const handleCloseDays = async () => {
    if (!live) {
      toast.info("Day End Actions");
      return;
    }
    const dates = selectedIds.length
      ? records
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
            <label className="text-[11.5px] font-semibold text-slate-600">Period</label>
            <PosDateRangePicker
              from={startDate}
              to={endDate}
              onSelect={({ from, to }) => {
                setStartDate(from);
                setEndDate(to);
              }}
              showClear={true}
              className="h-9"
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

      {/* Structured POS Data Grid matching Orders & POS standard table design */}
      <PosDataGrid<DayEndRecord>
        data={records}
        columns={columns}
        selectedRowIds={selectedIds}
        onSelectionChange={setSelectedIds}
        enableSelection={true}
        enablePagination={true}
        pageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        loading={live && dayEndQuery.isFetching}
        emptyMessage="No settled bills in this date range."
        storageKey="pos-day-end-summary"
        themeVariant="primary"
      />
    </div>
  );
}
