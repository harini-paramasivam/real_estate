import { LEAD_STAGE_LABELS } from "../../../constants";
import type { DashboardSummary } from "../../../types";

export function PipelineChart({ pipeline }: { pipeline: DashboardSummary["pipeline"] }) {
  const max = Math.max(1, ...pipeline.map((p) => p.count));

  return (
    <div className="space-y-3">
      {pipeline.map((stage) => (
        <div key={stage.stage} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-sm text-ink-soft">
            {LEAD_STAGE_LABELS[stage.stage as keyof typeof LEAD_STAGE_LABELS] ?? stage.stage}
          </span>
          <div className="h-2.5 flex-1 rounded-full bg-slate-light">
            <div
              className="h-2.5 rounded-full bg-brick"
              style={{ width: `${(stage.count / max) * 100}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-sm font-medium text-ink">{stage.count}</span>
        </div>
      ))}
    </div>
  );
}
