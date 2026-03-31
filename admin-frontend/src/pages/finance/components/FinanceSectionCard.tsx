import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function FinanceSectionCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card
      className={cn(
        "border border-border/70 bg-card/90 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.85)] backdrop-blur",
        className,
      )}
    >
      <CardHeader className="gap-4 border-b border-border/60 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <p className="font-heading text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              Finance
            </p>
            <CardTitle className="text-lg text-foreground">{title}</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6">
              {description}
            </CardDescription>
          </div>
          {action ? <div className="w-full lg:w-auto">{action}</div> : null}
        </div>
      </CardHeader>
      <CardContent className={cn("pt-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
