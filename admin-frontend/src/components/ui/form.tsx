import * as React from "react";
import { Slot } from "radix-ui";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function Form({
  className,
  ...props
}: React.ComponentProps<"form">) {
  return (
    <form
      data-slot="form"
      className={cn("space-y-6", className)}
      {...props}
    />
  );
}

function FormItem({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-item"
      className={cn("space-y-2", className)}
      {...props}
    />
  );
}

function FormLabel({
  className,
  required = false,
  children,
  ...props
}: React.ComponentProps<typeof Label> & {
  required?: boolean;
}) {
  return (
    <Label
      data-slot="form-label"
      className={cn("text-sm text-foreground", className)}
      {...props}
    >
      {children}
      {required ? (
        <span className="ml-1 text-destructive">*</span>
      ) : null}
    </Label>
  );
}

function FormControl({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="form-control"
      className={cn("space-y-1", className)}
      {...props}
    />
  );
}

function FormDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="form-description"
      className={cn("text-xs leading-5 text-muted-foreground", className)}
      {...props}
    />
  );
}

function FormMessage({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="form-message"
      className={cn("text-xs font-medium text-destructive", className)}
      {...props}
    />
  );
}

export {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
};
