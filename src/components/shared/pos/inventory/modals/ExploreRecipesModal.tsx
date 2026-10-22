import { useMemo, useState } from "react";
import { X, Sparkles, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import type { RecipeFormValues } from "./CreateRecipeModal";

type SuggestedRecipe = {
  id: string;
  name: string;
  category: string;
  confidence: number;
  reason: string;
  draft: RecipeFormValues;
};

const SUGGESTIONS: SuggestedRecipe[] = [
  {
    id: "sug-1",
    name: "Paneer Butter Masala",
    category: "Veg Main Course",
    confidence: 94,
    reason: "High sell-through on your veg mains — common hotel recipe gap.",
    draft: {
      name: "Paneer Butter Masala",
      category: "Veg Main Course",
      menuItem: "Paneer Butter Masala",
      yieldQty: "1",
      yieldUnit: "portion",
      prepTimeMinutes: "25",
      notes: "AI suggested base gravy recipe — adjust spice to house style.",
      ingredients: [
        { id: "i1", name: "Paneer", quantity: "150", unit: "g" },
        { id: "i2", name: "Butter", quantity: "30", unit: "g" },
        { id: "i3", name: "Tomato puree", quantity: "120", unit: "ml" },
        { id: "i4", name: "Fresh cream", quantity: "40", unit: "ml" },
      ],
    },
  },
  {
    id: "sug-2",
    name: "Chicken Tikka",
    category: "Non-Veg Starters",
    confidence: 91,
    reason: "Matches your non-veg starter mix and tandoor usage pattern.",
    draft: {
      name: "Chicken Tikka",
      category: "Non-Veg Starters",
      menuItem: "Chicken Tikka",
      yieldQty: "1",
      yieldUnit: "portion",
      prepTimeMinutes: "35",
      notes: "Marinate 4+ hours for best yield.",
      ingredients: [
        { id: "i1", name: "Chicken boneless", quantity: "200", unit: "g" },
        { id: "i2", name: "Hung curd", quantity: "80", unit: "g" },
        { id: "i3", name: "Tandoori masala", quantity: "15", unit: "g" },
        { id: "i4", name: "Mustard oil", quantity: "10", unit: "ml" },
      ],
    },
  },
  {
    id: "sug-3",
    name: "Veg Hakka Noodles",
    category: "Veg Main Course",
    confidence: 88,
    reason: "Complements existing Indo-Chinese starters on your menu.",
    draft: {
      name: "Veg Hakka Noodles",
      category: "Veg Main Course",
      menuItem: "Veg Hakka Noodles",
      yieldQty: "1",
      yieldUnit: "portion",
      prepTimeMinutes: "18",
      notes: "High-flame toss; keep veggies crunchy.",
      ingredients: [
        { id: "i1", name: "Hakka noodles", quantity: "120", unit: "g" },
        { id: "i2", name: "Mixed veggies", quantity: "80", unit: "g" },
        { id: "i3", name: "Soy sauce", quantity: "15", unit: "ml" },
        { id: "i4", name: "Cooking oil", quantity: "20", unit: "ml" },
      ],
    },
  },
  {
    id: "sug-4",
    name: "Butter Naan",
    category: "Bread",
    confidence: 86,
    reason: "Pairs with high-volume gravy dishes already on your catalog.",
    draft: {
      name: "Butter Naan",
      category: "Bread",
      menuItem: "Butter Naan",
      yieldQty: "1",
      yieldUnit: "pc",
      prepTimeMinutes: "12",
      notes: "Brush with garlic butter after bake.",
      ingredients: [
        { id: "i1", name: "Maida", quantity: "80", unit: "g" },
        { id: "i2", name: "Curd", quantity: "20", unit: "g" },
        { id: "i3", name: "Butter", quantity: "10", unit: "g" },
        { id: "i4", name: "Yeast", quantity: "2", unit: "g" },
      ],
    },
  },
];

export function ExploreRecipesModal({
  isOpen,
  onClose,
  existingNames,
  onUseSuggestion,
  onAddSelected,
}: {
  isOpen: boolean;
  onClose: () => void;
  existingNames: string[];
  onUseSuggestion: (draft: RecipeFormValues) => void;
  onAddSelected: (drafts: RecipeFormValues[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const existingSet = useMemo(
    () => new Set(existingNames.map((n) => n.toLowerCase())),
    [existingNames],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SUGGESTIONS.filter((s) => {
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.reason.toLowerCase().includes(q)
      );
    });
  }, [query]);

  if (!isOpen) return null;

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleAddSelected = () => {
    const drafts = SUGGESTIONS.filter((s) => selected.includes(s.id)).map((s) => s.draft);
    if (drafts.length === 0) {
      toast.error("Select at least one suggestion");
      return;
    }
    onAddSelected(drafts);
    setSelected([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative z-10 w-full sm:w-[560px] md:w-[42%] lg:w-[35%] xl:w-[30%] min-w-[380px] h-full flex flex-col bg-white shadow-2xl border-l border-slate-200 overflow-hidden animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-linear-to-r from-blue-50 to-teal-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-900">AI Recipe Suggestions</h3>
              <p className="text-[12px] text-slate-600">
                Personalized drafts from your menu mix — review and add to Recipe Management
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/80 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-100 px-5 py-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search suggestions by dish or category..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-teal-500 focus:outline-hidden"
          />
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {filtered.map((sug) => {
            const already = existingSet.has(sug.name.toLowerCase());
            const isChecked = selected.includes(sug.id);
            return (
              <div
                key={sug.id}
                className={`rounded-xl border p-4 transition ${
                  isChecked ? "border-teal-400 bg-teal-50/40" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={already}
                      onChange={() => toggle(sug.id)}
                      className="mt-1 rounded border-slate-300 cursor-pointer disabled:opacity-40"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-[14px] font-bold text-slate-900">{sug.name}</h4>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          {sug.category}
                        </span>
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                          {sug.confidence}% match
                        </span>
                        {already && (
                          <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                            Already in list
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[12.5px] text-slate-600">{sug.reason}</p>
                      <p className="mt-1.5 text-[11.5px] text-slate-500">
                        {sug.draft.ingredients.length} ingredients · ~{sug.draft.prepTimeMinutes}{" "}
                        min prep
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={already}
                    onClick={() => onUseSuggestion(sug.draft)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-[12px] font-bold text-teal-700 hover:bg-teal-50 disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Use & Edit
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-[13px] text-slate-500">
              No suggestions match your search.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 shrink-0">
          <span className="text-[12px] text-slate-500">
            {selected.length} selected · {SUGGESTIONS.length} suggestions
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleAddSelected}
              className="flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 px-4 py-2 text-[13px] font-bold text-white cursor-pointer"
            >
              <Check className="h-4 w-4" />
              Add Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
