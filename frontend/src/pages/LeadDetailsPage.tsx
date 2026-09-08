import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePageTitle } from "../app/providers/PageTitleProvider";
import { useAuth } from "../app/providers/AuthProvider";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { ErrorState } from "../components/feedback/States";
import { useToast } from "../components/feedback/ToastProvider";
import { LeadStageBadge } from "../features/leads/components/LeadStageBadge";
import { LeadStageProgress } from "../features/leads/components/LeadStageProgress";
import { LeadForm, type LeadFormValues } from "../features/leads/components/LeadForm";
import { LeadNotes } from "../features/leads/components/LeadNotes";
import {
  addLeadNote,
  fetchLead,
  fetchLeadNotes,
  updateLead,
} from "../features/leads/api/leadsApi";
import { fetchUsers } from "../features/users/api/usersApi";
import { extractErrorMessage } from "../services/apiClient";
import { QUERY_KEYS, LEAD_SOURCE_LABELS } from "../constants";
import { formatDate } from "../utils/format";

export default function LeadDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const leadId = Number(id);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isEditOpen, setIsEditOpen] = useState(searchParams.get("edit") === "1");
  const [editError, setEditError] = useState<string | null>(null);

  const leadQuery = useQuery({ queryKey: QUERY_KEYS.lead(leadId), queryFn: () => fetchLead(leadId) });
  const notesQuery = useQuery({ queryKey: QUERY_KEYS.leadNotes(leadId), queryFn: () => fetchLeadNotes(leadId) });
  const usersQuery = useQuery({ queryKey: QUERY_KEYS.users, queryFn: fetchUsers, enabled: isAdmin });
  const employees = useMemo(
    () => (usersQuery.data ?? []).filter((u) => u.role === "SALES_EMPLOYEE"),
    [usersQuery.data],
  );

  usePageTitle(leadQuery.data ? leadQuery.data.name : "Lead Details");

  const updateMutation = useMutation({
    mutationFn: (values: LeadFormValues) =>
      updateLead(leadId, {
        name: values.name,
        phone: values.phone,
        email: values.email || null,
        source: values.source,
        stage: values.stage,
        assigned_to: isAdmin ? values.assigned_to ?? null : undefined,
        next_follow_up: values.next_follow_up || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lead(leadId) });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardSummary });
      showToast("Lead updated successfully.");
      closeEdit();
    },
    onError: (err) => setEditError(extractErrorMessage(err, "Unable to update lead.")),
  });

  const noteMutation = useMutation({
    mutationFn: (content: string) => addLeadNote(leadId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leadNotes(leadId) });
      showToast("Note added.");
    },
    onError: (err) => showToast(extractErrorMessage(err, "Unable to add note."), "error"),
  });

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditError(null);
    searchParams.delete("edit");
    setSearchParams(searchParams, { replace: true });
  };

  if (leadQuery.isLoading) {
    return <p className="text-sm text-ink-soft">Loading lead…</p>;
  }

  if (leadQuery.isError || !leadQuery.data) {
    return (
      <ErrorState
        title="Unable to load this lead."
        description="It may not exist, or you may not have access to it."
        onRetry={() => leadQuery.refetch()}
      />
    );
  }

  const lead = leadQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/leads" className="text-sm font-medium text-brick hover:underline">
          ← Back to Leads
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-medium text-ink">{lead.name}</h2>
          <LeadStageBadge stage={lead.stage} />
        </div>
        <Button variant="secondary" onClick={() => setIsEditOpen(true)}>
          Edit Lead
        </Button>
      </div>

      <Card>
        <CardBody>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-soft">Phone</dt>
              <dd className="mt-1 text-sm font-medium text-ink">{lead.phone}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-soft">Email</dt>
              <dd className="mt-1 text-sm font-medium text-ink">{lead.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-soft">Source</dt>
              <dd className="mt-1 text-sm font-medium text-ink">{LEAD_SOURCE_LABELS[lead.source]}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-soft">Assigned Salesperson</dt>
              <dd className="mt-1 text-sm font-medium text-ink">{lead.assigned_to_user?.name ?? "Unassigned"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-soft">Next Follow-up</dt>
              <dd className="mt-1 text-sm font-medium text-ink">{formatDate(lead.next_follow_up)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-soft">Created</dt>
              <dd className="mt-1 text-sm font-medium text-ink">{formatDate(lead.created_at)}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-display text-base font-medium text-ink">Stage Progression</h3>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <LeadStageProgress stage={lead.stage} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-display text-base font-medium text-ink">Activity / Notes</h3>
        </CardHeader>
        <CardBody>
          <LeadNotes
            notes={notesQuery.data ?? []}
            isLoading={notesQuery.isLoading}
            isSubmitting={noteMutation.isPending}
            onAddNote={(content) => noteMutation.mutate(content)}
          />
        </CardBody>
      </Card>

      <Modal isOpen={isEditOpen} onClose={closeEdit} title="Edit Lead">
        {editError && (
          <div role="alert" className="mb-4 rounded-md border border-rust/30 bg-rust-light px-3 py-2 text-sm text-rust">
            {editError}
          </div>
        )}
        <LeadForm
          initialValues={lead}
          employees={employees}
          isAdmin={isAdmin}
          isSubmitting={updateMutation.isPending}
          submitLabel="Save Changes"
          onSubmit={(values) => updateMutation.mutate(values)}
          onCancel={closeEdit}
        />
      </Modal>
    </div>
  );
}
