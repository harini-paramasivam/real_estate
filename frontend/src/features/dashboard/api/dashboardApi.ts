import { apiClient } from "../../../services/apiClient";
import type { DashboardSummary, FollowUpItem, RecentBookingItem } from "../../../types";

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await apiClient.get<DashboardSummary>("/api/dashboard/summary");
  return data;
}

export async function fetchFollowUps(): Promise<FollowUpItem[]> {
  const { data } = await apiClient.get<FollowUpItem[]>("/api/dashboard/follow-ups");
  return data;
}

export async function fetchRecentBookings(): Promise<RecentBookingItem[]> {
  const { data } = await apiClient.get<RecentBookingItem[]>("/api/dashboard/recent-bookings");
  return data;
}
