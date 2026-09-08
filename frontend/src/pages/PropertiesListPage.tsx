import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePageTitle } from "../app/providers/PageTitleProvider";
import { useAuth } from "../app/providers/AuthProvider";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { CardSkeleton, EmptyState, ErrorState } from "../components/feedback/States";
import { useToast } from "../components/feedback/ToastProvider";
import { ProjectCard } from "../features/properties/components/ProjectCard";
import { CreateProjectForm } from "../features/properties/components/CreateProjectForm";
import { createProject, fetchProjects } from "../features/properties/api/propertiesApi";
import { extractErrorMessage } from "../services/apiClient";
import { QUERY_KEYS } from "../constants";

export default function PropertiesListPage() {
  usePageTitle("Properties");
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectsQuery = useQuery({ queryKey: QUERY_KEYS.projects, queryFn: fetchProjects });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
      showToast("Project created successfully.");
      setIsCreateOpen(false);
    },
    onError: (err) => setError(extractErrorMessage(err, "Unable to create project.")),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-medium text-ink">Properties</h2>
          <p className="mt-1 text-sm text-ink-soft">Browse projects, buildings, and units.</p>
        </div>
        {isAdmin && <Button onClick={() => setIsCreateOpen(true)}>+ New Project</Button>}
      </div>

      {projectsQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : projectsQuery.isError ? (
        <ErrorState title="Unable to load properties." onRetry={() => projectsQuery.refetch()} />
      ) : projectsQuery.data && projectsQuery.data.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projectsQuery.data.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No projects found."
          description={isAdmin ? "Create your first project to get started." : "Check back once projects are added."}
          action={isAdmin ? <Button onClick={() => setIsCreateOpen(true)}>New Project</Button> : undefined}
        />
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Project">
        {error && (
          <div role="alert" className="mb-4 rounded-md border border-rust/30 bg-rust-light px-3 py-2 text-sm text-rust">
            {error}
          </div>
        )}
        <CreateProjectForm
          isSubmitting={createMutation.isPending}
          onSubmit={(values) => {
            setError(null);
            createMutation.mutate(values);
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}
