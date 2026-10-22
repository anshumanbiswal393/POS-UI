import { useState, useMemo } from "react";
import {
  Plus,
  ChevronDown,
  Edit2,
  Trash2,
} from "lucide-react";
import type { ScheduleDiscountItem } from "@/types/posMenu";
import { PosDataGrid, type DataGridColumn } from "@/components/ui/data-grid";
import { toast } from "sonner";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";

export function ScheduleDiscountsTab() {
  const [discounts, setDiscounts] = useState<ScheduleDiscountItem[]>([
    {
      id: "disc-1",
      title: "Happy Hours 15%",
      discountType: "Percentage",
      value: 15,
      minBillAmount: 499,
      status: "Active",
      createdAt: "10 Aug 2024",
    },
    {
      id: "disc-2",
      title: "Flat ₹100 Off Corporate",
      discountType: "Fixed Amount",
      value: 100,
      minBillAmount: 999,
      status: "Active",
      createdAt: "15 Aug 2024",
    },
  ]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);

  // Modal form state
  const [newTitle, setNewTitle] = useState("");
  const [discountType, setDiscountType] = useState<"Percentage" | "Fixed Amount">("Percentage");
  const [discountValue, setDiscountValue] = useState("10");
  const [minBill, setMinBill] = useState("500");

  const handleAddDiscountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please enter a discount campaign title");
      return;
    }

    const newDisc: ScheduleDiscountItem = {
      id: `disc-${Date.now()}`,
      title: newTitle.trim(),
      discountType,
      value: parseFloat(discountValue) || 10,
      minBillAmount: parseFloat(minBill) || 0,
      status: "Active",
      createdAt: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };

    setDiscounts([newDisc, ...discounts]);
    toast.success(`Discount rule "${newTitle}" created successfully`);
    setNewTitle("");
    setIsAddModalOpen(false);
  };

  const handleToggleStatus = (id: string, current: string) => {
    setDiscounts(
      discounts.map((d) =>
        d.id === id ? { ...d, status: d.status === "Active" ? "Inactive" : "Active" } : d,
      ),
    );
    toast.info(`Toggled status to ${current === "Active" ? "Inactive" : "Active"}`);
  };

  const handleDelete = (id: string, title: string) => {
    setDiscounts(discounts.filter((d) => d.id !== id));
    toast.success(`Removed discount "${title}"`);
  };

  const columns: DataGridColumn<ScheduleDiscountItem>[] = useMemo(
    () => [
      {
        id: "title",
        header: "Discount Title",
        accessorKey: "title",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 180,
        cell: ({ row }) => <span className="font-bold text-slate-900">{row.title}</span>,
      },
      {
        id: "discountType",
        header: "Type",
        accessorKey: "discountType",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 140,
        cell: ({ row }) => <span className="text-slate-600">{row.discountType}</span>,
      },
      {
        id: "value",
        header: "Discount Value",
        accessorKey: "value",
        enableSorting: true,
        enableFiltering: true,
        align: "right",
        minWidth: 130,
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-slate-800">
            {row.discountType === "Percentage" ? `${row.value}%` : `₹${row.value}`}
          </span>
        ),
      },
      {
        id: "minBillAmount",
        header: "Min Bill Amount",
        accessorKey: "minBillAmount",
        enableSorting: true,
        enableFiltering: true,
        align: "right",
        minWidth: 130,
        cell: ({ row }) => (
          <span className="font-mono text-slate-600">₹{row.minBillAmount ?? 0}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        enableFiltering: true,
        align: "center",
        minWidth: 100,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => handleToggleStatus(row.id, row.status)}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer transition ${
              row.status === "Active"
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {row.status}
          </button>
        ),
      },
      {
        id: "createdAt",
        header: "Created",
        accessorKey: "createdAt",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 120,
        cell: ({ row }) => <span className="text-slate-500 text-[12px]">{row.createdAt}</span>,
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        minWidth: 90,
        sortable: false,
        filterable: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5 text-slate-400">
            <button
              type="button"
              onClick={() => toast.info(`Editing discount ${row.title}`)}
              className="p-1 hover:text-teal-600 hover:bg-slate-100 rounded transition cursor-pointer"
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(row.id, row.title)}
              className="p-1 hover:text-red-600 hover:bg-slate-100 rounded transition cursor-pointer"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      {/* 1. Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-slate-500">Menu</span>
          <span className="text-[13px] text-slate-400">›</span>
          <span className="text-[14px] font-bold text-slate-900">Discount Configuration</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => toast.info("Copy discount to outlet wizard opened")}
            className="rounded-lg bg-teal-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
          >
            Copy Discount To Outlet
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-lg bg-teal-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4 inline mr-1" />
            Add Discount
          </button>
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Action <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 2. PosDataGrid with DataTableHeader */}
      <PosDataGrid<ScheduleDiscountItem>
        data={discounts}
        columns={columns}
        enableSelection={true}
        selectedRowIds={selectedIds}
        onSelectionChange={setSelectedIds}
        enablePagination={true}
        pageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage="No discounts configured yet."
      />

      <PosCreatePanel
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Discount Rule"
        description="Set a billing discount campaign for this outlet."
        icon={Plus}
        onSubmit={handleAddDiscountSubmit}
        footer={
          <>
            <PosCreateCancelButton onClick={() => setIsAddModalOpen(false)} />
            <PosCreateSubmitButton>Save Discount</PosCreateSubmitButton>
          </>
        }
      >
        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
            Discount Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Weekend Special, Flat 10%"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-[13.5px] focus:outline-hidden focus:border-teal-500"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Discount Type
            </label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13.5px] focus:outline-hidden focus:border-teal-500 cursor-pointer"
            >
              <option value="Percentage">Percentage (%)</option>
              <option value="Fixed Amount">Fixed Amount (₹)</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Discount Value <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="10"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-[13.5px] focus:outline-hidden focus:border-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
            Min Bill Amount (₹)
          </label>
          <input
            type="number"
            placeholder="500"
            value={minBill}
            onChange={(e) => setMinBill(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-[13.5px] focus:outline-hidden focus:border-teal-500"
          />
        </div>
      </PosCreatePanel>
    </div>
  );
}
