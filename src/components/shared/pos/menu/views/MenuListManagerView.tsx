import { useState } from "react";
import {
  Plus,
  Edit2,
  Eye,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  UtensilsCrossed,
} from "lucide-react";
import type { MenuItem, MenuItemType } from "@/types/posMenu";
import {
  useMenuItems,
  useAddMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  useToggleItemPlatform,
} from "@/hooks/queries/usePosMenu";
import { useOutletContext } from "@/context/PosOutletContext";
import { MenuItemEditModal } from "../modals/MenuItemEditModal";
import { ItemImageManagerModal } from "../modals/ItemImageManagerModal";
import { MenuItemViewModal } from "../modals/MenuItemViewModal";
import { toast } from "sonner";
import { PosDataGrid, type DataGridColumn } from "@/components/ui/data-grid";

export function MenuListManagerView() {
  const { activeOutlet } = useOutletContext();
  const { data: menuItems = [], isLoading, refetch, isFetching } = useMenuItems(activeOutlet.id);
  const deleteMutation = useDeleteMenuItem();
  const updateMutation = useUpdateMenuItem();
  const togglePlatformMutation = useToggleItemPlatform();

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageItem, setImageItem] = useState<MenuItem | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<MenuItem | null>(null);

  const handleToggleDirectQr = (id: string, name: string, currentVal: boolean) => {
    const nextVal = !currentVal;
    togglePlatformMutation.mutate(
      { id, platform: "direct" },
      {
        onSuccess: () => {
          toast.success(
            nextVal
              ? `"${name}" is now Live on Direct QR Menu`
              : `"${name}" turned OFF from Direct QR Menu`
          );
        },
        onError: () => toast.error("Failed to update Direct QR availability"),
      }
    );
  };

  const handleToggleStatus = (item: MenuItem) => {
    const nextStatus = item.status === "Active" ? "Inactive" : "Active";
    updateMutation.mutate(
      { id: item.id, data: { status: nextStatus } },
      {
        onSuccess: () => {
          toast.success(
            nextStatus === "Active"
              ? `"${item.name}" enabled (now visible in Billing)`
              : `"${item.name}" disabled (hidden from Billing)`
          );
        },
        onError: () => toast.error("Failed to update dish status"),
      }
    );
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from the menu?`)) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast.success(`"${name}" removed from menu`),
        onError: () => toast.error("Failed to delete item"),
      });
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleOpenImages = (item: MenuItem) => {
    setImageItem(item);
    setIsImageModalOpen(true);
  };

  const handleOpenView = (item: MenuItem) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  const getItemTypeBadge = (type: MenuItemType) => {
    switch (type) {
      case "Veg":
        return (
          <span
            title="Vegetarian"
            className="inline-flex items-center justify-center h-4.5 w-4.5 rounded-xs border border-emerald-600 bg-white shadow-2xs"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
          </span>
        );
      case "Non-Veg":
        return (
          <span
            title="Non-Vegetarian"
            className="inline-flex items-center justify-center h-4.5 w-4.5 rounded-xs border border-red-600 bg-white shadow-2xs"
          >
            <span className="h-0 w-0 border-x-[3.5px] border-x-transparent border-b-[7px] border-b-red-600" />
          </span>
        );
      case "Egg":
        return (
          <span
            title="Contains Egg"
            className="inline-flex items-center justify-center h-4.5 w-4.5 rounded-xs border border-amber-600 bg-white shadow-2xs"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
          </span>
        );
    }
  };

  const columns: DataGridColumn<MenuItem>[] = [
    {
      id: "image",
      header: "Image",
      minWidth: 72,
      width: 72,
      align: "center",
      cell: ({ row }) => {
        const primaryImg = row.images?.find((i) => i.isPrimary) || row.images?.[0];
        return (
          <button
            type="button"
            onClick={() => handleOpenImages(row)}
            className="relative h-10 w-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 hover:border-teal-500 transition cursor-pointer group/img shrink-0 mx-auto block"
            title="Click to manage photos"
          >
            {primaryImg ? (
              <img
                src={primaryImg.url}
                alt={row.name}
                className="h-full w-full object-cover group-hover/img:scale-105 transition"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                <ImageIcon className="h-4 w-4" />
              </div>
            )}

            {row.images && row.images.length > 1 && (
              <span className="absolute bottom-0.5 right-0.5 rounded bg-black/75 px-1 text-[8.5px] font-bold text-white leading-tight">
                +{row.images.length - 1}
              </span>
            )}
          </button>
        );
      },
    },
    {
      id: "name",
      header: "Item Name",
      accessorKey: "name",
      enableSorting: true,
      enableFiltering: true,
      minWidth: 240,
      cell: ({ row }) => (
        <div className="min-w-0 py-0.5">
          <div className="flex items-center gap-2">
            <span
              onClick={() => handleOpenView(row)}
              className="font-bold text-slate-900 hover:text-teal-700 cursor-pointer transition text-xs sm:text-[13px] truncate"
            >
              {row.name}
            </span>
          </div>
          {row.onlineDisplayName && row.onlineDisplayName !== row.name && (
            <div
              className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5"
              title={row.onlineDisplayName}
            >
              Online: {row.onlineDisplayName}
            </div>
          )}
          {row.description && (
            <div
              className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5"
              title={row.description}
            >
              {row.description}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "code",
      header: "Code / SKU",
      accessorKey: "code",
      enableSorting: true,
      enableFiltering: true,
      minWidth: 120,
      cell: ({ row }) => (
        <span className="font-mono text-[11.5px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
          {row.code}
        </span>
      ),
    },
    {
      id: "category",
      header: "Category",
      accessorKey: "category",
      enableSorting: true,
      enableFiltering: true,
      minWidth: 140,
      cell: ({ row }) => <span className="font-semibold text-slate-700">{row.category}</span>,
    },
    {
      id: "itemType",
      header: "Type",
      accessorKey: "itemType",
      enableSorting: true,
      enableFiltering: true,
      align: "center",
      minWidth: 90,
      cell: ({ row }) => (
        <div className="inline-flex justify-center">{getItemTypeBadge(row.itemType)}</div>
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
        <span className="font-mono font-bold text-slate-900">₹{Number(row.price).toFixed(2)}</span>
      ),
    },
    {
      id: "taxRate",
      header: "Tax Rate",
      accessorKey: "taxRate",
      enableSorting: true,
      enableFiltering: true,
      align: "right",
      minWidth: 100,
      cell: ({ row }) => (
        <span className="text-[12px] font-medium text-slate-600">{row.taxRate}%</span>
      ),
    },
    {
      id: "direct",
      header: "Direct QR",
      align: "center",
      enableSorting: true,
      enableFiltering: true,
      filterValueAccessor: (row: MenuItem) => (row.direct ? "Live on Direct QR" : "Off"),
      minWidth: 110,
      cell: ({ row }) => (
        <div className="inline-flex flex-col items-center gap-0.5 py-0.5">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={row.direct}
              onChange={() => handleToggleDirectQr(row.id, row.name, row.direct)}
              disabled={togglePlatformMutation.isPending}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
          </label>
          <span
            className={`text-[9.5px] font-bold ${
              row.direct ? "text-teal-700" : "text-slate-400"
            }`}
          >
            {row.direct ? "Direct Live" : "Off"}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      enableSorting: true,
      enableFiltering: true,
      align: "center",
      minWidth: 120,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(row)}
          disabled={updateMutation.isPending}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
            row.status === "Active"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
              : "bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200"
          }`}
          title={`Click to ${row.status === "Active" ? "Disable" : "Enable"} "${row.name}"`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              row.status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
            }`}
          />
          <span>{row.status}</span>
        </button>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      minWidth: 140,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => handleOpenView(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenImages(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-teal-50 hover:text-teal-700 transition cursor-pointer"
            title="Manage Photos"
          >
            <ImageIcon className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenEdit(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-teal-50 hover:text-teal-700 transition cursor-pointer"
            title="Edit Item"
          >
            <Edit2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => handleDeleteItem(row.id, row.name)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
            title="Delete Item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar & Context Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200 font-bold">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] sm:text-[16px] font-extrabold text-slate-900">
                Menu Item Master Catalog
              </h2>
              <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-800 border border-teal-200">
                {activeOutlet.name}
              </span>
            </div>
            <p className="text-[12px] text-slate-500 font-medium">
              Manage dishes, pricing, tax rates, Direct QR availability, dietary indicators, and search directly in the columns below.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              refetch();
              toast.success("Menu items refreshed");
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            title="Refresh List"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-teal-600" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 px-4 py-2 text-[12.5px] font-bold text-white shadow-xs transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {/* 2. Menu Catalog PosDataGrid (Header Search & Filtering Built-in) */}
      <PosDataGrid<MenuItem>
        data={menuItems}
        isLoading={isLoading}
        columns={columns}
        enablePagination={true}
        pageSize={10}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage={`No menu items found in "${activeOutlet.name}". Click "Add New Item" to create dishes.`}
      />

      {/* Edit & Add Item Modal */}
      <MenuItemEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={editingItem}
        defaultOutletId={activeOutlet.id}
      />

      {/* Image Manager Quick Modal — always use live item from query so add/remove updates show */}
      <ItemImageManagerModal
        isOpen={isImageModalOpen}
        onClose={() => {
          setIsImageModalOpen(false);
          setImageItem(null);
        }}
        item={
          imageItem
            ? (menuItems.find((i) => i.id === imageItem.id) ?? imageItem)
            : null
        }
      />

      {/* View Item Modal */}
      <MenuItemViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        item={viewingItem}
        onEdit={(item) => handleOpenEdit(item)}
      />
    </div>
  );
}
