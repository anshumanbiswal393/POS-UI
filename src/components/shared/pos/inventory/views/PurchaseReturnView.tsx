import { useState, useMemo } from "react";
import { Plus, Search, Trash2, Eye, SlidersHorizontal } from "lucide-react";
import {
  usePurchaseReturns,
  useInventoryVendors,
  useDeletePurchaseReturn,
} from "@/hooks/queries/usePosInventory";
import { CreatePurchaseReturnModal } from "../modals/CreatePurchaseReturnModal";
import {
  DataTableHeader,
  type DataTableColumn,
} from "@/components/common/DataTableHeader";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import { toast } from "sonner";

export function PurchaseReturnView() {
  const { data: purchaseReturns } = usePurchaseReturns();
  const { data: vendors } = useInventoryVendors();
  const deleteMutation = useDeletePurchaseReturn();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [startDate, setStartDate] = useState("2026-08-26");
  const [endDate, setEndDate] = useState("2026-09-02");
  const [vendorFilter, setVendorFilter] = useState("All");
  const [debitNoteFilter, setDebitNoteFilter] = useState("");

  const returnColumns: DataTableColumn<any>[] = useMemo(
    () => [
      {
        id: "debitNoteNo",
        label: "Debit Note No",
        sortable: true,
        filterable: true,
        defaultWidth: 150,
        getValue: (r) => r.debitNoteNo,
      },
      {
        id: "vendorName",
        label: "Vendor",
        sortable: true,
        filterable: true,
        defaultWidth: 180,
        getValue: (r) => r.vendorName,
      },
      {
        id: "returnDate",
        label: "Return Date",
        sortable: true,
        defaultWidth: 130,
        getValue: (r) => r.returnDate,
      },
      {
        id: "reason",
        label: "Reason",
        sortable: true,
        defaultWidth: 160,
        getValue: (r) => r.reason,
      },
      {
        id: "itemCount",
        label: "Item Count",
        sortable: true,
        align: "center",
        defaultWidth: 120,
        getValue: (r) => `${r.itemCount} Items`,
      },
      {
        id: "returnAmount",
        label: "Amount",
        sortable: true,
        align: "right",
        defaultWidth: 130,
        getValue: (r) => `₹${r.returnAmount}`,
      },
      {
        id: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        align: "center",
        defaultWidth: 120,
        getValue: (r) => r.status,
      },
      {
        id: "actions",
        label: "Actions",
        sortable: false,
        filterable: false,
        align: "right",
        defaultWidth: 100,
      },
    ],
    [],
  );

  const filteredReturns = (purchaseReturns ?? []).filter((pr) => {
    if (vendorFilter !== "All" && pr.vendorName !== vendorFilter) return false;
    if (debitNoteFilter && !pr.debitNoteNo.toLowerCase().includes(debitNoteFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleClear = () => {
    setVendorFilter("All");
    setDebitNoteFilter("");
    toast.info("Filters cleared");
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Actions matching Screenshot 3 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
          Purchase Return List
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create New
          </button>

          <ExportToExcelButton
            onClick={() => toast.success("Exporting purchase returns to Excel...")}
          />

          <button
            type="button"
            onClick={() => toast.info("Column preferences")}
            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            title="Columns view"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Filter Bar matching Screenshot 3 */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-36">
            <label className="block text-[11.5px] font-medium text-slate-600 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="w-36">
            <label className="block text-[11.5px] font-medium text-slate-600 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="min-w-[160px]">
            <label className="block text-[11.5px] font-medium text-slate-600 mb-1">To</label>
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-none cursor-pointer"
            >
              <option value="All">All</option>
              {vendors?.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[150px]">
            <label className="block text-[11.5px] font-medium text-slate-600 mb-1">
              Debit Note No.
            </label>
            <input
              type="text"
              placeholder="Debit note no..."
              value={debitNoteFilter}
              onChange={(e) => setDebitNoteFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => toast.info("More filter options")}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            More Filters
          </button>

          <button
            type="button"
            onClick={() => toast.info(`Found ${filteredReturns.length} debit notes`)}
            className="rounded-lg border border-teal-600 bg-white px-5 py-1.5 text-[12.5px] font-semibold text-teal-600 hover:bg-teal-50 transition cursor-pointer"
          >
            Search
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* 3. Returns Data Table with Always-Present Header */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <DataTableHeader
              columns={returnColumns}
              data={filteredReturns}
              themeVariant="primary"
            />
            <tbody className="divide-y divide-slate-100">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={returnColumns.length} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative mb-4 flex h-16 w-16 items-center justify-center">
                        <div className="h-14 w-12 rounded-lg border-2 border-slate-300 bg-slate-50 p-2 shadow-2xs">
                          <div className="h-1 w-full rounded bg-slate-200 mb-1.5" />
                          <div className="h-1 w-3/4 rounded bg-slate-200 mb-1.5" />
                          <div className="h-1 w-1/2 rounded bg-slate-200" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-slate-200">
                          <Search className="h-4 w-4 text-slate-500" />
                        </div>
                      </div>
                      <h4 className="text-[15px] font-semibold text-slate-800">No Purchase Return Found</h4>
                      <p className="text-[12.5px] text-slate-400 mt-1 max-w-sm">
                        Debit notes for returned inventory or damaged stock will appear here.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsCreateOpen(true)}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-teal-700 transition cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        Create Purchase Return
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReturns.map((pr) => (
                  <tr key={pr.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                      {pr.debitNoteNo}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{pr.vendorName}</td>
                    <td className="px-4 py-3 text-slate-600">{pr.returnDate}</td>
                    <td className="px-4 py-3 text-slate-600">{pr.reason}</td>
                    <td className="px-4 py-3 text-slate-600">{pr.itemCount} Items</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      ₹{pr.returnAmount}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                        {pr.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-slate-400">
                        <button
                          type="button"
                          onClick={() => toast.info(`Viewing Debit Note ${pr.debitNoteNo}`)}
                          className="p-1 hover:text-teal-600 hover:bg-slate-100 rounded transition cursor-pointer"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteMutation.mutate(pr.id);
                            toast.success(`Deleted Debit Note ${pr.debitNoteNo}`);
                          }}
                          className="p-1 hover:text-red-600 hover:bg-slate-100 rounded transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreatePurchaseReturnModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
