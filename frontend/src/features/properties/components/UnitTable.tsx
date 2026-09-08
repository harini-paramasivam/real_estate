import { UnitStatusBadge } from "./UnitStatusBadge";
import { Button } from "../../../components/ui/Button";
import { UNIT_TYPE_LABELS } from "../../../constants";
import type { Unit } from "../../../types";
import { formatCurrency } from "../../../utils/format";

interface UnitTableProps {
  units: Unit[];
  onBook: (unit: Unit) => void;
  canBook: boolean;
}

export function UnitTable({ units, onBook, canBook }: UnitTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-ink-soft">
            <th className="px-5 py-3 font-medium">Unit</th>
            <th className="px-5 py-3 font-medium">Type</th>
            <th className="px-5 py-3 font-medium">Price</th>
            <th className="px-5 py-3 font-medium">Status</th>
            {canBook && <th className="px-5 py-3 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {units.map((unit) => (
            <tr key={unit.id} className="hover:bg-canvas/60">
              <td className="px-5 py-3 font-medium text-ink">{unit.unit_number}</td>
              <td className="px-5 py-3 text-ink-soft">{UNIT_TYPE_LABELS[unit.unit_type]}</td>
              <td className="px-5 py-3 text-ink-soft">{formatCurrency(unit.price)}</td>
              <td className="px-5 py-3">
                <UnitStatusBadge status={unit.status} />
              </td>
              {canBook && (
                <td className="px-5 py-3">
                  {unit.status === "AVAILABLE" ? (
                    <Button size="sm" onClick={() => onBook(unit)}>
                      Book Unit
                    </Button>
                  ) : (
                    <span className="text-xs text-ink-soft">Not available</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
