import { useState, useMemo } from "react";
import {
  Plus,
  ChevronDown,
  Upload,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import { PosDataGrid, type DataGridColumn } from "@/components/ui/data-grid";
import { ExportToExcelButton } from "@/components/ui/ExportToExcelButton";
import { toast } from "sonner";

interface AddonGroupItem {
  id: string;
  name: string;
  dept: string;
  minSelect: number;
  maxSelect: number;
  itemsCount: number;
}

export function ScheduleAddonsTab() {
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [addonNameFilter, setAddonNameFilter] = useState("");
  const [deptSelect, setDeptSelect] = useState("All");

  const [addonGroups, setAddonGroups] = useState<AddonGroupItem[]>([
    {
      id: "ag-1",
      name: "Choice of Crust",
      dept: "Kitchen",
      minSelect: 1,
      maxSelect: 1,
      itemsCount: 4,
    },
    {
      id: "ag-2",
      name: "Extra Cheese & Dips",
      dept: "Kitchen",
      minSelect: 0,
      maxSelect: 3,
      itemsCount: 5,
    },
    {
      id: "ag-3",
      name: "Beverage Flavour",
      dept: "Bar",
      minSelect: 1,
      maxSelect: 1,
      itemsCount: 3,
    },
  ]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDept, setNewGroupDept] = useState("Kitchen");
  const [pageSize, setPageSize] = useState(10);

  const filteredGroups = useMemo(() => {
    return addonGroups.filter((g) => {
      if (departmentFilter && !g.dept.toLowerCase().includes(departmentFilter.toLowerCase())) {
        return false;
      }
      if (addonNameFilter && !g.name.toLowerCase().includes(addonNameFilter.toLowerCase())) {
        return false;
      }
      if (deptSelect !== "All" && g.dept !== deptSelect) {
        return false;
      }
      return true;
    });
  }, [addonGroups, departmentFilter, addonNameFilter, deptSelect]);

  const handleAddGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error("Please enter an addon group name");
      return;
    }

    const newGroup: AddonGroupItem = {
      id: `ag-${Date.now()}`,
      name: newGroupName.trim(),
      dept: newGroupDept,
      minSelect: 0,
      maxSelect: 3,
      itemsCount: 4,
    };
    setAddonGroups([newGroup, ...addonGroups]);
    toast.success(`Created addon group "${newGroupName}"`);
    setNewGroupName("");
    setIsAddingGroup(false);
  };

  const handleDeleteGroup = (id: string, name: string) => {
    setAddonGroups(addonGroups.filter((g) => g.id !== id));
    toast.success(`Removed addon group "${name}"`);
  };

  const columns: DataGridColumn<AddonGroupItem>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Addon Group Name",
        accessorKey: "name",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 180,
        cell: ({ row }) => <span className="font-bold text-slate-900">{row.name}</span>,
      },
      {
        id: "dept",
        header: "Department",
        accessorKey: "dept",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 140,
        cell: ({ row }) => (
          <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-800 border border-teal-200">
            {row.dept}
          </span>
        ),
      },
      {
        id: "minSelect",
        header: "Min Select",
        accessorKey: "minSelect",
        enableSorting: true,
        enableFiltering: true,
        align: "center",
        minWidth: 100,
        cell: ({ row }) => <span className="text-slate-700 font-medium">{row.minSelect}</span>,
      },
      {
        id: "maxSelect",
        header: "Max Select",
        accessorKey: "maxSelect",
        enableSorting: true,
        enableFiltering: true,
        align: "center",
        minWidth: 100,
        cell: ({ row }) => <span className="text-slate-700 font-medium">{row.maxSelect}</span>,
      },
      {
        id: "itemsCount",
        header: "Modifiers Count",
        accessorKey: "itemsCount",
        enableSorting: true,
        enableFiltering: true,
        align: "center",
        minWidth: 130,
        cell: ({ row }) => (
          <span className="font-semibold text-slate-800">{row.itemsCount} modifiers</span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        minWidth: 120,
        sortable: false,
        filterable: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5 text-slate-400">
            <button
              type="button"
              onClick={() => toast.info(`Configuring items for ${row.name}`)}
              className="p-1 hover:text-teal-600 hover:bg-slate-100 rounded transition cursor-pointer"
              title="Edit Modifiers"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteGroup(row.id, row.name)}
              className="p-1 hover:text-red-600 hover:bg-slate-100 rounded transition cursor-pointer"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [addonGroups],
  );

  return (
    <div className="space-y-4">
      {/* 1. Header and Actions from Screenshot 4 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-slate-500">Menu</span>
          <span className="text-[13px] text-slate-400">›</span>
          <span className="text-[14px] font-bold text-slate-900">Addon Management</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddingGroup(true)}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white shadow-xs hover:bg-teal-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add New Addon Group
          </button>
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Action <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
          <ExportToExcelButton
            onClick={() => toast.success("Exporting addons Excel sheet...")}
          />
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5 text-slate-500" />
            Import Excel <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 2. Filter Bar from Screenshot 4 */}
      <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 items-end">
          <div className="lg:col-span-2">
            <label className="block text-[11.5px] font-medium text-slate-600 mb-1">
              Department Name
            </label>
            <input
              type="text"
              placeholder="Department..."
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-[11.5px] font-medium text-slate-600 mb-1">
              Addon Group Name
            </label>
            <input
              type="text"
              placeholder="Addon Group..."
              value={addonNameFilter}
              onChange={(e) => setAddonNameFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11.5px] font-medium text-slate-600 mb-1">
              Search By Department
            </label>
            <select
              value={deptSelect}
              onChange={(e) => setDeptSelect(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-hidden cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Kitchen">Kitchen</option>
              <option value="Bar">Bar</option>
            </select>
          </div>

          <div className="flex items-center gap-2 lg:col-span-2">
            <button
              type="button"
              onClick={() => toast.info(`Filter applied: ${filteredGroups.length} groups found`)}
              className="flex-1 rounded-lg bg-teal-600 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-teal-700 transition cursor-pointer shadow-xs"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setDepartmentFilter("");
                setAddonNameFilter("");
                setDeptSelect("All");
                toast.info("Showing all addons");
              }}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Show All
            </button>
          </div>
        </div>
      </div>

      {/* 3. PosDataGrid with DataTableHeader */}
      <PosDataGrid<AddonGroupItem>
        data={filteredGroups}
        columns={columns}
        enableSelection={true}
        selectedRowIds={selectedIds}
        onSelectionChange={setSelectedIds}
        enablePagination={true}
        pageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage="No addon groups found matching filters."
      />

      {/* Add Addon Group Modal */}
      {isAddingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-300 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h3 className="text-[16px] font-bold text-slate-900">Add New Addon Group</h3>
              <button
                type="button"
                onClick={() => setIsAddingGroup(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddGroupSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Choice of Cheese, Extra Toppings..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-[13.5px] focus:outline-hidden focus:border-teal-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                  Department
                </label>
                <select
                  value={newGroupDept}
                  onChange={(e) => setNewGroupDept(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13.5px] focus:outline-hidden focus:border-teal-500 cursor-pointer"
                >
                  <option value="Kitchen">Kitchen</option>
                  <option value="Bar">Bar</option>
                  <option value="Dessert Counter">Dessert Counter</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddingGroup(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-5 py-2 text-[13px] font-semibold text-white hover:bg-teal-700 shadow-xs cursor-pointer"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
