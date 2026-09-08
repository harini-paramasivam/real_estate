import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import type { Booking } from "../../../types";
import { formatCurrency, formatDateTime } from "../../../utils/format";

export function BookingSuccessModal({
  booking,
  onClose,
}: {
  booking: Booking | null;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={!!booking} onClose={onClose} title="Booking Confirmed" widthClassName="max-w-md">
      {booking && (
        <div>
          <div className="mb-4 flex items-center gap-3 rounded-md border border-sage/30 bg-sage-light px-4 py-3 text-sage">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-white">
              ✓
            </span>
            <p className="text-sm font-medium">The unit has been booked successfully.</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-ink-soft">Lead</dt>
            <dd className="text-right font-medium text-ink">{booking.lead_name}</dd>
            <dt className="text-ink-soft">Unit</dt>
            <dd className="text-right font-medium text-ink">{booking.unit_number}</dd>
            <dt className="text-ink-soft">Amount</dt>
            <dd className="text-right font-medium text-ink">{formatCurrency(booking.price)}</dd>
            <dt className="text-ink-soft">Booked By</dt>
            <dd className="text-right font-medium text-ink">{booking.booked_by_name ?? "—"}</dd>
            <dt className="text-ink-soft">Date</dt>
            <dd className="text-right font-medium text-ink">{formatDateTime(booking.booking_date)}</dd>
          </dl>
          <div className="mt-5 flex justify-end">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
