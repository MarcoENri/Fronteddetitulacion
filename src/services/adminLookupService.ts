import { api } from "../api/api";

export type CareerOption = { id: number; name: string };
export type UserOption = { id: number; fullName: string; username: string; email: string };

export async function listCareers(): Promise<CareerOption[]> {
  const res = await api.get<CareerOption[]>("/admin/careers");
  return res.data;
}

export async function listUsersByRole(role: "ROLE_COORDINATOR" | "ROLE_TUTOR"): Promise<UserOption[]> {
  const res = await api.get<UserOption[]>(`/admin/users`, { params: { role } });
  return res.data;
}
