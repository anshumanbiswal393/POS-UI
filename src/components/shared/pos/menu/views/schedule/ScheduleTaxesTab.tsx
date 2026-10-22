import { useState, useMemo } from "react";
import {
  Plus,
  ChevronDown,
  Edit2,
  Trash2,
  Percent,
} from "lucide-react";
import type { ScheduleTaxItem } from "@/types/posMenu";
import { PosDataGrid, type DataGridColumn } from "@/components/ui/data-grid";
import { toast } from "sonner";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";

export function ScheduleTaxesTab() {
  const [taxes, setTaxes] = useState<ScheduleTaxItem[]>([
    {
      id: "tax-1",
      title: "CGST",
      onlineDisplayName: "CGST",
      taxType: "Forward Tax",
      type: "Percentage",
      amount: 2.5,
      status: "Active",
      createdAt: "6 Jun 2024",
    },
    {
      id: "tax-2",
      title: "SGST",
      onlineDisplayName: "SGST",
      taxType: "Forward Tax",
      type: "Percentage",
      amount: 2.5,
      status: "Active",
      createdAt: "6 Jun 2024",
    },
    {
      id: "tax-3",
      title: "GST 18%",
      onlineDisplayName: "—",
      taxType: "Forward Tax",
      type: "Percentage",
      amount: 18,
      status: "Active",
      createdAt: "13 Sep 2024",
    },
  ]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTaxType, setNewTaxType] = useState<"Forward Tax" | "Backward Tax">("Forward Tax");
  const [newRateType, setNewRateType] = useState<"Percentage" | "Fixed Amount">("Percentage");
  const [newAmount, setNewAmount] = useState("5");
  const [pageSize, setPageSize] = useState(10);

  const handleAddTaxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please enter a tax title");
      return;
    }

    const newTax: ScheduleTaxItem = {
      id: `tax-${Date.now()}`,
      title: newTitle.trim(),
      onlineDisplayName: newTitle.trim(),
      taxType: newTaxType,
      type: newRateType,
      amount: parseFloat(newAmount) || 5,
      status: "Active",
      createdAt: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };

    setTaxes([...taxes, newTax]);
    toast.success(`Tax slab "${newTitle}" created successfully`);
    setNewTitle("");
    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string, title: string) => {
    setTaxes(taxes.filter((t) => t.id !== id));
    toast.success(`Removed tax "${title}"`);
  };

  const columns: DataGridColumn<ScheduleTaxItem>[] = useMemo(
    () => [
      {
        id: "title",
        header: "Title",
        accessorKey: "title",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 150,
        cell: ({ row }) => <span className="font-bold text-slate-900">{row.title}</span>,
      },
      {
        id: "onlineDisplayName",
        header: "Online Display Name",
        accessorKey: "onlineDisplayName",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 160,
        cell: ({ row }) => (
          <span className="text-slate-600 text-[12.5px]">{row.onlineDisplayName ?? "—"}</span>
        ),
      },
      {
        id: "taxType",
        header: "Tax Type",
        accessorKey: "taxType",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 140,
        cell: ({ row }) => <span className="text-slate-700">{row.taxType}</span>,
      },
      {
        id: "type",
        header: "Type",
        accessorKey: "type",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 130,
        cell: ({ row }) => <span className="text-slate-700">{row.type}</span>,
      },
      {
        id: "amount",
        header: "Amount",
        accessorKey: "amount",
        enableSorting: true,
        enableFiltering: true,
        align: "right",
        minWidth: 100,
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-slate-800">
            {row.type === "Percentage" ? `${row.amount}%` : `₹${row.amount}`}
          </span>
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
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
            {row.status}
          </span>
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
              onClick={() => toast.info(`Editing tax slab ${row.title}`)}
              className="p-1 hover:text-teal-600 hover:bg-slate-100 rounded transition cursor-pointer"
              title="Edit Tax"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(row.id, row.title)}
              className="p-1 hover:text-red-600 hover:bg-slate-100 rounded transition cursor-pointer"
              title="Delete Tax"
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
      {/* 1. Header and Actions from Screenshot */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-slate-500">Menu</span>
          <span className="text-[13px] text-slate-400">›</span>
          <span className="text-[14px] font-bold text-slate-900">Tax Slabs</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Tax
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
      <PosDataGrid<ScheduleTaxItem>
        data={taxes}
        columns={columns}
        enableSelection={true}
        selectedRowIds={selectedIds}
        onSelectionChange={setSelectedIds}
        enablePagination={true}
        pageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage="No taxes configured yet."
      />

      <PosCreatePanel
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Tax Slab"
        description="Add a tax rate used on billing and menus."
        icon={Percent}
        onSubmit={handleAddTaxSubmit}
        footer={
          <>
            <PosCreateCancelButton onClick={() => setIsAddModalOpen(false)} />
            <PosCreateSubmitButton>Save Tax Slab</PosCreateSubmitButton>
          </>
        }
      >
        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
            Tax Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. VAT 5%, Liquor Tax"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-[13.5px] focus:outline-hidden focus:border-teal-500"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Tax Type
            </label>
            <select
              value={newTaxType}
              onChange={(e) => setNewTaxType(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13.5px] focus:outline-hidden focus:border-teal-500 cursor-pointer"
            >
              <option value="Forward Tax">Forward Tax</option>
              <option value="Backward Tax">Backward Tax</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Rate Type
            </label>
            <select
              value={newRateType}
              onChange={(e) => setNewRateType(e.target.value as any)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13.5px] focus:outline-hidden focus:border-teal-500 cursor-pointer"
            >
              <option value="Percentage">Percentage (%)</option>
              <option value="Fixed Amount">Fixed Amount (₹)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
            Tax Rate / Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="5"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-[13.5px] focus:outline-hidden focus:border-teal-500"
          />
        </div>
      </PosCreatePanel>
    </div>
  );
}
