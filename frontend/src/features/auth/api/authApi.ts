import { apiClient } from "../../../services/apiClient";
import type { User } from "../../../types";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/api/auth/login", { email, password });
  return data;
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>("/api/auth/me");
  return data;
}
