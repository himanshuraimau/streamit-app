import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

import type { AdminNoticeState } from "./types";

export function AdminNotice({
  notice,
}: {
  notice: AdminNoticeState | null;
}) {
  if (!notice) {
    return null;
  }

  const isError = notice.tone === "error";

  return (
    <Alert
      variant={isError ? "destructive" : "default"}
      className={cn(
        "border-border/70 bg-background/60",
        !isError && "border-emerald-500/25 bg-emerald-500/5 text-emerald-50",
      )}
    >
      <AlertTitle>{notice.title}</AlertTitle>
      {notice.description ? (
        <AlertDescription
          className={cn(!isError && "text-emerald-100/80")}
        >
          {notice.description}
        </AlertDescription>
      ) : null}
    </Alert>
  );
}
