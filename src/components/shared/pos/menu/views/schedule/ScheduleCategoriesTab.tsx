import { useState, useMemo } from "react";
import {
  Plus,
  ChevronDown,
  Upload,
  Edit2,
  Copy,
} from "lucide-react";
import { useScheduleCategories, useAddScheduleCategory } from "@/hooks/queries/usePosMenu";
import type { ScheduleCategoryItem } from "@/types/posMenu";
import { PosDataGrid, type DataGridColumn } from "@/components/ui/data-grid";
import { toast } from "sonner";
import { ColorActionEdit } from "@/components/common/ColorActionIcons";
import { formatDateTimeIndian } from "@/utils/dateUtils";

export function ScheduleCategoriesTab() {
  const { data: categories, isLoading, isFetching } = useScheduleCategories();
  const addMutation = useAddScheduleCategory();

  const [activeSubTab, setActiveSubTab] = useState<
    "Parent Category" | "Category" | "Grouping" | "Menu Configuration" | "Tags"
  >("Category");

  const [categoryNameFilter, setCategoryNameFilter] = useState("");
  const [groupCategoryFilter, setGroupCategoryFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newParentCat, setNewParentCat] = useState("Soup & Starters");
  const [pageSize, setPageSize] = useState(10);

  const filteredCategories = useMemo(() => {
    return (categories ?? []).filter((cat) => {
      if (categoryNameFilter && !cat.name.toLowerCase().includes(categoryNameFilter.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [categories, categoryNameFilter]);

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    addMutation.mutate(
      { name: newCatName.trim(), parentCategory: newParentCat },
      {
        onSuccess: () => {
          toast.success(`Category "${newCatName}" created`);
          setNewCatName("");
          setIsAdding(false);
        },
      },
    );
  };

  const columns: DataGridColumn<ScheduleCategoryItem>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Name",
        accessorKey: "name",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 200,
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-slate-900">{row.name}</div>
            {row.parentCategory && (
              <div className="text-[11px] text-slate-400">
                [Parent Category : {row.parentCategory}]
              </div>
            )}
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
          <span className="text-slate-600 text-[12.5px]">{row.onlineDisplayName ?? "—"}</span>
        ),
      },
      {
        id: "rank",
        header: "Rank",
        accessorKey: "rank",
        enableSorting: true,
        enableFiltering: true,
        align: "center",
        minWidth: 80,
        cell: ({ row }) => (
          <span className="font-semibold text-slate-700">{row.rank}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        enableFiltering: true,
        align: "center",
        minWidth: 100,
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
            {row.status}
          </span>
        ),
      },
      {
        id: "createdAt",
        header: "Created",
        accessorKey: "createdAt",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 150,
        cell: ({ row }) => (
          <span className="text-slate-600 font-medium text-[11.5px]">
            {formatDateTimeIndian(row.createdAt)}
          </span>
        ),
      },
      {
        id: "modifiedAt",
        header: "Modified",
        accessorKey: "modifiedAt",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 150,
        cell: ({ row }) => (
          <span className="text-slate-600 font-medium text-[11.5px]">
            {formatDateTimeIndian(row.modifiedAt)}
          </span>
        ),
      },
      {
        id: "image",
        header: "Image",
        align: "center",
        minWidth: 80,
        sortable: false,
        filterable: false,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => toast.info(`Image uploader opened for ${row.name}`)}
            className="p-1 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded transition cursor-pointer"
            title="Upload Category Image"
          >
            <Upload className="h-3.5 w-3.5" />
          </button>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        minWidth: 100,
        sortable: false,
        filterable: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => toast.info(`Editing category ${row.name}`)}
              className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-300 bg-white hover:border-amber-500 hover:bg-amber-50/60 shadow-2xs transition cursor-pointer"
              title="Edit Category"
            >
              <ColorActionEdit className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => toast.success(`Duplicated category ${row.name}`)}
              className="flex items-center justify-center h-7 w-7 rounded-lg border border-slate-300 bg-white hover:border-teal-500 hover:bg-teal-50/60 shadow-2xs transition cursor-pointer text-slate-500"
              title="Duplicate"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      {/* 1. Header and Actions from Screenshot 2 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-slate-500">Menu</span>
          <span className="text-[13px] text-slate-400">›</span>
          <span className="text-[14px] font-bold text-slate-900">Category Management</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white shadow-2xs hover:bg-teal-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Action <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Bulk Update <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 2. Sub Tabs from Screenshot 2 */}
      <div className="flex flex-wrap border-b border-slate-200">
        {(
          [
            "Parent Category",
            "Category",
            "Grouping",
            "Menu Configuration",
            "Tags",
          ] as const
        ).map((tab) => {
          const isActive = activeSubTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveSubTab(tab)}
              className={`border-b-2 px-4 py-2 text-[13px] font-bold transition cursor-pointer ${
                isActive
                  ? "border-teal-600 text-teal-700 font-bold"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Quick Add Category Drawer */}
      {isAdding && (
        <form
          onSubmit={handleAddCategorySubmit}
          className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-teal-900">Add New Category</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-[12px] text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Category name..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[13px] focus:outline-hidden focus:border-teal-500"
              autoFocus
            />
            <input
              type="text"
              placeholder="Parent Category (optional)..."
              value={newParentCat}
              onChange={(e) => setNewParentCat(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[13px] focus:outline-hidden focus:border-teal-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-teal-700 cursor-pointer shadow-2xs"
            >
              Save Category
            </button>
          </div>
        </form>
      )}

      {/* 3. Filter Bar from Screenshot 2 */}
      <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11.5px] font-medium text-slate-600 mb-1">
              Category Name
            </label>
            <input
              type="text"
              placeholder="Category Name..."
              value={categoryNameFilter}
              onChange={(e) => setCategoryNameFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11.5px] font-medium text-slate-600 mb-1">
              Group Category
            </label>
            <select
              value={groupCategoryFilter}
              onChange={(e) => setGroupCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-hidden cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Soup & Starters">Soup & Starters</option>
              <option value="Main Course">Main Course</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => toast.info(`Found ${filteredCategories.length} categories`)}
            className="rounded-lg border border-teal-600 bg-white px-4 py-1.5 text-[12.5px] font-medium text-teal-600 hover:bg-teal-50 transition cursor-pointer"
          >
            Search
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoryNameFilter("");
              setGroupCategoryFilter("All");
              toast.info("Showing all categories");
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Show All
          </button>

          <button
            type="button"
            onClick={() => toast.info("Category rank order updated")}
            className="rounded-lg border border-teal-600 bg-teal-50/60 px-4 py-1.5 text-[12.5px] font-semibold text-teal-700 hover:bg-teal-100 transition cursor-pointer"
          >
            Update Rank
          </button>
        </div>

        <div className="text-[11.5px] text-slate-400 mt-2">
          Note: Please arrange category sequence/rank from the category section using import/export
          sheet.
        </div>
      </div>

      {/* 4. PosDataGrid with DataTableHeader */}
      <PosDataGrid<ScheduleCategoryItem>
        data={filteredCategories}
        columns={columns}
        isLoading={isLoading || isFetching}
        enableSelection={true}
        selectedRowIds={selectedIds}
        onSelectionChange={setSelectedIds}
        enablePagination={true}
        pageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage="No categories found matching filters."
      />
    </div>
  );
}
