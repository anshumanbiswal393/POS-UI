import { QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  Navigate,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { PosShell } from "@/components/layout/pos/PosShell";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AppToaster } from "@/components/providers/AppToaster";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { PosOutletProvider } from "@/context/PosOutletContext";
import { useAuth } from "@/hooks/useAuth";
import { applyTheme, readSavedTheme } from "@/app/theme/theme";
import { standardizeExistingPosLocalStorage } from "@/utils/textUtils";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-semibold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">This POS route does not exist.</p>
        <div className="mt-6">
          <Link
            to="/pos"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-pressed"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  const isChunkError =
    error?.message?.includes("Failed to fetch dynamically imported module") ||
    error?.message?.includes("Importing a module script failed") ||
    error?.message?.includes("error loading dynamically imported module");

  useEffect(() => {
    if (isChunkError && typeof window !== "undefined") {
      const reloadKey = "retrod:chunk_reload:" + window.location.pathname;
      const last = sessionStorage.getItem(reloadKey);
      if (!last || Date.now() - Number(last) > 10000) {
        sessionStorage.setItem(reloadKey, String(Date.now()));
        window.location.reload();
      }
    }
  }, [isChunkError]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">
          {isChunkError ? "New update available" : "This page didn't load"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isChunkError
            ? "A newer version was deployed. Reloading page..."
            : error.message}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              if (isChunkError && typeof window !== "undefined") {
                window.location.reload();
              } else {
                router.invalidate();
                reset();
              }
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-pressed cursor-pointer"
          >
            {isChunkError ? "Reload page" : "Try again"}
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Retrod | POS" },
      {
        name: "description",
        content: "Restaurant point of sale — dashboard, orders, menu, inventory, and more.",
      },
    ],
    links: [
      { rel: "icon", type: "image/jpeg", href: "/favicon.jpeg" },
      { rel: "shortcut icon", type: "image/jpeg", href: "/favicon.jpeg" },
      { rel: "apple-touch-icon", href: "/favicon.jpeg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Retrod | POS</title>
        <link rel="icon" type="image/jpeg" href="/favicon.jpeg" />
        <link rel="shortcut icon" type="image/jpeg" href="/favicon.jpeg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
        />
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("retrod:pms:theme")||"light";var el=document.documentElement;el.setAttribute("data-theme",t);el.classList.remove("dark","theme-rose-indigo-premium","theme-emerald-gold-luxury","theme-ocean-cyan-modern","theme-sunset-amber","theme-graphite-blue-pro","theme-forest-slate-executive","theme-royal-plum-business","theme-copper-night","theme-high-contrast");if(t==="dark"){el.classList.add("dark");el.style.colorScheme="dark";}else if(t!=="light"){el.classList.add("theme-"+t);el.style.colorScheme="light";}else{el.style.colorScheme="light";}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: 'window.addEventListener("vite:preloadError", function() { window.location.reload(); });',
          }}
        />
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AuthGate() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAuthenticated, loading, redirectToPmsLogin, user, logout } = useAuth();

  if (pathname === "/login" || pathname === "/login/" || pathname.startsWith("/login")) {
    return <Outlet />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-text-secondary animate-pulse">
            Connecting to Retrod session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const isRetrod = typeof window !== "undefined" && window.location.hostname.endsWith("retrod.in");
    if (isRetrod) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <h2 className="text-base font-semibold text-text-primary">Redirecting to Sign In...</h2>
            <p className="mt-1 text-xs text-text-secondary">
              Redirecting you to Retrod PMS unified login session.
            </p>
            <button
              onClick={() => redirectToPmsLogin()}
              className="mt-4 inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-pressed"
            >
              Click here if not redirected
            </button>
          </div>
        </div>
      );
    }
  }

  const isSuperadminUser =
    Boolean(user?.is_superuser) ||
    String(user?.role || "").toLowerCase() === "super_admin" ||
    String(user?.role || "").toLowerCase() === "superadmin";

  const lacksPosSubscription =
    isAuthenticated &&
    !isSuperadminUser &&
    Array.isArray(user?.subscribed_products) &&
    !user.subscribed_products.some((p) => String(p).toUpperCase() === "POS");

  if (lacksPosSubscription) {
    const pmsOrigin =
      typeof window !== "undefined" && window.location.hostname.includes("dev.retrod.in")
        ? "https://app.dev.retrod.in"
        : typeof window !== "undefined" && window.location.hostname.endsWith("retrod.in")
          ? "https://app.retrod.in"
          : "http://localhost:3000";
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 text-center shadow-lg space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 text-2xl font-bold">
            !
          </div>
          <h2 className="text-lg font-bold text-text-primary">
            Upgrade Your Subscription Plan
          </h2>
          <p className="text-[13px] text-text-secondary leading-relaxed">
            Your active Retrod subscription does not include <strong>Point of Sale (POS)</strong>.
            Upgrade your subscription plan or contact Retrod support to activate POS for your property.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                window.location.href = `${pmsOrigin}/settings`;
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary-pressed transition cursor-pointer"
            >
              Upgrade Subscription Plan
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = `${pmsOrigin}/`;
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-border bg-white px-4 py-2 text-[13px] font-semibold text-text-primary hover:bg-slate-50 transition cursor-pointer"
            >
              Back to PMS
            </button>
          </div>
          <div className="pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => logout()}
              className="text-[12px] font-medium text-destructive hover:underline cursor-pointer"
            >
              Log out and sign in with another account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // POS-only product: every screen uses PosShell
  return (
    <PosShell>
      <Outlet />
    </PosShell>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    applyTheme(readSavedTheme());
    standardizeExistingPosLocalStorage();
  }, []);

  useEffect(() => {
    document.title = "Retrod | POS";
  }, [pathname]);

  return (
    <QueryProvider client={queryClient}>
      <AuthProvider>
        <PosOutletProvider>
          <AppToaster />
          <AuthGate />
        </PosOutletProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
