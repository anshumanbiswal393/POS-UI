import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

export interface StockDeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  itemName?: string;
  onConfirm: () => void;
}

export function StockDeleteConfirmModal({
  open,
  onOpenChange,
  title = "Confirm Deletion",
  description,
  itemName,
  onConfirm,
}: StockDeleteConfirmModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl max-w-md bg-white border border-slate-200 p-6 shadow-xl">
        <AlertDialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <Trash2 className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-[16px] font-bold text-slate-900">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-[13px] text-slate-600 leading-relaxed pt-1">
            {description || (
              <>
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-slate-900">"{itemName || "this item"}"</span>? This action cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-5 flex items-center justify-end gap-2">
          <AlertDialogCancel className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
              onOpenChange(false);
            }}
            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 shadow-xs"
          >
            Delete Permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
