export const THEME_STORAGE_KEY = "retrod:pms:theme";
export type AppTheme =
  | "light"
  | "dark"
  | "rose-indigo-premium"
  | "emerald-gold-luxury"
  | "ocean-cyan-modern"
  | "sunset-amber"
  | "high-contrast"
  | "graphite-blue-pro"
  | "royal-plum-business"
  | "forest-slate-executive"
  | "copper-night";

export type ThemeGroup = "core" | "professional" | "signature" | "accessibility";

export const APP_THEME_GROUP_LABELS: Record<ThemeGroup, string> = {
  core: "Core",
  professional: "Professional",
  signature: "Signature",
  accessibility: "Accessibility",
};

export interface ThemeDefinition {
  value: AppTheme;
  label: string;
  group: ThemeGroup;
  tagline: string;
  description: string;
  isDark?: boolean;
  swatches: [string, string, string, string]; // [primary, background, sidebar, accent]
}

export const APP_THEMES: ThemeDefinition[] = [
  {
    value: "light",
    label: "Light",
    group: "core",
    tagline: "Daylight Contrast",
    description: "Crisp neutral canvas engineered for high-glare daytime counters.",
    swatches: ["#24664e", "#EEF4F1", "#FFFFFF", "#d1fae5"],
  },
  {
    value: "dark",
    label: "Dark",
    group: "core",
    tagline: "Midnight Dimmed",
    description: "Low-strain dark palette ideal for evening dinner service & dimly-lit bars.",
    isDark: true,
    swatches: ["#0d9488", "#121824", "#182236", "#1c2638"],
  },
  {
    value: "graphite-blue-pro",
    label: "Graphite",
    group: "professional",
    tagline: "Executive Slate",
    description: "Refined corporate slate blue designed for quick-service and enterprise.",
    swatches: ["#3F4F7D", "#EFF2F7", "#FFFFFF", "#dbe4f0"],
  },
  {
    value: "forest-slate-executive",
    label: "Forest",
    group: "professional",
    tagline: "Evergreen Sage",
    description: "Deep botanical green providing a calm, organic restaurant ambiance.",
    swatches: ["#24664e", "#EEF4F1", "#FFFFFF", "#d1fae5"],
  },
  {
    value: "royal-plum-business",
    label: "Royal",
    group: "professional",
    tagline: "Imperial Velvet",
    description: "Regal nocturnal plum crafted for fine dining establishments & banquets.",
    swatches: ["#5B3A7B", "#F2EEF8", "#FFFFFF", "#ede4f7"],
  },
  {
    value: "copper-night",
    label: "Copper",
    group: "professional",
    tagline: "Burnished Bronze",
    description: "Warm champagne canvas paired with rich copper and espresso accents.",
    swatches: ["#b86524", "#fbf7f2", "#FFFFFF", "#fdf5ec"],
  },
  {
    value: "rose-indigo-premium",
    label: "Rose Indigo",
    group: "signature",
    tagline: "Couture Magenta",
    description: "Sophisticated couture berry suited for boutique bistros and cocktail cafés.",
    swatches: ["#A3265F", "#F8EEF5", "#FFFFFF", "#fce7f3"],
  },
  {
    value: "emerald-gold-luxury",
    label: "Emerald Gold",
    group: "signature",
    tagline: "Prestige Jade",
    description: "Opulent emerald green with warm gold undertones for luxury hospitality.",
    swatches: ["#1f7052", "#F5F8F2", "#FFFFFF", "#fef08a"],
  },
  {
    value: "ocean-cyan-modern",
    label: "Ocean Cyan",
    group: "signature",
    tagline: "Coastal Azure",
    description: "Vibrant marine cyan bringing a fresh, modern energy to coastal dining.",
    swatches: ["#18708c", "#F1F7FA", "#FFFFFF", "#cffafe"],
  },
  {
    value: "sunset-amber",
    label: "Sunset Amber",
    group: "signature",
    tagline: "Golden Dusk",
    description: "Warm roasted dusk amber tailored for microbreweries and artisan bakeries.",
    swatches: ["#b8621b", "#FFF8F2", "#FFFFFF", "#fef3c7"],
  },
  {
    value: "high-contrast",
    label: "High Contrast",
    group: "accessibility",
    tagline: "WCAG Maximum",
    description: "Ultra-high visibility deep black borders with vivid royal blue highlights.",
    swatches: ["#1d3b9e", "#FFFFFF", "#FFFFFF", "#dbeafe"],
  },
];

const THEME_CLASSES = [
  "dark",
  "theme-rose-indigo-premium",
  "theme-emerald-gold-luxury",
  "theme-ocean-cyan-modern",
  "theme-sunset-amber",
  "theme-high-contrast",
  "theme-graphite-blue-pro",
  "theme-royal-plum-business",
  "theme-forest-slate-executive",
  "theme-copper-night",
] as const;

export function applyTheme(theme: AppTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove(...THEME_CLASSES);

  const matched = APP_THEMES.find((t) => t.value === theme);
  const isDark = theme === "dark" || Boolean(matched?.isDark);

  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme !== "light") {
    root.classList.add(`theme-${theme}`);
    if (isDark) {
      root.classList.add("dark");
    }
  }

  root.setAttribute("data-theme", theme);
  root.style.colorScheme = isDark ? "dark" : "light";

  try {
    window.dispatchEvent(new CustomEvent("retrod:theme:change", { detail: { theme, isDark } }));
  } catch {}
}

export function readSavedTheme(): AppTheme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored && APP_THEMES.some((theme) => theme.value === stored)) {
    return stored as AppTheme;
  }
  return "light";
}

export function persistTheme(theme: AppTheme) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}
