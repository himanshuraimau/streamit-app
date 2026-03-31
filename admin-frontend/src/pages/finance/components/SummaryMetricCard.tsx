import { Card, CardContent } from "@/components/ui/card";

export function SummaryMetricCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <Card
      size="sm"
      className="border border-border/60 bg-background/45 shadow-none"
    >
      <CardContent className="space-y-2 pt-4">
        <p className="font-heading text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
        {caption ? (
          <p className="text-sm text-muted-foreground">{caption}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
