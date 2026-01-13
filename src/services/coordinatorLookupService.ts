import { api } from "../api/api";

export type UserOption = {
  id: number;
  fullName: string;
  username: string;
  email: string;
};

export async function listTutorsForCoordinator(): Promise<UserOption[]> {
  const res = await api.get<any[]>("/coordinator/tutors");

  // la respuesta viene como UserResponse[], pero aquí lo convertimos a UserOption
  return (res.data ?? []).map((u) => ({
    id: u.id,
    fullName: u.fullName,
    username: u.username,
    email: u.email,
  }));
}
