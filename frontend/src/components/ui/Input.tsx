import { type InputHTMLAttributes, type LabelHTMLAttributes, forwardRef } from "react";
import { cn } from "../../utils/format";

export const Label = ({ className, children, ...props }: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("mb-1.5 block text-sm font-medium text-ink", className)} {...props}>
    {children}
  </label>
);

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, hasError, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full rounded-md border bg-white px-3 py-2 text-sm text-ink placeholder:text-slate",
      "focus:outline-none focus:ring-2 focus:ring-brick/40 focus:border-brick",
      hasError ? "border-rust" : "border-border",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-sm text-rust">
      {message}
    </p>
  );
};

export const RequiredMark = () => (
  <span className="text-rust" aria-hidden="true">
    {" "}
    *
  </span>
);
