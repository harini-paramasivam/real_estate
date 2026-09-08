import { apiClient } from "../../../services/apiClient";
import type {
  Lead,
  LeadCreateInput,
  LeadListResponse,
  LeadNote,
  LeadUpdateInput,
} from "../../../types";

export interface LeadFilters {
  search?: string;
  stage?: string;
  assigned_to?: number;
  follow_up?: "overdue" | "today" | "upcoming";
  page?: number;
  limit?: number;
}

export async function fetchLeads(filters: LeadFilters): Promise<LeadListResponse> {
  const { data } = await apiClient.get<LeadListResponse>("/api/leads", { params: filters });
  return data;
}

export async function fetchLead(id: number): Promise<Lead> {
  const { data } = await apiClient.get<Lead>(`/api/leads/${id}`);
  return data;
}

export async function createLead(input: LeadCreateInput): Promise<Lead> {
  const { data } = await apiClient.post<Lead>("/api/leads", input);
  return data;
}

export async function updateLead(id: number, input: LeadUpdateInput): Promise<Lead> {
  const { data } = await apiClient.put<Lead>(`/api/leads/${id}`, input);
  return data;
}

export async function deleteLead(id: number): Promise<void> {
  await apiClient.delete(`/api/leads/${id}`);
}

export async function fetchLeadNotes(leadId: number): Promise<LeadNote[]> {
  const { data } = await apiClient.get<LeadNote[]>(`/api/leads/${leadId}/notes`);
  return data;
}

export async function addLeadNote(leadId: number, content: string): Promise<LeadNote> {
  const { data } = await apiClient.post<LeadNote>(`/api/leads/${leadId}/notes`, { content });
  return data;
}
