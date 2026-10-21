import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.22,0.61,0.36,1)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-primary text-primary-foreground shadow-[0_0_20px_-3px_rgba(255,255,255,0.2)] hover:bg-primary/90 hover:shadow-[0_0_24px_-2px_rgba(255,255,255,0.3)]",
        destructive:
          "rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "rounded-full border border-white/15 bg-transparent hover:bg-white/[0.08] hover:border-white/30 text-foreground",
        secondary:
          "rounded-full border border-white/10 bg-white/[0.06] hover:bg-white/[0.12] hover:border-white/20 text-foreground backdrop-blur-md",
        ghost: "rounded-xl hover:bg-white/[0.08] hover:text-foreground text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-5 py-2 text-xs md:text-sm",
        sm: "h-8 rounded-full px-3.5 text-xs",
        lg: "h-11 rounded-full px-7 text-sm font-medium",
        icon: "size-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
