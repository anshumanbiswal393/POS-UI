import { useState, useEffect, useId } from "react";
import { User, Phone, AtSign, Key, AlertCircle, Check, Mail } from "lucide-react";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";

export interface StaffUserFormData {
  id?: string;
  name: string;
  username: string;
  userCode: string;
  phone: string;
  email: string;
  billerGroup: string;
  status: boolean;
}

interface AddBillerUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: StaffUserFormData) => void;
  initialData?: StaffUserFormData | null;
  roleTitle: string;
  existingUsernames?: string[];
}

export function AddBillerUserModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  roleTitle,
  existingUsernames = [],
}: AddBillerUserModalProps) {
  const isEditMode = Boolean(initialData?.id);
  const formId = useId();

  const [formData, setFormData] = useState<StaffUserFormData>({
    name: "",
    username: "",
    userCode: "",
    phone: "",
    email: "",
    billerGroup: "Main Counter Cashiers",
    status: true,
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        name: initialData.name || "",
        username: initialData.username || "",
        userCode: initialData.userCode === "-" ? "" : initialData.userCode || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        billerGroup: initialData.billerGroup || "Main Counter Cashiers",
        status: initialData.status ?? true,
      });
      setTouched({});
      setErrors({});
    } else {
      setFormData({
        name: "",
        username: "",
        userCode: "",
        phone: "",
        email: "",
        billerGroup: "Main Counter Cashiers",
        status: true,
      });
      setTouched({});
      setErrors({});
    }
  }, [initialData, isOpen]);

  // Validation engine
  const validate = (data: StaffUserFormData) => {
    const newErrors: Record<string, string> = {};

    // 1. Name validation (MANDATORY): Alphabet and spaces only
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      newErrors.name = `${roleTitle} Name is mandatory`;
    } else if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
      newErrors.name = "Name can only contain alphabets and spaces (no numbers or symbols)";
    } else if (trimmedName.length < 2) {
      newErrors.name = "Name must be at least 2 characters long";
    }

    // 2. Mobile Phone validation (MANDATORY): Exactly 10 digits
    const trimmedPhone = data.phone.trim();
    if (!trimmedPhone) {
      newErrors.phone = "Mobile number is mandatory";
    } else if (!/^\d{10}$/.test(trimmedPhone)) {
      newErrors.phone = "Mobile number must contain exactly 10 digits";
    }

    // 3. User Name validation (MANDATORY): Alphanumeric, unique
    const trimmedUsername = data.username.trim();
    if (!trimmedUsername) {
      newErrors.username = "User Name is mandatory";
    } else if (trimmedUsername.length < 3) {
      newErrors.username = "User Name must be at least 3 characters long";
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(trimmedUsername)) {
      newErrors.username = "User Name can only contain letters, numbers, hyphens, and underscores";
    } else {
      const lowerUsername = trimmedUsername.toLowerCase();
      const isDuplicate = existingUsernames.some(
        (u) =>
          u.toLowerCase() === lowerUsername &&
          (!initialData || initialData.username.toLowerCase() !== lowerUsername),
      );
      if (isDuplicate) {
        newErrors.username = "This User Name is already taken";
      }
    }

    // 4. User Code / PIN validation (OPTIONAL): If provided, must be 4-6 digits
    const trimmedCode = data.userCode.trim();
    if (trimmedCode) {
      if (!/^\d{4,6}$/.test(trimmedCode)) {
        newErrors.userCode = "User Code must contain 4 to 6 numeric digits";
      }
    }

    // 5. Email validation (OPTIONAL): If provided, must be valid email
    const trimmedEmail = data.email.trim();
    if (trimmedEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    return newErrors;
  };

  const currentErrors = validate(formData);
  const isFormValid = Object.keys(currentErrors).length === 0;

  const handleBlur = (field: keyof StaffUserFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(formData));
  };

  const handleNameChange = (val: string) => {
    // Keep alphabets and spaces, or allow typing and validate
    const updated = { ...formData, name: val };
    // Auto-generate username from name if username was untouched and not editing
    if (!isEditMode && (!touched.username || !formData.username)) {
      const slug = val.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (slug) {
        updated.username = slug;
      }
    }
    setFormData(updated);
    if (touched.name) {
      setErrors(validate(updated));
    }
  };

  const handlePhoneChange = (val: string) => {
    // Enforce numbers only, maximum 10 digits
    const digitsOnly = val.replace(/\D/g, "").slice(0, 10);
    const updated = { ...formData, phone: digitsOnly };
    setFormData(updated);
    if (touched.phone) {
      setErrors(validate(updated));
    }
  };

  const handleUsernameChange = (val: string) => {
    // Alphanumeric, underscores, hyphens, no spaces
    const clean = val.replace(/\s+/g, "");
    const updated = { ...formData, username: clean };
    setFormData(updated);
    if (touched.username) {
      setErrors(validate(updated));
    }
  };

  const handleUserCodeChange = (val: string) => {
    // Digits only, maximum 6 digits
    const digitsOnly = val.replace(/\D/g, "").slice(0, 6);
    const updated = { ...formData, userCode: digitsOnly };
    setFormData(updated);
    if (touched.userCode) {
      setErrors(validate(updated));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(formData);
    setErrors(validationErrors);
    setTouched({
      name: true,
      username: true,
      phone: true,
      userCode: true,
      email: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    onSave({
      ...formData,
      name: formData.name.trim(),
      username: formData.username.trim(),
      userCode: formData.userCode.trim() || "-",
      phone: formData.phone.trim(),
      email: formData.email.trim(),
    });
  };

  return (
    <PosCreatePanel
      open={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit ${roleTitle}` : `Add New ${roleTitle}`}
      description="Configure staff credentials, mobile contact, and system access."
      icon={User}
      size="lg"
      onSubmit={handleSubmit}
      footer={
        <>
          {!isFormValid ? (
            <span className="mr-auto text-[12px] font-medium text-rose-600 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Fill all mandatory fields to proceed
            </span>
          ) : null}
          <PosCreateCancelButton onClick={onClose} />
          <PosCreateSubmitButton disabled={!isFormValid}>
            {isEditMode ? "Save Changes" : `Add ${roleTitle}`}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Name (MANDATORY) */}
            <div className="sm:col-span-2">
              <label
                htmlFor={`${formId}-name`}
                className="block text-[12.5px] font-semibold text-slate-800 mb-1"
              >
                {roleTitle} Name <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  id={`${formId}-name`}
                  type="text"
                  placeholder="e.g. Kailash Kumar"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onBlur={() => handleBlur("name")}
                  className={`w-full rounded-lg border bg-white px-3.5 py-2 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${touched.name && currentErrors.name
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                    : "border-slate-300 focus:border-teal-600 focus:ring-teal-100"
                    }`}
                />
              </div>
              {touched.name && currentErrors.name ? (
                <p className="mt-1 text-[11.5px] font-medium text-rose-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {currentErrors.name}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">Alphabets and spaces only</p>
              )}
            </div>

            {/* 2. Mobile Phone (MANDATORY) */}
            <div>
              <label
                htmlFor={`${formId}-phone`}
                className="block text-[12.5px] font-semibold text-slate-800 mb-1"
              >
                Mobile Number <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-3.5 w-3.5" />
                </div>
                <input
                  id={`${formId}-phone`}
                  type="tel"
                  inputMode="numeric"
                  placeholder="10 digit number"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onBlur={() => handleBlur("phone")}
                  className={`w-full rounded-lg border bg-white pl-9 pr-3.5 py-2 text-[13px] font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${touched.phone && currentErrors.phone
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                    : "border-slate-300 focus:border-teal-600 focus:ring-teal-100"
                    }`}
                />
              </div>
              {touched.phone && currentErrors.phone ? (
                <p className="mt-1 text-[11.5px] font-medium text-rose-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {currentErrors.phone}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">Exactly 10 numeric digits</p>
              )}
            </div>

            {/* 3. User Name (MANDATORY) */}
            <div>
              <label
                htmlFor={`${formId}-username`}
                className="block text-[12.5px] font-semibold text-slate-800 mb-1"
              >
                User Name <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <AtSign className="h-3.5 w-3.5" />
                </div>
                <input
                  id={`${formId}-username`}
                  type="text"
                  placeholder="e.g. kailash"
                  value={formData.username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  onBlur={() => handleBlur("username")}
                  className={`w-full rounded-lg border bg-white pl-9 pr-3.5 py-2 text-[13px] font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${touched.username && currentErrors.username
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                    : "border-slate-300 focus:border-teal-600 focus:ring-teal-100"
                    }`}
                />
              </div>
              {touched.username && currentErrors.username ? (
                <p className="mt-1 text-[11.5px] font-medium text-rose-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {currentErrors.username}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">Letters and numbers, minimum 3</p>
              )}
            </div>

            {/* 4. User Code / PIN (OPTIONAL - marked with nothing) */}
            <div>
              <label
                htmlFor={`${formId}-userCode`}
                className="block text-[12.5px] font-medium text-slate-700 mb-1"
              >
                User Code (PIN)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Key className="h-3.5 w-3.5" />
                </div>
                <input
                  id={`${formId}-userCode`}
                  type="text"
                  inputMode="numeric"
                  placeholder="4 to 6 digit PIN"
                  maxLength={6}
                  value={formData.userCode}
                  onChange={(e) => handleUserCodeChange(e.target.value)}
                  onBlur={() => handleBlur("userCode")}
                  className={`w-full rounded-lg border bg-white pl-9 pr-3.5 py-2 text-[13px] font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${touched.userCode && currentErrors.userCode
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                    : "border-slate-300 focus:border-teal-600 focus:ring-teal-100"
                    }`}
                />
              </div>
              {touched.userCode && currentErrors.userCode ? (
                <p className="mt-1 text-[11.5px] font-medium text-rose-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {currentErrors.userCode}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">Optional POS quick-switch code</p>
              )}
            </div>

            {/* 5. Email Address (OPTIONAL - marked with nothing) */}
            <div>
              <label
                htmlFor={`${formId}-email`}
                className="block text-[12.5px] font-medium text-slate-700 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-3.5 w-3.5" />
                </div>
                <input
                  id={`${formId}-email`}
                  type="email"
                  placeholder="staff@retrodpos.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, email: e.target.value }));
                    if (touched.email) setErrors(validate({ ...formData, email: e.target.value }));
                  }}
                  onBlur={() => handleBlur("email")}
                  className={`w-full rounded-lg border bg-white pl-9 pr-3.5 py-2 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${touched.email && currentErrors.email
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                    : "border-slate-300 focus:border-teal-600 focus:ring-teal-100"
                    }`}
                />
              </div>
              {touched.email && currentErrors.email ? (
                <p className="mt-1 text-[11.5px] font-medium text-rose-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {currentErrors.email}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">Optional notification email</p>
              )}
            </div>

            {/* 6. Biller Group (OPTIONAL - marked with nothing) */}
            <div>
              <label
                htmlFor={`${formId}-billerGroup`}
                className="block text-[12.5px] font-medium text-slate-700 mb-1"
              >
                Biller Group
              </label>
              <div className="relative">
                <select
                  id={`${formId}-billerGroup`}
                  value={formData.billerGroup}
                  onChange={(e) => setFormData((prev) => ({ ...prev, billerGroup: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 cursor-pointer"
                >
                  <option value="Main Counter Cashiers">Main Counter Cashiers</option>
                  <option value="Floor Captains">Floor Captains</option>
                  <option value="Order Acceptance Dispatchers">Order Acceptance Dispatchers</option>
                  <option value="Delivery Team">Delivery Team</option>
                  <option value="Service Stewards">Service Stewards</option>
                  <option value="General Staff">General Staff</option>
                </select>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Role permissions template</p>
            </div>

            {/* 7. Status Toggle (OPTIONAL - marked with nothing) */}
            <div className="flex flex-col justify-center">
              <label className="block text-[12.5px] font-medium text-slate-700 mb-1">
                Account Status
              </label>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, status: !prev.status }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.status ? "bg-teal-600" : "bg-slate-300"
                    }`}
                  aria-pressed={formData.status}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.status ? "translate-x-5" : "translate-x-0"
                      }`}
                  />
                </button>
                <span className="text-[13px] font-medium text-slate-700">
                  {formData.status ? (
                    <span className="text-teal-700 font-semibold flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Active
                    </span>
                  ) : (
                    <span className="text-slate-500">Inactive</span>
                  )}
                </span>
              </div>
            </div>
          </div>

    </PosCreatePanel>
  );
}
