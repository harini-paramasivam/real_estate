import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePageTitle } from "../app/providers/PageTitleProvider";
import { useAuth } from "../app/providers/AuthProvider";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { EmptyState, ErrorState, TableSkeleton } from "../components/feedback/States";
import { Pagination } from "../components/tables/Pagination";
import { useToast } from "../components/feedback/ToastProvider";
import { LeadFiltersBar } from "../features/leads/components/LeadFiltersBar";
import { LeadTable } from "../features/leads/components/LeadTable";
import { LeadForm, type LeadFormValues } from "../features/leads/components/LeadForm";
import { createLead, fetchLeads, type LeadFilters } from "../features/leads/api/leadsApi";
import { fetchUsers } from "../features/users/api/usersApi";
import { extractErrorMessage } from "../services/apiClient";
import { QUERY_KEYS } from "../constants";

const PAGE_SIZE = 10;

export default function LeadsListPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  usePageTitle(isAdmin ? "Leads" : "My Leads");

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [filters, setFilters] = useState<LeadFilters>({ page: 1, limit: PAGE_SIZE });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const leadsQuery = useQuery({
    queryKey: QUERY_KEYS.leads(filters),
    queryFn: () => fetchLeads(filters),
  });

  const usersQuery = useQuery({ queryKey: QUERY_KEYS.users, queryFn: fetchUsers, enabled: isAdmin });
  const employees = useMemo(
    () => (usersQuery.data ?? []).filter((u) => u.role === "SALES_EMPLOYEE"),
    [usersQuery.data],
  );

  const createMutation = useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardSummary });
      showToast("Lead created successfully.");
      setIsCreateOpen(false);
    },
    onError: (err) => setCreateError(extractErrorMessage(err, "Unable to create lead.")),
  });

  const handleCreate = (values: LeadFormValues) => {
    setCreateError(null);
    createMutation.mutate({
      name: values.name,
      phone: values.phone,
      email: values.email || null,
      source: values.source,
      assigned_to: isAdmin ? values.assigned_to ?? null : undefined,
      next_follow_up: values.next_follow_up || null,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-medium text-ink">{isAdmin ? "Leads" : "My Leads"}</h2>
          <p className="mt-1 text-sm text-ink-soft">Manage and track your sales opportunities.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>+ Create Lead</Button>
      </div>

      <Card>
        <div className="border-b border-border p-4">
          <LeadFiltersBar
            filters={filters}
            onChange={setFilters}
            employees={employees}
            showAssigneeFilter={isAdmin}
          />
        </div>

        {leadsQuery.isLoading ? (
          <TableSkeleton />
        ) : leadsQuery.isError ? (
          <ErrorState title="Unable to load leads." onRetry={() => leadsQuery.refetch()} />
        ) : leadsQuery.data && leadsQuery.data.items.length > 0 ? (
          <>
            <LeadTable leads={leadsQuery.data.items} />
            <Pagination
              page={filters.page ?? 1}
              limit={PAGE_SIZE}
              total={leadsQuery.data.total}
              onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
            />
          </>
        ) : (
          <EmptyState
            title="No leads found."
            description="Try changing your filters or create your first lead."
            action={<Button onClick={() => setIsCreateOpen(true)}>Create Lead</Button>}
          />
        )}
      </Card>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Lead">
        {createError && (
          <div role="alert" className="mb-4 rounded-md border border-rust/30 bg-rust-light px-3 py-2 text-sm text-rust">
            {createError}
          </div>
        )}
        <LeadForm
          employees={employees}
          isAdmin={isAdmin}
          isSubmitting={createMutation.isPending}
          submitLabel="Create Lead"
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}
