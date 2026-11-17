export type PosTaxSettings = {
  cgstPercent: number;
  sgstPercent: number;
  serviceChargePercent: number;
  taxRates: number[];
};

const STORAGE_KEY = "retrod_pos_tax_settings";
export const POS_TAX_SETTINGS_EVENT = "retrod:pos-tax-settings-changed";

export const DEFAULT_POS_TAX_SETTINGS: PosTaxSettings = {
  cgstPercent: 2.5,
  sgstPercent: 2.5,
  serviceChargePercent: 5,
  taxRates: [0, 5, 12, 18, 28],
};

let inMemorySettings: PosTaxSettings | null = null;

export function getPosTaxSettings(): PosTaxSettings {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PosTaxSettings>;
        const defaultTotalGst =
          (typeof parsed.cgstPercent === "number" ? parsed.cgstPercent : DEFAULT_POS_TAX_SETTINGS.cgstPercent) +
          (typeof parsed.sgstPercent === "number" ? parsed.sgstPercent : DEFAULT_POS_TAX_SETTINGS.sgstPercent);

        let rates = Array.isArray(parsed.taxRates) && parsed.taxRates.length > 0
          ? parsed.taxRates.map((r) => Number(r)).filter((r) => !isNaN(r) && r >= 0)
          : [...DEFAULT_POS_TAX_SETTINGS.taxRates];

        if (!rates.includes(defaultTotalGst)) {
          rates.push(defaultTotalGst);
        }
        rates = Array.from(new Set(rates)).sort((a, b) => a - b);

        return {
          cgstPercent:
            typeof parsed.cgstPercent === "number" ? parsed.cgstPercent : DEFAULT_POS_TAX_SETTINGS.cgstPercent,
          sgstPercent:
            typeof parsed.sgstPercent === "number" ? parsed.sgstPercent : DEFAULT_POS_TAX_SETTINGS.sgstPercent,
          serviceChargePercent:
            typeof parsed.serviceChargePercent === "number"
              ? parsed.serviceChargePercent
              : DEFAULT_POS_TAX_SETTINGS.serviceChargePercent,
          taxRates: rates,
        };
      }
    }
  } catch {
    /* fallback to in-memory or default */
  }

  if (inMemorySettings) return inMemorySettings;
  return DEFAULT_POS_TAX_SETTINGS;
}

export function savePosTaxSettings(settings: PosTaxSettings): void {
  inMemorySettings = settings;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  } catch {
    /* ignore */
  }
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(POS_TAX_SETTINGS_EVENT, { detail: settings }));
    }
  } catch {
    /* ignore */
  }
}
