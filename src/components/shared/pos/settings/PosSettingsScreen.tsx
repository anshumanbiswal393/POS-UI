import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useOutletContext } from "@/context/PosOutletContext";
import { OutletsManagementView } from "@/components/shared/pos/settings/OutletsManagementView";
import { PosPanel } from "@/components/shared/pos/PosPanel";
import {
  APP_THEME_GROUP_LABELS,
  APP_THEMES,
  applyTheme,
  persistTheme,
  readSavedTheme,
  type AppTheme,
  type ThemeGroup,
} from "@/app/theme/theme";
import type { TenantEntitlements } from "@/types/auth";
import {
  DEFAULT_POS_TAX_SETTINGS,
  getPosTaxSettings,
  savePosTaxSettings,
  type PosTaxSettings,
} from "@/lib/posTaxSettings";

type SettingsTab = "account" | "security" | "outlets" | "terminal" | "receipts" | "printers";

const MENU: { id: SettingsTab; label: string }[] = [
  { id: "account", label: "Account" },
  { id: "security", label: "Security" },
  { id: "outlets", label: "Outlets" },
  { id: "terminal", label: "Terminal" },
  { id: "receipts", label: "Receipts" },
  { id: "printers", label: "Printers" },
];

const PLAN_LABEL: Record<TenantEntitlements["plan"], string> = {
  starter: "Starter Plan",
  growth: "Growth Plan",
  enterprise: "Enterprise Plan",
};

const GROUP_ORDER: ThemeGroup[] = ["core", "professional", "signature", "accessibility"];

function initialsFromName(name: string) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "RA";
}

function formatRoleLabel(label: string | undefined | null) {
  return (label || "Staff").toUpperCase();
}

export function PosSettingsScreen() {
  const { user, users, roleLabel, updateUser, entitlements } = useAuth();
  const { activeOutlet } = useOutletContext();
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  const [profileName, setProfileName] = useState(user?.name ?? "");
  const [profilePhone, setProfilePhone] = useState(user?.phone ?? "");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [theme, setTheme] = useState<AppTheme>(() => readSavedTheme());
  const [copiedLicense, setCopiedLicense] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [taxSettings, setTaxSettings] = useState<PosTaxSettings>(() => getPosTaxSettings());

  useEffect(() => {
    setProfileName(user?.name ?? "");
    setProfilePhone(user?.phone ?? "");
  }, [user?.id, user?.name, user?.phone]);

  useEffect(() => {
    if (activeTab === "receipts") {
      setTaxSettings(getPosTaxSettings());
    }
  }, [activeTab]);

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const next = (event as CustomEvent<{ theme: AppTheme }>).detail?.theme;
      if (next) setTheme(next);
    };
    window.addEventListener("retrod:theme:change", handleThemeChange);
    return () => window.removeEventListener("retrod:theme:change", handleThemeChange);
  }, []);

  const selectedTheme = APP_THEMES.find((item) => item.value === theme) ?? APP_THEMES[0];
  const outletCode = activeOutlet?.code || "POS";
  const licenseKey = `LIC-POS-${outletCode.replace(/[^A-Z0-9]/gi, "").toUpperCase()}-2026`;
  const planLabel = PLAN_LABEL[entitlements?.plan] ?? "Growth Plan";
  const othersOnPos = useMemo(
    () => (users ?? []).filter((entry) => entry.active && entry.id !== user?.id),
    [users, user?.id],
  );

  function selectTheme(next: AppTheme) {
    setTheme(next);
    applyTheme(next);
    persistTheme(next);
  }

  function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    const phone = profilePhone.replace(/\D/g, "");
    if (phone && phone.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits.");
      return;
    }
    setPhoneError(null);
    setSavingProfile(true);
    updateUser(user.id, {
      name: profileName.trim() || user.name,
      initials: initialsFromName(profileName.trim() || user.name),
      phone,
    });
    setSavingProfile(false);
    toast.success("Profile saved.");
  }

  async function handleCopyLicense() {
    try {
      await navigator.clipboard.writeText(licenseKey);
      setCopiedLicense(true);
      window.setTimeout(() => setCopiedLicense(false), 1500);
    } catch {
      toast.error("Could not copy the license key.");
    }
  }

  function handleChangePassword(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated for this terminal.");
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs lg:sticky lg:top-3">
        <div className="border-b border-primary/20 bg-primary/10 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-primary">
          Settings Menu
        </div>
        <ul className="space-y-1 p-2">
          {MENU.map((item) => {
            const selected = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition cursor-pointer ${
                    selected
                      ? "bg-primary font-semibold text-primary-foreground shadow-xs"
                      : "text-text-secondary hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {activeTab === "account" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <section className="rounded-xl border border-border bg-surface p-5 shadow-xs">
            <div className="mb-5 border-b border-border pb-3">
              <h2 className="text-[16px] font-bold text-text-primary">Profile Details</h2>
            </div>

            <div className="mb-5 flex items-center gap-4 rounded-xl border border-border bg-surface-2/40 p-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/10 text-lg font-extrabold text-primary">
                {user?.initials ?? "RA"}
              </div>
              <div>
                <div className="text-[13px] font-bold text-text-primary">Profile Picture</div>
                <div className="mt-1 text-[12px] font-semibold text-primary">Signed in on this POS</div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium uppercase text-text-secondary">Full Name</span>
                <input
                  required
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-[13px] text-text-primary outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="block">
                <span className="mb-1 flex items-center gap-1 text-[11px] font-medium uppercase text-text-secondary">
                  Email Address <Lock className="h-3 w-3 text-text-disabled" />
                </span>
                <input
                  readOnly
                  value={user?.email ?? ""}
                  className="w-full cursor-not-allowed rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] text-text-secondary outline-none"
                />
                <span className="mt-1 block text-[10px] text-text-disabled">
                  Email address can only be changed by the Superadmin.
                </span>
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-medium uppercase text-text-secondary">Phone Number</span>
                <input
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="e.g. 9999999999"
                  value={profilePhone}
                  onChange={(event) => {
                    setProfilePhone(event.target.value.replace(/\D/g, "").slice(0, 10));
                    if (phoneError) setPhoneError(null);
                  }}
                  className={`w-full rounded-md border bg-surface px-3 py-2 text-[13px] text-text-primary outline-none focus:ring-2 focus:ring-primary/20 ${
                    phoneError ? "border-rose-500" : "border-border"
                  }`}
                />
                {phoneError && <span className="mt-1 block text-[11px] font-medium text-rose-500">{phoneError}</span>}
              </label>

              <label className="block">
                <span className="mb-1 flex items-center gap-1 text-[11px] font-medium uppercase text-text-secondary">
                  Designated Role <Lock className="h-3 w-3 text-text-disabled" />
                </span>
                <input
                  readOnly
                  value={formatRoleLabel(user ? roleLabel(user.role) : "Staff")}
                  className="w-full cursor-not-allowed rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] font-medium text-text-secondary outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </section>

          <div className="space-y-4">
            <section className="rounded-xl border border-border bg-surface p-5 shadow-xs">
              <div className="mb-4 border-b border-border pb-3">
                <h2 className="text-[16px] font-bold text-text-primary">Currently using this POS</h2>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-primary/15 bg-primary/5 p-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground">
                  {user?.initials ?? "RA"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-bold text-text-primary">{user?.name ?? "POS User"}</div>
                  <div className="text-[12px] font-semibold text-primary">{user ? roleLabel(user.role) : "Staff"}</div>
                  <div className="truncate text-[11px] text-text-secondary">
                    {activeOutlet.name} · {user?.lastActive ?? "Just now"}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                  This terminal
                </span>
              </div>

              {othersOnPos.length > 0 && (
                <ul className="mt-3 divide-y divide-border">
                  {othersOnPos.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold text-text-primary">{entry.name}</div>
                        <div className="text-[11px] text-text-secondary">
                          {roleLabel(entry.role)} · {entry.email}
                        </div>
                      </div>
                      <span className="shrink-0 text-[11px] font-medium text-text-secondary">{entry.lastActive ?? "Active"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-border bg-surface p-5 shadow-xs">
              <div className="mb-4 border-b border-border pb-3">
                <h2 className="text-[16px] font-bold text-text-primary">Subscription & Licensing</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-primary/10 bg-primary/5 p-3">
                  <div>
                    <span className="block text-[11px] font-medium uppercase text-text-secondary">Subscription Plan</span>
                    <span className="mt-0.5 block text-[14px] font-extrabold text-primary">
                      {planLabel}
                    </span>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                    Active
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-surface-2/40 p-3">
                    <span className="block text-[11px] text-text-secondary">Expiration Date</span>
                    <span className="mt-1 block text-[13px] font-semibold text-text-primary">2026-11-11</span>
                  </div>
                  <div className="rounded-lg border border-border bg-surface-2/40 p-3">
                    <span className="block text-[11px] text-text-secondary">Outlet</span>
                    <span className="mt-1 block truncate font-mono text-[13px] font-semibold text-text-primary">
                      {outletCode.toLowerCase()}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface-2/40 p-3">
                  <span className="block text-[11px] text-text-secondary">License Key</span>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="rounded border border-border bg-surface px-2.5 py-1 font-mono text-[12px] font-semibold text-text-primary">
                      {licenseKey}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLicense}
                      title="Copy license key"
                      className="rounded-md border border-border p-1.5 text-text-secondary hover:text-text-primary cursor-pointer"
                    >
                      {copiedLicense ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-surface p-5 shadow-xs">
              <div className="mb-4 border-b border-border pb-3">
                <h2 className="text-[16px] font-bold text-text-primary">Theme Color & Layout</h2>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-medium uppercase text-text-secondary">Active Theme</span>
                <div className="flex items-center gap-2.5">
                  <select
                    value={theme}
                    onChange={(event) => selectTheme(event.target.value as AppTheme)}
                    className="h-9 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-[13px] text-text-primary focus:border-primary focus:outline-none"
                  >
                    {GROUP_ORDER.map((group) => (
                      <optgroup key={group} label={APP_THEME_GROUP_LABELS[group]}>
                        {APP_THEMES.filter((item) => item.group === group).map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div className="flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5">
                    {selectedTheme.swatches.slice(0, 3).map((swatch) => (
                      <span
                        key={swatch}
                        className="h-3.5 w-3.5 rounded-full border border-black/15"
                        style={{ backgroundColor: swatch }}
                      />
                    ))}
                  </div>
                </div>
              </label>
            </section>
          </div>
        </div>
      )}

      {activeTab === "security" && (
        <div className="space-y-4">
          <PosPanel title="Change Password" hint="Update the password for the person signed in on this terminal.">
            <form onSubmit={handleChangePassword} className="max-w-md space-y-3">
              <input
                type="password"
                required
                placeholder="New password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="h-9 w-full rounded-md border border-border bg-surface px-3 text-[13px] text-text-primary focus:border-primary focus:outline-none"
              />
              <input
                type="password"
                required
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-9 w-full rounded-md border border-border bg-surface px-3 text-[13px] text-text-primary focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                Update Password
              </button>
            </form>
          </PosPanel>

          <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-[16px] font-bold text-text-primary">Active on this POS</h2>
            </div>
            <ul className="divide-y divide-border">
              {user && (
                <li className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <div className="text-[13.5px] font-semibold text-text-primary">{user.name}</div>
                    <div className="mt-0.5 text-[11.5px] text-text-secondary">
                      {roleLabel(user.role)} · {user.email}
                    </div>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                    This terminal
                  </span>
                </li>
              )}
              {othersOnPos.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <div className="text-[13.5px] font-semibold text-text-primary">{entry.name}</div>
                    <div className="mt-0.5 text-[11.5px] text-text-secondary">
                      {roleLabel(entry.role)} · Last active {entry.lastActive ?? "recently"}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-text-secondary">Active</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {activeTab === "outlets" && <OutletsManagementView />}

      {activeTab === "terminal" && (
        <PosPanel title="Terminal preferences" hint="Sound and settlement behavior for this POS terminal.">
          <div className="space-y-4 text-[13px]">
            <label className="flex items-center justify-between gap-3 border-b border-border py-2">
              <span>
                <span className="block font-bold text-text-primary">Audio chime on new order</span>
                <span className="text-[12px] text-text-secondary">Play a tone when a new kitchen ticket arrives.</span>
              </span>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between gap-3 py-2">
              <span>
                <span className="block font-bold text-text-primary">Auto-print KOT</span>
                <span className="text-[12px] text-text-secondary">Send each new order to the kitchen printer.</span>
              </span>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </label>
          </div>
        </PosPanel>
      )}

      {activeTab === "receipts" && (
        <PosPanel title="Receipt & invoice" hint="GST, service charge, and tax breakup applied on billing.">
          <p className="mb-4 text-[13px] text-text-secondary">
            Configure CGST, SGST, and service charge for {activeOutlet.name}. Billing uses these rates
            automatically (no per-check toggle).
          </p>
          <form
            className="grid max-w-lg gap-3 sm:grid-cols-3"
            onSubmit={(event) => {
              event.preventDefault();
              const next: PosTaxSettings = {
                cgstPercent: Math.max(0, Number(taxSettings.cgstPercent) || 0),
                sgstPercent: Math.max(0, Number(taxSettings.sgstPercent) || 0),
                serviceChargePercent: Math.max(0, Number(taxSettings.serviceChargePercent) || 0),
              };
              savePosTaxSettings(next);
              setTaxSettings(next);
              toast.success("Tax & service charge settings saved.");
            }}
          >
            <label className="block text-[12px] font-semibold text-text-secondary">
              CGST %
              <input
                type="number"
                min={0}
                step={0.1}
                value={taxSettings.cgstPercent}
                onChange={(e) =>
                  setTaxSettings((prev) => ({ ...prev, cgstPercent: Number(e.target.value) }))
                }
                className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-[13px] font-bold text-text-primary"
              />
            </label>
            <label className="block text-[12px] font-semibold text-text-secondary">
              SGST %
              <input
                type="number"
                min={0}
                step={0.1}
                value={taxSettings.sgstPercent}
                onChange={(e) =>
                  setTaxSettings((prev) => ({ ...prev, sgstPercent: Number(e.target.value) }))
                }
                className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-[13px] font-bold text-text-primary"
              />
            </label>
            <label className="block text-[12px] font-semibold text-text-secondary">
              Service Charge %
              <input
                type="number"
                min={0}
                step={0.1}
                value={taxSettings.serviceChargePercent}
                onChange={(e) =>
                  setTaxSettings((prev) => ({
                    ...prev,
                    serviceChargePercent: Number(e.target.value),
                  }))
                }
                className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-[13px] font-bold text-text-primary"
              />
            </label>
            <div className="sm:col-span-3 flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground"
              >
                Save tax settings
              </button>
              <button
                type="button"
                onClick={() => {
                  setTaxSettings(DEFAULT_POS_TAX_SETTINGS);
                  savePosTaxSettings(DEFAULT_POS_TAX_SETTINGS);
                  toast.info("Reset to default GST / service charge rates.");
                }}
                className="rounded-lg border border-border px-3 py-2 text-[12.5px] font-semibold text-text-secondary"
              >
                Reset defaults
              </button>
            </div>
          </form>
        </PosPanel>
      )}

      {activeTab === "printers" && (
        <PosPanel title="Printers & terminals" hint="Kitchen, bar, and cash-drawer routing for this outlet.">
          <p className="text-[13px] text-text-secondary">
            Bar printer 192.168.1.201 and kitchen printer 192.168.1.202 are mapped for {activeOutlet.name}.
          </p>
        </PosPanel>
      )}
    </div>
  );
}
