import { apiClient } from "../../../services/apiClient";
import type { User } from "../../../types";

export async function fetchUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>("/api/users");
  return data;
}
