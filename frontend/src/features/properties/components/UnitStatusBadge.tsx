import { Badge } from "../../../components/ui/Badge";
import { UNIT_STATUS_BADGE } from "../../../constants";
import type { UnitStatus } from "../../../types";

const LABELS: Record<UnitStatus, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  BOOKED: "Booked",
};

export function UnitStatusBadge({ status }: { status: UnitStatus }) {
  const style = UNIT_STATUS_BADGE[status];
  return (
    <Badge bg={style.bg} text={style.text}>
      {LABELS[status]}
    </Badge>
  );
}
