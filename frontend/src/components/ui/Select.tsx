import { type SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "../../utils/format";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, hasError, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-md border bg-white px-3 py-2 text-sm text-ink",
        "focus:outline-none focus:ring-2 focus:ring-brick/40 focus:border-brick",
        hasError ? "border-rust" : "border-border",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
