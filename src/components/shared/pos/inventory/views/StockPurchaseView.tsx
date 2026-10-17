import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Download,
  Trash2,
  Eye,
  FileText,
  DollarSign,
  TrendingUp,
  X,
  Printer,
  ChevronDown,
  Building2,
  PackageCheck,
  Check,
  Phone,
  Mail,
  MapPin,
  User,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { exportToExcel } from "@/utils/exportUtils";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import {
  DataTableHeader,
  DataTableFooter,
  ChooseColumnsMenu,
  type DataTableColumn,
} from "@/components/common";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Calendar as PmsCalendar,
  type DateRange,
} from "@/components/ui/calendar";
import {
  posPurchasesService,
  type UnifiedPurchaseDto,
  type PurchaseVendor,
  type PurchaseLineItem,
} from "@/services/posPurchasesService";

const formatToYmd = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseYmd = (str?: string): Date | undefined => {
  if (!str) return undefined;
  const parts = str.split("-");
  if (parts.length !== 3) return undefined;
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
};

const formatToDmy = (str?: string): string => {
  if (!str) return "dd-mm-yyyy";
  const parts = str.split("-");
  if (parts.length !== 3) return "dd-mm-yyyy";
  return `${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}-${parts[0]}`;
};

export function StockPurchaseView() {
  const [purchases, setPurchases] = useState<UnifiedPurchaseDto[]>([]);
  const [vendors, setVendors] = useState<PurchaseVendor[]>([]);
  const [loading, setLoading] = useState(true);

  // Date Range Filter (PMS format: dd-MM-yyyy in UI, yyyy-MM-dd in queries)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(todayStr);

  // PMS Slide Date Range Picker Popover State
  const [dateRangePopoverOpen, setDateRangePopoverOpen] = useState(false);
  const [activeDateField, setActiveDateField] = useState<"from" | "to">("from");
  const [tempRange, setTempRange] = useState<DateRange | undefined>(() => ({
    from: parseYmd(startDate),
    to: parseYmd(endDate),
  }));

  useEffect(() => {
    setTempRange({
      from: parseYmd(startDate),
      to: parseYmd(endDate),
    });
  }, [startDate, endDate]);

  const handleOpenDateRange = (target: "from" | "to") => {
    setActiveDateField(target);
    setTempRange({
      from: parseYmd(startDate) || new Date(),
      to: parseYmd(endDate) || new Date(),
    });
    setDateRangePopoverOpen(true);
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setTempRange(range);
    if (!range?.from) return;

    if (range.to) {
      const fromYmd = formatToYmd(range.from);
      const toYmd = formatToYmd(range.to);
      setStartDate(fromYmd);
      setEndDate(toYmd);
      setTimeout(() => {
        setDateRangePopoverOpen(false);
      }, 250);
    }
  };

  // Filter Toolbar (Search & Column Visibility)
  const [search, setSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    invoiceNo: true,
    invoiceDate: true,
    vendorName: true,
    items: true,
    totalAmount: true,
    paidAmount: true,
    balanceAmount: true,
    paymentStatus: true,
    actions: true,
  });

  // Tab View: Purchases (Bills) vs Purchase Orders
  const [activeTab, setActiveTab] = useState<"purchases" | "orders">("purchases");

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<UnifiedPurchaseDto | null>(null);
  const [detailsModalInvoice, setDetailsModalInvoice] = useState<UnifiedPurchaseDto | null>(null);

  // Vendor Management Modal State
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");
  const [showAddVendorForm, setShowAddVendorForm] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorContact, setNewVendorContact] = useState("");
  const [newVendorPhone, setNewVendorPhone] = useState("");
  const [newVendorEmail, setNewVendorEmail] = useState("");
  const [newVendorCategory, setNewVendorCategory] = useState("Groceries & Dry Goods");
  const [newVendorGstin, setNewVendorGstin] = useState("");
  const [newVendorAddress, setNewVendorAddress] = useState("");
  const [savingVendor, setSavingVendor] = useState(false);

  // Payment Form state
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("UPI / QR");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");

  // Add Purchase Form state
  const [formVendor, setFormVendor] = useState("Metro Cash & Carry");
  const [formInvoiceNo, setFormInvoiceNo] = useState("");
  const [formInvoiceDate, setFormInvoiceDate] = useState(todayStr);
  const [formPaymentStatus, setFormPaymentStatus] = useState<"Done" | "Pending" | "Partial">("Done");
  const [formPaidAmount, setFormPaidAmount] = useState("");
  const [formPaymentMethod, setFormPaymentMethod] = useState("Cash");
  const [formTax, setFormTax] = useState("0");
  const [formNotes, setFormNotes] = useState("");
  const [formItems, setFormItems] = useState<PurchaseLineItem[]>([
    { name: "Basmati Rice Grade A (50kg Bag)", quantity: 2, unit: "Bags", unitPrice: 4500, lineTotal: 9000 },
    { name: "Refined Sunflower Oil (15L)", quantity: 3, unit: "Tins", unitPrice: 1850, lineTotal: 5550 },
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [data, vendorList] = await Promise.all([
        posPurchasesService.fetchPurchases({
          startDate,
          endDate,
        }),
        posPurchasesService.fetchVendors(),
      ]);
      setPurchases(data);
      setVendors(vendorList);
      if (vendorList.length > 0 && !formVendor) {
        setFormVendor(vendorList[0].name);
      }
    } catch {
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  // Table Columns Definition for DataTableHeader
  const purchaseColumns = useMemo<DataTableColumn<UnifiedPurchaseDto>[]>(
    () => [
      {
        id: "invoiceNo",
        label: "Invoice No",
        sortable: true,
        filterable: true,
        defaultWidth: 160,
        getValue: (r) => r.invoiceNo,
      },
      {
        id: "invoiceDate",
        label: "Date",
        sortable: true,
        defaultWidth: 120,
        getValue: (r) => r.invoiceDate,
      },
      {
        id: "vendorName",
        label: "Vendor / Supplier",
        sortable: true,
        filterable: true,
        defaultWidth: 200,
        getValue: (r) => r.vendorName,
      },
      {
        id: "items",
        label: "Items Received",
        defaultWidth: 230,
        getValue: (r) => `${r.itemCount} SKUs`,
      },
      {
        id: "totalAmount",
        label: "Total Bill (₹)",
        sortable: true,
        align: "right",
        defaultWidth: 130,
        getValue: (r) => `₹ ${r.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      },
      {
        id: "paidAmount",
        label: "Paid (₹)",
        sortable: true,
        align: "right",
        defaultWidth: 120,
        getValue: (r) => `₹ ${r.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      },
      {
        id: "balanceAmount",
        label: "Balance Due (₹)",
        sortable: true,
        align: "right",
        defaultWidth: 130,
        getValue: (r) => `₹ ${r.balanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      },
      {
        id: "paymentStatus",
        label: "Payment Status",
        sortable: true,
        filterable: true,
        align: "center",
        defaultWidth: 130,
        getValue: (r) => r.paymentStatus,
      },
      {
        id: "actions",
        label: "Actions",
        align: "right",
        defaultWidth: 120,
      },
    ],
    [],
  );

  // Filtered List based on search and table header column filters
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        const matches = (
          p.invoiceNo.toLowerCase().includes(q) ||
          p.vendorName.toLowerCase().includes(q) ||
          p.items.some((i) => i.name.toLowerCase().includes(q))
        );
        if (!matches) return false;
      }

      // Column Filters (such as Vendor / Supplier or Payment Status from column header filter popovers)
      for (const [colId, allowedValues] of Object.entries(columnFilters)) {
        if (!allowedValues) continue;
        const col = purchaseColumns.find((c) => c.id === colId);
        let cellVal = "";
        if (col?.getValue) {
          cellVal = col.getValue(p);
        } else if ((p as any)[colId] !== undefined && (p as any)[colId] !== null) {
          cellVal = String((p as any)[colId]);
        }
        if (!allowedValues.includes(cellVal.trim())) {
          return false;
        }
      }

      return true;
    });
  }, [purchases, search, columnFilters, purchaseColumns]);

  const activeVisibleColumnCount = useMemo(() => {
    return purchaseColumns.filter((c) => visibleColumns[c.id || ""] !== false).length;
  }, [purchaseColumns, visibleColumns]);

  const [sortConfig, setSortConfig] = useState<{ colId: string; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, columnFilters, startDate, endDate]);

  const sortedPurchases = useMemo(() => {
    if (!sortConfig) return filteredPurchases;
    return [...filteredPurchases].sort((a, b) => {
      let aVal: any = a[sortConfig.colId as keyof UnifiedPurchaseDto];
      let bVal: any = b[sortConfig.colId as keyof UnifiedPurchaseDto];
      if (typeof aVal === "string") {
        const cmp = aVal.localeCompare(bVal || "");
        return sortConfig.direction === "asc" ? cmp : -cmp;
      }
      if (typeof aVal === "number") {
        const diff = aVal - (bVal || 0);
        return sortConfig.direction === "asc" ? diff : -diff;
      }
      return 0;
    });
  }, [filteredPurchases, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedPurchases.length / pageSize));
  const paginatedPurchases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPurchases.slice(start, start + pageSize);
  }, [sortedPurchases, currentPage, pageSize]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const totalSpend = purchases.reduce((acc, p) => acc + p.totalAmount, 0);
    const doneBills = purchases.filter((p) => p.paymentStatus === "Done");
    const doneValue = doneBills.reduce((acc, p) => acc + p.paidAmount, 0);
    const pendingBills = purchases.filter((p) => p.paymentStatus !== "Done");
    const pendingBalance = pendingBills.reduce((acc, p) => acc + p.balanceAmount, 0);
    const vendorCount = new Set(purchases.map((p) => p.vendorName)).size;

    return {
      totalSpend,
      doneCount: doneBills.length,
      doneValue,
      pendingCount: pendingBills.length,
      pendingBalance,
      vendorCount,
    };
  }, [purchases]);

  // Open Record Payment Modal
  const handleOpenPayment = (p: UnifiedPurchaseDto) => {
    setPaymentModalInvoice(p);
    setPayAmount(String(p.balanceAmount));
    setPayMethod("UPI / QR");
    setPayRef("");
    setPayNotes("");
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    try {
      const updated = await posPurchasesService.recordPayment(paymentModalInvoice.id, {
        amount: amt,
        paymentMethod: payMethod,
        referenceNo: payRef,
        notes: payNotes,
      });

      if (updated) {
        setPurchases((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        toast.success(
          `Payment of ₹${amt.toLocaleString()} recorded! Status updated to ${updated.paymentStatus}.`,
        );
        setPaymentModalInvoice(null);
      }
    } catch {
      toast.error("Failed to record payment.");
    }
  };

  // Vendor Management Handlers
  const filteredModalVendors = useMemo(() => {
    if (!vendorSearch.trim()) return vendors;
    const q = vendorSearch.toLowerCase();
    return vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        (v.phone && v.phone.toLowerCase().includes(q)) ||
        (v.contactPerson && v.contactPerson.toLowerCase().includes(q)) ||
        (v.gstin && v.gstin.toLowerCase().includes(q)),
    );
  }, [vendors, vendorSearch]);

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim()) {
      toast.error("Please enter a vendor name");
      return;
    }
    try {
      setSavingVendor(true);
      const created = await posPurchasesService.createVendor({
        name: newVendorName.trim(),
        contactPerson: newVendorContact.trim(),
        phone: newVendorPhone.trim(),
        email: newVendorEmail.trim(),
        category: newVendorCategory.trim(),
        gstin: newVendorGstin.trim(),
        address: newVendorAddress.trim(),
      });
      setVendors((prev) => {
        const without = prev.filter((v) => v.id !== created.id && v.name.toLowerCase() !== created.name.toLowerCase());
        return [created, ...without];
      });
      setNewVendorName("");
      setNewVendorContact("");
      setNewVendorPhone("");
      setNewVendorEmail("");
      setNewVendorGstin("");
      setNewVendorAddress("");
      setShowAddVendorForm(false);
      toast.success(`Vendor "${created.name}" added successfully!`);
    } catch {
      toast.error("Failed to add vendor");
    } finally {
      setSavingVendor(false);
    }
  };

  const handleDeleteVendor = async (vendor: PurchaseVendor) => {
    if (!window.confirm(`Are you sure you want to remove vendor "${vendor.name}"?`)) return;
    try {
      await posPurchasesService.deleteVendor(vendor.id);
      setVendors((prev) => prev.filter((v) => v.id !== vendor.id));
      if (formVendor.toLowerCase() === vendor.name.toLowerCase()) {
        const remaining = vendors.filter((v) => v.id !== vendor.id);
        setFormVendor(remaining[0]?.name || "Metro Cash & Carry");
      }
      toast.success(`Vendor "${vendor.name}" removed.`);
    } catch {
      toast.error("Failed to remove vendor");
    }
  };

  // Add Purchase Handlers
  const handleOpenAdd = () => {
    setFormVendor(vendors[0]?.name || "Metro Cash & Carry");
    setFormInvoiceNo(`INV-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`);
    setFormInvoiceDate(todayStr);
    setFormPaymentStatus("Done");
    setFormPaidAmount("");
    setFormPaymentMethod("Cash");
    setFormTax("0");
    setFormNotes("");
    setFormItems([
      { name: "Basmati Rice Grade A (50kg Bag)", quantity: 2, unit: "Bags", unitPrice: 4500, lineTotal: 9000 },
      { name: "Refined Sunflower Oil (15L)", quantity: 3, unit: "Tins", unitPrice: 1850, lineTotal: 5550 },
    ]);
    setIsAddOpen(true);
  };

  const handleAddItemRow = () => {
    setFormItems((prev) => [
      ...prev,
      { name: "Raw Material Item", quantity: 1, unit: "kg", unitPrice: 100, lineTotal: 100 },
    ]);
  };

  const handleRemoveItemRow = (idx: number) => {
    setFormItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof PurchaseLineItem, val: string) => {
    setFormItems((prev) => {
      const copy = [...prev];
      if (field === "quantity" || field === "unitPrice") {
        const num = parseFloat(val) || 0;
        copy[idx] = { ...copy[idx], [field]: num };
        copy[idx].lineTotal = Math.round(copy[idx].quantity * copy[idx].unitPrice * 100) / 100;
      } else {
        copy[idx] = { ...copy[idx], [field]: val };
      }
      return copy;
    });
  };

  const formCalculations = useMemo(() => {
    const subtotal = formItems.reduce((acc, it) => acc + (it.lineTotal || 0), 0);
    const tax = parseFloat(formTax) || 0;
    const total = Math.round((subtotal + tax) * 100) / 100;
    return { subtotal, tax, total };
  }, [formItems, formTax]);

  const handleSubmitAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInvoiceNo.trim()) {
      toast.error("Please enter an invoice number");
      return;
    }
    if (formItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    try {
      const payload = {
        vendorName: formVendor,
        invoiceNo: formInvoiceNo.trim(),
        invoiceDate: formInvoiceDate,
        totalAmount: formCalculations.total,
        taxAmount: formCalculations.tax,
        paymentStatus: formPaymentStatus,
        paidAmount: formPaymentStatus === "Partial" ? parseFloat(formPaidAmount) || 0 : undefined,
        paymentMethod: formPaymentMethod,
        notes: formNotes.trim(),
        items: formItems,
      };

      const created = await posPurchasesService.createPurchase(payload);
      setPurchases((prev) => [created, ...prev]);
      setIsAddOpen(false);
      toast.success(`Purchase ${created.invoiceNo} recorded successfully! Stock adjusted.`);
    } catch {
      toast.error("Failed to record purchase.");
    }
  };

  const handleDeletePurchase = async (p: UnifiedPurchaseDto) => {
    if (!window.confirm(`Delete purchase invoice ${p.invoiceNo}?`)) return;
    try {
      await posPurchasesService.deletePurchase(p.id);
      setPurchases((prev) => prev.filter((item) => item.id !== p.id));
      toast.success(`Purchase ${p.invoiceNo} deleted.`);
    } catch {
      toast.error("Failed to delete purchase.");
    }
  };

  const handleExportExcel = () => {
    const headers = [
      "Invoice No",
      "Date",
      "Vendor / Supplier",
      "Items Count",
      "Total Bill (₹)",
      "Paid (₹)",
      "Balance Due (₹)",
      "Payment Status",
      "Payment Method",
      "Notes",
    ];
    const rows = filteredPurchases.map((p) => [
      p.invoiceNo,
      p.invoiceDate,
      p.vendorName,
      p.itemCount,
      p.totalAmount,
      p.paidAmount,
      p.balanceAmount,
      p.paymentStatus,
      p.payments?.[0]?.paymentMethod || "-",
      p.notes || "-",
    ]);

    exportToExcel({
      filename: `Purchases_${startDate}_to_${endDate}`,
      title: "Stock Purchases & Settlement Register",
      subtitle: `Period: ${formatToDmy(startDate)} to ${formatToDmy(endDate)} | Total Invoices: ${filteredPurchases.length}`,
      columns: headers,
      rows,
    });
    toast.success("Purchases exported to Excel (.xlsx)");
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Header with Title, Date Presets & Primary Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Purchases</h2>
            <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700">
              {filteredPurchases.length} Invoices
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <ExportToExcelButton
            onClick={handleExportExcel}
            className="h-9 px-4 rounded-xl text-[12.5px]"
          />

          <button
            type="button"
            onClick={() => setIsVendorModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
          >
            <Building2 className="h-4 w-4 text-teal-600" />
            Vendors
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm hover:bg-teal-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Purchase
          </button>
        </div>
      </div>

      {/* 2. Date Range Filter Bar (PMS Style: dd-MM-yyyy, button & border styling, slide-to-choose) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-teal-600" />
          <span className="text-[13px] font-semibold text-slate-800">Date Range</span>
          <span className="text-[12px] text-slate-400">| View stock purchases within selected date range</span>
        </div>

        {/* PMS From & To Date Trigger Buttons with Sliding Range Popover */}
        <Popover open={dateRangePopoverOpen} onOpenChange={setDateRangePopoverOpen}>
          <PopoverAnchor asChild>
            <div className="flex flex-wrap items-center gap-3">
              {/* From Date */}
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-semibold text-slate-500">From Date:</span>
                <button
                  type="button"
                  onClick={() => handleOpenDateRange("from")}
                  className={cn(
                    "flex items-center justify-between text-left font-sans font-medium cursor-pointer bg-white border rounded-xl px-3 py-1.5 min-w-[135px] text-[12.5px] text-slate-800 shadow-2xs transition",
                    dateRangePopoverOpen && activeDateField === "from"
                      ? "border-teal-600 ring-2 ring-teal-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <span className="font-sans font-medium text-slate-800">
                    {formatToDmy(startDate)}
                  </span>
                  <CalendarDays className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                </button>
              </div>

              {/* To Date */}
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-semibold text-slate-500">To Date:</span>
                <button
                  type="button"
                  onClick={() => handleOpenDateRange("to")}
                  className={cn(
                    "flex items-center justify-between text-left font-sans font-medium cursor-pointer bg-white border rounded-xl px-3 py-1.5 min-w-[135px] text-[12.5px] text-slate-800 shadow-2xs transition",
                    dateRangePopoverOpen && activeDateField === "to"
                      ? "border-teal-600 ring-2 ring-teal-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <span className="font-sans font-medium text-slate-800">
                    {formatToDmy(endDate)}
                  </span>
                  <CalendarDays className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                </button>
              </div>
            </div>
          </PopoverAnchor>

          <PopoverContent
            className="w-auto p-0 border border-slate-200 bg-white shadow-xl rounded-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
            align="end"
            sideOffset={8}
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-teal-600" />
                <span className="text-[13px] font-bold text-slate-800">
                  {tempRange?.from && !tempRange?.to ? "Slide or Click to Choose End Date" : "Select Date Range"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {tempRange?.from && tempRange?.to && (
                  <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700">
                    {Math.max(1, Math.round((tempRange.to.getTime() - tempRange.from.getTime()) / (1000 * 60 * 60 * 24)))} Days
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setDateRangePopoverOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Selection Guidance Pill */}
            <div className="px-4 pt-2.5 pb-1 flex items-center justify-between text-[11.5px] text-slate-500 border-b border-slate-100/60">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-400">Selected:</span>
                <span className="font-bold text-slate-800 font-sans">
                  {tempRange?.from ? formatToDmy(formatToYmd(tempRange.from)) : "dd-mm-yyyy"}
                </span>
                <span className="text-slate-300">→</span>
                <span className="font-bold text-slate-800 font-sans">
                  {tempRange?.to ? formatToDmy(formatToYmd(tempRange.to)) : "dd-mm-yyyy"}
                </span>
              </div>
              <span className="text-[11px] text-teal-600 font-medium">Click & slide to range</span>
            </div>

            {/* Sliding Calendar */}
            <div className="p-3">
              <PmsCalendar
                mode="range"
                numberOfMonths={2}
                selected={tempRange}
                onSelect={handleDateRangeSelect}
                selectionTarget={activeDateField === "from" ? "arrival" : "departure"}
                durationUnit="days"
                className="rounded-xl"
              />
            </div>

            {/* Popover Quick Shortcuts Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[11.5px]">
              <div className="flex items-center gap-1.5">
                {[
                  { label: "Today", days: 0 },
                  { label: "Last 7 Days", days: 7 },
                  { label: "Last 30 Days", days: 30 },
                  { label: "Last 90 Days", days: 90 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const past = new Date();
                      if (preset.days > 0) {
                        past.setDate(past.getDate() - preset.days);
                      }
                      setStartDate(formatToYmd(past));
                      setEndDate(formatToYmd(now));
                      setTempRange({ from: past, to: now });
                      setDateRangePopoverOpen(false);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (tempRange?.from) {
                    setStartDate(formatToYmd(tempRange.from));
                    setEndDate(formatToYmd(tempRange.to || tempRange.from));
                  }
                  setDateRangePopoverOpen(false);
                }}
                className="rounded-lg bg-teal-600 px-3 py-1 font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
              >
                Apply
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* 3. KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500">Total Purchase Spend</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              ₹ {metrics.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500">Bills Paid (Done)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              ₹ {metrics.doneValue.toLocaleString()}
            </span>
            <span className="text-[11.5px] text-emerald-600 font-semibold">{metrics.doneCount} Paid</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500">Payment Pending</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-950">
              ₹ {metrics.pendingBalance.toLocaleString()}
            </span>
            <span className="text-[11.5px] text-amber-700 font-semibold">{metrics.pendingCount} Bills</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-500">Suppliers Sourced</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.vendorCount}</span>
            <span className="text-[11.5px] text-blue-600 font-medium">Active Vendors</span>
          </div>
        </div>
      </div>

      {/* 4. Filter Toolbar (Search & Choose Columns) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by invoice number, vendor, or item name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2 text-[13px] text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ChooseColumnsMenu
              columns={purchaseColumns}
              visibleColumns={visibleColumns}
              onVisibleColumnsChange={setVisibleColumns}
              className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12.5px] font-medium text-slate-700 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* 5. Unified Purchases Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <DataTableHeader
              columns={purchaseColumns}
              data={sortedPurchases}
              visibleColumns={visibleColumns}
              onVisibleColumnsChange={setVisibleColumns}
              sortConfig={sortConfig}
              onSortChange={setSortConfig}
              columnFilters={columnFilters}
              onColumnFilterChange={setColumnFilters}
              themeVariant="primary"
            />
            <tbody className="divide-y divide-slate-100">
              {paginatedPurchases.length === 0 ? (
                <tr>
                  <td colSpan={activeVisibleColumnCount} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-slate-400">
                      <FileText className="h-10 w-10 text-slate-300 mb-2 stroke-[1.5]" />
                      <p className="text-[14px] font-semibold text-slate-700">No purchase bills found</p>
                      <p className="text-[12px] text-slate-400 mt-0.5">
                        {search || Object.keys(columnFilters).length > 0
                          ? "No records matching your search terms or column filters."
                          : "Record your first incoming stock purchase bill."}
                      </p>
                      {!search && Object.keys(columnFilters).length === 0 && (
                        <button
                          type="button"
                          onClick={handleOpenAdd}
                          className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-1.5 text-[12px] font-medium text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Purchase
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPurchases.map((p) => {
                  const isDone = p.paymentStatus === "Done";
                  const isPending = p.paymentStatus === "Pending";
                  const isPartial = p.paymentStatus === "Partial";

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      {visibleColumns.invoiceNo !== false && (
                        <td className="px-4 py-3.5 font-mono text-[12.5px] font-bold text-teal-700 whitespace-nowrap">
                          {p.invoiceNo}
                        </td>
                      )}
                      {visibleColumns.invoiceDate !== false && (
                        <td className="px-4 py-3.5 text-slate-600 text-[12.5px] whitespace-nowrap">
                          {p.invoiceDate}
                        </td>
                      )}
                      {visibleColumns.vendorName !== false && (
                        <td className="px-4 py-3.5 font-semibold text-slate-900">
                          {p.vendorName}
                        </td>
                      )}
                      {visibleColumns.items !== false && (
                        <td className="px-4 py-3.5 text-slate-600 text-[12.5px]">
                          <span className="font-semibold text-slate-800">{p.itemCount} SKUs</span>
                          {p.items && p.items.length > 0 && (
                            <span className="text-[11.5px] text-slate-400 block truncate max-w-xs" title={p.items.map((i) => i.name).join(", ")}>
                              {p.items.map((i) => i.name).join(", ")}
                            </span>
                          )}
                        </td>
                      )}
                      {visibleColumns.totalAmount !== false && (
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          ₹ {p.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      )}
                      {visibleColumns.paidAmount !== false && (
                        <td className="px-4 py-3.5 text-right font-mono text-slate-700 whitespace-nowrap">
                          ₹ {p.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      )}
                      {visibleColumns.balanceAmount !== false && (
                        <td className="px-4 py-3.5 text-right font-mono font-bold whitespace-nowrap">
                          {p.balanceAmount > 0 ? (
                            <span className="text-amber-700">₹ {p.balanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          ) : (
                            <span className="text-slate-400">₹ 0.00</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.paymentStatus !== false && (
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Done
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                              <Clock className="h-3.5 w-3.5" />
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-[11px] font-bold text-sky-700">
                              <AlertCircle className="h-3.5 w-3.5" />
                              Partial
                            </span>
                          )}
                        </td>
                      )}
                      {visibleColumns.actions !== false && (
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Direct Quick Pay button if not Done */}
                            {!isDone && (
                              <button
                                type="button"
                                onClick={() => handleOpenPayment(p)}
                                className="flex items-center gap-1 rounded-lg bg-teal-50 border border-teal-200 px-2.5 py-1 text-[11.5px] font-bold text-teal-700 hover:bg-teal-100 transition cursor-pointer"
                              >
                                <CreditCard className="h-3.5 w-3.5" />
                                Pay
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setDetailsModalInvoice(p)}
                              title="View Invoice & Received Items"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePurchase(p)}
                              title="Delete Purchase"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Pagination */}
        <DataTableFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={sortedPurchases.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          itemName="purchases"
        />
      </div>

      {/* 6. Record Payment Modal */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900">Record Bill Payment</h3>
                  <p className="text-[11.5px] font-mono text-teal-700">{paymentModalInvoice.invoiceNo}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalInvoice(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2">
                <div className="flex justify-between text-[12.5px]">
                  <span className="text-slate-500">Supplier:</span>
                  <span className="font-semibold text-slate-800">{paymentModalInvoice.vendorName}</span>
                </div>
                <div className="flex justify-between text-[12.5px]">
                  <span className="text-slate-500">Total Invoice Amount:</span>
                  <span className="font-mono font-medium text-slate-700">₹ {paymentModalInvoice.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[13px] border-t border-slate-200 pt-1.5">
                  <span className="font-semibold text-slate-700">Outstanding Balance:</span>
                  <span className="font-mono font-bold text-amber-700">₹ {paymentModalInvoice.balanceAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-slate-700">
                  Payment Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  max={paymentModalInvoice.balanceAmount}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[14px] font-mono font-bold text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-slate-700">Payment Mode</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
                >
                  <option value="UPI / QR">UPI / QR Code</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Card">Debit / Credit Card</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-slate-700">Reference / UTR / Cheque No.</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-998822 / NEFT-102"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[13px] text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-slate-700">Remarks / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Paid in full on 17 Oct"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-[13px] text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 px-5 py-2 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Add Purchase Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                  <PackageCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900">Record Inward Stock Purchase</h3>
                  <p className="text-[12px] text-slate-500">Record received vendor bill, incoming raw materials and payment terms.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAddPurchase} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[12px] font-semibold text-slate-700">
                    Vendor / Supplier <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.name}>
                        {v.name} ({v.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-700">
                    Invoice No <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formInvoiceNo}
                    onChange={(e) => setFormInvoiceNo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] font-mono text-slate-800 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-700">Invoice Date</label>
                  <input
                    type="date"
                    value={formInvoiceDate}
                    onChange={(e) => setFormInvoiceDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[12px] font-semibold text-slate-700">Payment Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "Done" as const, label: "Done (Paid Now)" },
                      { id: "Pending" as const, label: "Pending (Credit)" },
                      { id: "Partial" as const, label: "Partial Advance" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFormPaymentStatus(opt.id)}
                        className={`rounded-xl px-2 py-1.5 text-[11.5px] font-semibold border transition ${
                          formPaymentStatus === opt.id
                            ? "bg-teal-50 border-teal-500 text-teal-800"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Conditional Partial amount / payment method */}
              {formPaymentStatus !== "Pending" && (
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <div className="space-y-1">
                    <label className="text-[11.5px] font-semibold text-slate-700">Payment Mode</label>
                    <select
                      value={formPaymentMethod}
                      onChange={(e) => setFormPaymentMethod(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI / QR">UPI / QR Code</option>
                      <option value="Bank Transfer">Bank Transfer / NEFT</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  {formPaymentStatus === "Partial" && (
                    <div className="space-y-1">
                      <label className="text-[11.5px] font-semibold text-slate-700">Initial Paid Amount (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 5000"
                        value={formPaidAmount}
                        onChange={(e) => setFormPaidAmount(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12.5px] font-mono text-slate-800 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Items Table */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-bold text-slate-800">Raw Material Items Received</h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-[11.5px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Item
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="px-3 py-2">Item Name</th>
                        <th className="px-2 py-2 w-20 text-right">Qty</th>
                        <th className="px-2 py-2 w-16">Unit</th>
                        <th className="px-2 py-2 w-24 text-right">Rate (₹)</th>
                        <th className="px-3 py-2 w-24 text-right">Total</th>
                        <th className="px-2 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formItems.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={it.name}
                              onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-[12px] text-slate-800 focus:border-teal-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-1.5 text-right">
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={it.quantity}
                              onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-1.5 py-1 text-right text-[12px] font-mono text-slate-800 focus:border-teal-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={it.unit}
                              onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-1.5 py-1 text-[12px] text-slate-800 focus:border-teal-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-1.5 text-right">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={it.unitPrice}
                              onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-1.5 py-1 text-right text-[12px] font-mono text-slate-800 focus:border-teal-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-1.5 text-right font-mono font-semibold text-slate-900">
                            ₹ {it.lineTotal.toFixed(2)}
                          </td>
                          <td className="p-1.5 text-center">
                            {formItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItemRow(idx)}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal & Total Box */}
                <div className="flex justify-end gap-6 pt-2 text-[12.5px] border-t border-slate-100">
                  <div className="text-right space-y-1">
                    <span className="text-slate-500 block">Subtotal:</span>
                    <span className="text-slate-500 block">GST / Tax:</span>
                    <span className="font-bold text-slate-900 block text-[14px]">Total Bill:</span>
                  </div>
                  <div className="text-right space-y-1 font-mono font-semibold">
                    <span className="text-slate-700 block">₹ {formCalculations.subtotal.toFixed(2)}</span>
                    <div className="flex items-center justify-end gap-1">
                      <span>₹</span>
                      <input
                        type="number"
                        step="any"
                        value={formTax}
                        onChange={(e) => setFormTax(e.target.value)}
                        className="w-20 rounded border border-slate-200 px-1 py-0.5 text-right font-mono text-[12px]"
                      />
                    </div>
                    <span className="font-bold text-teal-800 block text-[15px]">
                      ₹ {formCalculations.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-slate-700">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Delivery received via vehicle MH-12-8822"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 px-5 py-2 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700"
                >
                  Record Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Purchase Details Modal */}
      {detailsModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div>
                <h3 className="text-[16px] font-bold text-slate-900">
                  Purchase Invoice · {detailsModalInvoice.invoiceNo}
                </h3>
                <p className="text-[12px] text-slate-500">
                  Supplier: <strong>{detailsModalInvoice.vendorName}</strong> · {detailsModalInvoice.invoiceDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModalInvoice(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Financial summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">Total Bill</span>
                  <p className="text-[15px] font-bold font-mono text-slate-900 mt-0.5">
                    ₹ {detailsModalInvoice.totalAmount.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">Paid (Done)</span>
                  <p className="text-[15px] font-bold font-mono text-emerald-700 mt-0.5">
                    ₹ {detailsModalInvoice.paidAmount.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">Balance Due</span>
                  <p className="text-[15px] font-bold font-mono text-amber-700 mt-0.5">
                    ₹ {detailsModalInvoice.balanceAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-[13px] font-bold text-slate-800">Items Received</h4>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="px-3 py-2">Item</th>
                        <th className="px-2 py-2 text-right">Qty</th>
                        <th className="px-2 py-2 text-right">Rate</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailsModalInvoice.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-medium text-slate-800">{it.name}</td>
                          <td className="px-2 py-2 text-right text-slate-600 font-mono">{it.quantity} {it.unit}</td>
                          <td className="px-2 py-2 text-right text-slate-500">₹ {it.unitPrice}</td>
                          <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900">
                            ₹ {it.lineTotal?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payments History */}
              {detailsModalInvoice.payments && detailsModalInvoice.payments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[13px] font-bold text-slate-800">Payment Transactions</h4>
                  <div className="space-y-1.5">
                    {detailsModalInvoice.payments.map((pm) => (
                      <div
                        key={pm.id}
                        className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-[12px]"
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-800">
                            ₹ {pm.amount.toLocaleString()} via {pm.paymentMethod}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {pm.paymentDate} · Ref: {pm.referenceNo || "Direct"}
                          </span>
                        </div>
                        <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10.5px] font-bold">
                          Settled
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailsModalInvoice.notes && (
                <div className="space-y-1">
                  <span className="text-[12px] font-semibold text-slate-500">Remarks:</span>
                  <p className="rounded-xl bg-slate-50 p-2.5 text-[12px] text-slate-700">
                    {detailsModalInvoice.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 bg-slate-50/50">
              <span className="text-[11.5px] text-slate-500">
                Payment status:{" "}
                <strong
                  className={
                    detailsModalInvoice.paymentStatus === "Done"
                      ? "text-emerald-700"
                      : detailsModalInvoice.paymentStatus === "Pending"
                      ? "text-amber-700"
                      : "text-sky-700"
                  }
                >
                  {detailsModalInvoice.paymentStatus}
                </strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toast.success(`Printing purchase invoice ${detailsModalInvoice.invoiceNo}...`)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-100"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500" />
                  Print Slip
                </button>
                <button
                  type="button"
                  onClick={() => setDetailsModalInvoice(null)}
                  className="rounded-xl bg-slate-900 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Vendor Management Modal */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700 shadow-2xs">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900">Vendors & Suppliers</h3>
                  <p className="text-[12px] text-slate-500">
                    Add new suppliers or remove existing ones. Updates reflect instantly in all purchase dropdowns.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVendorForm((prev) => !prev)}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[12px] font-semibold transition cursor-pointer ${
                    showAddVendorForm
                      ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      : "bg-teal-600 text-white shadow-xs hover:bg-teal-700"
                  }`}
                >
                  {showAddVendorForm ? (
                    <>
                      <X className="h-3.5 w-3.5" />
                      Close Form
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      Add Vendor
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsVendorModalOpen(false);
                    setShowAddVendorForm(false);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Add Vendor Form (collapsible) */}
              {showAddVendorForm && (
                <form
                  onSubmit={handleSaveVendor}
                  className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4.5 space-y-4 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                    <span className="text-[13px] font-bold text-teal-950 flex items-center gap-1.5">
                      <Plus className="h-4 w-4 text-teal-600" />
                      New Vendor Details
                    </span>
                    <span className="text-[11px] text-slate-500">All fields marked * are required</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[12px] font-semibold text-slate-700">
                        Vendor / Company Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Metro Cash & Carry, Royal Dairy"
                        value={newVendorName}
                        onChange={(e) => setNewVendorName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[12px] font-semibold text-slate-700">Category / Supply Type</label>
                      <select
                        value={newVendorCategory}
                        onChange={(e) => setNewVendorCategory(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-none"
                      >
                        <option value="Groceries & Dry Goods">Groceries & Dry Goods</option>
                        <option value="Dairy & Milk">Dairy & Milk</option>
                        <option value="Fresh Produce">Fresh Produce</option>
                        <option value="Meat & Poultry">Meat & Poultry</option>
                        <option value="Beverages & Liquor">Beverages & Liquor</option>
                        <option value="Bakery & Sweets">Bakery & Sweets</option>
                        <option value="Packaging & Disposables">Packaging & Disposables</option>
                        <option value="Kitchen Supplies">Kitchen Supplies</option>
                        <option value="General">General</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[12px] font-semibold text-slate-700">Contact Person</label>
                      <input
                        type="text"
                        placeholder="e.g. Vikram Patel"
                        value={newVendorContact}
                        onChange={(e) => setNewVendorContact(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[12px] font-semibold text-slate-700">Phone Number</label>
                      <input
                        type="text"
                        placeholder="e.g. +91 98200 12345"
                        value={newVendorPhone}
                        onChange={(e) => setNewVendorPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[12px] font-semibold text-slate-700">Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. contact@supplier.com"
                        value={newVendorEmail}
                        onChange={(e) => setNewVendorEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[12px] font-semibold text-slate-700">GSTIN / Tax ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 27AABCM1234F1Z5"
                        value={newVendorGstin}
                        onChange={(e) => setNewVendorGstin(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-mono text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[12px] font-semibold text-slate-700">Physical Address / Warehouse</label>
                      <input
                        type="text"
                        placeholder="e.g. Plot 12, APMC Market Yard, Navi Mumbai"
                        value={newVendorAddress}
                        onChange={(e) => setNewVendorAddress(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddVendorForm(false)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingVendor}
                      className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2 text-[12px] font-semibold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer disabled:opacity-50"
                    >
                      {savingVendor ? "Saving..." : "Save Vendor"}
                    </button>
                  </div>
                </form>
              )}

              {/* Vendors List Search Bar */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search vendor name, contact, category..."
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-[12.5px] text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-500 focus:outline-none transition"
                  />
                  {vendorSearch && (
                    <button
                      type="button"
                      onClick={() => setVendorSearch("")}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-[12px] font-medium text-slate-500">
                  Showing <strong>{filteredModalVendors.length}</strong> vendors
                </span>
              </div>

              {/* Vendors List Table / Cards */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                {filteredModalVendors.length === 0 ? (
                  <div className="p-8 text-center">
                    <Building2 className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-[13px] font-medium text-slate-600">No vendors found</p>
                    <p className="text-[12px] text-slate-400 mt-0.5">Click "+ Add Vendor" above to register your first supplier.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                    {filteredModalVendors.map((v) => (
                      <div
                        key={v.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-slate-50/80 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[13.5px] font-bold text-slate-900">{v.name}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600">
                              {v.category || "General"}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-slate-500">
                            {v.contactPerson && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3 text-slate-400" />
                                {v.contactPerson}
                              </span>
                            )}
                            {v.phone && (
                              <span className="flex items-center gap-1 font-mono">
                                <Phone className="h-3 w-3 text-slate-400" />
                                {v.phone}
                              </span>
                            )}
                            {v.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-slate-400" />
                                {v.email}
                              </span>
                            )}
                            {v.gstin && (
                              <span className="flex items-center gap-1 font-mono">
                                <Tag className="h-3 w-3 text-slate-400" />
                                GSTIN: {v.gstin}
                              </span>
                            )}
                          </div>
                          {v.address && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-300 shrink-0" />
                              {v.address}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteVendor(v)}
                            className="flex items-center gap-1 rounded-xl p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                            title={`Remove vendor ${v.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="text-[11.5px] font-semibold sm:hidden">Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 bg-slate-50/50">
              <span className="text-[11.5px] text-slate-500">
                Any changes made here immediately sync with purchase orders, inward stock bills, and filters.
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsVendorModalOpen(false);
                  setShowAddVendorForm(false);
                }}
                className="rounded-xl bg-slate-900 px-4 py-2 text-[12px] font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
