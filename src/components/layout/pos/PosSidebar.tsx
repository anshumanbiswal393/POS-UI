import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, ChevronRight, Plus, Store } from "lucide-react";
import {
  POS_NAV_ITEMS,
  POS_FOOTER_NAV_ITEMS,
  type PosNavChild,
  type PosNavItem,
} from "@/app/navigation/pos-nav-config";
import { RetrodLogo } from "@/components/common";
import { cn } from "@/lib/utils";
import { useOutletContext } from "@/context/PosOutletContext";
import { isDiningOutlet } from "@/utils/outletKind";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ALL_NAV_LINKS: string[] = [];
function collectLinks(items: Array<{ to?: string; children?: PosNavChild[] }>) {
  for (const item of items) {
    if (item.to) ALL_NAV_LINKS.push(item.to);
    if (item.children?.length) collectLinks(item.children);
  }
}
collectLinks(POS_NAV_ITEMS);
collectLinks(POS_FOOTER_NAV_ITEMS);

type NavNode = PosNavItem | PosNavChild;

const { siblingsMap, descendantsMap } = (() => {
  const siblingsMap = new Map<string, string[]>();
  const descendantsMap = new Map<string, string[]>();

  function collectDescendants(node: NavNode): string[] {
    const list: string[] = [];
    if (node.children?.length) {
      for (const child of node.children) {
        if (child.children?.length) {
          list.push(child.id);
          list.push(...collectDescendants(child));
        }
      }
    }
    return list;
  }

  function traverse(nodes: NavNode[]) {
    const expandableInThisLevel = nodes
      .filter((n) => Boolean(n.children?.length))
      .map((n) => n.id);

    for (const node of nodes) {
      if (node.children?.length) {
        siblingsMap.set(
          node.id,
          expandableInThisLevel.filter((id) => id !== node.id),
        );
        descendantsMap.set(node.id, collectDescendants(node));
        traverse(node.children);
      }
    }
  }

  traverse(POS_NAV_ITEMS);
  return { siblingsMap, descendantsMap };
})();

export function PosSidebar({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeLinkRef = useRef<HTMLAnchorElement | null>(null);
  const { activeOutlet, outlets, setActiveOutlet } = useOutletContext();
  const diningOutlets = outlets.filter(isDiningOutlet);
  const availableOutlets = diningOutlets.length > 0 ? diningOutlets : outlets;

  const collectOpenGroups = (path: string) => {
    const initial: Record<string, boolean> = {};
    const markOpen = (nodes: PosNavChild[] | PosNavItem[], parentId?: string) => {
      for (const node of nodes) {
        const activeHere =
          Boolean(node.to) && (path === node.to || path.startsWith(`${node.to}/`));
        if (activeHere && parentId) initial[parentId] = true;
        if (node.children?.length) {
          markOpen(node.children, node.id);
          if (initial[node.id] && parentId) initial[parentId] = true;
        }
      }
    };
    markOpen(POS_NAV_ITEMS);
    return initial;
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    collectOpenGroups(pathname),
  );

  useEffect(() => {
    setOpenGroups(collectOpenGroups(pathname));
  }, [pathname]);

  useEffect(() => {
    activeLinkRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname, openGroups]);

  const isLinkActive = (to?: string) => {
    if (!to || !pathname) return false;
    if (pathname === to || pathname === `${to}/`) return true;
    if (pathname.startsWith(`${to}/`)) {
      const hasMoreSpecific = ALL_NAV_LINKS.some(
        (other) =>
          other !== to &&
          other.length > to.length &&
          (pathname === other || pathname.startsWith(`${other}/`)),
      );
      return !hasMoreSpecific;
    }
    return false;
  };

  const isActive = (to: string, exact?: boolean) => {
    if (!pathname) return false;
    if (exact) return pathname === to || pathname === `${to}/`;
    return pathname === to || pathname.startsWith(`${to}/`);
  };

  const isNodeActive = (node: { to?: string; children?: PosNavChild[] }): boolean => {
    if (node.to && isLinkActive(node.to)) return true;
    return Boolean(node.children?.some((c) => isNodeActive(c)));
  };

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const willOpen = !prev[id];
      const next = { ...prev };

      if (!willOpen) {
        next[id] = false;
        const descendants = descendantsMap.get(id) || [];
        for (const descId of descendants) {
          next[descId] = false;
        }
        return next;
      }

      next[id] = true;

      // Close all same-lined (sibling) folders and their descendants
      const siblings = siblingsMap.get(id) || [];
      for (const sibId of siblings) {
        next[sibId] = false;
        const sibDescendants = descendantsMap.get(sibId) || [];
        for (const descId of sibDescendants) {
          next[descId] = false;
        }
      }

      return next;
    });
  };

  const renderNode = (node: PosNavChild, depth: number): ReactNode => {
    const expanded = Boolean(openGroups[node.id]);
    const ItemIcon = node.icon;

    if (node.children?.length) {
      return (
        <div key={node.id}>
          <button
            type="button"
            onClick={() => toggleGroup(node.id)}
            className={cn(
              "flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-md font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-hover",
              depth === 0 ? "px-3 py-2 text-[13.5px]" : "px-2.5 py-1.5 text-[13px]",
            )}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              {ItemIcon ? <ItemIcon className="h-[18px] w-[18px] shrink-0 stroke-[1.5]" /> : null}
              <span className="truncate">{node.label}</span>
            </span>
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-sidebar-muted transition-transform",
                expanded && "rotate-90",
              )}
            />
          </button>
          {expanded && (
            <div className={cn("mt-0.5 space-y-0.5", depth === 0 ? "pl-[30px]" : "pl-3.5")}>
              {node.children.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    if (!node.to) return null;
    const active = isLinkActive(node.to);

    return (
      <Link
        key={node.id}
        ref={active ? activeLinkRef : undefined}
        to={node.to}
        onClick={onNavigate}
        activeOptions={{ exact: true }}
        className={cn(
          "flex items-center gap-2.5 rounded-md font-medium transition-colors",
          depth === 0 ? "px-3 py-2 text-[13.5px]" : "px-2.5 py-1.5 text-[13px]",
          active
            ? "bg-primary font-semibold text-primary-foreground shadow-xs"
            : "text-sidebar-foreground hover:bg-sidebar-hover",
        )}
      >
        {ItemIcon ? (
          <ItemIcon
            className={cn(
              "h-[18px] w-[18px] shrink-0 stroke-[1.5]",
              !active && "text-sidebar-foreground",
            )}
          />
        ) : null}
        <span className="truncate">{node.label}</span>
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-[68px]" : "w-[240px]",
      )}
    >
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-4">
        {!collapsed ? (
          <div className="flex min-w-0 items-center gap-2">
            <Link
              to="/pos"
              onClick={onNavigate}
              className="flex min-w-0 cursor-pointer items-center py-1 transition-opacity hover:opacity-90"
              title="Go to POS Dashboard"
            >
              <RetrodLogo variant="dark" size="md" />
            </Link>
            <span className="label-uppercase shrink-0 text-[9px] !text-sidebar-muted">POS</span>
          </div>
        ) : (
          <Link
            to="/pos"
            onClick={onNavigate}
            title="Go to POS Dashboard"
            className="mx-auto flex cursor-pointer items-center justify-center transition-transform hover:scale-105"
          >
            <RetrodLogo collapsed variant="dark" />
          </Link>
        )}
      </div>

      {/* Outlet Switcher — same as PMS property switcher */}
      {!collapsed ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="mx-3 mt-3 flex items-center justify-between rounded-lg border border-sidebar-border bg-sidebar-hover/40 px-3 py-2 text-left transition hover:bg-sidebar-hover outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              title={`Active: ${activeOutlet?.name || "Choose Outlet"}`}
            >
              <div className="min-w-0 flex-1 pr-1">
                <div className="truncate text-[13px] font-semibold text-sidebar-foreground">
                  {activeOutlet?.name || "Choose Outlet"}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-sidebar-muted">
                  <span className="truncate">
                    {activeOutlet?.city || activeOutlet?.cuisine || "Dine-In"}
                  </span>
                  <span className="opacity-50">·</span>
                  <span className="shrink-0">
                    {activeOutlet?.type === "Virtual Outlet" ? "Virtual" : "Primary"}
                  </span>
                  <span className="opacity-50">·</span>
                  <span className="shrink-0">
                    {availableOutlets.length} {availableOutlets.length === 1 ? "outlet" : "outlets"}
                  </span>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-sidebar-muted" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[216px]" align="start">
            <DropdownMenuLabel className="text-xs text-sidebar-muted">Select Outlet</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
              {availableOutlets.map((outlet) => {
                const isSelected = activeOutlet?.id === outlet.id;
                return (
                  <DropdownMenuItem
                    key={outlet.id}
                    onClick={() => {
                      setActiveOutlet(outlet.id);
                      onNavigate?.();
                    }}
                    className="flex items-center justify-between cursor-pointer py-2"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                      <span className="text-[13px] font-medium truncate">{outlet.name}</span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {outlet.cuisine || outlet.type}
                      </span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                to="/pos/management/configuration/outlet/list"
                onClick={onNavigate}
                className="flex items-center cursor-pointer text-sidebar-muted focus:text-sidebar-foreground py-1.5"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="text-[13px] font-medium">Add New Outlet</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="pt-3 flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-hover/40 text-sidebar-foreground transition hover:bg-sidebar-hover outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                title={`Active: ${activeOutlet?.name || "Choose Outlet"}`}
              >
                <Store className="h-4 w-4 text-primary" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-[240px]">
              <DropdownMenuLabel className="text-xs text-sidebar-muted">Select Outlet</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
                {availableOutlets.map((outlet) => {
                  const isSelected = activeOutlet?.id === outlet.id;
                  return (
                    <DropdownMenuItem
                      key={outlet.id}
                      onClick={() => {
                        setActiveOutlet(outlet.id);
                        onNavigate?.();
                      }}
                      className="flex items-center justify-between cursor-pointer py-2"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                        <span className="text-[13px] font-medium truncate">{outlet.name}</span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {outlet.cuisine || outlet.type}
                        </span>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  to="/pos/management/configuration/outlet/list"
                  onClick={onNavigate}
                  className="flex items-center cursor-pointer text-sidebar-muted focus:text-sidebar-foreground py-1.5"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="text-[13px] font-medium">Add New Outlet</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <nav className="mt-2 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3 scrollbar-thin" aria-label="POS navigation">
        {POS_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const hasChildren = Boolean(item.children?.length);
          const groupOpen = Boolean(openGroups[item.id]);
          const activeLeaf = !hasChildren && isActive(item.to, item.exact);

          if (collapsed) {
            const collapsedActive = hasChildren ? isNodeActive(item) : activeLeaf;
            return (
              <Link
                key={item.id}
                to={item.to}
                onClick={onNavigate}
                title={item.label}
                className={cn(
                  "flex items-center justify-center rounded-md px-2 py-2.5 transition-colors",
                  collapsedActive
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-hover",
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0 stroke-[1.5]" />
              </Link>
            );
          }

          if (hasChildren) {
            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(item.id)}
                  className="flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-md px-3 py-2 text-[13.5px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-hover"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Icon className="h-[18px] w-[18px] shrink-0 stroke-[1.5]" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <ChevronRight
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 text-sidebar-muted transition-transform",
                      groupOpen && "rotate-90",
                    )}
                  />
                </button>
                {groupOpen && (
                  <div className="mt-0.5 space-y-0.5 pl-[30px]">
                    {item.children!.map((child) => renderNode(child, 1))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.id}
              ref={activeLeaf ? activeLinkRef : undefined}
              to={item.to}
              onClick={onNavigate}
              activeOptions={{ exact: Boolean(item.exact) }}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors",
                activeLeaf
                  ? "bg-primary font-semibold text-primary-foreground shadow-xs"
                  : "text-sidebar-foreground hover:bg-sidebar-hover",
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 stroke-[1.5]",
                  !activeLeaf && "text-sidebar-foreground",
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-0.5 border-t border-sidebar-border p-2">
        {POS_FOOTER_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link
              key={item.id}
              ref={active ? activeLinkRef : undefined}
              to={item.to}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors",
                active
                  ? "bg-primary font-semibold text-primary-foreground shadow-xs"
                  : "text-sidebar-foreground hover:bg-sidebar-hover",
                collapsed && "justify-center px-2",
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 stroke-[1.5]",
                  !active && "text-sidebar-foreground",
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
