"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
  className?: string;
}

const Separator = React.forwardRef<HTMLHRElement, SeparatorProps>(
  ({ orientation = "horizontal", decorative = false, className, ...props }, ref) => {
    return (
      <hr
        ref={ref}
        aria-orientation={orientation}
        aria-hidden={decorative}
        className={cn(
          "relative flex w-full shrink-0 border-y border-input",
          orientation === "horizontal" ? "h-[1px]" : "w-[1px] shrink-0",
          className
        )}
        {...props}
      />
    );
  }
);
Separator.displayName = "Separator";

export { Separator };
