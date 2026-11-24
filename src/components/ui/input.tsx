import * as React from "react";
import { cn } from "@/lib/utils";
import { toTitleCase, isExcludedFromTitleCase } from "@/utils/textUtils";

export interface InputProps extends React.ComponentProps<"input"> {
  disableTitleCase?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onChange, disableTitleCase, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (
        !disableTitleCase &&
        !isExcludedFromTitleCase(
          type,
          props.name,
          props.id,
          props.placeholder,
          (props as any)["data-no-title-case"] || (props as any)["data-pos-search"] !== undefined,
        )
      ) {
        const raw = e.target.value;
        const formatted = toTitleCase(raw);
        if (formatted !== raw) {
          const cursor = e.target.selectionStart;
          e.target.value = formatted;
          if (cursor !== null && e.target.setSelectionRange) {
            requestAnimationFrame(() => {
              try {
                e.target.setSelectionRange(cursor, cursor);
              } catch {}
            });
          }
        }
      }
      onChange?.(e);
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-surface px-3 py-1 text-base text-foreground shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-foreground placeholder:text-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 md:text-sm",
          className,
        )}
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
