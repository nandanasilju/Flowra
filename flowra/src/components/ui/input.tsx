import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-md border border-sand-200 bg-white px-3 text-base text-sand-800 placeholder:text-sand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-500 disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
