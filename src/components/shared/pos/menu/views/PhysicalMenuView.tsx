import { useState, useMemo, useRef } from "react";
import {
  Printer,
  Sparkles,
  Download,
  Eye,
  Sliders,
  Check,
  RotateCcw,
  Store,
  Layers,
  FileText,
  Crown,
  Coffee,
  Moon,
  Columns,
  BookOpen,
  Info,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Palette,
  Image as ImageIcon,
} from "lucide-react";
import type { MenuItem, MenuItemType } from "@/types/posMenu";
import {
  useMenuItems,
  useAddPhysicalMenu,
} from "@/hooks/queries/usePosMenu";
import { useOutletContext } from "@/context/PosOutletContext";
import { toast } from "sonner";

export type MenuTemplateId = "royal" | "modern" | "rustic" | "lounge" | "diner" | "visual";

interface TemplateConfig {
  id: MenuTemplateId;
  name: string;
  subtitle: string;
  badge: string;
  icon: typeof Crown;
  previewBg: string;
  textColor: string;
  accentColor: string;
}

const TEMPLATES: TemplateConfig[] = [
  {
    id: "royal",
    name: "Classic Fine Dining",
    subtitle: "Ornate gold borders & serif elegance",
    badge: "Heritage / Luxury",
    icon: Crown,
    previewBg: "bg-amber-100/90 border-amber-300",
    textColor: "text-amber-950",
    accentColor: "#b45309",
  },
  {
    id: "modern",
    name: "Modern Minimalist Bistro",
    subtitle: "Clean grid, teal accents & dietary dots",
    badge: "Urban / Contemporary",
    icon: Sparkles,
    previewBg: "bg-orange-100/80 border-teal-300",
    textColor: "text-slate-900",
    accentColor: "#0f766e",
  },
  {
    id: "visual",
    name: "Photo Gourmet Catalog",
    subtitle: "Appetizing dish thumbnails & full photo showcase",
    badge: "Illustrated / Visual",
    icon: ImageIcon,
    previewBg: "bg-orange-100/90 border-orange-300",
    textColor: "text-orange-950",
    accentColor: "#ea580c",
  },
  {
    id: "rustic",
    name: "Vintage Craft & Café",
    subtitle: "Artisanal paper tone with stamped headers",
    badge: "Cozy / Vintage",
    icon: Coffee,
    previewBg: "bg-amber-100/70 border-amber-600/40",
    textColor: "text-[#4a2e18]",
    accentColor: "#78350f",
  },
  {
    id: "lounge",
    name: "Midnight Royale Lounge",
    subtitle: "Deep obsidian dark with glowing gold fonts",
    badge: "Bar & Night Club",
    icon: Moon,
    previewBg: "bg-orange-200/80 border-slate-700",
    textColor: "text-amber-200",
    accentColor: "#d97706",
  },
  {
    id: "diner",
    name: "Two-Column Trattoria",
    subtitle: "Magazine dual-column with boxed categories",
    badge: "Family / Diner",
    icon: Columns,
    previewBg: "bg-orange-100/80 border-slate-300",
    textColor: "text-slate-900",
    accentColor: "#2563eb",
  },
];

interface PageCategory {
  category: string;
  items: MenuItem[];
  isContinuation?: boolean;
}

interface MenuPage {
  pageNumber: number;
  categories: PageCategory[];
}

function paginateCategorizedItems(
  categorized: Record<string, MenuItem[]>,
  options: {
    isTwoColumn: boolean;
    showDescriptions: boolean;
  },
): MenuPage[] {
  const entries = Object.entries(categorized);
  if (entries.length === 0) return [];

  // Capacity weights:
  // Each item costs:
  // - in 2-col mode: 0.55 if descriptions else 0.45
  // - in 1-col mode: 1.15 if descriptions else 0.85
  // Category header costs 1.5 units
  const itemCost = options.isTwoColumn
    ? (options.showDescriptions ? 0.6 : 0.45)
    : (options.showDescriptions ? 1.15 : 0.85);
  const headerCost = 1.6;

  // Page 1 includes restaurant brand header, so body space is calibrated for A4 height (1075px)
  const page1Max = options.isTwoColumn ? 16 : 12;
  const subsequentMax = options.isTwoColumn ? 22 : 16;

  const pages: MenuPage[] = [];
  let currentPageCategories: PageCategory[] = [];
  let currentPageCost = 0;
  let pageIndex = 1;

  for (const [catName, items] of entries) {
    if (!items || items.length === 0) continue;

    let itemIdx = 0;
    while (itemIdx < items.length) {
      const maxForCurrentPage = pageIndex === 1 ? page1Max : subsequentMax;
      const isContinuation = itemIdx > 0;
      const effectiveHeaderCost = headerCost;

      // If page already has items and adding this category header + at least 1 item exceeds capacity:
      if (
        currentPageCost > 2 &&
        currentPageCost + effectiveHeaderCost + itemCost > maxForCurrentPage
      ) {
        pages.push({
          pageNumber: pageIndex,
          categories: currentPageCategories,
        });
        pageIndex++;
        currentPageCategories = [];
        currentPageCost = 0;
        continue;
      }

      // Add category header cost
      currentPageCost += effectiveHeaderCost;
      const currentChunkItems: MenuItem[] = [];

      while (itemIdx < items.length) {
        const item = items[itemIdx];
        if (
          currentPageCost + itemCost > maxForCurrentPage &&
          currentChunkItems.length > 0
        ) {
          break;
        }

        currentChunkItems.push(item);
        currentPageCost += itemCost;
        itemIdx++;
      }

      if (currentChunkItems.length > 0) {
        currentPageCategories.push({
          category: catName,
          items: currentChunkItems,
          isContinuation,
        });
      }

      // If page is full and there are still items remaining in this category:
      if (itemIdx < items.length) {
        pages.push({
          pageNumber: pageIndex,
          categories: currentPageCategories,
        });
        pageIndex++;
        currentPageCategories = [];
        currentPageCost = 0;
      }
    }
  }

  if (currentPageCategories.length > 0) {
    pages.push({
      pageNumber: pageIndex,
      categories: currentPageCategories,
    });
  }

  return pages;
}

export function PhysicalMenuView({ onBack }: { onBack?: () => void }) {
  const { activeOutlet } = useOutletContext();
  const { data: menuItems, isLoading } = useMenuItems(activeOutlet.id);
  const addMenuMutation = useAddPhysicalMenu();

  // Template Selection
  const [selectedTemplate, setSelectedTemplate] = useState<MenuTemplateId>("royal");

  // Customization Options
  const [restaurantName, setRestaurantName] = useState(activeOutlet.name);
  const [tagline, setTagline] = useState(
    activeOutlet.type === "Primary Outlet"
      ? "Authentic Multi-Cuisine Dining & Cocktail Lounge"
      : `${activeOutlet.cuisine} • Freshly Prepared Everyday`,
  );
  const [phoneContact, setPhoneContact] = useState(activeOutlet.contact || "+91 98765 43210");
  const [addressLine, setAddressLine] = useState(
    activeOutlet.address || "Sector 4, Main Express Highway",
  );
  const [footerNote, setFooterNote] = useState(
    "All prices in Indian Rupees (INR). Govt taxes applicable. Please inform your server of any dietary allergies.",
  );

  // Layout & Visibility Toggles
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [showDietaryBadges, setShowDietaryBadges] = useState(true);
  const [showItemCodes, setShowItemCodes] = useState(false);
  const [showPrices, setShowPrices] = useState(true);
  const [showPricesWithCurrency, setShowPricesWithCurrency] = useState(true);
  const [onlyActiveItems, setOnlyActiveItems] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Sync outlet name when active outlet switches
  useMemo(() => {
    setRestaurantName(activeOutlet.name);
    setTagline(
      activeOutlet.type === "Primary Outlet"
        ? "Authentic Multi-Cuisine Dining & Cocktail Lounge"
        : `${activeOutlet.cuisine} • Freshly Prepared Everyday`,
    );
    setPhoneContact(activeOutlet.contact);
    setAddressLine(activeOutlet.address);
  }, [activeOutlet]);

  // Derived Category List
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    menuItems?.forEach((i) => i.category && set.add(i.category));
    return Array.from(set);
  }, [menuItems]);

  // Grouped Menu Items by Category
  const categorizedItems = useMemo(() => {
    if (!menuItems) return {};
    const filtered = menuItems.filter((item) => {
      if (onlyActiveItems && item.status !== "Active") return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(item.category)) {
        return false;
      }
      return true;
    });

    const groups: Record<string, MenuItem[]> = {};
    filtered.forEach((item) => {
      const cat = item.category || "Chef Specials";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [menuItems, onlyActiveItems, selectedCategories]);

  const isTwoColumnLayout = selectedTemplate === "diner" || selectedTemplate === "visual";

  // Multi-Page A4 Pagination: splits categories and items so each page adheres strictly to A4 length
  const menuPages = useMemo(() => {
    return paginateCategorizedItems(categorizedItems, {
      isTwoColumn: isTwoColumnLayout,
      showDescriptions,
    });
  }, [categorizedItems, isTwoColumnLayout, showDescriptions]);

  const toggleCategorySelection = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const handlePrint = () => {
    toast.info("Preparing print layout...");
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleSaveSnapshot = () => {
    const templateName = TEMPLATES.find((t) => t.id === selectedTemplate)?.name || "Menu";
    addMenuMutation.mutate(
      {
        name: `${activeOutlet.name} - ${templateName} Menu (Auto-Generated)`,
        type: "Generated Dine-In Menu",
        fileSize: "1.4 MB",
      },
      {
        onSuccess: () => {
          toast.success("Saved printed menu snapshot to physical records!");
        },
      },
    );
  };

  const renderDietaryIcon = (type: MenuItemType) => {
    if (!showDietaryBadges) return null;
    switch (type) {
      case "Veg":
        return (
          <span
            title="Vegetarian"
            className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-xs border border-emerald-600 bg-white shrink-0 ml-1.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          </span>
        );
      case "Non-Veg":
        return (
          <span
            title="Non-Vegetarian"
            className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-xs border border-red-600 bg-white shrink-0 ml-1.5"
          >
            <span className="h-0 w-0 border-x-[2.5px] border-x-transparent border-b-[5px] border-b-red-600" />
          </span>
        );
      case "Egg":
        return (
          <span
            title="Egg"
            className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-xs border border-amber-600 bg-white shrink-0 ml-1.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Actions (Single Page — Tab switch bar removed) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-2xs no-print">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-[14px] sm:text-[15px] font-bold text-slate-900 flex items-center gap-2 leading-tight">
              Live Menu Generator & Print Studio
            </h2>
            <p className="text-[11.5px] text-slate-500 leading-tight mt-0.5">
              Auto-format and print physical menus for{" "}
              <span className="font-semibold text-slate-800">{activeOutlet.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSaveSnapshot}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Save Snapshot
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 px-4 py-2 text-[12.5px] font-bold text-primary-foreground shadow-2xs transition cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print Physical Menu
          </button>
        </div>
      </div>

      {/* 2. Menu Design Templates (Small Height Based Cards) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-3.5 shadow-2xs space-y-2 no-print">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5">
            <Palette className="h-4 w-4 text-primary" />
            Menu Design Templates
          </h3>
          <span className="text-[11px] font-semibold text-primary">
            {TEMPLATES.length} Styles Available
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-0.5">
          {TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            const isSelected = selectedTemplate === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => {
                  setSelectedTemplate(tmpl.id);
                }}
                className={`relative rounded-xl border p-2 text-left transition-all cursor-pointer flex items-center gap-2.5 h-[56px] select-none ${
                  isSelected
                    ? "border-primary bg-primary/10 ring-2 ring-primary/25 shadow-xs"
                    : "border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 shadow-2xs"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-slate-200/80 ${tmpl.previewBg}`}
                >
                  <Icon className="h-4 w-4" style={{ color: tmpl.accentColor }} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-bold text-slate-900 truncate leading-tight">
                    {tmpl.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
                    {tmpl.badge.split("/")[0].trim()}
                  </div>
                </div>

                {isSelected && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold shrink-0">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">

          {/* 3. Designer Controls & Customizer Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Customization Controls (4 Cols) */}
            <div className="lg:col-span-4 space-y-4 no-print">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-[13.5px] font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-primary" />
                    Menu Customizer
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategories([]);
                      setShowDescriptions(true);
                      setShowDietaryBadges(true);
                      setShowItemCodes(false);
                      setShowPrices(true);
                      setZoomLevel(100);
                      toast.info("Reset customization settings");
                    }}
                    className="text-[11.5px] font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                </div>

                {/* Header Info */}
                <div className="space-y-2.5">
                  <div className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400">
                    Header Details
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Restaurant Title
                    </label>
                    <input
                      type="text"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[12.5px] font-semibold text-slate-800 focus:outline-hidden focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tagline / Specialty
                    </label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[12px] text-slate-700 focus:outline-hidden focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={phoneContact}
                        onChange={(e) => setPhoneContact(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11.5px] text-slate-700 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11.5px] text-slate-700 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Display Toggles */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400">
                    Content Elements
                  </div>

                  <label className="flex items-center justify-between py-1 text-[12.5px] text-slate-700 cursor-pointer">
                    <span>Show Dish Descriptions</span>
                    <input
                      type="checkbox"
                      checked={showDescriptions}
                      onChange={(e) => setShowDescriptions(e.target.checked)}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between py-1 text-[12.5px] text-slate-700 cursor-pointer">
                    <span>Show Veg / Non-Veg Icons</span>
                    <input
                      type="checkbox"
                      checked={showDietaryBadges}
                      onChange={(e) => setShowDietaryBadges(e.target.checked)}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between py-1 text-[12.5px] text-slate-700 cursor-pointer">
                    <span>Show SKU / Item Codes</span>
                    <input
                      type="checkbox"
                      checked={showItemCodes}
                      onChange={(e) => setShowItemCodes(e.target.checked)}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between py-1 text-[12.5px] text-slate-700 cursor-pointer">
                    <span>Show Prices (₹)</span>
                    <input
                      type="checkbox"
                      checked={showPrices}
                      onChange={(e) => setShowPrices(e.target.checked)}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between py-1 text-[12.5px] text-slate-700 cursor-pointer">
                    <span>Only Active Dishes</span>
                    <input
                      type="checkbox"
                      checked={onlyActiveItems}
                      onChange={(e) => setOnlyActiveItems(e.target.checked)}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                  </label>
                </div>

                {/* Filter Categories for Print */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400">
                      Included Categories
                    </span>
                    {selectedCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCategories([])}
                        className="text-[11px] text-primary font-semibold cursor-pointer"
                      >
                        Select All
                      </button>
                    )}
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {allCategories.map((cat) => {
                      const isIncluded =
                        selectedCategories.length === 0 || selectedCategories.includes(cat);
                      return (
                        <label
                          key={cat}
                          className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-slate-50 text-[12px] text-slate-700 cursor-pointer"
                        >
                          <span className="truncate">{cat}</span>
                          <input
                            type="checkbox"
                            checked={isIncluded}
                            onChange={() => toggleCategorySelection(cat)}
                            className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Notes */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Footer Note / Tax Disclaimer
                  </label>
                  <textarea
                    rows={2}
                    value={footerNote}
                    onChange={(e) => setFooterNote(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11.5px] text-slate-700 focus:outline-hidden resize-none"
                  />
                </div>

                {/* Zoom Controller */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[12px]">
                  <span className="font-semibold text-slate-600">Preview Zoom:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                      className="rounded p-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </button>
                    <span className="font-mono font-bold text-slate-800 w-10 text-center">
                      {zoomLevel}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                      className="rounded p-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Multi-Page A4 Print Sheet Preview (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col items-center">
              {/* Preview Toolbar with Page Count and Zoom */}
              <div className="w-full max-w-[760px] flex items-center justify-between pb-3 no-print">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    A4 Print Sheets ({menuPages.length} {menuPages.length === 1 ? "Page" : "Pages"})
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    Standard A4 Dimensions (210mm × 297mm)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-slate-500 text-[11px]">Zoom:</span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
                    className="rounded p-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-mono font-bold text-slate-800 w-9 text-center text-xs">
                    {zoomLevel}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(120, z + 10))}
                    className="rounded p-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Printable Menu Pages Stack */}
              <div
                id="printable-menu-area"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: "top center",
                }}
                className="w-full flex flex-col items-center gap-7 transition-all print:gap-0 print:transform-none"
              >
                {menuPages.length === 0 ? (
                  <div className="w-full max-w-[760px] h-[600px] rounded-2xl border border-slate-200 bg-white flex flex-col items-center justify-center text-slate-400 p-8 shadow-sm">
                    <Utensils className="h-10 w-10 mb-2 stroke-1 text-slate-300" />
                    <h4 className="text-sm font-bold text-slate-700">No dishes selected for menu print</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs text-center">
                      Enable active dishes or adjust category filters in the customizer panel.
                    </p>
                  </div>
                ) : (
                  menuPages.map((page) => {
                    const isFirstPage = page.pageNumber === 1;
                    const isLastPage = page.pageNumber === menuPages.length;

                    return (
                      <div
                        key={page.pageNumber}
                        className="w-full max-w-[760px] flex flex-col items-center gap-1.5 print:w-full print:max-w-none"
                      >
                        {/* Page Boundary Header (Screen preview only) */}
                        <div className="no-print flex items-center justify-between w-full px-2 text-[11px] font-semibold text-slate-400">
                          <span className="uppercase tracking-wider">A4 Page {page.pageNumber}</span>
                          <span>Sheet {page.pageNumber} of {menuPages.length}</span>
                        </div>

                        {/* Individual A4 Page Sheet (Strict A4 Length & Ratio) */}
                        <div
                          className={`a4-page-sheet w-full max-w-[760px] h-[1075px] min-h-[1075px] max-h-[1075px] rounded-2xl shadow-xl transition-all p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden select-none print:m-0 print:p-8 print:w-full print:max-w-none print:h-[277mm] print:min-h-[277mm] print:max-h-[277mm] print:shadow-none print:rounded-none print:break-after-page ${
                            selectedTemplate === "royal"
                              ? "bg-[#fffdf7] text-[#2c1d11] border-6 border-double border-[#b45309]/50"
                              : selectedTemplate === "modern"
                                ? "bg-white text-slate-900 border border-slate-300"
                                : selectedTemplate === "visual"
                                  ? "bg-[#fffaf5] text-stone-900 border-2 border-orange-200/90"
                                  : selectedTemplate === "rustic"
                                    ? "bg-[#fbf6ee] text-[#3d2410] border-4 border-dashed border-[#854d0e]/40"
                                    : selectedTemplate === "lounge"
                                      ? "bg-[#090d16] text-[#fef3c7] border-2 border-[#d97706]/60 shadow-2xl"
                                      : "bg-white text-slate-900 border border-slate-300"
                          }`}
                        >
                          {/* 1. Header Area */}
                          {isFirstPage ? (
                            /* First Page: Full Header */
                            <div className="text-center pb-3 border-b border-current/20 space-y-0.5 shrink-0">
                              {selectedTemplate === "royal" && (
                                <div className="flex justify-center text-[#b45309] mb-0.5">
                                  <Crown className="h-5 w-5" />
                                </div>
                              )}
                              {selectedTemplate === "visual" && (
                                <div className="flex justify-center text-orange-600 mb-0.5">
                                  <Sparkles className="h-4.5 w-4.5" />
                                </div>
                              )}

                              <h1
                                className={`text-[20px] sm:text-[23px] font-extrabold tracking-tight uppercase leading-tight ${
                                  selectedTemplate === "royal"
                                    ? "font-serif text-[#78350f]"
                                    : selectedTemplate === "lounge"
                                      ? "text-[#fbbf24] tracking-widest font-serif"
                                      : selectedTemplate === "rustic"
                                        ? "font-serif text-[#78350f]"
                                        : selectedTemplate === "visual"
                                          ? "text-orange-950 tracking-tight"
                                          : "font-sans text-slate-900"
                                }`}
                              >
                                {restaurantName}
                              </h1>

                              {tagline && (
                                <p
                                  className={`text-[11px] sm:text-[11.5px] italic opacity-85 ${
                                    selectedTemplate === "lounge"
                                      ? "text-amber-200/90"
                                      : selectedTemplate === "visual"
                                        ? "text-orange-900/80"
                                        : ""
                                  }`}
                                >
                                  ~ {tagline} ~
                                </p>
                              )}

                              <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] opacity-70 pt-0.5">
                                {addressLine && <span>{addressLine}</span>}
                                {addressLine && phoneContact && <span>•</span>}
                                {phoneContact && <span>Reservations: {phoneContact}</span>}
                              </div>
                            </div>
                          ) : (
                            /* Subsequent Pages: Slim Running Header */
                            <div className="flex items-center justify-between pb-2 border-b border-current/20 shrink-0 text-xs">
                              <span
                                className={`font-bold tracking-wider uppercase text-[11px] ${
                                  selectedTemplate === "royal" || selectedTemplate === "rustic"
                                    ? "font-serif text-[#92400e]"
                                    : selectedTemplate === "lounge"
                                      ? "text-[#fbbf24] font-serif"
                                      : "text-slate-800"
                                }`}
                              >
                                {restaurantName}
                              </span>
                              <span className="text-[10px] opacity-70 uppercase tracking-widest font-semibold">
                                Menu • Page {page.pageNumber} of {menuPages.length}
                              </span>
                            </div>
                          )}

                          {/* 2. Categorized Menu Items on this page */}
                          <div
                            className={`flex-1 min-h-0 py-2.5 gap-x-5 gap-y-2.5 overflow-hidden ${
                              selectedTemplate === "diner" || selectedTemplate === "visual"
                                ? "grid grid-cols-1 md:grid-cols-2 content-start"
                                : "flex flex-col justify-start space-y-2"
                            }`}
                          >
                            {page.categories.map((catGroup) => (
                              <div
                                key={`${catGroup.category}-${catGroup.isContinuation ? "cont" : "main"}`}
                                className={`space-y-1 ${
                                  selectedTemplate === "diner"
                                    ? "p-2 rounded-lg border border-slate-200 bg-slate-50/50"
                                    : selectedTemplate === "visual"
                                      ? "p-2 rounded-xl border border-orange-200/70 bg-white/80 shadow-2xs"
                                      : ""
                                }`}
                              >
                                {/* Category Heading */}
                                <div
                                  className={`flex items-center gap-2 pb-0.5 ${
                                    selectedTemplate === "royal"
                                      ? "border-b border-[#b45309]/30 text-center justify-center"
                                      : selectedTemplate === "modern"
                                        ? "border-b-2 border-primary"
                                        : selectedTemplate === "visual"
                                          ? "border-b-2 border-orange-500 text-orange-950"
                                          : selectedTemplate === "lounge"
                                            ? "border-b border-amber-500/40 text-[#f59e0b]"
                                            : selectedTemplate === "rustic"
                                              ? "border-b-2 border-dashed border-[#854d0e]/40"
                                              : "border-b border-slate-300"
                                  }`}
                                >
                                  <h3
                                    className={`text-[12.5px] sm:text-[13px] font-bold uppercase tracking-wider ${
                                      selectedTemplate === "royal"
                                        ? "font-serif text-[#92400e]"
                                        : selectedTemplate === "modern"
                                          ? "text-primary"
                                          : selectedTemplate === "visual"
                                            ? "text-orange-900 font-extrabold"
                                            : selectedTemplate === "lounge"
                                              ? "font-serif text-[#fbbf24]"
                                              : selectedTemplate === "rustic"
                                                ? "font-serif text-[#78350f]"
                                                : "text-slate-800"
                                    }`}
                                  >
                                    {catGroup.category} {catGroup.isContinuation ? "(Cont.)" : ""}
                                  </h3>
                                  <span className="text-[9.5px] opacity-60">({catGroup.items.length})</span>
                                </div>

                                {/* Items in this category chunk */}
                                <div className="space-y-1 pt-0.5">
                                  {catGroup.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className={`transition ${
                                        selectedTemplate === "visual"
                                          ? "flex items-start gap-2 p-1 rounded-lg bg-orange-50/40 border border-orange-100/80"
                                          : "space-y-0"
                                      }`}
                                    >
                                      {selectedTemplate === "visual" && (
                                        <div className="h-11 w-11 rounded-lg overflow-hidden shrink-0 border border-orange-200/80 bg-orange-50 flex items-center justify-center">
                                          {item.images && item.images.length > 0 && item.images[0] ? (
                                            <img
                                              src={item.images[0].url}
                                              alt={item.name}
                                              className="h-full w-full object-cover"
                                              loading="lazy"
                                            />
                                          ) : (
                                            <div className="flex flex-col items-center justify-center text-orange-400">
                                              <ImageIcon className="h-3.5 w-3.5" />
                                              <span className="text-[7px] font-bold uppercase tracking-tighter mt-0.5">
                                                Food
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      <div className="flex-1 min-w-0">
                                        {/* Name + Price Line */}
                                        <div className="flex items-baseline justify-between gap-1.5">
                                          <div className="flex items-center gap-1 min-w-0">
                                            <span
                                              className={`text-[12px] font-bold truncate ${
                                                selectedTemplate === "royal"
                                                  ? "font-serif"
                                                  : selectedTemplate === "lounge"
                                                    ? "text-amber-100"
                                                    : selectedTemplate === "visual"
                                                      ? "text-stone-900"
                                                      : "text-slate-900"
                                              }`}
                                            >
                                              {item.name}
                                            </span>

                                            {renderDietaryIcon(item.itemType)}

                                            {showItemCodes && (
                                              <span className="font-mono text-[8.5px] opacity-60 ml-0.5 shrink-0">
                                                [{item.code}]
                                              </span>
                                            )}
                                          </div>

                                          {showPrices && (
                                            <div className="flex items-baseline gap-1 shrink-0 font-bold text-[12px]">
                                              {selectedTemplate === "royal" && (
                                                <span className="hidden sm:inline-block border-b border-dotted border-current/30 flex-1 w-5" />
                                              )}
                                              <span
                                                className={
                                                  selectedTemplate === "visual"
                                                    ? "text-orange-700 font-extrabold"
                                                    : ""
                                                }
                                              >
                                                {showPricesWithCurrency ? "₹" : ""}
                                                {item.price}
                                              </span>
                                            </div>
                                          )}
                                        </div>

                                        {/* Description Line */}
                                        {showDescriptions && item.description && (
                                          <p
                                            className={`text-[9.5px] sm:text-[10px] leading-tight opacity-75 mt-0.5 ${
                                              selectedTemplate === "royal" ? "italic" : ""
                                            } ${selectedTemplate === "visual" ? "line-clamp-2 text-stone-600" : ""}`}
                                          >
                                            {item.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* 3. Page Footer Area */}
                          <div className="pt-2 border-t border-current/20 shrink-0 text-center space-y-0.5">
                            {isLastPage && footerNote && (
                              <p className="text-[9.5px] sm:text-[10px] opacity-75 leading-tight">
                                {footerNote}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-[9.5px] opacity-60 pt-0.5">
                              <span>Retrod POS • {activeOutlet.name}</span>
                              <span className="font-semibold tracking-wider uppercase">
                                Page {page.pageNumber} of {menuPages.length}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

function Utensils(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
      <path d="M15 2v18" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  );
}
