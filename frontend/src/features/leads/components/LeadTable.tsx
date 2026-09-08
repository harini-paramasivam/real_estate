import { Link } from "react-router-dom";
import { LeadStageBadge } from "./LeadStageBadge";
import type { Lead } from "../../../types";
import { formatDate } from "../../../utils/format";

export function LeadTable({ leads }: { leads: Lead[] }) {
  return (
    <>
      {/* Mobile: stacked cards to avoid an overly wide table */}
      <ul className="divide-y divide-border sm:hidden">
        {leads.map((lead) => (
          <li key={lead.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link to={`/leads/${lead.id}`} className="font-medium text-ink hover:underline">
                  {lead.name}
                </Link>
                <p className="text-xs text-ink-soft">{lead.phone}</p>
              </div>
              <LeadStageBadge stage={lead.stage} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-ink-soft">
              <span>{lead.assigned_to_user?.name ?? "Unassigned"}</span>
              <span>Follow-up: {formatDate(lead.next_follow_up)}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop/tablet: full table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-5 py-3 font-medium">Lead</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Stage</th>
              <th className="px-5 py-3 font-medium">Assigned To</th>
              <th className="px-5 py-3 font-medium">Next Follow-up</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-canvas/60">
                <td className="px-5 py-3">
                  <p className="font-medium text-ink">{lead.name}</p>
                  <p className="text-xs text-ink-soft">{lead.email ?? "No email"}</p>
                </td>
                <td className="px-5 py-3 text-ink-soft">{lead.phone}</td>
                <td className="px-5 py-3">
                  <LeadStageBadge stage={lead.stage} />
                </td>
                <td className="px-5 py-3 text-ink-soft">{lead.assigned_to_user?.name ?? "Unassigned"}</td>
                <td className="px-5 py-3 text-ink-soft">{formatDate(lead.next_follow_up)}</td>
                <td className="px-5 py-3 text-ink-soft">{formatDate(lead.created_at)}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-3">
                    <Link to={`/leads/${lead.id}`} className="font-medium text-brick hover:underline">
                      View
                    </Link>
                    <Link to={`/leads/${lead.id}?edit=1`} className="font-medium text-ink-soft hover:underline">
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
