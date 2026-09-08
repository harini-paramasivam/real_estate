import { cn } from "../../../utils/format";
import type { LeadStage } from "../../../types";

const FORWARD_STAGES: LeadStage[] = ["NEW", "CONTACTED", "SITE_VISIT", "INTERESTED", "NEGOTIATION"];

export function LeadStageProgress({ stage }: { stage: LeadStage }) {
  if (stage === "LOST") {
    return (
      <div className="flex items-center gap-2 text-sm text-rust">
        <span className="h-2.5 w-2.5 rounded-full bg-rust" />
        This lead was marked as Lost.
      </div>
    );
  }

  const currentIndex = stage === "BOOKED" ? FORWARD_STAGES.length : FORWARD_STAGES.indexOf(stage);
  const stages = [...FORWARD_STAGES, "BOOKED" as LeadStage];

  return (
    <ol className="flex flex-wrap items-center gap-y-3">
      {stages.map((s, idx) => {
        const isDone = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        return (
          <li key={s} className="flex items-center">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  isCurrent
                    ? "bg-brick text-white"
                    : isDone
                      ? "bg-sage text-white"
                      : "bg-slate-light text-slate",
                )}
              >
                {isDone ? "✓" : idx + 1}
              </span>
              <span className={cn("text-sm", isCurrent ? "font-medium text-ink" : "text-ink-soft")}>
                {s === "SITE_VISIT" ? "Site Visit" : s.charAt(0) + s.slice(1).toLowerCase()}
              </span>
            </div>
            {idx < stages.length - 1 && <span className="mx-3 h-px w-6 bg-border sm:w-10" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
