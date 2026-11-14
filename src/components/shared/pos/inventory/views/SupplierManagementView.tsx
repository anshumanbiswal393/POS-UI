import { useState, useMemo } from "react";
import {
  Plus,
  Building,
  Sparkles,
} from "lucide-react";
import { ColorActionDelete } from "@/components/common/ColorActionIcons";
import { toast } from "sonner";
import { useVendors } from "@/hooks/queries/usePosInventory";
import { PosDataGrid } from "@/components/ui/data-grid";
import type { DataGridColumn } from "@/components/ui/data-grid/types";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";
import { StockDeleteConfirmModal } from "../modals/StockDeleteConfirmModal";

export const AVAILABLE_SUPPLIER_CATEGORIES = [
  "Vegetables & Fruits",
  "Dairy & Cheese",
  "Beverages & Syrups",
  "Meat & Poultry",
  "Groceries & Spices",
  "Bakery & Bread",
  "Packaging Materials",
];

export function generateSamplePhoneNumber(): string {
  const prefixes = ["98", "99", "97", "96", "94", "91", "88", "87", "70"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const part1 = Math.floor(100 + Math.random() * 900);
  const part2 = Math.floor(10000 + Math.random() * 90000);
  return `+91 ${prefix}${part1} ${part2}`;
}

interface SupplierItem {
  id: string;
  name: string;
  company: string;
  phone: string;
  category: string | string[];
  gstin: string;
  balance: string;
}

const SUPPLIER_COLUMNS = (
  onDelete: (item: SupplierItem) => void,
): DataGridColumn<SupplierItem>[] => [
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
    header: "Categories",
    sortable: true,
    filterable: true,
    width: 240,
    filterValueAccessor: (row) =>
      Array.isArray(row.category) ? row.category.join(" ") : (row.category || ""),
    render: (_: any, row: SupplierItem) => {
      const cats = Array.isArray(row.category)
        ? row.category
        : (row.category ? [row.category] : []);
      if (cats.length === 0) {
        return <span className="text-muted-foreground text-xs italic">General</span>;
      }
      return (
        <div className="flex flex-wrap items-center gap-1 py-1">
          {cats.map((cat, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50"
            >
              {cat}
            </span>
          ))}
        </div>
      );
    },
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
    header: "To Be Paid",
    sortable: true,
    align: "right",
    width: 160,
    render: (val: any) => (
      <span className="font-mono font-bold text-foreground">{val}</span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    align: "right",
    width: 90,
    render: (_: any, row: SupplierItem) => (
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(row);
          }}
          className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-300 bg-white hover:border-rose-500 hover:bg-rose-50/60 shadow-2xs transition cursor-pointer"
          title="Delete Supplier"
        >
          <ColorActionDelete className="h-3.5 w-3.5" />
        </button>
      </div>
    ),
  },
];

export function SupplierManagementView() {
  const { data: vendors } = useVendors();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SupplierItem | null>(null);

  const [newVendor, setNewVendor] = useState({
    name: "",
    company: "",
    phone: "",
    categories: ["Groceries & Spices"] as string[],
    gstin: "",
  });

  const [localVendors, setLocalVendors] = useState<SupplierItem[]>([
    {
      id: "VEND-01",
      name: "Ramesh Sharma",
      company: "Metro Fresh Farm Supplies",
      phone: "+91 98201 11223",
      category: ["Vegetables & Fruits", "Groceries & Spices"],
      gstin: "27AABCM1234F1Z5",
      balance: "₹ 12,400",
    },
    {
      id: "VEND-02",
      name: "Sunil Kapoor",
      company: "Amrit Dairy Foods Pvt Ltd",
      phone: "+91 98450 33445",
      category: ["Dairy & Cheese"],
      gstin: "27AADCA5566G1Z2",
      balance: "₹ 0",
    },
    {
      id: "VEND-03",
      name: "Pooja Malhotra",
      company: "Apex Beverage Distributors",
      phone: "+91 98110 77889",
      category: ["Beverages & Syrups"],
      gstin: "27AABCA9988H1Z8",
      balance: "₹ 5,850",
    },
    {
      id: "VEND-04",
      name: "Vikram Sethi",
      company: "Spice King Wholesale Hub",
      phone: "+91 98765 43210",
      category: ["Groceries & Spices", "Packaging Materials"],
      gstin: "27AABCS7744K1Z1",
      balance: "₹ 18,200",
    },
  ]);

  const handleOpenCreate = () => {
    setNewVendor({
      name: "",
      company: "",
      phone: generateSamplePhoneNumber(),
      categories: ["Groceries & Spices"],
      gstin: "",
    });
    setIsCreateOpen(true);
  };

  const handleGeneratePhone = () => {
    setNewVendor((prev) => ({
      ...prev,
      phone: generateSamplePhoneNumber(),
    }));
  };

  const toggleCategorySelection = (cat: string) => {
    setNewVendor((prev) => {
      const exists = prev.categories.includes(cat);
      if (exists) {
        if (prev.categories.length === 1) return prev; // keep at least one
        return { ...prev, categories: prev.categories.filter((c) => c !== cat) };
      }
      return { ...prev, categories: [...prev.categories, cat] };
    });
  };

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
      phone: newVendor.phone || generateSamplePhoneNumber(),
      category: newVendor.categories.length > 0 ? newVendor.categories : ["Groceries & Spices"],
      gstin: newVendor.gstin || "27AAAAA0000A1Z5",
      balance: "₹ 0",
    };

    setLocalVendors([created, ...localVendors]);
    setIsCreateOpen(false);
    toast.success(`Supplier '${created.company}' added successfully.`);
  };

  const handleDelete = (item: SupplierItem) => {
    setLocalVendors((prev) => prev.filter((v) => v.id !== item.id));
    toast.success(`Supplier '${item.company}' removed.`);
  };

  const columns = useMemo(() => SUPPLIER_COLUMNS((item) => setDeleteTarget(item)), []);

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
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 shadow-xs transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* 2. Interactive Data Grid */}
      <PosDataGrid
        data={localVendors}
        columns={columns}
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
        description="Register a vendor for stock purchases and returns with multiple categories."
        icon={Building}
        onSubmit={handleCreate}
        footer={
          <>
            <PosCreateCancelButton onClick={() => setIsCreateOpen(false)} />
            <PosCreateSubmitButton>Save Supplier</PosCreateSubmitButton>
          </>
        }
      >
        <div className="space-y-3.5">
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

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Phone Number</label>
              <button
                type="button"
                onClick={handleGeneratePhone}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>Generate Sample Number</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="+91 98..."
                value={newVendor.phone}
                onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleGeneratePhone}
                className="shrink-0 px-2.5 py-1.5 rounded-lg border border-border bg-surface-2 hover:bg-surface text-xs font-semibold text-foreground transition cursor-pointer"
                title="Generate another sample number"
              >
                Sample
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Supply Categories (Multiple Select) *
              </label>
              <span className="text-[11px] text-muted-foreground">
                {newVendor.categories.length} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-border bg-surface-2/40">
              {AVAILABLE_SUPPLIER_CATEGORIES.map((cat) => {
                const isSelected = newVendor.categories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategorySelection(cat)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "bg-surface border border-border text-muted-foreground hover:text-foreground hover:bg-surface-2"
                    }`}
                  >
                    <span>{isSelected ? "✓" : "+"}</span>
                    <span>{cat}</span>
                  </button>
                );
              })}
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
        </div>
      </PosCreatePanel>

      {/* Delete Confirmation Modal */}
      <StockDeleteConfirmModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Supplier Profile"
        itemName={deleteTarget?.company}
        description={
          deleteTarget ? (
            <>
              Are you sure you want to remove supplier profile{" "}
              <span className="font-semibold text-slate-900">"{deleteTarget.company}"</span> ({deleteTarget.name})?
            </>
          ) : undefined
        }
        onConfirm={() => {
          if (deleteTarget) {
            handleDelete(deleteTarget);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
