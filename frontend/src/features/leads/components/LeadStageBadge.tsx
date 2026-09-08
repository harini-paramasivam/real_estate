import { Badge } from "../../../components/ui/Badge";
import { LEAD_STAGE_BADGE, LEAD_STAGE_LABELS } from "../../../constants";
import type { LeadStage } from "../../../types";

export function LeadStageBadge({ stage }: { stage: LeadStage }) {
  const style = LEAD_STAGE_BADGE[stage];
  return (
    <Badge bg={style.bg} text={style.text}>
      {LEAD_STAGE_LABELS[stage]}
    </Badge>
  );
}
