"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as React from "react";

type ContentProps = React.ComponentProps<typeof DropdownMenu.Content>;
type ItemProps = React.ComponentProps<typeof DropdownMenu.Item>;
type SeparatorProps = React.ComponentProps<typeof DropdownMenu.Separator>;
type GroupProps = React.ComponentProps<typeof DropdownMenu.Group>;
type LabelProps = React.ComponentProps<typeof DropdownMenu.Label>;
type CheckboxItemProps = React.ComponentProps<typeof DropdownMenu.CheckboxItem>;

const DropdownMenuTrigger = DropdownMenu.Trigger;

const DropdownMenuContent = React.forwardRef<HTMLDivElement, ContentProps>(
  ({ className, ...props }, ref) => (
    <DropdownMenu.Content
      ref={ref}
      className="w-60 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
      {...props}
    />
  )
);
DropdownMenuContent.displayName = DropdownMenu.Content.displayName;

const DropdownMenuItem = React.forwardRef<HTMLDivElement, ItemProps>(
  ({ className, ...props }, ref) => (
    <DropdownMenu.Item
      ref={ref}
      className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
      {...props}
    />
  )
);
DropdownMenuItem.displayName = DropdownMenu.Item.displayName;

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, ...props }, ref) => (
    <DropdownMenu.Separator
      ref={ref}
      className="-mx-1 my-1 h-px bg-muted"
      {...props}
    />
  )
);
DropdownMenuSeparator.displayName = DropdownMenu.Separator.displayName;

const DropdownMenuGroup = React.forwardRef<HTMLDivElement, GroupProps>(
  ({ className, ...props }, ref) => (
    <DropdownMenu.Group
      ref={ref}
      className="px-2 py-1 text-xs font-semibold text-muted-foreground"
      {...props}
    />
  )
);
DropdownMenuGroup.displayName = DropdownMenu.Group.displayName;

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <DropdownMenu.Label
      ref={ref}
      className="px-3 py-1 text-sm font-semibold text-muted-foreground"
      {...props}
    />
  )
);
DropdownMenuLabel.displayName = DropdownMenu.Label.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  CheckboxItemProps
>(({ className, ...props }, ref) => (
  <DropdownMenu.CheckboxItem
    ref={ref}
    className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
    {...props}
  />
));
DropdownMenuCheckboxItem.displayName = DropdownMenu.CheckboxItem.displayName;

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
};
