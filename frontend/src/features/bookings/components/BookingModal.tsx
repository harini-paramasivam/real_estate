import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { fetchLeads } from "../../leads/api/leadsApi";
import { createBooking } from "../api/bookingsApi";
import { useAuth } from "../../../app/providers/AuthProvider";
import { extractErrorMessage } from "../../../services/apiClient";
import { QUERY_KEYS, UNIT_TYPE_LABELS } from "../../../constants";
import { formatCurrency } from "../../../utils/format";
import type { Booking, Building, Project, Unit } from "../../../types";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: Unit;
  building: Building;
  project: Project;
  onBooked: (booking: Booking) => void;
}

type Step = "select-lead" | "review";

export function BookingModal({ isOpen, onClose, unit, building, project, onBooked }: BookingModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("select-lead");
  const [search, setSearch] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  const leadsQuery = useQuery({
    queryKey: ["bookingLeadSearch", search],
    queryFn: () => fetchLeads({ search: search || undefined, limit: 8, page: 1 }),
    enabled: isOpen && step === "select-lead",
  });

  const selectedLead = useMemo(
    () => leadsQuery.data?.items.find((l) => l.id === selectedLeadId) ?? null,
    [leadsQuery.data, selectedLeadId],
  );

  const bookingMutation = useMutation({
    mutationFn: () => createBooking({ lead_id: selectedLeadId as number, unit_id: unit.id }),
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unit(unit.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.units(building.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookings });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardSummary });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lead(booking.lead_id) });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      onBooked(booking);
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setConflictMessage(extractErrorMessage(err));
        // The backend is authoritative: refresh unit state so the UI never
        // trusts a stale "available" status after a lost race.
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unit(unit.id) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.units(building.id) });
      } else {
        setConflictMessage(extractErrorMessage(err, "Unable to complete this booking. Please try again."));
      }
    },
  });

  const reset = () => {
    setStep("select-lead");
    setSearch("");
    setSelectedLeadId(null);
    setConflictMessage(null);
    bookingMutation.reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Book Unit" widthClassName="max-w-lg">
      {conflictMessage ? (
        <div>
          <div role="alert" className="rounded-md border border-rust/30 bg-rust-light px-4 py-3 text-sm text-rust">
            <p className="font-medium">This unit is no longer available.</p>
            <p className="mt-1">{conflictMessage}</p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      ) : step === "select-lead" ? (
        <div>
          <p className="mb-3 text-sm text-ink-soft">
            Booking <span className="font-medium text-ink">{unit.unit_number}</span> in {building.name},{" "}
            {project.name}.
          </p>
          <Input
            placeholder="Search leads by name, phone, or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search leads"
          />
          <div className="mt-3 max-h-64 overflow-y-auto rounded-md border border-border">
            {leadsQuery.isLoading ? (
              <div className="animate-pulse divide-y divide-border">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex w-full items-center justify-between px-3 py-3">
                    <div className="flex w-full items-center space-x-2">
                      <div className="h-4 w-32 rounded bg-slate-200"></div>
                      <div className="h-4 w-24 rounded bg-slate-100"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : leadsQuery.data && leadsQuery.data.items.length > 0 ? (
              <ul className="divide-y divide-border">
                {leadsQuery.data.items.map((lead) => (
                  <li key={lead.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-canvas ${
                        selectedLeadId === lead.id ? "bg-brick-light" : ""
                      }`}
                    >
                      <span>
                        <span className="font-medium text-ink">{lead.name}</span>
                        <span className="ml-2 text-ink-soft">{lead.phone}</span>
                      </span>
                      {selectedLeadId === lead.id && <span className="text-brick">✓</span>}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-3 text-sm text-ink-soft">No leads found.</p>
            )}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button disabled={!selectedLeadId} onClick={() => setStep("review")}>
              Continue
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-ink-soft">Lead</dt>
            <dd className="text-right font-medium text-ink">{selectedLead?.name}</dd>
            <dt className="text-ink-soft">Unit</dt>
            <dd className="text-right font-medium text-ink">{unit.unit_number}</dd>
            <dt className="text-ink-soft">Project</dt>
            <dd className="text-right font-medium text-ink">{project.name}</dd>
            <dt className="text-ink-soft">Building</dt>
            <dd className="text-right font-medium text-ink">{building.name}</dd>
            <dt className="text-ink-soft">Type</dt>
            <dd className="text-right font-medium text-ink">{UNIT_TYPE_LABELS[unit.unit_type]}</dd>
            <dt className="text-ink-soft">Price</dt>
            <dd className="text-right font-medium text-ink">{formatCurrency(unit.price)}</dd>
            <dt className="text-ink-soft">Sales Employee</dt>
            <dd className="text-right font-medium text-ink">{user?.name}</dd>
          </dl>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setStep("select-lead")} disabled={bookingMutation.isPending}>
              Back
            </Button>
            <Button onClick={() => bookingMutation.mutate()} isLoading={bookingMutation.isPending}>
              Confirm Booking
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
