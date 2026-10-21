import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-0.5 text-[11px] font-medium tracking-[0.06em] uppercase backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-border bg-secondary text-foreground hover:bg-secondary/80",
        secondary:
          "border-border/60 bg-muted/60 text-muted-foreground hover:bg-muted",
        destructive:
          "border-destructive/30 bg-destructive/15 text-destructive-foreground shadow hover:bg-destructive/25",
        outline: "border-border text-foreground hover:bg-accent",
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
