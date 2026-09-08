import { apiClient } from "../../../services/apiClient";
import type { Building, Project, ProjectDetail, Unit } from "../../../types";

export async function fetchProjects(): Promise<Project[]> {
  const { data } = await apiClient.get<Project[]>("/api/projects");
  return data;
}

export async function fetchProject(id: number): Promise<ProjectDetail> {
  const { data } = await apiClient.get<ProjectDetail>(`/api/projects/${id}`);
  return data;
}

export async function createProject(input: { name: string; location: string; description?: string }): Promise<Project> {
  const { data } = await apiClient.post<Project>("/api/projects", input);
  return data;
}

export async function createBuilding(
  projectId: number,
  input: { name: string; description?: string },
): Promise<Building> {
  const { data } = await apiClient.post<Building>(`/api/projects/${projectId}/buildings`, input);
  return data;
}

export async function fetchUnits(buildingId: number): Promise<Unit[]> {
  const { data } = await apiClient.get<Unit[]>(`/api/buildings/${buildingId}/units`);
  return data;
}

export async function fetchUnit(unitId: number): Promise<Unit> {
  const { data } = await apiClient.get<Unit>(`/api/units/${unitId}`);
  return data;
}

export async function createUnit(
  buildingId: number,
  input: { unit_number: string; unit_type: string; price: string },
): Promise<Unit> {
  const { data } = await apiClient.post<Unit>(`/api/buildings/${buildingId}/units`, input);
  return data;
}
