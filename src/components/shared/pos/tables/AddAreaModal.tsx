import React, { useState } from "react";
import { Plus, Layers, Pencil, Trash2, Check, X } from "lucide-react";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";

interface AddAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddArea: (areaName: string) => void;
  existingAreas: string[];
  onRenameArea?: (oldName: string, newName: string) => void;
  onDeleteArea?: (areaName: string) => void;
  isRenaming?: boolean;
  isDeleting?: boolean;
}

export function AddAreaModal({
  isOpen,
  onClose,
  onAddArea,
  existingAreas,
  onRenameArea,
  onDeleteArea,
  isRenaming = false,
  isDeleting = false,
}: AddAreaModalProps) {
  const [areaName, setAreaName] = useState("");
  const [error, setError] = useState("");
  const [editingArea, setEditingArea] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [renameError, setRenameError] = useState("");
  const [deletingArea, setDeletingArea] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = areaName.trim();
    if (!trimmed) {
      setError("Please enter an area name");
      return;
    }
    if (existingAreas.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      setError("An area with this name already exists");
      return;
    }
    onAddArea(trimmed);
    setAreaName("");
    setError("");
  };

  const startRename = (name: string) => {
    setEditingArea(name);
    setEditingValue(name);
    setRenameError("");
    setDeletingArea(null);
  };

  const cancelRename = () => {
    setEditingArea(null);
    setEditingValue("");
    setRenameError("");
  };

  const handleSaveRename = (oldName: string) => {
    const trimmed = editingValue.trim();
    if (!trimmed) {
      setRenameError("Area name cannot be empty");
      return;
    }
    if (
      trimmed.toLowerCase() !== oldName.toLowerCase() &&
      existingAreas.some((a) => a.toLowerCase() === trimmed.toLowerCase())
    ) {
      setRenameError("An area with this name already exists");
      return;
    }
    if (onRenameArea && trimmed !== oldName) {
      onRenameArea(oldName, trimmed);
    }
    setEditingArea(null);
    setEditingValue("");
    setRenameError("");
  };

  const handleConfirmDelete = (name: string) => {
    if (onDeleteArea) {
      onDeleteArea(name);
    }
    setDeletingArea(null);
  };

  return (
    <PosCreatePanel
      open={isOpen}
      onClose={onClose}
      title="Add New Floor / Area"
      description="Create and manage dining sections (e.g. Ground Floor, Rooftop, Garden)"
      icon={Layers}
      onSubmit={handleSubmit}
      footer={
        <>
          <PosCreateCancelButton onClick={onClose} />
          <PosCreateSubmitButton>
            <Plus className="h-3.5 w-3.5" />
            Add Area
          </PosCreateSubmitButton>
        </>
      }
    >
      <div className="space-y-6">
        {/* Top Input Form */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            Area / Floor Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            autoFocus
            placeholder="e.g. Rooftop Lounge, Garden Terrace, Poolside"
            value={areaName}
            onChange={(e) => {
              setAreaName(e.target.value);
              if (error) setError("");
            }}
            className="w-full rounded-xl border border-border bg-primary-tint/70 px-3.5 py-2 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {error ? <p className="mt-1 text-xs font-medium text-rose-500">{error}</p> : null}
        </div>

        {/* Existing Areas Table */}
        <div className="border-t border-slate-200/80 pt-5">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Existing Areas ({existingAreas.length})
            </h4>
          </div>

          {renameError ? (
            <p className="mb-2 text-xs font-medium text-rose-500">{renameError}</p>
          ) : null}

          {existingAreas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-slate-400">
              <Layers className="w-5 h-5 mx-auto mb-1.5 opacity-40" />
              <p className="text-xs font-medium text-slate-500">No dining areas configured yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Add an area name above to set up your restaurant floors.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-14">Sl No</th>
                    <th className="py-2.5 px-3">Area Name</th>
                    <th className="py-2.5 px-3 text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {existingAreas.map((area, index) => {
                    const isEditing = editingArea === area;
                    const isDeletingThis = deletingArea === area;

                    return (
                      <tr
                        key={area}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        {/* Sl No */}
                        <td className="py-2.5 px-3 text-center font-medium text-slate-400 text-xs">
                          {index + 1}
                        </td>

                        {/* Area Name / Inline Edit */}
                        <td className="py-2.5 px-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => {
                                setEditingValue(e.target.value);
                                if (renameError) setRenameError("");
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSaveRename(area);
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  cancelRename();
                                }
                              }}
                              className="w-full rounded-lg border border-teal-500 bg-white px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                              autoFocus
                            />
                          ) : (
                            <span className="font-semibold text-slate-800 text-[13px]">
                              {area}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleSaveRename(area)}
                                disabled={isRenaming}
                                title="Save"
                                className="p-1 text-teal-600 hover:bg-teal-50 rounded-md transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={cancelRename}
                                title="Cancel"
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : isDeletingThis ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-[11px] text-rose-600 font-semibold">Delete?</span>
                              <button
                                type="button"
                                onClick={() => handleConfirmDelete(area)}
                                disabled={isDeleting}
                                title="Confirm delete"
                                className="px-2 py-0.5 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors cursor-pointer"
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingArea(null)}
                                title="Cancel"
                                className="px-1.5 py-0.5 text-[11px] text-slate-500 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              {onRenameArea && (
                                <button
                                  type="button"
                                  onClick={() => startRename(area)}
                                  title="Rename"
                                  className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {onDeleteArea && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeletingArea(area);
                                    setEditingArea(null);
                                  }}
                                  title="Delete"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PosCreatePanel>
  );
}
