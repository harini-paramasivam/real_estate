import type { ReactNode } from "react";
import { cn } from "../../utils/format";

export function Badge({
  bg,
  text,
  children,
  className,
}: {
  bg: string;
  text: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        bg,
        text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", text.replace("text-", "bg-"))} aria-hidden="true" />
      {children}
    </span>
  );
}
