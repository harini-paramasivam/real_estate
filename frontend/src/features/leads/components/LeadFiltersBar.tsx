import { LEAD_STAGES, LEAD_STAGE_LABELS } from "../../../constants";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import type { User } from "../../../types";
import type { LeadFilters } from "../api/leadsApi";

interface LeadFiltersBarProps {
  filters: LeadFilters;
  onChange: (filters: LeadFilters) => void;
  employees: User[];
  showAssigneeFilter: boolean;
}

export function LeadFiltersBar({ filters, onChange, employees, showAssigneeFilter }: LeadFiltersBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="sm:w-64">
        <Input
          placeholder="Search by name, phone, or email"
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value, page: 1 })}
          aria-label="Search leads"
        />
      </div>
      <div className="sm:w-44">
        <Select
          value={filters.stage ?? ""}
          onChange={(e) => onChange({ ...filters, stage: e.target.value || undefined, page: 1 })}
          aria-label="Filter by stage"
        >
          <option value="">All stages</option>
          {LEAD_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {LEAD_STAGE_LABELS[stage]}
            </option>
          ))}
        </Select>
      </div>
      {showAssigneeFilter && (
        <div className="sm:w-48">
          <Select
            value={filters.assigned_to ?? ""}
            onChange={(e) =>
              onChange({ ...filters, assigned_to: e.target.value ? Number(e.target.value) : undefined, page: 1 })
            }
            aria-label="Filter by assigned employee"
          >
            <option value="">All employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div className="sm:w-44">
        <Select
          value={filters.follow_up ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              follow_up: (e.target.value || undefined) as LeadFilters["follow_up"],
              page: 1,
            })
          }
          aria-label="Filter by follow-up"
        >
          <option value="">All follow-ups</option>
          <option value="overdue">Overdue</option>
          <option value="today">Today</option>
          <option value="upcoming">Upcoming</option>
        </Select>
      </div>
    </div>
  );
}
