import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePageTitle } from "../app/providers/PageTitleProvider";
import { useAuth } from "../app/providers/AuthProvider";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { ErrorState } from "../components/feedback/States";
import { useToast } from "../components/feedback/ToastProvider";
import { UnitTable } from "../features/properties/components/UnitTable";
import { CreateBuildingForm } from "../features/properties/components/CreateBuildingForm";
import { CreateUnitForm } from "../features/properties/components/CreateUnitForm";
import { BookingModal } from "../features/bookings/components/BookingModal";
import { BookingSuccessModal } from "../features/bookings/components/BookingSuccessModal";
import { createBuilding, createUnit, fetchProject, fetchUnits } from "../features/properties/api/propertiesApi";
import { extractErrorMessage } from "../services/apiClient";
import { QUERY_KEYS } from "../constants";
import type { Booking, Building, Unit } from "../types";

function BuildingUnits({
  projectId,
  building,
  canBook,
  isAdmin,
  onBook,
}: {
  projectId: number;
  building: Building;
  canBook: boolean;
  isAdmin: boolean;
  onBook: (unit: Unit, building: Building) => void;
}) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unitsQuery = useQuery({ queryKey: QUERY_KEYS.units(building.id), queryFn: () => fetchUnits(building.id) });

  const createUnitMutation = useMutation({
    mutationFn: (values: { unit_number: string; unit_type: string; price: string }) =>
      createUnit(building.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.units(building.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project(projectId) });
      showToast("Unit added successfully.");
      setIsAddUnitOpen(false);
    },
    onError: (err) => setError(extractErrorMessage(err, "Unable to add unit.")),
  });

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-medium text-ink">{building.name}</h3>
          {building.description && <p className="text-sm text-ink-soft">{building.description}</p>}
        </div>
        {isAdmin && (
          <Button size="sm" variant="secondary" onClick={() => setIsAddUnitOpen(true)}>
            + Add Unit
          </Button>
        )}
      </CardHeader>
      <CardBody className="p-0">
        {unitsQuery.isLoading ? (
          <p className="p-5 text-sm text-ink-soft">Loading units…</p>
        ) : unitsQuery.isError ? (
          <ErrorState onRetry={() => unitsQuery.refetch()} />
        ) : unitsQuery.data && unitsQuery.data.length > 0 ? (
          <UnitTable units={unitsQuery.data} canBook={canBook} onBook={(unit) => onBook(unit, building)} />
        ) : (
          <p className="p-5 text-sm text-ink-soft">No units in this building yet.</p>
        )}
      </CardBody>

      <Modal isOpen={isAddUnitOpen} onClose={() => setIsAddUnitOpen(false)} title={`Add Unit to ${building.name}`}>
        {error && (
          <div role="alert" className="mb-4 rounded-md border border-rust/30 bg-rust-light px-3 py-2 text-sm text-rust">
            {error}
          </div>
        )}
        <CreateUnitForm
          isSubmitting={createUnitMutation.isPending}
          onSubmit={(values) => {
            setError(null);
            createUnitMutation.mutate(values);
          }}
          onCancel={() => setIsAddUnitOpen(false)}
        />
      </Modal>
    </Card>
  );
}

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isAddBuildingOpen, setIsAddBuildingOpen] = useState(false);
  const [buildingError, setBuildingError] = useState<string | null>(null);
  const [bookingTarget, setBookingTarget] = useState<{ unit: Unit; building: Building } | null>(null);
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);

  const projectQuery = useQuery({ queryKey: QUERY_KEYS.project(projectId), queryFn: () => fetchProject(projectId) });
  usePageTitle(projectQuery.data ? projectQuery.data.name : "Project Details");

  const createBuildingMutation = useMutation({
    mutationFn: (values: { name: string; description?: string }) => createBuilding(projectId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project(projectId) });
      showToast("Building added successfully.");
      setIsAddBuildingOpen(false);
    },
    onError: (err) => setBuildingError(extractErrorMessage(err, "Unable to add building.")),
  });

  if (projectQuery.isLoading) {
    return <p className="text-sm text-ink-soft">Loading project…</p>;
  }

  if (projectQuery.isError || !projectQuery.data) {
    return <ErrorState title="Unable to load this project." onRetry={() => projectQuery.refetch()} />;
  }

  const project = projectQuery.data;

  return (
    <div className="space-y-6">
      <Link to="/properties" className="text-sm font-medium text-brick hover:underline">
        ← Back to Properties
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-medium text-ink">{project.name}</h2>
          <p className="mt-1 text-sm text-ink-soft">{project.location}</p>
          {project.description && <p className="mt-1 max-w-2xl text-sm text-ink-soft">{project.description}</p>}
        </div>
        {isAdmin && <Button onClick={() => setIsAddBuildingOpen(true)}>+ Add Building</Button>}
      </div>

      <div className="space-y-4">
        {project.buildings.length === 0 ? (
          <p className="text-sm text-ink-soft">No buildings added to this project yet.</p>
        ) : (
          project.buildings.map((building) => (
            <BuildingUnits
              key={building.id}
              projectId={projectId}
              building={building}
              canBook={!isAdmin}
              isAdmin={isAdmin}
              onBook={(unit, building) => setBookingTarget({ unit, building })}
            />
          ))
        )}
      </div>

      <Modal isOpen={isAddBuildingOpen} onClose={() => setIsAddBuildingOpen(false)} title="Add Building">
        {buildingError && (
          <div role="alert" className="mb-4 rounded-md border border-rust/30 bg-rust-light px-3 py-2 text-sm text-rust">
            {buildingError}
          </div>
        )}
        <CreateBuildingForm
          isSubmitting={createBuildingMutation.isPending}
          onSubmit={(values) => {
            setBuildingError(null);
            createBuildingMutation.mutate(values);
          }}
          onCancel={() => setIsAddBuildingOpen(false)}
        />
      </Modal>

      {bookingTarget && (
        <BookingModal
          isOpen={!!bookingTarget}
          onClose={() => setBookingTarget(null)}
          unit={bookingTarget.unit}
          building={bookingTarget.building}
          project={project}
          onBooked={(booking) => {
            setBookingTarget(null);
            setSuccessBooking(booking);
          }}
        />
      )}

      <BookingSuccessModal booking={successBooking} onClose={() => setSuccessBooking(null)} />
    </div>
  );
}
