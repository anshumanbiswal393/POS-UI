import { useState, useEffect, useId } from "react";
import { Users, ShieldCheck, AlertCircle, Check, Plus } from "lucide-react";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";

export interface GroupFormData {
  id?: string;
  name: string;
  count: number;
  permissions: string;
  description?: string;
}

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (group: GroupFormData) => void;
  initialData?: GroupFormData | null;
  groupType: "biller" | "admin";
  availablePermissions: string[];
  existingNames?: string[];
}

export function AddGroupModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  groupType,
  availablePermissions,
  existingNames = [],
}: AddGroupModalProps) {
  const isEditMode = Boolean(initialData?.id);
  const formId = useId();

  const titlePrefix = groupType === "biller" ? "Biller Group" : "Admin Group";
  const userCountLabel = groupType === "biller" ? "Assigned Users" : "Assigned Admins";

  const [name, setName] = useState("");
  const [count, setCount] = useState("0");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [customPermission, setCustomPermission] = useState("");

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setCount(String(initialData.count || 0));
      setDescription(initialData.description || "");
      // Split comma separated permissions
      const perms = initialData.permissions
        ? initialData.permissions.split(",").map((p) => p.trim()).filter(Boolean)
        : [];
      setSelectedPermissions(perms);
      setTouched({});
      setErrors({});
    } else {
      setName("");
      setCount("0");
      setDescription("");
      setSelectedPermissions([]);
      setTouched({});
      setErrors({});
    }
  }, [initialData, isOpen]);

  // Validation function
  const validate = (currentName: string, currentPerms: string[]) => {
    const newErrors: Record<string, string> = {};

    // 1. Group Name (MANDATORY): Alphabets and spaces, min 3 chars
    const trimmed = currentName.trim();
    if (!trimmed) {
      newErrors.name = `${titlePrefix} Name is mandatory`;
    } else if (!/^[A-Za-z0-9\s/&'-]+$/.test(trimmed)) {
      newErrors.name = "Group name can only contain letters, numbers, spaces, and hyphens";
    } else if (trimmed.length < 3) {
      newErrors.name = "Group name must be at least 3 characters long";
    } else {
      const lower = trimmed.toLowerCase();
      const isDuplicate = existingNames.some(
        (n) => n.toLowerCase() === lower && (!initialData || initialData.name.toLowerCase() !== lower),
      );
      if (isDuplicate) {
        newErrors.name = `A group named "${trimmed}" already exists`;
      }
    }

    // 2. Permissions (MANDATORY): At least 1 permission selected
    if (currentPerms.length === 0) {
      newErrors.permissions = "Please select at least one permission for this group";
    }

    return newErrors;
  };

  const currentErrors = validate(name, selectedPermissions);
  const isFormValid = Object.keys(currentErrors).length === 0;

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(name, selectedPermissions));
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (touched.name) {
      setErrors(validate(val, selectedPermissions));
    }
  };

  const handleCountChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, "");
    setCount(digitsOnly || "0");
  };

  const togglePermission = (perm: string) => {
    const updated = selectedPermissions.includes(perm)
      ? selectedPermissions.filter((p) => p !== perm)
      : [...selectedPermissions, perm];

    setSelectedPermissions(updated);
    if (touched.permissions) {
      setErrors(validate(name, updated));
    }
  };

  const selectAllPermissions = () => {
    setSelectedPermissions([...availablePermissions]);
    if (touched.permissions) {
      setErrors(validate(name, availablePermissions));
    }
  };

  const clearAllPermissions = () => {
    setSelectedPermissions([]);
    if (touched.permissions) {
      setErrors(validate(name, []));
    }
  };

  const addCustomPermission = () => {
    const trimmed = customPermission.trim();
    if (!trimmed) return;
    if (!selectedPermissions.includes(trimmed)) {
      const updated = [...selectedPermissions, trimmed];
      setSelectedPermissions(updated);
      if (touched.permissions) {
        setErrors(validate(name, updated));
      }
    }
    setCustomPermission("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(name, selectedPermissions);
    setErrors(validationErrors);
    setTouched({ name: true, permissions: true });

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    onSave({
      id: initialData?.id,
      name: name.trim(),
      count: parseInt(count, 10) || 0,
      permissions: selectedPermissions.join(", "),
      description: description.trim(),
    });
  };

  return (
    <PosCreatePanel
      open={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit ${titlePrefix}` : `Add New ${titlePrefix}`}
      description="Define role groups and granular permission templates for staff accounts."
      icon={groupType === "biller" ? Users : ShieldCheck}
      size="lg"
      onSubmit={handleSubmit}
      footer={
        <>
          {!isFormValid ? (
            <span className="mr-auto text-[12px] font-medium text-rose-600 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Fill mandatory fields to proceed
            </span>
          ) : null}
          <PosCreateCancelButton onClick={onClose} />
          <PosCreateSubmitButton disabled={!isFormValid}>
            {isEditMode ? "Save Changes" : `Create ${titlePrefix}`}
          </PosCreateSubmitButton>
        </>
      }
    >
          {/* Mandatory notice */}
          <div className="rounded-lg bg-teal-50/60 border border-teal-200/80 px-3.5 py-2 text-[12px] text-teal-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-teal-600" />
            <span>
              Fields marked with <strong className="text-rose-600">*</strong> are mandatory. You cannot proceed without filling them.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Group Name (MANDATORY) */}
            <div className="sm:col-span-2">
              <label
                htmlFor={`${formId}-name`}
                className="block text-[12.5px] font-semibold text-slate-800 mb-1"
              >
                {titlePrefix} Name <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                id={`${formId}-name`}
                type="text"
                placeholder={
                  groupType === "biller"
                    ? "e.g. Counter Cashiers, Bar Captains"
                    : "e.g. Finance Managers, Store Incharge"
                }
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={() => handleBlur("name")}
                className={`w-full rounded-lg border bg-white px-3.5 py-2 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                  touched.name && currentErrors.name
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                    : "border-slate-300 focus:border-teal-600 focus:ring-teal-100"
                }`}
              />
              {touched.name && currentErrors.name ? (
                <p className="mt-1 text-[11.5px] font-medium text-rose-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {currentErrors.name}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">Letters and spaces, minimum 3 chars</p>
              )}
            </div>

            {/* 2. Initial Assigned Count (OPTIONAL - marked with nothing) */}
            <div>
              <label
                htmlFor={`${formId}-count`}
                className="block text-[12.5px] font-medium text-slate-700 mb-1"
              >
                {userCountLabel}
              </label>
              <input
                id={`${formId}-count`}
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={count}
                onChange={(e) => handleCountChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[13px] font-mono text-slate-900 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
              <p className="mt-1 text-[11px] text-slate-400">Number of staff in group</p>
            </div>
          </div>

          {/* 3. Description (OPTIONAL - marked with nothing) */}
          <div>
            <label
              htmlFor={`${formId}-description`}
              className="block text-[12.5px] font-medium text-slate-700 mb-1"
            >
              Description / Role Scope
            </label>
            <input
              id={`${formId}-description`}
              type="text"
              placeholder="e.g. Front-of-house staff responsible for billing and customer settlements"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
            <p className="mt-1 text-[11px] text-slate-400">Optional short description</p>
          </div>

          {/* 4. Permissions Matrix (MANDATORY) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-[12.5px] font-semibold text-slate-800">
                Granted Permissions <span className="text-rose-500 font-bold">*</span>
                <span className="ml-2 font-normal text-slate-500 text-[12px]">
                  ({selectedPermissions.length} selected)
                </span>
              </label>
              <div className="flex items-center gap-2 text-[11.5px]">
                <button
                  type="button"
                  onClick={selectAllPermissions}
                  className="font-semibold text-teal-600 hover:text-teal-700 transition cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={clearAllPermissions}
                  className="font-medium text-slate-500 hover:text-slate-700 transition cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Checkbox Chips Grid */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 max-h-56 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availablePermissions.map((perm) => {
                  const isChecked = selectedPermissions.includes(perm);
                  return (
                    <button
                      key={perm}
                      type="button"
                      onClick={() => togglePermission(perm)}
                      className={`flex items-start gap-2.5 p-2 rounded-lg text-left transition cursor-pointer border ${
                        isChecked
                          ? "bg-teal-50/80 border-teal-300 text-teal-900 shadow-2xs"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                          isChecked
                            ? "bg-teal-600 border-teal-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className="text-[12.5px] font-medium leading-tight">{perm}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {touched.permissions && currentErrors.permissions && (
              <p className="mt-1 text-[11.5px] font-medium text-rose-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {currentErrors.permissions}
              </p>
            )}

            {/* Add custom permission pill */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Add custom permission..."
                  value={customPermission}
                  onChange={(e) => setCustomPermission(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomPermission();
                    }
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                />
              </div>
              <button
                type="button"
                onClick={addCustomPermission}
                disabled={!customPermission.trim()}
                className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          </div>

    </PosCreatePanel>
  );
}
