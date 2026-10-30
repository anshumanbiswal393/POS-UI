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

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-semibold text-foreground">404</h1>
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
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-pressed"
          >
            Try again
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
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("retrod:pms:theme")||"light";var el=document.documentElement;el.setAttribute("data-theme",t);el.classList.remove("dark","theme-rose-indigo-premium","theme-emerald-gold-luxury","theme-ocean-cyan-modern","theme-sunset-amber","theme-graphite-blue-pro","theme-forest-slate-executive","theme-royal-plum-business","theme-copper-night","theme-high-contrast");if(t==="dark"){el.classList.add("dark");el.style.colorScheme="dark";}else if(t!=="light"){el.classList.add("theme-"+t);el.style.colorScheme="light";}else{el.style.colorScheme="light";}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AuthGate() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAuthenticated, loading, redirectToPmsLogin } = useAuth();

  if (pathname === "/login") return <Outlet />;

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
