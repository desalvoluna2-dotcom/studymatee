"use client";

import * as Select from "@radix-ui/react-select";
import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof Select.Trigger>,
  Select.SelectTriggerProps
>(({ className, ...props }, ref) => (
  <Select.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  />
));
SelectTrigger.displayName = Select.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof Select.Content>,
  Select.SelectContentProps
>(({ className, children, ...props }, ref) => (
  <Select.Portal>
    <Select.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-input bg-background text-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    >
      <Select.ScrollUpButton className="flex cursor-default items-center justify-center py-1.5" />
      <Select.Viewport
        className={cn(
          "p-2",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        )}
      >
        {children}
      </Select.Viewport>
      <Select.ScrollDownButton className="flex cursor-default items-center justify-center py-1.5" />
    </Select.Content>
  </Select.Portal>
));
SelectContent.displayName = Select.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof Select.Item>,
  Select.SelectItemProps
>(({ className, children, ...props }, ref) => (
  <Select.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <Select.ItemIndicator>
        <Check className="fill-current text-[10px]" />
      </Select.ItemIndicator>
    </span>
    <Select.ItemText>{children}</Select.ItemText>
  </Select.Item>
));
SelectItem.displayName = Select.Item.displayName;

const SelectGroup = React.forwardRef<
  React.ElementRef<typeof Select.Group>,
  Select.SelectGroupProps
>(({ className, children, ...props }, ref) => (
  <Select.Group
    ref={ref}
    className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)}
    {...props}
  >
    {children}
  </Select.Group>
));
SelectGroup.displayName = Select.Group.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof Select.Separator>,
  Select.SelectSeparatorProps
>(({ className, ...props }, ref) => (
  <Select.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = Select.Separator.displayName;

const SelectValue = React.forwardRef<
  React.ElementRef<typeof Select.Value>,
  Select.SelectValueProps
>(({ className, children, ...props }, ref) => (
  <Select.Value
    ref={ref}
    className={cn("line-clamp-1", className)}
    {...props}
  >
    {children}
  </Select.Value>
));
SelectValue.displayName = Select.Value.displayName;

export {
  Select,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectContent,
  SelectValue,
};
