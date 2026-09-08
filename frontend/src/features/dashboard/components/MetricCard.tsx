export function MetricCard({ label, value, accent }: { label: string; value: number | string; accent?: "brick" | "sage" }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-sm text-ink-soft">{label}</p>
      <p
        className={`mt-2 font-display text-3xl font-medium ${
          accent === "sage" ? "text-sage" : accent === "brick" ? "text-brick" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
