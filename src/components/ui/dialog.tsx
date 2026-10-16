"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as React from "react";

type DialogContentProps = React.ComponentProps<typeof Dialog.Content>;
type DialogDescriptionProps = React.ComponentProps<typeof Dialog.Description>;
type DialogTitleProps = React.ComponentProps<typeof Dialog.Title>;
type DialogOverlayProps = React.ComponentProps<typeof Dialog.Overlay>;

const DialogTrigger = Dialog.Trigger;

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, ...props }, ref) => (
    <Dialog.Content
      ref={ref}
      className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg outline-none sm:rounded-lg"
      {...props}
    />
  )
);
DialogContent.displayName = Dialog.Content.displayName;

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  DialogDescriptionProps
>(({ className, ...props }, ref) => (
  <Dialog.Description
    ref={ref}
    className="text-sm text-muted-foreground"
    {...props}
  />
));
DialogDescription.displayName = Dialog.Description.displayName;

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, ...props }, ref) => (
    <Dialog.Title
      ref={ref}
      className="text-xl font-semibold leading-none tracking-tight"
      {...props}
    />
  )
);
DialogTitle.displayName = Dialog.Title.displayName;

const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className="flex flex-row-reverse space-x-2" {...props} />
));
DialogFooter.displayName = "DialogFooter";

const DialogClose = Dialog.Close;

const DialogOverlay = React.forwardRef<HTMLDivElement, DialogOverlayProps>(
  ({ className, ...props }, ref) => (
    <Dialog.Overlay
      ref={ref}
      className="fixed inset-0 z-50 bg-black/80 outline-none"
      {...props}
    />
  )
);
DialogOverlay.displayName = Dialog.Overlay.displayName;

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogOverlay,
};
