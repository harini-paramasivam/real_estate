import { Link } from "react-router-dom";
import { Card, CardBody } from "../../../components/ui/Card";
import type { Project } from "../../../types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="flex flex-col">
      <CardBody className="flex flex-1 flex-col">
        <h3 className="font-display text-lg font-medium text-ink">{project.name}</h3>
        <p className="mt-0.5 text-sm text-ink-soft">{project.location}</p>
        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <p className="font-medium text-ink">{project.building_count}</p>
            <p className="text-ink-soft">Buildings</p>
          </div>
          <div>
            <p className="font-medium text-ink">{project.unit_count}</p>
            <p className="text-ink-soft">Units</p>
          </div>
        </div>
        <div className="mt-4 flex-1" />
        <Link
          to={`/properties/${project.id}`}
          className="mt-4 inline-flex w-fit items-center text-sm font-medium text-brick hover:underline"
        >
          View Project
        </Link>
      </CardBody>
    </Card>
  );
}
