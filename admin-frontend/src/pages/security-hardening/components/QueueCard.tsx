import type { AlertStatus } from "../types";

interface QueueCardProps {
  label: string;
  status: AlertStatus;
}

export function QueueCard({ label, status }: QueueCardProps) {
  const toneClass = status.isBreached
    ? "border-rose-400/35 bg-rose-500/10"
    : "border-emerald-400/30 bg-emerald-500/10";

  return (
    <article className={`rounded-xl border p-3 ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{status.count.toLocaleString()}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Threshold {status.threshold.toLocaleString()} • {status.isBreached ? "Alerting" : "Within range"}
      </p>
    </article>
  );
}
