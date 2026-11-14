import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, CookingPot, AlertCircle, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";
import { useMenuItems } from "@/hooks/queries/usePosMenu";
import { useStockItems } from "@/hooks/queries/usePosInventory";
import { useCreateDailyPrep } from "@/hooks/queries/usePosDailyPrep";
import { useAuth } from "@/hooks/useAuth";
import { FoodTypeIcon } from "@/components/ui/FoodTypeIcon";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  preselectedItemId?: string;
};

export function CreateDailyPrepModal({ isOpen, onClose, preselectedItemId }: Props) {
  const { user } = useAuth();
  const { data: menuItems = [] } = useMenuItems();
  const { data: stockItems = [] } = useStockItems();
  const createMutation = useCreateDailyPrep();

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [menuItemId, setMenuItemId] = useState("");
  const [plates, setPlates] = useState<number | string>("");
  const [notes, setNotes] = useState("");
  const [preparedBy, setPreparedBy] = useState(user?.name || "Kitchen Chef");
  const [ingredients, setIngredients] = useState<
    Array<{ rawMaterialId: string; quantity: number | string }>
  >([]);

  // Filter raw materials
  const rawMaterialOptions = useMemo(() => {
    const raw = stockItems.filter((s) => !s.itemKind || s.itemKind === "RAW");
    return raw.length > 0 ? raw : stockItems;
  }, [stockItems]);

  const selectedItem = useMemo(() => {
    return menuItems.find((m) => m.id === menuItemId);
  }, [menuItems, menuItemId]);

  // Reset or pre-fill on open
  useEffect(() => {
    if (isOpen) {
      const targetId = preselectedItemId || (menuItems[0]?.id ?? "");
      setMenuItemId(targetId);
      setDate(new Date().toISOString().slice(0, 10));
      setPlates("");
      setNotes("");
      setPreparedBy(user?.name || "Kitchen Chef");

      const itemMatch = menuItems.find((m) => m.id === targetId);
      if (itemMatch && itemMatch.rawMaterials && itemMatch.rawMaterials.length > 0) {
        setIngredients(
          itemMatch.rawMaterials.map((rm) => ({
            rawMaterialId: rm.rawMaterialId,
            quantity: rm.quantity,
          })),
        );
      } else {
        setIngredients([
          { rawMaterialId: rawMaterialOptions[0]?.id || "", quantity: "" },
        ]);
      }
    }
  }, [isOpen, preselectedItemId, menuItems, rawMaterialOptions, user?.name]);

  // Handle dish selection change
  const handleItemSelect = (id: string) => {
    setMenuItemId(id);
    const itemMatch = menuItems.find((m) => m.id === id);
    if (itemMatch && itemMatch.rawMaterials && itemMatch.rawMaterials.length > 0) {
      setIngredients(
        itemMatch.rawMaterials.map((rm) => ({
          rawMaterialId: rm.rawMaterialId,
          quantity: rm.quantity,
        })),
      );
    }
  };

  const handleAddIngredientRow = () => {
    const available = rawMaterialOptions.find(
      (s) => !ingredients.some((i) => i.rawMaterialId === s.id),
    );
    setIngredients((prev) => [
      ...prev,
      { rawMaterialId: available?.id || rawMaterialOptions[0]?.id || "", quantity: "" },
    ]);
  };

  const handleUpdateIngredient = (index: number, field: "rawMaterialId" | "quantity", value: any) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing)),
    );
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItem) {
      toast.error("Please choose a food menu dish");
      return;
    }

    const numPlates = Number(plates);
    if (!plates || isNaN(numPlates) || numPlates <= 0) {
      toast.error("Please enter a valid plate quantity (> 0)");
      return;
    }

    const validIngredients = ingredients
      .filter((ing) => ing.rawMaterialId && Number(ing.quantity) > 0)
      .map((ing) => {
        const mat = stockItems.find((s) => s.id === ing.rawMaterialId);
        return {
          rawMaterialId: ing.rawMaterialId,
          rawMaterialName: mat?.rawMaterial || mat?.name || "Raw Material",
          quantity: Number(ing.quantity),
          unit: mat?.unit || "unit",
        };
      });

    if (validIngredients.length === 0) {
      toast.error("Please specify at least one raw material with a quantity used");
      return;
    }

    createMutation.mutate(
      {
        date,
        menuItemId: selectedItem.id,
        menuItemName: selectedItem.name,
        menuItemCode: selectedItem.code,
        category: selectedItem.category,
        diet: selectedItem.itemType,
        plates: numPlates,
        ingredients: validIngredients,
        notes,
        preparedBy,
      },
      {
        onSuccess: () => {
          toast.success(
            `Recorded ${numPlates} plates of "${selectedItem.name}"! Raw materials deducted and POS plate stock updated.`,
          );
          onClose();
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to save daily preparation entry");
        },
      },
    );
  };

  return (
    <PosCreatePanel
      open={isOpen}
      onClose={onClose}
      title="Daily Kitchen Preparation"
      description="Record dishes cooked today with plate yield. Consumed raw materials will be automatically deducted from your inventory stock."
      icon={CookingPot}
      size="lg"
      onSubmit={handleSubmit}
      footer={
        <>
          <span className="mr-auto text-[12px] text-slate-500 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            Adds plates to POS billing and deducts raw materials from inventory.
          </span>
          <PosCreateCancelButton onClick={onClose} />
          <PosCreateSubmitButton disabled={createMutation.isPending}>
            {createMutation.isPending ? "Saving Batch..." : "Save Preparation Batch"}
          </PosCreateSubmitButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* Row 1: Date & Chef */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
              Date of Preparation <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={date}
              onChange={(e) => {
                const val = e.target.value;
                const todayIso = new Date().toISOString().slice(0, 10);
                if (val && val > todayIso) return;
                setDate(val);
              }}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 focus:border-teal-500 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
              Prepared By (Chef / Station)
            </label>
            <input
              type="text"
              placeholder="e.g. Chef Ramesh / Main Kitchen"
              value={preparedBy}
              onChange={(e) => setPreparedBy(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 focus:border-teal-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Row 2: Select Menu Dish & Current Plates */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
            <div className="md:col-span-8">
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                Select Menu Dish to Prepare <span className="text-red-500">*</span>
              </label>
              <select
                value={menuItemId}
                onChange={(e) => handleItemSelect(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] font-medium text-slate-900 focus:border-teal-500 focus:outline-hidden"
                required
              >
                <option value="" disabled>-- Select dish from food menu --</option>
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.code}) · ₹{Number(item.price).toFixed(0)} · Current Stock: {item.plates ?? 0} plates
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4">
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                Quantity Made (<span className="text-teal-700 font-bold">Plates</span>) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  placeholder="e.g. 20"
                  value={plates}
                  onChange={(e) => setPlates(e.target.value)}
                  className="w-full h-10 rounded-lg border border-teal-400 bg-white px-3 pr-16 text-[13.5px] font-extrabold text-teal-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  required
                />
                <span className="absolute right-3 top-2.5 text-[12px] font-bold text-teal-700 select-none">
                  Plates
                </span>
              </div>
            </div>
          </div>

          {selectedItem && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-[12px]">
              <div className="flex items-center gap-2">
                <FoodTypeIcon
                  type={selectedItem.itemType === "Non-Veg" ? "non_veg" : "veg"}
                  size="sm"
                />
                <span className="font-bold text-slate-900">{selectedItem.name}</span>
                <span className="font-mono text-slate-500 font-semibold">{selectedItem.code}</span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10.5px] font-semibold text-slate-700">
                  {selectedItem.category}
                </span>
              </div>
              <div className="font-medium text-slate-600">
                Current POS Stock:{" "}
                <span className="font-bold font-mono text-teal-700">
                  {selectedItem.plates ?? 0} plates
                </span>{" "}
                {Number(plates) > 0 && (
                  <span className="text-emerald-700 font-bold">
                    → Will become {(Number(selectedItem.plates ?? 0) + Number(plates)).toFixed(1)} plates
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Row 3: Raw Materials Table */}
        <div className="space-y-3 p-4 rounded-xl bg-teal-50/50 border border-teal-200/80">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-teal-600" />
                Raw Materials Consumed for this Batch
              </h3>
              <p className="text-[11px] text-slate-500">
                Specify ingredients used. These quantities will be deducted from your stock inventory.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddIngredientRow}
              className="inline-flex items-center gap-1 text-[11.5px] font-bold text-teal-700 hover:text-teal-800 bg-teal-100 hover:bg-teal-200/70 px-3 py-1.5 rounded-lg transition cursor-pointer shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Raw Material
            </button>
          </div>

          {ingredients.length === 0 ? (
            <div className="p-3 text-center text-[12px] text-slate-500 italic bg-white/70 rounded-lg border border-teal-200/60">
              No raw materials added yet. Click "+ Add Raw Material" to select inventory items.
            </div>
          ) : (
            <div className="space-y-2">
              {ingredients.map((ing, idx) => {
                const selectedStock = stockItems.find((s) => s.id === ing.rawMaterialId);
                const isStockLow =
                  selectedStock &&
                  Number(ing.quantity) > Number(selectedStock.availableStock ?? 0);

                return (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-white border border-teal-200/70 shadow-2xs"
                  >
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-[10.5px] font-bold text-slate-600 mb-0.5">
                        Raw Material
                      </label>
                      <select
                        value={ing.rawMaterialId}
                        onChange={(e) =>
                          handleUpdateIngredient(idx, "rawMaterialId", e.target.value)
                        }
                        className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-[12px] text-slate-900 focus:border-teal-500 focus:outline-hidden"
                        required
                      >
                        <option value="" disabled>-- Choose material --</option>
                        {rawMaterialOptions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.rawMaterial || s.name} ({s.availableStock} {s.unit} in stock)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-28">
                      <label className="block text-[10.5px] font-bold text-slate-600 mb-0.5">
                        Quantity Used
                      </label>
                      <input
                        type="number"
                        min="0.001"
                        step="any"
                        placeholder="0.00"
                        value={ing.quantity}
                        onChange={(e) =>
                          handleUpdateIngredient(idx, "quantity", e.target.value)
                        }
                        className={`w-full h-9 rounded-md border px-2.5 text-[12px] font-bold text-slate-900 focus:outline-hidden ${
                          isStockLow
                            ? "border-amber-400 bg-amber-50/50"
                            : "border-slate-300 focus:border-teal-500"
                        }`}
                        required
                      />
                    </div>

                    <div className="w-20">
                      <label className="block text-[10.5px] font-bold text-slate-600 mb-0.5">
                        Unit
                      </label>
                      <div className="h-9 flex items-center px-2 rounded-md bg-slate-100 text-[11.5px] font-semibold text-slate-700">
                        {selectedStock?.unit || "unit"}
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(idx)}
                        className="h-9 w-9 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-md transition cursor-pointer"
                        title="Remove row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {isStockLow && (
                      <div className="w-full text-[11px] font-medium text-amber-700 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        Warning: Available stock ({selectedStock.availableStock} {selectedStock.unit}) is less than quantity used.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Row 4: Batch Notes */}
        <div>
          <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
            Preparation Notes (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Lunch batch, extra spicy, prepared for table reservations..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-9 rounded-lg border border-slate-300 px-3 text-[12.5px] text-slate-900 focus:border-teal-500 focus:outline-hidden"
          />
        </div>
      </div>
    </PosCreatePanel>
  );
}

