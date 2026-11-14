import React, { useState } from "react";
import {
  X,
  Layers,
  Plus,
  AlertTriangle,
  Pencil,
  Trash2,
  UtensilsCrossed,
  Check,
} from "lucide-react";
import type { RestaurantTable } from "@/types/posTables";
import { ColorActionEdit, ColorActionDelete } from "@/components/common/ColorActionIcons";

interface FloorTableDirectoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  areas: string[];
  tables: RestaurantTable[];
  onOpenAddArea: () => void;
  onOpenAddTable: (defaultArea?: string) => void;
  onEditTable: (table: RestaurantTable) => void;
  onDeleteTable: (tableId: string, tableName: string) => void;
  onRenameArea?: (oldName: string, newName: string) => void;
  onDeleteArea?: (areaName: string) => void;
}

export function FloorTableDirectoryDrawer({
  isOpen,
  onClose,
  areas,
  tables,
  onOpenAddArea,
  onOpenAddTable,
  onEditTable,
  onDeleteTable,
  onRenameArea,
  onDeleteArea,
}: FloorTableDirectoryDrawerProps) {
  // Confirm Delete Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: "table" | "area";
    id: string;
    name: string;
  } | null>(null);

  // Inline rename state for an area
  const [renamingArea, setRenamingArea] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  if (!isOpen) return null;

  const handleStartRename = (area: string) => {
    setRenamingArea(area);
    setRenameValue(area);
  };

  const handleSaveRename = (oldName: string) => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed.toLowerCase() !== oldName.toLowerCase() && onRenameArea) {
      onRenameArea(oldName, trimmed);
    }
    setRenamingArea(null);
    setRenameValue("");
  };

  const handleConfirmDelete = () => {
    if (!confirmDialog) return;
    if (confirmDialog.type === "table") {
      onDeleteTable(confirmDialog.id, confirmDialog.name);
    } else if (confirmDialog.type === "area" && onDeleteArea) {
      onDeleteArea(confirmDialog.name);
    }
    setConfirmDialog(null);
  };

  // Group tables by area
  const displayAreas = areas.length > 0 ? areas : ["Dining Area"];
  const tablesByArea = displayAreas.reduce(
    (acc, area) => {
      acc[area] = tables.filter(
        (t) => (t.area || "Dining Area").trim().toLowerCase() === area.trim().toLowerCase(),
      );
      return acc;
    },
    {} as Record<string, RestaurantTable[]>,
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Right Overlap Slide-Over Card */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col bg-white border-l-2 border-black shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b-2 border-black bg-primary-tint/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground border border-black shadow-2xs font-bold">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[17px] font-extrabold text-black">List of Floors & Tables</h2>
              <p className="text-[12px] font-semibold text-slate-700">
                Directory of all dining floors, sections, and assigned tables ({tables.length} total)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAddArea}
              className="flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground border border-black hover:opacity-90 px-3 py-1.5 text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Floor</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAddTable()}
              className="flex items-center gap-1.5 rounded-xl border border-black bg-white hover:bg-slate-100 text-black px-3 py-1.5 text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Table</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1.5 text-black hover:bg-black/10 transition border border-black cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {areas.length === 0 && tables.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-black bg-slate-50 p-8 text-center space-y-3">
              <UtensilsCrossed className="w-10 h-10 mx-auto text-slate-400 stroke-[1.5]" />
              <h3 className="text-base font-extrabold text-black">No Floors or Tables Configured</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Get started by creating your restaurant floors (e.g., Ground Floor, Rooftop Lounge, Garden) and assign tables.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onOpenAddArea}
                  className="rounded-xl bg-primary text-primary-foreground border border-black px-4 py-2 text-xs font-bold shadow-xs cursor-pointer"
                >
                  + Add First Floor
                </button>
              </div>
            </div>
          ) : (
            displayAreas.map((areaName) => {
              const areaTables = tablesByArea[areaName] || [];
              const totalSeats = areaTables.reduce((sum, t) => sum + (t.capacity || 0), 0);

              return (
                <div
                  key={areaName}
                  className="rounded-2xl border-2 border-black bg-white shadow-2xs overflow-hidden"
                >
                  {/* Floor Header Bar */}
                  <div className="flex items-center justify-between border-b-2 border-black bg-slate-100 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {renamingArea === areaName ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="h-8 rounded-lg border border-black bg-white px-2.5 text-xs font-bold text-black focus:outline-hidden"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(areaName)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-black bg-emerald-600 text-white cursor-pointer"
                            title="Save"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenamingArea(null)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-black bg-white text-black cursor-pointer"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-extrabold text-black">
                            {areaName}
                          </span>
                          <span className="rounded-full border border-black bg-white px-2 py-0.5 text-[10.5px] font-bold text-black">
                            {areaTables.length} Tables · {totalSeats} Seats
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenAddTable(areaName)}
                        className="rounded-lg border border-black bg-white hover:bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-black shadow-2xs cursor-pointer"
                        title={`Add table to ${areaName}`}
                      >
                        + Table
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartRename(areaName)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-black bg-white hover:bg-black/5 shadow-2xs cursor-pointer"
                        title="Rename Floor"
                      >
                        <Pencil className="h-3.5 w-3.5 text-black" />
                      </button>
                      {onDeleteArea && (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDialog({
                              isOpen: true,
                              type: "area",
                              id: areaName,
                              name: areaName,
                            })
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-black bg-white hover:bg-rose-50 shadow-2xs cursor-pointer"
                          title="Delete Floor"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tables in this Floor - Excel Grid */}
                  {areaTables.length === 0 ? (
                    <div className="p-4 text-center text-xs font-semibold text-slate-500">
                      No tables assigned to {areaName} yet. Click{" "}
                      <span
                        onClick={() => onOpenAddTable(areaName)}
                        className="text-primary underline cursor-pointer font-bold"
                      >
                        + Table
                      </span>{" "}
                      to create tables.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-center border-collapse border border-black text-[12px]">
                        <thead>
                          <tr className="bg-primary text-primary-foreground border-b-2 border-black font-extrabold text-[11px] uppercase tracking-wider">
                            <th className="py-2.5 px-3 border-r border-black border-b-2 border-black text-center w-12">
                              #
                            </th>
                            <th className="py-2.5 px-3 border-r border-black border-b-2 border-black text-center">
                              Table No
                            </th>
                            <th className="py-2.5 px-3 border-r border-black border-b-2 border-black text-center">
                              Capacity
                            </th>
                            <th className="py-2.5 px-3 border-r border-black border-b-2 border-black text-center">
                              Shape
                            </th>
                            <th className="py-2.5 px-3 border-r border-black border-b-2 border-black text-center">
                              Status
                            </th>
                            <th className="py-2.5 px-3 border-b-2 border-black text-center w-28">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {areaTables.map((tbl, idx) => (
                            <tr
                              key={tbl.id}
                              className="border-b border-black hover:bg-slate-50 transition"
                            >
                              <td className="py-2 px-3 border-r border-black border-b border-black text-center font-bold text-black">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3 border-r border-black border-b border-black text-center font-bold text-black">
                                {tbl.tableNumber}
                              </td>
                              <td className="py-2 px-3 border-r border-black border-b border-black text-center font-medium text-black">
                                {tbl.capacity} Pax
                              </td>
                              <td className="py-2 px-3 border-r border-black border-b border-black text-center capitalize font-medium text-black">
                                {tbl.shape || "Square"}
                              </td>
                              <td className="py-2 px-3 border-r border-black border-b border-black text-center">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold border border-black ${
                                    tbl.status === "occupied"
                                      ? "bg-amber-100 text-amber-900"
                                      : tbl.status === "reserved"
                                        ? "bg-sky-100 text-sky-900"
                                        : tbl.status === "billed"
                                          ? "bg-purple-100 text-purple-900"
                                          : "bg-emerald-100 text-emerald-900"
                                  }`}
                                >
                                  {tbl.status === "occupied"
                                    ? "Occupied"
                                    : tbl.status === "reserved"
                                      ? "Reserved"
                                      : tbl.status === "billed"
                                        ? "Billed"
                                        : "Available"}
                                </span>
                              </td>
                              <td className="py-2 px-3 border-b border-black text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => onEditTable(tbl)}
                                    className="flex items-center justify-center h-7 w-7 rounded-lg border border-black bg-white hover:bg-black/5 shadow-2xs transition cursor-pointer"
                                    title={`Edit ${tbl.tableNumber}`}
                                  >
                                    <ColorActionEdit className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConfirmDialog({
                                        isOpen: true,
                                        type: "table",
                                        id: tbl.id,
                                        name: tbl.tableNumber,
                                      })
                                    }
                                    className="flex items-center justify-center h-7 w-7 rounded-lg border border-black bg-white hover:bg-black/5 shadow-2xs transition cursor-pointer"
                                    title={`Delete ${tbl.tableNumber}`}
                                  >
                                    <ColorActionDelete className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t-2 border-black bg-slate-100 px-5 py-3">
          <div className="text-xs font-semibold text-slate-700">
            Total: <strong>{displayAreas.length}</strong> Floors · <strong>{tables.length}</strong> Tables
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-black bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-black transition cursor-pointer shadow-2xs"
          >
            Close Directory
          </button>
        </div>
      </div>

      {/* Warning Confirmation Popup Dialog */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setConfirmDialog(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border-2 border-black bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 border border-black text-rose-700">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[16px] font-extrabold text-black">
                  Confirm Deletion
                </h3>
                <p className="mt-1 text-[13px] font-medium text-slate-700 leading-normal">
                  {confirmDialog.type === "table" ? (
                    <>
                      Are you sure you want to delete{" "}
                      <strong>{confirmDialog.name}</strong>? This action will remove the table from all floor plans and cannot be undone.
                    </>
                  ) : (
                    <>
                      Are you sure you want to delete floor / area{" "}
                      <strong>{confirmDialog.name}</strong>? All tables inside this floor will also be removed. This action cannot be undone.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="rounded-xl border border-black bg-white hover:bg-slate-100 px-4 py-2 text-xs font-bold text-black transition cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl border border-black bg-rose-600 hover:bg-rose-700 px-5 py-2 text-xs font-bold text-white transition cursor-pointer shadow-2xs"
              >
                Yes, Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
