import { useState, useMemo } from "react";
import {
  ShieldCheck,
  Building2,
  FileText,
  CheckCircle2,
  Upload,
  Download,
  Eye,
  Copy,
  Check,
  ExternalLink,
  Plus,
  RefreshCw,
  UtensilsCrossed,
  Wine,
  Flame,
  UserCheck,
  Calendar,
  AlertCircle,
  FileCheck2,
  Lock,
  ChevronDown,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  DataTableHeader,
  DataTableFooter,
  type DataTableColumn,
} from "@/components/common";
import { PosDataGrid } from "@/components/ui/data-grid";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface KycDocument {
  id: string;
  name: string;
  category: "Food Safety" | "Excise & Bar" | "Tax & Corporate" | "Municipal & Fire" | "Identity Proof";
  docNumber: string;
  issuingAuthority: string;
  issuedOn: string;
  validTill: string;
  status: "Verified" | "Expiring Soon" | "Pending Review";
  fileName: string;
  fileSize: string;
}

const INITIAL_DOCUMENTS: KycDocument[] = [
  {
    id: "doc-1",
    name: "FSSAI Food Business License",
    category: "Food Safety",
    docNumber: "12023999000142",
    issuingAuthority: "Food Safety and Standards Authority of India",
    issuedOn: "25 Dec 2022",
    validTill: "24 Dec 2027",
    status: "Verified",
    fileName: "FSSAI_License_HighwayInn.pdf",
    fileSize: "1.4 MB",
  },
  {
    id: "doc-2",
    name: "Bar & Restaurant Liquor License (FL-4)",
    category: "Excise & Bar",
    docNumber: "EXC-OD-ANG-8921",
    issuingAuthority: "State Excise Department, Odisha",
    issuedOn: "01 Apr 2024",
    validTill: "31 Mar 2027",
    status: "Verified",
    fileName: "Excise_Liquor_License_2026_27.pdf",
    fileSize: "2.1 MB",
  },
  {
    id: "doc-3",
    name: "Business PAN Card",
    category: "Tax & Corporate",
    docNumber: "AAACH1234F",
    issuingAuthority: "Income Tax Department, Govt of India",
    issuedOn: "14 May 2021",
    validTill: "Permanent",
    status: "Verified",
    fileName: "PAN_Highway_Inn_PvtLtd.pdf",
    fileSize: "840 KB",
  },
  {
    id: "doc-4",
    name: "GSTIN Registration Certificate",
    category: "Tax & Corporate",
    docNumber: "21AAAAA0000A1Z5",
    issuingAuthority: "Goods and Services Tax Network",
    issuedOn: "18 Jun 2021",
    validTill: "Active",
    status: "Verified",
    fileName: "GST_REG_06_Certificate.pdf",
    fileSize: "1.2 MB",
  },
  {
    id: "doc-5",
    name: "Eating House & Health Trade License",
    category: "Municipal & Fire",
    docNumber: "MOH-EHL-2026-4821",
    issuingAuthority: "Municipal Corporation / Health Dept",
    issuedOn: "01 Apr 2025",
    validTill: "31 Mar 2027",
    status: "Verified",
    fileName: "Health_Trade_License_2026.pdf",
    fileSize: "1.1 MB",
  },
  {
    id: "doc-6",
    name: "Fire Safety Compliance NOC",
    category: "Municipal & Fire",
    docNumber: "FS-NOC-2026-991",
    issuingAuthority: "State Fire and Emergency Services",
    issuedOn: "10 Feb 2025",
    validTill: "09 Feb 2027",
    status: "Verified",
    fileName: "Fire_Safety_NOC_2026.pdf",
    fileSize: "1.8 MB",
  },
];

export function KycDetailsView() {
  const [documents, setDocuments] = useState<KycDocument[]>(INITIAL_DOCUMENTS);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Table Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ colId: string; direction: "asc" | "desc" } | null>(null);

  // Upload Document Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [validTill, setValidTill] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  // View Document Preview Modal State
  const [viewingDoc, setViewingDoc] = useState<KycDocument | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Filtered & Sorted Documents for Table
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (selectedCategory !== "All" && doc.category !== selectedCategory) return false;
      if (selectedStatus !== "All" && doc.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          doc.name.toLowerCase().includes(q) ||
          doc.docNumber.toLowerCase().includes(q) ||
          doc.issuingAuthority.toLowerCase().includes(q) ||
          doc.category.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [documents, searchQuery, selectedCategory, selectedStatus]);

  const sortedDocuments = useMemo(() => {
    if (!sortConfig) return filteredDocuments;
    return [...filteredDocuments].sort((a, b) => {
      const field = sortConfig.colId as keyof KycDocument;
      const aVal = a[field] ?? "";
      const bVal = b[field] ?? "";
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredDocuments, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedDocuments.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedDocuments = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return sortedDocuments.slice(start, start + pageSize);
  }, [sortedDocuments, validPage, pageSize]);

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedDocuments.length && sortedDocuments.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedDocuments.map((d) => d.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const columns: any[] = useMemo(
    () => [
      {
        id: "name",
        header: "Document Name",
        label: "Document Name",
        sortable: true,
        filterable: true,
        width: 250,
        render: (_: any, doc: KycDocument) => (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-teal-700 border border-slate-200">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">{doc.name}</div>
              <div className="text-[11px] text-slate-400 font-mono">
                {doc.fileName} • {doc.fileSize}
              </div>
            </div>
          </div>
        ),
        getValue: (r: KycDocument) => r.name,
      },
      {
        id: "category",
        header: "Category",
        label: "Category",
        sortable: true,
        filterable: true,
        width: 150,
        render: (_: any, doc: KycDocument) => (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
            {doc.category}
          </span>
        ),
        getValue: (r: KycDocument) => r.category,
      },
      {
        id: "docNumber",
        header: "License / Document No.",
        label: "License / Document No.",
        sortable: true,
        filterable: true,
        width: 190,
        render: (_: any, doc: KycDocument) => (
          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
            <span>{doc.docNumber}</span>
            <button
              type="button"
              onClick={() => handleCopy(doc.docNumber, `tbl-${doc.id}`)}
              className="p-0.5 text-slate-400 hover:text-teal-600 cursor-pointer"
              title="Copy License Number"
            >
              {copiedField === `tbl-${doc.id}` ? (
                <Check className="h-3 w-3 text-emerald-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        ),
        getValue: (r: KycDocument) => r.docNumber,
      },
      {
        id: "issuingAuthority",
        header: "Issuing Authority",
        label: "Issuing Authority",
        sortable: true,
        filterable: true,
        width: 230,
        render: (_: any, doc: KycDocument) => (
          <span className="text-slate-600 text-[12px]">{doc.issuingAuthority}</span>
        ),
        getValue: (r: KycDocument) => r.issuingAuthority,
      },
      {
        id: "issuedOn",
        header: "Issued Date",
        label: "Issued Date",
        sortable: true,
        width: 130,
        render: (_: any, doc: KycDocument) => (
          <span className="text-slate-500 font-mono text-[11.5px]">{doc.issuedOn}</span>
        ),
        getValue: (r: KycDocument) => r.issuedOn,
      },
      {
        id: "validTill",
        header: "Expiry / Validity",
        label: "Expiry / Validity",
        sortable: true,
        width: 140,
        render: (_: any, doc: KycDocument) => (
          <span className="font-semibold text-slate-800">{doc.validTill}</span>
        ),
        getValue: (r: KycDocument) => r.validTill,
      },
      {
        id: "status",
        header: "Status",
        label: "Status",
        sortable: true,
        filterable: true,
        align: "center",
        width: 130,
        render: (_: any, doc: KycDocument) => (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              doc.status === "Verified"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : doc.status === "Expiring Soon"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-slate-100 text-slate-700 border border-slate-200"
            }`}
          >
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            {doc.status}
          </span>
        ),
        getValue: (r: KycDocument) => r.status,
      },
      {
        id: "actions",
        header: "Actions",
        label: "Actions",
        sortable: false,
        filterable: false,
        align: "right",
        width: 100,
        render: (_: any, doc: KycDocument) => (
          <div className="inline-flex items-center gap-1 text-slate-400">
            <button
              type="button"
              onClick={() => setViewingDoc(doc)}
              className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-teal-600 transition cursor-pointer"
              title="Preview Certificate"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => toast.success(`Downloading ${doc.fileName}...`)}
              className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
              title="Download Certificate"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [copiedField]
  );

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!docType) errs.docType = "Please select document type.";
    if (!docNumber.trim()) errs.docNumber = "Document / License number is required.";
    if (!issuingAuthority.trim()) errs.issuingAuthority = "Issuing authority is required.";
    if (!validTill.trim()) errs.validTill = "Validity / Expiry date is required.";
    if (!selectedFile) errs.file = "Please upload a valid PDF or image document.";

    setUploadErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Please fill all mandatory fields marked with red star (*)");
      return;
    }

    const newDoc: KycDocument = {
      id: `doc-${Date.now()}`,
      name: docType,
      category:
        docType.includes("FSSAI")
          ? "Food Safety"
          : docType.includes("Liquor") || docType.includes("Bar")
          ? "Excise & Bar"
          : docType.includes("PAN") || docType.includes("GST")
          ? "Tax & Corporate"
          : "Municipal & Fire",
      docNumber: docNumber.trim().toUpperCase(),
      issuingAuthority: issuingAuthority.trim(),
      issuedOn: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      validTill: validTill.trim(),
      status: "Verified",
      fileName: selectedFile ? selectedFile.name : `${docType.replace(/\s+/g, "_")}.pdf`,
      fileSize: selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB` : "1.2 MB",
    };

    setDocuments((prev) => [newDoc, ...prev]);
    toast.success(`${docType} uploaded and registered under KYC compliance`);
    setIsUploadOpen(false);

    // Reset Form
    setDocType("");
    setDocNumber("");
    setIssuingAuthority("");
    setValidTill("");
    setSelectedFile(null);
    setUploadErrors({});
  };

  return (
    <div className="w-full space-y-5 pb-12">
      {/* 1. Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">KYC & Compliance Details</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Level-3 Verified
            </span>
          </div>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            Merchant verification status, statutory operating licenses, and regulatory identity documentation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportToExcelButton
            onClick={() => toast.success("Exporting consolidated compliance pack to Excel...")}
          />

          <button
            type="button"
            onClick={() => {
              setDocType("");
              setDocNumber("");
              setIssuingAuthority("");
              setValidTill("");
              setSelectedFile(null);
              setUploadErrors({});
              setIsUploadOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-teal-700 active:scale-[0.98] transition cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" /> Upload Document
          </button>
        </div>
      </div>

      {/* 2. Top Banner Card: Verified Outlet Summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-bold text-slate-900">
                  HIGHWAY INN BAR & RESTAURANT PVT. LTD.
                </span>
                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  KYC Verified & Compliant
                </span>
              </div>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Business PAN, FSSAI Food License (#12023999000142), State Excise Bar License (FL-4), and Health Trade NOC verified.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 pt-3 lg:pt-0 lg:pl-5">
            <div>
              <div className="text-[11px] font-medium text-slate-400">KYC Reference</div>
              <div className="font-mono text-[13px] font-bold text-slate-800">KYC-2026-RET-8941</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400">Next Audit</div>
              <div className="text-[12px] font-semibold text-emerald-600">Jan 2027</div>
            </div>
            <button
              type="button"
              onClick={() => toast.info("Compliance status refreshed with central registrar.")}
              className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-50 transition cursor-pointer"
              title="Refresh Verification"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar for Compliance Table */}
      <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1 flex-1 min-w-[220px]">
            <label className="text-[11.5px] font-semibold text-slate-600">Search Document / License</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by license no, authority, or document name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-[12.5px] text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1 min-w-[150px]">
            <label className="text-[11.5px] font-semibold text-slate-600">Category</label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-1.5 text-[12.5px] text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="Food Safety">Food Safety</option>
                <option value="Excise & Bar">Excise & Bar</option>
                <option value="Tax & Corporate">Tax & Corporate</option>
                <option value="Municipal & Fire">Municipal & Fire</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1 min-w-[130px]">
            <label className="text-[11.5px] font-semibold text-slate-600">Status</label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-8 py-1.5 text-[12.5px] text-slate-800 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Verified">Verified</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Pending Review">Pending Review</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info(`Found ${filteredDocuments.length} matching compliance records`)}
              className="rounded-lg bg-teal-600 px-5 py-1.5 text-[12.5px] font-semibold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setSelectedStatus("All");
                setCurrentPage(1);
                toast.info("Showing all compliance documents");
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-[12.5px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              Show All
            </button>
          </div>
        </div>
      </div>

      {/* 4. Full Width Table with Attached DataTableHeader & DataTableFooter */}
      <div className="rounded-2xl border border-slate-300 bg-white shadow-xs overflow-hidden">
        <PosDataGrid
          data={filteredDocuments}
          columns={columns}
          keyField="id"
          selectable
          selectedRowIds={selectedIds}
          onSelectionChange={(ids: any) => setSelectedIds(ids as string[])}
          storageKey="pos-accounting-kyc-details"
          pageSize={10}
          themeVariant="primary"
          emptyMessage="No compliance documents found matching your filter criteria."
        />
      </div>

      {/* 5. Upload Document Modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-teal-700 shadow-2xs">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-[16px] font-bold tracking-tight text-slate-900">
                  Upload Compliance Document
                </DialogTitle>
                <DialogDescription className="text-[12px] text-slate-500 mt-0.5">
                  Submit authentic statutory licenses for merchant KYC verification.
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Document Type */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-700">
                Document / License Type <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              <select
                value={docType}
                onChange={(e) => {
                  setDocType(e.target.value);
                  if (uploadErrors.docType) {
                    setUploadErrors((prev) => {
                      const next = { ...prev };
                      delete next.docType;
                      return next;
                    });
                  }
                }}
                className={`w-full rounded-xl border bg-white px-3 py-2 text-[13px] text-slate-800 focus:outline-none cursor-pointer shadow-2xs ${
                  uploadErrors.docType
                    ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                    : "border-slate-300 focus:border-teal-500"
                }`}
              >
                <option value="" disabled>
                  Select Document Type
                </option>
                <option value="FSSAI Food Business License">FSSAI Food Business License</option>
                <option value="Bar & Restaurant Liquor License">Bar & Restaurant Liquor License</option>
                <option value="Eating House / Municipal Health Trade License">
                  Eating House / Municipal Health Trade License
                </option>
                <option value="Fire Safety NOC">Fire Safety NOC</option>
                <option value="Pollution Control Board Clearance">Pollution Control Board Clearance</option>
                <option value="Business PAN Card">Business PAN Card</option>
                <option value="GSTIN Registration Certificate">GSTIN Registration Certificate</option>
                <option value="Authorized Signatory Identity Proof">Authorized Signatory Identity Proof</option>
                <option value="Other Statutory License">Other Statutory License</option>
              </select>
              {uploadErrors.docType && (
                <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{uploadErrors.docType}</span>
                </div>
              )}
            </div>

            {/* License / Document Number */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-700">
                Document / License Number <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 12023999000142 or EXC-OD-ANG-8921"
                value={docNumber}
                onChange={(e) => {
                  setDocNumber(e.target.value);
                  if (uploadErrors.docNumber) {
                    setUploadErrors((prev) => {
                      const next = { ...prev };
                      delete next.docNumber;
                      return next;
                    });
                  }
                }}
                className={`w-full font-mono rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                  uploadErrors.docNumber
                    ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                    : "border-slate-300 bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                }`}
              />
              {uploadErrors.docNumber && (
                <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{uploadErrors.docNumber}</span>
                </div>
              )}
            </div>

            {/* Issuing Authority & Expiry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Issuing Authority <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. FSSAI / State Excise"
                  value={issuingAuthority}
                  onChange={(e) => {
                    setIssuingAuthority(e.target.value);
                    if (uploadErrors.issuingAuthority) {
                      setUploadErrors((prev) => {
                        const next = { ...prev };
                        delete next.issuingAuthority;
                        return next;
                      });
                    }
                  }}
                  className={`w-full rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    uploadErrors.issuingAuthority
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                      : "border-slate-300 bg-white focus:border-teal-500"
                  }`}
                />
                {uploadErrors.issuingAuthority && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{uploadErrors.issuingAuthority}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Valid Till / Expiry <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 24 Dec 2027 or Permanent"
                  value={validTill}
                  onChange={(e) => {
                    setValidTill(e.target.value);
                    if (uploadErrors.validTill) {
                      setUploadErrors((prev) => {
                        const next = { ...prev };
                        delete next.validTill;
                        return next;
                      });
                    }
                  }}
                  className={`w-full rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    uploadErrors.validTill
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                      : "border-slate-300 bg-white focus:border-teal-500"
                  }`}
                />
                {uploadErrors.validTill && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{uploadErrors.validTill}</span>
                  </div>
                )}
              </div>
            </div>

            {/* File Upload Box */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-700 flex items-center justify-between">
                <span>
                  Upload Document File (PDF / JPG / PNG) <span className="text-rose-500 font-bold ml-0.5">*</span>
                </span>
                <span className="text-[11px] text-slate-400">Max 10 MB</span>
              </label>

              <div
                className={`relative rounded-xl border-2 border-dashed p-4 text-center transition cursor-pointer hover:bg-slate-50 ${
                  uploadErrors.file ? "border-rose-400 bg-rose-50/20" : "border-slate-300 bg-slate-50/50"
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                      if (uploadErrors.file) {
                        setUploadErrors((prev) => {
                          const next = { ...prev };
                          delete next.file;
                          return next;
                        });
                      }
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="space-y-1">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white text-teal-600 shadow-2xs border border-slate-200">
                    <Upload className="h-4.5 w-4.5" />
                  </div>
                  {selectedFile ? (
                    <div className="text-[12.5px] font-semibold text-teal-800">
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  ) : (
                    <>
                      <div className="text-[12.5px] font-medium text-slate-700">
                        Click or drag document to upload
                      </div>
                      <p className="text-[11px] text-slate-400">
                        High resolution scanned PDF, PNG, or JPG formats
                      </p>
                    </>
                  )}
                </div>
              </div>
              {uploadErrors.file && (
                <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{uploadErrors.file}</span>
                </div>
              )}
            </div>

            <DialogFooter className="pt-3 gap-2 sm:gap-0 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-teal-600 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-teal-700 active:scale-[0.98] transition cursor-pointer shadow-sm shadow-teal-600/20"
              >
                Submit for Verification
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 8. View Document Preview Modal */}
      {viewingDoc && (
        <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
          <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-4.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-teal-700 shadow-2xs">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-[15px] font-bold text-slate-900">
                    {viewingDoc.name}
                  </DialogTitle>
                  <DialogDescription className="text-[11.5px] text-slate-500">
                    Authenticated statutory compliance certificate
                  </DialogDescription>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Document Certificate Card Preview */}
              <div className="rounded-xl border-2 border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 space-y-4 shadow-inner text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold text-[13.5px]">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" /> Government Authenticated
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">License Number</div>
                  <div className="font-mono text-[16px] font-bold text-slate-900 tracking-wider">
                    {viewingDoc.docNumber}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left bg-white p-3 rounded-lg border border-slate-200/80 text-[11.5px]">
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">Authority</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {viewingDoc.issuingAuthority}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">Valid Until</span>
                    <span className="font-semibold text-slate-800">{viewingDoc.validTill}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-100">
                    <span className="text-slate-400 block text-[10.5px]">Beneficiary Name</span>
                    <span className="font-semibold text-slate-800">HIGHWAY INN BAR & RESTAURANT</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                  <Lock className="h-3 w-3 text-slate-400" /> Digital SHA-256 Checksum Verified
                </div>
              </div>

              <div className="flex items-center justify-between text-[12px] text-slate-500 pt-1">
                <span>File: {viewingDoc.fileName}</span>
                <span>{viewingDoc.fileSize}</span>
              </div>
            </div>

            <DialogFooter className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Close Preview
              </button>

              <button
                type="button"
                onClick={() => {
                  toast.success(`Downloading ${viewingDoc.fileName}...`);
                  setViewingDoc(null);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-teal-700 transition cursor-pointer shadow-sm shadow-teal-600/20"
              >
                <Download className="h-3.5 w-3.5" /> Download Copy
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
