import { useState, useMemo } from "react";
import {
  Plus,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import { useVendors } from "@/hooks/queries/usePosInventory";
import { PosDataGrid } from "@/components/ui/data-grid";
import type { DataGridColumn } from "@/components/ui/data-grid/types";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";

interface SupplierItem {
  id: string;
  name: string;
  company: string;
  phone: string;
  category: string;
  gstin: string;
  balance: string;
}

const SUPPLIER_COLUMNS: DataGridColumn<SupplierItem>[] = [
  {
    id: "id",
    header: "Supplier ID",
    sortable: true,
    filterable: true,
    width: 140,
    render: (val: any) => <span className="font-mono font-bold text-primary">{val}</span>,
  },
  {
    id: "name",
    header: "Contact Person",
    sortable: true,
    filterable: true,
    width: 170,
    render: (val: any) => <span className="font-semibold text-foreground">{val}</span>,
  },
  {
    id: "company",
    header: "Company Name",
    sortable: true,
    filterable: true,
    width: 220,
    render: (val: any) => (
      <div className="flex items-center gap-1.5 font-medium text-foreground">
        <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="truncate">{val}</span>
      </div>
    ),
  },
  {
    id: "category",
    header: "Category",
    sortable: true,
    filterable: true,
    width: 160,
    render: (val: any) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-surface-2 text-foreground">
        {val}
      </span>
    ),
  },
  {
    id: "phone",
    header: "Phone",
    sortable: true,
    width: 150,
    render: (val: any) => <span className="font-mono text-xs text-muted-foreground">{val}</span>,
  },
  {
    id: "gstin",
    header: "GSTIN",
    sortable: true,
    filterable: true,
    width: 160,
    render: (val: any) => <span className="font-mono text-xs text-muted-foreground">{val}</span>,
  },
  {
    id: "balance",
    header: "Outstanding Balance",
    sortable: true,
    align: "right",
    width: 160,
    render: (val: any) => (
      <span className="font-mono font-bold text-foreground">{val}</span>
    ),
  },
];

export function SupplierManagementView() {
  const { data: vendors } = useVendors();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [newVendor, setNewVendor] = useState({
    name: "",
    company: "",
    phone: "",
    category: "Groceries & Spices",
    gstin: "",
  });

  const [localVendors, setLocalVendors] = useState<SupplierItem[]>([
    {
      id: "VEND-01",
      name: "Ramesh Sharma",
      company: "Metro Fresh Farm Supplies",
      phone: "+91 98201 11223",
      category: "Vegetables & Fruits",
      gstin: "27AABCM1234F1Z5",
      balance: "₹ 12,400",
    },
    {
      id: "VEND-02",
      name: "Sunil Kapoor",
      company: "Amrit Dairy Foods Pvt Ltd",
      phone: "+91 98450 33445",
      category: "Dairy & Cheese",
      gstin: "27AADCA5566G1Z2",
      balance: "₹ 0",
    },
    {
      id: "VEND-03",
      name: "Pooja Malhotra",
      company: "Apex Beverage Distributors",
      phone: "+91 98110 77889",
      category: "Beverages & Syrups",
      gstin: "27AABCA9988H1Z8",
      balance: "₹ 5,850",
    },
    {
      id: "VEND-04",
      name: "Vikram Sethi",
      company: "Spice King Wholesale Hub",
      phone: "+91 98765 43210",
      category: "Groceries & Spices",
      gstin: "27AABCS7744K1Z1",
      balance: "₹ 18,200",
    },
  ]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendor.name || !newVendor.company) {
      toast.error("Please provide supplier name and company.");
      return;
    }

    const created: SupplierItem = {
      id: `VEND-0${localVendors.length + 1}`,
      name: newVendor.name,
      company: newVendor.company,
      phone: newVendor.phone || "+91 98000 00000",
      category: newVendor.category,
      gstin: newVendor.gstin || "27AAAAA0000A1Z5",
      balance: "₹ 0",
    };

    setLocalVendors([created, ...localVendors]);
    setIsCreateOpen(false);
    setNewVendor({ name: "", company: "", phone: "", category: "Groceries & Spices", gstin: "" });
    toast.success(`Supplier '${created.company}' added successfully.`);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            Supplier / Vendor Management
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage approved vendor profiles, supply categories, GSTIN details, and outstanding balances.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 shadow-xs transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* 2. Interactive Data Grid */}
      <PosDataGrid
        data={localVendors}
        columns={SUPPLIER_COLUMNS}
        keyField="id"
        title="Approved Suppliers"
        subtitle="Search by company, contact person, category or GSTIN"
        showToolbar
        selectable
        storageKey="pos-supplier-management"
        themeVariant="primary"
        pageSize={10}
      />

      <PosCreatePanel
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Supplier / Third Party"
        description="Register a vendor for stock purchases and returns."
        icon={Building}
        onSubmit={handleCreate}
        footer={
          <>
            <PosCreateCancelButton onClick={() => setIsCreateOpen(false)} />
            <PosCreateSubmitButton>Save Supplier</PosCreateSubmitButton>
          </>
        }
      >
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Company Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Metro Fresh Farm Supplies"
            value={newVendor.company}
            onChange={(e) => setNewVendor({ ...newVendor, company: e.target.value })}
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Contact Person Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Ramesh Sharma"
            value={newVendor.name}
            onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Phone</label>
            <input
              type="text"
              placeholder="+91 98..."
              value={newVendor.phone}
              onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Category</label>
            <select
              value={newVendor.category}
              onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="Vegetables & Fruits">Vegetables & Fruits</option>
              <option value="Dairy & Cheese">Dairy & Cheese</option>
              <option value="Beverages & Syrups">Beverages & Syrups</option>
              <option value="Meat & Poultry">Meat & Poultry</option>
              <option value="Groceries & Spices">Groceries & Spices</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">GSTIN Number</label>
          <input
            type="text"
            placeholder="e.g. 27AABCM1234F1Z5"
            value={newVendor.gstin}
            onChange={(e) => setNewVendor({ ...newVendor, gstin: e.target.value })}
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </PosCreatePanel>
    </div>
  );
}
