import { useMemo, useState } from "react";
import { Plus, Copy, Edit2, Trash2 } from "lucide-react";
import {
  useSpecialNotes,
  useToggleSpecialNote,
  useDeleteSpecialNote,
  useAddSpecialNote,
} from "@/hooks/queries/usePosMenu";
import { AddSpecialNoteModal } from "../modals/AddSpecialNoteModal";
import { PosDataGrid, type DataGridColumn } from "@/components/ui/data-grid";
import type { SpecialNote } from "@/types/posMenu";
import { toast } from "sonner";
import { useOutletContext } from "@/context/PosOutletContext";

export function SpecialNoteView({ onBack }: { onBack?: () => void }) {
  const { activeOutlet } = useOutletContext();
  const outletId = activeOutlet?.id;
  const { data: specialNotes = [], isLoading } = useSpecialNotes(outletId);
  const toggleMutation = useToggleSpecialNote(outletId);
  const deleteMutation = useDeleteSpecialNote(outletId);
  const addMutation = useAddSpecialNote(outletId);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleDuplicate = (noteName: string) => {
    addMutation.mutate(
      { name: `${noteName} (Copy)`, available: true },
      {
        onSuccess: () => {
          toast.success(`Duplicated "${noteName}"`);
        },
      },
    );
  };

  const handleDelete = (id: string, name: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success(`Deleted special note "${name}"`);
      },
    });
  };

  const columns: DataGridColumn<SpecialNote>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Special Note",
        accessorKey: "name",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 220,
        cell: ({ row }) => <span className="font-medium text-slate-800">{row.name}</span>,
      },
      {
        id: "createdAt",
        header: "Created",
        accessorKey: "createdAt",
        enableSorting: true,
        enableFiltering: true,
        minWidth: 140,
        cell: ({ row }) => <span className="text-slate-500">{row.createdAt}</span>,
      },
      {
        id: "available",
        header: "Available",
        accessorKey: "available",
        enableSorting: true,
        enableFiltering: true,
        align: "center",
        minWidth: 120,
        filterValueAccessor: (row) => (row.available ? "Yes" : "No"),
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => toggleMutation.mutate(row.id)}
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer ${
              row.available
                ? "bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
            title="Click to toggle availability"
          >
            {row.available ? "Yes" : "No"}
          </button>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        minWidth: 120,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5 text-slate-400">
            <button
              type="button"
              onClick={() => handleDuplicate(row.name)}
              className="p-1 hover:text-teal-600 hover:bg-slate-100 rounded transition cursor-pointer"
              title="Duplicate Special Note"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                toast.info(`Editing "${row.name}"`);
                setIsAddModalOpen(true);
              }}
              className="p-1 hover:text-teal-600 hover:bg-slate-100 rounded transition cursor-pointer"
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(row.id, row.name)}
              className="p-1 hover:text-red-600 hover:bg-slate-100 rounded transition cursor-pointer"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [toggleMutation],
  );

  return (
    <div>
      <PosDataGrid<SpecialNote>
        data={specialNotes}
        isLoading={isLoading}
        columns={columns}
        showToolbar
        searchPlaceholder="Search by note name..."
        enablePagination
        pageSize={10}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage="No special notes found. Click Add Special Note to create one."
        storageKey="pos-special-notes-grid"
        toolbarActions={
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-teal-700 px-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-teal-800 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Special Note
          </button>
        }
      />

      <AddSpecialNoteModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
