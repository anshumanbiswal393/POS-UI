import { useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  Calendar,
  Save,
  Plus,
  Copy,
  Edit2,
  FileText,
} from "lucide-react";
import {
  useScheduleItems,
  useScheduleCategories,
  useToggleScheduleItem,
  useAddScheduleItem,
} from "@/hooks/queries/usePosMenu";
import type { ScheduleMenuItem } from "@/types/posMenu";
import { PosDataGrid, type DataGridColumn } from "@/components/ui/data-grid";
import { toast } from "sonner";
import { ColorActionEdit } from "@/components/common/ColorActionIcons";

export function ScheduleItemsTab() {
  const { data: items, isLoading, isFetching } = useScheduleItems();
  const { data: categories } = useScheduleCategories();
  const toggleMutation = useToggleScheduleItem();
  const addMutation = useAddScheduleItem();

  const [selectedCategory, setSelectedCategory] = useState("Veg Soup");
  const [hideEmptyCategories, setHideEmptyCategories] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"normal" | "rank">("normal");
  const [isAvailableGlobal, setIsAvailableGlobal] = useState(true);

  // New item state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("140");

  const categoryNames = categories?.map((c) => c.name) ?? [
    "Veg Soup",
    "Non-Veg Soup",
    "Veg Starters",
    "Non-Veg Starters",
    "Veg Main Course",
    "Non-Veg Main Course",
    "Bread",
  ];

  const filteredItems = useMemo(() => {
    return (items ?? []).filter((item) => {
      if (selectedCategory && item.category !== selectedCategory) return false;
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [items, selectedCategory, searchQuery]);

  const handleDuplicate = (name: string, price: number, isVeg: boolean) => {
    addMutation.mutate(
      {
        name: `${name} (Copy)`,
        category: selectedCategory,
        shortCode: Math.floor(100 + Math.random() * 900),
        indicators: isVeg ? "v+ | O | D" : "nv | O | D",
        onlineDisplayName: `${name} (Copy)`,
        price,
        isVeg,
        available: true,
      },
      {
        onSuccess: () => {
          toast.success(`Duplicated "${name}"`);
        },
      },
    );
  };

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      toast.error("Please enter an item name");
      return;
    }

    addMutation.mutate(
      {
        name: newItemName.trim(),
        category: selectedCategory,
        shortCode: Math.floor(100 + Math.random() * 900),
        indicators: selectedCategory.toLowerCase().includes("non-veg")
          ? "nv | O | D"
          : "v+ | O | D",
        onlineDisplayName: newItemName.trim(),
        price: parseFloat(newItemPrice) || 140,
        isVeg: !selectedCategory.toLowerCase().includes("non-veg"),
        available: true,
      },
      {
        onSuccess: () => {
          toast.success(`Added "${newItemName}" to ${selectedCategory}`);
          setNewItemName("");
          setIsAddingItem(false);
        },
      },
    );
  };

  const columns: DataGridColumn<ScheduleMenuItem>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Name",
        accessorKey: "name",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 180,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span
              className={`h-4 w-1 rounded-full ${
                row.isVeg ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            <span className="font-semibold text-slate-900">{row.name}</span>
          </div>
        ),
      },
      {
        id: "shortCode",
        header: "Short Code",
        accessorKey: "shortCode",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 130,
        cell: ({ row }) => (
          <div className="font-mono text-[12px] text-slate-600">
            {row.indicators && <span className="text-slate-400 mr-2 text-[11px]">{row.indicators}</span>}
            <span className="font-bold text-slate-800">{row.shortCode}</span>
          </div>
        ),
      },
      {
        id: "onlineDisplayName",
        header: "Online Display Name",
        accessorKey: "onlineDisplayName",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 160,
        cell: ({ row }) => (
          <span className="text-slate-600 text-[12.5px]">{row.onlineDisplayName || "—"}</span>
        ),
      },
      {
        id: "price",
        header: "Price",
        accessorKey: "price",
        enableSorting: true,
        enableFiltering: true,
        align: "right",
        minWidth: 100,
        cell: ({ row }) => (
          <span className="font-semibold text-slate-800 font-mono">₹{row.price}</span>
        ),
      },
      {
        id: "description",
        header: "Description",
        accessorKey: "description",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 150,
        cell: ({ row }) => (
          <span className="text-slate-400 text-[12px] truncate block max-w-xs">
            {row.description || "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        minWidth: 110,
        sortable: false,
        filterable: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5 text-slate-400">
            <button
              type="button"
              onClick={() => handleDuplicate(row.name, row.price, row.isVeg)}
              className="p-1 hover:text-teal-600 hover:bg-slate-100 rounded transition cursor-pointer"
              title="Duplicate Item"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => toast.info(`Quick edit opened for ${row.name}`)}
              className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-300 bg-white hover:border-amber-500 hover:bg-amber-50/60 shadow-2xs transition cursor-pointer"
              title="Edit Item"
            >
              <ColorActionEdit className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => toast.info(`Recipe/modifier mapping for ${row.name}`)}
              className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded transition cursor-pointer"
              title="Modifier / Recipe Link"
            >
              <FileText className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [selectedCategory],
  );

  return (
    <div className="space-y-4">
      {/* 1. Yellow Guidance Banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-2.5 text-[13px] text-amber-900 shadow-2xs flex items-center justify-between">
        <span>
          You can make updates to your restaurant's menu anytime and have them go live on the exact
          date and time you desire. ⓘ
        </span>
      </div>

      {/* 2. Main Two-Column Layout (Left Category Rail + Right Items Table) */}
      <div className="flex flex-col md:flex-row items-start gap-4">
        {/* Left Categories Rail */}
        <div className="w-full md:w-64 shrink-0 rounded-xl border border-slate-200 bg-white shadow-xs p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-[13px] font-bold text-slate-800">Categories</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500">Hide empty</span>
              <button
                type="button"
                onClick={() => setHideEmptyCategories(!hideEmptyCategories)}
                className={`relative inline-flex h-4 w-7 items-center rounded-full transition ${
                  hideEmptyCategories ? "bg-teal-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                    hideEmptyCategories ? "translate-x-3.5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-none cursor-pointer"
          >
            {categoryNames.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Vertical Category Links */}
          <div className="space-y-0.5 max-h-[500px] overflow-y-auto">
            {categoryNames.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`relative flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[13px] font-medium transition cursor-pointer text-left ${
                    isSelected
                      ? "text-teal-600 font-bold bg-teal-50/50"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {/* Left blue bar for active category */}
                  {isSelected && (
                    <span className="absolute left-0 top-1 bottom-1 w-1 rounded-r bg-teal-600" />
                  )}
                  <span className="truncate pl-1">{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content / Table Area */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Top Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Action <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              <button
                type="button"
                className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Quick Actions <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => toast.info("Publish Date scheduler opened")}
                className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Publish Date
              </button>

              <button
                type="button"
                onClick={() => toast.success("Draft saved successfully")}
                className="flex items-center gap-1 rounded-lg bg-teal-600 px-4 py-1.5 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                Save Later
              </button>
            </div>
          </div>

          {/* Sub-row Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-[12.5px] text-slate-700 font-medium cursor-pointer">
                <input
                  type="radio"
                  name="viewMode"
                  checked={viewMode === "normal"}
                  onChange={() => setViewMode("normal")}
                  className="h-3.5 w-3.5 text-teal-600"
                />
                Normal
              </label>
              <label className="flex items-center gap-1.5 text-[12.5px] text-slate-700 font-medium cursor-pointer">
                <input
                  type="radio"
                  name="viewMode"
                  checked={viewMode === "rank"}
                  onChange={() => setViewMode("rank")}
                  className="h-3.5 w-3.5 text-teal-600"
                />
                Rank wise
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAddingItem(!isAddingItem)}
                className="flex items-center gap-1 rounded-lg bg-teal-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add Items
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[12.5px] font-medium text-slate-700">Available</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAvailableGlobal(!isAvailableGlobal);
                    toast.info(
                      `Set all items available status to ${!isAvailableGlobal ? "Active" : "Paused"}`,
                    );
                  }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                    isAvailableGlobal ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      isAvailableGlobal ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Add Form Drawer */}
          {isAddingItem && (
            <form
              onSubmit={handleAddItemSubmit}
              className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-blue-900">
                  Add Item to {selectedCategory}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="text-[12px] text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Item name..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[13px] focus:outline-none focus:border-teal-500"
                  autoFocus
                />
                <input
                  type="number"
                  placeholder="Price (₹)..."
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[13px] focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-teal-700 cursor-pointer shadow-2xs"
                >
                  Save Item
                </button>
              </div>
            </form>
          )}

          {/* PosDataGrid with DataTableHeader */}
          <PosDataGrid<ScheduleMenuItem>
            data={filteredItems}
            columns={columns}
            isLoading={isLoading || isFetching}
            enableSelection={true}
            selectedRowIds={selectedIds}
            onSelectionChange={setSelectedIds}
            enablePagination={true}
            pageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
            emptyMessage={`No items found in ${selectedCategory}.`}
          />
        </div>
      </div>
    </div>
  );
}
