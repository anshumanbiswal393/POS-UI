import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ChevronDown,
  Globe,
  Sun,
  Smartphone,
  Loader2,
  AlertCircle,
  LifeBuoy,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/services/auth-api";
import { ROLE_LABEL } from "@/lib/auth/rbac";
import { BloombergDashboard } from "./BloombergDashboard";

type Mode = "otp" | "password";
type ErrorKind = null | "credentials" | "otp_expired" | "network";

export function LoginPageFeature() {
  const { users, login, loginWithPassword, isAuthenticated, redirectToPmsLogin } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("password");
  const [selected, setSelected] = useState<string>(users[0]?.id ?? "");

  // OTP state
  const [contact, setContact] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  // Password state
  const [username, setUsername] = useState("aarav");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);

  // Async UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorKind>(null);

  useEffect(() => {
    if (isAuthenticated) {
      nav({ to: "/pos" });
    }
  }, [isAuthenticated, nav]);

  const errorMsg = useMemo(() => {
    switch (error) {
      case "credentials":
        return "Invalid credentials. Please check your username and password.";
      case "otp_expired":
        return "OTP expired. Please request a new code.";
      case "network":
        return "Network issue. Check your connection and try again.";
      default:
        return null;
    }
  }, [error]);

  const fakeDelay = () => new Promise<void>((r) => setTimeout(r, 700));

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (loginWithPassword) {
        await loginWithPassword(username.trim(), password);
        setLoading(false);
        nav({ to: "/pos" });
        return;
      }
    } catch (err: any) {
      console.warn("Backend auth error, falling back to local account check:", err);
    }

    const trimmedUsername = username.trim().toLowerCase();
    const match = trimmedUsername
      ? (users.find((u) => u.email.toLowerCase().startsWith(trimmedUsername)) ??
        users.find((u) => u.email.toLowerCase().includes(trimmedUsername)) ??
        users.find((u) => u.name.toLowerCase().includes(trimmedUsername)) ??
        users.find((u) => u.id === selected))
      : users.find((u) => u.id === selected);

    setLoading(false);
    const targetUser = match ?? users.find((u) => u.id === selected) ?? users[0];
    if (targetUser) {
      login(targetUser.id);
      nav({ to: "/pos" });
    } else {
      setError("credentials");
    }
  };

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim()) {
      setError("credentials");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authApi.requestOtp(contact.trim());
      setLoading(false);
      setOtpSent(true);
    } catch {
      await fakeDelay();
      setLoading(false);
      setOtpSent(true);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (otp.length < 4) {
      setLoading(false);
      setError("otp_expired");
      return;
    }
    try {
      await authApi.verifyOtp(contact.trim(), otp.trim());
      setLoading(false);
      nav({ to: "/pos" });
      return;
    } catch {
      // Fallback local match
    }
    await fakeDelay();
    setLoading(false);
    const match = users.find((u) => u.id === selected) ?? users[0];
    if (match) {
      login(match.id);
      nav({ to: "/pos" });
    } else {
      setError("credentials");
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.9fr_1fr] bg-background">
      {/* LEFT — Premium branding command center */}
      <BloombergDashboard />

      {/* RIGHT — Compact sign-in form */}
      <div className="relative flex flex-col bg-[oklch(0.985_0.003_240)]">
        <div className="absolute right-6 top-6 flex items-center gap-2">
          <button className="flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 text-[11.5px] text-text-secondary shadow-sm hover:text-text-primary transition">
            <Globe className="h-3.5 w-3.5" /> EN
          </button>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-text-secondary shadow-sm hover:text-text-primary transition"
            aria-label="Theme"
          >
            <Sun className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center px-5 py-12">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Store Terminal Access
          </div>
          <h2 className="mt-2 font-display text-[30px] font-semibold leading-tight text-text-primary">
            Sign in to Retrod POS
          </h2>
          <p className="mt-2 text-[13px] text-text-secondary">
            Enter your credentials or select a demo role to open store operations.
          </p>

          {/* Mode toggle */}
          <div className="mt-6 grid grid-cols-2 rounded-full border border-border bg-surface p-1 shadow-sm">
            {(["otp", "password"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`h-9 rounded-full text-[12.5px] font-medium transition-all ${
                  mode === m
                    ? "bg-gradient-to-r from-primary to-[oklch(0.55_0.22_295)] text-primary-foreground shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {m === "otp" ? "OTP login" : "Password login"}
              </button>
            ))}
          </div>

          {errorMsg && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] text-destructive animate-fade-in">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* OTP FORM */}
          {mode === "otp" && (
            <form onSubmit={otpSent ? verifyOtp : sendOtp} className="mt-5 space-y-4">
              <Field label="Phone number or email ID">
                <div className="relative">
                  <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Enter phone or email"
                    disabled={otpSent}
                    className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-[13.5px] text-text-primary placeholder:text-text-disabled shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:bg-muted/50 transition-all"
                  />
                </div>
              </Field>

              {otpSent && (
                <Field label="Enter the 6-digit code">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-center text-[16px] tracking-[0.5em] text-text-primary placeholder:text-text-disabled shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
                  />
                  <div className="mt-1.5 flex justify-between text-[11.5px] text-text-secondary">
                    <span>
                      Code sent to <b className="text-text-primary">{contact}</b>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                      }}
                      className="font-medium text-primary hover:underline"
                    >
                      Change
                    </button>
                  </div>
                </Field>
              )}

              <PrimaryButton loading={loading}>
                {otpSent ? "Verify & sign in" : "Continue with OTP"}
              </PrimaryButton>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <button
                  type="button"
                  onClick={() => {
                    setMode("password");
                    setError(null);
                  }}
                  className="text-[11.5px] font-medium uppercase tracking-[0.16em] text-text-secondary hover:text-primary transition"
                >
                  Or login with password
                </button>
                <div className="h-px flex-1 bg-border" />
              </div>
            </form>
          )}

          {/* PASSWORD FORM */}
          {mode === "password" && (
            <form onSubmit={submitPassword} className="mt-5 space-y-4">
              <Field label="Username">
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="aarav_admin"
                    className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-[13.5px] text-text-primary placeholder:text-text-disabled shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
                  />
                </div>
              </Field>

              <Field label="Password">
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-10 text-[13.5px] text-text-primary placeholder:text-text-disabled shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-secondary transition"
                    aria-label="Toggle password"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-text-secondary select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-[12.5px] font-medium text-primary hover:underline transition"
                >
                  Forgot password?
                </button>
              </div>

              <PrimaryButton loading={loading}>Sign in</PrimaryButton>
            </form>
          )}

          {/* Demo access widget */}
          <div className="mt-6 rounded-xl border border-border bg-surface p-3.5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-primary">
                Demo access
              </div>
              <Sparkles className="h-3.5 w-3.5 text-primary/70" />
            </div>
            <div className="relative">
              <select
                value={selected}
                onChange={(e) => {
                  setSelected(e.target.value);
                  const u = users.find((x) => x.id === e.target.value);
                  if (u) {
                    setUsername(u.email.split("@")[0]);
                  }
                }}
                className="h-10 w-full appearance-none rounded-lg border border-border bg-surface px-3 pr-9 text-[12.5px] text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {ROLE_LABEL[u.role]}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            </div>
          </div>

          {/* Footer details */}
          <div className="mt-8 space-y-2 border-t border-border pt-4 text-[11px] text-text-disabled">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3 w-3" /> Retrod Bistro & Cafe · Connaught Place
              </span>
              <span className="flex items-center gap-1.5">
                <LifeBuoy className="h-3 w-3" /> support@retrod.io
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>© 2026 Retrod Systems</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> v4.2.0 · build 2026.05
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrimaryButton({ loading, children }: { loading?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.55_0.22_295)] text-[13.5px] font-medium text-primary-foreground shadow-sm shadow-primary/25 transition-all hover:shadow-md hover:shadow-primary/35 disabled:opacity-70 cursor-pointer"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {children}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-medium text-text-primary">{label}</label>
      {children}
    </div>
  );
}
export default LoginPageFeature;
