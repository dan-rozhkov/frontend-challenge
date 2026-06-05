import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

/**
 * shadcn/ui tooltip, built on `@radix-ui/react-tooltip` exactly as upstream
 * does — same composition (`TooltipProvider` › `Tooltip` › `TooltipTrigger` +
 * `TooltipContent`) and the same Radix positioning/intent behaviour, so every
 * instance behaves identically.
 *
 * The only local adaptation: shadcn's stock animation classes come from the
 * `tailwindcss-animate` plugin, which isn't installed here. We map Radix's
 * `data-[state]` / `data-[side]` attributes onto the `tooltip-in`/`tooltip-out`
 * keyframes already defined in `tailwind.config.js`, gated behind `motion-safe`
 * to honour `prefers-reduced-motion`.
 */

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-fit max-w-xs origin-[--radix-tooltip-content-transform-origin] rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md",
        "motion-safe:data-[state=delayed-open]:animate-tooltip-in",
        "motion-safe:data-[state=instant-open]:animate-tooltip-in",
        "motion-safe:data-[state=closed]:animate-tooltip-out",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
