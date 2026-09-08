import { apiClient } from "../../../services/apiClient";
import type { Booking } from "../../../types";

export async function fetchBookings(): Promise<Booking[]> {
  const { data } = await apiClient.get<Booking[]>("/api/bookings");
  return data;
}

export async function createBooking(input: { lead_id: number; unit_id: number }): Promise<Booking> {
  const { data } = await apiClient.post<Booking>("/api/bookings", input);
  return data;
}
