import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Search,
  X,
  User,
  CalendarCheck2,
  ShoppingBag,
  UtensilsCrossed,
  Users,
  Armchair,
  Package,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { fuzzyFilter } from "@/utils/fuzzySearch";
import { formatDateIndian } from "@/utils/dateUtils";
import { getPosCustomers, type PosCustomerRecord } from "@/services/posCustomerStore";
import { getAllOrders } from "@/services/posOrdersService";
import { posTablesService } from "@/services/posTablesService";
import { posMenuService } from "@/services/posMenuService";
import { posUsersRbacService, type POSUser } from "@/services/posUsersRbacService";
import { posInventoryService } from "@/services/posInventoryService";
import { useOutletContext } from "@/context/PosOutletContext";
import type { AllOrderItem } from "@/types/posOrders";
import type { ReservationItem, RestaurantTable } from "@/types/posTables";
import type { MenuItem } from "@/types/posMenu";
import type { StockItem } from "@/types/posInventory";

export type GlobalSearchResultType =
  | "order"
  | "reservation"
  | "customer"
  | "menu"
  | "staff"
  | "table"
  | "inventory";

export interface GlobalSearchResult {
  id: string;
  type: GlobalSearchResultType;
  title: string;
  subtitle: string;
  badge: string;
  badgeClass: string;
  extraInfo?: string;
  date?: string;
  route: string;
  searchableText: string;
}

export function PosGlobalSearch({
  id = "pos-global-search",
  isMobile = false,
  className = "",
  onCloseMobile,
}: {
  id?: string;
  isMobile?: boolean;
  className?: string;
  onCloseMobile?: () => void;
}) {
  const navigate = useNavigate();
  const { activeOutlet } = useOutletContext();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Cached data state
  const [orders, setOrders] = useState<AllOrderItem[]>([]);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [customers, setCustomers] = useState<PosCustomerRecord[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [users, setUsers] = useState<POSUser[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [inventoryItems, setInventoryItems] = useState<StockItem[]>([]);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pre-load or lazy-load searchable items on focus
  const loadSearchableData = useCallback(async () => {
    if (hasLoadedData) return;
    try {
      const [ordersRes, resvRes, menuRes, usersRes, tablesRes, stockRes] = await Promise.allSettled([
        getAllOrders(undefined, activeOutlet?.id),
        posTablesService.getReservations(activeOutlet?.id),
        posMenuService.getMenuItems(activeOutlet?.id),
        posUsersRbacService.getUsers(),
        posTablesService.getTables(activeOutlet?.id),
        posInventoryService.getStockItems(activeOutlet?.id),
      ]);

      if (ordersRes.status === "fulfilled" && ordersRes.value?.records) {
        setOrders(ordersRes.value.records);
      }
      if (resvRes.status === "fulfilled" && Array.isArray(resvRes.value)) {
        setReservations(resvRes.value);
      }
      if (menuRes.status === "fulfilled" && Array.isArray(menuRes.value)) {
        setMenuItems(menuRes.value);
      }
      if (usersRes.status === "fulfilled" && Array.isArray(usersRes.value)) {
        setUsers(usersRes.value);
      }
      if (tablesRes.status === "fulfilled" && Array.isArray(tablesRes.value)) {
        setTables(tablesRes.value);
      }
      if (stockRes.status === "fulfilled" && Array.isArray(stockRes.value)) {
        setInventoryItems(stockRes.value);
      }
      setCustomers(getPosCustomers(activeOutlet?.id));
      setHasLoadedData(true);
    } catch {
      // Ignore background load failures gracefully
    }
  }, [hasLoadedData, activeOutlet?.id]);

  // Transform all entities into unified search results
  const allSearchableItems: GlobalSearchResult[] = useMemo(() => {
    const list: GlobalSearchResult[] = [];

    // 1. Orders
    for (const ord of orders) {
      const formattedDate = ord.createdAt ? formatDateIndian(ord.createdAt) : "";
      list.push({
        id: `order-${ord.id || ord.orderNo}`,
        type: "order",
        title: `Order #${ord.orderNo}`,
        subtitle: `${ord.customerName || "Walk-in Guest"} · ${ord.orderTypeDisplay || "Order"} · ${ord.grandTotalFormatted || "₹0"}`,
        badge: ord.status || "Order",
        badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
        date: formattedDate,
        extraInfo: ord.itemsSummary || ord.assignTo,
        route: "/pos/orders",
        searchableText: `${ord.orderNo} ${ord.customerName} ${ord.customerPhone || ""} ${ord.itemsSummary || ""} ${ord.status} ${ord.orderTypeDisplay} ${formattedDate}`,
      });
    }

    // 2. Reservations
    for (const res of reservations) {
      const formattedDate = res.reservationDate ? formatDateIndian(res.reservationDate) : "Today";
      list.push({
        id: `res-${res.id}`,
        type: "reservation",
        title: `${res.customerName} (Reservation)`,
        subtitle: `${res.tableNumber ? `Table ${res.tableNumber}` : "Reserved"} · ${res.guests || 2} Pax · ${res.reservationTime || ""}`,
        badge: res.status || "Reserved",
        badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
        date: formattedDate,
        extraInfo: res.customerPhone || res.notes,
        route: "/pos/reservations",
        searchableText: `${res.customerName} ${res.customerPhone || ""} ${res.tableNumber || ""} ${res.notes || ""} ${formattedDate} ${res.reservationTime || ""}`,
      });
    }

    // 3. Customers
    for (const cust of customers) {
      list.push({
        id: `cust-${cust.id}`,
        type: "customer",
        title: cust.name,
        subtitle: `${cust.phone || ""} ${cust.email ? `· ${cust.email}` : ""} · Tier: ${cust.tier}`,
        badge: "Guest",
        badgeClass: "bg-sky-100 text-sky-900 border-sky-300",
        extraInfo: `Visits: ${cust.visitCount || 1} · Points: ${cust.loyaltyPoints || 0}`,
        route: "/pos/orders",
        searchableText: `${cust.name} ${cust.phone || ""} ${cust.email || ""} ${cust.tier || ""} ${cust.address || ""}`,
      });
    }

    // 4. Menu Items
    for (const item of menuItems) {
      list.push({
        id: `menu-${item.id}`,
        type: "menu",
        title: item.name,
        subtitle: `${item.category || "General"} ${item.subCategory ? `· ${item.subCategory}` : ""} · ₹${item.price || 0}`,
        badge: item.code ? `Code: ${item.code}` : "Menu Item",
        badgeClass: "bg-purple-100 text-purple-900 border-purple-300",
        extraInfo: item.description,
        route: "/pos/menu",
        searchableText: `${item.name} ${item.code || ""} ${item.category || ""} ${item.subCategory || ""} ${item.description || ""}`,
      });
    }

    // 5. Staff / Users
    for (const u of users) {
      list.push({
        id: `staff-${u.id}`,
        type: "staff",
        title: u.name,
        subtitle: `${u.role_name || u.role} · ${u.username} ${u.email ? `· ${u.email}` : ""}`,
        badge: u.is_active ? "Active Staff" : "Inactive",
        badgeClass: "bg-teal-100 text-teal-900 border-teal-300",
        extraInfo: u.phone,
        route: "/pos/management/users",
        searchableText: `${u.name} ${u.username} ${u.email || ""} ${u.phone || ""} ${u.role_name || u.role}`,
      });
    }

    // 6. Tables
    for (const tbl of tables) {
      list.push({
        id: `table-${tbl.id}`,
        type: "table",
        title: `Table ${tbl.tableNumber}`,
        subtitle: `${tbl.area || "Main Area"} · Capacity: ${tbl.capacity || 4} Guests`,
        badge: tbl.status || "Table",
        badgeClass: "bg-indigo-100 text-indigo-900 border-indigo-300",
        route: "/pos/tables",
        searchableText: `Table ${tbl.tableNumber} ${tbl.area || ""} ${tbl.status || ""}`,
      });
    }

    // 7. Inventory Items
    for (const stock of inventoryItems) {
      list.push({
        id: `inv-${stock.id}`,
        type: "inventory",
        title: stock.rawMaterial || stock.name || "Raw Material",
        subtitle: `${stock.category || "General"} · Stock: ${stock.availableStock ?? 0} ${stock.unit || "Units"}`,
        badge: stock.sku ? `SKU: ${stock.sku}` : "Stock Item",
        badgeClass: "bg-rose-100 text-rose-900 border-rose-300",
        route: "/pos/inventory",
        searchableText: `${stock.rawMaterial || stock.name || ""} ${stock.sku || stock.code || ""} ${stock.category || ""}`,
      });
    }

    return list;
  }, [orders, reservations, customers, menuItems, users, tables, inventoryItems]);

  // Execute multi-field fuzzy search
  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    const matched = fuzzyFilter(allSearchableItems, query, [
      (item) => item.searchableText,
      (item) => item.title,
      (item) => item.subtitle,
      (item) => item.extraInfo || "",
      (item) => item.date || "",
    ]);
    return matched.slice(0, 12);
  }, [allSearchableItems, query]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectResult = (result: GlobalSearchResult) => {
    setIsOpen(false);
    setQuery("");
    onCloseMobile?.();
    navigate({ to: result.route as any });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
      inputRef.current?.blur();
      onCloseMobile?.();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (filteredResults.length ? (prev + 1) % filteredResults.length : 0));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        filteredResults.length ? (prev - 1 + filteredResults.length) % filteredResults.length : 0
      );
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredResults.length > 0) {
        handleSelectResult(filteredResults[activeIndex] || filteredResults[0]);
      }
    }
  };

  const renderIcon = (type: GlobalSearchResultType) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="h-4 w-4 text-emerald-700" />;
      case "reservation":
        return <CalendarCheck2 className="h-4 w-4 text-amber-700" />;
      case "customer":
        return <User className="h-4 w-4 text-sky-700" />;
      case "menu":
        return <UtensilsCrossed className="h-4 w-4 text-purple-700" />;
      case "staff":
        return <Users className="h-4 w-4 text-teal-700" />;
      case "table":
        return <Armchair className="h-4 w-4 text-indigo-700" />;
      case "inventory":
        return <Package className="h-4 w-4 text-rose-700" />;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/60" />
        <input
          ref={inputRef}
          id={id}
          data-pos-search
          type="text"
          value={query}
          onFocus={() => {
            loadSearchableData();
            setIsOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search orders, guests, menu, tables, staff... (F3)"
          aria-label="Global POS search across orders, guests, reservations, menu, inventory"
          className="h-9 w-full rounded-md border border-black bg-white pl-9 pr-14 text-[12.5px] font-medium text-foreground placeholder:text-foreground/60 focus:border-primary focus:bg-white focus:outline-hidden transition-all shadow-2xs"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveIndex(0);
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-foreground/60 hover:text-foreground transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : !isMobile ? (
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden xl:inline-flex items-center rounded border border-black bg-surface px-1.5 py-0.5 text-[9.5px] font-bold text-foreground/70">
            F3 / ⌘K
          </kbd>
        ) : null}
      </div>

      {/* Global Search Results Dropdown Overlay */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-[75vh] sm:max-h-[460px] overflow-y-auto rounded-xl border-2 border-black bg-white shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="p-2 border-b-2 border-black bg-surface flex items-center justify-between text-[11px] font-bold text-foreground/70">
            <span>Search Results ({filteredResults.length})</span>
            <span className="text-[10px] text-foreground/60">Press Enter to select · Esc to close</span>
          </div>

          {filteredResults.length === 0 ? (
            <div className="p-6 text-center text-foreground">
              <Search className="h-7 w-7 text-primary mx-auto mb-2 opacity-50" />
              <p className="font-bold text-[13px] text-foreground">No matches found for &quot;{query}&quot;</p>
              <p className="text-[11.5px] text-foreground/70 mt-0.5">
                Try searching by guest name, phone, order number, table, or menu dish.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60 py-1">
              {filteredResults.map((result, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <li
                    key={result.id}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => handleSelectResult(result)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary-tint/30 text-foreground"
                        : "hover:bg-primary-tint/20 text-foreground"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface border border-border">
                      {renderIcon(result.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[13px] text-foreground truncate">
                          {result.title}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9.5px] font-bold uppercase tracking-wider border ${result.badgeClass}`}
                        >
                          {result.badge}
                        </span>
                        {result.date && (
                          <span className="ml-auto font-mono text-[10.5px] font-bold text-primary shrink-0">
                            {result.date}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11.5px] text-foreground/80 truncate mt-0.5">
                        <span className="truncate">{result.subtitle}</span>
                        {result.extraInfo && (
                          <>
                            <span className="text-foreground/40">·</span>
                            <span className="truncate text-foreground/70 text-[10.5px]">
                              {result.extraInfo}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 shrink-0 text-foreground/50" />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default PosGlobalSearch;

