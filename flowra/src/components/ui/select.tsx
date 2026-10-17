import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full rounded-md border border-sand-200 bg-white px-3 text-base text-sand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500",
        className,
      )}
      {...props}
    />
  ),
);
Select.displayName = "Select";
