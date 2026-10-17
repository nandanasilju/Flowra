import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", {
  variants: {
    variant: {
      default: "bg-plum-50 text-plum-700",
      teal: "bg-teal-50 text-teal-700",
      neutral: "bg-sand-100 text-sand-800",
      warning: "bg-amber-50 text-amber-900",
      danger: "bg-red-50 text-red-800",
      sponsored: "bg-sand-800 text-white",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
