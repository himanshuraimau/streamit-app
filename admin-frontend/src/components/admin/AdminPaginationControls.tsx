import { Button } from "@/components/ui/button";

export function AdminPaginationControls({
  page,
  totalPages,
  onPreviousPage,
  onNextPage,
}: {
  page: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-border/60 pt-4 text-xs">
      <p className="text-muted-foreground">
        Page {page} / {Math.max(totalPages, 1)}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPreviousPage}
          disabled={page <= 1}
        >
          Prev
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
