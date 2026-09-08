import { useQuery } from "@tanstack/react-query";
import { usePageTitle } from "../app/providers/PageTitleProvider";
import { useAuth } from "../app/providers/AuthProvider";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { EmptyState, ErrorState, TableSkeleton } from "../components/feedback/States";
import { fetchBookings } from "../features/bookings/api/bookingsApi";
import { QUERY_KEYS } from "../constants";
import { formatCurrency, formatDateTime } from "../utils/format";

export default function BookingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  usePageTitle(isAdmin ? "Bookings" : "My Bookings");

  const bookingsQuery = useQuery({ queryKey: QUERY_KEYS.bookings, queryFn: fetchBookings });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-medium text-ink">{isAdmin ? "Bookings" : "My Bookings"}</h2>
        <p className="mt-1 text-sm text-ink-soft">Complete history of confirmed unit bookings.</p>
      </div>

      <Card>
        {bookingsQuery.isLoading ? (
          <TableSkeleton />
        ) : bookingsQuery.isError ? (
          <ErrorState title="Unable to load bookings." onRetry={() => bookingsQuery.refetch()} />
        ) : bookingsQuery.data && bookingsQuery.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Unit</th>
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Sales Employee</th>
                  <th className="px-5 py-3 font-medium">Booking Date</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookingsQuery.data.map((booking) => (
                  <tr key={booking.id} className="hover:bg-canvas/60">
                    <td className="px-5 py-3 font-medium text-ink">{booking.lead_name}</td>
                    <td className="px-5 py-3 text-ink-soft">{booking.unit_number}</td>
                    <td className="px-5 py-3 text-ink-soft">{booking.project_name}</td>
                    <td className="px-5 py-3 text-ink-soft">{formatCurrency(booking.price)}</td>
                    <td className="px-5 py-3 text-ink-soft">{booking.booked_by_name ?? "—"}</td>
                    <td className="px-5 py-3 text-ink-soft">{formatDateTime(booking.booking_date)}</td>
                    <td className="px-5 py-3">
                      <Badge
                        bg={booking.status === "CONFIRMED" ? "bg-sage-light" : "bg-rust-light"}
                        text={booking.status === "CONFIRMED" ? "text-sage" : "text-rust"}
                      >
                        {booking.status === "CONFIRMED" ? "Confirmed" : "Cancelled"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No bookings yet." description="Bookings will appear here once units are booked." />
        )}
      </Card>
    </div>
  );
}
