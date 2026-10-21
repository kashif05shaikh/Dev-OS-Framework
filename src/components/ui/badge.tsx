import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-0.5 text-[11px] font-medium tracking-[0.06em] uppercase backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-white/15 bg-white/[0.08] text-foreground hover:bg-white/[0.12]",
        secondary:
          "border-white/10 bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08]",
        destructive:
          "border-destructive/30 bg-destructive/15 text-destructive-foreground shadow hover:bg-destructive/25",
        outline: "border-border text-foreground hover:bg-white/[0.05]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
