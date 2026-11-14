import { useState, useMemo, useEffect } from "react";
import { useOutletContext } from "@/context/PosOutletContext";
import posManagementService from "@/services/posManagementService";
import {
  Building2,
  Plus,
  CheckCircle2,
  Edit2,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  ArrowRightLeft,
  Sparkles,
  Landmark,
  AlertCircle,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface BankAccount {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: "Current A/C" | "Savings A/C" | "OD / CC A/C" | string;
  branchName: string;
  isPrimary: boolean;
  status: "Verified" | "Pending Verification";
  upiVpa?: string;
  addedAt: string;
}

const INITIAL_ACCOUNTS: BankAccount[] = [];

const POPULAR_BANKS = [
  "HDFC Bank",
  "ICICI Bank",
  "State Bank of India",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "IndusInd Bank",
  "Yes Bank",
  "Canara Bank",
  "Other",
];

const ACCOUNT_TYPES = [
  "Current A/C",
  "Savings A/C",
  "OD / CC A/C",
];

function maskAccountNumber(acc: string): string {
  if (acc.length <= 4) return acc;
  const lastFour = acc.slice(-4);
  return `************${lastFour}`;
}

export function BankDetailsView() {
  const { activeOutlet } = useOutletContext();
  const [accounts, setAccounts] = useState<BankAccount[]>(INITIAL_ACCOUNTS);

  useEffect(() => {
    if (!activeOutlet?.id) return;
    posManagementService.getBankAccounts(activeOutlet.id).then((res) => {
      setAccounts(
        (res || []).map((b) => ({
          id: b.id,
          bankName: b.bank_name,
          accountHolderName: b.account_name,
          accountNumber: b.account_number,
          ifscCode: b.ifsc_code,
          accountType: "Current A/C",
          branchName: b.branch_name,
          isPrimary: b.is_primary,
          status: b.status === "ACTIVE" || b.status === "VERIFIED" ? "Verified" : "Pending Verification",
          upiVpa: b.upi_vpa,
          addedAt: "Registered",
        }))
      );
    }).catch(() => {});
  }, [activeOutlet?.id]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form State
  const [formBankName, setFormBankName] = useState("");
  const [formCustomBank, setFormCustomBank] = useState("");
  const [formAccountHolder, setFormAccountHolder] = useState("");
  const [formAccountNumber, setFormAccountNumber] = useState("");
  const [formConfirmAccountNumber, setFormConfirmAccountNumber] = useState("");
  const [formIfscCode, setFormIfscCode] = useState("");
  const [formAccountType, setFormAccountType] = useState("");
  const [formBranchName, setFormBranchName] = useState("");
  const [formIsPrimary, setFormIsPrimary] = useState(false);
  const [formUpiVpa, setFormUpiVpa] = useState("");

  // Touch tracking for real-time validation error rendering
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Real-time field errors
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    const finalBank = formBankName === "Other" ? formCustomBank.trim() : formBankName;

    // 1. Account Holder Legal Name
    if (!formAccountHolder.trim()) {
      errs.accountHolder = "Account holder legal name is required.";
    } else if (formAccountHolder.trim().length < 3) {
      errs.accountHolder = "Name must contain at least 3 characters.";
    }

    // 2. Bank Name
    if (!formBankName) {
      errs.bankName = "Please select a bank from the list.";
    } else if (formBankName === "Other" && !formCustomBank.trim()) {
      errs.bankName = "Please enter the full bank name.";
    }

    // 3. Account Type
    if (!formAccountType) {
      errs.accountType = "Please select the account type.";
    }

    // 4. Account Number
    if (!formAccountNumber.trim()) {
      errs.accountNumber = "Account number is required.";
    } else if (!/^\d{8,18}$/.test(formAccountNumber.trim())) {
      errs.accountNumber = "Account number must be between 8 and 18 digits.";
    }

    // 5. Confirm Account Number (must match account number)
    if (!formConfirmAccountNumber.trim()) {
      errs.confirmAccountNumber = "Please re-enter account number to confirm.";
    } else if (formAccountNumber.trim() !== formConfirmAccountNumber.trim()) {
      errs.confirmAccountNumber = "Account numbers do not match. Please ensure both fields are identical.";
    }

    // 6. IFSC Code
    if (!formIfscCode.trim()) {
      errs.ifscCode = "IFSC code is required.";
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formIfscCode.trim().toUpperCase())) {
      errs.ifscCode = "Invalid IFSC code format (e.g. HDFC0001248, 11 alphanumeric characters).";
    }

    return errs;
  }, [
    formAccountHolder,
    formBankName,
    formCustomBank,
    formAccountType,
    formAccountNumber,
    formConfirmAccountNumber,
    formIfscCode,
  ]);

  // Overall form validity — Submit button is strictly non-clickable if false
  const isFormValid = Object.keys(errors).length === 0;

  const openAddModal = () => {
    setEditingAccountId(null);
    setFormBankName("");
    setFormCustomBank("");
    setFormAccountHolder("");
    setFormAccountNumber("");
    setFormConfirmAccountNumber("");
    setFormIfscCode("");
    setFormAccountType("");
    setFormBranchName("");
    setFormIsPrimary(accounts.length === 0);
    setFormUpiVpa("");
    setTouched({});
    setIsModalOpen(true);
  };

  const openEditModal = (account: BankAccount) => {
    setEditingAccountId(account.id);
    if (POPULAR_BANKS.includes(account.bankName)) {
      setFormBankName(account.bankName);
      setFormCustomBank("");
    } else {
      setFormBankName("Other");
      setFormCustomBank(account.bankName);
    }
    setFormAccountHolder(account.accountHolderName);
    setFormAccountNumber(account.accountNumber);
    setFormConfirmAccountNumber(account.accountNumber);
    setFormIfscCode(account.ifscCode);
    setFormAccountType(account.accountType);
    setFormBranchName(account.branchName);
    setFormIsPrimary(account.isPrimary);
    setFormUpiVpa(account.upiVpa || "");
    // In edit mode, mark all touched
    setTouched({
      accountHolder: true,
      bankName: true,
      accountType: true,
      accountNumber: true,
      confirmAccountNumber: true,
      ifscCode: true,
    });
    setIsModalOpen(true);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSetPrimary = (id: string) => {
    setAccounts((prev) =>
      prev.map((acc) => ({
        ...acc,
        isPrimary: acc.id === id,
      }))
    );
    const primaryAccount = accounts.find((a) => a.id === id);
    toast.success(`${primaryAccount?.bankName || "Account"} is now the Primary Settlement Account`);
  };

  const handleDeleteAccount = (id: string) => {
    const acc = accounts.find((a) => a.id === id);
    if (!acc) return;

    if (acc.isPrimary && accounts.length > 1) {
      toast.error("Please assign another account as Primary Settlement before deleting this one.");
      return;
    }

    setAccounts((prev) => prev.filter((a) => a.id !== id));
    toast.success(`Removed ${acc.bankName} account`);
  };

  const handleIfscLookup = (code: string) => {
    const clean = code.toUpperCase().trim();
    setFormIfscCode(clean);
    markTouched("ifscCode");
    if (clean.length === 11 && !formBranchName) {
      if (clean.startsWith("HDFC")) {
        setFormBranchName("HDFC Indiranagar Branch, Bengaluru");
      } else if (clean.startsWith("ICIC")) {
        setFormBranchName("ICICI MG Road Branch, Bengaluru");
      } else if (clean.startsWith("SBIN")) {
        setFormBranchName("SBI Koramangala Branch, Bengaluru");
      } else if (clean.startsWith("UTIB")) {
        setFormBranchName("Axis Bank Electronic City Branch, Bengaluru");
      }
    }
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark everything touched
    setTouched({
      accountHolder: true,
      bankName: true,
      accountType: true,
      accountNumber: true,
      confirmAccountNumber: true,
      ifscCode: true,
    });

    if (!isFormValid) {
      toast.error("Please resolve all errors before submitting.");
      return;
    }

    const resolvedBankName = formBankName === "Other" ? formCustomBank.trim() : formBankName;

    if (editingAccountId) {
      // Edit existing
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === editingAccountId) {
            return {
              ...acc,
              bankName: resolvedBankName,
              accountHolderName: formAccountHolder.trim(),
              accountNumber: formAccountNumber.trim(),
              ifscCode: formIfscCode.trim().toUpperCase(),
              accountType: formAccountType,
              branchName: formBranchName.trim() || "Main Branch",
              isPrimary: formIsPrimary,
              upiVpa: formUpiVpa.trim() || undefined,
            };
          }
          // If edited account is set as primary, unmark others
          return formIsPrimary ? { ...acc, isPrimary: false } : acc;
        })
      );
      toast.success("Bank account details updated successfully");
    } else {
      // Add new
      const newAcc: BankAccount = {
        id: `bank-${Date.now()}`,
        bankName: resolvedBankName,
        accountHolderName: formAccountHolder.trim(),
        accountNumber: formAccountNumber.trim(),
        ifscCode: formIfscCode.trim().toUpperCase(),
        accountType: formAccountType,
        branchName: formBranchName.trim() || "Main Branch",
        isPrimary: formIsPrimary || accounts.length === 0,
        status: "Verified",
        upiVpa: formUpiVpa.trim() || undefined,
        addedAt: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      };

      setAccounts((prev) => {
        if (newAcc.isPrimary) {
          return [newAcc, ...prev.map((a) => ({ ...a, isPrimary: false }))];
        }
        return [...prev, newAcc];
      });

      toast.success("New bank account registered and verified for settlement");
    }

    setIsModalOpen(false);
  };

  const primaryAccount = accounts.find((a) => a.isPrimary) || accounts[0];

  return (
    <div className="w-full space-y-5 pb-10">
      {/* 1. Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Bank Details</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
              <ShieldCheck className="h-3 w-3" /> Auto-Disbursement Active
            </span>
          </div>
          <p className="text-[13px] text-slate-500 mt-1">
            Configure settlement bank account and IFSC code for direct gateway disbursements.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-teal-700 active:scale-[0.98] transition cursor-pointer shadow-sm shadow-teal-600/20"
        >
          <Plus className="h-4 w-4" /> Add Account
        </button>
      </div>

      {/* 2. Bank Accounts Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-[12.5px] font-semibold text-slate-600 px-1">
          <span>Registered Settlement Accounts ({accounts.length})</span>
          <span className="text-[11.5px] text-slate-400">Click edit to update credentials anytime</span>
        </div>

        {accounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-200">
              <Building2 className="h-7 w-7" />
            </div>
            <div className="text-[15px] font-bold text-slate-800">No bank accounts registered</div>
            <p className="text-[12.5px] text-slate-500 max-w-sm mx-auto">
              Add a verified bank account with valid IFSC to receive daily sales settlement payouts.
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-teal-700 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Account Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {accounts.map((acc) => {
              const isPrimary = acc.isPrimary;
              return (
                <div
                  key={acc.id}
                  className={`relative rounded-2xl border transition-all duration-200 bg-white p-5 md:p-6 shadow-xs ${
                    isPrimary
                      ? "border-teal-500/60 ring-1 ring-teal-500/20 shadow-teal-900/5"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold shadow-2xs border ${
                          isPrimary
                            ? "bg-teal-600 text-white border-teal-600"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <Landmark className="h-6 w-6" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[15.5px] font-bold text-slate-900">
                            {acc.bankName} — {acc.accountType}
                          </h3>
                          {isPrimary ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Primary Settlement
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              Secondary Account
                            </span>
                          )}
                        </div>

                        <div className="text-[13px] font-mono text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-semibold text-slate-800">
                            A/C: {maskAccountNumber(acc.accountNumber)}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-semibold text-slate-800">IFSC: {acc.ifscCode}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(acc.id)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition cursor-pointer"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" /> Make Primary
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditModal(acc)}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition cursor-pointer shadow-2xs"
                        title="Edit account information"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAccount(acc.id)}
                        disabled={isPrimary && accounts.length > 1}
                        className={`rounded-lg border p-1.5 transition cursor-pointer ${
                          isPrimary && accounts.length > 1
                            ? "border-slate-100 text-slate-300 cursor-not-allowed"
                            : "border-slate-200 bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 shadow-2xs"
                        }`}
                        title={
                          isPrimary && accounts.length > 1
                            ? "Cannot delete primary account while other accounts exist"
                            : "Remove account"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Account Details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 text-[12px]">
                    <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                      <span className="text-slate-400 text-[11px] block font-medium">Account Holder</span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {acc.accountHolderName}
                      </span>
                    </div>

                    <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                      <span className="text-slate-400 text-[11px] block font-medium">Branch Location</span>
                      <span className="font-medium text-slate-700 truncate block">
                        {acc.branchName || "Main Commercial Branch"}
                      </span>
                    </div>

                    <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[11px] block font-medium">Quick Copy IFSC</span>
                        <span className="font-mono font-semibold text-slate-800">{acc.ifscCode}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(acc.ifscCode, `ifsc-${acc.id}`)}
                        className="p-1 text-slate-400 hover:text-teal-600 rounded transition cursor-pointer"
                        title="Copy IFSC"
                      >
                        {copiedKey === `ifsc-${acc.id}` ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Footer status / meta */}
                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Penny Drop Verified
                      </span>
                      <span>•</span>
                      <span>Added on {acc.addedAt}</span>
                    </div>

                    {acc.upiVpa && (
                      <div className="font-mono text-slate-500">
                        Linked VPA: <span className="text-slate-700 font-medium">{acc.upiVpa}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Add / Edit Bank Account Card Modal - Clean, Professional Style */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {/* Simple Professional Header */}
          <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs">
                <Landmark className="h-5 w-5 text-teal-700" />
              </div>
              <div>
                <DialogTitle className="text-[16px] font-bold tracking-tight text-slate-900">
                  {editingAccountId ? "Edit Settlement Bank Account" : "Register Settlement Bank Account"}
                </DialogTitle>
                <DialogDescription className="text-[12px] text-slate-500 mt-0.5">
                  Enter authentic bank credentials for direct settlement gateway routing.
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveAccount} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Account Holder Name */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-700 flex items-center justify-between">
                <span>
                  Account Holder Legal Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                </span>
                <span className="text-[11px] font-normal text-slate-400">As per bank records</span>
              </label>
              <input
                type="text"
                placeholder="Enter legal name (e.g. Retrod Hospitality Pvt Ltd)"
                value={formAccountHolder}
                onBlur={() => markTouched("accountHolder")}
                onChange={(e) => {
                  setFormAccountHolder(e.target.value);
                  markTouched("accountHolder");
                }}
                className={`w-full rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                  touched.accountHolder && errors.accountHolder
                    ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    : "border-slate-300 bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                }`}
              />
              {touched.accountHolder && errors.accountHolder && (
                <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600 animate-in fade-in duration-150">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.accountHolder}</span>
                </div>
              )}
            </div>

            {/* Bank Name Selection & Account Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Bank Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <select
                  value={formBankName}
                  onBlur={() => markTouched("bankName")}
                  onChange={(e) => {
                    setFormBankName(e.target.value);
                    markTouched("bankName");
                  }}
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-[13px] text-slate-800 focus:outline-none cursor-pointer shadow-2xs ${
                    touched.bankName && errors.bankName
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-slate-300 focus:border-teal-500"
                  }`}
                >
                  <option value="" disabled>
                    Select Bank
                  </option>
                  {POPULAR_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                {touched.bankName && errors.bankName && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600 animate-in fade-in duration-150">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.bankName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Account Type <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <select
                  value={formAccountType}
                  onBlur={() => markTouched("accountType")}
                  onChange={(e) => {
                    setFormAccountType(e.target.value);
                    markTouched("accountType");
                  }}
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-[13px] text-slate-800 focus:outline-none cursor-pointer shadow-2xs ${
                    touched.accountType && errors.accountType
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-slate-300 focus:border-teal-500"
                  }`}
                >
                  <option value="" disabled>
                    Select Account Type
                  </option>
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {touched.accountType && errors.accountType && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600 animate-in fade-in duration-150">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.accountType}</span>
                  </div>
                )}
              </div>
            </div>

            {formBankName === "Other" && (
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Specify Bank Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter full bank name"
                  value={formCustomBank}
                  onBlur={() => markTouched("bankName")}
                  onChange={(e) => {
                    setFormCustomBank(e.target.value);
                    markTouched("bankName");
                  }}
                  className={`w-full rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    touched.bankName && errors.bankName
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-slate-300 bg-white focus:border-teal-500"
                  }`}
                />
              </div>
            )}

            {/* Account Number & Confirm Account Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Account Number <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter 8-18 digit account number"
                  value={formAccountNumber}
                  onBlur={() => markTouched("accountNumber")}
                  onChange={(e) => {
                    setFormAccountNumber(e.target.value);
                    markTouched("accountNumber");
                    // If confirm account is already non-empty, mark it touched to update matching feedback in real-time
                    if (formConfirmAccountNumber.length > 0) {
                      markTouched("confirmAccountNumber");
                    }
                  }}
                  className={`w-full font-mono rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    touched.accountNumber && errors.accountNumber
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-slate-300 bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  }`}
                />
                {touched.accountNumber && errors.accountNumber && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600 animate-in fade-in duration-150">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.accountNumber}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  {editingAccountId ? "Confirm Account No." : "Re-enter Account Number"}{" "}
                  <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Confirm account digits"
                  value={formConfirmAccountNumber}
                  onBlur={() => markTouched("confirmAccountNumber")}
                  onChange={(e) => {
                    setFormConfirmAccountNumber(e.target.value);
                    markTouched("confirmAccountNumber");
                  }}
                  className={`w-full font-mono rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    touched.confirmAccountNumber && errors.confirmAccountNumber
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-slate-300 bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  }`}
                />
                {touched.confirmAccountNumber && errors.confirmAccountNumber && (
                  <div className="flex items-start gap-1 text-[11.5px] font-medium text-rose-600 animate-in fade-in duration-150">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{errors.confirmAccountNumber}</span>
                  </div>
                )}
                {touched.confirmAccountNumber && !errors.confirmAccountNumber && formConfirmAccountNumber.length > 0 && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-emerald-600 animate-in fade-in duration-150">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Account numbers match</span>
                  </div>
                )}
              </div>
            </div>

            {/* IFSC Code & Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700 flex items-center justify-between">
                  <span>
                    IFSC Code <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-400">11 characters</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC0001248"
                  maxLength={11}
                  value={formIfscCode}
                  onBlur={() => markTouched("ifscCode")}
                  onChange={(e) => handleIfscLookup(e.target.value)}
                  className={`w-full font-mono uppercase rounded-xl border px-3.5 py-2 text-[13px] text-slate-800 focus:outline-none transition shadow-2xs ${
                    touched.ifscCode && errors.ifscCode
                      ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-slate-300 bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  }`}
                />
                {touched.ifscCode && errors.ifscCode && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium text-rose-600 animate-in fade-in duration-150">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.ifscCode}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-700">Branch & City</label>
                <input
                  type="text"
                  placeholder="e.g. Indiranagar, Bengaluru"
                  value={formBranchName}
                  onChange={(e) => setFormBranchName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none shadow-2xs"
                />
              </div>
            </div>

            {/* Optional UPI VPA */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-700 flex items-center justify-between">
                <span>Linked UPI VPA / QR ID</span>
                <span className="text-[11px] font-normal text-slate-400">Optional</span>
              </label>
              <input
                type="text"
                placeholder="e.g. retrodpos@hdfcbank"
                value={formUpiVpa}
                onChange={(e) => setFormUpiVpa(e.target.value)}
                className="w-full font-mono rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-[13px] text-slate-800 focus:border-teal-500 focus:outline-none shadow-2xs"
              />
            </div>

            {/* Primary Settlement Toggle Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[13px] font-semibold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-teal-600" />
                    Set as Primary Settlement Account
                  </div>
                  <p className="text-[11.5px] text-slate-500 leading-snug">
                    {formIsPrimary
                      ? "All gateway funds (Razorpay, Pine Labs, UPI) will disburse directly to this account."
                      : "Account will be stored as a Secondary / Backup disbursement route."}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPrimary}
                    onChange={(e) => setFormIsPrimary(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <DialogFooter className="pt-3 gap-2 sm:gap-0 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11.5px] text-slate-400">
                {!isFormValid ? (
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <Lock className="h-3 w-3" /> Fill all mandatory fields (*) to enable
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> All fields valid & ready
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid}
                  title={!isFormValid ? "Please fill all mandatory fields correctly" : undefined}
                  className={`rounded-xl px-5 py-2.5 text-[13px] font-semibold transition ${
                    isFormValid
                      ? "bg-teal-600 text-white hover:bg-teal-700 active:scale-[0.98] cursor-pointer shadow-sm shadow-teal-600/20"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none"
                  }`}
                >
                  {editingAccountId ? "Save Changes" : "Save & Verify Account"}
                </button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
