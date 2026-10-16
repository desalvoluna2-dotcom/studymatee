"use client";

import * as Sheet from "@radix-ui/react-dialog";
import * as React from "react";

type ContentProps = React.ComponentProps<typeof Sheet.Content>;
type TitleProps = React.ComponentProps<typeof Sheet.Title>;
type DescriptionProps = React.ComponentProps<typeof Sheet.Description>;
type OverlayProps = React.ComponentProps<typeof Sheet.Overlay>;

const SheetTrigger = Sheet.Trigger;

const SheetContent = React.forwardRef<HTMLDivElement, ContentProps>(
  ({ className, ...props }, ref) => (
    <Sheet.Content
      ref={ref}
      className="fixed z-50 gap-4 border bg-background p-6 shadow-lg outline-none right-0 top-0 h-full w-full sm:max-w-[500px] sm:border-l sm:border-r"
      {...props}
    />
  )
);
SheetContent.displayName = Sheet.Content.displayName;

const SheetHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className="flex flex-col space-y-1.5 text-center sm:text-left" {...props} />
));
SheetHeader.displayName = "SheetHeader";

const SheetTitle = React.forwardRef<HTMLHeadingElement, TitleProps>(
  ({ className, ...props }, ref) => (
    <Sheet.Title
      ref={ref}
      className="text-lg font-semibold leading-none tracking-tight"
      {...props}
    />
  )
);
SheetTitle.displayName = Sheet.Title.displayName;

const SheetDescription = React.forwardRef<HTMLParagraphElement, DescriptionProps>(
  ({ className, ...props }, ref) => (
    <Sheet.Description
      ref={ref}
      className="text-sm text-muted-foreground"
      {...props}
    />
  )
);
SheetDescription.displayName = Sheet.Description.displayName;

const SheetClose = Sheet.Close;

const SheetOverlay = React.forwardRef<HTMLDivElement, OverlayProps>(
  ({ className, ...props }, ref) => (
    <Sheet.Overlay
      ref={ref}
      className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      {...props}
    />
  )
);
SheetOverlay.displayName = Sheet.Overlay.displayName;

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  SheetOverlay,
};
