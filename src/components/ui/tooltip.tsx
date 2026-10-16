"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import * as React from "react";

type ContentProps = React.ComponentProps<typeof Tooltip.Content>;

const TooltipProvider = Tooltip.Provider;
const TooltipTrigger = Tooltip.Trigger;

const TooltipContent = React.forwardRef<HTMLDivElement, ContentProps>(
  ({ className, ...props }, ref) => (
    <Tooltip.Content
      ref={ref}
      className="relative z-50 rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
      {...props}
    />
  )
);
TooltipContent.displayName = Tooltip.Content.displayName;

export { TooltipProvider, TooltipTrigger, TooltipContent };
