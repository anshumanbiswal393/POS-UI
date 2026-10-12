import { useState, useMemo, useRef, useEffect } from "react";
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
  LayoutList,
  BookOpen,
  Info,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Palette,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";
import type { MenuItem, MenuItemType } from "@/types/posMenu";
import {
  useMenuItems,
  useAddPhysicalMenu,
} from "@/hooks/queries/usePosMenu";
import { useOutletContext } from "@/context/PosOutletContext";
import { toast } from "sonner";

export type MenuTemplateId = "diner" | "showcase" | "royal" | "modern" | "lounge";

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
    id: "diner",
    name: "Art Deco Two-Column Diner",
    subtitle: "Retro Hideaway dual-column with ribbon category banners",
    badge: "Vintage / Trattoria",
    icon: Columns,
    previewBg: "bg-teal-50 border-teal-300",
    textColor: "text-slate-900",
    accentColor: "#0f766e",
  },
  {
    id: "showcase",
    name: "Curated Photo Showcase",
    subtitle: "Hero arched food photo & featured dish highlights",
    badge: "Editorial / Bistro",
    icon: ImageIcon,
    previewBg: "bg-orange-50 border-orange-300",
    textColor: "text-stone-900",
    accentColor: "#ea580c",
  },
  {
    id: "royal",
    name: "Classic Fine Dining",
    subtitle: "Ornate gold borders, crown crest & serif elegance",
    badge: "Heritage / Luxury",
    icon: Crown,
    previewBg: "bg-amber-50 border-amber-300",
    textColor: "text-amber-950",
    accentColor: "#b45309",
  },
  {
    id: "modern",
    name: "Modern Minimalist Bistro",
    subtitle: "Clean grid, architectural lines & dietary badges",
    badge: "Urban / Contemporary",
    icon: Sparkles,
    previewBg: "bg-slate-100 border-slate-300",
    textColor: "text-slate-900",
    accentColor: "#1e293b",
  },
  {
    id: "lounge",
    name: "Midnight Royale Lounge",
    subtitle: "Deep obsidian dark with glowing amber & gold accents",
    badge: "Bar & Night Club",
    icon: Moon,
    previewBg: "bg-slate-900 border-amber-600/50",
    textColor: "text-amber-200",
    accentColor: "#d97706",
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
    templateId?: MenuTemplateId;
  },
): MenuPage[] {
  const entries = Object.entries(categorized);
  if (entries.length === 0) return [];

  // Calibrated Pixel Heights for standard A4 page (1075px total height):
  // For showcase, Page 1 has an arched hero image so available height is ~680px
  const isShowcase = options.templateId === "showcase";
  const page1MaxPixels = isShowcase ? 680 : 840;
  const subsequentMaxPixels = 920;

  // Category Header pixel height (with line & padding): ~30px
  const headerHeight = 30;

  // Item pixel height:
  // In 2-column mode, 2 items share a single row!
  // Row height is ~36px with description, ~22px without description.
  // Effective cost per item in 2 columns: ~18px with desc, ~11px without desc.
  // In 1-column mode: ~36px with desc, ~22px without desc.
  const itemHeight = options.isTwoColumn
    ? (options.showDescriptions ? 18 : 11)
    : (options.showDescriptions ? 36 : 22);

  const pages: MenuPage[] = [];
  let currentPageCategories: PageCategory[] = [];
  let currentPageHeight = 0;
  let pageIndex = 1;

  for (const [catName, items] of entries) {
    if (!items || items.length === 0) continue;

    let itemIdx = 0;
    while (itemIdx < items.length) {
      const maxForCurrentPage = pageIndex === 1 ? page1MaxPixels : subsequentMaxPixels;
      const isContinuation = itemIdx > 0;

      // Only break to next page if current page already has substantial content (> 300px)
      // AND adding the header + at least 2 items would exceed the page max!
      const minCategoryStartCost = headerHeight + (itemHeight * (options.isTwoColumn ? 2 : 1));
      if (
        currentPageHeight > 300 &&
        currentPageHeight + minCategoryStartCost > maxForCurrentPage
      ) {
        pages.push({
          pageNumber: pageIndex,
          categories: currentPageCategories,
        });
        pageIndex++;
        currentPageCategories = [];
        currentPageHeight = 0;
        continue;
      }

      currentPageHeight += headerHeight;
      const currentChunkItems: MenuItem[] = [];

      while (itemIdx < items.length) {
        const item = items[itemIdx];
        if (
          currentPageHeight + itemHeight > maxForCurrentPage &&
          currentChunkItems.length > 0
        ) {
          // Reached capacity for this page
          break;
        }

        currentChunkItems.push(item);
        currentPageHeight += itemHeight;
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
        currentPageHeight = 0;
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

  // Template Selection (Defaults to Art Deco 2-Column Diner format)
  const [selectedTemplate, setSelectedTemplate] = useState<MenuTemplateId>("diner");

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
  const [layoutColumns, setLayoutColumns] = useState<"single" | "double">("double");
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [showDietaryBadges, setShowDietaryBadges] = useState(true);
  const [showItemCodes, setShowItemCodes] = useState(false);
  const [showPrices, setShowPrices] = useState(true);
  const [showPricesWithCurrency, setShowPricesWithCurrency] = useState(true);
  const [onlyActiveItems, setOnlyActiveItems] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

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

  const isTwoColumnLayout = layoutColumns === "double";

  // Multi-Page A4 Pagination: fills pages nicely so quantity of paper is reduced
  const menuPages = useMemo(() => {
    return paginateCategorizedItems(categorizedItems, {
      isTwoColumn: isTwoColumnLayout,
      showDescriptions,
      templateId: selectedTemplate,
    });
  }, [categorizedItems, isTwoColumnLayout, showDescriptions, selectedTemplate]);

  useEffect(() => {
    if (currentPage > menuPages.length) {
      setCurrentPage(Math.max(1, menuPages.length));
    }
  }, [menuPages.length, currentPage]);

  const toggleCategorySelection = (cat: string) => {
    setSelectedCategories((prev) => {
      // If currently all categories are included (prev is empty):
      if (prev.length === 0) {
        // Unchecking cat means keeping all categories except cat
        return allCategories.filter((c) => c !== cat);
      }
      // If cat is already selected in subset, uncheck it:
      if (prev.includes(cat)) {
        return prev.filter((c) => c !== cat);
      }
      // Otherwise add it back:
      const next = [...prev, cat];
      if (next.length === allCategories.length) return [];
      return next;
    });
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = "";
    toast.info("Preparing print layout...");
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 200);
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
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 px-4 py-2 text-[12.5px] font-bold text-primary-foreground shadow-2xs transition cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print Physical Menu
          </button>
        </div>
      </div>

      {/* 2. Menu Design Templates (5 Styles Only) */}
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-0.5">
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

                {/* Menu Layout / Columns Toggle (Paper Saver) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400">
                    Columns Layout & Paper Saver
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLayoutColumns("double")}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition cursor-pointer ${
                        layoutColumns === "double"
                          ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/30"
                          : "border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Columns className="h-4 w-4" />
                      <span>2 Columns</span>
                      <span className="text-[9.5px] font-medium opacity-70">Paper Saver</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLayoutColumns("single")}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition cursor-pointer ${
                        layoutColumns === "single"
                          ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/30"
                          : "border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <LayoutList className="h-4 w-4" />
                      <span>1 Column</span>
                      <span className="text-[9.5px] font-medium opacity-70">Spacious</span>
                    </button>
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

                <div className="flex items-center gap-3 text-xs">
                  {/* Top quick sheet stepper */}
                  {menuPages.length > 1 && (
                    <div className="flex items-center gap-1 bg-slate-100/90 rounded-lg p-0.5 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="p-1 rounded text-slate-600 hover:bg-white disabled:opacity-30 cursor-pointer transition"
                        title="Previous Page"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-1.5 text-[11px] font-bold text-slate-700">
                        {currentPage} / {menuPages.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(menuPages.length, p + 1))}
                        disabled={currentPage >= menuPages.length}
                        className="p-1 rounded text-slate-600 hover:bg-white disabled:opacity-30 cursor-pointer transition"
                        title="Next Page"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
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
                        className={`w-full max-w-[760px] flex-col items-center gap-1.5 print:w-full print:max-w-none ${
                          page.pageNumber === currentPage ? "flex" : "hidden print:flex"
                        }`}
                      >
                        {/* Page Boundary Header (Screen preview only) */}
                        <div className="no-print flex items-center justify-between w-full px-2 text-[11px] font-semibold text-slate-400">
                          <span className="uppercase tracking-wider">A4 Page {page.pageNumber}</span>
                          <span>Sheet {page.pageNumber} of {menuPages.length}</span>
                        </div>

                        {/* Individual A4 Page Sheet (Strict A4 Length & Ratio) */}
                        <div
                          className={`a4-page-sheet w-full max-w-[760px] h-[1075px] min-h-[1075px] max-h-[1075px] rounded-2xl shadow-xl transition-all p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden select-none print:m-0 print:w-full print:max-w-none print:shadow-none print:rounded-none ${
                            selectedTemplate === "diner"
                              ? "bg-[#fcfbf7] text-slate-900 border-4 border-[#0f766e]"
                              : selectedTemplate === "showcase"
                                ? "bg-[#fcfaf7] text-stone-900 border-2 border-stone-300"
                                : selectedTemplate === "royal"
                                  ? "bg-[#fffdf7] text-[#2c1d11] border-6 border-double border-[#b45309]/50"
                                  : selectedTemplate === "modern"
                                    ? "bg-white text-slate-900 border border-slate-300"
                                    : selectedTemplate === "lounge"
                                      ? "bg-[#090d16] text-[#fef3c7] border-2 border-[#d97706]/60 shadow-2xl"
                                      : "bg-white text-slate-900 border border-slate-300"
                          }`}
                        >
                          {/* Art Deco Corner Accents for Diner Template (Screenshot 3) */}
                          {selectedTemplate === "diner" && (
                            <>
                              <div className="absolute inset-2 border border-[#0f766e]/30 pointer-events-none" />
                              <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-[#0f766e] pointer-events-none">
                                <div className="w-2.5 h-2.5 bg-[#0f766e] mt-0.5 ml-0.5" />
                              </div>
                              <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-[#0f766e] pointer-events-none">
                                <div className="w-2.5 h-2.5 bg-[#0f766e] mt-0.5 ml-2" />
                              </div>
                              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-[#0f766e] pointer-events-none">
                                <div className="w-2.5 h-2.5 bg-[#0f766e] mt-2 ml-0.5" />
                              </div>
                              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-[#0f766e] pointer-events-none">
                                <div className="w-2.5 h-2.5 bg-[#0f766e] mt-2 ml-2" />
                              </div>
                            </>
                          )}

                          {/* 1. Header Area */}
                          {isFirstPage ? (
                            /* First Page: Full Header */
                            selectedTemplate === "diner" ? (
                              <div className="text-center pb-2.5 pt-1 space-y-0.5 shrink-0 relative z-10 px-6">
                                <div className="flex items-center justify-center gap-2 text-[#0f766e] text-[11px] font-serif italic tracking-widest">
                                  <span>❖ ❖ ❖ ❖</span>
                                  <span className="font-semibold text-slate-700 not-italic text-[12px] uppercase tracking-wider">
                                    ~ {tagline || "Authentic Kitchen & Lounge"} ~
                                  </span>
                                  <span>❖ ❖ ❖ ❖</span>
                                </div>
                                <h1 className="text-[26px] sm:text-[30px] font-black uppercase tracking-wider text-slate-900 font-serif leading-none py-1">
                                  {restaurantName}
                                </h1>
                                <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-600 font-medium">
                                  {addressLine && <span>{addressLine}</span>}
                                  {addressLine && phoneContact && <span>•</span>}
                                  {phoneContact && <span>Reservations: {phoneContact}</span>}
                                </div>
                              </div>
                            ) : selectedTemplate === "showcase" ? (
                              <div className="text-center pb-2 shrink-0 space-y-1 relative z-10">
                                <div className="flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em] text-stone-500">
                                  <span className="h-px w-8 bg-stone-300" />
                                  <span>{restaurantName}</span>
                                  <span className="h-px w-8 bg-stone-300" />
                                </div>
                                <div className="text-[10px] italic text-stone-500">
                                  {tagline ? `― ${tagline} ―` : "― ESTABLISHED DINING ―"}
                                </div>
                                <h1 className="text-[22px] sm:text-[24px] font-serif font-bold uppercase tracking-wider text-stone-900 leading-tight">
                                  RESTAURANT MENU
                                </h1>
                                <div className="flex flex-wrap items-center justify-center gap-2 text-[9.5px] text-stone-500 font-medium">
                                  {addressLine && <span>{addressLine}</span>}
                                  {addressLine && phoneContact && <span>•</span>}
                                  {phoneContact && <span>Reservations: {phoneContact}</span>}
                                </div>

                                {/* Arched Hero Food Photo (Page 1 Only - Following Screenshot 2) */}
                                <div className="relative w-full h-36 rounded-t-full rounded-b-xl overflow-hidden border border-stone-300/80 shadow-xs my-1 bg-stone-100">
                                  <img
                                    src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=900&auto=format&fit=crop&q=80"
                                    alt="Chef's Specialty Dish"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end justify-center pb-1.5">
                                    <span className="text-[10px] font-serif italic text-amber-100 drop-shadow-sm tracking-wide">
                                      Chef's Handcrafted Signature Selection
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center pb-3 border-b border-current/20 space-y-0.5 shrink-0">
                                {selectedTemplate === "royal" && (
                                  <div className="flex justify-center text-[#b45309] mb-0.5">
                                    <Crown className="h-5 w-5" />
                                  </div>
                                )}

                                <h1
                                  className={`text-[20px] sm:text-[23px] font-extrabold tracking-tight uppercase leading-tight ${
                                    selectedTemplate === "royal"
                                      ? "font-serif text-[#78350f]"
                                      : selectedTemplate === "lounge"
                                        ? "text-[#fbbf24] tracking-widest font-serif"
                                        : "font-sans text-slate-900"
                                  }`}
                                >
                                  {restaurantName}
                                </h1>

                                {tagline && (
                                  <p
                                    className={`text-[11px] sm:text-[11.5px] italic opacity-85 ${
                                      selectedTemplate === "lounge" ? "text-amber-200/90" : ""
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
                            )
                          ) : (
                            /* Subsequent Pages: Slim Running Header */
                            <div className="flex items-center justify-between pb-2 border-b border-current/20 shrink-0 text-xs">
                              <span
                                className={`font-bold tracking-wider uppercase text-[11px] ${
                                  selectedTemplate === "diner"
                                    ? "font-serif text-[#0f766e] font-black"
                                    : selectedTemplate === "royal"
                                      ? "font-serif text-[#92400e]"
                                      : selectedTemplate === "lounge"
                                        ? "text-[#fbbf24] font-serif"
                                        : selectedTemplate === "showcase"
                                          ? "font-serif text-stone-800"
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
                          <div className="flex-1 min-h-0 py-2 overflow-hidden flex flex-col justify-start gap-y-2.5">
                            {page.categories.map((catGroup, catIdx) => (
                              <div
                                key={`${catGroup.category}-${catGroup.isContinuation ? "cont" : "main"}`}
                                className="space-y-1"
                              >
                                {/* Category Heading */}
                                {selectedTemplate === "diner" ? (
                                  /* Art Deco Ribbon Category Header (Screenshot 3) */
                                  <div className="flex items-center justify-center gap-2 py-0.5">
                                    <div className="flex-1 flex items-center">
                                      <span className="text-[#0f766e] font-mono text-[9px] select-none tracking-tighter">⧖⧖</span>
                                      <div className="flex-1 border-t-2 border-[#0f766e] border-b border-[#0f766e]/40 h-[3px]" />
                                      <span className="text-[#0f766e] font-mono text-[9px] select-none">⧖</span>
                                    </div>
                                    <h3 className="font-serif font-black uppercase tracking-[0.25em] text-[#0f766e] text-[12.5px] px-2 text-center">
                                      {catGroup.category} {catGroup.isContinuation ? "(Cont.)" : ""}
                                    </h3>
                                    <div className="flex-1 flex items-center">
                                      <span className="text-[#0f766e] font-mono text-[9px] select-none">⧖</span>
                                      <div className="flex-1 border-t-2 border-[#0f766e] border-b border-[#0f766e]/40 h-[3px]" />
                                      <span className="text-[#0f766e] font-mono text-[9px] select-none tracking-tighter">⧖⧖</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    className={`flex items-center gap-2 pb-0.5 ${
                                      selectedTemplate === "royal"
                                        ? "border-b border-[#b45309]/30 text-center justify-center"
                                        : selectedTemplate === "modern"
                                          ? "border-b-2 border-primary"
                                          : selectedTemplate === "showcase"
                                            ? "border-b border-stone-300 text-stone-900 justify-between"
                                            : selectedTemplate === "lounge"
                                              ? "border-b border-amber-500/40 text-[#f59e0b]"
                                              : "border-b border-slate-300"
                                    }`}
                                  >
                                    <h3
                                      className={`text-[12px] sm:text-[12.5px] font-bold uppercase tracking-wider ${
                                        selectedTemplate === "royal"
                                          ? "font-serif text-[#92400e]"
                                          : selectedTemplate === "modern"
                                            ? "text-primary"
                                            : selectedTemplate === "showcase"
                                              ? "font-serif font-bold text-stone-900"
                                              : selectedTemplate === "lounge"
                                                ? "font-serif text-[#fbbf24]"
                                                : "text-slate-800"
                                      }`}
                                    >
                                      {catGroup.category} {catGroup.isContinuation ? "(Cont.)" : ""}
                                    </h3>
                                    <span className="text-[9.5px] opacity-60">({catGroup.items.length})</span>
                                  </div>
                                )}

                                {/* Items in this category chunk: 2-Column Side-by-Side Grid */}
                                <div
                                  className={
                                    isTwoColumnLayout
                                      ? "grid grid-cols-2 gap-x-6 gap-y-1.5 pt-0.5"
                                      : "space-y-1 pt-0.5"
                                  }
                                >
                                  {catGroup.items.map((item, itemIdx) => {
                                    // In Showcase mode: show a featured food picture ONLY on the first item with an image on each page (Screenshot 2)
                                    const isFeaturedPhotoItem =
                                      selectedTemplate === "showcase" &&
                                      catIdx === 0 &&
                                      itemIdx === 0 &&
                                      item.images &&
                                      item.images.length > 0 &&
                                      item.images[0]?.url;

                                    return (
                                      <div
                                        key={item.id}
                                        className={
                                          isFeaturedPhotoItem
                                            ? "col-span-2 sm:col-span-1 flex items-center gap-2.5 p-1.5 rounded-xl border border-stone-200/90 bg-stone-50/80 shadow-2xs"
                                            : "space-y-0"
                                        }
                                      >
                                        {isFeaturedPhotoItem && (
                                          <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 border border-stone-200 bg-stone-100">
                                            <img
                                              src={item.images[0].url}
                                              alt={item.name}
                                              className="h-full w-full object-cover"
                                              loading="lazy"
                                            />
                                          </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                          {/* Name + Price Line */}
                                          <div className="flex items-baseline justify-between gap-1.5">
                                            <div className="flex items-center gap-1 min-w-0">
                                              <span
                                                className={`text-[12px] font-bold truncate ${
                                                  selectedTemplate === "diner"
                                                    ? "font-serif uppercase font-black text-slate-900"
                                                    : selectedTemplate === "royal"
                                                      ? "font-serif text-[#2c1d11]"
                                                      : selectedTemplate === "lounge"
                                                        ? "text-amber-100"
                                                        : selectedTemplate === "showcase"
                                                          ? "font-serif text-stone-900"
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

                                            {/* Dotted leader line between dish name and price */}
                                            {(selectedTemplate === "royal" ||
                                              selectedTemplate === "diner") && (
                                              <span className="border-b border-dotted border-current/30 flex-1 mx-2 min-w-2 self-center" />
                                            )}

                                            {showPrices && (
                                              <div className="flex items-baseline gap-1 shrink-0 font-bold text-[12px]">
                                                <span
                                                  className={
                                                    selectedTemplate === "showcase"
                                                      ? "text-stone-900 font-extrabold"
                                                      : selectedTemplate === "diner"
                                                        ? "text-slate-900 font-black font-mono"
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
                                              className={`text-[9.5px] leading-tight opacity-75 mt-0.5 ${
                                                selectedTemplate === "diner"
                                                  ? "italic text-slate-600 font-serif"
                                                  : selectedTemplate === "royal"
                                                    ? "italic"
                                                    : selectedTemplate === "showcase"
                                                      ? "line-clamp-2 text-stone-600"
                                                      : ""
                                              }`}
                                            >
                                              {item.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
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

              {/* Interactive Pagination Footer Bar: < 1 2 > */}
              {menuPages.length > 0 && (
                <div className="no-print mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl px-5 py-3 shadow-sm w-full max-w-[760px]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Sheet:</span>
                    <span className="text-xs font-bold text-slate-800">
                      Page {currentPage} of {menuPages.length}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      • {isTwoColumnLayout ? "2 Columns (Paper Saver)" : "1 Column"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Previous Button < */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white cursor-pointer transition shadow-2xs"
                      title="Previous Page"
                      aria-label="Previous Page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {/* Page Numbers: 1 2 3 ... */}
                    <div className="flex items-center gap-1">
                      {menuPages.map((p) => {
                        const isActive = p.pageNumber === currentPage;
                        return (
                          <button
                            key={p.pageNumber}
                            type="button"
                            onClick={() => setCurrentPage(p.pageNumber)}
                            className={`min-w-[32px] h-8 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              isActive
                                ? "bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/30"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            {p.pageNumber}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Button > */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(menuPages.length, p + 1))}
                      disabled={currentPage >= menuPages.length}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white cursor-pointer transition shadow-2xs"
                      title="Next Page"
                      aria-label="Next Page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-400 text-right">
                    All {menuPages.length} {menuPages.length === 1 ? "page" : "pages"} print on Export PDF / Print
                  </div>
                </div>
              )}

              {/* Scoped Print Stylesheet for full A4 coverage without header/footer */}
              <style>{`
                @media print {
                  @page {
                    size: A4 portrait !important;
                    margin: 0 !important;
                  }
                  html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #ffffff !important;
                    width: 210mm !important;
                    min-width: 210mm !important;
                    height: auto !important;
                    overflow: visible !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  aside, header, nav, button, .no-print {
                    display: none !important;
                  }
                  #printable-menu-area {
                    display: block !important;
                    width: 210mm !important;
                    min-width: 210mm !important;
                    max-width: 210mm !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    transform: none !important;
                  }
                  .a4-page-sheet {
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: space-between !important;
                    width: 210mm !important;
                    min-width: 210mm !important;
                    max-width: 210mm !important;
                    height: 297mm !important;
                    min-height: 297mm !important;
                    max-height: 297mm !important;
                    margin: 0 !important;
                    padding: 12mm 15mm 10mm 15mm !important;
                    box-sizing: border-box !important;
                    overflow: hidden !important;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    page-break-after: always !important;
                    break-after: page !important;
                    border-radius: 0 !important;
                    box-shadow: none !important;
                  }
                  .a4-page-sheet:last-of-type,
                  .a4-page-sheet:last-child {
                    page-break-after: auto !important;
                    break-after: auto !important;
                  }
                }
              `}</style>
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
