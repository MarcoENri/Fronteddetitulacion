import { api } from "../api/api";

// -------------------- CREATE --------------------
export type CreateUserRequest = {
  username: string;
  password: string;
  fullName: string;
  email: string;
  roles: Array<"ADMIN" | "COORDINATOR" | "TUTOR">;
};

export type UserResponse = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  enabled: boolean;
  roles: string[];
};

export async function createUser(req: CreateUserRequest): Promise<UserResponse> {
  const res = await api.post<UserResponse>("/admin/users", req);
  return res.data;
}

// -------------------- LIST --------------------
export async function listUsers(role?: string): Promise<UserResponse[]> {
  const res = await api.get<UserResponse[]>("/admin/users", {
    params: role ? { role } : undefined,
  });
  return res.data;
}

export async function listUsersByRole(role: "COORDINATOR" | "TUTOR"): Promise<UserResponse[]> {
  return listUsers(role);
}
