import { useQuery } from "@tanstack/react-query";
import { usePageTitle } from "../app/providers/PageTitleProvider";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { ErrorState, TableSkeleton } from "../components/feedback/States";
import { fetchUsers } from "../features/users/api/usersApi";
import { QUERY_KEYS } from "../constants";
import { formatDate, initials } from "../utils/format";

export default function UsersPage() {
  usePageTitle("Sales Team");
  const usersQuery = useQuery({ queryKey: QUERY_KEYS.users, queryFn: fetchUsers });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-medium text-ink">Sales Team</h2>
        <p className="mt-1 text-sm text-ink-soft">Everyone with access to the CRM.</p>
      </div>

      <Card>
        {usersQuery.isLoading ? (
          <TableSkeleton cols={3} />
        ) : usersQuery.isError ? (
          <ErrorState title="Unable to load the sales team." onRetry={() => usersQuery.refetch()} />
        ) : (
          <ul className="divide-y divide-border">
            {usersQuery.data?.map((member) => (
              <li key={member.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brick-light text-sm font-medium text-brick-dark">
                    {initials(member.name)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{member.name}</p>
                    <p className="text-xs text-ink-soft">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    bg={member.role === "ADMIN" ? "bg-brick-light" : "bg-slate-light"}
                    text={member.role === "ADMIN" ? "text-brick-dark" : "text-slate"}
                  >
                    {member.role === "ADMIN" ? "Admin" : "Sales Employee"}
                  </Badge>
                  <span className="hidden text-xs text-ink-soft sm:block">
                    Joined {formatDate(member.created_at)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
