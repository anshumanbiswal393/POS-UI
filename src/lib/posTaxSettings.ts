export type PosTaxSettings = {
  cgstPercent: number;
  sgstPercent: number;
  serviceChargePercent: number;
};

const STORAGE_KEY = "retrod_pos_tax_settings";

export const DEFAULT_POS_TAX_SETTINGS: PosTaxSettings = {
  cgstPercent: 2.5,
  sgstPercent: 2.5,
  serviceChargePercent: 5,
};

export function getPosTaxSettings(): PosTaxSettings {
  if (typeof window === "undefined") return DEFAULT_POS_TAX_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_POS_TAX_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<PosTaxSettings>;
    return {
      cgstPercent:
        typeof parsed.cgstPercent === "number" ? parsed.cgstPercent : DEFAULT_POS_TAX_SETTINGS.cgstPercent,
      sgstPercent:
        typeof parsed.sgstPercent === "number" ? parsed.sgstPercent : DEFAULT_POS_TAX_SETTINGS.sgstPercent,
      serviceChargePercent:
        typeof parsed.serviceChargePercent === "number"
          ? parsed.serviceChargePercent
          : DEFAULT_POS_TAX_SETTINGS.serviceChargePercent,
    };
  } catch {
    return DEFAULT_POS_TAX_SETTINGS;
  }
}

export function savePosTaxSettings(settings: PosTaxSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
