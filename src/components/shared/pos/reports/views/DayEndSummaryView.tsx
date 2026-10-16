import { useState, useMemo } from "react";
import { Download, Search, ChevronDown, Calendar, FileText, Eye, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { DataTableHeader, DataTableFooter, type DataTableColumn } from "@/components/common";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";

interface DayEndRecord {
  id: string;
  date: string;
  orderCount: number;
  totalAmount: number;
}

export function DayEndSummaryView() {
  const [startDate, setStartDate] = useState("2026-08-03");
  const [endDate, setEndDate] = useState("2026-09-02");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Data rows matching Screenshot 1
  const records: DayEndRecord[] = [
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

  const [sortConfig, setSortConfig] = useState<{ colId: string; direction: "asc" | "desc" } | null>(null);

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

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedRecords.map((r) => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Bar matching Screenshot 1 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Day End Summary</h2>

        <div className="flex items-center gap-2">
          <ExportToExcelButton
            onClick={() => toast.success("Exporting Day End Summary to Excel...")}
          />

          <button
            type="button"
            onClick={() => toast.info("Day End Actions")}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Action <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 2. Filter Bar matching Screenshot 1 */}
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
              onClick={() => toast.info(`Loaded ${records.length} day-end settlement records`)}
              className="rounded-lg bg-teal-600 px-5 py-1.5 text-[12.5px] font-semibold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer"
            >
              Search
            </button>

            <button
              type="button"
              onClick={() => {
                setStartDate("2026-08-03");
                setEndDate("2026-09-02");
                toast.info("Showing all day-end summaries");
              }}
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
              data={sortedRecords}
              selectable
              isAllSelected={selectedIds.length === sortedRecords.length && sortedRecords.length > 0}
              isSomeSelected={selectedIds.length > 0 && selectedIds.length < sortedRecords.length}
              onToggleSelectAll={toggleSelectAll}
              sortConfig={sortConfig}
              onSortChange={setSortConfig}
              themeVariant="primary"
            />
            <tbody className="divide-y divide-slate-100">
              {sortedRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition">
                  <td className="w-12 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      className="rounded border-slate-300 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{r.date}</td>
                  <td className="px-4 py-3 text-right text-slate-600 font-mono font-medium">{r.orderCount}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">₹{r.totalAmount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5 text-slate-400">
                      <button
                        type="button"
                        onClick={() => toast.info(`Opening day-end audit for ${r.date}`)}
                        className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                        title="View Details"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          toast.success(`Downloading PDF day-end slip for ${r.date}...`)
                        }
                        className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                        title="Download Summary"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Reusable DataTableFooter */}
        <DataTableFooter
          currentPage={currentPage}
          totalCount={30}
          pageSize={10}
          onPageChange={setCurrentPage}
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
        />
      </div>
    </div>
  );
}
