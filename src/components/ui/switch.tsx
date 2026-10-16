"use client";

import * as Switch from "@radix-ui/react-switch";
import * as React from "react";

type RootProps = React.ComponentProps<typeof Switch.Root>;
type ThumbProps = React.ComponentProps<typeof Switch.Thumb>;

const SwitchRoot = React.forwardRef<HTMLButtonElement, RootProps>(
  ({ className, ...props }, ref) => (
    <Switch.Root
      ref={ref}
      className="inline-flex h-[19px] w-[34px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
      {...props}
    />
  )
);
SwitchRoot.displayName = Switch.Root.displayName;

const SwitchThumb = React.forwardRef<HTMLSpanElement, ThumbProps>(
  ({ className, ...props }, ref) => (
    <Switch.Thumb
      ref={ref}
      className="block h-[13px] w-[13px] rounded-full bg-background shadow ring-0 transition-transform data-[state=checked]:translate-x-full data-[state=unchecked]:translate-x-0"
      {...props}
    />
  )
);
SwitchThumb.displayName = Switch.Thumb.displayName;

export { SwitchRoot as Switch, SwitchThumb };
