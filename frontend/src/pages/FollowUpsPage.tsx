import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { usePageTitle } from "../app/providers/PageTitleProvider";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { EmptyState, ErrorState } from "../components/feedback/States";
import { fetchFollowUps } from "../features/dashboard/api/dashboardApi";
import { QUERY_KEYS } from "../constants";
import { formatDate } from "../utils/format";
import type { FollowUpItem } from "../types";

const BUCKETS: { key: FollowUpItem["bucket"]; label: string; accentClass: string }[] = [
  { key: "OVERDUE", label: "Overdue", accentClass: "text-rust" },
  { key: "TODAY", label: "Today", accentClass: "text-brick" },
  { key: "TOMORROW", label: "Tomorrow", accentClass: "text-amber" },
  { key: "UPCOMING", label: "Upcoming", accentClass: "text-ink-soft" },
];

export default function FollowUpsPage() {
  usePageTitle("Follow-ups");
  const followUpsQuery = useQuery({ queryKey: QUERY_KEYS.dashboardFollowUps, queryFn: fetchFollowUps });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-medium text-ink">Follow-ups</h2>
        <p className="mt-1 text-sm text-ink-soft">Stay on top of every scheduled customer touchpoint.</p>
      </div>

      {followUpsQuery.isLoading ? (
        <p className="text-sm text-ink-soft">Loading follow-ups…</p>
      ) : followUpsQuery.isError ? (
        <ErrorState title="Unable to load follow-ups." onRetry={() => followUpsQuery.refetch()} />
      ) : !followUpsQuery.data || followUpsQuery.data.length === 0 ? (
        <EmptyState title="No follow-ups scheduled." description="Set a next follow-up date on a lead to see it here." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {BUCKETS.map((bucket) => {
            const items = followUpsQuery.data.filter((f) => f.bucket === bucket.key);
            return (
              <Card key={bucket.key}>
                <CardHeader className="flex items-center justify-between">
                  <h3 className={`font-display text-base font-medium ${bucket.accentClass}`}>{bucket.label}</h3>
                  <span className="text-sm text-ink-soft">{items.length}</span>
                </CardHeader>
                <CardBody className="p-0">
                  {items.length === 0 ? (
                    <p className="p-5 text-sm text-ink-soft">Nothing here.</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {items.map((item) => (
                        <li key={item.lead_id} className="flex items-center justify-between px-5 py-3">
                          <Link to={`/leads/${item.lead_id}`} className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink hover:underline">{item.lead_name}</p>
                            <p className="text-xs text-ink-soft">
                              {item.phone} · {item.assigned_to_name ?? "Unassigned"}
                            </p>
                          </Link>
                          <span className={`shrink-0 text-xs font-medium ${bucket.accentClass}`}>
                            {formatDate(item.next_follow_up)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
