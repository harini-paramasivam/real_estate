import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { usePageTitle } from "../app/providers/PageTitleProvider";
import { useAuth } from "../app/providers/AuthProvider";
import { fetchDashboardSummary, fetchFollowUps, fetchRecentBookings } from "../features/dashboard/api/dashboardApi";
import { MetricCard } from "../features/dashboard/components/MetricCard";
import { PipelineChart } from "../features/dashboard/components/PipelineChart";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { CardSkeleton, ErrorState } from "../components/feedback/States";
import { QUERY_KEYS } from "../constants";
import { formatDate } from "../utils/format";

export default function DashboardPage() {
  usePageTitle("Dashboard");
  const { user } = useAuth();

  const summaryQuery = useQuery({ queryKey: QUERY_KEYS.dashboardSummary, queryFn: fetchDashboardSummary });
  const followUpsQuery = useQuery({ queryKey: QUERY_KEYS.dashboardFollowUps, queryFn: fetchFollowUps });
  const bookingsQuery = useQuery({ queryKey: QUERY_KEYS.dashboardRecentBookings, queryFn: fetchRecentBookings });

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-medium text-ink">
          {greeting}, {user?.name.split(" ")[0]}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">Here's your sales overview.</p>
      </div>

      {summaryQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : summaryQuery.isError || !summaryQuery.data ? (
        <ErrorState onRetry={() => summaryQuery.refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard label="Total Leads" value={summaryQuery.data.total_leads} />
            <MetricCard label="Active Leads" value={summaryQuery.data.active_leads} accent="brick" />
            <MetricCard label="Today's Follow-ups" value={summaryQuery.data.todays_follow_ups} />
            <MetricCard label="Upcoming Follow-ups" value={summaryQuery.data.upcoming_follow_ups} />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard label="Total Bookings" value={summaryQuery.data.total_bookings} accent="sage" />
            <MetricCard label="Available Units" value={summaryQuery.data.available_units} accent="sage" />
            <MetricCard label="Booked Units" value={summaryQuery.data.booked_units} />
          </div>

          <Card>
            <CardHeader>
              <h3 className="font-display text-base font-medium text-ink">Lead Pipeline</h3>
            </CardHeader>
            <CardBody>
              <PipelineChart pipeline={summaryQuery.data.pipeline} />
            </CardBody>
          </Card>
        </>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-display text-base font-medium text-ink">Upcoming Follow-ups</h3>
            <Link to="/follow-ups" className="text-sm font-medium text-brick hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {followUpsQuery.isLoading ? (
              <div className="p-5 text-sm text-ink-soft">Loading…</div>
            ) : followUpsQuery.data && followUpsQuery.data.length > 0 ? (
              <ul className="divide-y divide-border">
                {followUpsQuery.data.slice(0, 5).map((item) => (
                  <li key={item.lead_id} className="flex items-center justify-between px-5 py-3">
                    <Link to={`/leads/${item.lead_id}`} className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink hover:underline">{item.lead_name}</p>
                      <p className="text-xs text-ink-soft">{item.assigned_to_name ?? "Unassigned"}</p>
                    </Link>
                    <span
                      className={`shrink-0 text-xs font-medium ${
                        item.bucket === "OVERDUE" ? "text-rust" : "text-ink-soft"
                      }`}
                    >
                      {formatDate(item.next_follow_up)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-5 text-sm text-ink-soft">No upcoming follow-ups.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-display text-base font-medium text-ink">Recent Bookings</h3>
            <Link to="/bookings" className="text-sm font-medium text-brick hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {bookingsQuery.isLoading ? (
              <div className="p-5 text-sm text-ink-soft">Loading…</div>
            ) : bookingsQuery.data && bookingsQuery.data.length > 0 ? (
              <ul className="divide-y divide-border">
                {bookingsQuery.data.slice(0, 5).map((item) => (
                  <li key={item.booking_id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{item.lead_name}</p>
                      <p className="text-xs text-ink-soft">
                        {item.unit_number} · {item.project_name}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-ink-soft">
                      {formatDate(item.booking_date)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-5 text-sm text-ink-soft">No bookings yet.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
