import { useEffect, useState } from "react";
import { Plus, Trash2, ChefHat } from "lucide-react";
import { toast } from "sonner";
import {
  PosCreateCancelButton,
  PosCreatePanel,
  PosCreateSubmitButton,
} from "@/components/layout/pos/PosCreatePanel";

export type RecipeIngredientInput = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
};

export type RecipeFormValues = {
  name: string;
  category: string;
  menuItem: string;
  yieldQty: string;
  yieldUnit: string;
  prepTimeMinutes: string;
  notes: string;
  ingredients: RecipeIngredientInput[];
};

const CATEGORY_OPTIONS = [
  "Veg Starters",
  "Veg Main Course",
  "Non-Veg Starters",
  "Non-Veg Main Course",
  "Bread",
  "Biryani & Rice",
  "Desserts",
  "Beverages",
  "Indian Whisky",
  "Scotch Whisky",
  "South Indian",
];

const UNIT_OPTIONS = ["g", "kg", "ml", "L", "pcs", "pkt", "tbsp", "tsp"];

const emptyIngredient = (): RecipeIngredientInput => ({
  id: `ing-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: "",
  quantity: "",
  unit: "g",
});

export function CreateRecipeModal({
  isOpen,
  onClose,
  onSave,
  initial,
  title = "Create New Recipe",
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: RecipeFormValues) => void;
  initial?: Partial<RecipeFormValues> | null;
  title?: string;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [menuItem, setMenuItem] = useState("");
  const [yieldQty, setYieldQty] = useState("1");
  const [yieldUnit, setYieldUnit] = useState("portion");
  const [prepTimeMinutes, setPrepTimeMinutes] = useState("15");
  const [notes, setNotes] = useState("");
  const [ingredients, setIngredients] = useState<RecipeIngredientInput[]>([emptyIngredient()]);

  useEffect(() => {
    if (!isOpen) return;
    setName(initial?.name || "");
    setCategory(initial?.category || CATEGORY_OPTIONS[0]);
    setMenuItem(initial?.menuItem || initial?.name || "");
    setYieldQty(initial?.yieldQty || "1");
    setYieldUnit(initial?.yieldUnit || "portion");
    setPrepTimeMinutes(initial?.prepTimeMinutes || "15");
    setNotes(initial?.notes || "");
    setIngredients(
      initial?.ingredients && initial.ingredients.length > 0
        ? initial.ingredients
        : [emptyIngredient()],
    );
  }, [isOpen, initial]);

  const updateIngredient = (id: string, patch: Partial<RecipeIngredientInput>) => {
    setIngredients((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Recipe name is required");
      return;
    }
    if (!category.trim()) {
      toast.error("Category is required");
      return;
    }
    const cleaned = ingredients
      .map((ing) => ({
        ...ing,
        name: ing.name.trim(),
        quantity: ing.quantity.trim(),
      }))
      .filter((ing) => ing.name);

    if (cleaned.length === 0) {
      toast.error("Add at least one ingredient");
      return;
    }
    for (const ing of cleaned) {
      if (!ing.quantity || Number(ing.quantity) <= 0) {
        toast.error(`Enter a valid quantity for "${ing.name}"`);
        return;
      }
    }

    onSave({
      name: name.trim(),
      category: category.trim(),
      menuItem: (menuItem || name).trim(),
      yieldQty: yieldQty.trim() || "1",
      yieldUnit: yieldUnit.trim() || "portion",
      prepTimeMinutes: prepTimeMinutes.trim() || "0",
      notes: notes.trim(),
      ingredients: cleaned,
    });
  };

  return (
    <PosCreatePanel
      open={isOpen}
      onClose={onClose}
      title={title}
      description="Fill recipe details and raw material ingredients"
      icon={ChefHat}
      size="lg"
      onSubmit={handleSubmit}
      footer={
        <>
          <PosCreateCancelButton onClick={onClose} />
          <PosCreateSubmitButton>Save Recipe</PosCreateSubmitButton>
        </>
      }
    >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                  Recipe / Dish Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Veg Manchuria Dry"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 focus:border-teal-500 focus:outline-hidden cursor-pointer"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                  Linked Menu Item
                </label>
                <input
                  type="text"
                  value={menuItem}
                  onChange={(e) => setMenuItem(e.target.value)}
                  placeholder="Menu item this recipe prepares"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                  Yield Qty
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={yieldQty}
                    onChange={(e) => setYieldQty(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-teal-500 focus:outline-hidden"
                  />
                  <input
                    type="text"
                    value={yieldUnit}
                    onChange={(e) => setYieldUnit(e.target.value)}
                    className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-teal-500 focus:outline-hidden"
                    placeholder="portion"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                  Prep Time (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={prepTimeMinutes}
                  onChange={(e) => setPrepTimeMinutes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[12.5px] font-semibold text-slate-700">
                  Ingredients <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIngredients((prev) => [...prev, emptyIngredient()])}
                  className="flex items-center gap-1 text-[12px] font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Ingredient
                </button>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                {ingredients.map((ing, idx) => (
                  <div
                    key={ing.id}
                    className="grid grid-cols-12 gap-2 items-center rounded-lg bg-white border border-slate-200 p-2"
                  >
                    <div className="col-span-12 sm:col-span-5">
                      <input
                        type="text"
                        value={ing.name}
                        onChange={(e) => updateIngredient(ing.id, { name: e.target.value })}
                        placeholder={`Ingredient ${idx + 1}`}
                        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-[12.5px] focus:border-teal-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="col-span-5 sm:col-span-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={ing.quantity}
                        onChange={(e) => updateIngredient(ing.id, { quantity: e.target.value })}
                        placeholder="Qty"
                        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-[12.5px] focus:border-teal-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="col-span-5 sm:col-span-3">
                      <select
                        value={ing.unit}
                        onChange={(e) => updateIngredient(ing.id, { unit: e.target.value })}
                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[12.5px] focus:border-teal-500 focus:outline-hidden cursor-pointer"
                      >
                        {UNIT_OPTIONS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        disabled={ingredients.length <= 1}
                        onClick={() =>
                          setIngredients((prev) => prev.filter((row) => row.id !== ing.id))
                        }
                        className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                Method / Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Optional prep notes, plating tips..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden resize-none"
              />
            </div>
    </PosCreatePanel>
  );
}
