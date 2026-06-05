import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * shadcn/ui-style button. Variants map to the design tokens in
 * `tailwind.config.js`; reach for `className` only for genuine one-offs
 * (e.g. the floating pill or `flex-1` toggles).
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        destructive:
          "bg-destructive/20 text-destructive hover:bg-destructive/30",
        warning: "bg-warning/15 text-warning hover:bg-warning/25",
        ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
        link: "text-muted-foreground hover:text-foreground",
      },
      size: {
        sm: "px-2.5 py-1 text-xs",
        md: "px-3 py-1.5 text-sm",
        icon: "p-1",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
